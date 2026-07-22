import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getStudentDetail, updateStudent } from "@/modules/staff/students/repository";
import { staffResourceIdSchema, updateStudentSchema } from "@/modules/staff/students/schemas";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

async function studentIdFrom(params: Promise<{ studentId: string }>) {
  const parsed = staffResourceIdSchema.safeParse((await params).studentId);
  if (!parsed.success) throw new StaffApiError(400, "INVALID_REQUEST", "Invalid student ID.");
  return parsed.data;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const data = await getStudentDetail(
      await getD1Database(),
      await getSession(),
      await studentIdFrom(params),
    );
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    requireSameOrigin(request);
    const data = await updateStudent(
      await getD1Database(),
      await getSession(),
      await studentIdFrom(params),
      await parseJson(request, updateStudentSchema),
    );
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
