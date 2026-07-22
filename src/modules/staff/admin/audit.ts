import { AuthorizationError } from "@/modules/auth/authorization";
import type { PortalSession, StaffRole } from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";
import type { AuditListQuery, AuditModule } from "./schemas";
import { auditModules } from "./schemas";

const moduleTargetTypes = {
  admissions: [
    "application",
    "consent_record",
    "duplicate_candidate",
    "follow_up_task",
    "lead",
    "lead_activity",
    "visit_request",
  ],
  content: ["announcement", "announcement_target", "document_share"],
  governance: ["audit_event", "profile_update_request"],
  identity: ["role", "role_assignment", "session", "user"],
  notifications: ["message", "message_thread", "notification_intent", "outbox_job"],
  reporting: ["report", "report_export"],
  student_operations: [
    "attendance",
    "attendance_daily",
    "document",
    "enrollment",
    "guardian",
    "student",
  ],
} as const satisfies Record<AuditModule, readonly string[]>;

const roleModuleAllowlist: Partial<Record<StaffRole, readonly AuditModule[]>> = {
  admissions_family_liaison: ["admissions", "notifications"],
  content_publisher_translator: ["content", "notifications"],
  marketing_outreach: ["content", "reporting"],
  office_attendance: ["student_operations", "notifications"],
};

export type AuditAccess =
  | { kind: "global"; modules: readonly AuditModule[] }
  | { kind: "module"; modules: readonly AuditModule[] };

type AuditRow = {
  action: string;
  actorAudience: "guardian" | "staff" | "system";
  actorDisplayName: string | null;
  actorUserId: string | null;
  changedFields: string;
  correlationId: string;
  createdAt: string;
  id: string;
  outcome: "denied" | "failed" | "success";
  targetId: string;
  targetType: string;
};

export function getAuditAccess(session: PortalSession | null): AuditAccess {
  if (!session) throw new AuthorizationError("UNAUTHENTICATED", 401);
  if (session.audience !== "staff" || session.role === null) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }
  if (session.permissions.includes("audit.view")) {
    return { kind: "global", modules: auditModules };
  }
  if (!session.permissions.includes("audit.view_module")) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }
  const modules = roleModuleAllowlist[session.role];
  if (!modules || modules.length === 0) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }
  return { kind: "module", modules };
}

function moduleForTargetType(targetType: string): AuditModule {
  for (const moduleKey of auditModules) {
    if ((moduleTargetTypes[moduleKey] as readonly string[]).includes(targetType)) return moduleKey;
  }
  return "governance";
}

function safeChangedFields(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (field): field is string =>
          typeof field === "string" && /^[a-z][a-z0-9_.]{0,79}$/.test(field),
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}

function projectAuditRow(row: AuditRow) {
  return {
    action: row.action,
    actor: {
      audience: row.actorAudience,
      displayName: row.actorDisplayName,
      userId: row.actorUserId,
    },
    changedFields: safeChangedFields(row.changedFields),
    correlationId: row.correlationId,
    createdAt: row.createdAt,
    id: row.id,
    module: moduleForTargetType(row.targetType),
    outcome: row.outcome,
    target: { id: row.targetId, type: row.targetType },
  };
}

function scopedModules(access: AuditAccess, requested?: AuditModule): readonly AuditModule[] {
  if (requested && !access.modules.includes(requested)) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }
  return requested ? [requested] : access.modules;
}

function addModuleScope(
  conditions: string[],
  bindings: unknown[],
  access: AuditAccess,
  requested?: AuditModule,
) {
  const modules = scopedModules(access, requested);
  if (access.kind === "global" && !requested) return;
  const targetTypes = modules.flatMap((moduleKey) => [...moduleTargetTypes[moduleKey]]);
  conditions.push(`audit_events.target_type IN (${targetTypes.map(() => "?").join(", ")})`);
  bindings.push(...targetTypes);
}

const auditProjection = `SELECT
  audit_events.id,
  audit_events.actor_user_id AS actorUserId,
  audit_events.actor_audience AS actorAudience,
  actors.display_name AS actorDisplayName,
  audit_events.action,
  audit_events.target_type AS targetType,
  audit_events.target_id AS targetId,
  audit_events.correlation_id AS correlationId,
  audit_events.outcome,
  audit_events.changed_fields AS changedFields,
  audit_events.created_at AS createdAt
FROM audit_events
LEFT JOIN users AS actors ON actors.id = audit_events.actor_user_id`;

export async function listAuditEvents(
  database: D1Database,
  session: PortalSession | null,
  filters: AuditListQuery,
) {
  const access = getAuditAccess(session);
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  addModuleScope(conditions, bindings, access, filters.module);
  if (filters.action) {
    conditions.push("audit_events.action = ?");
    bindings.push(filters.action);
  }
  if (filters.outcome) {
    conditions.push("audit_events.outcome = ?");
    bindings.push(filters.outcome);
  }
  if (filters.from) {
    conditions.push("audit_events.created_at >= ?");
    bindings.push(filters.from);
  }
  if (filters.to) {
    conditions.push("audit_events.created_at <= ?");
    bindings.push(filters.to);
  }

  const result = await database
    .prepare(
      `${auditProjection}
       ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY audit_events.created_at DESC, audit_events.id DESC
       LIMIT ?`,
    )
    .bind(...bindings, filters.limit)
    .all<AuditRow>();
  return { access, events: result.results.map(projectAuditRow), scope: access };
}

export async function getAuditEvent(
  database: D1Database,
  session: PortalSession | null,
  auditId: string,
) {
  const access = getAuditAccess(session);
  const conditions = ["audit_events.id = ?"];
  const bindings: unknown[] = [auditId];
  addModuleScope(conditions, bindings, access);
  const row = await database
    .prepare(`${auditProjection} WHERE ${conditions.join(" AND ")} LIMIT 1`)
    .bind(...bindings)
    .first<AuditRow>();
  if (!row) throw new StaffApiError(404, "NOT_FOUND", "Audit event not found.");
  return { event: projectAuditRow(row), scope: access };
}
