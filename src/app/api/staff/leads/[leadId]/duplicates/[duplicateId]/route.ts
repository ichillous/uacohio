import { getD1Database } from "@/db/d1";
import { requireStaffPermission } from "@/modules/auth/authorization";
import { getSession } from "@/modules/auth/session";
import { reviewDuplicateLead } from "@/modules/staff/admissions/repository";
import { reviewDuplicateSchema } from "@/modules/staff/admissions/stages";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ duplicateId: string; leadId: string }> },
) {
  try {
    requireSameOrigin(request);
    const session = requireStaffPermission(await getSession(), "duplicates.review");
    const { duplicateId, leadId } = await params;
    const input = await parseJson(request, reviewDuplicateSchema);
    const data = await reviewDuplicateLead(await getD1Database(), leadId, duplicateId, input, {
      actorUserId: session.user.id,
    });
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
