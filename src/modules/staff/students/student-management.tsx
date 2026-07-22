"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { StaffApiFailure, StaffApiSuccess } from "../shared/api";
import styles from "./records.module.css";

type Feedback = { kind: "error" | "success"; message: string } | null;
type RecordValue = Record<string, unknown>;

async function send<T>(url: string, method: "PATCH" | "POST", body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });
  const payload = (await response.json()) as StaffApiFailure | StaffApiSuccess<T>;
  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload ? payload.error.message : "The record could not be saved.");
  }
  return payload.data;
}

function value(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function nullable(form: FormData, name: string) {
  return value(form, name) || null;
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p className={feedback.kind === "error" ? styles.formError : styles.formSuccess} role="status">
      {feedback.message}
    </p>
  );
}

export function StudentCreateForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  if (!canCreate) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setFeedback(null);
    try {
      const created = await send<{ id: string }>("/api/staff/students", "POST", {
        birthDate: value(data, "birthDate"),
        emisStudentId: value(data, "emisStudentId"),
        genderCode: value(data, "genderCode"),
        homeLanguageCode: nullable(data, "homeLanguageCode"),
        legalFirstName: value(data, "legalFirstName"),
        legalLastName: value(data, "legalLastName"),
        localUseId: nullable(data, "localUseId"),
        nativeLanguageCode: value(data, "nativeLanguageCode"),
        raceEthnicityCode: value(data, "raceEthnicityCode"),
        status: "active",
      });
      setFeedback({ kind: "success", message: `Student ${created.id} was created and audited.` });
      form.reset();
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "The student could not be created.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.managementDisclosure}>
      <summary>Add student record</summary>
      <form className={styles.managementForm} onSubmit={submit}>
        <label>
          EMIS student ID
          <input maxLength={9} minLength={9} name="emisStudentId" required />
        </label>
        <label>
          Local-use ID
          <input maxLength={9} minLength={9} name="localUseId" />
        </label>
        <label>
          Legal first name
          <input maxLength={80} name="legalFirstName" required />
        </label>
        <label>
          Legal last name
          <input maxLength={80} name="legalLastName" required />
        </label>
        <label>
          Birth date
          <input name="birthDate" required type="date" />
        </label>
        <label>
          Gender code
          <input defaultValue="U" maxLength={16} name="genderCode" required />
        </label>
        <label>
          Race / ethnicity code
          <input defaultValue="00" maxLength={16} name="raceEthnicityCode" required />
        </label>
        <label>
          Native language code
          <input defaultValue="EN" maxLength={16} name="nativeLanguageCode" required />
        </label>
        <label>
          Home language code
          <input defaultValue="EN" maxLength={16} name="homeLanguageCode" />
        </label>
        <button disabled={busy} type="submit">
          {busy ? "Creating…" : "Create student"}
        </button>
      </form>
      <FeedbackMessage feedback={feedback} />
    </details>
  );
}

export function StudentManagement({
  canManageEnrollment,
  canManageStudent,
  enrollments,
  guardians,
  student,
}: {
  canManageEnrollment: boolean;
  canManageStudent: boolean;
  enrollments: RecordValue[];
  guardians: RecordValue[];
  student: RecordValue;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const studentId = String(student.id);
  if (!canManageStudent && !canManageEnrollment) return null;

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      setFeedback({ kind: "success", message });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "The record could not be saved.",
      });
    } finally {
      setBusy(false);
    }
  }

  function editStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(
      () =>
        send(`/api/staff/students/${studentId}`, "PATCH", {
          legalFirstName: value(data, "legalFirstName"),
          legalLastName: value(data, "legalLastName"),
          status: value(data, "status"),
          updatedAt: String(student.updatedAt),
        }),
      "Student identity fields were updated and audited.",
    );
  }

  function addGuardian(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      await send(`/api/staff/students/${studentId}/guardians`, "POST", {
        contactPreference: value(data, "contactPreference"),
        custody: data.get("custody") === "on",
        effectiveStart: value(data, "effectiveStart"),
        familyId: value(data, "familyId"),
        firstName: value(data, "firstName"),
        lastName: value(data, "lastName"),
        normalizedEmail: nullable(data, "normalizedEmail"),
        normalizedPhone: nullable(data, "normalizedPhone"),
        preferredLanguage: value(data, "preferredLanguage"),
        receivesContact: data.get("receivesContact") === "on",
        relationship: value(data, "relationship"),
      });
      form.reset();
    }, "Guardian and student link were created and audited.");
  }

  function updateGuardian(event: FormEvent<HTMLFormElement>, guardian: RecordValue) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(
      () =>
        send(`/api/staff/students/${studentId}/guardians/${String(guardian.linkId)}`, "PATCH", {
          expectedUpdatedAt: String(guardian.updatedAt),
          receivesContact: data.get("receivesContact") === "on",
          relationship: value(data, "relationship"),
        }),
      "Guardian link was updated and audited.",
    );
  }

  function revokeGuardian(guardian: RecordValue) {
    void run(
      () =>
        send(`/api/staff/students/${studentId}/guardians/${String(guardian.linkId)}`, "PATCH", {
          expectedUpdatedAt: String(guardian.updatedAt),
          status: "revoked",
        }),
      "Guardian link was revoked and audited.",
    );
  }

  function createEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      await send(`/api/staff/students/${studentId}/enrollments`, "POST", {
        admissionDate: value(data, "admissionDate"),
        admissionReasonCode: value(data, "admissionReasonCode"),
        admittedFromIrn: nullable(data, "admittedFromIrn"),
        assignedBuildingAreaIrn: nullable(data, "assignedBuildingAreaIrn"),
        attendingBuildingIrn: value(data, "attendingBuildingIrn"),
        districtRelationshipCode: value(data, "districtRelationshipCode"),
        effectiveStart: value(data, "effectiveStart"),
        gradeLevelCode: value(data, "gradeLevelCode"),
        legalDistrictOfResidence: value(data, "legalDistrictOfResidence"),
        percentOfTime: Number(value(data, "percentOfTime")),
        termId: value(data, "termId"),
      });
      form.reset();
    }, "Enrollment was created and audited.");
  }

  function withdraw(event: FormEvent<HTMLFormElement>, enrollment: RecordValue) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(
      () =>
        send(`/api/staff/students/${studentId}/enrollments/${String(enrollment.id)}`, "PATCH", {
          effectiveEnd: value(data, "effectiveEnd"),
          expectedEffectiveStart: String(enrollment.effectiveStart),
          withdrawalReasonCode: value(data, "withdrawalReasonCode"),
          withdrawnToIrn: nullable(data, "withdrawnToIrn"),
        }),
      "Enrollment was withdrawn and audited.",
    );
  }

  return (
    <section className={styles.management} aria-label="Student record management">
      <h2>Manage record</h2>
      <FeedbackMessage feedback={feedback} />
      {canManageStudent ? (
        <>
          <details className={styles.managementDisclosure}>
            <summary>Edit student</summary>
            <form className={styles.managementForm} onSubmit={editStudent}>
              <label>
                Legal first name
                <input
                  defaultValue={String(student.legalFirstName ?? "")}
                  name="legalFirstName"
                  required
                />
              </label>
              <label>
                Legal last name
                <input
                  defaultValue={String(student.legalLastName ?? "")}
                  name="legalLastName"
                  required
                />
              </label>
              <label>
                Status
                <select defaultValue={String(student.status ?? "active")} name="status">
                  <option value="active">Active</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="graduated">Graduated</option>
                </select>
              </label>
              <button disabled={busy} type="submit">
                Save student
              </button>
            </form>
          </details>

          <details className={styles.managementDisclosure}>
            <summary>Add guardian</summary>
            <form className={styles.managementForm} onSubmit={addGuardian}>
              <label>
                Family ID
                <input name="familyId" required />
              </label>
              <label>
                First name
                <input name="firstName" required />
              </label>
              <label>
                Last name
                <input name="lastName" required />
              </label>
              <label>
                Relationship
                <input defaultValue="parent" name="relationship" required />
              </label>
              <label>
                Effective start
                <input name="effectiveStart" required type="date" />
              </label>
              <label>
                Email
                <input name="normalizedEmail" type="email" />
              </label>
              <label>
                Phone (E.164)
                <input name="normalizedPhone" placeholder="+16145550123" />
              </label>
              <label>
                Preferred language
                <select defaultValue="en" name="preferredLanguage">
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="so">Somali</option>
                </select>
              </label>
              <label>
                Contact preference
                <select defaultValue="email" name="contactPreference">
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label className={styles.checkbox}>
                <input name="custody" type="checkbox" /> Custody
              </label>
              <label className={styles.checkbox}>
                <input defaultChecked name="receivesContact" type="checkbox" /> Receives contact
              </label>
              <button disabled={busy} type="submit">
                Add guardian
              </button>
            </form>
          </details>

          {guardians.map((guardian) => (
            <details className={styles.managementDisclosure} key={String(guardian.linkId)}>
              <summary>
                Update guardian link: {String(guardian.firstName)} {String(guardian.lastName)}
              </summary>
              <form
                className={styles.managementForm}
                onSubmit={(event) => updateGuardian(event, guardian)}
              >
                <label>
                  Relationship
                  <input
                    defaultValue={String(guardian.relationship)}
                    name="relationship"
                    required
                  />
                </label>
                <label className={styles.checkbox}>
                  <input
                    defaultChecked={Boolean(guardian.receivesContact)}
                    name="receivesContact"
                    type="checkbox"
                  />{" "}
                  Receives contact
                </label>
                <button disabled={busy} type="submit">
                  Update guardian link
                </button>
                <button
                  className={styles.dangerButton}
                  disabled={busy}
                  onClick={() => revokeGuardian(guardian)}
                  type="button"
                >
                  Revoke guardian link
                </button>
              </form>
            </details>
          ))}
        </>
      ) : null}

      {canManageEnrollment ? (
        <>
          <details className={styles.managementDisclosure}>
            <summary>Create enrollment</summary>
            <form className={styles.managementForm} onSubmit={createEnrollment}>
              <label>
                Term ID
                <input defaultValue="term-fall-2025" name="termId" required />
              </label>
              <label>
                Admission date
                <input name="admissionDate" required type="date" />
              </label>
              <label>
                Effective start
                <input name="effectiveStart" required type="date" />
              </label>
              <label>
                Admission reason code
                <input defaultValue="1" name="admissionReasonCode" required />
              </label>
              <label>
                Grade level code
                <input name="gradeLevelCode" required />
              </label>
              <label>
                Legal district IRN
                <input
                  defaultValue="043786"
                  maxLength={6}
                  minLength={6}
                  name="legalDistrictOfResidence"
                  required
                />
              </label>
              <label>
                Attending building IRN
                <input
                  defaultValue="012345"
                  maxLength={6}
                  minLength={6}
                  name="attendingBuildingIrn"
                  required
                />
              </label>
              <label>
                Assigned building area IRN
                <input maxLength={6} minLength={6} name="assignedBuildingAreaIrn" />
              </label>
              <label>
                Admitted-from IRN
                <input maxLength={6} minLength={6} name="admittedFromIrn" />
              </label>
              <label>
                District relationship code
                <input defaultValue="1" name="districtRelationshipCode" required />
              </label>
              <label>
                Percent of time
                <input
                  defaultValue="100"
                  max={100}
                  min={0}
                  name="percentOfTime"
                  required
                  type="number"
                />
              </label>
              <button disabled={busy} type="submit">
                Create enrollment
              </button>
            </form>
          </details>
          {enrollments
            .filter((enrollment) => enrollment.status === "active")
            .map((enrollment) => (
              <details className={styles.managementDisclosure} key={String(enrollment.id)}>
                <summary>Withdraw enrollment: grade {String(enrollment.gradeLevelCode)}</summary>
                <form
                  className={styles.managementForm}
                  onSubmit={(event) => withdraw(event, enrollment)}
                >
                  <label>
                    Withdrawal date
                    <input
                      min={String(enrollment.effectiveStart)}
                      name="effectiveEnd"
                      required
                      type="date"
                    />
                  </label>
                  <label>
                    Withdrawal reason code
                    <input name="withdrawalReasonCode" required />
                  </label>
                  <label>
                    Withdrawn-to IRN
                    <input maxLength={6} minLength={6} name="withdrawnToIrn" />
                  </label>
                  <button className={styles.dangerButton} disabled={busy} type="submit">
                    Withdraw enrollment
                  </button>
                </form>
              </details>
            ))}
        </>
      ) : null}
    </section>
  );
}
