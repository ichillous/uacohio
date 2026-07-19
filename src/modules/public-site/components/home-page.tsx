import { homeContent } from "@/modules/public-site/content/home";
import type { Locale } from "@/modules/shared/i18n/locales";

import { OfficialLogo } from "./official-logo";
import { SiteChrome } from "./site-chrome";
import { UacMark } from "./uac-mark";

interface HomePageProps {
  locale: Locale;
}

const iconPaths = {
  heart: <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  path: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18c6 0 4-10 8-10" />
    </>
  ),
} as const;

export function HomePage({ locale }: HomePageProps) {
  const content = homeContent[locale];

  return (
    <SiteChrome locale={locale}>
      <main id="main-content">
        <section className="hero" id="about">
          <div aria-hidden="true" className="star-field" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-light">
                <UacMark className="eyebrow-mark" />
                {content.hero.eyebrow}
              </p>
              <h1>{content.hero.title}</h1>
              <p className="hero-summary">{content.hero.summary}</p>
              <div className="hero-actions">
                <a className="button button-gold" href={`/${locale}/admissions`}>
                  {content.hero.primaryAction}
                  <span aria-hidden="true">→</span>
                </a>
                <a className="button button-ghost" href={`/${locale}/contact`}>
                  {content.hero.secondaryAction}
                </a>
              </div>
              <dl className="hero-highlights">
                {content.hero.highlights.map((item) => (
                  <div key={item.label}>
                    <dt>{item.value}</dt>
                    <dd>{item.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="hero-visual" aria-label={content.hero.visualLabel} role="img">
              <div aria-hidden="true" className="hero-window-pattern" />
              <OfficialLogo
                alt=""
                className="hero-official-logo"
                priority
                sizes="(max-width: 680px) 260px, 320px"
              />
              <p>{content.hero.visualLabel}</p>
              <aside className="hero-note">
                <strong>UAC</strong>
                <span>Knowledge · Character · Community</span>
              </aside>
            </div>
          </div>
        </section>

        <section aria-label="School commitments" className="trust-strip">
          <div className="shell trust-items">
            {content.trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="section shell" id="student-life">
          <div className="section-heading section-heading-centered">
            <p className="eyebrow">{content.pillars.eyebrow}</p>
            <h2>{content.pillars.title}</h2>
          </div>
          <div className="pillar-grid">
            {content.pillars.items.map((item) => (
              <article className="pillar-card" key={item.title}>
                <span className="pillar-icon">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    viewBox="0 0 24 24"
                  >
                    {iconPaths[item.icon]}
                  </svg>
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="academic-band" id="academics">
          <div className="shell academic-grid">
            <div className="academic-visual" aria-label={content.academics.visualLabel} role="img">
              <div aria-hidden="true" className="academic-orbit" />
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                viewBox="0 0 24 24"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
              <span>{content.academics.visualLabel}</span>
            </div>
            <div className="academic-copy">
              <p className="eyebrow">{content.academics.eyebrow}</p>
              <h2>{content.academics.title}</h2>
              <p>{content.academics.body}</p>
              <ul>
                {content.academics.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="values-band">
          <div aria-hidden="true" className="star-field" />
          <div className="shell values-inner">
            <UacMark className="values-mark" />
            <h2>{content.values.quote}</h2>
            <p>{content.values.body}</p>
          </div>
        </section>

        <section className="section shell welcome-section" id="visit">
          <div className="welcome-card">
            <p className="eyebrow">{content.welcome.eyebrow}</p>
            <h2>
              <span lang="en">Welcome</span>
              <UacMark className="welcome-mark" />
              <span lang="ar">أهلاً وسهلاً</span>
              <UacMark className="welcome-mark" />
              <span lang="so">Soo dhowow</span>
            </h2>
            <p>{content.welcome.body}</p>
          </div>
        </section>

        <section className="admissions-band" id="admissions">
          <div className="shell admissions-inner">
            <div>
              <h2>{content.admissions.title}</h2>
              <p>{content.admissions.body}</p>
            </div>
            <span className="button button-disabled" role="status">
              {content.admissions.action}
            </span>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
