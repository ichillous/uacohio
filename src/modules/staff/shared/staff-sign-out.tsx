"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./staff-portal.module.css";

export function StaffSignOut({ locale }: { locale: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/dev/session", { method: "DELETE" });
    router.push(`/${locale}/dev-login`);
    router.refresh();
  }

  return (
    <button className={styles.identityButton} disabled={pending} onClick={signOut} type="button">
      {pending ? "Switching…" : "Switch identity"}
    </button>
  );
}
