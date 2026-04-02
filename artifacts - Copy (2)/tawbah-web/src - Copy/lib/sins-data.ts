export type SinCategory = "with_kaffarah" | "major" | "common" | "huquq_ibad";
export type ApiSinCategory = "khilwat" | "mali" | "huquq_nas" | "taqsir_faraid" | "other";

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
];

export const CATEGORY_META: Record<SinCategory, {
  label: string; groupLabel: string; color: string; bg: string; borderColor: string
}> = {
  with_kaffarah: {
    label: "لها كفارة شرعية",
    groupLabel: "🔴 ذنوب لها كفارة شرعية محددة",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    borderColor: "border-red-400/40",
  },
  major: {
    label: "كبيرة بشروط خاصة",
    groupLabel: "🟠 كبائر لها شروط توبة خاصة",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    borderColor: "border-orange-400/40",
  },
  huquq_ibad: {
    label: "حقوق العباد",
    groupLabel: "🟡 ذنوب تعلقت بها حقوق العباد",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    borderColor: "border-amber-400/40",
  },
  common: {
    label: "ذنوب شائعة",
    groupLabel: "🟢 ذنوب شائعة (توبة نصوح تكفيها)",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    borderColor: "border-emerald-400/40",
  },
};

export const SIN_CATEGORY_ORDER: SinCategory[] = [
  "with_kaffarah",
  "major",
  "huquq_ibad",
  "common",
];

export function getSelectedSins(): Sin[] {
  try {
    const saved = localStorage.getItem("selected_sins");
    const ids: string[] = saved ? JSON.parse(saved) : [];
    return ids.map(id => SINS.find(s => s.id === id)).filter(Boolean) as Sin[];
  } catch { return []; }
}

export function saveSelectedSins(sins: Sin[]) {
  try {
    localStorage.setItem("selected_sins", JSON.stringify(sins.map(s => s.id)));
    // Auto-populate kaffarah list from sins that have kaffarah
    const kaffarahIds = sins.filter(s => s.kaffarahId).map(s => s.kaffarahId!);
    if (kaffarahIds.length > 0) {
      const existing: string[] = (() => {
        try { return JSON.parse(localStorage.getItem("selected_kaffarahs") || "[]"); } catch { return []; }
      })();
      const merged = Array.from(new Set([...existing, ...kaffarahIds]));
      localStorage.setItem("selected_kaffarahs", JSON.stringify(merged));
    }
  } catch {}
}

export function getPrimaryApiCategory(sins: Sin[]): ApiSinCategory {
  const priority: SinCategory[] = ["with_kaffarah", "major", "huquq_ibad", "common"];
  for (const cat of priority) {
    const match = sins.find(s => s.category === cat);
    if (match) return match.apiCategory;
  }
  return "other";
}
