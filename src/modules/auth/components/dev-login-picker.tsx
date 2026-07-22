"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DevIdentity } from "../session";

export function DevLoginPicker({
  identities,
  locale,
}: {
  identities: DevIdentity[];
  locale: string;
}) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chooseIdentity(identity: DevIdentity) {
    setPendingUserId(identity.userId);
    setError(null);

    const response = await fetch("/api/dev/session", {
      body: JSON.stringify({ userId: identity.userId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      setError("The local session could not be created.");
      setPendingUserId(null);
      return;
    }

    router.push(`/${locale}/${identity.audience === "staff" ? "staff" : "parent"}`);
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      {identities.map((identity) => (
        <button
          className="rounded-xl border border-sky-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-500 disabled:opacity-50"
          disabled={pendingUserId !== null}
          key={identity.userId}
          onClick={() => chooseIdentity(identity)}
          type="button"
        >
          <span className="block font-bold text-sky-950">{identity.displayName}</span>
          <span className="block text-sm text-slate-600">
            {identity.audience === "staff" ? identity.role?.replaceAll("_", " ") : "guardian"}
          </span>
        </button>
      ))}
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
