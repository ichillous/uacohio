import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { StaffShell } from "@/modules/staff/shared/staff-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = await getSession();

  if (!session || session.audience !== "staff" || session.role === null) {
    redirect(`/${safeLocale}/dev-login`);
  }

  return (
    <StaffShell locale={safeLocale} session={session}>
      {children}
    </StaffShell>
  );
}
