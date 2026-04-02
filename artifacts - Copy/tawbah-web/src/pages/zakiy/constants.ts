import type { Message } from "./types";

export const VOICE_PROFILES = [
  {
    id: "sheikh-calm",
    gender: "male" as const,
    name: "الشيخ الهادئ",
    desc: "صوت رجولي وقور بفصحى سليمة",
    emoji: "🕌",
    tag: "هادئ · فصحى",
  },
  {
    id: "wise-friend",
    gender: "male" as const,
    name: "الصاحب الحكيم",
    desc: "شاب ٣٥ سنة، دافئ وحكيم كصاحب",
    emoji: "🤝",
    tag: "ودود · طبيعي",
  },
  {
    id: "young-guide",
    gender: "male" as const,
    name: "المرشد الشاب",
    desc: "شاب حيوي وواضح ومُشجِّع",
    emoji: "✨",
    tag: "حيوي · مباشر",
  },
  {
    id: "wise-teacher",
    gender: "female" as const,
    name: "المعلمة الفاضلة",
    desc: "صوت أنثوي رزين بفصحى واضحة",
    emoji: "📚",
    tag: "هادئة · فصحى",
  },
  {
    id: "sister-caring",
    gender: "female" as const,
    name: "الأخت المتفهمة",
    desc: "شابة دافئة تتكلم بصدق وحنان",
    emoji: "💙",
    tag: "حنونة · طبيعية",
  },
  {
    id: "gentle-mentor",
    gender: "female" as const,
    name: "المرشدة الحنونة",
    desc: "ناعمة ومطمئنة تبثّ السكينة",
    emoji: "🌸",
    tag: "ناعمة · مريحة",
  },
];

export const VOICE_PROFILE_STORAGE_KEY = "zakiy_voice_profile";
export const DEFAULT_VOICE_PROFILE_ID = "young-guide";

export const ALL_STARTER_QUESTIONS: Array<{ q: string; icon: string }> = [
  { q: "إزاي أتوب توبة صادقة؟", icon: "🌿" },
  { q: "أنا بعيد عن ربنا، من فين أبدأ؟", icon: "🕌" },
  { q: "عملت ذنب كبير، ربنا هيسامحني؟", icon: "💚" },
  { q: "إزاي أثبت على الطاعة؟", icon: "⚡" },
  { q: "أنا بحس بوحشة روحية، أعمل إيه؟", icon: "🌙" },
  { q: "الاستغفار بيتقبل منين؟", icon: "🤲" },
  { q: "كيف أقوي علاقتي بالقرآن؟", icon: "📖" },
  { q: "أنا مش قادر أصلي بخشوع، أعمل إيه؟", icon: "🙏" },
  { q: "بيجيلي وسواس كتير، إزاي أتعامل معاه؟", icon: "🧠" },
  { q: "إزاي أبعد نفسي عن أصحاب السوء؟", icon: "🛡️" },
  { q: "ما معنى التوكل على الله؟", icon: "🌟" },
  { q: "الذنوب الصغيرة بتتراكم، إزاي أوقف؟", icon: "🪨" },
  { q: "عايز أغير حياتي، من فين أبدأ؟", icon: "🌅" },
  { q: "إزاي أحبب قلبي في الصلاة؟", icon: "💙" },
  { q: "ربنا بيسمع دعاي وأنا مذنب؟", icon: "🤍" },
  { q: "إزاي أتغلب على الغضب؟", icon: "🔥" },
  { q: "محتاج أمل، إيه اللي يعينني؟", icon: "✨" },
  { q: "الوقت بيروح مني، إزاي أستثمره؟", icon: "⏳" },
  { q: "بخاف من الموت، إزاي أتعامل مع هذا الخوف؟", icon: "🌙" },
  { q: "إزاي أشكر ربنا على نعمه؟", icon: "🌺" },
  { q: "أنا زهقت من الحياة، إيه رأيك؟", icon: "💭" },
  { q: "إزاي أكون قريب من ربنا في وسط الزحمة؟", icon: "🕊️" },
  { q: "كيف أعرف إن توبتي اتقبلت؟", icon: "🌿" },
  { q: "إزاي أتعامل مع ناس بتأذيني وأسامحهم؟", icon: "❤️" },
  { q: "المعصية بتتكرر مني، خايف أيأس!", icon: "😔" },
  { q: "إزاي أعمل حسنات كتير في وقت قليل؟", icon: "⚡" },
  { q: "دعائي ما بيتستجابش، ليه؟", icon: "🤲" },
  { q: "إزاي أواجه ضغوط الحياة بإيمان؟", icon: "💪" },
];

export function pickStarterQuestions(count = 6): Array<{ q: string; icon: string }> {
  const shuffled = [...ALL_STARTER_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const STARTER_QUESTIONS = ALL_STARTER_QUESTIONS.slice(0, 6).map((x) => x.q);
export const STARTER_ICONS = ALL_STARTER_QUESTIONS.slice(0, 6).map((x) => x.icon);

export const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "أهلاً يا صاحبي! 🌿 أنا الزكي — مش بوت رسمي، أنا صاحبك اللي بيعرف دينه.\n\nابعت صوتك أو اكتب — أنا هنا أسمعك بكل قلبي.\nوالكلام اللي بيننا يفضل بيننا.",
  timestamp: new Date(),
};

export const TONE_STYLES: Array<{ keywords: string[]; emoji: string; className: string }> = [
  { keywords: ["همس", "هامس", "سر"], emoji: "🤫", className: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300/50" },
  { keywords: ["جدية", "جاد", "خطير"], emoji: "🎯", className: "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-300/50" },
  { keywords: ["حماس", "فرحة", "فرح", "نار"], emoji: "🔥", className: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300/50" },
  { keywords: ["ضحكة", "هزار", "تريق"], emoji: "😄", className: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-300/50" },
  { keywords: ["دفء", "حنان", "دافئ"], emoji: "💙", className: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300/50" },
  { keywords: ["تأمل", "هدوء", "هادئ"], emoji: "🌙", className: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300/50" },
];

export const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
