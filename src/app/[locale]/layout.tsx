import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader, Noto_Naskh_Arabic } from "next/font/google";
import { notFound } from "next/navigation";

import { isLocale, localeDirection, locales } from "@/modules/shared/i18n/locales";

import "../globals.css";

const bodyFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const arabicFont = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/brand/uac-official-logo.png",
  },
  title: {
    default: "Universal Academy of Columbus",
    template: "%s | Universal Academy of Columbus",
  },
  description: "A multilingual K-8 school experience for Columbus families.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html
      className={`${bodyFont.variable} ${displayFont.variable} ${arabicFont.variable}`}
      dir={localeDirection(locale)}
      lang={locale}
    >
      <body>{children}</body>
    </html>
  );
}
