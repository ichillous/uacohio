import type { Locale } from "@/modules/shared/i18n/locales";

export interface HomeContent {
  announcement: string;
  portal: string;
  schoolName: string;
  schoolLocation: string;
  navigation: Array<{ label: string; href: string }>;
  apply: string;
  hero: {
    eyebrow: string;
    title: string;
    summary: string;
    primaryAction: string;
    secondaryAction: string;
    highlights: Array<{ value: string; label: string }>;
    visualLabel: string;
  };
  trustItems: string[];
  pillars: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; body: string; icon: "heart" | "book" | "globe" | "path" }>;
  };
  academics: {
    eyebrow: string;
    title: string;
    body: string;
    visualLabel: string;
    points: string[];
  };
  values: { quote: string; body: string };
  welcome: { eyebrow: string; body: string };
  admissions: { title: string; body: string; action: string };
  footer: { summary: string; note: string };
}

const sharedNavigation = {
  en: [
    { label: "Admissions", href: "/admissions" },
    { label: "Academics", href: "/academics" },
    { label: "Student life", href: "/student-life" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  ar: [
    { label: "القبول", href: "/admissions" },
    { label: "الأكاديميات", href: "/academics" },
    { label: "حياة الطلاب", href: "/student-life" },
    { label: "عن المدرسة", href: "/about" },
    { label: "اتصل بنا", href: "/contact" },
  ],
  so: [
    { label: "Diiwaangelinta", href: "/admissions" },
    { label: "Waxbarashada", href: "/academics" },
    { label: "Nolosha ardayga", href: "/student-life" },
    { label: "Nagu saabsan", href: "/about" },
    { label: "Nala soo xiriir", href: "/contact" },
  ],
} satisfies Record<Locale, HomeContent["navigation"]>;

export const homeContent: Record<Locale, HomeContent> = {
  en: {
    announcement: "Welcoming enrollment interest for 2026-27",
    portal: "Staff portal · in development",
    schoolName: "Universal Academy",
    schoolLocation: "of Columbus",
    navigation: sharedNavigation.en,
    apply: "Start enrollment",
    hero: {
      eyebrow: "A Columbus school community",
      title: "A strong foundation for every learner.",
      summary:
        "Universal Academy brings rigorous learning, character, and a welcoming multilingual community together from kindergarten through eighth grade.",
      primaryAction: "Explore enrollment",
      secondaryAction: "Plan a visit",
      highlights: [
        { value: "K-8", label: "One learning community" },
        { value: "3", label: "Website languages" },
        { value: "Columbus", label: "Rooted in our city" },
      ],
      visualLabel: "Official Universal Academy of Columbus emblem",
    },
    trustItems: ["Family-centered", "Multilingual welcome", "Clear enrollment guidance"],
    pillars: {
      eyebrow: "Why families choose UAC",
      title: "Learning shaped by knowledge, character, and belonging.",
      items: [
        {
          title: "Character and community",
          body: "Respect, honesty, service, and responsibility are practiced throughout the school day.",
          icon: "heart",
        },
        {
          title: "Academic growth",
          body: "A clear K-8 learning path helps students build skills and prepare for what comes next.",
          icon: "book",
        },
        {
          title: "A multilingual welcome",
          body: "Families can begin exploring UAC in English, Arabic, or Somali from their first visit.",
          icon: "globe",
        },
        {
          title: "A guided enrollment path",
          body: "Plain-language steps help families understand how to learn more, visit, and enroll.",
          icon: "path",
        },
      ],
    },
    academics: {
      eyebrow: "The academic journey",
      title: "Every grade builds toward confident next steps.",
      body: "The UAC experience is designed as a connected journey: strong early foundations, growing independence, and thoughtful preparation for a confident transition to high school.",
      visualLabel: "Classroom photography coming after content approval",
      points: ["Foundational literacy", "Purposeful student support", "High school readiness"],
    },
    values: {
      quote: "Knowledge grows further when character grows with it.",
      body: "UAC is designed as a place where students are known, families are welcomed, and learning connects to service and responsibility.",
    },
    welcome: {
      eyebrow: "You are welcome here",
      body: "This first release establishes a direct path for English-, Arabic-, and Somali-speaking families. School-approved translations and content review remain part of the launch process.",
    },
    admissions: {
      title: "Ready to learn more about UAC?",
      body: "Review the enrollment path and share your interest when the admissions workflow opens.",
      action: "Enrollment form coming next",
    },
    footer: {
      summary: "A multilingual K-8 school experience for Columbus families.",
      note: "Launch content is pending final school review.",
    },
  },
  ar: {
    announcement: "نرحب باهتمام العائلات بالتسجيل للعام 2026-27",
    portal: "بوابة الموظفين · قيد التطوير",
    schoolName: "الأكاديمية العالمية",
    schoolLocation: "في كولومبوس",
    navigation: sharedNavigation.ar,
    apply: "ابدأ التسجيل",
    hero: {
      eyebrow: "مجتمع مدرسي في كولومبوس",
      title: "أساس قوي لكل متعلم.",
      summary:
        "تجمع الأكاديمية العالمية بين التعلم الجاد وبناء الشخصية ومجتمع متعدد اللغات من الروضة حتى الصف الثامن.",
      primaryAction: "استكشف التسجيل",
      secondaryAction: "خطط لزيارة",
      highlights: [
        { value: "K-8", label: "مجتمع تعليمي واحد" },
        { value: "3", label: "لغات للموقع" },
        { value: "كولومبوس", label: "جزء من مدينتنا" },
      ],
      visualLabel: "الشعار الرسمي للأكاديمية العالمية في كولومبوس",
    },
    trustItems: ["العائلة أولاً", "ترحيب متعدد اللغات", "خطوات تسجيل واضحة"],
    pillars: {
      eyebrow: "لماذا تختار العائلات UAC",
      title: "تعلم يجمع المعرفة والشخصية والانتماء.",
      items: [
        {
          title: "الشخصية والمجتمع",
          body: "يمارس الطلاب الاحترام والصدق والخدمة والمسؤولية خلال يومهم الدراسي.",
          icon: "heart",
        },
        {
          title: "النمو الأكاديمي",
          body: "مسار تعليمي واضح من الروضة إلى الصف الثامن يهيئ الطلاب للمستقبل.",
          icon: "book",
        },
        {
          title: "ترحيب متعدد اللغات",
          body: "يمكن للعائلات استكشاف المدرسة بالإنجليزية أو العربية أو الصومالية.",
          icon: "globe",
        },
        {
          title: "مسار تسجيل موجه",
          body: "خطوات سهلة تساعد العائلات على التعرف والزيارة والاستعداد للتسجيل.",
          icon: "path",
        },
      ],
    },
    academics: {
      eyebrow: "الرحلة الأكاديمية",
      title: "كل صف يبني خطوة واثقة نحو المستقبل.",
      body: "صممت تجربة UAC كرحلة مترابطة تبدأ بأساس قوي وتنمي الاستقلال وتستعد للانتقال بثقة إلى المرحلة الثانوية.",
      visualLabel: "ستضاف صور الصفوف بعد اعتماد المحتوى",
      points: ["مهارات القراءة الأساسية", "دعم هادف للطلاب", "الاستعداد للمرحلة الثانوية"],
    },
    values: {
      quote: "تنمو المعرفة أكثر عندما تنمو معها الشخصية.",
      body: "نسعى إلى بيئة يعرف فيها كل طالب وتشعر فيها كل عائلة بالترحيب ويرتبط التعلم بالخدمة والمسؤولية.",
    },
    welcome: {
      eyebrow: "أهلاً وسهلاً بكم",
      body: "يؤسس هذا الإصدار مساراً مباشراً للعائلات الناطقة بالإنجليزية والعربية والصومالية، مع مراجعة المدرسة للمحتوى والترجمات قبل الإطلاق.",
    },
    admissions: {
      title: "هل ترغب في معرفة المزيد عن UAC؟",
      body: "تعرف على مسار التسجيل وشارك اهتمامك عند فتح نموذج القبول.",
      action: "نموذج التسجيل قيد الإعداد",
    },
    footer: {
      summary: "تجربة مدرسية متعددة اللغات لعائلات كولومبوس.",
      note: "محتوى الإطلاق بانتظار المراجعة النهائية من المدرسة.",
    },
  },
  so: {
    announcement: "Waxaan soo dhoweyneynaa xiisaha diiwaangelinta 2026-27",
    portal: "Bogga shaqaalaha · waa la dhisayaa",
    schoolName: "Universal Academy",
    schoolLocation: "of Columbus",
    navigation: sharedNavigation.so,
    apply: "Bilow diiwaangelinta",
    hero: {
      eyebrow: "Bulsho dugsiyeed Columbus ku taal",
      title: "Aasaas adag oo arday kasta leh.",
      summary:
        "Universal Academy waxay isku keentaa waxbarasho adag, akhlaaq, iyo bulsho luqado badan ku hadasha laga bilaabo kindergarten ilaa fasalka siddeedaad.",
      primaryAction: "Baro diiwaangelinta",
      secondaryAction: "Qorshee booqasho",
      highlights: [
        { value: "K-8", label: "Hal bulsho waxbarasho" },
        { value: "3", label: "Luqadaha bogga" },
        { value: "Columbus", label: "Magaaladeenna ku xidhan" },
      ],
      visualLabel: "Astaanta rasmiga ah ee Universal Academy of Columbus",
    },
    trustItems: ["Qoyska udub-dhexaad u ah", "Soo dhoweyn luqado badan", "Hagitaan cad"],
    pillars: {
      eyebrow: "Sababta qoysasku u doortaan UAC",
      title: "Waxbarasho isku darta aqoon, akhlaaq, iyo ka mid ahaansho.",
      items: [
        {
          title: "Akhlaaq iyo bulsho",
          body: "Ixtiraam, daacadnimo, adeeg, iyo masuuliyad ayaa lagu dhaqmaa maalinta dugsiga.",
          icon: "heart",
        },
        {
          title: "Koboc waxbarasho",
          body: "Jid waxbarasho oo K-8 ah ayaa ardayda u diyaariya tallaabada xigta.",
          icon: "book",
        },
        {
          title: "Soo dhoweyn luqado badan",
          body: "Qoysasku waxay UAC ku baran karaan Ingiriisi, Carabi, ama Soomaali.",
          icon: "globe",
        },
        {
          title: "Jid diiwaangelin oo cad",
          body: "Tallaabooyin fudud ayaa qoysaska ka caawiya barashada, booqashada, iyo diiwaangelinta.",
          icon: "path",
        },
      ],
    },
    academics: {
      eyebrow: "Safarka waxbarashada",
      title: "Fasal kasta wuxuu dhisaa tallaabo kalsooni leh.",
      body: "Waayo-aragnimada UAC waa safar isku xidhan: aasaas hore oo xooggan, madaxbannaani sii koraysa, iyo u diyaargarow mustaqbalka.",
      visualLabel: "Sawirrada fasalka waxay imanayaan marka nuxurka la ansixiyo",
      points: [
        "Aasaaska akhriska",
        "Taageero arday oo ujeeddo leh",
        "U diyaar garowga dugsiga sare",
      ],
    },
    values: {
      quote: "Aqoontu way sii kortaa marka akhlaaqdu la korto.",
      body: "UAC waxaa loo dhisay meel ardayda la yaqaan, qoysaska la soo dhoweeyo, waxbarashaduna ku xidhan tahay adeeg iyo masuuliyad.",
    },
    welcome: {
      eyebrow: "Ku soo dhowow",
      body: "Sii-dayntan koowaad waxay waddo cad u abuuraysaa qoysaska ku hadla Ingiriisi, Carabi, iyo Soomaali. Turjumaadda waxaa dib u eegi doona dugsiga ka hor daahfurka.",
    },
    admissions: {
      title: "Ma rabtaa inaad wax badan ka ogaato UAC?",
      body: "Baro jidka diiwaangelinta oo nala wadaag xiisahaaga marka nidaamka codsigu furmo.",
      action: "Foomka diiwaangelintu wuu soo socdaa",
    },
    footer: {
      summary: "Khibrad dugsiyeed luqado badan leh oo loogu talagalay qoysaska Columbus.",
      note: "Nuxurka daahfurku wuxuu sugayaa dib-u-eegista ugu dambeysa ee dugsiga.",
    },
  },
};
