import type { LeadSummary } from "./repository";

export function clearResolvedDuplicate(
  leads: readonly LeadSummary[],
  duplicateId: string,
  leadId: string,
  candidateLeadId: string,
): LeadSummary[] {
  const affectedLeadIds = new Set([leadId, candidateLeadId]);

  return leads.map((lead) => {
    if (!affectedLeadIds.has(lead.id)) {
      return lead;
    }

    return {
      ...lead,
      duplicateCount: Math.max(0, lead.duplicateCount - 1),
      pendingDuplicates: lead.pendingDuplicates.filter((item) => item.id !== duplicateId),
    };
  });
}
