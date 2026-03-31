import {
  BookOpen,
  CircleDot,
  PenLine,
  ListChecks,
  Users,
  Swords,
  ScrollText,
  Clock,
  Heart,
  BarChart2,
  Bell,
  ShieldAlert,
  HeartHandshake,
  Zap,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BannerType = "season" | "nafl" | "ayah" | "hadith" | "dua" | "wisdom";
export type AyahRef = { surah: number; ayah: number };
export type BannerItem = {
  type: BannerType;
  label: string;
  content: string;
  icon: "sparkles" | "moon" | "sun" | "star" | "book" | "chat";
  seasonColor?: string;
  ayahRef?: AyahRef;
  tafsir?: string;
};

export type GridId =
  | "rajaa"
  | "dhikr"
  | "journal"
  | "hadi-tasks"
  | "dhikr-rooms"
  | "challenge"
  | "kaffarah"
  | "prayer-times"
  | "relapse"
  | "progress-map"
  | "notifications"
  | "danger-times"
  | "secret-dua"
  | "dua-timing";

export type ListId =
  | "quran-card"
  | "soul-meter"
  | "hadith-card"
  | "journey-card"
  | "journey30"
  | "invite"
  | "ameen"
  | "tawbah-card"
  | "signs"
  | "map"
  | "live-stats"
  | "islamic-programs"
  | "garden"
  | "munajat"
  | "adhkar";

export type SectionId = GridId | ListId;

export type GridCardMeta = {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
};

export interface BannerSlide {
  label: string;
  icon: "sparkles" | "moon" | "sun" | "star" | "book" | "chat";
  text: string;
  bg: string;
  borderColor: string;
  accent: string;
  labelColor: string;
}

// ─── Section ID sets ──────────────────────────────────────────────────────────

export const GRID_IDS = new Set<SectionId>([
  "rajaa",
  "dhikr",
  "journal",
  "hadi-tasks",
  "dhikr-rooms",
  "challenge",
  "kaffarah",
  "prayer-times",
  "relapse",
  "progress-map",
  "notifications",
  "danger-times",
  "secret-dua",
  "dua-timing",
]);

export const GRID_DEFAULT: GridId[] = [
  "rajaa",
  "dhikr",
  "prayer-times",
  "dhikr-rooms",
  "secret-dua",
  "hadi-tasks",
  "dua-timing",
  "notifications",
  "journal",
  "progress-map",
  "kaffarah",
  "challenge",
  "danger-times",
  "relapse",
];

export const LIST_DEFAULT: ListId[] = [
  "quran-card",
  "adhkar",
  "hadith-card",
  "journey30",
  "journey-card",
  "garden",
  "soul-meter",
  "ameen",
  "invite",
  "munajat",
  "islamic-programs",
  "tawbah-card",
  "signs",
  "map",
  "live-stats",
];

export const ALL_SECTIONS: SectionId[] = [
  "journey-card",
  "quran-card",
  "adhkar",
  "rajaa",
  "dhikr",
  "prayer-times",
  "dhikr-rooms",
  "secret-dua",
  "hadi-tasks",
  "dua-timing",
  "notifications",
  "journey30",
  "hadith-card",
  "garden",
  "soul-meter",
  "journal",
  "progress-map",
  "ameen",
  "invite",
  "kaffarah",
  "challenge",
  "danger-times",
  "relapse",
  "munajat",
  "islamic-programs",
  "tawbah-card",
  "signs",
  "map",
  "live-stats",
];

export const COMBINED_STORAGE_KEY = "home_combined_order_v11";

// ─── Order persistence ────────────────────────────────────────────────────────

export function loadCombinedOrder(): SectionId[] {
  try {
    const saved = localStorage.getItem(COMBINED_STORAGE_KEY);
    if (saved) {
      const parsed: SectionId[] = JSON.parse(saved);
      const valid = parsed.filter((id) => ALL_SECTIONS.includes(id));
      const missing = ALL_SECTIONS.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return ALL_SECTIONS;
}

export function saveCombinedOrder(order: SectionId[]) {
  try {
    localStorage.setItem(COMBINED_STORAGE_KEY, JSON.stringify(order));
  } catch {}
}

export function isGridItem(id: SectionId): id is GridId {
  return GRID_IDS.has(id);
}

// ─── Grid card metadata ───────────────────────────────────────────────────────

export const GRID_META: Record<GridId, GridCardMeta> = {
  rajaa: {
    href: "/rajaa",
    label: "مكتبة الرجاء",
    sub: "آيات وأحاديث",
    icon: <BookOpen size={22} />,
    bg: "from-emerald-500/15 to-teal-400/5",
    border: "border-emerald-400/30",
    iconBg: "bg-emerald-500/15 text-emerald-500",
  },
  dhikr: {
    href: "/dhikr",
    label: "مسبحة الذكر",
    sub: "استغفار وتسبيح",
    icon: <CircleDot size={22} />,
    bg: "from-amber-500/15 to-yellow-400/5",
    border: "border-amber-400/30",
    iconBg: "bg-amber-500/15 text-amber-600",
  },
  journal: {
    href: "/journal",
    label: "يوميات التوبة",
    sub: "مساحة سرية",
    icon: <PenLine size={22} />,
    bg: "from-violet-600/15 to-purple-400/5",
    border: "border-violet-400/30",
    iconBg: "bg-violet-600/15 text-violet-500",
  },
  "hadi-tasks": {
    href: "/hadi-tasks",
    label: "مهام هادي",
    sub: "نصائح الزكي",
    icon: <ListChecks size={22} />,
    bg: "from-cyan-500/15 to-sky-400/5",
    border: "border-cyan-400/30",
    iconBg: "bg-cyan-500/15 text-cyan-600",
  },
  "dhikr-rooms": {
    href: "/dhikr-rooms",
    label: "غرف الذكر",
    sub: "مع آلاف المسلمين",
    icon: <Users size={22} />,
    bg: "from-teal-600/15 to-emerald-400/5",
    border: "border-teal-400/30",
    iconBg: "bg-teal-600/15 text-teal-600",
  },
  challenge: {
    href: "/challenge/create",
    label: "تحدي التوبة",
    sub: "شارك رابطه",
    icon: <Swords size={22} />,
    bg: "from-orange-500/15 to-red-400/5",
    border: "border-orange-400/30",
    iconBg: "bg-orange-500/15 text-orange-500",
  },
  kaffarah: {
    href: "/kaffarah",
    label: "الكفارات",
    sub: "خطوات مفصّلة",
    icon: <ScrollText size={22} />,
    bg: "from-red-500/15 to-rose-400/5",
    border: "border-red-400/30",
    iconBg: "bg-red-500/15 text-red-500",
  },
  "prayer-times": {
    href: "/prayer-times",
    label: "مواقيت الصلاة",
    sub: "تذكيرات ذكية",
    icon: <Clock size={22} />,
    bg: "from-indigo-600/15 to-blue-500/5",
    border: "border-indigo-400/30",
    iconBg: "bg-indigo-600/15 text-indigo-500",
  },
  relapse: {
    href: "/relapse",
    label: "ضعفت وعدت؟",
    sub: "لا تيأس",
    icon: <Heart size={22} />,
    bg: "from-pink-500/15 to-rose-400/5",
    border: "border-pink-400/30",
    iconBg: "bg-pink-500/15 text-pink-500",
  },
  "progress-map": {
    href: "/progress",
    label: "خريطة التقدم",
    sub: "إحصاءاتك",
    icon: <BarChart2 size={22} />,
    bg: "from-blue-600/15 to-sky-400/5",
    border: "border-blue-400/30",
    iconBg: "bg-blue-600/15 text-blue-500",
  },
  notifications: {
    href: "/notifications",
    label: "الإشعارات",
    sub: "ضبط تنبيهات الصلاة",
    icon: <Bell size={22} />,
    bg: "from-amber-600/15 to-orange-400/5",
    border: "border-amber-500/30",
    iconBg: "bg-amber-600/15 text-amber-600",
  },
  "danger-times": {
    href: "/danger-times",
    label: "أوقات الخطر",
    sub: "تذكيرات وقائية",
    icon: <ShieldAlert size={22} />,
    bg: "from-red-600/15 to-orange-500/5",
    border: "border-red-500/30",
    iconBg: "bg-red-600/15 text-red-500",
  },
  "secret-dua": {
    href: "/secret-dua",
    label: "الصديق السري",
    sub: "ادعُ لأخٍ مجهول",
    icon: <HeartHandshake size={22} />,
    bg: "from-rose-600/15 to-pink-400/5",
    border: "border-rose-400/30",
    iconBg: "bg-rose-600/15 text-rose-500",
  },
  "dua-timing": {
    href: "/dua-timing",
    label: "لحظة الإجابة",
    sub: "أقوى أوقات الدعاء",
    icon: <Zap size={22} />,
    bg: "from-yellow-500/15 to-amber-400/5",
    border: "border-yellow-400/30",
    iconBg: "bg-yellow-500/15 text-yellow-600",
  },
};
