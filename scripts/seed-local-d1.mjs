import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const appEnvironment = process.env.APP_ENV ?? "development";
if (appEnvironment !== "development" && appEnvironment !== "test") {
  throw new Error(`Refusing to seed local D1 while APP_ENV=${appEnvironment}.`);
}

const sqlValue = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};

const statements = [];
const insertRows = (table, columns, rows, chunkSize = 200) => {
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const values = rows
      .slice(offset, offset + chunkSize)
      .map((row) => `(${row.map(sqlValue).join(", ")})`)
      .join(",\n");
    statements.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values};`);
  }
};

statements.push("PRAGMA foreign_keys = ON;");
for (const table of [
  "notification_attempts",
  "notification_intents",
  "outbox_jobs",
  "announcement_targets",
  "announcements",
  "messages",
  "thread_participants",
  "message_threads",
  "document_shares",
  "student_documents",
  "guardian_profile_update_requests",
  "attendance_daily",
  "student_attributes",
  "enrollments",
  "seat_capacity",
  "guardian_student_links",
  "guardian_application_links",
  "duplicate_candidates",
  "consent_records",
  "visit_requests",
  "follow_up_tasks",
  "lead_activities",
  "lead_stage_history",
  "applications",
  "leads",
  "students",
  "terms",
  "school_years",
  "prospective_students",
  "guardian_accounts",
  "guardians",
  "families",
  "audit_events",
  "sessions",
  "auth_identities",
  "user_role_assignments",
  "role_permissions",
  "staff_profiles",
  "permissions",
  "roles",
  "users",
]) {
  statements.push(`DELETE FROM ${table};`);
}
statements.push("DELETE FROM system_metadata WHERE key LIKE 'seed.%';");

const roleDefinitions = [
  ["system_administrator", "System Administrator"],
  ["school_leadership", "School Leadership"],
  ["admissions_family_liaison", "Admissions / Family Liaison"],
  ["office_attendance", "Office / Attendance"],
  ["content_publisher_translator", "Content Publisher / Translator"],
  ["marketing_outreach", "Marketing / Outreach"],
];
insertRows(
  "roles",
  ["key", "name", "description"],
  roleDefinitions.map(([key, name]) => [key, name, `Seeded ${name} persona.`]),
);

const permissionKeys = [
  "dashboard.view",
  "dashboard.view_content_metrics",
  "dashboard.view_campaign_metrics",
  "leads.view",
  "leads.create",
  "leads.update",
  "leads.export",
  "leads.attribution.update",
  "duplicates.review",
  "students.view",
  "students.create",
  "students.update",
  "students.export",
  "students.view_applicant_projection",
  "enrollment.view",
  "enrollment.update",
  "attendance.view",
  "attendance.mark",
  "attendance.export",
  "messages.view",
  "messages.send",
  "messages.translate_assigned",
  "announcements.view",
  "announcements.draft",
  "announcements.publish",
  "announcements.share_assigned",
  "reports.view",
  "reports.export",
  "reports.outreach.export_deidentified",
  "profile_requests.review",
  "roles.administer",
  "audit.view",
  "audit.export",
  "audit.view_module",
  "documents.share",
];
insertRows(
  "permissions",
  ["key", "module", "action", "description"],
  permissionKeys.map((key) => {
    const [module, ...action] = key.split(".");
    return [key, module, action.join("."), `Allows ${key} in local portal development.`];
  }),
);

const grants = {
  system_administrator: permissionKeys,
  school_leadership: [
    "dashboard.view",
    "leads.view",
    "leads.export",
    "students.view",
    "enrollment.view",
    "attendance.view",
    "attendance.export",
    "reports.view",
    "reports.export",
    "audit.view",
  ],
  admissions_family_liaison: [
    "dashboard.view",
    "leads.view",
    "leads.create",
    "leads.update",
    "leads.export",
    "duplicates.review",
    "students.view_applicant_projection",
    "enrollment.view",
    "enrollment.update",
    "messages.view",
    "messages.send",
    "announcements.view",
    "announcements.draft",
    "reports.view",
    "reports.export",
    "profile_requests.review",
    "audit.view_module",
  ],
  office_attendance: [
    "dashboard.view",
    "students.view",
    "students.create",
    "students.update",
    "enrollment.view",
    "enrollment.update",
    "attendance.view",
    "attendance.mark",
    "attendance.export",
    "messages.view",
    "messages.send",
    "announcements.view",
    "announcements.draft",
    "reports.view",
    "reports.export",
    "profile_requests.review",
    "audit.view_module",
  ],
  content_publisher_translator: [
    "dashboard.view_content_metrics",
    "messages.translate_assigned",
    "announcements.view",
    "announcements.draft",
    "announcements.publish",
    "announcements.share_assigned",
    "reports.view",
    "audit.view_module",
  ],
  marketing_outreach: [
    "dashboard.view_campaign_metrics",
    "leads.view",
    "leads.create",
    "leads.attribution.update",
    "announcements.draft",
    "reports.view",
    "reports.outreach.export_deidentified",
    "audit.view_module",
  ],
};
insertRows(
  "role_permissions",
  ["role_key", "permission_key"],
  Object.entries(grants).flatMap(([role, permissions]) =>
    permissions.map((permission) => [role, permission]),
  ),
);

const staffUsers = roleDefinitions.map(([role, name], index) => [
  `user-staff-${String(index + 1).padStart(3, "0")}`,
  "staff",
  `Dev ${name}`,
  `${role.replaceAll("_", ".")}@example.test`,
  "en",
  "active",
]);
const guardianUsers = [1, 2, 3, 4].map((index) => [
  `user-guardian-${String(index).padStart(3, "0")}`,
  "guardian",
  `Dev Guardian ${String(index).padStart(3, "0")}`,
  `guardian.${String(index).padStart(3, "0")}@example.test`,
  index === 2 ? "ar" : index === 3 ? "so" : "en",
  "active",
]);
insertRows(
  "users",
  ["id", "audience", "display_name", "normalized_email", "locale", "status"],
  [...staffUsers, ...guardianUsers],
);
insertRows(
  "auth_identities",
  ["id", "user_id", "provider", "provider_subject"],
  [...staffUsers, ...guardianUsers].map((user) => [
    `identity-${user[0]}`,
    user[0],
    "dev",
    `seed:${user[0]}`,
  ]),
);
insertRows(
  "staff_profiles",
  ["user_id", "title", "active"],
  roleDefinitions.map(([, name], index) => [staffUsers[index][0], name, 1]),
);
insertRows(
  "user_role_assignments",
  ["id", "user_id", "role_key", "assigned_by_user_id", "effective_start"],
  roleDefinitions.map(([role], index) => [
    `assignment-${String(index + 1).padStart(3, "0")}`,
    staffUsers[index][0],
    role,
    staffUsers[0][0],
    "2025-07-01T00:00:00.000Z",
  ]),
);

const familyRows = [];
const guardianRows = [];
for (let index = 1; index <= 199; index += 1) {
  const padded = String(index).padStart(3, "0");
  familyRows.push([`family-${padded}`, index % 11 === 0 ? "ar" : index % 13 === 0 ? "so" : "en"]);
  guardianRows.push([
    `guardian-${padded}`,
    `family-${padded}`,
    "Guardian",
    padded,
    `family.${padded}@example.test`,
    `+1614555${String(index).padStart(4, "0")}`,
    "email",
    familyRows.at(-1)[1],
  ]);
}
insertRows("families", ["id", "preferred_locale"], familyRows);
insertRows(
  "guardians",
  [
    "id",
    "family_id",
    "first_name",
    "last_name",
    "normalized_email",
    "normalized_phone",
    "contact_preference",
    "preferred_language",
  ],
  guardianRows,
);
insertRows(
  "guardian_accounts",
  ["user_id", "guardian_id", "verified_link_state", "verified_at"],
  guardianUsers.map((user, index) => [
    user[0],
    `guardian-${String(index + 1).padStart(3, "0")}`,
    "verified",
    "2025-07-01T00:00:00.000Z",
  ]),
);

insertRows(
  "school_years",
  ["id", "name", "starts_on", "ends_on", "current"],
  [["school-year-2025", "2025-2026", "2025-07-01", "2026-06-30", 1]],
);
insertRows(
  "terms",
  ["id", "school_year_id", "name", "starts_on", "ends_on"],
  [["term-fall-2025", "school-year-2025", "Fall", "2025-08-18", "2025-12-19"]],
);
insertRows(
  "seat_capacity",
  [
    "id",
    "school_year_id",
    "grade_level_code",
    "capacity",
    "source",
    "approved_owner",
    "refreshed_at",
  ],
  Array.from({ length: 9 }, (_, grade) => [
    `seat-capacity-${String(grade).padStart(2, "0")}`,
    "school-year-2025",
    String(grade).padStart(2, "0"),
    60 + (grade % 3) * 5,
    "approved-local-seed",
    "School Leadership",
    "2026-07-22T12:00:00.000Z",
  ]),
);

const studentRows = [];
const guardianStudentRows = [];
const enrollmentRows = [];
const attributeRows = [];
for (let index = 1; index <= 200; index += 1) {
  const padded = String(index).padStart(3, "0");
  const familyIndex = index <= 2 ? 1 : index - 1;
  const familyPadded = String(familyIndex).padStart(3, "0");
  studentRows.push([
    `student-${padded}`,
    String(100_000_000 + index),
    `L${String(index).padStart(8, "0")}`,
    String(200_000_000 + index),
    `Learner${padded}`,
    `Student${padded}`,
    `${2011 + (index % 5)}-${String((index % 12) + 1).padStart(2, "0")}-15`,
    index % 2 === 0 ? "F" : "M",
    index % 4 === 0 ? "03" : "05",
    index % 11 === 0 ? "ARA" : index % 13 === 0 ? "SOM" : "ENG",
    index % 11 === 0 ? "ARA" : index % 13 === 0 ? "SOM" : "ENG",
    "active",
  ]);
  guardianStudentRows.push([
    `guardian-student-${padded}`,
    `guardian-${familyPadded}`,
    `student-${padded}`,
    "parent",
    1,
    1,
    "active",
    "2025-07-01",
  ]);
  enrollmentRows.push([
    `enrollment-${padded}`,
    `student-${padded}`,
    "term-fall-2025",
    "2025-08-18",
    "1",
    "2025-08-18",
    "043786",
    "012345",
    "1",
    100,
    String(index % 9).padStart(2, "0"),
    "active",
  ]);
  attributeRows.push([
    `attribute-${padded}`,
    `student-${padded}`,
    "2025-08-18",
    String(index % 9).padStart(2, "0"),
    "1",
    index % 11 === 0 || index % 13 === 0 ? "Y" : "N",
    "**",
  ]);
}
guardianStudentRows.push(
  [
    "guardian-student-revoked",
    "guardian-001",
    "student-003",
    "parent",
    0,
    0,
    "revoked",
    "2025-07-01",
  ],
  [
    "guardian-student-expired",
    "guardian-001",
    "student-004",
    "parent",
    0,
    0,
    "active",
    "2025-07-01",
    "2025-08-01",
  ],
);
insertRows(
  "students",
  [
    "id",
    "emis_student_id",
    "local_use_id",
    "ssid",
    "legal_first_name",
    "legal_last_name",
    "birth_date",
    "gender_code",
    "race_ethnicity_code",
    "native_language_code",
    "home_language_code",
    "status",
  ],
  studentRows,
);
insertRows(
  "guardian_student_links",
  [
    "id",
    "guardian_id",
    "student_id",
    "relationship",
    "custody",
    "receives_contact",
    "status",
    "effective_start",
    "effective_end",
  ],
  guardianStudentRows.map((row) => (row.length === 8 ? [...row, null] : row)),
);
insertRows(
  "enrollments",
  [
    "id",
    "student_id",
    "term_id",
    "admission_date",
    "admission_reason_code",
    "effective_start",
    "legal_district_of_residence",
    "attending_building_irn",
    "district_relationship_code",
    "percent_of_time",
    "grade_level_code",
    "status",
  ],
  enrollmentRows,
);
insertRows(
  "student_attributes",
  [
    "id",
    "student_id",
    "effective_start",
    "grade_level_code",
    "attendance_pattern_code",
    "english_learner_code",
    "disability_condition_code",
  ],
  attributeRows,
);

const stages = ["inquiry", "contacted", "toured", "applied", "enrolled", "closed_not_proceeding"];
const prospectRows = [];
const leadRows = [];
const stageRows = [];
const activityRows = [];
const followUpRows = [];
const applicationRows = [];
const guardianApplicationRows = [];
for (let index = 1; index <= 30; index += 1) {
  const padded = String(index).padStart(3, "0");
  const stage = stages[(index - 1) % stages.length];
  prospectRows.push([
    `prospect-${padded}`,
    `family-${padded}`,
    `Applicant${padded}`,
    `Family${padded}`,
    String(index % 9).padStart(2, "0"),
  ]);
  leadRows.push([
    `lead-${padded}`,
    `family-${padded}`,
    `prospect-${padded}`,
    stage,
    staffUsers[2][0],
    index % 2 === 0 ? "community_event" : "website",
    index % 2 === 0 ? "summer-outreach" : "organic",
    familyRows[index - 1][1],
    index % 3 === 0 ? "2026-07-20T15:00:00.000Z" : "2026-07-24T15:00:00.000Z",
  ]);
  stageRows.push([
    `lead-stage-${padded}`,
    `lead-${padded}`,
    null,
    stage,
    staffUsers[2][0],
    "Deterministic local seed",
  ]);
  activityRows.push([
    `lead-activity-${padded}`,
    `lead-${padded}`,
    index % 2 === 0 ? "phone_call" : "email_stub",
    index % 3 === 0 ? "follow_up_needed" : "family_reached",
    "Synthetic local activity; no external delivery occurred.",
    staffUsers[2][0],
    index % 3 === 0 ? "2026-07-20T15:00:00.000Z" : "2026-07-24T15:00:00.000Z",
  ]);
  followUpRows.push([
    `follow-up-${padded}`,
    `lead-${padded}`,
    staffUsers[2][0],
    index % 3 === 0 ? "2026-07-20T15:00:00.000Z" : "2026-07-24T15:00:00.000Z",
    index % 5 === 0 ? "2026-07-21T14:00:00.000Z" : null,
    index % 5 === 0 ? "family_reached" : null,
  ]);

  if (stage === "applied" || stage === "enrolled") {
    applicationRows.push([
      `application-${padded}`,
      `lead-${padded}`,
      `prospect-${padded}`,
      stage === "enrolled" ? "accepted" : "submitted",
      "2025-09-10T14:00:00.000Z",
      `APP-${padded}`,
    ]);
    guardianApplicationRows.push([
      `guardian-application-${padded}`,
      `guardian-${padded}`,
      `application-${padded}`,
      "parent",
      "active",
      "2025-07-01",
    ]);
  }
}
insertRows(
  "prospective_students",
  ["id", "family_id", "first_name", "last_name", "grade_interest"],
  prospectRows,
);
insertRows(
  "leads",
  [
    "id",
    "family_id",
    "prospective_student_id",
    "stage",
    "owner_user_id",
    "source",
    "campaign",
    "preferred_locale",
    "due_at",
  ],
  leadRows,
);
insertRows(
  "lead_stage_history",
  ["id", "lead_id", "from_stage", "to_stage", "actor_user_id", "reason"],
  stageRows,
);
insertRows(
  "lead_activities",
  ["id", "lead_id", "type", "outcome", "safe_note", "actor_user_id", "next_action_at"],
  activityRows,
);
insertRows(
  "follow_up_tasks",
  ["id", "lead_id", "owner_user_id", "due_at", "completed_at", "outcome"],
  followUpRows,
);
insertRows(
  "duplicate_candidates",
  ["id", "lead_id", "candidate_lead_id", "signals", "state", "reviewer_user_id", "reviewed_at"],
  [
    [
      "duplicate-001",
      "lead-001",
      "lead-007",
      JSON.stringify(["normalized_phone", "guardian_name"]),
      "pending",
      null,
      null,
    ],
    [
      "duplicate-002",
      "lead-002",
      "lead-008",
      JSON.stringify(["normalized_email"]),
      "not_duplicate",
      staffUsers[2][0],
      "2026-07-21T16:00:00.000Z",
    ],
    [
      "duplicate-003",
      "lead-003",
      "lead-009",
      JSON.stringify(["normalized_phone", "address_fragment"]),
      "duplicate_confirmed",
      staffUsers[0][0],
      "2026-07-21T17:00:00.000Z",
    ],
  ],
);
insertRows(
  "applications",
  ["id", "lead_id", "prospective_student_id", "status", "submitted_at", "external_reference"],
  applicationRows,
);
insertRows(
  "guardian_application_links",
  ["id", "guardian_id", "application_id", "relationship", "status", "effective_start"],
  guardianApplicationRows,
);

const schoolDays = [];
for (let cursor = new Date("2025-08-18T12:00:00.000Z"); schoolDays.length < 45;) {
  if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) {
    schoolDays.push(cursor.toISOString().slice(0, 10));
  }
  cursor = new Date(cursor.getTime() + 86_400_000);
}
const attendanceRows = [];
for (let studentIndex = 1; studentIndex <= 200; studentIndex += 1) {
  const studentPadded = String(studentIndex).padStart(3, "0");
  for (let dayIndex = 0; dayIndex < schoolDays.length; dayIndex += 1) {
    const sequence = studentIndex + dayIndex;
    const status =
      sequence % 17 === 0 ? "absent_excused" : sequence % 11 === 0 ? "tardy_unexcused" : "present";
    const attendedMinutes =
      status === "absent_excused" ? 0 : status === "tardy_unexcused" ? 330 : 360;
    attendanceRows.push([
      `attendance-${studentPadded}-${String(dayIndex + 1).padStart(2, "0")}`,
      `student-${studentPadded}`,
      schoolDays[dayIndex],
      status,
      status === "absent_excused" ? "excused" : status === "tardy_unexcused" ? "unexcused" : "none",
      attendedMinutes,
      360 - attendedMinutes,
      staffUsers[3][0],
      "local-seed",
    ]);
  }
}
insertRows(
  "attendance_daily",
  [
    "id",
    "student_id",
    "attendance_date",
    "status",
    "absence_type",
    "attended_minutes",
    "absent_minutes",
    "marked_by_user_id",
    "source",
  ],
  attendanceRows,
  250,
);

insertRows(
  "system_metadata",
  ["key", "value"],
  [
    ["seed.version", "phase-3-v1"],
    ["seed.generated_at", "2025-08-18T00:00:00.000Z"],
  ],
);

const temporaryDirectory = await mkdtemp(join(tmpdir(), "uacohio-seed-"));
const seedFile = join(temporaryDirectory, "seed.sql");

try {
  await writeFile(seedFile, `${statements.join("\n")}\n`, "utf8");
  const result = spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "uacohio-local", "--local", "--file", seedFile],
    { encoding: "utf8", stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(`Local D1 seed failed with status ${result.status ?? "unknown"}.`);
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log(
  `Seeded 200 students, ${attendanceRows.length} attendance rows, ${leadRows.length} leads, and ${staffUsers.length + guardianUsers.length} login identities.`,
);
