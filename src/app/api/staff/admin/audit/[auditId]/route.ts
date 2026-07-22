import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getAuditEvent } from "@/modules/staff/admin/audit";
import { privateJson, StaffApiError, staffErrorResponse } from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ auditId: string }> }) {
  try {
    const { auditId } = await params;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(auditId)) {
      throw new StaffApiError(400, "INVALID_REQUEST", "Use a valid audit event identifier.", {
        auditId: ["Use a valid audit event identifier."],
      });
    }
    const result = await getAuditEvent(await getD1Database(), await getSession(), auditId);
    return privateJson({
      data: result.event,
      meta: { modules: result.scope.modules, scope: result.scope.kind },
    });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
