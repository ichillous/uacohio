import { z } from "zod";

export const attendanceStatuses = [
  "present",
  "absent_excused",
  "absent_unexcused",
  "tardy_excused",
  "tardy_unexcused",
  "partial",
] as const;

export type AttendanceStatus = (typeof attendanceStatuses)[number];
export type AbsenceType = "excused" | "none" | "unexcused";

function isStrictIsoCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const instant = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return instant.toISOString().slice(0, 10) === value;
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date in YYYY-MM-DD format.")
  .refine(isStrictIsoCalendarDate, "Enter a valid calendar date.");

export const attendanceRecordSchema = z
  .object({
    absenceType: z.enum(["excused", "unexcused"]).optional(),
    attendedMinutes: z.number().int().min(1).max(359).optional(),
    safeNote: z
      .string()
      .trim()
      .max(500)
      .refine((value) => !/[<>]/.test(value), "Markup is not allowed in attendance notes.")
      .nullable()
      .optional(),
    status: z.enum(attendanceStatuses),
    studentId: z.string().trim().min(1).max(128),
    version: z.number().int().min(0),
  })
  .superRefine((value, context) => {
    const variableMinutes = value.status.startsWith("tardy_") || value.status === "partial";
    if (variableMinutes && value.attendedMinutes === undefined) {
      context.addIssue({
        code: "custom",
        message: "Attended minutes are required for tardy and partial records.",
        path: ["attendedMinutes"],
      });
    }
    if (!variableMinutes && value.attendedMinutes !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Minutes are derived for present and absent records.",
        path: ["attendedMinutes"],
      });
    }
    if (value.status === "partial" && value.absenceType === undefined) {
      context.addIssue({
        code: "custom",
        message: "Choose whether the partial absence is excused or unexcused.",
        path: ["absenceType"],
      });
    }
    if (value.status !== "partial" && value.absenceType !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Absence type is derived from the selected status.",
        path: ["absenceType"],
      });
    }
  });

export const attendanceBatchSchema = z
  .object({
    attendanceDate: isoDate,
    records: z.array(attendanceRecordSchema).min(1).max(250),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.records.forEach((record, index) => {
      if (seen.has(record.studentId)) {
        context.addIssue({
          code: "custom",
          message: "Each student can appear only once in a batch.",
          path: ["records", index, "studentId"],
        });
      }
      seen.add(record.studentId);
    });
  });

export const attendanceDateQuerySchema = z.object({ date: isoDate });
export const attendanceHistoryQuerySchema = z
  .object({
    from: isoDate.optional(),
    limit: z.coerce.number().int().min(1).max(180).default(45),
    to: isoDate.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "The start date must be on or before the end date.",
    path: ["from"],
  });
export const attendanceSummaryQuerySchema = z
  .object({ from: isoDate, to: isoDate })
  .refine((value) => value.from <= value.to, {
    message: "The start date must be on or before the end date.",
    path: ["from"],
  });

export type AttendanceBatchInput = z.infer<typeof attendanceBatchSchema>;

export function deriveAttendanceValues(input: {
  absenceType?: "excused" | "unexcused";
  attendedMinutes?: number;
  status: AttendanceStatus;
}): { absenceType: AbsenceType; absentMinutes: number; attendedMinutes: number } {
  if (input.status === "present") {
    return { absenceType: "none", absentMinutes: 0, attendedMinutes: 360 };
  }
  if (input.status === "absent_excused") {
    return { absenceType: "excused", absentMinutes: 360, attendedMinutes: 0 };
  }
  if (input.status === "absent_unexcused") {
    return { absenceType: "unexcused", absentMinutes: 360, attendedMinutes: 0 };
  }
  const attendedMinutes = input.attendedMinutes;
  if (!attendedMinutes || attendedMinutes >= 360) {
    throw new StaffApiErrorForRules("Attended minutes must be between 1 and 359.");
  }
  const absenceType =
    input.status === "tardy_excused"
      ? "excused"
      : input.status === "tardy_unexcused"
        ? "unexcused"
        : input.absenceType;
  if (!absenceType) {
    throw new StaffApiErrorForRules("Partial attendance requires an absence type.");
  }
  return { absenceType, absentMinutes: 360 - attendedMinutes, attendedMinutes };
}

class StaffApiErrorForRules extends Error {}
