import { getD1Database } from "@/db/d1";
import { requireStaffPermission } from "@/modules/auth/authorization";
import { getSession } from "@/modules/auth/session";
import { createLeadFollowUp } from "@/modules/staff/admissions/repository";
import { followUpSchema } from "@/modules/staff/admissions/stages";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    requireSameOrigin(request);
    const session = requireStaffPermission(await getSession(), "leads.update");
    const { leadId } = await params;
    const input = await parseJson(request, followUpSchema);
    const data = await createLeadFollowUp(await getD1Database(), leadId, input, {
      actorUserId: session.user.id,
    });
    return privateJson({ data }, 201);
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
