import type { Locale } from "./i18n/locales";

export const schoolUniformStoreUrl =
  "https://schoolcloset.com/private-school/universal-academy-of-columbus.html";

export const schoolUniformStoreContent = {
  en: {
    action: "Shop UAC uniforms",
    resourcesLabel: "Family resources",
  },
  ar: {
    action: "تسوّق الزي المدرسي لـ UAC",
    resourcesLabel: "موارد العائلة",
  },
  so: {
    action: "Iibso dharka dugsiga UAC",
    resourcesLabel: "Khayraadka qoyska",
  },
} satisfies Record<
  Locale,
  {
    action: string;
    resourcesLabel: string;
  }
>;
