import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminRole, AdminUser } from "./repository";
import { UserRoleManager } from "./user-role-manager";

const roles: AdminRole[] = [
  {
    description: "Administrates access.",
    key: "system_administrator",
    name: "System Administrator",
    permissions: ["roles.administer"],
  },
  {
    description: "Leadership review.",
    key: "school_leadership",
    name: "School Leadership",
    permissions: ["audit.view"],
  },
];

const users: AdminUser[] = [
  {
    audience: "staff",
    displayName: "Dev System Administrator",
    email: "admin@example.test",
    roleKey: "system_administrator",
    staffActive: true,
    status: "active",
    userId: "user-staff-001",
  },
  {
    audience: "staff",
    displayName: "Dev School Leadership",
    email: "leader@example.test",
    roleKey: "school_leadership",
    staffActive: true,
    status: "active",
    userId: "user-staff-002",
  },
];

describe("staff role manager self-lockout affordance", () => {
  it("renders the current system administrator role as read-only", () => {
    render(
      <UserRoleManager
        canAdminister
        currentUserId="user-staff-001"
        initialUsers={users}
        roles={roles}
      />,
    );

    expect(screen.getByLabelText(/Staff role · your account/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Staff role$/i)).toBeEnabled();
  });
});
