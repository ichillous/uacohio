import type { Locale } from "@/modules/shared/i18n/locales";

export const schoolMealsContent = {
  en: {
    announcement: "Free school meals for 2026–2027 · Read the announcement",
    eyebrow: "School meals · 2026–2027",
    title: "Free breakfast and lunch for every UAC student.",
    summary:
      "All UAC students will be served breakfast and lunch at no charge during the 2026–2027 school year through Provision 2.",
    application:
      "Please return one completed meal application per household. Your application helps UAC offer this program. Applications are available at the school.",
    contact: "Applications & questions",
    returnTo: "Pick up an application at UAC and return it to Daka Ali, NSLP director.",
    disclosure: "Read the full media release",
  },
  ar: {
    announcement: "وجبات مدرسية مجانية للعام 2026–2027 · اقرأ الإعلان",
    eyebrow: "الوجبات المدرسية · 2026–2027",
    title: "إفطار وغداء مجانيان لكل طالب في UAC.",
    summary:
      "سيُقدَّم الإفطار والغداء لجميع طلاب UAC دون تكلفة خلال العام الدراسي 2026–2027 من خلال برنامج Provision 2.",
    application:
      "يرجى إعادة طلب وجبات مكتمل واحد لكل أسرة. يساعد طلبكم UAC على تقديم هذا البرنامج. تتوفر الطلبات في المدرسة.",
    contact: "الطلبات والاستفسارات",
    returnTo: "احصلوا على الطلب من UAC وأعيدوه إلى Daka Ali، مدير برنامج NSLP.",
    disclosure: "اقرأ البيان الإعلامي الكامل (بالإنجليزية)",
  },
  so: {
    announcement: "Cunto dugsi oo bilaash ah 2026–2027 · Akhri ogeysiiska",
    eyebrow: "Cuntada dugsiga · 2026–2027",
    title: "Quraac iyo qado bilaash ah arday kasta oo UAC ah.",
    summary:
      "Dhammaan ardayda UAC waxaa la siin doonaa quraac iyo qado bilaash ah sannad-dugsiyeedka 2026–2027 iyada oo loo marayo barnaamijka Provision 2.",
    application:
      "Fadlan soo celiya hal codsi oo cunto ah oo la buuxiyey qoyskiiba. Codsigiinnu wuxuu UAC ka caawinayaa bixinta barnaamijkan. Foomamka codsiga waxaa laga heli karaa dugsiga.",
    contact: "Codsiyada iyo su’aalaha",
    returnTo: "Codsiga ka soo qaado UAC oo ku celi Daka Ali, agaasimaha NSLP.",
    disclosure: "Akhri war-saxaafadeedka oo dhan (Ingiriisi)",
  },
} satisfies Record<
  Locale,
  {
    announcement: string;
    eyebrow: string;
    title: string;
    summary: string;
    application: string;
    contact: string;
    returnTo: string;
    disclosure: string;
  }
>;
