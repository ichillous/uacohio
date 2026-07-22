import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getAttendanceSummary } from "@/modules/staff/attendance/repository";
import { attendanceSummaryQuerySchema } from "@/modules/staff/attendance/rules";
import {
  fieldErrorsFromIssues,
  privateJson,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = attendanceSummaryQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Choose a valid attendance range.",
        fieldErrorsFromIssues(query.error.issues),
      );
    }
    return privateJson({
      data: await getAttendanceSummary(await getD1Database(), await getSession(), query.data),
    });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
