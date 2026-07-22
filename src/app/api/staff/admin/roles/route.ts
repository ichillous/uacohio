import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { listAdminRoles } from "@/modules/staff/admin/repository";
import {
  privateJson,
  requireAnyStaffPermission,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAnyStaffPermission(await getSession(), ["roles.administer", "audit.view"]);
    const data = await listAdminRoles(await getD1Database());
    return privateJson({ data, meta: { count: data.length } });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
