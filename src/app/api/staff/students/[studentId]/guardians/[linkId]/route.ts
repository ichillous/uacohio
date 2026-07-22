import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { updateGuardianLink } from "@/modules/staff/students/repository";
import { staffResourceIdSchema, updateGuardianLinkSchema } from "@/modules/staff/students/schemas";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ linkId: string; studentId: string }> },
) {
  try {
    requireSameOrigin(request);
    const values = await params;
    const studentId = staffResourceIdSchema.safeParse(values.studentId);
    const linkId = staffResourceIdSchema.safeParse(values.linkId);
    if (!studentId.success || !linkId.success) {
      throw new StaffApiError(400, "INVALID_REQUEST", "Invalid student or guardian link ID.");
    }
    const data = await updateGuardianLink(
      await getD1Database(),
      await getSession(),
      studentId.data,
      linkId.data,
      await parseJson(request, updateGuardianLinkSchema),
    );
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
