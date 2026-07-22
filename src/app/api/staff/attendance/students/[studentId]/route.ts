import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getAttendanceHistory } from "@/modules/staff/attendance/repository";
import { attendanceHistoryQuerySchema } from "@/modules/staff/attendance/rules";
import { staffResourceIdSchema } from "@/modules/staff/students/schemas";
import {
  fieldErrorsFromIssues,
  privateJson,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const studentId = staffResourceIdSchema.safeParse((await params).studentId);
    const query = attendanceHistoryQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!studentId.success || !query.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Review the attendance history request.",
        query.success ? {} : fieldErrorsFromIssues(query.error.issues),
      );
    }
    return privateJson({
      data: await getAttendanceHistory(
        await getD1Database(),
        await getSession(),
        studentId.data,
        query.data,
      ),
    });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
