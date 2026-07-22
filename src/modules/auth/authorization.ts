import type { Permission, PortalSession } from "./types";

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    public readonly status: 401 | 403,
  ) {
    super(code === "UNAUTHENTICATED" ? "Authentication is required." : "Access is forbidden.");
    this.name = "AuthorizationError";
  }
}

export function hasPermission(session: PortalSession | null, permission: Permission): boolean {
  return (
    session?.audience === "staff" &&
    session.role !== null &&
    session.permissions.includes(permission)
  );
}

export function requireStaffPermission(
  session: PortalSession | null,
  permission: Permission,
): PortalSession {
  if (!session) {
    throw new AuthorizationError("UNAUTHENTICATED", 401);
  }

  if (!hasPermission(session, permission)) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }

  return session;
}
