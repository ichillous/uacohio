import { describe, expect, it } from "vitest";

import {
  ResourceNotFoundError,
  requireGuardianApplication,
  requireGuardianStudent,
  type GuardianScopeStore,
} from "./guardian-scope";
import type { PortalSession } from "./types";

type StudentProjection = { id: string; name: string };
type ApplicationProjection = { id: string; status: string };

const guardianSession: PortalSession = {
  user: {
    id: "user-guardian-001",
    displayName: "Dev Guardian",
    email: "guardian@example.test",
    locale: "en",
  },
  audience: "guardian",
  role: null,
  permissions: [],
};

function fakeStore(): GuardianScopeStore<StudentProjection, ApplicationProjection> {
  const studentsByUser = new Map([
    ["user-guardian-001:student-001", { id: "student-001", name: "Amina" }],
    ["user-guardian-001:student-002", { id: "student-002", name: "Samir" }],
  ]);
  const applicationsByUser = new Map([
    ["user-guardian-001:application-001", { id: "application-001", status: "submitted" }],
  ]);

  return {
    findApplicationForUser: async (userId, applicationId) =>
      applicationsByUser.get(`${userId}:${applicationId}`) ?? null,
    findStudentForUser: async (userId, studentId) =>
      studentsByUser.get(`${userId}:${studentId}`) ?? null,
  };
}

describe("guardian row scope", () => {
  it("supports one guardian linked to multiple children", async () => {
    const store = fakeStore();

    await expect(requireGuardianStudent(guardianSession, "student-001", store)).resolves.toEqual({
      id: "student-001",
      name: "Amina",
    });
    await expect(requireGuardianStudent(guardianSession, "student-002", store)).resolves.toEqual({
      id: "student-002",
      name: "Samir",
    });
  });

  it("returns the same not-found result for unrelated, revoked, or missing links", async () => {
    const store = fakeStore();

    await expect(
      requireGuardianStudent(guardianSession, "student-other-family", store),
    ).rejects.toEqual(new ResourceNotFoundError());
    await expect(requireGuardianStudent(guardianSession, "student-revoked", store)).rejects.toEqual(
      new ResourceNotFoundError(),
    );
  });

  it("scopes applications independently from enrolled-student links", async () => {
    const store = fakeStore();

    await expect(
      requireGuardianApplication(guardianSession, "application-001", store),
    ).resolves.toEqual({ id: "application-001", status: "submitted" });
    await expect(
      requireGuardianApplication(guardianSession, "application-other-family", store),
    ).rejects.toEqual(new ResourceNotFoundError());
  });

  it("does not allow a staff identity through guardian repositories", async () => {
    const store = fakeStore();

    await expect(
      requireGuardianStudent(
        { ...guardianSession, audience: "staff", role: "system_administrator" },
        "student-001",
        store,
      ),
    ).rejects.toEqual(new ResourceNotFoundError());
  });
});
