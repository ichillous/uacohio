import { describe, expect, it } from "vitest";

import { parseJson, StaffApiError, staffErrorResponse } from "./api";
import { z } from "zod";

describe("staff API errors", () => {
  it("uses the approved fieldErrors envelope and correlates body with response header", async () => {
    const response = staffErrorResponse(
      new StaffApiError(400, "INVALID_REQUEST", "Review the highlighted fields.", {
        safeNote: ["Markup is not allowed."],
      }),
      new Request("http://localhost/api/staff/leads", {
        headers: { "X-Request-Id": "request-review-123" },
      }),
    );

    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        fieldErrors: { safeNote: ["Markup is not allowed."] },
        message: "Review the highlighted fields.",
        requestId: "request-review-123",
      },
    });
    expect(response.headers.get("X-Request-Id")).toBe("request-review-123");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("groups Zod issues by field instead of exposing generic details", async () => {
    const schema = z.object({ name: z.string().min(2), version: z.number().positive() });
    const request = new Request("http://localhost/api/staff/leads", {
      body: JSON.stringify({ name: "", version: 0 }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    let error: unknown;
    try {
      await parseJson(request, schema);
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      fieldErrors: { name: [expect.any(String)], version: [expect.any(String)] },
    });
  });

  it("generates a safe request ID when an incoming value is invalid", async () => {
    const response = staffErrorResponse(
      new StaffApiError(404, "NOT_FOUND", "Not found."),
      new Request("http://localhost/api/staff/leads", {
        headers: { "X-Request-Id": "<unsafe>" },
      }),
    );
    const body = (await response.json()) as { error: { requestId: string } };

    expect(body.error.requestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers.get("X-Request-Id")).toBe(body.error.requestId);
  });
});
