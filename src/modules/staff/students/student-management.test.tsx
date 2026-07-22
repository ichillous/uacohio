import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudentCreateForm, StudentManagement } from "./student-management";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("student management authorization UI", () => {
  it("hides every write control for a read-only role", () => {
    render(
      <StudentManagement
        canManageEnrollment={false}
        canManageStudent={false}
        enrollments={[]}
        guardians={[]}
        student={{ id: "student-001", updatedAt: "2026-07-22 12:00:00" }}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("submits a validated student create request for authorized staff", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { id: "student-new" } }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<StudentCreateForm canCreate />);

    fireEvent.change(screen.getByLabelText(/emis student id/i), { target: { value: "100000999" } });
    fireEvent.change(screen.getByLabelText(/legal first name/i), { target: { value: "Amina" } });
    fireEvent.change(screen.getByLabelText(/legal last name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/birth date/i), { target: { value: "2018-04-12" } });
    fireEvent.click(screen.getByRole("button", { name: /create student/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/students",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("exposes every authorized guardian and enrollment workflow", () => {
    render(
      <StudentManagement
        canManageEnrollment
        canManageStudent
        enrollments={[
          {
            effectiveStart: "2025-08-18",
            gradeLevelCode: "03",
            id: "enrollment-001",
            status: "active",
          },
        ]}
        guardians={[
          {
            firstName: "Parent",
            lastName: "One",
            linkId: "guardian-student-001",
            receivesContact: true,
            relationship: "parent",
            updatedAt: "2026-07-22 12:00:00",
          },
        ]}
        student={{
          id: "student-001",
          legalFirstName: "Amina",
          legalLastName: "Family",
          status: "active",
          updatedAt: "2026-07-22 12:00:00",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /save student/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add guardian/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update guardian link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /revoke guardian link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create enrollment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /withdraw enrollment/i })).toBeInTheDocument();
  });
});
