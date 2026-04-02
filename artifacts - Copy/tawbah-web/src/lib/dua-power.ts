// ── Dua-answer power score calculation ────────────────────────────────────────
// Single source of truth — imported by dua-timing.tsx, NotificationsContext, etc.

function getHour(): number { return new Date().getHours(); }
function getMinutes(): number { return new Date().getMinutes(); }
function getDayOfWeek(): number { return new Date().getDay(); }

export function isLastThirdOfNight(): boolean {
  const h = getHour(); return h >= 2 && h <= 5;
}
export function isFajrTime(): boolean {
  const h = getHour(); return h >= 4 && h <= 5;
}
export function isMorningDhikrTime(): boolean {
  const h = getHour(); return h >= 5 && h <= 7;
}
export function isEveningDhikrTime(): boolean {
  const h = getHour(); return h >= 17 && h <= 19;
}
export function isFriday(): boolean { return getDayOfWeek() === 5; }
export function isFridayAnswerHour(): boolean {
  const h = getHour(); return isFriday() && h >= 15 && h <= 17;
}
export function isBetweenAdhanIqamah(): boolean {
  const h = getHour();
  const m = getMinutes();
  return (
    (h === 5  && m >= 0 && m <= 20) ||
    (h === 12 && m >= 0 && m <= 20) ||
    (h === 15 && m >= 30 && m <= 50) ||
    (h === 18 && m >= 0 && m <= 20) ||
    (h === 19 && m >= 30 && m <= 50)
  );
}
export function isMonThur(): boolean {
  const d = getDayOfWeek(); return d === 1 || d === 4;
}

export function getHijriDayMonth(): { day: number; month: number } {
  const now = new Date();
  const jd = Math.floor(now.getTime() / 86400000 + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  return {
    day: Math.floor((24 * l3) / 709),
    month: Math.floor(l3 / 29.5001) + 1,
  };
}

export function isArafahDay(): boolean {
  const { day, month } = getHijriDayMonth();
  return month === 12 && day === 9;
}
export function isRamadan(): boolean {
  return getHijriDayMonth().month === 9;
}

export interface DuaWindow {
  id: string;
  label: string;
  sub: string;
  power: number;
  active: boolean;
  alwaysActive?: boolean;
  hadith: string;
  bestDua: string;
}

export function buildDuaWindows(): DuaWindow[] {
  return [
    {
      id: "last-third",
      label: "آخر ثلث الليل",
      sub: "ينزل الله إلى السماء الدنيا",
      power: 40,
      active: isLastThirdOfNight(),
      hadith: "«ينزل ربنا كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر فيقول: من يدعوني فأستجيب له»",
      bestDua: "اللهم إني أسألك العفو والعافية والمعافاة الدائمة في الدين والدنيا والآخرة",
    },
    {
      id: "friday-hour",
      label: "ساعة الإجابة — الجمعة",
      sub: "آخر ساعة قبل المغرب جمعة",
      power: 45,
      active: isFridayAnswerHour(),
      hadith: "«فيه ساعة لا يوافقها عبد مسلم وهو قائم يصلي يسأل الله شيئاً إلا أعطاه إياه»",
      bestDua: "اللهم اغفر لي ولوالدي وللمؤمنين يوم يقوم الحساب",
    },
    {
      id: "adhan-iqamah",
      label: "بين الأذان والإقامة",
      sub: "لا يُرد الدعاء في هذا الوقت",
      power: 35,
      active: isBetweenAdhanIqamah(),
      hadith: "«الدعاء لا يُرد بين الأذان والإقامة»",
      bestDua: "اللهم رب هذه الدعوة التامة والصلاة القائمة آتِ محمداً الوسيلة والفضيلة وابعثه مقاماً محموداً الذي وعدته",
    },
    {
      id: "fajr-time",
      label: "وقت الفجر",
      sub: "صلِّ ركعتين قبل الفريضة وادعُ",
      power: 30,
      active: isFajrTime(),
      hadith: "«ركعتا الفجر خير من الدنيا وما فيها» — ومن صلاهما وجد قلبه خفيفاً مفتوحاً للدعاء",
      bestDua: "اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً",
    },
    {
      id: "morning-adhkar",
      label: "أذكار الصباح",
      sub: "بعد الفجر إلى الشروق",
      power: 25,
      active: isMorningDhikrTime(),
      hadith: "«من صلى الفجر في جماعة ثم قعد يذكر الله حتى تطلع الشمس كانت له كأجر حجة وعمرة تامة»",
      bestDua: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له",
    },
    {
      id: "evening-adhkar",
      label: "أذكار المساء",
      sub: "من العصر إلى المغرب",
      power: 25,
      active: isEveningDhikrTime(),
      hadith: "«من قرأ آية الكرسي حين يمسي أُجير من الجن حتى يصبح»",
      bestDua: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له",
    },
    {
      id: "mon-thur",
      label: "الاثنين والخميس",
      sub: "تُعرض الأعمال على الله",
      power: 20,
      active: isMonThur(),
      hadith: "«تُعرض الأعمال يوم الاثنين والخميس، فأحب أن يُعرض عملي وأنا صائم»",
      bestDua: "اللهم إني أسألك التوبة النصوح والثبات على الحق حتى الممات",
    },
    {
      id: "arafa",
      label: "يوم عرفة",
      sub: "أعظم يوم في السنة",
      power: 50,
      active: isArafahDay(),
      hadith: "«خير الدعاء دعاء يوم عرفة»",
      bestDua: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
    },
    {
      id: "ramadan",
      label: "رمضان المبارك",
      sub: "شهر الرحمة والمغفرة والدعاء",
      power: 30,
      active: isRamadan(),
      hadith: "«في كل ليلة من رمضان عتقاء من النار» — وللصائم عند فطره دعوة لا تُرد",
      bestDua: "اللهم إنك عفو تحب العفو فاعفُ عني",
    },
    {
      id: "sujood",
      label: "في السجود",
      sub: "أقرب ما يكون العبد من ربه",
      power: 35,
      active: false,
      alwaysActive: true,
      hadith: "«أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء»",
      bestDua: "سبحان ربي الأعلى — اللهم اغفر لي وارحمني واهدني وعافني وارزقني",
    },
  ];
}

/** Returns 0-100 power score for the current moment. */
export function calcDuaPower(): number {
  const wins = buildDuaWindows();
  const active = wins.filter((w) => w.active || w.alwaysActive);
  if (active.length === 0) return 12;
  const total = active.reduce((s, w) => s + w.power, 0);
  return Math.min(100, total);
}

/** Returns human-readable label for a power score. */
export function getPowerLabel(score: number): { label: string; color: string; pulse: boolean } {
  if (score >= 80) return { label: "قمة الإجابة ✨", color: "text-yellow-500", pulse: true };
  if (score >= 60) return { label: "لحظة قوية جداً", color: "text-amber-500", pulse: true };
  if (score >= 40) return { label: "وقت مبارك", color: "text-emerald-500", pulse: false };
  if (score >= 25) return { label: "دعاء مستحب", color: "text-blue-500", pulse: false };
  return { label: "استعد للحظة القادمة", color: "text-muted-foreground", pulse: false };
}

/** Returns description for when the next peak is. */
export function getNextPeakDescription(score: number): string {
  if (score >= 60) return "أنت الآن في لحظة مباركة — ارفع يديك وادعُ";
  const h = getHour();
  if (h < 3) return "السدس الأخير من الليل يبدأ قريباً (2-5 صباحاً)";
  if (h < 5) return "صلاة الفجر على وشك الأذان — ادعُ بين الأذان والإقامة";
  if (h < 12) return "أجمل وقت لصلاة الضحى وقراءة الأوراد الصباحية";
  if (h < 14) return "الصلاة على النبي ﷺ يوم الجمعة تضاعف الأجر";
  if (h < 15) return "اقتربت ساعة الإجابة الجمعة (3-5 عصراً)";
  if (h < 17) return "أذكار العصر والدعاء قبيل المغرب";
  return "قُم في آخر الليل لصلاة ركعتين وادعُ";
}

// ── Cooldown helpers ──────────────────────────────────────────────────────────

const COOLDOWN_KEY = "dua_peak_last_fired";
const COOLDOWN_MS  = 2 * 60 * 60 * 1000; // 2 hours

export function duaPeakCooledDown(): boolean {
  const raw = localStorage.getItem(COOLDOWN_KEY);
  if (!raw) return true;
  return Date.now() - parseInt(raw, 10) > COOLDOWN_MS;
}

export function markDuaPeakFired(): void {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
}

// ── Ameen counter ─────────────────────────────────────────────────────────────

const AMEEN_COUNT_KEY = "dua_peak_ameen_count";

export function getDuaPeakAmeenCount(): number {
  try {
    return parseInt(localStorage.getItem(AMEEN_COUNT_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

export function incrementDuaPeakAmeenCount(): number {
  const next = getDuaPeakAmeenCount() + 1;
  localStorage.setItem(AMEEN_COUNT_KEY, String(next));
  return next;
}
