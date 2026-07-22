import { getD1Database } from "@/db/d1";
import { requireStaffPermission } from "@/modules/auth/authorization";
import { getSession } from "@/modules/auth/session";
import { listLeads } from "@/modules/staff/admissions/repository";
import { AdmissionsPipeline } from "@/modules/staff/admissions/admissions-pipeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdmissionsPage() {
  const session = requireStaffPermission(await getSession(), "leads.view");
  const canReviewDuplicates = session.permissions.includes("duplicates.review");
  const leads = await listLeads(
    await getD1Database(),
    { limit: 100 },
    { includeDuplicateDetails: canReviewDuplicates },
  );

  return (
    <AdmissionsPipeline
      canReviewDuplicates={canReviewDuplicates}
      canUpdate={session.permissions.includes("leads.update")}
      initialLeads={leads}
    />
  );
}
