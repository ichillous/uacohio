import { z } from "zod";

function isStrictIsoCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const instant = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return instant.toISOString().slice(0, 10) === value;
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date in YYYY-MM-DD format.")
  .refine(isStrictIsoCalendarDate, "Enter a valid calendar date.");
const identifierSchema = z.string().trim().length(9, "Use exactly nine characters.");
const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[A-Za-z0-9*.-]+$/);
const optionalCodeSchema = codeSchema.nullable().optional();
export const staffResourceIdSchema = z.string().trim().min(1).max(128);
const safeText = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine((value) => !/[<>]/.test(value), "Markup is not allowed.");

export const listStudentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(80).optional(),
  status: z.enum(["active", "withdrawn", "graduated"]).optional(),
});

export const createStudentSchema = z.object({
  birthDate: dateSchema,
  emisStudentId: identifierSchema,
  genderCode: codeSchema,
  homeLanguageCode: optionalCodeSchema,
  legalFirstName: safeText(80),
  legalLastName: safeText(80),
  legalMiddleName: safeText(80).nullable().optional(),
  localUseId: identifierSchema.nullable().optional(),
  nativeLanguageCode: codeSchema,
  prospectiveStudentId: z.string().trim().min(1).max(128).nullable().optional(),
  raceEthnicityCode: codeSchema,
  ssid: identifierSchema.nullable().optional(),
  status: z.enum(["active", "withdrawn", "graduated"]).default("active"),
});

export const updateStudentSchema = createStudentSchema
  .omit({ prospectiveStudentId: true })
  .partial()
  .extend({ updatedAt: z.string().trim().min(10).max(40) })
  .superRefine((value, context) => {
    if (Object.keys(value).every((key) => key === "updatedAt")) {
      context.addIssue({ code: "custom", message: "Provide at least one field to update." });
    }
  });

const guardianFields = z.object({
  contactPreference: z.enum(["email", "phone", "sms"]).nullable().optional(),
  firstName: safeText(80),
  lastName: safeText(80),
  normalizedEmail: z.email().trim().toLowerCase().nullable().optional(),
  normalizedPhone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Use an E.164 phone number.")
    .nullable()
    .optional(),
  preferredLanguage: z.enum(["en", "ar", "so"]),
});

export const createGuardianLinkSchema = guardianFields.extend({
  custody: z.boolean().default(false),
  effectiveStart: dateSchema,
  familyId: staffResourceIdSchema,
  receivesContact: z.boolean().default(true),
  relationship: safeText(40),
});

export const updateGuardianLinkSchema = guardianFields
  .partial()
  .extend({
    custody: z.boolean().optional(),
    expectedUpdatedAt: z.string().trim().min(10).max(40),
    receivesContact: z.boolean().optional(),
    relationship: safeText(40).optional(),
    status: z.enum(["active", "revoked"]).optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).every((key) => key === "expectedUpdatedAt")) {
      context.addIssue({ code: "custom", message: "Provide at least one field to update." });
    }
  });

export const createEnrollmentSchema = z.object({
  admissionDate: dateSchema,
  admissionReasonCode: codeSchema,
  admittedFromIrn: z.string().trim().length(6).nullable().optional(),
  assignedBuildingAreaIrn: z.string().trim().length(6).nullable().optional(),
  attendingBuildingIrn: z.string().trim().length(6),
  districtRelationshipCode: codeSchema,
  effectiveStart: dateSchema,
  gradeLevelCode: codeSchema,
  legalDistrictOfResidence: z.string().trim().length(6),
  percentOfTime: z.number().int().min(0).max(100),
  termId: staffResourceIdSchema,
});

export const withdrawEnrollmentSchema = z
  .object({
    effectiveEnd: dateSchema,
    expectedEffectiveStart: dateSchema,
    withdrawalReasonCode: codeSchema,
    withdrawnToIrn: z.string().trim().length(6).nullable().optional(),
  })
  .superRefine((value, context) => {
    const start = Date.parse(`${value.expectedEffectiveStart}T00:00:00.000Z`);
    const end = Date.parse(`${value.effectiveEnd}T00:00:00.000Z`);
    if (end < start) {
      context.addIssue({
        code: "custom",
        message: "Withdrawal date cannot be before the enrollment start date.",
        path: ["effectiveEnd"],
      });
    }
  });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateGuardianLinkInput = z.infer<typeof createGuardianLinkSchema>;
export type UpdateGuardianLinkInput = z.infer<typeof updateGuardianLinkSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type WithdrawEnrollmentInput = z.infer<typeof withdrawEnrollmentSchema>;
