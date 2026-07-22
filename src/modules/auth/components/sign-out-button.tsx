"use client";

import { useRouter } from "next/navigation";

export function SignOutButton({ locale }: { locale: string }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/dev/session", { method: "DELETE" });
    router.push(`/${locale}/dev-login`);
    router.refresh();
  }

  return (
    <button
      className="rounded-lg bg-sky-900 px-4 py-2 font-semibold text-white"
      onClick={signOut}
      type="button"
    >
      Switch identity
    </button>
  );
}
