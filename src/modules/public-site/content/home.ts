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
  values: { attribution: string; quote: string; body: string };
  welcome: { eyebrow: string; title: string; body: string };
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
    portal: "Kindergarten through eighth grade",
    schoolName: "Universal Academy",
    schoolLocation: "of Columbus",
    navigation: sharedNavigation.en,
    apply: "Start enrollment",
    hero: {
      eyebrow: "A Columbus school community",
      title: "A strong foundation for every learner.",
      summary:
        "Universal Academy brings rigorous learning, character, and an inclusive school community together from kindergarten through eighth grade.",
      primaryAction: "Explore enrollment",
      secondaryAction: "Plan a visit",
      highlights: [
        { value: "K-8", label: "One learning community" },
        { value: "Columbus", label: "Rooted in our city" },
      ],
      visualLabel: "Official Universal Academy of Columbus emblem",
    },
    trustItems: ["Family-centered", "Inclusive and diverse", "Clear enrollment guidance"],
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
          title: "Whole-child growth",
          body: "Academic, spiritual, and social development work together to help each student grow with purpose and confidence.",
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
      visualLabel: "Learning with purpose from kindergarten through eighth grade",
      points: ["Foundational literacy", "Purposeful student support", "High school readiness"],
    },
    values: {
      quote: "Seeking knowledge is an obligation upon every Muslim.",
      attribution: "Prophet Muhammad ﷺ — Sunan Ibn Majah, Hadith 224",
      body: "At UAC, learning is an act of faith and responsibility—one that strengthens the mind, shapes character, and prepares students to serve others.",
    },
    welcome: {
      eyebrow: "Our approach",
      title: "Welcome to UAC",
      body: "At UAC, we believe in nurturing the whole child—academically, spiritually, and socially. Our admissions process is designed to help you understand our values and ensure we’re the right fit for your family’s educational journey.",
    },
    admissions: {
      title: "Ready to learn more about UAC?",
      body: "Explore the admissions journey, plan a visit, and take the next step for your family.",
      action: "Explore admissions",
    },
    footer: {
      summary: "A welcoming K-8 school experience for Columbus families.",
      note: "Rooted in knowledge, character, faith, and community.",
    },
  },
  ar: {
    announcement: "نرحب باهتمام العائلات بالتسجيل للعام 2026-27",
    portal: "من الروضة حتى الصف الثامن",
    schoolName: "الأكاديمية العالمية",
    schoolLocation: "في كولومبوس",
    navigation: sharedNavigation.ar,
    apply: "ابدأ التسجيل",
    hero: {
      eyebrow: "مجتمع مدرسي في كولومبوس",
      title: "أساس قوي لكل متعلم.",
      summary:
        "تجمع الأكاديمية العالمية بين التعلم الجاد وبناء الشخصية ومجتمع مدرسي شامل من الروضة حتى الصف الثامن.",
      primaryAction: "استكشف التسجيل",
      secondaryAction: "خطط لزيارة",
      highlights: [
        { value: "K-8", label: "مجتمع تعليمي واحد" },
        { value: "كولومبوس", label: "جزء من مدينتنا" },
      ],
      visualLabel: "الشعار الرسمي للأكاديمية العالمية في كولومبوس",
    },
    trustItems: ["العائلة أولاً", "مجتمع شامل ومتنوع", "خطوات تسجيل واضحة"],
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
          title: "نمو متكامل للطفل",
          body: "يتكامل النمو الأكاديمي والروحي والاجتماعي لمساعدة كل طالب على التقدم بهدف وثقة.",
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
      visualLabel: "تعلم هادف من الروضة حتى الصف الثامن",
      points: ["مهارات القراءة الأساسية", "دعم هادف للطلاب", "الاستعداد للمرحلة الثانوية"],
    },
    values: {
      quote: "طلب العلم فريضة على كل مسلم.",
      attribution: "النبي محمد ﷺ — سنن ابن ماجه، الحديث 224",
      body: "في UAC، التعلم عبادة ومسؤولية تقوي العقل، وتهذب الشخصية، وتعد الطلاب لخدمة الآخرين.",
    },
    welcome: {
      eyebrow: "نهجنا",
      title: "مرحباً بكم في UAC",
      body: "في UAC، نؤمن برعاية الطفل كاملاً—أكاديمياً وروحياً واجتماعياً. صُممت عملية القبول لتساعدكم على فهم قيمنا والتأكد من أننا الخيار المناسب لمسيرة عائلتكم التعليمية.",
    },
    admissions: {
      title: "هل ترغب في معرفة المزيد عن UAC؟",
      body: "تعرف على رحلة القبول، وخطط لزيارة، واتخذ الخطوة التالية لعائلتك.",
      action: "استكشف القبول",
    },
    footer: {
      summary: "تجربة مدرسية مرحبة من الروضة حتى الصف الثامن لعائلات كولومبوس.",
      note: "راسخة في المعرفة والشخصية والإيمان والمجتمع.",
    },
  },
  so: {
    announcement: "Waxaan soo dhoweyneynaa xiisaha diiwaangelinta 2026-27",
    portal: "Kindergarten ilaa fasalka siddeedaad",
    schoolName: "Universal Academy",
    schoolLocation: "of Columbus",
    navigation: sharedNavigation.so,
    apply: "Bilow diiwaangelinta",
    hero: {
      eyebrow: "Bulsho dugsiyeed Columbus ku taal",
      title: "Aasaas adag oo arday kasta leh.",
      summary:
        "Universal Academy waxay isku keentaa waxbarasho adag, akhlaaq, iyo bulsho dugsiyeed loo dhan yahay laga bilaabo kindergarten ilaa fasalka siddeedaad.",
      primaryAction: "Baro diiwaangelinta",
      secondaryAction: "Qorshee booqasho",
      highlights: [
        { value: "K-8", label: "Hal bulsho waxbarasho" },
        { value: "Columbus", label: "Magaaladeenna ku xidhan" },
      ],
      visualLabel: "Astaanta rasmiga ah ee Universal Academy of Columbus",
    },
    trustItems: ["Qoyska udub-dhexaad u ah", "Bulsho loo dhan yahay oo kala duwan", "Hagitaan cad"],
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
          title: "Koboca ilmaha oo dhan",
          body: "Koboca waxbarasho, ruuxeed, iyo bulsheed ayaa wada jira si arday kastaa ugu koro ujeeddo iyo kalsooni.",
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
      visualLabel: "Waxbarasho ujeeddo leh laga bilaabo kindergarten ilaa fasalka siddeedaad",
      points: [
        "Aasaaska akhriska",
        "Taageero arday oo ujeeddo leh",
        "U diyaar garowga dugsiga sare",
      ],
    },
    values: {
      quote: "Raadinta cilmigu waa waajib saaran Muslim kasta.",
      attribution: "Nabi Muxammad ﷺ — Sunan Ibn Majah, Xadiiska 224",
      body: "UAC, waxbarashadu waa cibaado iyo masuuliyad xoojisa maskaxda, dhista akhlaaqda, ardaydana u diyaarisa inay dadka kale u adeegaan.",
    },
    welcome: {
      eyebrow: "Habkayaga",
      title: "Ku soo dhowow UAC",
      body: "UAC, waxaan aaminsanahay kobcinta ilmaha oo dhan—waxbarashadiisa, ruuxdiisa, iyo bulshadiisa. Habka diiwaangelintu wuxuu kaa caawinayaa inaad fahanto qiyamkayaga oo aad hubiso inaan ku habboonnahay safarka waxbarasho ee qoyskaaga.",
    },
    admissions: {
      title: "Ma rabtaa inaad wax badan ka ogaato UAC?",
      body: "Baro safarka diiwaangelinta, qorshee booqasho, oo qaad tallaabada xigta ee qoyskaaga.",
      action: "Baro diiwaangelinta",
    },
    footer: {
      summary: "Khibrad dugsiyeed K-8 ah oo soo dhoweyn leh oo loogu talagalay qoysaska Columbus.",
      note: "Ku salaysan aqoon, akhlaaq, iimaan, iyo bulsho.",
    },
  },
};
