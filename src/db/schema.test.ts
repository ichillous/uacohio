import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  applications,
  attendanceDaily,
  auditEvents,
  guardianApplicationLinks,
  guardianStudentLinks,
  leads,
  messages,
  outboxJobs,
  permissions,
  rolePermissions,
  roles,
  sessions,
  students,
  users,
} from "./schema";

describe("D1 portal schema", () => {
  it("keeps identity, admissions, student, notification, and governance domains explicit", () => {
    expect(
      [
        users,
        sessions,
        roles,
        permissions,
        rolePermissions,
        leads,
        applications,
        guardianApplicationLinks,
        students,
        guardianStudentLinks,
        attendanceDaily,
        messages,
        outboxJobs,
        auditEvents,
      ].map(getTableName),
    ).toEqual([
      "users",
      "sessions",
      "roles",
      "permissions",
      "role_permissions",
      "leads",
      "applications",
      "guardian_application_links",
      "students",
      "guardian_student_links",
      "attendance_daily",
      "messages",
      "outbox_jobs",
      "audit_events",
    ]);
  });
});
