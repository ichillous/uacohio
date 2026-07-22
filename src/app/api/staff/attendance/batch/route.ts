import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { markAttendanceBatch } from "@/modules/staff/attendance/repository";
import { attendanceBatchSchema } from "@/modules/staff/attendance/rules";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const data = await markAttendanceBatch(
      await getD1Database(),
      await getSession(),
      await parseJson(request, attendanceBatchSchema),
    );
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
