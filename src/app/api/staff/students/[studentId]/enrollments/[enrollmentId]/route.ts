import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { withdrawEnrollment } from "@/modules/staff/students/repository";
import { staffResourceIdSchema, withdrawEnrollmentSchema } from "@/modules/staff/students/schemas";
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
  { params }: { params: Promise<{ enrollmentId: string; studentId: string }> },
) {
  try {
    requireSameOrigin(request);
    const values = await params;
    const studentId = staffResourceIdSchema.safeParse(values.studentId);
    const enrollmentId = staffResourceIdSchema.safeParse(values.enrollmentId);
    if (!studentId.success || !enrollmentId.success) {
      throw new StaffApiError(400, "INVALID_REQUEST", "Invalid student or enrollment ID.");
    }
    const data = await withdrawEnrollment(
      await getD1Database(),
      await getSession(),
      studentId.data,
      enrollmentId.data,
      await parseJson(request, withdrawEnrollmentSchema),
    );
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
