import { getEidStatus, type EidPeriod } from "@/lib/eid-utils";
import type { BannerItem, BannerSlide, BannerType } from "./types";

// ─── Type styles ──────────────────────────────────────────────────────────────

export const TYPE_STYLES: Record<
  BannerType,
  { gradient: string; border: string; iconColor: string }
> = {
  ayah: {
    gradient: "from-emerald-600/20 to-emerald-300/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-600",
  },
  hadith: {
    gradient: "from-amber-500/20 to-amber-300/5",
    border: "border-amber-400/20",
    iconColor: "text-amber-600",
  },
  nafl: {
    gradient: "from-indigo-600/20 to-blue-400/5",
    border: "border-indigo-400/20",
    iconColor: "text-indigo-500",
  },
  dua: {
    gradient: "from-violet-600/20 to-purple-300/5",
    border: "border-violet-400/20",
    iconColor: "text-violet-600",
  },
  wisdom: {
    gradient: "from-rose-500/20 to-pink-300/5",
    border: "border-rose-400/20",
    iconColor: "text-rose-500",
  },
  season: {
    gradient: "from-teal-500/20 to-emerald-300/5",
    border: "border-teal-400/20",
    iconColor: "text-teal-600",
  },
};

// ─── Banner slides ────────────────────────────────────────────────────────────

export const BANNER_SLIDES: BannerSlide[] = [
  {
    label: "آية كريمة",
    icon: "book",
    text: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾ — الزمر: 53",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.08) 100%)",
    borderColor: "rgba(16,185,129,0.3)",
    accent: "#059669",
    labelColor: "#047857",
  },
  {
    label: "حديث شريف",
    icon: "chat",
    text: "«التائبُ من الذنبِ كمَن لا ذنبَ له» — رواه ابن ماجه",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.08) 100%)",
    borderColor: "rgba(245,158,11,0.35)",
    accent: "#d97706",
    labelColor: "#b45309",
  },
  {
    label: "ذكر مأثور",
    icon: "star",
    text: "سبحان الله وبحمده — سبحان الله العظيم. خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن.",
    bg: "linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(2,132,199,0.08) 100%)",
    borderColor: "rgba(14,165,233,0.3)",
    accent: "#0284c7",
    labelColor: "#0369a1",
  },
  {
    label: "نصيحة روحية",
    icon: "sparkles",
    text: "الذنب الذي يُورِث الإنكسار خيرٌ من طاعة تُورِث الكِبر — ابن عطاء الله السكندري",
    bg: "linear-gradient(135deg, rgba(236,72,153,0.16) 0%, rgba(219,39,119,0.07) 100%)",
    borderColor: "rgba(236,72,153,0.28)",
    accent: "#db2777",
    labelColor: "#be185d",
  },
  {
    label: "آية كريمة",
    icon: "book",
    text: "﴿وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَى﴾ — طه: 82",
    bg: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.08) 100%)",
    borderColor: "rgba(99,102,241,0.3)",
    accent: "#4f46e5",
    labelColor: "#4338ca",
  },
  {
    label: "حديث شريف",
    icon: "chat",
    text: "«إنَّ اللهَ يَقبلُ توبةَ العبدِ ما لم يُغَرْغِر» — رواه الترمذي",
    bg: "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.08) 100%)",
    borderColor: "rgba(249,115,22,0.3)",
    accent: "#ea580c",
    labelColor: "#c2410c",
  },
  {
    label: "دعاء مأثور",
    icon: "star",
    text: "«اللهم أنتَ ربي لا إله إلا أنتَ، خلقتني وأنا عبدُك، وأنا على عهدك ووعدك ما استطعتُ، أبوءُ لك بنعمتك وأبوءُ بذنبي فاغفر لي» — سيد الاستغفار",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.08) 100%)",
    borderColor: "rgba(139,92,246,0.3)",
    accent: "#7c3aed",
    labelColor: "#6d28d9",
  },
  {
    label: "نافلة وسنة",
    icon: "sun",
    text: "صلاة الضحى ركعتان — تُصلَّى بعد شروق الشمس بربع ساعة حتى قُبيل الظهر. من داوم عليها فُتحت له أبواب الرزق.",
    bg: "linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(13,148,136,0.08) 100%)",
    borderColor: "rgba(20,184,166,0.3)",
    accent: "#0d9488",
    labelColor: "#0f766e",
  },
  {
    label: "آية كريمة",
    icon: "book",
    text: "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: 110",
    bg: "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 100%)",
    borderColor: "rgba(59,130,246,0.3)",
    accent: "#2563eb",
    labelColor: "#1d4ed8",
  },
  {
    label: "نصيحة روحية",
    icon: "sparkles",
    text: "أعظم ما تفعله بعد المعصية: أن تسارع للصلاة والاستغفار فورَ السقوط — لا تُمَكِّن الشيطان من إقناعك بالتأجيل.",
    bg: "linear-gradient(135deg, rgba(244,63,94,0.16) 0%, rgba(225,29,72,0.07) 100%)",
    borderColor: "rgba(244,63,94,0.28)",
    accent: "#e11d48",
    labelColor: "#be123c",
  },
];

// ─── Banner pool ──────────────────────────────────────────────────────────────

export const BANNER_POOL: BannerItem[] = [
  {
    type: "ayah",
    label: "آية كريمة",
    icon: "book",
    content:
      "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ﴾ — الزمر: 53",
    ayahRef: { surah: 39, ayah: 53 },
    tafsir:
      "قل يا محمد لعبادي الذين أكثروا من الذنوب والمعاصي: لا تيأسوا من رحمة الله ومغفرته، فإن الله يغفر الذنوب جميعًا لمن تاب وأناب — صغيرها وكبيرها. إنه هو الغفور الذي يستر الذنوب، الرحيم الذي يعطف على عباده التائبين. هذه الآية هي أوسع آية في القرآن في باب الرحمة والمغفرة.",
  },
  {
    type: "hadith",
    label: "حديث شريف",
    icon: "chat",
    content: "«إنَّ اللهَ يَقبلُ توبةَ العبدِ ما لم يُغَرْغِر» — رواه الترمذي",
  },
  {
    type: "nafl",
    label: "تذكير بالنوافل",
    icon: "sun",
    content:
      "صلاة الضحى ركعتان — تُصلَّى بعد شروق الشمس بربع ساعة حتى قُبيل الظهر. لا تفوّتها!",
  },
  {
    type: "dua",
    label: "دعاء مأثور",
    icon: "star",
    content:
      "«اللهم إني أعوذ بك من الهمّ والحزن، وأعوذ بك من العجز والكسل، وأعوذ بك من الجبن والبخل»",
  },
  {
    type: "wisdom",
    label: "عبرة ونصيحة",
    icon: "sparkles",
    content:
      "الذنب الذي يُورِث الإنكسار خير من طاعة تُورِث الكِبر — ابن عطاء الله السكندري",
  },
  {
    type: "nafl",
    label: "نافلة الليل",
    icon: "moon",
    content:
      "قيام الليل ولو بركعتين — أفضل الصلاة بعد المكتوبة. الله ينزل في الثلث الأخير فهل ستناديه؟",
  },
  {
    type: "ayah",
    label: "آية كريمة",
    icon: "book",
    content:
      "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: 110",
    ayahRef: { surah: 4, ayah: 110 },
    tafsir:
      "ومن يرتكب ذنبًا أو يضر نفسه بالمعصية والخطيئة — ثم يرجع إلى الله ويطلب مغفرته — يجد الله غفورًا يمحو ذنوبه ويسترها، رحيمًا لا يعاجله بالعقوبة. فالباب مفتوح لكل عبد عاد.",
  },
  {
    type: "hadith",
    label: "حديث شريف",
    icon: "chat",
    content: "«التائبُ مِنَ الذنبِ كمَنْ لا ذنبَ له» — رواه ابن ماجه",
  },
  {
    type: "wisdom",
    label: "نصيحة روحية",
    icon: "sparkles",
    content:
      "كلما ازداد إحساسك بالذنب ازداد دليلاً على يقظة قلبك — فلا تيأس، بل تب وأقبِل.",
  },
  {
    type: "nafl",
    label: "سنة مؤكدة",
    icon: "sun",
    content:
      "السنن الرواتب الـ12: ركعتان قبل الفجر، 4 قبل الظهر، 2 بعده، 2 بعد المغرب، 2 بعد العشاء — من داوم عليها بُنِي له بيت في الجنة.",
  },
  {
    type: "dua",
    label: "دعاء التوبة",
    icon: "star",
    content:
      "«اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي» — سيد الاستغفار",
  },
  {
    type: "ayah",
    label: "آية كريمة",
    icon: "book",
    content:
      "﴿وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَى﴾ — طه: 82",
    ayahRef: { surah: 20, ayah: 82 },
    tafsir:
      "وإني — الله — لكثير المغفرة والعفو لمن تاب عن ذنبه وآمن بي إيمانًا صادقًا وعمل الصالحات بعد توبته ثم ثبت على الهداية واستقام عليها ولم يرتد عنها. فالتوبة الصادقة تجمع أربعة: الرجوع، والإيمان، والعمل، والاستقامة.",
  },
  {
    type: "nafl",
    label: "صيام النوافل",
    icon: "moon",
    content:
      "الاثنين والخميس — أيام تُعرَض فيها الأعمال على الله. أحبّ أن يُعرَض عملي وأنا صائم.",
  },
  {
    type: "wisdom",
    label: "فائدة إيمانية",
    icon: "sparkles",
    content:
      "أعظم ما تفعله بعد المعصية: أن تسارع للصلاة والاستغفار فور السقوط — لا تمكّن الشيطان من إقناعك بالتأجيل.",
  },
];

// ─── Season banner ────────────────────────────────────────────────────────────

export function getSeasonBanner(): BannerItem | null {
  const eid = getEidStatus();
  if (eid.period === "eid_fitr")
    return {
      type: "season",
      label: "🌙 عيد الفطر المبارك",
      content: `عيد فطر مبارك — تقبّل الله منا ومنكم. اليوم ${eid.eidDay === 1 ? "الأول" : eid.eidDay === 2 ? "الثاني" : "الثالث"} من أيام العيد.`,
      icon: "star",
      seasonColor: "from-violet-600/25 to-purple-300/5 border-violet-400/25",
    };
  if (eid.period === "eid_adha")
    return {
      type: "season",
      label: "🐑 عيد الأضحى المبارك",
      content: `عيد أضحى مبارك — تقبّل الله منا ومنكم. اليوم ${eid.eidDay === 1 ? "الأول" : eid.eidDay === 2 ? "الثاني" : "الثالث"} من أيام العيد.`,
      icon: "star",
      seasonColor: "from-emerald-600/25 to-teal-300/5 border-emerald-400/25",
    };
  if (eid.period === "pre_fitr") {
    const d = eid.daysUntilEid;
    return {
      type: "season",
      label: "🌙 العيد على الأبواب",
      content: `عيد الفطر ${d === 1 ? "غداً" : `بعد ${d} أيام`} — أخرج زكاة الفطر وابدأ التكبير وتهيّأ بخير.`,
      icon: "moon",
      seasonColor: "from-violet-600/25 to-purple-300/5 border-violet-400/25",
    };
  }
  if (eid.period === "arafah")
    return {
      type: "season",
      label: "🤲 يوم عرفة — اليوم",
      content:
        "أعظم يوم يُعتَق فيه الناس من النار. صُم وأكثر من الدعاء والاستغفار — غداً عيد الأضحى.",
      icon: "star",
      seasonColor: "from-amber-600/25 to-yellow-300/5 border-amber-400/25",
    };
  if (eid.period === "pre_adha_dhul_hijja") {
    const d = eid.daysUntilEid;
    return {
      type: "season",
      label: "✨ العشر من ذي الحجة",
      content: `أفضل أيام السنة — صيامٌ وذكرٌ وتوبة. عيد الأضحى ${d === 1 ? "غداً" : `بعد ${d} أيام`}.`,
      icon: "sparkles",
      seasonColor: "from-amber-600/25 to-yellow-400/5 border-amber-500/25",
    };
  }
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayOfWeek = now.getDay();
  if (month === 3 && day >= 10 && day <= 19)
    return {
      type: "season",
      label: "رمضان يودّعنا",
      content: "اغتنم ما بقي من رمضان — هي لحظات. العشر الأواخر فرصة لا تتكرر.",
      icon: "moon",
      seasonColor: "from-emerald-600/25 to-teal-400/5 border-emerald-500/25",
    };
  if (month === 8 && day >= 1 && day <= 15)
    return {
      type: "season",
      label: "شعبان — شهر رفع الأعمال",
      content:
        "أعمالك تُرفَع إلى الله قبل رمضان. ابدأ الاستعداد من الآن بصفحة نظيفة.",
      icon: "moon",
      seasonColor: "from-purple-600/25 to-violet-400/5 border-purple-400/25",
    };
  if (month === 1 || month === 2)
    return {
      type: "season",
      label: "الأشهر الحرم",
      content:
        "ذو القعدة وذو الحجة والمحرم ورجب — أشهر عظّمها الله. الحسنات مضاعفة والسيئات مثقّلة.",
      icon: "sparkles",
      seasonColor: "from-sky-600/25 to-blue-400/5 border-sky-400/25",
    };
  if (dayOfWeek === 5)
    return {
      type: "season",
      label: "يوم الجمعة المبارك",
      content:
        "أكثر من الصلاة على النبي ﷺ اليوم — اقرأ سورة الكهف وادعُ في ساعة الإجابة.",
      icon: "sun",
      seasonColor: "from-green-600/25 to-emerald-400/5 border-green-400/25",
    };
  return null;
}
