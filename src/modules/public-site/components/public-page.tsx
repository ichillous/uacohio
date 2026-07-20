import { publicPageContent } from "@/modules/public-site/content/pages";
import type { PublicPageSlug } from "@/modules/public-site/content/routes";
import type { Locale } from "@/modules/shared/i18n/locales";

import { SiteChrome } from "./site-chrome";
import { UacMark } from "./uac-mark";

interface PublicPageProps {
  locale: Locale;
  page: PublicPageSlug;
}

const calloutLabels: Record<Locale, string> = {
  en: "Explore UAC",
  ar: "استكشف UAC",
  so: "Baro UAC",
};

const signatureLabels: Record<
  Locale,
  Record<PublicPageSlug, { kicker: string; primary: string; secondary: string }>
> = {
  en: {
    admissions: {
      kicker: "Family journey",
      primary: "01 → 04",
      secondary: "Learn · Connect · Visit · Prepare",
    },
    academics: {
      kicker: "Learning pathway",
      primary: "K — 8",
      secondary: "Foundation · Independence · Next steps",
    },
    "student-life": {
      kicker: "Student experience",
      primary: "Create + Move",
      secondary: "Participate · Serve · Belong",
    },
    about: {
      kicker: "UAC values",
      primary: "Know + Grow",
      secondary: "Knowledge · Character · Community",
    },
    contact: {
      kicker: "Family welcome",
      primary: "EN · عربي · SO",
      secondary: "Ask · Visit · Connect",
    },
  },
  ar: {
    admissions: {
      kicker: "رحلة العائلة",
      primary: "01 ← 04",
      secondary: "تعرف · تواصل · زر · استعد",
    },
    academics: {
      kicker: "المسار التعليمي",
      primary: "K — 8",
      secondary: "أساس · استقلال · مستقبل",
    },
    "student-life": {
      kicker: "تجربة الطالب",
      primary: "ابتكر + تحرك",
      secondary: "شارك · اخدم · انتمِ",
    },
    about: { kicker: "قيم UAC", primary: "اعرف + انمُ", secondary: "معرفة · شخصية · مجتمع" },
    contact: {
      kicker: "ترحيب بالعائلات",
      primary: "EN · عربي · SO",
      secondary: "اسأل · زر · تواصل",
    },
  },
  so: {
    admissions: {
      kicker: "Safarka qoyska",
      primary: "01 → 04",
      secondary: "Baro · Xiriir · Booqo · Diyaar",
    },
    academics: {
      kicker: "Jidka waxbarashada",
      primary: "K — 8",
      secondary: "Aasaas · Madax-bannaani · Mustaqbal",
    },
    "student-life": {
      kicker: "Khibradda ardayga",
      primary: "Abuur + Dhaqaaq",
      secondary: "Ka qaybgal · Adeeg · Ka mid noqo",
    },
    about: {
      kicker: "Qiyamka UAC",
      primary: "Baro + Koboc",
      secondary: "Aqoon · Akhlaaq · Bulsho",
    },
    contact: {
      kicker: "Soo dhoweynta qoyska",
      primary: "EN · عربي · SO",
      secondary: "Weydii · Booqo · Xiriir",
    },
  },
};

export function PublicPage({ locale, page }: PublicPageProps) {
  const content = publicPageContent[locale][page];
  const signature = signatureLabels[locale][page];

  return (
    <SiteChrome activePage={page} locale={locale}>
      <main id="main-content">
        <section className={`inner-hero inner-hero--${content.signature}`}>
          <div aria-hidden="true" className="star-field" />
          <div className="shell inner-hero-grid">
            <div className="inner-hero-copy">
              <p className="eyebrow eyebrow-light">{content.hero.eyebrow}</p>
              <h1>{content.hero.title}</h1>
              <p>{content.hero.summary}</p>
            </div>
            <aside className="page-signature" aria-label={signature.kicker}>
              <UacMark className="page-signature-mark" />
              <span>{signature.kicker}</span>
              <strong>{signature.primary}</strong>
              <p>{signature.secondary}</p>
            </aside>
          </div>
        </section>

        <section className="page-section shell">
          <header className="page-section-heading">
            <p className="eyebrow">{content.overview.eyebrow}</p>
            <h2>{content.overview.title}</h2>
            <p>{content.overview.body}</p>
          </header>

          <div className={`page-card-grid page-card-grid--${content.signature}`}>
            {content.cards.map((card) => (
              <article className="page-card" key={`${card.marker}-${card.title}`}>
                <span>{card.marker}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-feature">
          <div className="shell page-feature-grid">
            <div
              className={`feature-emblem feature-emblem--${content.signature}`}
              aria-hidden="true"
            >
              <UacMark className="feature-emblem-mark" />
              <span>{signature.primary}</span>
            </div>
            <div className="page-feature-copy">
              <p className="eyebrow">{content.feature.eyebrow}</p>
              <h2>{content.feature.title}</h2>
              <p>{content.feature.body}</p>
              {content.contactDetails ? (
                <dl className="contact-details-grid">
                  {content.contactDetails.map((detail) => (
                    <div className="contact-detail" key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>
                        {detail.lines.map((line) => (
                          <span key={line}>
                            {detail.href ? <a href={detail.href}>{line}</a> : line}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <ul>
                  {content.feature.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="page-callout-wrap shell">
          <div className="page-callout">
            <div>
              <p className="eyebrow">{content.callout.status}</p>
              <h2>{content.callout.title}</h2>
              <p>{content.callout.body}</p>
            </div>
            <span className="callout-badge">
              <UacMark className="callout-badge-mark" />
              {calloutLabels[locale]}
            </span>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
