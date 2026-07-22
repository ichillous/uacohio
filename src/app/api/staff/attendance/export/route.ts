import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getAttendanceExport } from "@/modules/staff/attendance/repository";
import { csvCell } from "@/modules/staff/attendance/csv";
import { attendanceDateQuerySchema } from "@/modules/staff/attendance/rules";
import {
  fieldErrorsFromIssues,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = attendanceDateQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Choose a valid export date.",
        fieldErrorsFromIssues(query.error.issues),
      );
    }
    const rows = await getAttendanceExport(
      await getD1Database(),
      await getSession(),
      query.data.date,
    );
    const lines = [
      [
        "student_id",
        "legal_first_name",
        "legal_last_name",
        "grade_level_code",
        "attendance_date",
        "status",
        "absence_type",
        "attended_minutes",
        "absent_minutes",
        "version",
      ],
      ...rows.map((row) => [
        row.studentId,
        row.legalFirstName,
        row.legalLastName,
        row.gradeLevelCode,
        query.data.date,
        row.status,
        row.absenceType,
        row.attendedMinutes,
        row.absentMinutes,
        row.version,
      ]),
    ];
    return new Response(lines.map((line) => line.map(csvCell).join(",")).join("\r\n"), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="attendance-${query.data.date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
