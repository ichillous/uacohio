import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getAttendanceRoster } from "@/modules/staff/attendance/repository";
import { attendanceDateQuerySchema } from "@/modules/staff/attendance/rules";
import {
  fieldErrorsFromIssues,
  privateJson,
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
        "Choose a valid attendance date.",
        fieldErrorsFromIssues(query.error.issues),
      );
    }
    const data = await getAttendanceRoster(
      await getD1Database(),
      await getSession(),
      query.data.date,
    );
    return privateJson({ data, meta: { count: data.length, date: query.data.date } });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
