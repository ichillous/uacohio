import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { createGuardianLink } from "@/modules/staff/students/repository";
import { createGuardianLinkSchema, staffResourceIdSchema } from "@/modules/staff/students/schemas";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    requireSameOrigin(request);
    const studentId = staffResourceIdSchema.safeParse((await params).studentId);
    if (!studentId.success) {
      throw new StaffApiError(400, "INVALID_REQUEST", "Invalid student ID.");
    }
    const data = await createGuardianLink(
      await getD1Database(),
      await getSession(),
      studentId.data,
      await parseJson(request, createGuardianLinkSchema),
    );
    return privateJson({ data }, 201);
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
