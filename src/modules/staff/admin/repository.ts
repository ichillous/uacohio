import {
  staffPermissions,
  staffRoles,
  type Permission,
  type StaffRole,
} from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";

export type AdminUser = {
  audience: "guardian" | "staff";
  displayName: string;
  email: string | null;
  roleKey: StaffRole | null;
  staffActive: boolean;
  status: "active" | "disabled";
  userId: string;
};

export type AdminRole = {
  description: string;
  key: StaffRole;
  name: string;
  permissions: readonly Permission[];
};

type RoleMutationContext = {
  actorUserId: string;
  id?: () => string;
  now?: string;
};

type TargetRoleRow = {
  audience: "guardian" | "staff";
  assignmentId: string | null;
  displayName: string;
  effectiveStart: string | null;
  roleKey: string | null;
  staffActive: number | null;
  status: "active" | "disabled";
  userId: string;
};

function isStaffRole(value: string | null): value is StaffRole {
  return value !== null && staffRoles.includes(value as StaffRole);
}

function isPermission(value: string | null): value is Permission {
  return value !== null && staffPermissions.includes(value as Permission);
}

function changes(result: D1Result<unknown> | undefined): number {
  return Number((result?.meta as { changes?: number } | undefined)?.changes ?? 0);
}

function previousInstant(instant: string): string {
  const timestamp = new Date(instant).getTime();
  return new Date(timestamp - 1).toISOString();
}

function isRoleMutationConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /last active system administrator|role assignments require an active staff user|unique constraint failed.*user_role_assignments/i.test(
    message,
  );
}

export async function listAdminUsers(database: D1Database) {
  const result = await database
    .prepare(
      `SELECT
         users.id AS userId,
         users.audience,
         users.display_name AS displayName,
         users.normalized_email AS email,
         users.status,
         staff_profiles.active AS staffActive,
         user_role_assignments.role_key AS roleKey
       FROM users
       LEFT JOIN staff_profiles ON staff_profiles.user_id = users.id
       LEFT JOIN user_role_assignments
         ON user_role_assignments.user_id = users.id
        AND user_role_assignments.effective_end IS NULL
       WHERE users.audience = 'staff'
       ORDER BY users.audience DESC, users.display_name ASC, user_role_assignments.role_key ASC`,
    )
    .all<{
      audience: "guardian" | "staff";
      displayName: string;
      email: string | null;
      roleKey: string | null;
      staffActive: number | null;
      status: "active" | "disabled";
      userId: string;
    }>();

  return result.results.map<AdminUser>((row) => ({
    ...row,
    roleKey: isStaffRole(row.roleKey) ? row.roleKey : null,
    staffActive: row.staffActive === 1,
  }));
}

export async function listAdminRoles(database: D1Database): Promise<AdminRole[]> {
  const result = await database
    .prepare(
      `SELECT
         roles.key,
         roles.name,
         roles.description,
         role_permissions.permission_key AS permissionKey
       FROM roles
       LEFT JOIN role_permissions ON role_permissions.role_key = roles.key
       ORDER BY roles.name ASC, role_permissions.permission_key ASC`,
    )
    .all<{ description: string; key: string; name: string; permissionKey: string | null }>();

  const roles = new Map<StaffRole, AdminRole>();
  for (const row of result.results) {
    if (!isStaffRole(row.key)) continue;
    const existing = roles.get(row.key) ?? {
      description: row.description,
      key: row.key,
      name: row.name,
      permissions: [],
    };
    if (isPermission(row.permissionKey)) {
      existing.permissions = [...existing.permissions, row.permissionKey];
    }
    roles.set(row.key, existing);
  }
  return [...roles.values()];
}

export async function listAdminPermissions(database: D1Database) {
  const result = await database
    .prepare(
      `SELECT key, module, action, description
       FROM permissions
       ORDER BY module ASC, action ASC`,
    )
    .all<{ action: string; description: string; key: string; module: string }>();
  return result.results.filter((row): row is typeof row & { key: Permission } =>
    isPermission(row.key),
  );
}

async function targetRoleRows(database: D1Database, userId: string) {
  const result = await database
    .prepare(
      `SELECT
         users.id AS userId,
         users.audience,
         users.display_name AS displayName,
         users.status,
         staff_profiles.active AS staffActive,
         user_role_assignments.id AS assignmentId,
         user_role_assignments.role_key AS roleKey,
         user_role_assignments.effective_start AS effectiveStart
       FROM users
       LEFT JOIN staff_profiles ON staff_profiles.user_id = users.id
       LEFT JOIN user_role_assignments
         ON user_role_assignments.user_id = users.id
        AND user_role_assignments.effective_end IS NULL
       WHERE users.id = ?`,
    )
    .bind(userId)
    .all<TargetRoleRow>();
  return result.results;
}

export async function replaceStaffRole(
  database: D1Database,
  userId: string,
  roleKey: StaffRole,
  context: RoleMutationContext,
) {
  const now = new Date(context.now ?? Date.now()).toISOString();
  const id = context.id ?? (() => crypto.randomUUID());
  const targets = await targetRoleRows(database, userId);
  const target = targets[0];

  if (!target) {
    throw new StaffApiError(404, "NOT_FOUND", "User not found.");
  }
  if (target.audience !== "staff") {
    throw new StaffApiError(
      400,
      "INVALID_REQUEST",
      "Guardian identities cannot receive staff roles.",
      {
        roleKey: ["Guardian identities cannot receive staff roles."],
      },
    );
  }
  if (target.status !== "active" || target.staffActive !== 1) {
    throw new StaffApiError(400, "INVALID_REQUEST", "Only active staff can receive a role.", {
      roleKey: ["Activate the staff user and profile before assigning a role."],
    });
  }
  if (
    targets.length !== 1 ||
    !target.assignmentId ||
    !target.effectiveStart ||
    !isStaffRole(target.roleKey)
  ) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "This staff account does not have exactly one active role assignment.",
    );
  }

  const role = await database
    .prepare("SELECT key FROM roles WHERE key = ? LIMIT 1")
    .bind(roleKey)
    .first<{ key: string }>();
  if (!role || !isStaffRole(role.key)) {
    throw new StaffApiError(400, "INVALID_REQUEST", "Select a valid staff role.", {
      roleKey: ["Select a valid staff role."],
    });
  }

  if (target.roleKey === roleKey) {
    return { changed: false, roleKey, userId };
  }
  if (new Date(target.effectiveStart).getTime() >= new Date(now).getTime()) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "The replacement time must follow the current role assignment.",
    );
  }
  if (
    target.userId === context.actorUserId &&
    target.roleKey === "system_administrator" &&
    roleKey !== "system_administrator"
  ) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "You cannot remove your own system administrator access.",
    );
  }

  if (target.roleKey === "system_administrator" && roleKey !== "system_administrator") {
    const count = await database
      .prepare(
        `SELECT COUNT(DISTINCT users.id) AS count
         FROM users
         INNER JOIN staff_profiles
           ON staff_profiles.user_id = users.id AND staff_profiles.active = 1
         INNER JOIN user_role_assignments
          ON user_role_assignments.user_id = users.id
          AND user_role_assignments.role_key = 'system_administrator'
          AND user_role_assignments.effective_end IS NULL
         WHERE users.audience = 'staff' AND users.status = 'active'`,
      )
      .first<{ count: number }>();
    if (Number(count?.count ?? 0) <= 1) {
      throw new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "At least one active system administrator must remain.",
      );
    }
  }

  const assignmentId = id();
  const correlationId = id();
  let results: D1Result<unknown>[];
  try {
    results = await database.batch([
      database
        .prepare(
          `UPDATE user_role_assignments
         SET effective_end = ?
         WHERE id = ?
           AND user_id = ?
           AND role_key = ?
           AND effective_start = ?
           AND effective_end IS NULL
           AND EXISTS (
             SELECT 1
             FROM users
             INNER JOIN staff_profiles ON staff_profiles.user_id = users.id
             WHERE users.id = user_role_assignments.user_id
               AND users.audience = 'staff'
               AND users.status = 'active'
               AND staff_profiles.active = 1
           )
           AND (
             ? <> 'system_administrator'
             OR ? = 'system_administrator'
             OR EXISTS (
               SELECT 1
               FROM users AS remaining_users
               INNER JOIN staff_profiles AS remaining_profiles
                 ON remaining_profiles.user_id = remaining_users.id
                AND remaining_profiles.active = 1
               INNER JOIN user_role_assignments AS remaining_assignments
                ON remaining_assignments.user_id = remaining_users.id
                AND remaining_assignments.role_key = 'system_administrator'
                AND remaining_assignments.effective_end IS NULL
               WHERE remaining_users.audience = 'staff'
                 AND remaining_users.status = 'active'
                 AND remaining_users.id <> ?
             )
           )`,
        )
        .bind(
          previousInstant(now),
          target.assignmentId,
          target.userId,
          target.roleKey,
          target.effectiveStart,
          target.roleKey,
          roleKey,
          target.userId,
        ),
      database
        .prepare(
          `INSERT INTO user_role_assignments
           (id, user_id, role_key, assigned_by_user_id, effective_start)
         SELECT ?, ?, ?, ?, ?
         WHERE changes() = 1`,
        )
        .bind(assignmentId, target.userId, roleKey, context.actorUserId, now),
      database
        .prepare(
          `INSERT INTO audit_events
           (id, actor_user_id, actor_audience, action, target_type, target_id,
            correlation_id, outcome, changed_fields, created_at)
         SELECT ?, ?, 'staff', 'identity.staff_role.replaced', 'user', ?, ?, 'success', ?, ?
         WHERE changes() = 1`,
        )
        .bind(
          id(),
          context.actorUserId,
          target.userId,
          correlationId,
          JSON.stringify(["role_key"]),
          now,
        ),
    ]);
  } catch (error) {
    if (isRoleMutationConflict(error)) {
      throw new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "This role assignment changed. Refresh and try again.",
      );
    }
    throw error;
  }

  if (changes(results[0]) !== 1 || changes(results[1]) !== 1 || changes(results[2]) !== 1) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "This role assignment changed. Refresh and try again.",
    );
  }

  return { changed: true, roleKey, userId };
}
