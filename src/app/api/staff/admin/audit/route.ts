import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { listAuditEvents } from "@/modules/staff/admin/audit";
import { auditListQuerySchema } from "@/modules/staff/admin/schemas";
import {
  fieldErrorsFromIssues,
  privateJson,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const parsed = auditListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Review the audit filters.",
        fieldErrorsFromIssues(parsed.error.issues),
      );
    }
    const result = await listAuditEvents(await getD1Database(), session, parsed.data);
    return privateJson({
      data: result.events,
      meta: {
        count: result.events.length,
        modules: result.scope.modules,
        scope: result.scope.kind,
      },
    });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
