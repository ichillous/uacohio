import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const currentTimestamp = sql`CURRENT_TIMESTAMP`;

export const systemMetadata = sqliteTable("system_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(currentTimestamp),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    audience: text("audience", { enum: ["staff", "guardian"] }).notNull(),
    displayName: text("display_name").notNull(),
    normalizedEmail: text("normalized_email"),
    locale: text("locale", { enum: ["en", "ar", "so"] })
      .notNull()
      .default("en"),
    status: text("status", { enum: ["active", "disabled"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("users_normalized_email_unique").on(table.normalizedEmail),
    index("users_audience_status_idx").on(table.audience, table.status),
    check("users_audience_check", sql`${table.audience} in ('staff', 'guardian')`),
  ],
);

export const authIdentities = sqliteTable(
  "auth_identities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["dev", "google"] }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("auth_identities_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
    index("auth_identities_user_idx").on(table.userId),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    provider: text("provider", { enum: ["dev", "google"] }).notNull(),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_expiry_idx").on(table.userId, table.expiresAt),
  ],
);

export const roles = sqliteTable("roles", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const permissions = sqliteTable("permissions", {
  key: text("key").primaryKey(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
});

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleKey: text("role_key")
      .notNull()
      .references(() => roles.key, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("role_permissions_pair_unique").on(table.roleKey, table.permissionKey),
    index("role_permissions_permission_idx").on(table.permissionKey),
  ],
);

export const staffProfiles = sqliteTable("staff_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const userRoleAssignments = sqliteTable(
  "user_role_assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleKey: text("role_key")
      .notNull()
      .references(() => roles.key, { onDelete: "restrict" }),
    assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    effectiveStart: text("effective_start").notNull(),
    effectiveEnd: text("effective_end"),
  },
  (table) => [
    uniqueIndex("user_role_assignments_effective_unique").on(
      table.userId,
      table.roleKey,
      table.effectiveStart,
    ),
    index("user_role_assignments_active_idx").on(table.userId, table.effectiveEnd),
  ],
);

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  preferredLocale: text("preferred_locale", { enum: ["en", "ar", "so"] })
    .notNull()
    .default("en"),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  createdAt: text("created_at").notNull().default(currentTimestamp),
  updatedAt: text("updated_at").notNull().default(currentTimestamp),
});

export const guardians = sqliteTable(
  "guardians",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    normalizedEmail: text("normalized_email"),
    normalizedPhone: text("normalized_phone"),
    contactPreference: text("contact_preference", { enum: ["email", "phone", "sms"] }),
    preferredLanguage: text("preferred_language", { enum: ["en", "ar", "so"] })
      .notNull()
      .default("en"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [index("guardians_family_idx").on(table.familyId)],
);

export const guardianAccounts = sqliteTable(
  "guardian_accounts",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "restrict" }),
    verifiedLinkState: text("verified_link_state", { enum: ["verified", "revoked"] })
      .notNull()
      .default("verified"),
    verifiedAt: text("verified_at"),
  },
  (table) => [uniqueIndex("guardian_accounts_guardian_unique").on(table.guardianId)],
);

export const prospectiveStudents = sqliteTable(
  "prospective_students",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    gradeInterest: text("grade_interest").notNull(),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [index("prospective_students_family_idx").on(table.familyId)],
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    prospectiveStudentId: text("prospective_student_id")
      .notNull()
      .references(() => prospectiveStudents.id, { onDelete: "restrict" }),
    stage: text("stage", {
      enum: ["inquiry", "contacted", "toured", "applied", "enrolled", "closed_not_proceeding"],
    })
      .notNull()
      .default("inquiry"),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    source: text("source").notNull(),
    campaign: text("campaign"),
    preferredLocale: text("preferred_locale", { enum: ["en", "ar", "so"] }).notNull(),
    dueAt: text("due_at"),
    version: integer("version").notNull().default(1),
    closedOutcome: text("closed_outcome"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [
    index("leads_stage_due_idx").on(table.stage, table.dueAt),
    index("leads_owner_idx").on(table.ownerUserId),
    index("leads_source_campaign_idx").on(table.source, table.campaign),
  ],
);

export const leadStageHistory = sqliteTable(
  "lead_stage_history",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    fromStage: text("from_stage"),
    toStage: text("to_stage").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [index("lead_stage_history_lead_idx").on(table.leadId, table.createdAt)],
);

export const leadActivities = sqliteTable(
  "lead_activities",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    outcome: text("outcome"),
    safeNote: text("safe_note"),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    nextActionAt: text("next_action_at"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [index("lead_activities_lead_idx").on(table.leadId, table.createdAt)],
);

export const followUpTasks = sqliteTable(
  "follow_up_tasks",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    dueAt: text("due_at").notNull(),
    completedAt: text("completed_at"),
    outcome: text("outcome"),
  },
  (table) => [index("follow_up_tasks_owner_due_idx").on(table.ownerUserId, table.dueAt)],
);

export const visitRequests = sqliteTable(
  "visit_requests",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    requestedAt: text("requested_at").notNull(),
    status: text("status", { enum: ["requested", "scheduled", "completed", "cancelled"] })
      .notNull()
      .default("requested"),
    safeNote: text("safe_note"),
  },
  (table) => [index("visit_requests_lead_idx").on(table.leadId)],
);

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "restrict" }),
    prospectiveStudentId: text("prospective_student_id")
      .notNull()
      .references(() => prospectiveStudents.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["draft", "submitted", "review", "accepted", "withdrawn"] })
      .notNull()
      .default("draft"),
    submittedAt: text("submitted_at"),
    externalReference: text("external_reference"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [uniqueIndex("applications_lead_unique").on(table.leadId)],
);

export const guardianApplicationLinks = sqliteTable(
  "guardian_application_links",
  {
    id: text("id").primaryKey(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull(),
    status: text("status", { enum: ["active", "revoked"] })
      .notNull()
      .default("active"),
    effectiveStart: text("effective_start").notNull(),
    effectiveEnd: text("effective_end"),
  },
  (table) => [
    uniqueIndex("guardian_application_links_effective_unique").on(
      table.guardianId,
      table.applicationId,
      table.effectiveStart,
    ),
    index("guardian_application_links_application_idx").on(table.applicationId, table.status),
  ],
);

export const consentRecords = sqliteTable(
  "consent_records",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    policyVersion: text("policy_version").notNull(),
    purpose: text("purpose").notNull(),
    choice: text("choice").notNull(),
    locale: text("locale", { enum: ["en", "ar", "so"] }).notNull(),
    requestContext: text("request_context").notNull(),
    consentedAt: text("consented_at").notNull(),
  },
  (table) => [index("consent_records_lead_idx").on(table.leadId)],
);

export const duplicateCandidates = sqliteTable(
  "duplicate_candidates",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    candidateLeadId: text("candidate_lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    signals: text("signals").notNull(),
    state: text("state", { enum: ["pending", "not_duplicate", "duplicate_confirmed"] })
      .notNull()
      .default("pending"),
    reviewerUserId: text("reviewer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    uniqueIndex("duplicate_candidates_pair_unique").on(table.leadId, table.candidateLeadId),
    index("duplicate_candidates_state_idx").on(table.state),
  ],
);

export const schoolYears = sqliteTable("school_years", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  current: integer("current", { mode: "boolean" }).notNull().default(false),
});

export const terms = sqliteTable(
  "terms",
  {
    id: text("id").primaryKey(),
    schoolYearId: text("school_year_id")
      .notNull()
      .references(() => schoolYears.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startsOn: text("starts_on").notNull(),
    endsOn: text("ends_on").notNull(),
  },
  (table) => [uniqueIndex("terms_year_name_unique").on(table.schoolYearId, table.name)],
);

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    prospectiveStudentId: text("prospective_student_id").references(() => prospectiveStudents.id, {
      onDelete: "set null",
    }),
    emisStudentId: text("emis_student_id").notNull(),
    localUseId: text("local_use_id"),
    ssid: text("ssid"),
    legalFirstName: text("legal_first_name").notNull(),
    legalMiddleName: text("legal_middle_name"),
    legalLastName: text("legal_last_name").notNull(),
    birthDate: text("birth_date").notNull(),
    genderCode: text("gender_code").notNull(),
    raceEthnicityCode: text("race_ethnicity_code").notNull(),
    nativeLanguageCode: text("native_language_code").notNull(),
    homeLanguageCode: text("home_language_code"),
    status: text("status", { enum: ["active", "withdrawn", "graduated"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("students_emis_student_id_unique").on(table.emisStudentId),
    uniqueIndex("students_local_use_id_unique").on(table.localUseId),
    uniqueIndex("students_ssid_unique").on(table.ssid),
    index("students_status_name_idx").on(table.status, table.legalLastName, table.legalFirstName),
  ],
);

export const guardianStudentLinks = sqliteTable(
  "guardian_student_links",
  {
    id: text("id").primaryKey(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull(),
    custody: integer("custody", { mode: "boolean" }).notNull().default(false),
    receivesContact: integer("receives_contact", { mode: "boolean" }).notNull().default(true),
    status: text("status", { enum: ["active", "revoked"] })
      .notNull()
      .default("active"),
    effectiveStart: text("effective_start").notNull(),
    effectiveEnd: text("effective_end"),
  },
  (table) => [
    uniqueIndex("guardian_student_links_effective_unique").on(
      table.guardianId,
      table.studentId,
      table.effectiveStart,
    ),
    index("guardian_student_links_student_idx").on(table.studentId, table.status),
  ],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    termId: text("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "restrict" }),
    admissionDate: text("admission_date").notNull(),
    admissionReasonCode: text("admission_reason_code").notNull(),
    admittedFromIrn: text("admitted_from_irn"),
    effectiveStart: text("effective_start").notNull(),
    effectiveEnd: text("effective_end"),
    legalDistrictOfResidence: text("legal_district_of_residence").notNull(),
    attendingBuildingIrn: text("attending_building_irn").notNull(),
    assignedBuildingAreaIrn: text("assigned_building_area_irn"),
    districtRelationshipCode: text("district_relationship_code").notNull(),
    percentOfTime: integer("percent_of_time").notNull().default(100),
    gradeLevelCode: text("grade_level_code").notNull(),
    withdrawalReasonCode: text("withdrawal_reason_code"),
    withdrawnToIrn: text("withdrawn_to_irn"),
    status: text("status", { enum: ["active", "withdrawn", "completed"] })
      .notNull()
      .default("active"),
  },
  (table) => [
    uniqueIndex("enrollments_student_term_start_unique").on(
      table.studentId,
      table.termId,
      table.effectiveStart,
    ),
    index("enrollments_term_status_idx").on(table.termId, table.status),
    check("enrollments_percent_of_time_check", sql`${table.percentOfTime} between 0 and 100`),
  ],
);

export const studentAttributes = sqliteTable(
  "student_attributes",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    effectiveStart: text("effective_start").notNull(),
    effectiveEnd: text("effective_end"),
    gradeLevelCode: text("grade_level_code").notNull(),
    attendancePatternCode: text("attendance_pattern_code").notNull(),
    englishLearnerCode: text("english_learner_code").notNull(),
    disabilityConditionCode: text("disability_condition_code").notNull().default("**"),
  },
  (table) => [
    uniqueIndex("student_attributes_effective_unique").on(table.studentId, table.effectiveStart),
  ],
);

export const attendanceDaily = sqliteTable(
  "attendance_daily",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    attendanceDate: text("attendance_date").notNull(),
    status: text("status", {
      enum: [
        "present",
        "absent_excused",
        "absent_unexcused",
        "tardy_excused",
        "tardy_unexcused",
        "partial",
      ],
    }).notNull(),
    absenceType: text("absence_type", { enum: ["none", "excused", "unexcused"] })
      .notNull()
      .default("none"),
    attendedMinutes: integer("attended_minutes").notNull(),
    absentMinutes: integer("absent_minutes").notNull(),
    safeNote: text("safe_note"),
    markedByUserId: text("marked_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: text("source").notNull().default("local"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("attendance_daily_student_date_unique").on(table.studentId, table.attendanceDate),
    index("attendance_daily_date_status_idx").on(table.attendanceDate, table.status),
    check(
      "attendance_daily_minutes_check",
      sql`${table.attendedMinutes} >= 0 and ${table.absentMinutes} >= 0`,
    ),
  ],
);

export const seatCapacity = sqliteTable(
  "seat_capacity",
  {
    id: text("id").primaryKey(),
    schoolYearId: text("school_year_id")
      .notNull()
      .references(() => schoolYears.id, { onDelete: "cascade" }),
    gradeLevelCode: text("grade_level_code").notNull(),
    capacity: integer("capacity").notNull(),
    source: text("source").notNull(),
    approvedOwner: text("approved_owner").notNull(),
    refreshedAt: text("refreshed_at").notNull(),
  },
  (table) => [
    uniqueIndex("seat_capacity_year_grade_unique").on(table.schoolYearId, table.gradeLevelCode),
  ],
);

export const studentDocuments = sqliteTable(
  "student_documents",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mediaType: text("media_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: text("checksum").notNull(),
    uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("student_documents_object_key_unique").on(table.objectKey),
    index("student_documents_student_idx").on(table.studentId),
  ],
);

export const documentShares = sqliteTable(
  "document_shares",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => studentDocuments.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    sharedByUserId: text("shared_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sharedAt: text("shared_at").notNull(),
    revokedAt: text("revoked_at"),
  },
  (table) => [
    uniqueIndex("document_shares_guardian_document_unique").on(table.documentId, table.guardianId),
  ],
);

export const guardianProfileUpdateRequests = sqliteTable(
  "guardian_profile_update_requests",
  {
    id: text("id").primaryKey(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "restrict" }),
    requestedChanges: text("requested_changes").notNull(),
    state: text("state", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    reviewerUserId: text("reviewer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decisionNote: text("decision_note"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    decidedAt: text("decided_at"),
  },
  (table) => [index("guardian_profile_requests_state_idx").on(table.state)],
);

export const messageThreads = sqliteTable(
  "message_threads",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    state: text("state", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [index("message_threads_family_idx").on(table.familyId, table.updatedAt)],
);

export const threadParticipants = sqliteTable(
  "thread_participants",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    staffUserId: text("staff_user_id").references(() => users.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id").references(() => guardians.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["active", "removed"] })
      .notNull()
      .default("active"),
    lastReadAt: text("last_read_at"),
  },
  (table) => [index("thread_participants_thread_idx").on(table.threadId, table.status)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    originalBody: text("original_body").notNull(),
    originalLocale: text("original_locale", { enum: ["en", "ar", "so"] }).notNull(),
    reviewedTranslation: text("reviewed_translation"),
    translatedLocale: text("translated_locale", { enum: ["en", "ar", "so"] }),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [index("messages_thread_created_idx").on(table.threadId, table.createdAt)],
);

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
  translationGroupId: text("translation_group_id").notNull(),
  locale: text("locale", { enum: ["en", "ar", "so"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  publishedAt: text("published_at"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(currentTimestamp),
  updatedAt: text("updated_at").notNull().default(currentTimestamp),
});

export const announcementTargets = sqliteTable(
  "announcement_targets",
  {
    id: text("id").primaryKey(),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    targetType: text("target_type", {
      enum: ["all_families", "grade", "family", "student", "guardian"],
    }).notNull(),
    targetId: text("target_id"),
  },
  (table) => [index("announcement_targets_lookup_idx").on(table.targetType, table.targetId)],
);

export const notificationIntents = sqliteTable(
  "notification_intents",
  {
    id: text("id").primaryKey(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    templateVersion: text("template_version").notNull(),
    locale: text("locale", { enum: ["en", "ar", "so"] }).notNull(),
    channel: text("channel", { enum: ["in_app", "email_stub", "sms_stub"] }).notNull(),
    recipientReference: text("recipient_reference").notNull(),
    state: text("state", { enum: ["queued", "sent", "failed"] })
      .notNull()
      .default("queued"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [
    index("notification_intents_aggregate_idx").on(table.aggregateType, table.aggregateId),
  ],
);

export const notificationAttempts = sqliteTable(
  "notification_attempts",
  {
    id: text("id").primaryKey(),
    intentId: text("intent_id")
      .notNull()
      .references(() => notificationIntents.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    provider: text("provider").notNull().default("fake"),
    result: text("result").notNull(),
    attemptedAt: text("attempted_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("notification_attempts_number_unique").on(table.intentId, table.attemptNumber),
  ],
);

export const outboxJobs = sqliteTable(
  "outbox_jobs",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payloadReference: text("payload_reference").notNull(),
    state: text("state", { enum: ["pending", "processing", "completed", "failed"] })
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: text("available_at").notNull(),
    lockedAt: text("locked_at"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: text("created_at").notNull().default(currentTimestamp),
    updatedAt: text("updated_at").notNull().default(currentTimestamp),
  },
  (table) => [
    uniqueIndex("outbox_jobs_idempotency_unique").on(table.idempotencyKey),
    index("outbox_jobs_claim_idx").on(table.state, table.availableAt),
  ],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorAudience: text("actor_audience", { enum: ["staff", "guardian", "system"] }).notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    correlationId: text("correlation_id").notNull(),
    outcome: text("outcome", { enum: ["success", "denied", "failed"] }).notNull(),
    changedFields: text("changed_fields").notNull().default("[]"),
    createdAt: text("created_at").notNull().default(currentTimestamp),
  },
  (table) => [
    index("audit_events_target_idx").on(table.targetType, table.targetId, table.createdAt),
    index("audit_events_actor_idx").on(table.actorUserId, table.createdAt),
  ],
);
