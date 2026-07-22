import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthorizationError, requireStaffPermission } from "@/modules/auth/authorization";
import { isSameOriginRequest } from "@/modules/auth/session";
import type { Permission, PortalSession } from "@/modules/auth/types";

export type StaffApiErrorCode =
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "INVALID_TRANSITION"
  | "NOT_FOUND"
  | "UNAUTHENTICATED"
  | "VERSION_CONFLICT";

export type StaffFieldErrors = Record<string, readonly string[]>;

export class StaffApiError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422,
    public readonly code: StaffApiErrorCode,
    message: string,
    public readonly fieldErrors: StaffFieldErrors = {},
  ) {
    super(message);
    this.name = "StaffApiError";
  }
}

export function privateJson(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store", ...Object.fromEntries(new Headers(headers)) },
    status,
  });
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new StaffApiError(
      400,
      "INVALID_REQUEST",
      "Review the highlighted fields.",
      fieldErrorsFromIssues(parsed.error.issues),
    );
  }

  return parsed.data;
}

export function fieldErrorsFromIssues(issues: readonly z.core.$ZodIssue[]): StaffFieldErrors {
  return issues.reduce<StaffFieldErrors>((errors, issue) => {
    const field = issue.path.join(".") || "request";
    return { ...errors, [field]: [...(errors[field] ?? []), issue.message] };
  }, {});
}

export function requireSameOrigin(request: Request): void {
  if (!isSameOriginRequest(request)) {
    throw new StaffApiError(403, "FORBIDDEN", "Invalid request origin.");
  }
}

export function requireAnyStaffPermission(
  session: PortalSession | null,
  permissions: readonly Permission[],
): PortalSession {
  const granted = permissions.find((permission) => session?.permissions.includes(permission));
  return requireStaffPermission(session, granted ?? permissions[0]);
}

function requestIdFor(request?: Request): string {
  const incoming = request?.headers.get("X-Request-Id");
  return incoming && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(incoming)
    ? incoming
    : crypto.randomUUID();
}

export function staffErrorResponse(error: unknown, request?: Request) {
  const requestId = requestIdFor(request);
  const respond = (code: string, message: string, fieldErrors: StaffFieldErrors, status: number) =>
    privateJson({ error: { code, fieldErrors, message, requestId } }, status, {
      "X-Request-Id": requestId,
    });

  if (error instanceof AuthorizationError) {
    return respond(error.code, error.message, {}, error.status);
  }

  if (error instanceof StaffApiError) {
    return respond(error.code, error.message, error.fieldErrors, error.status);
  }

  console.error("Unhandled staff API error", { requestId });
  return respond("INTERNAL_ERROR", "The request could not be completed.", {}, 500);
}

export type StaffApiSuccess<T> = { data: T };

export type StaffApiFailure = {
  error: {
    code: string;
    fieldErrors: StaffFieldErrors;
    message: string;
    requestId: string;
  };
};
