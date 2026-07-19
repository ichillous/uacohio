import Link from "next/link";
import type { ReactNode } from "react";

import { homeContent } from "@/modules/public-site/content/home";
import type { PublicPageSlug } from "@/modules/public-site/content/routes";
import { localeNames, locales, type Locale } from "@/modules/shared/i18n/locales";

import { OfficialLogo } from "./official-logo";

interface SiteChromeProps {
  activePage?: PublicPageSlug;
  children: ReactNode;
  locale: Locale;
}

const interfaceLabels: Record<
  Locale,
  {
    chooseLanguage: string;
    home: string;
    menu: string;
    mobileNavigation: string;
    primaryNavigation: string;
    skip: string;
  }
> = {
  en: {
    chooseLanguage: "Choose language",
    home: "home",
    menu: "Menu",
    mobileNavigation: "Mobile navigation",
    primaryNavigation: "Primary navigation",
    skip: "Skip to main content",
  },
  ar: {
    chooseLanguage: "اختر اللغة",
    home: "الصفحة الرئيسية",
    menu: "القائمة",
    mobileNavigation: "التنقل على الهاتف",
    primaryNavigation: "التنقل الرئيسي",
    skip: "انتقل إلى المحتوى الرئيسي",
  },
  so: {
    chooseLanguage: "Dooro luqadda",
    home: "bogga hore",
    menu: "Liiska",
    mobileNavigation: "Liiska moobilka",
    primaryNavigation: "Liiska weyn",
    skip: "U gudub nuxurka weyn",
  },
};

function localeHref(locale: Locale, activePage?: PublicPageSlug) {
  return activePage ? `/${locale}/${activePage}` : `/${locale}`;
}

function pageHref(locale: Locale, href: string) {
  return `/${locale}${href}`;
}

function LocaleLinks({ activePage, locale }: Pick<SiteChromeProps, "activePage" | "locale">) {
  const labels = interfaceLabels[locale];

  return (
    <div className="locale-links" aria-label={labels.chooseLanguage}>
      {locales.map((item) => (
        <Link
          aria-current={item === locale ? "page" : undefined}
          className="locale-link"
          href={localeHref(item, activePage)}
          hrefLang={item}
          key={item}
          lang={item}
        >
          {item === "ar" ? localeNames[item] : item.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

export function Brand({ locale }: { locale: Locale }) {
  const content = homeContent[locale];

  return (
    <span className="brand-lockup">
      <OfficialLogo alt="" className="brand-official-logo" />
      <span className="brand-name">
        <strong>{content.schoolName}</strong>
        <span>{content.schoolLocation}</span>
      </span>
    </span>
  );
}

export function SiteChrome({ activePage, children, locale }: SiteChromeProps) {
  const content = homeContent[locale];
  const labels = interfaceLabels[locale];

  return (
    <>
      <a className="skip-link" href="#main-content">
        {labels.skip}
      </a>

      <div className="utility-bar">
        <div className="shell utility-inner">
          <p className="announcement">
            <span aria-hidden="true" className="announcement-dot" />
            {content.announcement}
          </p>
          <div className="utility-actions">
            <span className="portal-status">{content.portal}</span>
            <LocaleLinks activePage={activePage} locale={locale} />
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="shell header-inner">
          <Link
            aria-label={`${content.schoolName} ${labels.home}`}
            className="brand-link"
            href={`/${locale}`}
          >
            <Brand locale={locale} />
          </Link>

          <nav aria-label={labels.primaryNavigation} className="primary-nav">
            {content.navigation.map((item) => {
              const slug = item.href.slice(1) as PublicPageSlug;
              return (
                <Link
                  aria-current={activePage === slug ? "page" : undefined}
                  href={pageHref(locale, item.href)}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link className="button button-small button-forest" href={`/${locale}/admissions`}>
              {content.apply}
            </Link>
          </nav>

          <details className="mobile-menu">
            <summary aria-label={labels.menu}>{labels.menu}</summary>
            <nav aria-label={labels.mobileNavigation}>
              {content.navigation.map((item) => (
                <Link href={pageHref(locale, item.href)} key={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href={`/${locale}/admissions`}>{content.apply}</Link>
            </nav>
          </details>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div>
            <Brand locale={locale} />
            <p>{content.footer.summary}</p>
          </div>
          <div className="footer-meta">
            <p>{content.footer.note}</p>
            <p>© {new Date().getFullYear()} Universal Academy of Columbus</p>
          </div>
        </div>
      </footer>
    </>
  );
}
