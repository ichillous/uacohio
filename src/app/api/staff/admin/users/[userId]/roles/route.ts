import { getD1Database } from "@/db/d1";
import { requireStaffPermission } from "@/modules/auth/authorization";
import { getSession } from "@/modules/auth/session";
import { replaceStaffRole } from "@/modules/staff/admin/repository";
import { replaceStaffRoleSchema } from "@/modules/staff/admin/schemas";
import {
  parseJson,
  privateJson,
  requireSameOrigin,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireSameOrigin(request);
    const session = requireStaffPermission(await getSession(), "roles.administer");
    const input = await parseJson(request, replaceStaffRoleSchema);
    const { userId } = await params;
    const data = await replaceStaffRole(await getD1Database(), userId, input.roleKey, {
      actorUserId: session.user.id,
    });
    return privateJson({ data });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
