import { z } from "zod";

import { staffRoles } from "@/modules/auth/types";

export const replaceStaffRoleSchema = z
  .object({
    roleKey: z.enum(staffRoles, { error: "Select a valid staff role." }),
  })
  .strict();

export const auditModules = [
  "identity",
  "admissions",
  "student_operations",
  "notifications",
  "content",
  "reporting",
  "governance",
] as const;

export type AuditModule = (typeof auditModules)[number];

const utcDateTime = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());

export const auditListQuerySchema = z
  .object({
    action: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9_.]{2,79}$/, "Use a valid audit action key.")
      .optional(),
    from: utcDateTime.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    module: z.enum(auditModules).optional(),
    outcome: z.enum(["success", "denied", "failed"]).optional(),
    to: utcDateTime.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "The start date must not be after the end date.",
    path: ["from"],
  });

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
