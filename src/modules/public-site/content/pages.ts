import type { Locale } from "@/modules/shared/i18n/locales";

import type { PublicPageSlug } from "./routes";

export interface PublicPageContent {
  callout: { body: string; status: string; title: string };
  cards: Array<{ body: string; marker: string; title: string }>;
  contactDetails?: Array<{ href?: string; label: string; lines: string[] }>;
  feature: { body: string; eyebrow: string; items: string[]; title: string };
  hero: { eyebrow: string; summary: string; title: string };
  metaDescription: string;
  overview: { body: string; eyebrow: string; title: string };
  signature: "journey" | "pathways" | "mosaic" | "values" | "welcome";
}

type LocalizedPages = Record<PublicPageSlug, PublicPageContent>;

const en: LocalizedPages = {
  admissions: {
    signature: "journey",
    metaDescription:
      "Learn about admissions at Universal Academy of Columbus and take your family’s next step.",
    hero: {
      eyebrow: "Admissions",
      title: "A clear path from first question to a confident next step.",
      summary:
        "Learn about UAC, connect with the school, plan a visit, and prepare for enrollment with confidence.",
    },
    overview: {
      eyebrow: "The family journey",
      title: "Four steps, with guidance at every point.",
      body: "Begin by learning about UAC, asking questions, and getting to know the community. Each conversation should leave your family with a clear next step.",
    },
    cards: [
      {
        marker: "01",
        title: "Learn about UAC",
        body: "Review the school experience, grade journey, and support available to families.",
      },
      {
        marker: "02",
        title: "Talk with the school",
        body: "Ask questions in your preferred language and decide whether a campus visit would help.",
      },
      {
        marker: "03",
        title: "Visit the campus",
        body: "Meet the community and understand what a typical student experience can include.",
      },
      {
        marker: "04",
        title: "Prepare to enroll",
        body: "Get clear guidance about forms, important dates, and the documents your family may need.",
      },
    ],
    feature: {
      eyebrow: "Designed for families",
      title: "Start with a simple, useful conversation.",
      body: "Tell us what your family hopes to learn, which grade you are considering, and the best language for your conversation.",
      items: [
        "Choose a preferred language",
        "Request enrollment information",
        "Ask for a campus visit",
        "Receive a clear next step",
      ],
    },
    callout: {
      title: "Ready to learn more?",
      body: "Explore UAC’s values, prepare your questions, and plan a visit to see whether our community is the right fit for your family.",
      status: "Your next step",
    },
  },
  academics: {
    signature: "pathways",
    metaDescription: "Explore the K-8 academic journey at Universal Academy of Columbus.",
    hero: {
      eyebrow: "Academics",
      title: "A connected K-8 learning journey.",
      summary:
        "Each stage builds strong foundations, growing independence, and thoughtful preparation for high school.",
    },
    overview: {
      eyebrow: "Grade pathways",
      title: "One journey, shaped for each stage of growth.",
      body: "From early foundations through the middle grades, students grow through age-appropriate challenges, steady support, and meaningful opportunities to think independently.",
    },
    cards: [
      {
        marker: "K-2",
        title: "Early foundations",
        body: "Early learning centered on literacy, numeracy, curiosity, and dependable classroom routines.",
      },
      {
        marker: "3-5",
        title: "Building skills",
        body: "Elementary grades that deepen literacy, mathematics, inquiry, and independent learning habits.",
      },
      {
        marker: "6-8",
        title: "Ready for high school",
        body: "Middle grades that strengthen study habits, critical thinking, collaboration, and preparation for high school.",
      },
    ],
    feature: {
      eyebrow: "A focused school day",
      title: "Learning, reflection, movement, and support belong in one rhythm.",
      body: "A purposeful school day gives students time to build core skills, reflect, move, collaborate, and receive the support they need to keep growing.",
      items: [
        "Core academic learning",
        "Student support and intervention",
        "Community and character",
        "Enrichment and next-step planning",
      ],
    },
    callout: {
      title: "Growing with purpose at every stage",
      body: "UAC’s K-8 journey helps learners strengthen essential skills, develop responsibility, and approach high school with confidence.",
      status: "The K-8 journey",
    },
  },
  "student-life": {
    signature: "mosaic",
    metaDescription:
      "Discover student life, participation, service, and belonging at Universal Academy of Columbus.",
    hero: {
      eyebrow: "Student life",
      title: "More than a school day—a place to participate and belong.",
      summary:
        "Student life is where interests become skills, classmates become teammates, and service connects learning to community.",
    },
    overview: {
      eyebrow: "Beyond the classroom",
      title: "A fuller picture of how students grow together.",
      body: "Growth happens wherever students create, collaborate, move, serve, and build meaningful relationships with their peers and community.",
    },
    cards: [
      {
        marker: "Create",
        title: "Arts and expression",
        body: "Creative experiences give students room to communicate ideas, practice new skills, and share their work.",
      },
      {
        marker: "Build",
        title: "Clubs and interests",
        body: "Shared interests help students collaborate, try something new, and discover their strengths.",
      },
      {
        marker: "Move",
        title: "Athletics",
        body: "Movement encourages healthy habits, teamwork, perseverance, and confidence.",
      },
      {
        marker: "Serve",
        title: "Community service",
        body: "Stories of students contributing time, care, and leadership in the wider community.",
      },
      {
        marker: "Gather",
        title: "Family events",
        body: "Gatherings create opportunities for families to connect, celebrate, and strengthen the school community.",
      },
    ],
    feature: {
      eyebrow: "The whole child",
      title: "Belonging gives students room to grow.",
      body: "Student life supports social confidence, responsible choices, healthy relationships, and the courage to contribute.",
      items: [
        "Creative expression",
        "Teamwork and movement",
        "Service and leadership",
        "Family connection",
      ],
    },
    callout: {
      title: "Every student deserves to feel known.",
      body: "A strong school community makes space for students to participate, form friendships, and contribute in ways that reflect their strengths.",
      status: "Participation and belonging",
    },
  },
  about: {
    signature: "values",
    metaDescription: "Learn about the purpose and values of Universal Academy of Columbus.",
    hero: {
      eyebrow: "About UAC",
      title: "A community shaped by knowledge, character, and belonging.",
      summary:
        "Learn what UAC stands for and how knowledge, faith, service, and community shape the educational journey.",
    },
    overview: {
      eyebrow: "Our purpose",
      title:
        "Educate the whole learner and prepare each student to contribute with excellence and care.",
      body: "We nurture academic, spiritual, and social growth so students can meet the future with wisdom, confidence, and care for others.",
    },
    cards: [
      {
        marker: "01",
        title: "Knowledge",
        body: "Learning with curiosity, discipline, and high expectations.",
      },
      {
        marker: "02",
        title: "Character",
        body: "Practicing honesty, responsibility, compassion, and respect.",
      },
      {
        marker: "03",
        title: "Belonging",
        body: "Building a school community where students and families are known.",
      },
      {
        marker: "04",
        title: "Service",
        body: "Connecting personal growth to care for neighbors and community.",
      },
      {
        marker: "05",
        title: "Excellence",
        body: "Doing thoughtful work and continuing to improve.",
      },
    ],
    feature: {
      eyebrow: "Family partnership",
      title: "Education is strongest when school and family grow together.",
      body: "Open communication and shared purpose help families understand the learning journey and support each child with consistency.",
      items: [
        "Clear communication",
        "Respectful relationships",
        "Shared responsibility",
        "A welcoming community",
      ],
    },
    callout: {
      title: "A community built together",
      body: "UAC brings students, families, and educators together around a shared commitment to knowledge, character, faith, and service.",
      status: "Our shared commitment",
    },
  },
  contact: {
    signature: "welcome",
    metaDescription: "Prepare to contact or visit Universal Academy of Columbus.",
    hero: {
      eyebrow: "Contact and visit",
      title: "Start with a question. Leave with a clear next step.",
      summary: "Ask questions, plan a visit, and connect with UAC in English, Arabic, or Somali.",
    },
    overview: {
      eyebrow: "Plan a useful visit",
      title: "Know what you want to learn before you arrive.",
      body: "Think about your child’s grade, your family’s priorities, and the questions that will help you understand the UAC experience.",
    },
    cards: [
      {
        marker: "Visit",
        title: "See the learning environment",
        body: "Ask which spaces, grade levels, and student supports can be included in a tour.",
      },
      {
        marker: "Ask",
        title: "Bring family questions",
        body: "Prepare questions about the school day, enrollment, transportation, meals, or language support.",
      },
      {
        marker: "Connect",
        title: "Choose a language",
        body: "Tell the school whether English, Arabic, Somali, or another language will help your conversation.",
      },
    ],
    feature: {
      eyebrow: "Reach UAC",
      title: "Contact Information",
      body: "Call or email during office hours, or visit us on East Hudson Street in Columbus.",
      items: [],
    },
    contactDetails: [
      { label: "Address", lines: ["1843 E Hudson St.", "Columbus, OH 43211"] },
      { href: "tel:+16148455184", label: "Phone", lines: ["(614) 845-5184"] },
      { href: "mailto:contact@uacohio.org", label: "Email", lines: ["contact@uacohio.org"] },
      { label: "Office Hours", lines: ["Monday - Friday", "8:00 AM - 4:00 PM"] },
    ],
    callout: {
      title: "Schedule a Visit",
      body: "We’d love to show you around our campus and answer any questions you may have.",
      status: "Campus visits",
    },
  },
};

const ar: LocalizedPages = {
  admissions: {
    ...en.admissions,
    metaDescription:
      "تعرف على القبول في الأكاديمية العالمية في كولومبوس واتخذ الخطوة التالية لعائلتك.",
    hero: {
      eyebrow: "القبول",
      title: "مسار واضح من السؤال الأول إلى الخطوة التالية بثقة.",
      summary: "تعرف على UAC، وتواصل مع المدرسة، وخطط لزيارة، واستعد للتسجيل بثقة.",
    },
    overview: {
      eyebrow: "رحلة العائلة",
      title: "أربع خطوات مع الإرشاد في كل مرحلة.",
      body: "ابدأ بالتعرف على UAC وطرح الأسئلة والتواصل مع المجتمع المدرسي. ينبغي أن تنتهي كل محادثة بخطوة تالية واضحة لعائلتك.",
    },
    cards: [
      {
        marker: "01",
        title: "تعرف على UAC",
        body: "استكشف تجربة المدرسة والمراحل الدراسية والدعم المتاح للعائلات.",
      },
      {
        marker: "02",
        title: "تحدث مع المدرسة",
        body: "اطرح أسئلتك بلغتك المفضلة وحدد ما إذا كانت الزيارة ستساعدك.",
      },
      {
        marker: "03",
        title: "زر الحرم المدرسي",
        body: "تعرف على المجتمع وافهم ما يمكن أن تتضمنه تجربة الطالب.",
      },
      {
        marker: "04",
        title: "استعد للتسجيل",
        body: "احصل على إرشادات واضحة حول النماذج والمواعيد المهمة والوثائق التي قد تحتاجها عائلتك.",
      },
    ],
    feature: {
      eyebrow: "مصمم للعائلات",
      title: "ابدأ بمحادثة بسيطة ومفيدة.",
      body: "أخبرنا بما ترغب عائلتك في معرفته، والصف الذي تفكر فيه، واللغة الأنسب للمحادثة.",
      items: [
        "اختيار اللغة المفضلة",
        "طلب معلومات التسجيل",
        "طلب زيارة",
        "استلام خطوة تالية واضحة",
      ],
    },
    callout: {
      title: "هل أنتم مستعدون لمعرفة المزيد؟",
      body: "استكشفوا قيم UAC، وجهزوا أسئلتكم، وخططوا لزيارة لمعرفة مدى ملاءمة مجتمعنا لعائلتكم.",
      status: "خطوتكم التالية",
    },
  },
  academics: {
    ...en.academics,
    metaDescription: "استكشف الرحلة الأكاديمية من الروضة إلى الصف الثامن في UAC.",
    hero: {
      eyebrow: "الأكاديميات",
      title: "رحلة تعليمية مترابطة من الروضة إلى الصف الثامن.",
      summary: "تبني كل مرحلة أساساً قوياً واستقلالاً متزايداً واستعداداً للمرحلة الثانوية.",
    },
    overview: {
      eyebrow: "المراحل الدراسية",
      title: "رحلة واحدة تناسب كل مرحلة من النمو.",
      body: "من الأساس المبكر حتى المرحلة المتوسطة، ينمو الطلاب من خلال تحديات مناسبة لأعمارهم ودعم مستمر وفرص للتفكير باستقلالية.",
    },
    cards: [
      {
        marker: "K-2",
        title: "الأساس المبكر",
        body: "تعلم مبكر يركز على القراءة والحساب والفضول وروتين الصف.",
      },
      {
        marker: "3-5",
        title: "بناء المهارات",
        body: "مرحلة تعمق القراءة والرياضيات والاستقصاء وعادات التعلم المستقل.",
      },
      {
        marker: "6-8",
        title: "الاستعداد للمرحلة الثانوية",
        body: "مرحلة تنمي عادات الدراسة والتفكير النقدي والتعاون والاستعداد للمرحلة الثانوية.",
      },
    ],
    feature: {
      eyebrow: "يوم دراسي مركز",
      title: "التعلم والتأمل والحركة والدعم في إيقاع واحد.",
      body: "يمنح اليوم الدراسي الهادف الطلاب وقتاً لبناء المهارات الأساسية والتأمل والحركة والتعاون والحصول على الدعم اللازم.",
      items: ["التعلم الأكاديمي", "دعم الطلاب", "المجتمع والشخصية", "الإثراء والتخطيط للمستقبل"],
    },
    callout: {
      title: "نمو هادف في كل مرحلة",
      body: "تساعد رحلة UAC من الروضة حتى الصف الثامن الطلاب على تقوية مهاراتهم وتحمل المسؤولية والاستعداد للمرحلة الثانوية بثقة.",
      status: "رحلة الروضة حتى الثامن",
    },
  },
  "student-life": {
    ...en["student-life"],
    metaDescription: "اكتشف حياة الطلاب والمشاركة والخدمة والانتماء في UAC.",
    hero: {
      eyebrow: "حياة الطلاب",
      title: "أكثر من يوم دراسي—مكان للمشاركة والانتماء.",
      summary: "تتحول الاهتمامات إلى مهارات والزملاء إلى فريق ويرتبط التعلم بخدمة المجتمع.",
    },
    overview: {
      eyebrow: "خارج الصف",
      title: "صورة أوسع لنمو الطلاب معاً.",
      body: "يحدث النمو حين يبدع الطلاب ويتعاونون ويتحركون ويخدمون ويبنون علاقات هادفة مع زملائهم ومجتمعهم.",
    },
    cards: [
      {
        marker: "إبداع",
        title: "الفنون والتعبير",
        body: "تمنح التجارب الإبداعية الطلاب مساحة للتعبير عن الأفكار وتنمية المهارات ومشاركة أعمالهم.",
      },
      {
        marker: "بناء",
        title: "النوادي والاهتمامات",
        body: "تساعد الاهتمامات المشتركة الطلاب على التعاون وتجربة الجديد واكتشاف نقاط قوتهم.",
      },
      {
        marker: "حركة",
        title: "الرياضة",
        body: "تشجع الحركة العادات الصحية والعمل الجماعي والمثابرة والثقة.",
      },
      { marker: "خدمة", title: "خدمة المجتمع", body: "قصص عن مساهمة الطلاب في المجتمع." },
      {
        marker: "لقاء",
        title: "فعاليات العائلات",
        body: "تمنح اللقاءات العائلات فرصة للتواصل والاحتفال وتقوية المجتمع المدرسي.",
      },
    ],
    feature: {
      eyebrow: "رعاية الطالب كاملاً",
      title: "الانتماء يمنح الطلاب مساحة للنمو.",
      body: "تدعم حياة الطلاب الثقة الاجتماعية والاختيارات المسؤولة والعلاقات الصحية والشجاعة للمساهمة.",
      items: ["التعبير الإبداعي", "العمل الجماعي والحركة", "الخدمة والقيادة", "تواصل العائلات"],
    },
    callout: {
      title: "كل طالب يستحق أن يشعر بأنه معروف.",
      body: "يمنح المجتمع المدرسي القوي الطلاب مساحة للمشاركة وتكوين الصداقات والمساهمة بما يعكس نقاط قوتهم.",
      status: "المشاركة والانتماء",
    },
  },
  about: {
    ...en.about,
    metaDescription: "تعرف على غاية الأكاديمية العالمية في كولومبوس وقيمها.",
    hero: {
      eyebrow: "عن UAC",
      title: "مجتمع تصنعه المعرفة والشخصية والانتماء.",
      summary:
        "تعرف على ما تمثله UAC وكيف تشكل المعرفة والإيمان والخدمة والمجتمع الرحلة التعليمية.",
    },
    overview: {
      eyebrow: "غايتنا",
      title: "تعليم المتعلم كاملاً وإعداده للمساهمة بتميز وعناية.",
      body: "نرعى النمو الأكاديمي والروحي والاجتماعي ليواجه الطلاب المستقبل بحكمة وثقة وعناية بالآخرين.",
    },
    cards: [
      { marker: "01", title: "المعرفة", body: "تعلم بفضول وانضباط وتوقعات عالية." },
      { marker: "02", title: "الشخصية", body: "الصدق والمسؤولية والرحمة والاحترام." },
      { marker: "03", title: "الانتماء", body: "مجتمع يعرف الطلاب والعائلات." },
      { marker: "04", title: "الخدمة", body: "ربط النمو الشخصي بخدمة المجتمع." },
      { marker: "05", title: "التميز", body: "عمل متقن وتحسن مستمر." },
    ],
    feature: {
      eyebrow: "الشراكة مع العائلات",
      title: "يكون التعليم أقوى حين تنمو المدرسة والعائلة معاً.",
      body: "يساعد التواصل المفتوح والهدف المشترك العائلات على فهم رحلة التعلم ودعم كل طفل باستمرار.",
      items: ["تواصل واضح", "علاقات قائمة على الاحترام", "مسؤولية مشتركة", "مجتمع مرحب"],
    },
    callout: {
      title: "مجتمع نبنيه معاً",
      body: "تجمع UAC الطلاب والعائلات والمعلمين حول التزام مشترك بالمعرفة والشخصية والإيمان والخدمة.",
      status: "التزامنا المشترك",
    },
  },
  contact: {
    ...en.contact,
    metaDescription: "استعد للتواصل مع UAC أو زيارتها.",
    hero: {
      eyebrow: "التواصل والزيارة",
      title: "ابدأ بسؤال واخرج بخطوة تالية واضحة.",
      summary: "اطرح أسئلتك، وخطط لزيارة، وتواصل مع UAC بالعربية أو الإنجليزية أو الصومالية.",
    },
    overview: {
      eyebrow: "خطط لزيارة مفيدة",
      title: "اعرف ما تريد تعلمه قبل وصولك.",
      body: "فكر في صف طفلك وأولويات عائلتك والأسئلة التي ستساعدك على فهم تجربة UAC.",
    },
    cards: [
      {
        marker: "زيارة",
        title: "شاهد بيئة التعلم",
        body: "اسأل عن المساحات والمراحل والدعم الممكن تضمينه في الجولة.",
      },
      {
        marker: "سؤال",
        title: "أحضر أسئلة العائلة",
        body: "جهز أسئلتك عن اليوم الدراسي والتسجيل والنقل واللغة.",
      },
      { marker: "تواصل", title: "اختر اللغة", body: "أخبر المدرسة باللغة التي تساعد محادثتك." },
    ],
    feature: {
      eyebrow: "تواصل مع UAC",
      title: "معلومات التواصل",
      body: "اتصل أو راسلنا خلال ساعات الدوام، أو زرنا في شارع إيست هدسون في كولومبوس.",
      items: [],
    },
    contactDetails: [
      { label: "العنوان", lines: ["1843 E Hudson St.", "Columbus, OH 43211"] },
      { href: "tel:+16148455184", label: "الهاتف", lines: ["(614) 845-5184"] },
      {
        href: "mailto:contact@uacohio.org",
        label: "البريد الإلكتروني",
        lines: ["contact@uacohio.org"],
      },
      { label: "ساعات الدوام", lines: ["الاثنين - الجمعة", "8:00 صباحاً - 4:00 مساءً"] },
    ],
    callout: {
      title: "حدد موعداً للزيارة",
      body: "يسعدنا أن نأخذكم في جولة داخل الحرم المدرسي ونجيب عن أي أسئلة لديكم.",
      status: "زيارات الحرم المدرسي",
    },
  },
};

const so: LocalizedPages = {
  admissions: {
    ...en.admissions,
    metaDescription:
      "Baro diiwaangelinta Universal Academy of Columbus oo qaad tallaabada xigta ee qoyskaaga.",
    hero: {
      eyebrow: "Diiwaangelinta",
      title: "Jid cad laga bilaabo su’aasha koowaad ilaa tallaabada xigta.",
      summary: "Baro UAC, la hadal dugsiga, qorshee booqasho, oo isu diyaari diiwaangelinta.",
    },
    overview: {
      eyebrow: "Safarka qoyska",
      title: "Afar tallaabo iyo hagitaan joogto ah.",
      body: "Ku bilow inaad UAC barato, su’aalo weydiiso, oo bulshada dugsiga la xiriirto. Wada hadal kastaa waa inuu qoyskaaga siiyo tallaabo xigta oo cad.",
    },
    cards: [
      {
        marker: "01",
        title: "Baro UAC",
        body: "Akhri waayo-aragnimada dugsiga, heerarka, iyo taageerada qoysaska.",
      },
      {
        marker: "02",
        title: "La hadal dugsiga",
        body: "Su’aalaha ku weydii luqaddaada oo go’aanso haddii booqasho ku caawinayso.",
      },
      {
        marker: "03",
        title: "Booqo dugsiga",
        body: "La kulan bulshada oo faham waayo-aragnimada ardayga.",
      },
      {
        marker: "04",
        title: "Isu diyaari",
        body: "Hel hagitaan cad oo ku saabsan foomamka, taariikhaha muhiimka ah, iyo dukumentiyada qoyskaagu u baahan karo.",
      },
    ],
    feature: {
      eyebrow: "Qoysaska loogu talagalay",
      title: "Ku bilow wada hadal fudud oo waxtar leh.",
      body: "Noo sheeg waxa qoyskaagu rabo inuu barto, fasalka aad ka fikirayso, iyo luqadda ugu habboon wada hadalka.",
      items: [
        "Dooro luqadda",
        "Codso xogta diiwaangelinta",
        "Codso booqasho",
        "Hel tallaabada xigta",
      ],
    },
    callout: {
      title: "Diyaar ma u tahay inaad wax badan barato?",
      body: "Baro qiyamka UAC, diyaari su’aalahaaga, oo qorshee booqasho si aad u ogaato in bulshadayadu ku habboon tahay qoyskaaga.",
      status: "Tallaabadaada xigta",
    },
  },
  academics: {
    ...en.academics,
    metaDescription: "Baro safarka waxbarasho ee K-8 ee UAC.",
    hero: {
      eyebrow: "Waxbarashada",
      title: "Safar waxbarasho oo isku xidhan K-8.",
      summary:
        "Marxalad kastaa waxay dhistaa aasaas, madaxbannaani, iyo u diyaar garow mustaqbalka.",
    },
    overview: {
      eyebrow: "Heerarka",
      title: "Hal safar oo ku habboon heer kasta.",
      body: "Laga bilaabo aasaaska hore ilaa fasallada dhexe, ardaydu waxay ku koraan caqabado da’dooda ku habboon, taageero joogto ah, iyo fursado ay si madax-bannaan ugu fikiraan.",
    },
    cards: [
      {
        marker: "K-2",
        title: "Aasaaska hore",
        body: "Akhris, xisaab, xiise, iyo hab fasal oo joogto ah.",
      },
      {
        marker: "3-5",
        title: "Dhisidda xirfadaha",
        body: "Akhris, xisaab, baaritaan, iyo caadooyin waxbarasho oo madaxbannaan.",
      },
      {
        marker: "6-8",
        title: "U diyaar garowga dugsiga sare",
        body: "Caadooyin waxbarasho, fikir qoto dheer, wada shaqayn, iyo u diyaar garowga dugsiga sare.",
      },
    ],
    feature: {
      eyebrow: "Maalin diirad leh",
      title: "Waxbarasho, milicsi, dhaqdhaqaaq, iyo taageero.",
      body: "Maalin dugsiyeed ujeeddo leh waxay ardayda siisaa waqti ay ku dhistaan xirfadaha aasaasiga ah, ku milicsadaan, ku dhaqaaqaan, ku wada shaqeeyaan, kuna helaan taageerada ay u baahan yihiin.",
      items: [
        "Waxbarashada aasaasiga",
        "Taageerada ardayda",
        "Bulsho iyo akhlaaq",
        "Kobcin iyo qorsheyn",
      ],
    },
    callout: {
      title: "Koboc ujeeddo leh marxalad kasta",
      body: "Safarka K-8 ee UAC wuxuu ardayda ka caawiyaa inay xoojiyaan xirfadaha, qaataan masuuliyad, oo dugsiga sare u wajahaan kalsooni.",
      status: "Safarka K-8",
    },
  },
  "student-life": {
    ...en["student-life"],
    metaDescription: "Baro nolosha ardayga, ka qaybgalka, adeegga, iyo ka mid ahaanshaha UAC.",
    hero: {
      eyebrow: "Nolosha ardayga",
      title: "Wax ka badan maalin dugsi—meel laga qaybqaato oo laga mid noqdo.",
      summary: "Xiisuhu xirfad ayuu noqdaa, ardayduna koox, waxbarashaduna adeeg bulsho.",
    },
    overview: {
      eyebrow: "Fasalka ka baxsan",
      title: "Sawir buuxa oo koboca ardayda ah.",
      body: "Kobocu wuxuu dhacaa marka ardaydu abuuraan, wada shaqeeyaan, dhaqaaqaan, adeegaan, oo xiriir macno leh la dhistaan asxaabtooda iyo bulshadooda.",
    },
    cards: [
      {
        marker: "Abuur",
        title: "Farshaxan",
        body: "Khibradaha hal-abuurka ahi waxay ardayda siiyaan meel ay fikradahooda ku muujiyaan, xirfado ku bartaan, oo shaqadooda ku wadaagaan.",
      },
      {
        marker: "Dhis",
        title: "Naadiyo",
        body: "Xiisaha la wadaago wuxuu ardayda ka caawiyaa wada shaqayn, tijaabinta wax cusub, iyo ogaanshaha awooddooda.",
      },
      {
        marker: "Dhaqaaq",
        title: "Ciyaaraha",
        body: "Dhaqdhaqaaqu wuxuu dhiirrigeliyaa caafimaad, wada shaqayn, adkaysi, iyo kalsooni.",
      },
      {
        marker: "Adeeg",
        title: "Adeegga bulshada",
        body: "Sheekooyin ardaydu bulshada ugu adeegayaan.",
      },
      {
        marker: "Kulmo",
        title: "Dhacdooyinka qoyska",
        body: "Kulamadu waxay qoysaska siiyaan fursado ay ku xiriiraan, u dabaaldegaan, oo bulshada dugsiga u xoojiyaan.",
      },
    ],
    feature: {
      eyebrow: "Ilmaha oo dhan",
      title: "Ka mid ahaanshuhu wuxuu ardayda siiyaa meel ay ku koraan.",
      body: "Nolosha ardaygu waxay taageertaa kalsooni bulsheed, doorashooyin masuuliyad leh, xiriir caafimaad qaba, iyo geesinimada wax ku biirinta.",
      items: [
        "Hal-abuur iyo ismuujin",
        "Wada shaqayn iyo dhaqdhaqaaq",
        "Adeeg iyo hoggaan",
        "Xiriirka qoyska",
      ],
    },
    callout: {
      title: "Arday kastaa wuxuu mudan yahay in la yaqaan.",
      body: "Bulsho dugsiyeed xooggan waxay ardayda siisaa meel ay kaga qaybqaataan, saaxiibo ku yeeshaan, oo awooddooda wax ugu biiriyaan.",
      status: "Ka qaybgal iyo ka mid ahaansho",
    },
  },
  about: {
    ...en.about,
    metaDescription: "Baro ujeeddada iyo qiyamka Universal Academy of Columbus.",
    hero: {
      eyebrow: "Nagu saabsan",
      title: "Bulsho ay dhisaan aqoon, akhlaaq, iyo ka mid ahaansho.",
      summary:
        "Baro waxa UAC u taagan tahay iyo sida aqoon, iimaan, adeeg, iyo bulsho ay u qaabeeyaan safarka waxbarasho.",
    },
    overview: {
      eyebrow: "Ujeeddadayada",
      title: "Bar ardayga oo dhan una diyaari inuu wax ku biiriyo si heer sare ah.",
      body: "Waxaan kobcinnaa waxbarashada, ruuxda, iyo bulshada ardayga si uu mustaqbalka ugu wajaho xikmad, kalsooni, iyo daryeel dadka kale.",
    },
    cards: [
      { marker: "01", title: "Aqoon", body: "Waxbarasho xiise, nidaam, iyo filasho sare leh." },
      { marker: "02", title: "Akhlaaq", body: "Daacadnimo, masuuliyad, naxariis, iyo ixtiraam." },
      { marker: "03", title: "Ka mid ahaansho", body: "Bulsho garanaysa ardayda iyo qoysaska." },
      { marker: "04", title: "Adeeg", body: "Koboca qofka iyo daryeelka bulshada." },
      { marker: "05", title: "Heer sare", body: "Shaqo wanaagsan iyo horumar joogto ah." },
    ],
    feature: {
      eyebrow: "Iskaashiga qoyska",
      title: "Waxbarashadu way xoog badan tahay marka dugsiga iyo qoysku wada koraan.",
      body: "Xiriir furan iyo ujeeddo wadaag ah waxay qoysaska ka caawiyaan inay fahmaan safarka waxbarasho oo ay ilma kasta si joogto ah u taageeraan.",
      items: [
        "Xiriir cad",
        "Xiriir ixtiraam leh",
        "Masuuliyad wadaag ah",
        "Bulsho soo dhoweyn leh",
      ],
    },
    callout: {
      title: "Bulsho aynu wada dhisno",
      body: "UAC waxay ardayda, qoysaska, iyo barayaasha ku mideysaa ballan wadaag ah oo aqoon, akhlaaq, iimaan, iyo adeeg ku dhisan.",
      status: "Ballanqaadkeenna wadajirka ah",
    },
  },
  contact: {
    ...en.contact,
    metaDescription: "Isu diyaari inaad la xiriirto ama booqato UAC.",
    hero: {
      eyebrow: "Xiriir iyo booqasho",
      title: "Su’aal ku bilow, tallaabo cadna ku bax.",
      summary:
        "Weydii su’aalo, qorshee booqasho, oo UAC kula xiriir Soomaali, Carabi, ama Ingiriisi.",
    },
    overview: {
      eyebrow: "Qorshee booqasho",
      title: "Ogow waxa aad rabto inaad barato.",
      body: "Ka fikir fasalka ilmahaaga, mudnaanta qoyskaaga, iyo su’aalaha kaa caawinaya inaad fahanto khibradda UAC.",
    },
    cards: [
      {
        marker: "Booqo",
        title: "Arag deegaanka waxbarashada",
        body: "Weydii meelaha, heerarka, iyo taageerada lagu dari karo booqashada.",
      },
      {
        marker: "Weydii",
        title: "Keen su’aalaha qoyska",
        body: "Diyaari su’aalo ku saabsan maalinta, diiwaangelinta, gaadiidka, iyo luqadda.",
      },
      {
        marker: "Xiriir",
        title: "Dooro luqadda",
        body: "Dugsiga u sheeg luqadda kuu fududaynaysa wada hadalka.",
      },
    ],
    feature: {
      eyebrow: "La xiriir UAC",
      title: "Macluumaadka Xiriirka",
      body: "Nala soo xiriir telefoon ama iimayl inta lagu jiro saacadaha xafiiska, ama nagu soo booqo East Hudson Street ee Columbus.",
      items: [],
    },
    contactDetails: [
      { label: "Cinwaanka", lines: ["1843 E Hudson St.", "Columbus, OH 43211"] },
      { href: "tel:+16148455184", label: "Telefoonka", lines: ["(614) 845-5184"] },
      {
        href: "mailto:contact@uacohio.org",
        label: "Iimaylka",
        lines: ["contact@uacohio.org"],
      },
      { label: "Saacadaha Xafiiska", lines: ["Isniin - Jimce", "8:00 subaxnimo - 4:00 galabnimo"] },
    ],
    callout: {
      title: "Qorshee Booqasho",
      body: "Waxaan jeclaan lahayn inaan ku tusno xaruntayada oo aan ka jawaabno su’aal kasta oo aad qabto.",
      status: "Booqashooyinka dugsiga",
    },
  },
};

export const publicPageContent: Record<Locale, LocalizedPages> = { ar, en, so };
