import { schoolMealsContent } from "@/modules/public-site/content/school-meals";
import type { Locale } from "@/modules/shared/i18n/locales";

import styles from "./school-meals.module.css";

export function SchoolMeals({ locale }: { locale: Locale }) {
  const content = schoolMealsContent[locale];

  return (
    <section aria-labelledby="school-meals-title" className={styles.section} id="school-meals">
      <div className="shell">
        <div className={styles.notice}>
          <div className={styles.overview}>
            <div>
              <p className={styles.eyebrow}>{content.eyebrow}</p>
              <h2 id="school-meals-title">{content.title}</h2>
              <p>{content.summary}</p>
              <p className={styles.application}>{content.application}</p>
            </div>
            <aside aria-labelledby="meal-application-contact" className={styles.contact}>
              <h3 id="meal-application-contact">{content.contact}</h3>
              <p>{content.returnTo}</p>
              <address dir="ltr" lang="en">
                <span>1843 E. Hudson St.</span>
                <span>Columbus, OH 43211</span>
                <a href="tel:+16148455184">614-845-5184</a>
                <a href="mailto:nslp@uacohio.org">nslp@uacohio.org</a>
              </address>
            </aside>
          </div>

          <details className={styles.disclosure}>
            <summary>{content.disclosure}</summary>
            <article
              aria-labelledby="meal-release-title"
              className={styles.release}
              dir="ltr"
              lang="en"
            >
              <header>
                <h3 id="meal-release-title">MEDIA RELEASE FOR FREE AND REDUCED-PRICE MEALS</h3>
                <p className={styles.releaseSubtitle}>Special Assistance Provision 2 — Base Year</p>
                <p>2026–2027 School Year</p>
              </header>
              <p>
                Universal Academy of Columbus (UAC) today announced a change to its policy for
                serving meals for children served under the National School Lunch Program (NSLP) and
                School Breakfast Program (SBP) for the 2026–2027 school year. This new change will
                allow all children at Universal Academy of Columbus to be served meals at no charge.
              </p>
              <p>
                The ability of Universal Academy of Columbus to offer this special alternative,
                called Provision 2, rests upon the success of the school in receiving a completed
                application for free and reduced-price meals for the National School Lunch Program
                and School Breakfast Program from each household in the school.
              </p>
              <p>
                Applications will be furnished by Universal Academy of Columbus and can be obtained
                at:
              </p>
              <address>
                <span>Universal Academy of Columbus</span>
                <span>1843 E. Hudson St.</span>
                <span>Columbus, OH 43211</span>
              </address>
              <p>
                For questions, please contact Daka Ali, at{" "}
                <a href="tel:+16148455184">614-845-5184</a>.
              </p>
              <p>Completed applications should be returned to the following location:</p>
              <address>
                <span>Universal Academy of Columbus</span>
                <span>Attention: Daka Ali ( NSLP director)</span>
                <span>1843 E. Hudson St.</span>
                <span>Columbus, OH 43211</span>
                <span>
                  Phone: <a href="tel:+16148455184">614-845-5184</a>
                </span>
                <span>
                  Email: <a href="mailto:nslp@uacohio.org">nslp@uacohio.org</a>
                </span>
              </address>
              <h4>USDA NONDISCRIMINATION STATEMENT</h4>
              <p>
                In accordance with Federal civil rights law and U.S. Department of Agriculture
                (USDA) civil rights regulations and policies, the USDA, its Agencies, offices, and
                employees, and institutions participating in or administering USDA programs are
                prohibited from discriminating based on race, color, national origin, religion, sex,
                disability, age, marital status, family/parental status, income derived from a
                public assistance program, political beliefs, or reprisal or retaliation for prior
                civil rights activity, in any program or activity conducted or funded by USDA (not
                all bases apply to all programs). Remedies and complaint filing deadlines vary by
                program or incident.
              </p>
              <p>
                Persons with disabilities who require alternative means of communication for program
                information (e.g., Braille, large print, audiotape, American Sign Language, etc.)
                should contact the State or local Agency that administers the program or contact
                USDA through the Telecommunications Relay Service at 711 (voice and TTY).
                Additionally, program information may be made available in languages other than
                English.
              </p>
            </article>
          </details>
        </div>
      </div>
    </section>
  );
}
