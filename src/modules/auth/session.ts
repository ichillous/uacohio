import { cookies } from "next/headers";

import { getD1Database } from "@/db/d1";
import {
  isDevAuthAllowed,
  readRuntimeEnvironment,
  type RuntimeEnvironment,
} from "@/lib/env/server";

import { portalSessionCookie, portalSessionMaxAgeSeconds } from "./constants";
import {
  staffPermissions,
  staffRoles,
  type Permission,
  type PortalAudience,
  type PortalLocale,
  type PortalSession,
  type StaffRole,
} from "./types";

export type SessionIdentityRow = {
  audience: PortalAudience;
  displayName: string;
  locale: PortalLocale;
  normalizedEmail: string | null;
  roleKey: string | null;
  sessionProvider: "dev" | "google";
  userId: string;
};

export type DevIdentity = {
  audience: PortalAudience;
  displayName: string;
  role: StaffRole | null;
  userId: string;
};

function isStaffRole(value: string): value is StaffRole {
  return staffRoles.includes(value as StaffRole);
}

function isPermission(value: string): value is Permission {
  return staffPermissions.includes(value as Permission);
}

export function buildPortalSession(
  identityRows: readonly SessionIdentityRow[],
  permissionKeys: readonly string[],
  environment: RuntimeEnvironment,
): PortalSession | null {
  const identity = identityRows[0];

  if (!identity || (identity.sessionProvider === "dev" && !isDevAuthAllowed(environment))) {
    return null;
  }

  const distinctRoleKeys = [
    ...new Set(identityRows.map((row) => row.roleKey).filter((role): role is string => !!role)),
  ];

  if (identity.audience === "staff") {
    if (distinctRoleKeys.length !== 1 || !isStaffRole(distinctRoleKeys[0])) {
      return null;
    }

    return {
      user: {
        id: identity.userId,
        displayName: identity.displayName,
        email: identity.normalizedEmail,
        locale: identity.locale,
      },
      audience: "staff",
      role: distinctRoleKeys[0],
      permissions: [...new Set(permissionKeys.filter(isPermission))],
    };
  }

  if (distinctRoleKeys.length > 0) {
    return null;
  }

  return {
    user: {
      id: identity.userId,
      displayName: identity.displayName,
      email: identity.normalizedEmail,
      locale: identity.locale,
    },
    audience: "guardian",
    role: null,
    permissions: [],
  };
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createOpaqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getSessionFromToken(
  database: D1Database,
  token: string,
  environment: RuntimeEnvironment,
  now = new Date(),
): Promise<PortalSession | null> {
  const tokenHash = await hashSessionToken(token);
  const instant = now.toISOString();
  const identityResult = await database
    .prepare(
      `SELECT
         users.id AS userId,
         users.audience,
         users.display_name AS displayName,
         users.normalized_email AS normalizedEmail,
         users.locale,
         user_role_assignments.role_key AS roleKey,
         sessions.provider AS sessionProvider
       FROM sessions
       INNER JOIN users
         ON users.id = sessions.user_id
        AND users.status = 'active'
       LEFT JOIN staff_profiles
         ON staff_profiles.user_id = users.id
        AND staff_profiles.active = 1
       LEFT JOIN user_role_assignments
         ON user_role_assignments.user_id = users.id
        AND user_role_assignments.effective_start <= ?
        AND (user_role_assignments.effective_end IS NULL OR user_role_assignments.effective_end >= ?)
       WHERE sessions.token_hash = ?
         AND sessions.revoked_at IS NULL
         AND sessions.expires_at > ?
         AND (users.audience = 'guardian' OR staff_profiles.user_id IS NOT NULL)`,
    )
    .bind(instant, instant, tokenHash, instant)
    .all<SessionIdentityRow>();

  const identityRows = identityResult.results;
  const identity = identityRows[0];

  if (!identity) {
    return null;
  }

  let permissionKeys: string[] = [];
  if (identity.audience === "staff") {
    const permissionResult = await database
      .prepare(
        `SELECT DISTINCT role_permissions.permission_key AS permissionKey
         FROM user_role_assignments
         INNER JOIN role_permissions
           ON role_permissions.role_key = user_role_assignments.role_key
         WHERE user_role_assignments.user_id = ?
           AND user_role_assignments.effective_start <= ?
           AND (user_role_assignments.effective_end IS NULL OR user_role_assignments.effective_end >= ?)`,
      )
      .bind(identity.userId, instant, instant)
      .all<{ permissionKey: string }>();
    permissionKeys = permissionResult.results.map((row) => row.permissionKey);
  }

  return buildPortalSession(identityRows, permissionKeys, environment);
}

export async function getSession(): Promise<PortalSession | null> {
  const token = (await cookies()).get(portalSessionCookie)?.value;
  if (!token) {
    return null;
  }

  return getSessionFromToken(await getD1Database(), token, readRuntimeEnvironment());
}

export async function listDevIdentities(database: D1Database): Promise<DevIdentity[]> {
  const result = await database
    .prepare(
      `SELECT
         users.id AS userId,
         users.audience,
         users.display_name AS displayName,
         user_role_assignments.role_key AS roleKey
       FROM users
       INNER JOIN auth_identities
         ON auth_identities.user_id = users.id
        AND auth_identities.provider = 'dev'
       LEFT JOIN user_role_assignments
         ON user_role_assignments.user_id = users.id
        AND user_role_assignments.effective_end IS NULL
       WHERE users.status = 'active'
       ORDER BY users.audience DESC, users.display_name ASC`,
    )
    .all<{
      audience: PortalAudience;
      displayName: string;
      roleKey: string | null;
      userId: string;
    }>();

  return result.results.flatMap((row) => {
    if (row.audience === "staff" && (!row.roleKey || !isStaffRole(row.roleKey))) {
      return [];
    }

    return [
      {
        audience: row.audience,
        displayName: row.displayName,
        role: row.audience === "staff" ? (row.roleKey as StaffRole) : null,
        userId: row.userId,
      },
    ];
  });
}

export async function createDevSession(
  database: D1Database,
  userId: string,
  environment: RuntimeEnvironment,
  now = new Date(),
): Promise<{ expiresAt: Date; token: string } | null> {
  if (!isDevAuthAllowed(environment)) {
    return null;
  }

  const user = await database
    .prepare(
      `SELECT users.id
       FROM users
       INNER JOIN auth_identities
         ON auth_identities.user_id = users.id
        AND auth_identities.provider = 'dev'
       WHERE users.id = ? AND users.status = 'active'
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ id: string }>();

  if (!user) {
    return null;
  }

  const token = createOpaqueToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(now.getTime() + portalSessionMaxAgeSeconds * 1000);

  await database
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, provider, expires_at, created_at)
       VALUES (?, ?, ?, 'dev', ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt.toISOString(), now.toISOString())
    .run();

  return { expiresAt, token };
}

export async function revokeDevSession(database: D1Database, token: string): Promise<void> {
  await database
    .prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL")
    .bind(new Date().toISOString(), await hashSessionToken(token))
    .run();
}
