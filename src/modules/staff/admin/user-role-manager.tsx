"use client";

import { useState } from "react";

import type { StaffApiFailure, StaffApiSuccess } from "../shared/api";
import type { AdminRole, AdminUser } from "./repository";
import styles from "./admin.module.css";

type Status = { kind: "error" | "success"; message: string } | null;

export function UserRoleManager({
  canAdminister,
  currentUserId,
  initialUsers,
  roles,
}: {
  canAdminister: boolean;
  currentUserId: string;
  initialUsers: AdminUser[];
  roles: AdminRole[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});

  async function replaceRole(userId: string, roleKey: AdminRole["key"]) {
    setBusyUserId(userId);
    setStatus((current) => ({ ...current, [userId]: null }));
    try {
      const response = await fetch(`/api/staff/admin/users/${userId}/roles`, {
        body: JSON.stringify({ roleKey }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json()) as
        | StaffApiFailure
        | StaffApiSuccess<{ changed: boolean; roleKey: AdminRole["key"]; userId: string }>;
      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error.message : "The role could not be updated.",
        );
      }
      setUsers((current) =>
        current.map((user) => (user.userId === userId ? { ...user, roleKey } : user)),
      );
      setStatus((current) => ({
        ...current,
        [userId]: {
          kind: "success",
          message: payload.data.changed ? "Role updated and audited." : "Role is already current.",
        },
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [userId]: {
          kind: "error",
          message: error instanceof Error ? error.message : "The role could not be updated.",
        },
      }));
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className={styles.userGrid}>
      {users.map((user) => {
        const active = user.status === "active" && user.staffActive;
        const self = user.userId === currentUserId;
        const protectedSelf = self && user.roleKey === "system_administrator";
        return (
          <article className={styles.userCard} key={user.userId}>
            <div className={styles.userHeading}>
              <span aria-hidden="true" className={styles.initial}>
                {user.displayName.replace(/^Dev /, "").slice(0, 1)}
              </span>
              <div>
                <h2>{user.displayName.replace(/^Dev /, "")}</h2>
                <p>{user.email}</p>
              </div>
              <span className={active ? styles.activeBadge : styles.inactiveBadge}>
                {active ? "Active" : "Inactive"}
              </span>
            </div>
            <label>
              Staff role {self ? <small>· your account</small> : null}
              <select
                disabled={!canAdminister || !active || protectedSelf || busyUserId === user.userId}
                onChange={(event) =>
                  void replaceRole(user.userId, event.target.value as AdminRole["key"])
                }
                value={user.roleKey ?? ""}
              >
                {!user.roleKey ? <option value="">No valid active role</option> : null}
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            {status[user.userId] ? (
              <p
                aria-live="polite"
                className={
                  status[user.userId]?.kind === "error" ? styles.statusError : styles.statusSuccess
                }
              >
                {status[user.userId]?.message}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
