"use client";

import { useMemo, useState } from "react";

import type { StaffApiFailure, StaffApiSuccess } from "../shared/api";
import type { AttendanceRosterRow } from "./repository";
import {
  attendanceStatuses,
  deriveAttendanceValues,
  type AbsenceType,
  type AttendanceStatus,
} from "./rules";
import styles from "./attendance.module.css";

type Draft = {
  absenceType?: Exclude<AbsenceType, "none">;
  attendedMinutes?: number;
  status: AttendanceStatus;
};

const labels: Record<AttendanceStatus, string> = {
  absent_excused: "Absent — excused",
  absent_unexcused: "Absent — unexcused",
  partial: "Partial day",
  present: "Present",
  tardy_excused: "Tardy — excused",
  tardy_unexcused: "Tardy — unexcused",
};

function nextDraft(status: AttendanceStatus, existing?: Draft): Draft {
  if (status === "partial") {
    return {
      absenceType: existing?.absenceType ?? "excused",
      attendedMinutes: existing?.attendedMinutes ?? 180,
      status,
    };
  }
  if (status.startsWith("tardy_")) {
    return { attendedMinutes: existing?.attendedMinutes ?? 330, status };
  }
  return { status };
}

export function AttendanceWorkspace({
  attendanceDate,
  canMark,
  initialRoster,
}: {
  attendanceDate: string;
  canMark: boolean;
  initialRoster: AttendanceRosterRow[];
}) {
  const [roster, setRoster] = useState(initialRoster);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const changed = useMemo(() => Object.entries(drafts), [drafts]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setDrafts((current) => ({
      ...current,
      [studentId]: nextDraft(status, current[studentId]),
    }));
  }

  function changeDraft(studentId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...current[studentId], ...patch },
    }));
  }

  async function save() {
    if (!canMark || changed.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/attendance/batch", {
        body: JSON.stringify({
          attendanceDate,
          records: changed.map(([studentId, draft]) => ({
            ...draft,
            studentId,
            version: roster.find((row) => row.studentId === studentId)?.version ?? 0,
          })),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as
        | StaffApiFailure
        | StaffApiSuccess<{
            records: Array<{ studentId: string; version: number }>;
          }>;
      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error.message : "Attendance could not be saved.",
        );
      }
      const versions = new Map(
        payload.data.records.map((record) => [record.studentId, record.version]),
      );
      setRoster((current) =>
        current.map((row) => {
          const draft = drafts[row.studentId];
          const version = versions.get(row.studentId);
          if (!draft || version === undefined) return row;
          const derived = deriveAttendanceValues(draft);
          return { ...row, ...derived, status: draft.status, version };
        }),
      );
      setDrafts({});
      setMessage({ kind: "success", text: "Attendance saved and audited." });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Attendance could not be saved.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!canMark ? (
        <p className={styles.notice}>
          Read-only access: this role can review and export, but cannot mark attendance.
        </p>
      ) : null}
      {message ? (
        <p className={message.kind === "error" ? styles.error : styles.success} role="status">
          {message.text}
        </p>
      ) : null}
      <div className={styles.tableShell}>
        <table className={styles.roster}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Attended minutes</th>
              <th>Absence type</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((row) => {
              const draft = drafts[row.studentId];
              const status = draft?.status ?? row.status;
              const variableMinutes = status?.startsWith("tardy_") || status === "partial";
              return (
                <tr key={row.studentId}>
                  <td className={styles.studentName}>
                    {row.legalFirstName} {row.legalLastName}
                    <span>{row.studentId}</span>
                  </td>
                  <td>{row.gradeLevelCode}</td>
                  <td>
                    {canMark ? (
                      <select
                        aria-label={`Attendance status for ${row.legalFirstName} ${row.legalLastName}`}
                        onChange={(event) =>
                          setStatus(row.studentId, event.target.value as AttendanceStatus)
                        }
                        value={status ?? ""}
                      >
                        <option disabled value="">
                          Not marked
                        </option>
                        {attendanceStatuses.map((value) => (
                          <option key={value} value={value}>
                            {labels[value]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={styles.statusText}>
                        {status ? labels[status] : "Not marked"}
                      </span>
                    )}
                  </td>
                  <td>
                    {canMark && draft && variableMinutes ? (
                      <input
                        aria-label={`Attended minutes for ${row.legalFirstName} ${row.legalLastName}`}
                        max={359}
                        min={1}
                        onChange={(event) =>
                          changeDraft(row.studentId, {
                            attendedMinutes: event.target.valueAsNumber,
                          })
                        }
                        type="number"
                        value={draft.attendedMinutes ?? 330}
                      />
                    ) : (
                      ((draft
                        ? deriveAttendanceValues(draft).attendedMinutes
                        : row.attendedMinutes) ?? "—")
                    )}
                  </td>
                  <td>
                    {canMark && draft?.status === "partial" ? (
                      <select
                        aria-label={`Absence type for ${row.legalFirstName} ${row.legalLastName}`}
                        onChange={(event) =>
                          changeDraft(row.studentId, {
                            absenceType: event.target.value as Draft["absenceType"],
                          })
                        }
                        value={draft.absenceType}
                      >
                        <option value="excused">Excused</option>
                        <option value="unexcused">Unexcused</option>
                      </select>
                    ) : (
                      ((draft ? deriveAttendanceValues(draft).absenceType : row.absenceType) ?? "—")
                    )}
                  </td>
                  <td>{row.version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canMark ? (
        <div className={styles.saveBar}>
          <span>{changed.length} changed records</span>
          <button
            className={styles.saveButton}
            disabled={busy || changed.length === 0}
            onClick={save}
            type="button"
          >
            {busy ? "Saving…" : "Save attendance"}
          </button>
        </div>
      ) : null}
    </>
  );
}
