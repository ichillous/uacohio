import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPage } from "@/modules/public-site/components/public-page";
import { publicPageContent } from "@/modules/public-site/content/pages";
import { isPublicPageSlug, publicPageSlugs } from "@/modules/public-site/content/routes";
import { isLocale, locales } from "@/modules/shared/i18n/locales";

interface PublicPageRouteProps {
  params: Promise<{ locale: string; page: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => publicPageSlugs.map((page) => ({ locale, page })));
}

export async function generateMetadata({ params }: PublicPageRouteProps): Promise<Metadata> {
  const { locale, page } = await params;

  if (!isLocale(locale) || !isPublicPageSlug(page)) {
    return {};
  }

  const content = publicPageContent[locale][page];

  return {
    title: content.hero.title,
    description: content.metaDescription,
    alternates: {
      canonical: `/${locale}/${page}`,
      languages: {
        en: `/en/${page}`,
        ar: `/ar/${page}`,
        so: `/so/${page}`,
      },
    },
  };
}

export default async function PublicPageRoute({ params }: PublicPageRouteProps) {
  const { locale, page } = await params;

  if (!isLocale(locale) || !isPublicPageSlug(page)) {
    notFound();
  }

  return <PublicPage locale={locale} page={page} />;
}
