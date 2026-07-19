import type { Locale } from "@/modules/shared/i18n/locales";

import type { PublicPageSlug } from "./routes";

export interface PublicPageContent {
  callout: { body: string; status: string; title: string };
  cards: Array<{ body: string; marker: string; title: string }>;
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
      "Learn about the developing admissions journey at Universal Academy of Columbus.",
    hero: {
      eyebrow: "Admissions",
      title: "A clear path from first question to a confident next step.",
      summary:
        "Explore how families will learn about UAC, connect with the school, plan a visit, and prepare for enrollment.",
    },
    overview: {
      eyebrow: "The family journey",
      title: "Four steps, with guidance at every point.",
      body: "This page establishes the intended journey. Exact eligibility, documents, deadlines, and response times still require approval from the school’s admissions owner.",
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
        body: "Receive school-approved instructions about forms, dates, and required documents.",
      },
    ],
    feature: {
      eyebrow: "Designed for families",
      title: "The online interest form will stay short and purposeful.",
      body: "The form will collect only the information needed for a first conversation. Sensitive academic, medical, immigration, and disciplinary information is outside this first workflow.",
      items: [
        "Choose a preferred language",
        "Request enrollment information",
        "Ask for a campus visit",
        "Receive a clear next step",
      ],
    },
    callout: {
      title: "Enrollment form coming next",
      body: "The form will open after UAC approves the exact fields, consent notice, response owner, and retention policy.",
      status: "Content and workflow review pending",
    },
  },
  academics: {
    signature: "pathways",
    metaDescription:
      "Explore the developing K-12 academic journey at Universal Academy of Columbus.",
    hero: {
      eyebrow: "Academics",
      title: "A connected K-12 learning journey.",
      summary:
        "Each stage should build strong foundations, growing independence, and thoughtful preparation for life after graduation.",
    },
    overview: {
      eyebrow: "Grade pathways",
      title: "One journey, shaped for each stage of growth.",
      body: "The structure below is a design framework, not a published course catalog. Curriculum names and program claims require academic-owner review.",
    },
    cards: [
      {
        marker: "K-5",
        title: "Strong foundations",
        body: "Early learning centered on literacy, numeracy, curiosity, and dependable classroom routines.",
      },
      {
        marker: "6-8",
        title: "Growing independence",
        body: "Middle grades that help learners strengthen study habits, critical thinking, and collaboration.",
      },
      {
        marker: "9-12",
        title: "Prepared next steps",
        body: "High school planning that connects graduation requirements with college, career, and service goals.",
      },
    ],
    feature: {
      eyebrow: "A focused school day",
      title: "Learning, reflection, movement, and support belong in one rhythm.",
      body: "The final daily schedule will come from the school. The website will explain the rhythm without publishing times or offerings that have not been verified.",
      items: [
        "Core academic learning",
        "Student support and intervention",
        "Community and character",
        "Enrichment and next-step planning",
      ],
    },
    callout: {
      title: "Academic content review",
      body: "Course names, support programs, schedules, graduation data, and performance claims remain unpublished until approved.",
      status: "Academic owner approval required",
    },
  },
  "student-life": {
    signature: "mosaic",
    metaDescription:
      "See how the UAC website will present student life, activities, and belonging.",
    hero: {
      eyebrow: "Student life",
      title: "More than a school day—a place to participate and belong.",
      summary:
        "Student life is where interests become skills, classmates become teammates, and service connects learning to community.",
    },
    overview: {
      eyebrow: "Beyond the classroom",
      title: "A fuller picture of how students grow together.",
      body: "These categories are ready for school-approved programs and photography. No club, sport, event, or accommodation is presented as currently available until confirmed.",
    },
    cards: [
      {
        marker: "Create",
        title: "Arts and expression",
        body: "A future home for visual arts, writing, performance, and student work.",
      },
      {
        marker: "Build",
        title: "Clubs and interests",
        body: "Space for approved clubs that help students collaborate and explore new skills.",
      },
      {
        marker: "Move",
        title: "Athletics",
        body: "A clear presentation of confirmed teams, seasons, eligibility, and participation guidance.",
      },
      {
        marker: "Serve",
        title: "Community service",
        body: "Stories of students contributing time, care, and leadership in the wider community.",
      },
      {
        marker: "Gather",
        title: "Family events",
        body: "School-approved calendars, celebrations, and ways for families to participate.",
      },
    ],
    feature: {
      eyebrow: "Content with care",
      title: "Real student stories require real consent.",
      body: "Launch photography will be selected and approved by UAC. Images of minors need documented permission, purposeful use, and accessible descriptions.",
      items: [
        "Approved program inventory",
        "Family media consent",
        "Accurate event dates",
        "Accessible image descriptions",
      ],
    },
    callout: {
      title: "Student-life gallery in preparation",
      body: "The current geometric tiles intentionally reserve space without placing sample children or unapproved activities on the site.",
      status: "Photography and program inventory pending",
    },
  },
  about: {
    signature: "values",
    metaDescription:
      "Learn about the developing mission, values, and leadership presentation for Universal Academy of Columbus.",
    hero: {
      eyebrow: "About UAC",
      title: "A community shaped by knowledge, character, and belonging.",
      summary:
        "This page will help families understand what UAC stands for, how the school serves students, and who is accountable for its direction.",
    },
    overview: {
      eyebrow: "Mission draft",
      title:
        "Educate the whole learner and prepare each student to contribute with excellence and care.",
      body: "This working statement reflects the saved design direction. It remains clearly marked as a draft until the school approves its official mission language.",
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
      eyebrow: "Leadership",
      title: "Families should know who leads each part of the school.",
      body: "The final page will publish approved names, roles, biographies, and photos. Placeholder people and invented credentials are intentionally excluded.",
      items: [
        "Head of school",
        "Academic leadership",
        "Student support leadership",
        "Family and admissions contact",
      ],
    },
    callout: {
      title: "Official school story pending",
      body: "Founding dates, governance, authorizer details, accreditations, and leadership biographies require source documents and owner approval.",
      status: "Institutional fact review required",
    },
  },
  contact: {
    signature: "welcome",
    metaDescription:
      "Plan how to contact or visit Universal Academy of Columbus once official details are approved.",
    hero: {
      eyebrow: "Contact and visit",
      title: "Start with a question. Leave with a clear next step.",
      summary:
        "The contact experience will help families ask questions, request a visit, and connect in English, Arabic, or Somali.",
    },
    overview: {
      eyebrow: "Plan a useful visit",
      title: "Know what you want to learn before you arrive.",
      body: "Official address, phone, email, office hours, directions, and accessibility information are intentionally withheld until UAC confirms them.",
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
      eyebrow: "Contact details",
      title: "Verified information will appear here before launch.",
      body: "The prototype contained sample contact information. This implementation replaces it with a review state so no family is sent to the wrong place or person.",
      items: [
        "Campus address and map",
        "Main phone and approved messaging channels",
        "General and admissions email",
        "Office and tour hours",
      ],
    },
    callout: {
      title: "Visit request form coming next",
      body: "The form will be enabled after UAC confirms contact routing, available visit windows, consent language, and response ownership.",
      status: "Official contact details pending",
    },
  },
};

const ar: LocalizedPages = {
  admissions: {
    ...en.admissions,
    metaDescription: "تعرف على مسار القبول الجاري تطويره في الأكاديمية العالمية في كولومبوس.",
    hero: {
      eyebrow: "القبول",
      title: "مسار واضح من السؤال الأول إلى الخطوة التالية بثقة.",
      summary: "تعرف على كيفية استكشاف UAC والتواصل مع المدرسة والتخطيط لزيارة والاستعداد للتسجيل.",
    },
    overview: {
      eyebrow: "رحلة العائلة",
      title: "أربع خطوات مع الإرشاد في كل مرحلة.",
      body: "هذه الصفحة توضح المسار المقترح. تحتاج شروط القبول والوثائق والمواعيد إلى اعتماد المدرسة.",
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
        body: "احصل على تعليمات معتمدة حول النماذج والمواعيد والوثائق.",
      },
    ],
    feature: {
      eyebrow: "مصمم للعائلات",
      title: "سيكون نموذج الاهتمام قصيراً وواضحاً.",
      body: "سيجمع النموذج المعلومات اللازمة للمحادثة الأولى فقط، دون معلومات حساسة غير ضرورية.",
      items: [
        "اختيار اللغة المفضلة",
        "طلب معلومات التسجيل",
        "طلب زيارة",
        "استلام خطوة تالية واضحة",
      ],
    },
    callout: {
      title: "نموذج التسجيل قيد الإعداد",
      body: "سيفتح بعد اعتماد الحقول وإشعار الموافقة ومسؤول الرد وسياسة الاحتفاظ.",
      status: "مراجعة المحتوى وسير العمل معلقة",
    },
  },
  academics: {
    ...en.academics,
    metaDescription: "استكشف الرحلة الأكاديمية من الروضة إلى الصف الثاني عشر في UAC.",
    hero: {
      eyebrow: "الأكاديميات",
      title: "رحلة تعليمية مترابطة من الروضة إلى الصف الثاني عشر.",
      summary: "تبني كل مرحلة أساساً قوياً واستقلالاً متزايداً واستعداداً للحياة بعد التخرج.",
    },
    overview: {
      eyebrow: "المراحل الدراسية",
      title: "رحلة واحدة تناسب كل مرحلة من النمو.",
      body: "هذا الهيكل تصميم أولي وليس دليلاً منشوراً للمقررات. تحتاج البرامج إلى مراجعة المسؤول الأكاديمي.",
    },
    cards: [
      {
        marker: "K-5",
        title: "أساس قوي",
        body: "تعلم مبكر يركز على القراءة والحساب والفضول وروتين الصف.",
      },
      {
        marker: "6-8",
        title: "استقلال متزايد",
        body: "مرحلة تنمي عادات الدراسة والتفكير النقدي والتعاون.",
      },
      {
        marker: "9-12",
        title: "خطوات مستقبلية",
        body: "تخطيط يربط التخرج بأهداف الكلية والعمل والخدمة.",
      },
    ],
    feature: {
      eyebrow: "يوم دراسي مركز",
      title: "التعلم والتأمل والحركة والدعم في إيقاع واحد.",
      body: "سيأتي الجدول النهائي من المدرسة ولن ننشر أوقاتاً أو برامج قبل التحقق منها.",
      items: ["التعلم الأكاديمي", "دعم الطلاب", "المجتمع والشخصية", "الإثراء والتخطيط للمستقبل"],
    },
    callout: {
      title: "مراجعة المحتوى الأكاديمي",
      body: "لن تنشر أسماء المقررات والبرامج والجداول والنتائج قبل اعتمادها.",
      status: "يتطلب موافقة المسؤول الأكاديمي",
    },
  },
  "student-life": {
    ...en["student-life"],
    metaDescription: "تعرف على كيفية عرض حياة الطلاب والأنشطة والانتماء في UAC.",
    hero: {
      eyebrow: "حياة الطلاب",
      title: "أكثر من يوم دراسي—مكان للمشاركة والانتماء.",
      summary: "تتحول الاهتمامات إلى مهارات والزملاء إلى فريق ويرتبط التعلم بخدمة المجتمع.",
    },
    overview: {
      eyebrow: "خارج الصف",
      title: "صورة أوسع لنمو الطلاب معاً.",
      body: "هذه المساحات جاهزة للبرامج والصور المعتمدة. لن نقدم أي نشاط على أنه متاح قبل التأكيد.",
    },
    cards: [
      {
        marker: "إبداع",
        title: "الفنون والتعبير",
        body: "مساحة مستقبلية للفنون والكتابة والأداء وأعمال الطلاب.",
      },
      {
        marker: "بناء",
        title: "النوادي والاهتمامات",
        body: "مكان للنوادي المعتمدة التي تنمي التعاون والمهارات.",
      },
      {
        marker: "حركة",
        title: "الرياضة",
        body: "عرض واضح للفرق والمواسم وشروط المشاركة بعد اعتمادها.",
      },
      { marker: "خدمة", title: "خدمة المجتمع", body: "قصص عن مساهمة الطلاب في المجتمع." },
      { marker: "لقاء", title: "فعاليات العائلات", body: "تقويمات معتمدة وطرق مشاركة العائلات." },
    ],
    feature: {
      eyebrow: "محتوى بمسؤولية",
      title: "قصص الطلاب الحقيقية تحتاج موافقة حقيقية.",
      body: "ستختار UAC الصور وتوافق عليها مع توثيق الإذن والاستخدام الهادف والوصف المتاح.",
      items: ["قائمة برامج معتمدة", "موافقة إعلامية", "تواريخ دقيقة", "وصف متاح للصور"],
    },
    callout: {
      title: "معرض حياة الطلاب قيد الإعداد",
      body: "تحجز الأشكال الحالية مكان الصور دون استخدام أطفال أو أنشطة غير معتمدة.",
      status: "الصور وقائمة البرامج معلقة",
    },
  },
  about: {
    ...en.about,
    metaDescription:
      "تعرف على الرسالة والقيم والقيادة الجاري إعدادها للأكاديمية العالمية في كولومبوس.",
    hero: {
      eyebrow: "عن UAC",
      title: "مجتمع تصنعه المعرفة والشخصية والانتماء.",
      summary: "تساعد هذه الصفحة العائلات على فهم ما تمثله UAC ومن يقود المدرسة.",
    },
    overview: {
      eyebrow: "مسودة الرسالة",
      title: "تعليم المتعلم كاملاً وإعداده للمساهمة بتميز وعناية.",
      body: "هذه صياغة عمل مستوحاة من التصميم وتبقى مسودة حتى تعتمد المدرسة النص الرسمي.",
    },
    cards: [
      { marker: "01", title: "المعرفة", body: "تعلم بفضول وانضباط وتوقعات عالية." },
      { marker: "02", title: "الشخصية", body: "الصدق والمسؤولية والرحمة والاحترام." },
      { marker: "03", title: "الانتماء", body: "مجتمع يعرف الطلاب والعائلات." },
      { marker: "04", title: "الخدمة", body: "ربط النمو الشخصي بخدمة المجتمع." },
      { marker: "05", title: "التميز", body: "عمل متقن وتحسن مستمر." },
    ],
    feature: {
      eyebrow: "القيادة",
      title: "من حق العائلات معرفة من يقود كل جزء من المدرسة.",
      body: "ستنشر الصفحة الأسماء والأدوار والسير والصور المعتمدة دون أشخاص أو مؤهلات مختلقة.",
      items: ["رئيس المدرسة", "القيادة الأكاديمية", "قيادة دعم الطلاب", "مسؤول العائلات والقبول"],
    },
    callout: {
      title: "قصة المدرسة الرسمية معلقة",
      body: "تحتاج التواريخ والحوكمة والاعتمادات والسير القيادية إلى مصادر واعتماد.",
      status: "مراجعة الحقائق المؤسسية مطلوبة",
    },
  },
  contact: {
    ...en.contact,
    metaDescription: "خطط للتواصل مع UAC أو زيارتها بعد اعتماد المعلومات الرسمية.",
    hero: {
      eyebrow: "التواصل والزيارة",
      title: "ابدأ بسؤال واخرج بخطوة تالية واضحة.",
      summary:
        "ستساعد تجربة التواصل العائلات على طرح الأسئلة وطلب زيارة والتواصل بالعربية أو الإنجليزية أو الصومالية.",
    },
    overview: {
      eyebrow: "خطط لزيارة مفيدة",
      title: "اعرف ما تريد تعلمه قبل وصولك.",
      body: "لن ننشر العنوان أو الهاتف أو البريد أو الساعات قبل تأكيد UAC لها.",
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
      eyebrow: "معلومات التواصل",
      title: "ستظهر المعلومات المعتمدة هنا قبل الإطلاق.",
      body: "استبدلنا معلومات النموذج التجريبية بحالة مراجعة حتى لا نوجه العائلات إلى جهة خاطئة.",
      items: [
        "عنوان الحرم والخريطة",
        "الهاتف والقنوات المعتمدة",
        "البريد العام وبريد القبول",
        "ساعات المكتب والجولات",
      ],
    },
    callout: {
      title: "نموذج طلب الزيارة قيد الإعداد",
      body: "سيتم تفعيله بعد تأكيد توجيه الطلبات والأوقات والموافقة ومسؤول الرد.",
      status: "معلومات التواصل الرسمية معلقة",
    },
  },
};

const so: LocalizedPages = {
  admissions: {
    ...en.admissions,
    metaDescription: "Baro jidka diiwaangelinta ee loo diyaarinayo Universal Academy of Columbus.",
    hero: {
      eyebrow: "Diiwaangelinta",
      title: "Jid cad laga bilaabo su’aasha koowaad ilaa tallaabada xigta.",
      summary: "Baro UAC, la hadal dugsiga, qorshee booqasho, oo isu diyaari diiwaangelinta.",
    },
    overview: {
      eyebrow: "Safarka qoyska",
      title: "Afar tallaabo iyo hagitaan joogto ah.",
      body: "Boggu wuxuu muujinayaa jidka la qorsheeyay. Shuruudaha, dukumentiyada, iyo taariikhaha dugsigu waa inuu ansixiyaa.",
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
        body: "Hel tilmaamo la ansixiyey oo ku saabsan foomamka iyo dukumentiyada.",
      },
    ],
    feature: {
      eyebrow: "Qoysaska loogu talagalay",
      title: "Foomka xiisuhu wuxuu ahaan doonaa mid gaaban oo cad.",
      body: "Wuxuu ururin doonaa oo keliya xogta loo baahan yahay wada hadalka koowaad.",
      items: [
        "Dooro luqadda",
        "Codso xogta diiwaangelinta",
        "Codso booqasho",
        "Hel tallaabada xigta",
      ],
    },
    callout: {
      title: "Foomka diiwaangelintu wuu soo socdaa",
      body: "Wuxuu furmi doonaa marka UAC ansixiso xogta, oggolaanshaha, milkiilaha jawaabta, iyo kaydinta.",
      status: "Dib-u-eegis ayaa socota",
    },
  },
  academics: {
    ...en.academics,
    metaDescription: "Baro safarka waxbarasho ee K-12 ee UAC.",
    hero: {
      eyebrow: "Waxbarashada",
      title: "Safar waxbarasho oo isku xidhan K-12.",
      summary:
        "Marxalad kastaa waxay dhistaa aasaas, madaxbannaani, iyo u diyaar garow mustaqbalka.",
    },
    overview: {
      eyebrow: "Heerarka",
      title: "Hal safar oo ku habboon heer kasta.",
      body: "Qaabkani waa naqshad, mana aha liis koorsooyin la daabacay. Dugsigu waa inuu ansixiyaa barnaamijyada.",
    },
    cards: [
      {
        marker: "K-5",
        title: "Aasaas xooggan",
        body: "Akhris, xisaab, xiise, iyo hab fasal oo joogto ah.",
      },
      {
        marker: "6-8",
        title: "Madaxbannaani",
        body: "Dhaqan waxbarasho, fikir qoto dheer, iyo wada shaqayn.",
      },
      {
        marker: "9-12",
        title: "Tallaabooyinka mustaqbalka",
        body: "Qorshe ku xira qalin-jabinta jaamacad, shaqo, iyo adeeg.",
      },
    ],
    feature: {
      eyebrow: "Maalin diirad leh",
      title: "Waxbarasho, milicsi, dhaqdhaqaaq, iyo taageero.",
      body: "Jadwalka kama dambaysta ah dugsiga ayaa bixinaya; wax aan la xaqiijin lama daabici doono.",
      items: [
        "Waxbarashada aasaasiga",
        "Taageerada ardayda",
        "Bulsho iyo akhlaaq",
        "Kobcin iyo qorsheyn",
      ],
    },
    callout: {
      title: "Dib-u-eegista waxbarashada",
      body: "Koorsooyin, barnaamijyo, jadwal, iyo natiijooyin lama daabici doono ilaa la ansixiyo.",
      status: "Ansixinta hoggaanka waxbarashada ayaa loo baahan yahay",
    },
  },
  "student-life": {
    ...en["student-life"],
    metaDescription: "Baro sida boggu u soo bandhigi doono nolosha ardayga UAC.",
    hero: {
      eyebrow: "Nolosha ardayga",
      title: "Wax ka badan maalin dugsi—meel laga qaybqaato oo laga mid noqdo.",
      summary: "Xiisuhu xirfad ayuu noqdaa, ardayduna koox, waxbarashaduna adeeg bulsho.",
    },
    overview: {
      eyebrow: "Fasalka ka baxsan",
      title: "Sawir buuxa oo koboca ardayda ah.",
      body: "Qaybahani waxay sugayaan barnaamijyo iyo sawirro la ansixiyey. Wax aan la xaqiijin lama sheegayo.",
    },
    cards: [
      {
        marker: "Abuur",
        title: "Farshaxan",
        body: "Meel loogu talagalay farshaxanka, qoraalka, iyo shaqada ardayga.",
      },
      {
        marker: "Dhis",
        title: "Naadiyo",
        body: "Naadiyo la ansixiyey oo kobciya wada shaqayn iyo xirfado.",
      },
      {
        marker: "Dhaqaaq",
        title: "Ciyaaraha",
        body: "Kooxo, xilliyo, iyo hagitaan la xaqiijiyey.",
      },
      {
        marker: "Adeeg",
        title: "Adeegga bulshada",
        body: "Sheekooyin ardaydu bulshada ugu adeegayaan.",
      },
      {
        marker: "Kulmo",
        title: "Dhacdooyinka qoyska",
        body: "Jadwal iyo siyaabo ay qoysasku uga qaybqaataan.",
      },
    ],
    feature: {
      eyebrow: "Nuxur masuul ah",
      title: "Sheekooyinka ardaydu waxay u baahan yihiin oggolaansho.",
      body: "UAC ayaa dooranaysa sawirrada, iyadoo la diiwaangelinayo oggolaanshaha iyo sharaxaadda la heli karo.",
      items: [
        "Barnaamijyo la ansixiyey",
        "Oggolaanshaha sawirka",
        "Taariikho sax ah",
        "Sharaxaad sawir",
      ],
    },
    callout: {
      title: "Sawirrada nolosha ardayga waa la diyaarinayaa",
      body: "Qaababka hadda jira waxay meel hayaan iyada oo aan la isticmaalin carruur ama hawlo aan la ansixin.",
      status: "Sawirro iyo barnaamijyo ayaa la sugayaa",
    },
  },
  about: {
    ...en.about,
    metaDescription: "Baro himilada, qiyamka, iyo hoggaanka loo diyaarinayo UAC.",
    hero: {
      eyebrow: "Nagu saabsan",
      title: "Bulsho ay dhisaan aqoon, akhlaaq, iyo ka mid ahaansho.",
      summary:
        "Boggu wuxuu qoysaska ka caawinayaa inay fahmaan qiyamka UAC iyo cidda dugsiga hoggaamisa.",
    },
    overview: {
      eyebrow: "Qabyo himilo",
      title: "Bar ardayga oo dhan una diyaari inuu wax ku biiriyo si heer sare ah.",
      body: "Qoraalkani waa qabyo ka timid jihada naqshadda ilaa dugsigu ansixiyo qoraalka rasmiga ah.",
    },
    cards: [
      { marker: "01", title: "Aqoon", body: "Waxbarasho xiise, nidaam, iyo filasho sare leh." },
      { marker: "02", title: "Akhlaaq", body: "Daacadnimo, masuuliyad, naxariis, iyo ixtiraam." },
      { marker: "03", title: "Ka mid ahaansho", body: "Bulsho garanaysa ardayda iyo qoysaska." },
      { marker: "04", title: "Adeeg", body: "Koboca qofka iyo daryeelka bulshada." },
      { marker: "05", title: "Heer sare", body: "Shaqo wanaagsan iyo horumar joogto ah." },
    ],
    feature: {
      eyebrow: "Hoggaanka",
      title: "Qoysasku waa inay ogaadaan cidda hoggaamisa dugsiga.",
      body: "Magacyo, doorar, taariikh nololeed, iyo sawirro la ansixiyey ayaa la daabici doonaa.",
      items: [
        "Madaxa dugsiga",
        "Hoggaanka waxbarashada",
        "Taageerada ardayda",
        "Xiriirka qoysaska",
      ],
    },
    callout: {
      title: "Sheekada rasmiga ah waa la sugayaa",
      body: "Taariikho, maamulka, aqoonsiyada, iyo taariikh nololeedyadu waxay u baahan yihiin ilo iyo ansixin.",
      status: "Dib-u-eegis xaqiiqo ayaa loo baahan yahay",
    },
  },
  contact: {
    ...en.contact,
    metaDescription:
      "Qorshee sida loola xiriiro ama loo booqdo UAC marka xogta rasmiga ah la ansixiyo.",
    hero: {
      eyebrow: "Xiriir iyo booqasho",
      title: "Su’aal ku bilow, tallaabo cadna ku bax.",
      summary:
        "Qoysasku waxay codsan doonaan booqasho oo ku xiriiri doonaan Soomaali, Carabi, ama Ingiriisi.",
    },
    overview: {
      eyebrow: "Qorshee booqasho",
      title: "Ogow waxa aad rabto inaad barato.",
      body: "Cinwaan, telefoon, iimayl, iyo saacado lama daabici doono ilaa UAC xaqiijiso.",
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
      eyebrow: "Xogta xiriirka",
      title: "Xog la xaqiijiyey ayaa halkan iman doonta.",
      body: "Xogtii tijaabada ahayd waxaa lagu beddelay xaalad dib-u-eegis si qoysaska meel khaldan loogu dirin.",
      items: [
        "Cinwaan iyo khariidad",
        "Telefoon iyo kanaallo",
        "Iimayl guud iyo diiwaangelin",
        "Saacadaha xafiiska",
      ],
    },
    callout: {
      title: "Foomka booqashadu wuu soo socdaa",
      body: "Wuxuu furmi doonaa marka UAC xaqiijiso jadwalka, oggolaanshaha, iyo cidda ka jawaabaysa.",
      status: "Xogta rasmiga ah ayaa la sugayaa",
    },
  },
};

export const publicPageContent: Record<Locale, LocalizedPages> = { ar, en, so };
