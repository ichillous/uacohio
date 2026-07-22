import { StaffApiError } from "../shared/api";
import {
  isAllowedLeadTransition,
  leadStages,
  type CreateActivityInput,
  type CreateFollowUpInput,
  type FlagDuplicateInput,
  type LeadStage,
  type ReviewDuplicateInput,
  type TransitionLeadInput,
} from "./stages";

export type LeadSummary = {
  campaign: string | null;
  duplicateCount: number;
  dueAt: string | null;
  familyId: string;
  firstName: string;
  gradeInterest: string;
  id: string;
  lastActivityAt: string | null;
  lastName: string | null;
  openFollowUps: number;
  ownerName: string | null;
  pendingDuplicates: ReadonlyArray<{ candidateLeadId: string; id: string; signals: string[] }>;
  preferredLocale: "ar" | "en" | "so";
  source: string;
  stage: LeadStage;
  updatedAt: string;
  version: number;
};

type MutationContext = {
  actorUserId: string;
  id?: () => string;
  now?: string;
};

type LeadState = { id: string; stage: LeadStage; version: number };

function mutationValues(context: MutationContext) {
  return {
    id: context.id ?? (() => crypto.randomUUID()),
    now: context.now ?? new Date().toISOString(),
  };
}

function changes(result: D1Result<unknown> | undefined): number {
  return Number((result?.meta as { changes?: number } | undefined)?.changes ?? 0);
}

function isDuplicatePairConstraint(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /unique constraint failed/i.test(message) &&
    /duplicate_candidates|canonical_pair/i.test(message)
  );
}

async function requireLead(database: D1Database, leadId: string): Promise<LeadState> {
  const lead = await database
    .prepare("SELECT id, stage, version FROM leads WHERE id = ? LIMIT 1")
    .bind(leadId)
    .first<LeadState>();

  if (!lead || !leadStages.includes(lead.stage)) {
    throw new StaffApiError(404, "NOT_FOUND", "Lead not found.");
  }
  return lead;
}

export async function listLeads(
  database: D1Database,
  filters: { limit: number; q?: string; stage?: LeadStage },
  projection: { includeDuplicateDetails?: boolean } = {},
): Promise<LeadSummary[]> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (filters.stage) {
    conditions.push("leads.stage = ?");
    bindings.push(filters.stage);
  }
  if (filters.q) {
    conditions.push(
      "(prospective_students.first_name LIKE ? OR prospective_students.last_name LIKE ? OR leads.id LIKE ?)",
    );
    const search = `%${filters.q}%`;
    bindings.push(search, search, search);
  }

  const duplicateDetailsProjection = projection.includeDuplicateDetails
    ? `,(SELECT COALESCE(
         json_group_array(json_object(
           'id', duplicate_candidates.id,
           'candidateLeadId', CASE
             WHEN duplicate_candidates.lead_id = leads.id THEN duplicate_candidates.candidate_lead_id
             ELSE duplicate_candidates.lead_id
           END,
           'signals', json(duplicate_candidates.signals)
         )),
         '[]'
       )
       FROM duplicate_candidates
       WHERE (lead_id = leads.id OR candidate_lead_id = leads.id) AND state = 'pending'
     ) AS pendingDuplicatesJson`
    : "";

  const statement = database.prepare(
    `SELECT
       leads.id,
       leads.family_id AS familyId,
       prospective_students.first_name AS firstName,
       prospective_students.last_name AS lastName,
       prospective_students.grade_interest AS gradeInterest,
       leads.stage,
       leads.source,
       leads.campaign,
       leads.preferred_locale AS preferredLocale,
       leads.due_at AS dueAt,
       leads.version,
       leads.updated_at AS updatedAt,
       owners.display_name AS ownerName,
       (SELECT MAX(created_at) FROM lead_activities WHERE lead_id = leads.id) AS lastActivityAt,
       (SELECT COUNT(*) FROM follow_up_tasks WHERE lead_id = leads.id AND completed_at IS NULL) AS openFollowUps,
       (SELECT COUNT(*) FROM duplicate_candidates
         WHERE (lead_id = leads.id OR candidate_lead_id = leads.id) AND state = 'pending') AS duplicateCount
       ${duplicateDetailsProjection}
     FROM leads
     INNER JOIN prospective_students ON prospective_students.id = leads.prospective_student_id
     LEFT JOIN users AS owners ON owners.id = leads.owner_user_id
     ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY
       CASE leads.stage
         WHEN 'inquiry' THEN 1 WHEN 'contacted' THEN 2 WHEN 'toured' THEN 3
         WHEN 'applied' THEN 4 WHEN 'enrolled' THEN 5 ELSE 6
       END,
       COALESCE(leads.due_at, leads.updated_at) ASC,
       leads.id ASC
     LIMIT ?`,
  );
  const result = await statement
    .bind(...bindings, filters.limit)
    .all<Omit<LeadSummary, "pendingDuplicates"> & { pendingDuplicatesJson?: string }>();
  return result.results.map(({ pendingDuplicatesJson, ...lead }) => ({
    ...lead,
    duplicateCount: Number(lead.duplicateCount),
    openFollowUps: Number(lead.openFollowUps),
    pendingDuplicates: projection.includeDuplicateDetails
      ? (JSON.parse(pendingDuplicatesJson ?? "[]") as LeadSummary["pendingDuplicates"])
      : [],
    version: Number(lead.version),
  }));
}

export async function transitionLead(
  database: D1Database,
  leadId: string,
  input: TransitionLeadInput,
  context: MutationContext,
): Promise<LeadState> {
  const lead = await requireLead(database, leadId);
  if (lead.version !== input.version) {
    throw new StaffApiError(409, "VERSION_CONFLICT", "This lead changed. Refresh and try again.");
  }
  if (!isAllowedLeadTransition(lead.stage, input.toStage)) {
    throw new StaffApiError(
      422,
      "INVALID_TRANSITION",
      "That stage change is not allowed from the lead's current stage.",
    );
  }

  const { id, now } = mutationValues(context);
  const nextVersion = lead.version + 1;
  const correlationId = id();
  const guard = [leadId, input.toStage, nextVersion] as const;
  const results = await database.batch([
    database
      .prepare(
        `UPDATE leads
         SET stage = ?, version = version + 1, updated_at = ?
         WHERE id = ? AND version = ? AND stage = ?`,
      )
      .bind(input.toStage, now, leadId, lead.version, lead.stage),
    database
      .prepare(
        `INSERT INTO lead_stage_history
           (id, lead_id, from_stage, to_stage, actor_user_id, reason, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?
         WHERE EXISTS (SELECT 1 FROM leads WHERE id = ? AND stage = ? AND version = ?)`,
      )
      .bind(
        id(),
        leadId,
        lead.stage,
        input.toStage,
        context.actorUserId,
        input.reason ?? null,
        now,
        ...guard,
      ),
    database
      .prepare(
        `INSERT INTO lead_activities
           (id, lead_id, type, outcome, safe_note, actor_user_id, created_at)
         SELECT ?, ?, 'stage_transition', ?, ?, ?, ?
         WHERE EXISTS (SELECT 1 FROM leads WHERE id = ? AND stage = ? AND version = ?)`,
      )
      .bind(
        id(),
        leadId,
        `${lead.stage}:${input.toStage}`,
        input.reason ?? "Stage updated",
        context.actorUserId,
        now,
        ...guard,
      ),
    database
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_audience, action, target_type, target_id,
            correlation_id, outcome, changed_fields, created_at)
         SELECT ?, ?, 'staff', 'lead.stage.updated', 'lead', ?, ?, 'success', ?, ?
         WHERE EXISTS (SELECT 1 FROM leads WHERE id = ? AND stage = ? AND version = ?)`,
      )
      .bind(
        id(),
        context.actorUserId,
        leadId,
        correlationId,
        JSON.stringify(["stage", "version"]),
        now,
        ...guard,
      ),
  ]);

  if (changes(results[0]) !== 1) {
    throw new StaffApiError(409, "VERSION_CONFLICT", "This lead changed. Refresh and try again.");
  }

  return { id: leadId, stage: input.toStage, version: nextVersion };
}

export async function createLeadActivity(
  database: D1Database,
  leadId: string,
  input: CreateActivityInput,
  context: MutationContext,
) {
  await requireLead(database, leadId);
  const { id, now } = mutationValues(context);
  const activityId = id();
  const correlationId = id();
  await database.batch([
    database
      .prepare(
        `INSERT INTO lead_activities
           (id, lead_id, type, outcome, safe_note, actor_user_id, next_action_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        activityId,
        leadId,
        input.type,
        input.outcome ?? null,
        input.safeNote,
        context.actorUserId,
        input.nextActionAt ?? null,
        now,
      ),
    database
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_audience, action, target_type, target_id,
            correlation_id, outcome, changed_fields, created_at)
         VALUES (?, ?, 'staff', 'lead.activity.created', 'lead', ?, ?, 'success', ?, ?)`,
      )
      .bind(
        id(),
        context.actorUserId,
        leadId,
        correlationId,
        JSON.stringify(["activity_type", "next_action_at"]),
        now,
      ),
  ]);
  return { createdAt: now, id: activityId };
}

export async function createLeadFollowUp(
  database: D1Database,
  leadId: string,
  input: CreateFollowUpInput,
  context: MutationContext,
) {
  await requireLead(database, leadId);
  const { id, now } = mutationValues(context);
  const taskId = id();
  await database.batch([
    database
      .prepare(
        `INSERT INTO follow_up_tasks (id, lead_id, owner_user_id, due_at, outcome)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(taskId, leadId, context.actorUserId, input.dueAt, input.outcome ?? null),
    database
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_audience, action, target_type, target_id,
            correlation_id, outcome, changed_fields, created_at)
         VALUES (?, ?, 'staff', 'lead.follow_up.created', 'lead', ?, ?, 'success', ?, ?)`,
      )
      .bind(id(), context.actorUserId, leadId, id(), JSON.stringify(["due_at"]), now),
  ]);
  return { dueAt: input.dueAt, id: taskId };
}

export async function flagDuplicateLead(
  database: D1Database,
  leadId: string,
  input: FlagDuplicateInput,
  context: MutationContext,
) {
  if (leadId === input.candidateLeadId) {
    throw new StaffApiError(400, "INVALID_REQUEST", "Select a different lead to compare.");
  }
  await requireLead(database, leadId);
  await requireLead(database, input.candidateLeadId);
  const existing = await database
    .prepare(
      `SELECT id FROM duplicate_candidates
       WHERE (lead_id = ? AND candidate_lead_id = ?)
          OR (lead_id = ? AND candidate_lead_id = ?)
       LIMIT 1`,
    )
    .bind(leadId, input.candidateLeadId, input.candidateLeadId, leadId)
    .first<{ id: string }>();
  if (existing) {
    throw new StaffApiError(409, "VERSION_CONFLICT", "These leads are already under review.");
  }

  const { id, now } = mutationValues(context);
  const duplicateId = id();
  try {
    await database.batch([
      database
        .prepare(
          `INSERT INTO duplicate_candidates (id, lead_id, candidate_lead_id, signals, state)
           VALUES (?, ?, ?, ?, 'pending')`,
        )
        .bind(duplicateId, leadId, input.candidateLeadId, JSON.stringify(input.signals)),
      database
        .prepare(
          `INSERT INTO audit_events
             (id, actor_user_id, actor_audience, action, target_type, target_id,
              correlation_id, outcome, changed_fields, created_at)
           VALUES (?, ?, 'staff', 'lead.duplicate.flagged', 'duplicate_candidate', ?, ?, 'success', ?, ?)`,
        )
        .bind(id(), context.actorUserId, duplicateId, id(), JSON.stringify(["signals"]), now),
    ]);
  } catch (error) {
    if (isDuplicatePairConstraint(error)) {
      throw new StaffApiError(409, "VERSION_CONFLICT", "These leads are already under review.");
    }
    throw error;
  }
  return { id: duplicateId, state: "pending" as const };
}

export async function reviewDuplicateLead(
  database: D1Database,
  leadId: string,
  duplicateId: string,
  input: ReviewDuplicateInput,
  context: MutationContext,
) {
  const { id, now } = mutationValues(context);
  const correlationId = id();
  const results = await database.batch([
    database
      .prepare(
        `UPDATE duplicate_candidates
         SET state = ?, reviewer_user_id = ?, reviewed_at = ?
         WHERE id = ?
           AND (lead_id = ? OR candidate_lead_id = ?)
           AND state = 'pending'`,
      )
      .bind(input.state, context.actorUserId, now, duplicateId, leadId, leadId),
    database
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_audience, action, target_type, target_id,
            correlation_id, outcome, changed_fields, created_at)
         SELECT ?, ?, 'staff', 'lead.duplicate.reviewed', 'duplicate_candidate', ?, ?, 'success', ?, ?
         WHERE changes() = 1`,
      )
      .bind(id(), context.actorUserId, duplicateId, correlationId, JSON.stringify(["state"]), now),
  ]);
  if (changes(results[0]) !== 1) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "This duplicate review was already resolved. Refresh and try again.",
    );
  }
  return { id: duplicateId, state: input.state };
}
