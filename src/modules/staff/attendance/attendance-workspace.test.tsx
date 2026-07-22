import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { AttendanceRosterRow } from "./repository";
import { AttendanceWorkspace } from "./attendance-workspace";

afterEach(cleanup);

const roster: AttendanceRosterRow[] = [
  {
    absenceType: "none",
    absentMinutes: 0,
    attendedMinutes: 360,
    gradeLevelCode: "03",
    legalFirstName: "Amina",
    legalLastName: "Family",
    safeNote: null,
    status: "present",
    studentId: "student-001",
    version: 1,
  },
];

describe("attendance workspace authorization cues", () => {
  it("renders leadership export/view mode without mutation controls", () => {
    render(
      <AttendanceWorkspace attendanceDate="2025-09-15" canMark={false} initialRoster={roster} />,
    );

    expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save attendance/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/attendance status for/i)).not.toBeInTheDocument();
  });

  it("allows office staff to stage only an approved status", () => {
    render(<AttendanceWorkspace attendanceDate="2025-09-15" canMark initialRoster={roster} />);

    fireEvent.change(screen.getByLabelText(/attendance status for amina family/i), {
      target: { value: "absent_excused" },
    });
    expect(screen.getByText("1 changed records")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save attendance/i })).toBeEnabled();
  });

  it("clears stale drafts when the attendance date changes", () => {
    const { rerender } = render(
      <AttendanceWorkspace
        attendanceDate="2025-09-15"
        canMark
        initialRoster={roster}
        key="2025-09-15"
      />,
    );
    fireEvent.change(screen.getByLabelText(/attendance status for amina family/i), {
      target: { value: "absent_excused" },
    });
    expect(screen.getByText("1 changed records")).toBeInTheDocument();

    rerender(
      <AttendanceWorkspace
        attendanceDate="2025-09-16"
        canMark
        initialRoster={roster}
        key="2025-09-16"
      />,
    );
    return waitFor(() => expect(screen.getByText("0 changed records")).toBeInTheDocument());
  });
});
