import { requireStaffPermission } from "@/modules/auth/authorization";
import type { PortalSession } from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";
import type {
  CreateEnrollmentInput,
  CreateGuardianLinkInput,
  CreateStudentInput,
  UpdateGuardianLinkInput,
  UpdateStudentInput,
  WithdrawEnrollmentInput,
} from "./schemas";

type MutationContext = { actorUserId?: string; id?: () => string; now?: string };
type StudentProjection = "applicant" | "full";

export type StudentSummary = {
  emisStudentId?: string;
  gradeLevelCode: string | null;
  id: string;
  legalFirstName: string;
  legalLastName: string;
  localUseId?: string | null;
  projection: StudentProjection;
  status: "active" | "graduated" | "withdrawn";
  updatedAt: string;
};

function mutationValues(context: MutationContext, session: PortalSession) {
  return {
    actorUserId: context.actorUserId ?? session.user.id,
    id: context.id ?? (() => crypto.randomUUID()),
    now: context.now ?? new Date().toISOString(),
  };
}

function changes(result: D1Result<unknown> | undefined): number {
  return Number((result?.meta as { changes?: number } | undefined)?.changes ?? 0);
}

function readProjection(session: PortalSession | null): {
  projection: StudentProjection;
  session: PortalSession;
} {
  if (session?.permissions.includes("students.view")) {
    return { projection: "full", session: requireStaffPermission(session, "students.view") };
  }
  return {
    projection: "applicant",
    session: requireStaffPermission(session, "students.view_applicant_projection"),
  };
}

function conflictGuard(database: D1Database, suffix: string) {
  return database
    .prepare(
      `INSERT INTO students (
         id, emis_student_id, legal_first_name, legal_last_name, birth_date,
         gender_code, race_ethnicity_code, native_language_code, status
       )
       SELECT ?, 'invalid', 'Conflict', 'Guard', '2000-01-01', 'U', '00', 'EN', 'active'
       WHERE changes() <> 1`,
    )
    .bind(`student-version-conflict-${suffix}`);
}

function isConflictGuardError(error: unknown): boolean {
  return /student identifiers must be nine characters/i.test(
    error instanceof Error ? error.message : String(error),
  );
}

export async function listStudents(
  database: D1Database,
  portalSession: PortalSession | null,
  filters: { limit: number; q?: string; status?: "active" | "graduated" | "withdrawn" },
): Promise<StudentSummary[]> {
  const { projection, session } = readProjection(portalSession);
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  const joins =
    projection === "applicant"
      ? `INNER JOIN prospective_students ON prospective_students.id = students.prospective_student_id
         INNER JOIN leads ON leads.prospective_student_id = prospective_students.id`
      : "";
  if (projection === "applicant") {
    conditions.push("leads.owner_user_id = ?");
    bindings.push(session.user.id);
  }
  if (filters.status) {
    conditions.push("students.status = ?");
    bindings.push(filters.status);
  }
  if (filters.q) {
    const fields = ["students.legal_first_name", "students.legal_last_name"];
    if (projection === "full") {
      fields.push("students.emis_student_id", "students.local_use_id");
    }
    conditions.push(`(${fields.map((field) => `${field} LIKE ?`).join(" OR ")})`);
    bindings.push(...fields.map(() => `%${filters.q}%`));
  }
  const identifiers =
    projection === "full"
      ? `students.emis_student_id AS emisStudentId,
         students.local_use_id AS localUseId,`
      : "";
  const result = await database
    .prepare(
      `SELECT DISTINCT
         students.id,
         students.legal_first_name AS legalFirstName,
         students.legal_last_name AS legalLastName,
         students.status,
         students.updated_at AS updatedAt,
         ${identifiers}
         (SELECT enrollments.grade_level_code
            FROM enrollments
           WHERE enrollments.student_id = students.id
           ORDER BY CASE enrollments.status WHEN 'active' THEN 0 ELSE 1 END,
                    enrollments.effective_start DESC
           LIMIT 1) AS gradeLevelCode
       FROM students
       ${joins}
       ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY students.legal_last_name, students.legal_first_name, students.id
       LIMIT ?`,
    )
    .bind(...bindings, filters.limit)
    .all<Omit<StudentSummary, "projection">>();
  return result.results.map((student) => ({ ...student, projection }));
}

export async function getStudentDetail(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
) {
  const { projection, session } = readProjection(portalSession);
  if (projection === "applicant") {
    const student = await database
      .prepare(
        `SELECT students.id,
                students.legal_first_name AS legalFirstName,
                students.legal_last_name AS legalLastName,
                students.status,
                students.updated_at AS updatedAt,
                enrollments.grade_level_code AS gradeLevelCode
           FROM students
           INNER JOIN prospective_students
             ON prospective_students.id = students.prospective_student_id
           INNER JOIN leads ON leads.prospective_student_id = prospective_students.id
           LEFT JOIN enrollments
             ON enrollments.id = (
               SELECT id FROM enrollments AS current_enrollment
                WHERE current_enrollment.student_id = students.id
                ORDER BY CASE current_enrollment.status WHEN 'active' THEN 0 ELSE 1 END,
                         current_enrollment.effective_start DESC LIMIT 1
             )
          WHERE students.id = ? AND leads.owner_user_id = ?
          LIMIT 1`,
      )
      .bind(studentId, session.user.id)
      .first<Record<string, unknown>>();
    if (!student) throw new StaffApiError(404, "NOT_FOUND", "Student not found.");
    return { attributes: [], documents: [], enrollments: [], guardians: [], projection, student };
  }

  const student = await database
    .prepare(
      `SELECT id,
              prospective_student_id AS prospectiveStudentId,
              emis_student_id AS emisStudentId,
              local_use_id AS localUseId,
              legal_first_name AS legalFirstName,
              legal_middle_name AS legalMiddleName,
              legal_last_name AS legalLastName,
              birth_date AS birthDate,
              gender_code AS genderCode,
              race_ethnicity_code AS raceEthnicityCode,
              native_language_code AS nativeLanguageCode,
              home_language_code AS homeLanguageCode,
              status,
              created_at AS createdAt,
              updated_at AS updatedAt
         FROM students WHERE id = ? LIMIT 1`,
    )
    .bind(studentId)
    .first<Record<string, unknown>>();
  if (!student) throw new StaffApiError(404, "NOT_FOUND", "Student not found.");

  const [guardians, enrollments, attributes, documents] = await Promise.all([
    database
      .prepare(
        `SELECT guardian_student_links.id AS linkId,
                guardian_student_links.relationship,
                guardian_student_links.custody,
                guardian_student_links.receives_contact AS receivesContact,
                guardian_student_links.effective_start AS effectiveStart,
                guardians.id,
                guardians.family_id AS familyId,
                guardians.first_name AS firstName,
                guardians.last_name AS lastName,
                guardians.normalized_email AS normalizedEmail,
                guardians.normalized_phone AS normalizedPhone,
                guardians.contact_preference AS contactPreference,
                guardians.preferred_language AS preferredLanguage,
                guardians.updated_at AS updatedAt,
                families.preferred_locale AS familyPreferredLocale
           FROM guardian_student_links
           INNER JOIN guardians ON guardians.id = guardian_student_links.guardian_id
           INNER JOIN families ON families.id = guardians.family_id
          WHERE guardian_student_links.student_id = ?
            AND guardian_student_links.status = 'active'
            AND (guardian_student_links.effective_end IS NULL
                 OR guardian_student_links.effective_end >= date('now'))
          ORDER BY guardian_student_links.receives_contact DESC, guardians.last_name`,
      )
      .bind(studentId)
      .all<Record<string, unknown>>(),
    database
      .prepare(
        `SELECT enrollments.id,
                enrollments.term_id AS termId,
                school_years.name AS schoolYear,
                terms.name AS term,
                enrollments.admission_date AS admissionDate,
                enrollments.admission_reason_code AS admissionReasonCode,
                enrollments.admitted_from_irn AS admittedFromIrn,
                enrollments.effective_start AS effectiveStart,
                enrollments.effective_end AS effectiveEnd,
                enrollments.legal_district_of_residence AS legalDistrictOfResidence,
                enrollments.attending_building_irn AS attendingBuildingIrn,
                enrollments.assigned_building_area_irn AS assignedBuildingAreaIrn,
                enrollments.district_relationship_code AS districtRelationshipCode,
                enrollments.percent_of_time AS percentOfTime,
                enrollments.grade_level_code AS gradeLevelCode,
                enrollments.withdrawal_reason_code AS withdrawalReasonCode,
                enrollments.withdrawn_to_irn AS withdrawnToIrn,
                enrollments.status
           FROM enrollments
           INNER JOIN terms ON terms.id = enrollments.term_id
           INNER JOIN school_years ON school_years.id = terms.school_year_id
          WHERE enrollments.student_id = ?
          ORDER BY enrollments.effective_start DESC`,
      )
      .bind(studentId)
      .all<Record<string, unknown>>(),
    database
      .prepare(
        `SELECT id,
                effective_start AS effectiveStart,
                effective_end AS effectiveEnd,
                grade_level_code AS gradeLevelCode,
                attendance_pattern_code AS attendancePatternCode,
                english_learner_code AS englishLearnerCode,
                disability_condition_code AS disabilityConditionCode
           FROM student_attributes
          WHERE student_id = ?
          ORDER BY effective_start DESC`,
      )
      .bind(studentId)
      .all<Record<string, unknown>>(),
    database
      .prepare(
        `SELECT id, type, object_key AS objectKey, original_filename AS originalFilename,
                media_type AS mediaType, size_bytes AS sizeBytes, checksum,
                uploaded_by_user_id AS uploadedByUserId, created_at AS createdAt
           FROM student_documents
          WHERE student_id = ?
          ORDER BY created_at DESC`,
      )
      .bind(studentId)
      .all<Record<string, unknown>>(),
  ]);
  return {
    attributes: attributes.results,
    documents: documents.results,
    enrollments: enrollments.results,
    guardians: guardians.results.map((guardian) => ({
      ...guardian,
      custody: Boolean(guardian.custody),
      receivesContact: Boolean(guardian.receivesContact),
    })),
    projection,
    student,
  };
}

export async function createStudent(
  database: D1Database,
  portalSession: PortalSession | null,
  input: CreateStudentInput,
  context: MutationContext = {},
) {
  const session = requireStaffPermission(portalSession, "students.create");
  const { actorUserId, id, now } = mutationValues(context, session);
  const studentId = id();
  const correlationId = id();
  await database.batch([
    database
      .prepare(
        `INSERT INTO students (
           id, prospective_student_id, emis_student_id, local_use_id, ssid,
           legal_first_name, legal_middle_name, legal_last_name, birth_date,
           gender_code, race_ethnicity_code, native_language_code, home_language_code,
           status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        studentId,
        input.prospectiveStudentId ?? null,
        input.emisStudentId,
        input.localUseId ?? null,
        input.ssid ?? null,
        input.legalFirstName,
        input.legalMiddleName ?? null,
        input.legalLastName,
        input.birthDate,
        input.genderCode,
        input.raceEthnicityCode,
        input.nativeLanguageCode,
        input.homeLanguageCode ?? null,
        input.status,
        now,
        now,
      ),
    database
      .prepare(
        `INSERT INTO audit_events (
           id, actor_user_id, actor_audience, action, target_type, target_id,
           correlation_id, outcome, changed_fields, created_at
         ) VALUES (?, ?, 'staff', 'student.created', 'student', ?, ?, 'success', ?, ?)`,
      )
      .bind(
        id(),
        actorUserId,
        studentId,
        correlationId,
        JSON.stringify([
          "emisStudentId",
          "localUseId",
          "ssid",
          "legalName",
          "birthDate",
          "demographics",
          "status",
        ]),
        now,
      ),
  ]);
  return { id: studentId };
}

export async function updateStudent(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  input: UpdateStudentInput,
  context: MutationContext = {},
) {
  const session = requireStaffPermission(portalSession, "students.update");
  const { actorUserId, id, now } = mutationValues(context, session);
  const fieldMap: Record<string, string> = {
    birthDate: "birth_date",
    emisStudentId: "emis_student_id",
    genderCode: "gender_code",
    homeLanguageCode: "home_language_code",
    legalFirstName: "legal_first_name",
    legalLastName: "legal_last_name",
    legalMiddleName: "legal_middle_name",
    localUseId: "local_use_id",
    nativeLanguageCode: "native_language_code",
    raceEthnicityCode: "race_ethnicity_code",
    ssid: "ssid",
    status: "status",
  };
  const changedFields = Object.keys(input).filter((key) => key !== "updatedAt");
  const assignments = changedFields.map((key) => `${fieldMap[key]} = ?`);
  const bindings = changedFields.map((key) => input[key as keyof UpdateStudentInput]);
  const correlationId = id();
  const results = await database.batch([
    database
      .prepare(
        `UPDATE students SET ${assignments.join(", ")}, updated_at = ?
          WHERE id = ? AND updated_at = ?`,
      )
      .bind(...bindings, now, studentId, input.updatedAt),
    database
      .prepare(
        `INSERT INTO audit_events (
           id, actor_user_id, actor_audience, action, target_type, target_id,
           correlation_id, outcome, changed_fields, created_at
         ) SELECT ?, ?, 'staff', 'student.updated', 'student', ?, ?, 'success', ?, ?
           WHERE changes() = 1`,
      )
      .bind(id(), actorUserId, studentId, correlationId, JSON.stringify(changedFields), now),
  ]);
  if (changes(results[0]) !== 1) {
    throw new StaffApiError(
      409,
      "VERSION_CONFLICT",
      "This student changed. Refresh and try again.",
    );
  }
  return { id: studentId, updatedAt: now };
}

export async function createGuardianLink(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  input: CreateGuardianLinkInput,
  context: MutationContext = {},
) {
  const session = requireStaffPermission(portalSession, "students.update");
  const { actorUserId, id, now } = mutationValues(context, session);
  const guardianId = id();
  const linkId = id();
  const correlationId = id();
  await database.batch([
    database
      .prepare(
        `INSERT INTO guardians (
           id, family_id, first_name, last_name, normalized_email, normalized_phone,
           contact_preference, preferred_language, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        guardianId,
        input.familyId,
        input.firstName,
        input.lastName,
        input.normalizedEmail ?? null,
        input.normalizedPhone ?? null,
        input.contactPreference ?? null,
        input.preferredLanguage,
        now,
        now,
      ),
    database
      .prepare(
        `INSERT INTO guardian_student_links (
           id, guardian_id, student_id, relationship, custody, receives_contact,
           status, effective_start
         ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      )
      .bind(
        linkId,
        guardianId,
        studentId,
        input.relationship,
        input.custody ? 1 : 0,
        input.receivesContact ? 1 : 0,
        input.effectiveStart,
      ),
    database
      .prepare(
        `INSERT INTO audit_events (
           id, actor_user_id, actor_audience, action, target_type, target_id,
           correlation_id, outcome, changed_fields, created_at
         ) VALUES (?, ?, 'staff', 'student.guardian_link.created', 'student', ?, ?, 'success', ?, ?)`,
      )
      .bind(
        id(),
        actorUserId,
        studentId,
        correlationId,
        JSON.stringify(["guardian", "relationship", "custody", "receivesContact"]),
        now,
      ),
  ]);
  return { guardianId, linkId };
}

export async function updateGuardianLink(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  linkId: string,
  input: UpdateGuardianLinkInput,
  context: MutationContext = {},
) {
  const session = requireStaffPermission(portalSession, "students.update");
  const { actorUserId, id, now } = mutationValues(context, session);
  const guardianMap: Record<string, string> = {
    contactPreference: "contact_preference",
    firstName: "first_name",
    lastName: "last_name",
    normalizedEmail: "normalized_email",
    normalizedPhone: "normalized_phone",
    preferredLanguage: "preferred_language",
  };
  const linkMap: Record<string, string> = {
    custody: "custody",
    receivesContact: "receives_contact",
    relationship: "relationship",
    status: "status",
  };
  const guardianFields = Object.keys(input).filter((key) => key in guardianMap);
  const linkFields = Object.keys(input).filter((key) => key in linkMap);
  const guardianAssignments = [
    ...guardianFields.map((key) => `${guardianMap[key]} = ?`),
    "updated_at = ?",
  ];
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `UPDATE guardians
            SET ${guardianAssignments.join(", ")}
          WHERE id = (
            SELECT guardian_id FROM guardian_student_links
             WHERE id = ? AND student_id = ? AND status = 'active'
          ) AND updated_at = ?`,
      )
      .bind(
        ...guardianFields.map((key) => input[key as keyof UpdateGuardianLinkInput]),
        now,
        linkId,
        studentId,
        input.expectedUpdatedAt,
      ),
    conflictGuard(database, id()),
  ];
  if (linkFields.length > 0) {
    statements.push(
      database
        .prepare(
          `UPDATE guardian_student_links
              SET ${linkFields.map((key) => `${linkMap[key]} = ?`).join(", ")},
                  effective_end = CASE WHEN ? = 'revoked' THEN ? ELSE effective_end END
            WHERE id = ? AND student_id = ? AND status = 'active'`,
        )
        .bind(
          ...linkFields.map((key) => {
            const value = input[key as keyof UpdateGuardianLinkInput];
            return typeof value === "boolean" ? (value ? 1 : 0) : value;
          }),
          input.status ?? null,
          now.slice(0, 10),
          linkId,
          studentId,
        ),
      conflictGuard(database, id()),
    );
  }
  statements.push(
    database
      .prepare(
        `INSERT INTO audit_events (
           id, actor_user_id, actor_audience, action, target_type, target_id,
           correlation_id, outcome, changed_fields, created_at
         ) VALUES (?, ?, 'staff', 'student.guardian_link.updated', 'student', ?, ?, 'success', ?, ?)`,
      )
      .bind(
        id(),
        actorUserId,
        studentId,
        id(),
        JSON.stringify([...guardianFields, ...linkFields]),
        now,
      ),
  );
  try {
    await database.batch(statements);
  } catch (error) {
    if (isConflictGuardError(error)) {
      throw new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "This guardian link changed. Refresh and try again.",
      );
    }
    throw error;
  }
  return { id: linkId, updatedAt: now };
}

async function requireEnrollmentMutationScope(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  enrollmentId?: string,
) {
  const session = requireStaffPermission(portalSession, "enrollment.update");
  const fullAccess = session.permissions.includes("students.view");
  if (!fullAccess) {
    requireStaffPermission(session, "students.view_applicant_projection");
  }
  const enrollmentJoin = enrollmentId
    ? "INNER JOIN enrollments ON enrollments.student_id = students.id AND enrollments.id = ?"
    : "";
  const bindings: unknown[] = enrollmentId ? [enrollmentId, studentId] : [studentId];
  const applicantScope = fullAccess
    ? ""
    : `AND EXISTS (
         SELECT 1 FROM leads
          WHERE leads.prospective_student_id = students.prospective_student_id
            AND leads.owner_user_id = ?
       )`;
  if (!fullAccess) bindings.push(session.user.id);
  const visible = await database
    .prepare(
      `SELECT students.id
         FROM students
         ${enrollmentJoin}
        WHERE students.id = ? ${applicantScope}
        LIMIT 1`,
    )
    .bind(...bindings)
    .first<{ id: string }>();
  if (!visible) {
    throw new StaffApiError(404, "NOT_FOUND", "Student enrollment record not found.");
  }
  return { fullAccess, session };
}

export async function createEnrollment(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  input: CreateEnrollmentInput,
  context: MutationContext = {},
) {
  const { fullAccess, session } = await requireEnrollmentMutationScope(
    database,
    portalSession,
    studentId,
  );
  const { actorUserId, id, now } = mutationValues(context, session);
  const enrollmentId = id();
  const applicantMutationScope = fullAccess
    ? "1 = 1"
    : `EXISTS (
         SELECT 1 FROM leads
          WHERE leads.prospective_student_id = students.prospective_student_id
            AND leads.owner_user_id = ?
       )`;
  try {
    await database.batch([
      database
        .prepare(
          `INSERT INTO enrollments (
             id, student_id, term_id, admission_date, admission_reason_code,
             admitted_from_irn, effective_start, legal_district_of_residence,
             attending_building_irn, assigned_building_area_irn, district_relationship_code,
             percent_of_time, grade_level_code, status
           )
           SELECT ?, students.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active'
             FROM students
            WHERE students.id = ? AND ${applicantMutationScope}`,
        )
        .bind(
          enrollmentId,
          input.termId,
          input.admissionDate,
          input.admissionReasonCode,
          input.admittedFromIrn ?? null,
          input.effectiveStart,
          input.legalDistrictOfResidence,
          input.attendingBuildingIrn,
          input.assignedBuildingAreaIrn ?? null,
          input.districtRelationshipCode,
          input.percentOfTime,
          input.gradeLevelCode,
          studentId,
          ...(fullAccess ? [] : [session.user.id]),
        ),
      conflictGuard(database, id()),
      database
        .prepare("UPDATE students SET status = 'active', updated_at = ? WHERE id = ?")
        .bind(now, studentId),
      database
        .prepare(
          `INSERT INTO audit_events (
             id, actor_user_id, actor_audience, action, target_type, target_id,
             correlation_id, outcome, changed_fields, created_at
           ) VALUES (?, ?, 'staff', 'student.enrollment.created', 'enrollment', ?, ?, 'success', ?, ?)`,
        )
        .bind(
          id(),
          actorUserId,
          enrollmentId,
          id(),
          JSON.stringify(["termId", "admissionDate", "codes", "gradeLevelCode", "percentOfTime"]),
          now,
        ),
    ]);
  } catch (error) {
    if (isConflictGuardError(error)) {
      throw new StaffApiError(404, "NOT_FOUND", "Student enrollment record not found.");
    }
    throw error;
  }
  return { id: enrollmentId };
}

export async function withdrawEnrollment(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  enrollmentId: string,
  input: WithdrawEnrollmentInput,
  context: MutationContext = {},
) {
  const { fullAccess, session } = await requireEnrollmentMutationScope(
    database,
    portalSession,
    studentId,
    enrollmentId,
  );
  const { actorUserId, id, now } = mutationValues(context, session);
  const applicantMutationScope = fullAccess
    ? "1 = 1"
    : `EXISTS (
         SELECT 1 FROM students
         INNER JOIN leads ON leads.prospective_student_id = students.prospective_student_id
          WHERE students.id = enrollments.student_id AND leads.owner_user_id = ?
       )`;
  try {
    await database.batch([
      database
        .prepare(
          `UPDATE enrollments
              SET effective_end = ?, withdrawal_reason_code = ?, withdrawn_to_irn = ?,
                  status = 'withdrawn'
            WHERE id = ? AND student_id = ? AND status = 'active' AND effective_start = ?
              AND ${applicantMutationScope}`,
        )
        .bind(
          input.effectiveEnd,
          input.withdrawalReasonCode,
          input.withdrawnToIrn ?? null,
          enrollmentId,
          studentId,
          input.expectedEffectiveStart,
          ...(fullAccess ? [] : [session.user.id]),
        ),
      conflictGuard(database, id()),
      database
        .prepare(
          `UPDATE students SET status = 'withdrawn', updated_at = ?
            WHERE id = ?
              AND NOT EXISTS (
                SELECT 1 FROM enrollments
                 WHERE student_id = ? AND status = 'active'
              )`,
        )
        .bind(now, studentId, studentId),
      database
        .prepare(
          `INSERT INTO audit_events (
             id, actor_user_id, actor_audience, action, target_type, target_id,
             correlation_id, outcome, changed_fields, created_at
           ) VALUES (?, ?, 'staff', 'student.enrollment.withdrawn', 'enrollment', ?, ?, 'success', ?, ?)`,
        )
        .bind(
          id(),
          actorUserId,
          enrollmentId,
          id(),
          JSON.stringify(["effectiveEnd", "withdrawalReasonCode", "withdrawnToIrn", "status"]),
          now,
        ),
    ]);
  } catch (error) {
    if (isConflictGuardError(error)) {
      throw new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "This enrollment changed. Refresh and try again.",
      );
    }
    throw error;
  }
  return { id: enrollmentId, status: "withdrawn" as const };
}
