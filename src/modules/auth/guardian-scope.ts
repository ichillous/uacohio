import type { PortalSession } from "./types";

export type GuardianStudentProjection = {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  status: string;
};

export type GuardianApplicationProjection = {
  id: string;
  status: string;
  prospectiveStudentId: string;
};

export interface GuardianScopeStore<TStudent, TApplication> {
  findStudentForUser(userId: string, studentId: string): Promise<TStudent | null>;
  findApplicationForUser(userId: string, applicationId: string): Promise<TApplication | null>;
}

export class ResourceNotFoundError extends Error {
  readonly status = 404;

  constructor() {
    super("Resource not found.");
    this.name = "ResourceNotFoundError";
  }
}

function requireGuardianSession(session: PortalSession | null): PortalSession {
  if (!session || session.audience !== "guardian" || session.role !== null) {
    throw new ResourceNotFoundError();
  }

  return session;
}

export async function requireGuardianStudent<TStudent, TApplication>(
  session: PortalSession | null,
  studentId: string,
  store: GuardianScopeStore<TStudent, TApplication>,
): Promise<TStudent> {
  const guardianSession = requireGuardianSession(session);
  const student = await store.findStudentForUser(guardianSession.user.id, studentId);

  if (!student) {
    throw new ResourceNotFoundError();
  }

  return student;
}

export async function requireGuardianApplication<TStudent, TApplication>(
  session: PortalSession | null,
  applicationId: string,
  store: GuardianScopeStore<TStudent, TApplication>,
): Promise<TApplication> {
  const guardianSession = requireGuardianSession(session);
  const application = await store.findApplicationForUser(guardianSession.user.id, applicationId);

  if (!application) {
    throw new ResourceNotFoundError();
  }

  return application;
}

export function createD1GuardianScopeStore(
  database: D1Database,
  now = new Date(),
): GuardianScopeStore<GuardianStudentProjection, GuardianApplicationProjection> {
  const today = now.toISOString().slice(0, 10);

  return {
    async findStudentForUser(userId, studentId) {
      return database
        .prepare(
          `SELECT
             students.id,
             students.legal_first_name AS legalFirstName,
             students.legal_last_name AS legalLastName,
             students.status
           FROM users
           INNER JOIN guardian_accounts
             ON guardian_accounts.user_id = users.id
            AND guardian_accounts.verified_link_state = 'verified'
           INNER JOIN guardians ON guardians.id = guardian_accounts.guardian_id
           INNER JOIN families
             ON families.id = guardians.family_id
            AND families.status = 'active'
           INNER JOIN guardian_student_links
             ON guardian_student_links.guardian_id = guardians.id
            AND guardian_student_links.status = 'active'
            AND guardian_student_links.effective_start <= ?
            AND (guardian_student_links.effective_end IS NULL OR guardian_student_links.effective_end >= ?)
           INNER JOIN students
             ON students.id = guardian_student_links.student_id
            AND students.id = ?
           WHERE users.id = ?
             AND users.audience = 'guardian'
             AND users.status = 'active'
           LIMIT 1`,
        )
        .bind(today, today, studentId, userId)
        .first<GuardianStudentProjection>();
    },

    async findApplicationForUser(userId, applicationId) {
      return database
        .prepare(
          `SELECT
             applications.id,
             applications.status,
             applications.prospective_student_id AS prospectiveStudentId
           FROM users
           INNER JOIN guardian_accounts
             ON guardian_accounts.user_id = users.id
            AND guardian_accounts.verified_link_state = 'verified'
           INNER JOIN guardians ON guardians.id = guardian_accounts.guardian_id
           INNER JOIN families
             ON families.id = guardians.family_id
            AND families.status = 'active'
           INNER JOIN guardian_application_links
             ON guardian_application_links.guardian_id = guardians.id
            AND guardian_application_links.status = 'active'
            AND guardian_application_links.effective_start <= ?
            AND (guardian_application_links.effective_end IS NULL OR guardian_application_links.effective_end >= ?)
           INNER JOIN applications
             ON applications.id = guardian_application_links.application_id
            AND applications.id = ?
           WHERE users.id = ?
             AND users.audience = 'guardian'
             AND users.status = 'active'
           LIMIT 1`,
        )
        .bind(today, today, applicationId, userId)
        .first<GuardianApplicationProjection>();
    },
  };
}
