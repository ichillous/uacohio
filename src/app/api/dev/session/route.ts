import { NextResponse } from "next/server";
import { z } from "zod";

import { getD1Database } from "@/db/d1";
import { isDevAuthAllowed, readRuntimeEnvironment } from "@/lib/env/server";
import { portalSessionCookie, portalSessionMaxAgeSeconds } from "@/modules/auth/constants";
import {
  createDevSession,
  getSessionFromToken,
  isSameOriginRequest,
  revokeDevSession,
} from "@/modules/auth/session";

const createSessionSchema = z.object({
  userId: z.string().min(1).max(128),
});

function privateJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
    status,
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: { code: "FORBIDDEN", message: "Invalid request origin." } }, 403);
  }

  const environment = readRuntimeEnvironment();
  if (!isDevAuthAllowed(environment)) {
    return privateJson({ error: { code: "NOT_FOUND", message: "Not found." } }, 404);
  }

  const parsed = createSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: { code: "INVALID_REQUEST", message: "Invalid user." } }, 400);
  }

  const database = await getD1Database();
  const created = await createDevSession(database, parsed.data.userId, environment);
  if (!created) {
    return privateJson({ error: { code: "NOT_FOUND", message: "Not found." } }, 404);
  }

  const session = await getSessionFromToken(database, created.token, environment);
  if (!session) {
    await revokeDevSession(database, created.token);
    return privateJson({ error: { code: "FORBIDDEN", message: "Access is forbidden." } }, 403);
  }

  const response = privateJson({ audience: session.audience }, 201);
  response.cookies.set(portalSessionCookie, created.token, {
    expires: created.expiresAt,
    httpOnly: true,
    maxAge: portalSessionMaxAgeSeconds,
    path: "/",
    sameSite: "strict",
    secure: new URL(environment.NEXT_PUBLIC_SITE_URL).protocol === "https:",
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: { code: "FORBIDDEN", message: "Invalid request origin." } }, 403);
  }

  const environment = readRuntimeEnvironment();
  if (!isDevAuthAllowed(environment)) {
    return privateJson({ error: { code: "NOT_FOUND", message: "Not found." } }, 404);
  }

  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${portalSessionCookie}=`))
    ?.slice(portalSessionCookie.length + 1);

  if (token) {
    await revokeDevSession(await getD1Database(), decodeURIComponent(token));
  }

  const response = privateJson({ signedOut: true }, 200);
  response.cookies.set(portalSessionCookie, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: new URL(environment.NEXT_PUBLIC_SITE_URL).protocol === "https:",
  });
  return response;
}
