export type SinCategory = "with_kaffarah" | "major" | "common" | "huquq_ibad";

export type ApiSinCategory = "khilwat" | "mali" | "huquq_nas" | "taqsir_faraid" | "other";



export type SinSeverity = "kabira" | "saghira";



export interface Sin {

  id: string;

  name: string;

  icon: string;

  category: SinCategory;

  severity: "kabira" | "saghira";

  desc: string;

  daleel: string;

  conditions: string[];

  kaffarahId?: string;

  kaffarahLabel?: string;

  warning?: string;

  note?: string;

  apiCategory: ApiSinCategory;

}


export const SEVERITY_META: Record<SinSeverity, { label: string; color: string; bg: string; borderColor: string; badge: string }> = {
  kabira: {
    label: "كبيرة",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    borderColor: "border-red-400/40",
    badge: "bg-red-500",
  },
  saghira: {
    label: "صغيرة",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    borderColor: "border-amber-400/40",
    badge: "bg-amber-500",
  },
};


export const SINS: Sin[] = [

  // ── ذنوب لها كفارة شرعية ──────────────────────────────────────────

  {

    id: "iftar_ramadan",

    name: "الإفطار العمد في رمضان",

    icon: "🌙",

    category: "with_kaffarah",

    severity: "kabira",

    desc: "تعمّد الأكل أو الشرب أو الجماع نهار رمضان بغير عذر شرعي.",

    daleel: "«مَن أفطَرَ يوماً من رمضانَ من غيرِ رُخصةٍ ولا مَرَضٍ لم يَقضِه صيامُ الدهرِ كلِّه» — أبو داود",

    conditions: [

      "الإقلاع الفوري والإمساك بقية اليوم",

      "التوبة الصادقة والندم الحقيقي",

      "قضاء اليوم المُفطَر بعد رمضان",

      "أداء الكفارة الشرعية المغلّظة بالترتيب",

    ],

    kaffarahId: "iftar_ramadan",

    kaffarahLabel: "كفارة الإفطار العمد (60 مسكيناً أو شهران)",

    warning: "الكفارة بالترتيب: عتق رقبة → صيام شهرين متتابعين → إطعام 60 مسكيناً.",

    apiCategory: "taqsir_faraid",

  },

  {

    id: "yamin",

    name: "الحنث في اليمين",

    icon: "🤝",

    category: "with_kaffarah",

    severity: "kabira",

    desc: "من حلف بالله على فعل شيء ثم لم يفعله، أو حلف على ترك شيء ثم فعله.",

    daleel: "«فَكَفَّارَتُهُ إِطْعَامُ عَشَرَةِ مَسَاكِينَ» — المائدة 89",

    conditions: [

      "التأكد أن اليمين كانت بالله حقاً",

      "ألا يكون الحنث قسراً أو نسياناً",

      "أداء الكفارة",

      "العزم على صون اليمين مستقبلاً",

    ],

    kaffarahId: "yamin",

    kaffarahLabel: "كفارة اليمين (إطعام 10 مساكين)",

    note: "إن كان الحلف بغير الله فلا كفارة، بل التوبة من الشرك.",

    apiCategory: "other",

  },

  {

    id: "dhihar",

    name: "الظهار",

    icon: "🏠",

    category: "with_kaffarah",

    severity: "kabira",

    desc: "أن يقول الزوج لزوجته: «أنتِ عليّ كظهر أمي» تحريماً لها.",

    daleel: "«الَّذِينَ يُظَاهِرُونَ مِنكُم مِّن نِّسَائِهِم» — المجادلة 2",

    conditions: [

      "التوبة الفورية وعدم الإعادة",

      "أداء الكفارة قبل مسيس الزوجة",

      "استئناف العلاقة الزوجية بعد الكفارة فقط",

    ],

    kaffarahId: "dhihar",

    kaffarahLabel: "كفارة الظهار (شهران أو إطعام 60)",

    warning: "لا يحل الجماع قبل إتمام الكفارة بالترتيب الصارم.",

    apiCategory: "other",

  },

  {

    id: "qatl",

    name: "القتل الخطأ",

    icon: "⚖️",

    category: "with_kaffarah",

    severity: "kabira",

    desc: "قتل نفس مؤمنة خطأً بغير قصد كحوادث السيارات أو الإهمال.",

    daleel: "«وَمَن قَتَلَ مُؤْمِنًا خَطَـًٔا فَتَحْرِيرُ رَقَبَةٍ مُّؤْمِنَةٍ وَدِيَةٌ» — النساء 92",

    conditions: [

      "الحزن والندم الحقيقي",

      "أداء الدية لأهل المقتول كاملة",

      "أداء الكفارة الشرعية",

      "الدعاء المستمر للمقتول",

    ],

    kaffarahId: "qatl",

    kaffarahLabel: "كفارة القتل الخطأ + الدية",

    warning: "الدية والكفارة واجبتان معاً.",

    apiCategory: "huquq_nas",

  },

  {

    id: "haj_itha",

    name: "الأذى في الإحرام",

    icon: "🕋",

    category: "with_kaffarah",

    severity: "kabira",

    desc: "ارتكاب محظور من محظورات الإحرام كحلق الشعر أو لبس المخيط.",

    daleel: "«فَفِدْيَةٌ مِّن صِيَامٍ أَوْ صَدَقَةٍ أَوْ نُسُكٍ» — البقرة 196",

    conditions: [

      "التوبة والاستغفار",

      "اختيار أحد بدائل الكفارة",

    ],

    kaffarahId: "haj_itha",

    kaffarahLabel: "فدية الأذى (3 أيام أو 6 مساكين أو شاة)",

    note: "الخيار للمحرم: صيام 3 أيام، أو إطعام 6 مساكين، أو ذبح شاة.",

    apiCategory: "other",

  },



  // ── كبائر لها شروط توبة خاصة ──────────────────────────────────────

  {

    id: "zina",

    name: "الزنا",

    icon: "🔥",

    category: "major",

    severity: "kabira",

    desc: "من أعظم الكبائر بعد الشرك والقتل، ومُحبط للأعمال.",

    daleel: "«وَلَا تَقْرَبُوا الزِّنَا ۖ إِنَّهُ كَانَ فَاحِشَةً وَسَاءَ سَبِيلًا» — الإسراء 32",

    conditions: [

      "الإقلاع الفوري والبتات عن كل ما يقرّب من الذنب",

      "الاغتسال من الجنابة فوراً",

      "الندم القلبي العميق مع الدموع",

      "سد كل ذريعة: حذف التطبيقات وقطع العلاقة",

      "صلاة ركعتين للتوبة",

      "التفكير الجاد في الزواج الشرعي",

      "الإكثار من الصيام كاسر للشهوة",

    ],

    warning: "لا كفارة مالية محددة، لكن التوبة لا تصح بدون سد كل ذريعة.",

    apiCategory: "khilwat",

  },

  {

    id: "nazar_haram",

    name: "النظر الحرام والأفلام المحرمة",

    icon: "👁️",

    category: "major",

    severity: "kabira",

    desc: "إدمان النظر الحرام والمحتوى الجنسي من أمراض العصر، وهو زنا العين.",

    daleel: "«النَّظَرُ سَهمٌ مَسمومٌ مِن سِهامِ إبليسَ» — الحديث",

    conditions: [

      "حذف كل تطبيقات وروابط المحتوى الحرام فوراً",

      "تفعيل فلاتر الحماية على الأجهزة",

      "التوبة الصادقة مع الندم",

      "غض البصر في الحياة اليومية",

      "الإكثار من الذكر كلما جاء الإغراء",

    ],

    apiCategory: "khilwat",

  },

  {

    id: "istimna",

    name: "الاستمناء",

    icon: "⚠️",

    category: "major",

    severity: "kabira",

    desc: "محرّم بالجمهور ومُضرّ بالجسد والروح، ويُضعف الإرادة.",

    daleel: "«وَالَّذِينَ هُمْ لِفُرُوجِهِمْ حَافِظُونَ» — المؤمنون 5",

    conditions: [

      "الإقلاع الفوري",

      "الاغتسال من الجنابة",

      "قطع كل المحفزات (نظر، أفلام)",

      "الإكثار من الصيام",

      "التفكير الجاد في الزواج",

    ],

    note: "يلزمه الغسل دائماً، والتوبة تكفيه دون كفارة مالية.",

    apiCategory: "khilwat",

  },

  {

    id: "tark_salah",

    name: "ترك الصلاة",

    icon: "🕌",

    category: "major",

    severity: "kabira",

    desc: "ترك الصلاة كبيرة عظيمة وهو الحد الفاصل بين المسلم والكافر.",

    daleel: "«بين الرجل وبين الكفر والشرك ترك الصلاة» — مسلم",

    conditions: [

      "التوبة الصادقة الفورية",

      "قضاء الصلوات الفائتة (القضاء أحوط)",

      "الالتزام بالصلوات الخمس في وقتها من الآن",

      "البدء بصلاة الجماعة",

    ],

    warning: "جمهور العلماء على وجوب قضاء الصلوات الفائتة وإن كثرت.",

    apiCategory: "taqsir_faraid",

  },

  {

    id: "riba",

    name: "أكل الربا",

    icon: "💰",

    category: "major",

    severity: "kabira",

    desc: "من أكبر الكبائر، أعلن الله حرباً على آكله، ويشمل الفوائد البنكية.",

    daleel: "«وَذَرُوا مَا بَقِيَ مِنَ الرِّبَا» — البقرة 278",

    conditions: [

      "التوقف الفوري عن كل معاملة ربوية",

      "رد الفائدة الربوية في الصدقة",

      "استبدال العقود الربوية بعقود إسلامية",

      "التوبة الصادقة",

    ],

    warning: "الفائدة الربوية تُصرف في البر بنية التخلص لا الانتفاع.",

    apiCategory: "mali",

  },

  {

    id: "uquq",

    name: "عقوق الوالدين",

    icon: "👨‍👩‍👦",

    category: "major",

    severity: "kabira",

    desc: "من أكبر الكبائر بعد الشرك، وكل أذى يُحزن الوالد أو الوالدة.",

    daleel: "«وَبِالْوَالِدَيْنِ إِحْسَانًا» — الإسراء 23",

    conditions: [

      "الاعتذار الصادق بالكلام",

      "الرجوع للطاعة والبر الفعلي",

      "الدعاء لهما في كل صلاة",

      "إن توفيا: الدعاء والصدقة عنهما",

    ],

    apiCategory: "other",

  },

  {

    id: "sihr",

    name: "السحر",

    icon: "🌑",

    category: "major",

    severity: "kabira",

    desc: "من الكبائر المهلكة، ومن فعل السحر فقد أشرك بالله.",

    daleel: "«إِنَّمَا نَحْنُ فِتْنَةٌ فَلَا تَكْفُرْ» — البقرة 102",

    conditions: [

      "التوبة الصادقة من الشرك",

      "إبطال السحر وحل العقد إن أمكن",

      "التبرؤ من كل أسباب السحرة",

      "تجديد التوحيد الخالص",

    ],

    warning: "البدء بالإخلاص للتوحيد أولاً.",

    apiCategory: "other",

  },



  // ── حقوق العباد ────────────────────────────────────────────────────

  {

    id: "ghiba",

    name: "الغيبة والنميمة",

    icon: "👅",

    category: "huquq_ibad",

    severity: "kabira",

    desc: "ذكر أخاك بما يكره وهو غائب، أو النقل بين الناس لإيقاع الفتنة.",

    daleel: "«أَيُحِبُّ أَحَدُكُمْ أَن يَأْكُلَ لَحْمَ أَخِيهِ مَيْتًا» — الحجرات 12",

    conditions: [

      "الكف عن الغيبة فوراً",

      "الاستحلال ممن اغتبته إن أمكن",

      "الثناء على من اغتبته في المجالس ذاتها",

      "الإكثار من الاستغفار عن لسانك",

    ],

    note: "إن كان صاحبه لا يعلم فالأرجح ألا تُعلمه وتكثر الدعاء له.",

    apiCategory: "huquq_nas",

  },

  {

    id: "sarqa",

    name: "السرقة والغش",

    icon: "🤲",

    category: "huquq_ibad",

    severity: "kabira",

    desc: "أخذ مال الغير بغير حق، أو الغش في البيع والشراء.",

    daleel: "«وَالسَّارِقُ وَالسَّارِقَةُ فَاقْطَعُوا أَيْدِيَهُمَا» — المائدة 38",

    conditions: [

      "رد المال المسروق لصاحبه كاملاً",

      "إن لم يعرف صاحبه: تصدّق بالقدر المماثل",

      "التوبة الصادقة مع الندم",

      "الالتزام بالكسب الحلال",

    ],

    warning: "لا تُقبل التوبة من السارق حتى يرد ما أخذ أو يستحل صاحبه.",

    apiCategory: "huquq_nas",

  },

  {

    id: "kazib",

    name: "الكذب والخداع",

    icon: "🗣️",

    category: "huquq_ibad",

    severity: "kabira",

    desc: "الكذب من أخلاق المنافقين، وكل كذبة ضررها يمتد للآخرين.",

    daleel: "«وَيْلٌ لِّكُلِّ أَفَّاكٍ أَثِيمٍ» — الجاثية 7",

    conditions: [

      "الرجوع عن الكذبة وإصلاح ضررها",

      "الاعتراف لمن كُذب عليه إن أمكن",

      "العزم الصادق على لزوم الصدق",

      "كفارة اليمين إن كان الكذب مصحوباً بحلف",

    ],

    apiCategory: "huquq_nas",

  },

  {

    id: "zulm_maal",

    name: "أكل أموال الناس بالباطل",

    icon: "💸",

    category: "huquq_ibad",

    severity: "kabira",

    desc: "الاستيلاء على أموال الناس بالظلم أو الاحتيال.",

    daleel: "«من كانت له مظلمة لأخيه فليتحلله منه اليوم» — البخاري",

    conditions: [

      "رد الأموال المأخوذة بالكامل",

      "إن مات صاحبها: تصدّق عنه أو أوصل لورثته",

      "التوبة الصادقة",

      "تطهير مصادر دخلك",

    ],

    warning: "حقوق العباد المالية لا تسقط بالتوبة وحدها.",

    apiCategory: "mali",

  },



  // ── ذنوب شائعة ──────────────────────────────────────────────────────

  {

    id: "ghadab",

    name: "الغضب وسوء المعاملة",

    icon: "😤",

    category: "common",

    severity: "saghira",

    desc: "الغضب جمرة يُلقيها الشيطان في قلب المؤمن.",

    daleel: "«ليس الشديد بالصُّرَعة، إنما الشديد الذي يملك نفسه عند الغضب» — متفق عليه",

    conditions: [

      "التوبة والاستغفار عند كل مرة تغضب",

      "الاعتذار لمن أسأت إليه",

      "التعوذ والوضوء والصمت عند الغضب",

    ],

    apiCategory: "other",

  },

  {

    id: "israf",

    name: "الإسراف والتبذير",

    icon: "🛍️",

    category: "common",

    severity: "saghira",

    desc: "التبذير في المال والطعام والوقت نهاهم الله عنه.",

    daleel: "«إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ» — الأنعام 141",

    conditions: [

      "التوبة والاستغفار",

      "وضع ميزانية شهرية ومحاسبة النفس",

      "التصدق بما فضل",

    ],

    apiCategory: "other",

  },

  {

    id: "lahw",

    name: "اللهو المحرم والغناء",

    icon: "🎵",

    category: "common",

    severity: "saghira",

    desc: "الموسيقى والغناء المحرم وآلات اللهو.",

    daleel: "«وَمِنَ النَّاسِ مَن يَشْتَرِي لَهْوَ الْحَدِيثِ» — لقمان 6",

    conditions: [

      "التوبة والإقلاع",

      "ملء الوقت بالقرآن والذكر بديلاً",

    ],

    apiCategory: "other",

  },

  {

    id: "su_dhan",

    name: "سوء الظن بالله والناس",

    icon: "🌑",

    category: "common",

    severity: "saghira",

    desc: "سوء الظن بالله من الكبائر، وبالناس يفسد القلب.",

    daleel: "«إياكم والظن فإن الظن أكذب الحديث» — متفق عليه",

    conditions: [

      "التوبة وحسن الظن بالله دائماً",

      "تدريب النفس على التفسير الحسن",

      "الاستغفار عند كل خاطر سيئ",

    ],

    apiCategory: "other",

  },

  {

    id: "tafrit_nawafil",

    name: "التفريط في النوافل والأوراد",

    icon: "📿",

    category: "common",

    severity: "saghira",

    desc: "ترك النوافل الراتبة يُضعف القلب ويُفقده النور.",

    daleel: "«من حافظ على شفعة الضحى غُفرت ذنوبه» — الترمذي",

    conditions: [

      "العودة للأوراد والأذكار اليومية",

      "البدء بالسهل وعدم الانقطاع",

    ],

    apiCategory: "other",

  },

  // ── ذنوب شائعة إضافية ─────────────────────────────────────────────
  {
    id: "social_media_waste",
    name: "الإفراط في السوشيال ميديا",
    icon: "📱",
    category: "common",
    severity: "saghira",
    desc: "قضاء ساعات طويلة في تصفح الهاتف دون فائدة يُضيع الوقت ويُضعف الذاكرة.",
    daleel: "«وَلَا تَتَّبِعُوا خُطُوَاتِ الشَّيْطَانِ» — البقرة 168",
    conditions: [
      "تحديد أوقات محددة للاستخدام",
      "تفعيل رقابة الوقت على الهاتف",
      "استبدال الوقت بالقراءة أو الذكر",
    ],
    apiCategory: "other",
  },
  {
    id: "lazy_fajr",
    name: "تفويت صلاة الفجر",
    icon: "🌅",
    category: "common",
    severity: "kabira",
    desc: "النوم عن صلاة الفجر من أكبر أسباب الحرمان من البركة.",
    daleel: "«بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ وَالشَّمْسِ وَضُحَاهَا» — الشمس",
    conditions: [
      "النوم المبكر",
      "تحديد منبه وعدم تأجيله",
      "الصلاة فور الاستيقاظ",
    ],
    apiCategory: "taqsir_faraid",
  },
  {
    id: "backbiting",
    name: "الغيبة",
    icon: "👂",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "ذكر المسلم بما يكره في غيابه، وهو أشد من أكل لحم الميت.",
    daleel: "«وَلَا يَغْتَب بَّعْضُكُم بَعْضًا» — الحجرات 12",
    conditions: [
      "الكف عن الغيبة",
      "الاستغفار للمغتاب",
      "إن أمكن: الاعتذار",
    ],
    apiCategory: "huquq_nas",
  },
  {
    id: "lying",
    name: "الكذب",
    icon: "🎭",
    category: "common",
    severity: "saghira",
    desc: "الكذب يُفسد القلب ويُنقص الإيمان.",
    daleel: "«إِنَّمَا يَفْتَرِي الْكَذِبَ الَّذِينَ لَا يُؤْمِنُونَ» — النحل 105",
    conditions: [
      "الصدق في الأقوال",
      "مراجعة النفس يومياً",
    ],
    apiCategory: "other",
  },
  {
    id: "swearing",
    name: "اليمين والكذب",
    icon: "🤚",
    category: "common",
    severity: "saghira",
    desc: "الحلف بالكذب أو بغير الله من الأخلاق الذميمة.",
    daleel: "«وَلَا تُطِعْ كُلَّ حَلِفٍ مَّهِينٍ» — القلم 10",
    conditions: [
      "اجتناب الحلف",
      "التوبة والاستغفار",
    ],
    apiCategory: "other",
  },
  {
    id: "wasting_time",
    name: "إضاعة الوقت",
    icon: "⏳",
    category: "common",
    severity: "saghira",
    desc: "الوقت أغلى من المال، وإضاعته ذنب متجدد.",
    daleel: "«وَالْعَصْرِ * إِنَّ الْإِنسَانَ لَفِي خُسْرٍ» — العصر",
    conditions: [
      "وضع جدول يومّي",
      "محاسبة النفس أسبوعياً",
    ],
    apiCategory: "other",
  },
  {
    id: "pride",
    name: "الكبر والعجب",
    icon: "👑",
    category: "major",
    severity: "kabira",
    desc: "الكبر يمنع قبول العمل الصالح.",
    daleel: "«إِنَّ اللَّهَ لَا يُحِبُّ مَن كَانَ مُخْتَالًا فَخُورًا» — النساء 36",
    conditions: [
      "التواضع للناس",
      "معرفة نعمة الله",
      "استغفار مستمر",
    ],
    apiCategory: "other",
  },
  {
    id: "envy",
    name: "الحسد",
    icon: "😒",
    category: "common",
    severity: "saghira",
    desc: "الحسد يأكل الحسنات كما تأكل النار الحطب.",
    daleel: "«وَمَا بَدَّلُوا نِعْمَةَ اللَّهِ بِكُفْرٍ» — إبراهيم 28",
    conditions: [
      "الدعاء للأخ بالخير",
      "استغفار من الحسد",
    ],
    apiCategory: "other",
  },
  {
    id: "music",
    name: "الموسيقى والغناء",
    icon: "🎸",
    category: "common",
    severity: "saghira",
    desc: "الموسيقى محرّمة وتُنبت النفاق في القلب.",
    daleel: "«وَمِنَ النَّاسِ مَن يَشْتَرِي لَهْوَ الْحَدِيثِ» — لقمان 6",
    conditions: [
      "ترك الاستماع",
      "استبدال بالقرآن والذكر",
    ],
    apiCategory: "other",
  },
  {
    id: "shaving_beard",
    name: "حلق اللحية",
    icon: "🧔",
    category: "common",
    severity: "saghira",
    desc: "حلق اللحية مخالفة للسنة النبوية.",
    daleel: "«أَحْفُوا الشَّوَارِبَ وَأَعْفُوا اللِّحَى» — متفق عليه",
    conditions: [
      "التوبة وترك الحلق",
      "الالتزام بالسنة",
    ],
    apiCategory: "other",
  },
  {
    id: "mixing",
    name: "الاختلاط المحرم",
    icon: "🚫",
    category: "common",
    severity: "saghira",
    desc: "الاختلاط بين الرجال والنساء يُثير الفتن.",
    daleel: "«وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ» — النور 31",
    conditions: [
      "تجنب الاختلاط",
      "الحفاظ على الحجاب",
    ],
    apiCategory: "khilwat",
  },
  {
    id: "fake_world",
    name: "ادعاء العذر الكاذب",
    icon: "🎭",
    category: "common",
    severity: "saghira",
    desc: "الكذب لتجنب المسؤولية أو الاستفادة.",
    daleel: "«إِنَّمَا يَفْتَرِي الْكَذِبَ الَّذِينَ لَا يُؤْمِنُونَ» — النحل 105",
    conditions: [
      "الصدق في كل الأمور",
      "تحمل المسؤولية",
    ],
    apiCategory: "other",
  },
  {
    id: "stolen_content",
    name: "سرقة المحتوى والفكر",
    icon: "📄",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "نسخ أعمال الآخرين دون ذكر المصدر سرقة.",
    daleel: "«وَلَا تَقْتُلُوا أَنفُسَكُمْ» — النساء 29",
    conditions: [
      "الاعتراف بالمصدر",
      "الحصول على الإذن عند الحاجة",
    ],
    apiCategory: "huquq_nas",
  },
  {
    id: "fake_charity",
    name: "النفاق في الصدقة",
    icon: "💵",
    category: "common",
    severity: "saghira",
    desc: "الصدقة للرياء تبطل الأجر.",
    daleel: "«مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ» — البقرة 261",
    conditions: [
      "إخلاص النية",
      "إخفاء الصدقة",
    ],
    apiCategory: "other",
  },
  {
    id: "breaking_promise",
    name: "نقض العهد والوعد",
    icon: "🤝",
    category: "common",
    severity: "saghira",
    desc: "الوعد مسؤولية، ونقضه يُضعف الثقة.",
    daleel: "«وَأَوْفُوا بِعَهْدِ اللَّهِ إِذَا عَاهَدتُّمْ» — النحل 91",
    conditions: [
      "الوفاء بالوعود",
      "إن تعذر: الاعتذار",
    ],
    apiCategory: "other",
  },
];



export const CATEGORY_META: Record<SinCategory, {

  label: string; groupLabel: string; color: string; bg: string; borderColor: string; icon: string

}> = {

  with_kaffarah: {

    label: "لها كفارة شرعية",

    groupLabel: "🔴 ذنوب لها كفارة شرعية محددة",

    color: "text-red-600 dark:text-red-400",

    bg: "bg-red-500/10",

    borderColor: "border-red-400/40",

    icon: "⚖️",
  },

  major: {

    label: "كبيرة بشروط خاصة",

    groupLabel: "🟠 كبائر لها شروط توبة خاصة",

    color: "text-orange-600 dark:text-orange-400",

    bg: "bg-orange-500/10",

    borderColor: "border-orange-400/40",

    icon: "🔥",
  },

  huquq_ibad: {

    label: "حقوق العباد",

    groupLabel: "🟡 ذنوب تعلقت بها حقوق العباد",

    color: "text-amber-600 dark:text-amber-400",

    bg: "bg-amber-500/10",

    borderColor: "border-amber-400/40",

    icon: "👥",
  },

  common: {

    label: "ذنوب شائعة",

    groupLabel: "🟢 ذنوب شائعة (توبة نصوح تكفيها)",

    color: "text-emerald-600 dark:text-emerald-400",

    bg: "bg-emerald-500/10",

    borderColor: "border-emerald-400/40",

    icon: "🌿",
  },

};



export const SIN_CATEGORY_ORDER: SinCategory[] = [

  "with_kaffarah",

  "major",

  "huquq_ibad",

  "common",

];



let _selectedSins: Sin[] = [];



export function getSelectedSins(): Sin[] {

  return _selectedSins;

}



export function saveSelectedSins(sins: Sin[]) {

  _selectedSins = sins;

}



export function getPrimaryApiCategory(sins: Sin[]): ApiSinCategory {

  const priority: SinCategory[] = ["with_kaffarah", "major", "huquq_ibad", "common"];

  for (const cat of priority) {

    const match = sins.find(s => s.category === cat);

    if (match) return match.apiCategory;

  }

  return "other";

}

