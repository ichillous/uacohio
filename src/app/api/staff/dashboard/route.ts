import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { getStaffDashboard } from "@/modules/staff/dashboard/dashboard";
import {
  privateJson,
  requireAnyStaffPermission,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = requireAnyStaffPermission(await getSession(), [
      "dashboard.view",
      "dashboard.view_content_metrics",
      "dashboard.view_campaign_metrics",
    ]);
    const data = await getStaffDashboard(await getD1Database(), session);
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
