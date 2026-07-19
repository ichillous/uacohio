import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePage } from "@/modules/public-site/components/home-page";
import { homeContent } from "@/modules/public-site/content/home";
import { isLocale } from "@/modules/shared/i18n/locales";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return {
    title: homeContent[locale].hero.title,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        so: "/so",
      },
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <HomePage locale={locale} />;
}
