export const publicPageSlugs = [
  "admissions",
  "academics",
  "student-life",
  "about",
  "contact",
] as const;

export type PublicPageSlug = (typeof publicPageSlugs)[number];

export function isPublicPageSlug(value: string): value is PublicPageSlug {
  return publicPageSlugs.includes(value as PublicPageSlug);
}
