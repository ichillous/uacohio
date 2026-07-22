import { z } from "zod";

export const leadStages = [
  "inquiry",
  "contacted",
  "toured",
  "applied",
  "enrolled",
  "closed_not_proceeding",
] as const;

export type LeadStage = (typeof leadStages)[number];

export const leadStageSchema = z.enum(leadStages);

export const allowedLeadTransitions: Record<LeadStage, readonly LeadStage[]> = {
  inquiry: ["contacted", "closed_not_proceeding"],
  contacted: ["toured", "closed_not_proceeding"],
  toured: ["applied", "closed_not_proceeding"],
  applied: ["enrolled", "closed_not_proceeding"],
  enrolled: [],
  closed_not_proceeding: [],
};

export const leadStageLabels: Record<LeadStage, string> = {
  inquiry: "New inquiry",
  contacted: "Family contacted",
  toured: "Tour completed",
  applied: "Application filed",
  enrolled: "Enrolled",
  closed_not_proceeding: "Closed",
};

export function isAllowedLeadTransition(from: LeadStage, to: LeadStage): boolean {
  return allowedLeadTransitions[from].includes(to);
}

export const transitionLeadSchema = z.object({
  reason: z.string().trim().min(2).max(240).optional(),
  toStage: leadStageSchema,
  version: z.number().int().positive(),
});

export const activitySchema = z.object({
  nextActionAt: z.iso.datetime().nullable().optional(),
  outcome: z.string().trim().max(160).nullable().optional(),
  safeNote: z
    .string()
    .trim()
    .min(2)
    .max(1000)
    .refine((value) => !/[<>]/.test(value), {
      message: "Markup is not allowed in activity notes.",
    }),
  type: z.enum(["call", "email", "text", "meeting", "note"]),
});

export const followUpSchema = z.object({
  dueAt: z.iso.datetime(),
  outcome: z.string().trim().max(160).nullable().optional(),
});

export const flagDuplicateSchema = z.object({
  candidateLeadId: z.string().trim().min(1).max(128),
  signals: z
    .array(z.enum(["name", "email", "phone", "address", "guardian"]))
    .min(1)
    .max(5),
});

export const reviewDuplicateSchema = z.object({
  state: z.enum(["not_duplicate", "duplicate_confirmed"]),
});

export const listLeadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  q: z.string().trim().max(80).optional(),
  stage: leadStageSchema.optional(),
});

export type TransitionLeadInput = z.infer<typeof transitionLeadSchema>;
export type CreateActivityInput = z.infer<typeof activitySchema>;
export type CreateFollowUpInput = z.infer<typeof followUpSchema>;
export type FlagDuplicateInput = z.infer<typeof flagDuplicateSchema>;
export type ReviewDuplicateInput = z.infer<typeof reviewDuplicateSchema>;
