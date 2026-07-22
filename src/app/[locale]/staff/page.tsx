import { redirect } from "next/navigation";

import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffPortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = await getSession();

  if (!session || session.audience !== "staff" || session.role === null) {
    redirect(`/${safeLocale}/dev-login`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-bold uppercase tracking-widest text-sky-700">
            Staff portal foundation
          </p>
          <h1 className="mt-3 text-4xl font-bold text-sky-950">
            Welcome, {session.user.displayName}
          </h1>
          <p className="mt-3 text-slate-600">Role: {session.role.replaceAll("_", " ")}</p>
        </div>
        <SignOutButton locale={safeLocale} />
      </div>
      <section className="mt-10 rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-sky-950">Trusted server permissions</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {session.permissions.map((permission) => (
            <li className="rounded-lg bg-sky-50 px-3 py-2 text-sm" key={permission}>
              {permission}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
