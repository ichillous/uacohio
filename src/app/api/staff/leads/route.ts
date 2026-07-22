import { getD1Database } from "@/db/d1";
import { requireStaffPermission } from "@/modules/auth/authorization";
import { getSession } from "@/modules/auth/session";
import { listLeads } from "@/modules/staff/admissions/repository";
import { listLeadsQuerySchema } from "@/modules/staff/admissions/stages";
import {
  fieldErrorsFromIssues,
  privateJson,
  StaffApiError,
  staffErrorResponse,
} from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = requireStaffPermission(await getSession(), "leads.view");
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = listLeadsQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      throw new StaffApiError(
        400,
        "INVALID_REQUEST",
        "Review the search filters.",
        fieldErrorsFromIssues(parsed.error.issues),
      );
    }

    const data = await listLeads(await getD1Database(), parsed.data, {
      includeDuplicateDetails: session.permissions.includes("duplicates.review"),
    });
    return privateJson({ data, meta: { count: data.length } });
  } catch (error) {
    return staffErrorResponse(error, request);
  }
}
