import { notFound } from "next/navigation";

import { getD1Database } from "@/db/d1";
import { isDevAuthAllowed, readRuntimeEnvironment } from "@/lib/env/server";
import { DevLoginPicker } from "@/modules/auth/components/dev-login-picker";
import { listDevIdentities } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DevLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const environment = readRuntimeEnvironment();

  if (!isLocale(locale) || !isDevAuthAllowed(environment)) {
    notFound();
  }

  const identities = await listDevIdentities(await getD1Database());

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <p className="font-bold uppercase tracking-widest text-sky-700">Local development only</p>
      <h1 className="mt-3 text-4xl font-bold text-sky-950">Choose a seeded portal identity</h1>
      <p className="mb-8 mt-3 text-slate-600">
        This passwordless switcher is disabled outside development and test environments.
      </p>
      <DevLoginPicker identities={identities} locale={locale} />
    </main>
  );
}
