import { Link, useLocation } from "wouter";
import { useZakiyMode } from "@/context/ZakiyModeContext";
import { ZakiyModeDashboard } from "@/components/ZakiyModeDashboard";
import { ZakiyEmergencyOverlay } from "@/components/ZakiyEmergencyOverlay";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Activity,
  CircleDot,
  HeartHandshake,
  BookOpen,
  PenLine,
  ScrollText,
  Clock,
  BarChart2,
  Sparkles,
  ListChecks,
  ImageIcon,
  Swords,
  Globe,
  Users,
  CalendarDays,
  Bell,
  HandHeart,
  Moon,
  Sun,
  Star,
  BookMarked,
  MessageCircle,
  Volume2,
  X,
  BookText,
  Share2,
  GripVertical,
  Settings2,
  Flame,
  TrendingUp,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { LiveStats } from "@/components/live-stats";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useAppNotifications } from "@/context/AppNotificationsContext";
import { IslamicHero } from "@/components/IslamicHero";
import { KnowledgeSlider } from "@/components/KnowledgeSlider";
import { SoulMeter } from "@/components/SoulMeter";
import { MoodSelector } from "@/components/MoodSelector";
import { CommunityTicker } from "@/components/CommunityTicker";
import { getEidStatus, type EidPeriod } from "@/lib/eid-utils";
import { getSessionId } from "@/lib/session";
import { isNativeApp } from "@/lib/api-base";
import { useAuth } from "@/context/AuthContext";
import { getAuthHeader } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ───────────────────────────────────────────────────────────────────

type BannerType = "season" | "nafl" | "ayah" | "hadith" | "dua" | "wisdom";
type AyahRef = { surah: number; ayah: number };
type BannerItem = {
  type: BannerType;
  label: string;
  content: string;
  icon: "sparkles" | "moon" | "sun" | "star" | "book" | "chat";
  seasonColor?: string;
  ayahRef?: AyahRef;
  tafsir?: string;
};

// ─── Section IDs ─────────────────────────────────────────────────────────────

type GridId =
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

type ListId =
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

type SectionId = GridId | ListId;

const GRID_IDS = new Set<SectionId>([
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

const GRID_DEFAULT: GridId[] = [
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

const LIST_DEFAULT: ListId[] = [
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

const ALL_SECTIONS: SectionId[] = [
  "quran-card",
  "adhkar",
  "hadith-card",
  "rajaa",
  "dhikr",
  "prayer-times",
  "dhikr-rooms",
  "secret-dua",
  "hadi-tasks",
  "dua-timing",
  "notifications",
  "journey30",
  "journey-card",
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

const COMBINED_STORAGE_KEY = "home_combined_order_v10";

function loadCombinedOrder(): SectionId[] {
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

function saveCombinedOrder(order: SectionId[]) {
  try {
    localStorage.setItem(COMBINED_STORAGE_KEY, JSON.stringify(order));
  } catch {}
}

function isGridItem(id: SectionId): id is GridId {
  return GRID_IDS.has(id);
}

// ─── Grid card metadata ───────────────────────────────────────────────────────

type GridCardMeta = {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
};

const GRID_META: Record<GridId, GridCardMeta> = {
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

// ─── Banner data ──────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<
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

// ─── 10 عصرية بألوان مخصصة ─────────────────────────────────────────────────

interface BannerSlide {
  label: string;
  icon: keyof typeof ICON_MAP;
  text: string;
  bg: string;
  borderColor: string;
  accent: string;
  labelColor: string;
}

const BANNER_SLIDES: BannerSlide[] = [
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

const BANNER_POOL: BannerItem[] = [
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

function getSeasonBanner(): BannerItem | null {
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

const ICON_MAP = {
  sparkles: Sparkles,
  moon: Moon,
  sun: Sun,
  star: Star,
  book: BookMarked,
  chat: MessageCircle,
};

// ─── TafsirSheet ─────────────────────────────────────────────────────────────

function TafsirSheet({
  item,
  onClose,
}: {
  item: BannerItem;
  onClose: () => void;
}) {
  const styles = TYPE_STYLES[item.type];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
          </div>
          <div
            className={`flex items-center justify-between px-5 py-3 bg-gradient-to-r ${styles.gradient} border-b ${styles.border}`}
          >
            <div className="flex items-center gap-2">
              <BookText size={16} className={styles.iconColor} />
              <span className={`font-bold text-sm ${styles.iconColor}`}>
                التفسير الميسر
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-background/60 hover:bg-background/90 transition-colors"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground leading-loose text-center font-arabic mb-3">
              {item.content}
            </p>
            <div className="h-px bg-border/60 my-3" />
            <p
              className="text-sm text-foreground/80 leading-relaxed text-right"
              dir="rtl"
            >
              {item.tafsir}
            </p>
          </div>
          <div className="px-5 py-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold ${styles.iconColor} bg-gradient-to-r ${styles.gradient} border ${styles.border}`}
            >
              حفظ الله قلبك
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── DynamicBanner ────────────────────────────────────────────────────────────

const SLIDE_DURATION = 8; // seconds

function DynamicBanner() {
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % BANNER_SLIDES.length);
    }, SLIDE_DURATION * 1000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  const slide = BANNER_SLIDES[idx];
  const IconComp = ICON_MAP[slide.icon];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: slide.bg, border: `1px solid ${slide.borderColor}` }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-1.5 flex-1"
          >
            <IconComp
              size={13}
              style={{ color: slide.accent }}
              className="shrink-0"
            />
            <span
              className="font-bold text-[11px]"
              style={{ color: slide.labelColor }}
            >
              {slide.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content row — text + X button on same line */}
      <div className="flex items-start gap-3 px-4 pb-3">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-[12.5px] leading-relaxed text-foreground/80"
              dir="rtl"
            >
              {slide.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* X button — vertically centered with content */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="mt-0.5 w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(0,0,0,0.08)" }}
        >
          <X size={11} className="text-foreground/50" />
        </button>
      </div>

      {/* Progress bar — framer-motion resets automatically on key change */}
      <div
        className="h-[3px] w-full"
        style={{ background: "rgba(0,0,0,0.07)" }}
      >
        <motion.div
          key={idx}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: SLIDE_DURATION, ease: "linear" }}
          className="h-full origin-right"
          style={{ background: slide.accent, opacity: 0.55 }}
        />
      </div>
    </div>
  );
}

// ─── InviteFriendCard ─────────────────────────────────────────────────────────

function InviteFriendCard() {
  const [shared, setShared] = useState(false);
  const handleInvite = async () => {
    const text =
      "اكتشفت تطبيقاً يساعدك على التوبة الصادقة 🌿\nرحلة 30 يوماً مع خطة يومية وذكر وإرشاد روحي.\n\nابدأ رحلتك الآن 👇";
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: "دليل التوبة النصوح", text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };
  return (
    <button
      onClick={handleInvite}
      className="w-full flex items-center gap-4 bg-gradient-to-l from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all text-right"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
        <HeartHandshake size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ادعُ رفيقاً في رحلة التوبة</h3>
        <p className="text-[11px] text-muted-foreground">
          شارك التطبيق — الدال على الخير كفاعله
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {shared ? (
          <span className="text-xs font-bold text-primary">تم! ✓</span>
        ) : (
          <Share2 size={16} className="text-primary" />
        )}
      </div>
    </button>
  );
}

// ─── EidEntryCard ─────────────────────────────────────────────────────────────

function EidEntryCard() {
  const eid = getEidStatus();
  const dismissKey = `eid_banner_dismissed_${eid.period}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });
  if (eid.period !== "eid_fitr" && eid.period !== "eid_adha") return null;
  if (dismissed) return null;
  const period = eid.period as EidPeriod;
  const isEidDay = period === "eid_fitr" || period === "eid_adha";
  const isAdha = eid.eidType === "adha";
  const isPreAdha = period === "pre_adha_dhul_hijja" || period === "arafah";
  const gradientClass = isAdha
    ? "from-emerald-600/15 to-teal-500/5 border-emerald-500/30"
    : "from-violet-600/15 to-purple-500/5 border-violet-400/30";
  const iconBg = isAdha ? "bg-emerald-500" : "bg-violet-600";
  const title = isEidDay
    ? isAdha
      ? "عيد الأضحى المبارك 🐑"
      : "عيد الفطر المبارك 🌙"
    : period === "arafah"
      ? "يوم عرفة اليوم 🤲"
      : isPreAdha
        ? `العشر من ذي الحجة — ${eid.daysUntilEid === 1 ? "العيد غداً" : `العيد بعد ${eid.daysUntilEid} أيام`}`
        : `العيد ${eid.daysUntilEid === 1 ? "غداً" : `بعد ${eid.daysUntilEid} أيام`} 🌙`;
  const subtitle = isEidDay
    ? "تقبّل الله منا ومنكم — اضغط لصفحة العيد الكاملة"
    : period === "arafah"
      ? "صُم واستغفر وادعُ — اكتشف صفحة العيد"
      : isPreAdha
        ? "أفضل أيام السنة — أكثر من الطاعة والتوبة"
        : "استعد وأخرج زكاة الفطر — اكتشف صفحة العيد";
  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {}
  };
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35 }}
          className={`flex items-center gap-3 bg-gradient-to-l ${gradientClass} border rounded-2xl p-3.5 shadow-sm`}
        >
          <div
            className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-md shrink-0`}
          >
            <span className="text-lg">
              {isAdha ? "🐑" : isPreAdha ? "✨" : "🌙"}
            </span>
          </div>
          <Link
            href="/eid"
            className="flex-1 min-w-0 active:opacity-70 transition-opacity"
          >
            <h3 className="font-bold text-sm leading-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {subtitle}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/eid"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="الذهاب لصفحة العيد"
            >
              <ArrowLeft size={15} />
            </Link>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="إغلاق"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── HeroBellButton ───────────────────────────────────────────────────────────

function HeroBellButton() {
  const [, setLocation] = useLocation();
  const { unreadCount } = useAppNotifications();
  return (
    <button
      onClick={() => setLocation("/inbox")}
      aria-label="صندوق الإشعارات"
      className="absolute top-3 left-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 active:scale-95 transition-all"
    >
      <Bell size={20} className="text-white drop-shadow" />
      {unreadCount > 0 && (
        <motion.span
          key={unreadCount}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </button>
  );
}

// ─── SosReturnToast ───────────────────────────────────────────────────────────

function SosReturnToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto"
    >
      <div
        className="bg-emerald-600 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3"
        onClick={onDismiss}
      >
        <span className="text-xl shrink-0">🌿</span>
        <div className="flex-1">
          <p className="font-bold text-sm">أحسنت — الله يثبّتك</p>
          <p className="text-emerald-100 text-xs">
            قاومت ونجحت. استمر في رحلتك.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

// ─── Journey30 Hero Card ──────────────────────────────────────────────────────

interface Journey30Summary {
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

function Journey30HeroCard() {
  const sessionId = getSessionId();
  const { user } = useAuth();

  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-home", sessionId],
    queryFn: async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12_000);
      try {
        const res = await fetch(
          "/api/journey30",
          { signal: controller.signal, headers: { ...getAuthHeader() } },
        );
        if (!res.ok) throw new Error("Failed to fetch journey summary");
        const data = await res.json() as Journey30Summary;
        return {
          completedCount: data.completedCount,
          currentDay: data.currentDay,
          streakDays: data.streakDays,
        };
      } catch (e) {
        if (isNativeApp()) {
          return { completedCount: 0, currentDay: 1, streakDays: 0 };
        }
        throw e;
      } finally {
        clearTimeout(id);
      }
    },
    enabled: !!sessionId && !!user,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const completed = j30?.completedCount ?? 0;
  const currentDay = j30?.currentDay ?? 1;
  const streak = j30?.streakDays ?? 0;
  const progress = Math.round((completed / 30) * 100);
  const isFinished = completed >= 30;

  return (
    <div
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background:
          "linear-gradient(160deg, #0d1a12 0%, #162512 45%, #0a1510 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.25)",
      }}
    >
      <StarDots />
      <div
        className="absolute top-[-30px] left-[30%] right-[30%] h-[100px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(251,191,36,0.14) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />

      <div className="relative z-10 p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="font-bold leading-tight"
              style={{
                fontSize: 20,
                background:
                  "linear-gradient(90deg, #ffffff 0%, #fde68a 55%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              رحلة الـ ٣٠ يوماً
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {isFinished
                ? "🎉 أتممت الرحلة — بارك الله فيك"
                : `اليوم ${currentDay} من ٣٠`}
            </p>
          </div>
          <BentoCompassWidget />
        </div>

        {/* Verse — full width */}
        <VerseCellBento />

        {/* Progress row */}
        <div className="flex gap-2">
          {/* Circular progress */}
          <div
            className="flex-[3] flex flex-col items-center justify-center gap-1 rounded-[18px] py-3"
            style={{
              background:
                "linear-gradient(145deg, rgba(251,191,36,0.15) 0%, rgba(217,119,6,0.06) 100%)",
              border: "1px solid rgba(251,191,36,0.22)",
            }}
          >
            <div className="relative w-[72px] h-[72px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="rgba(0,0,0,0.18)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="5"
                />
                <motion.circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 30}
                  initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 30 * (1 - progress / 100),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[16px] font-bold leading-none"
                  style={{ color: "#fbbf24" }}
                >
                  {progress}%
                </span>
                <span
                  className="text-[8px] leading-none mt-0.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  تقدّم
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full px-3">
              <span
                className="text-[9px]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {30 - completed} متبقٍ
              </span>
              <span
                className="text-[9px]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {completed} مكتمل
              </span>
            </div>
          </div>
          {/* Streak */}
          <div
            className="flex-[2] flex flex-col items-center justify-center gap-1 rounded-[18px]"
            style={{
              background:
                "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.06) 100%)",
              border: "1px solid rgba(16,185,129,0.2)",
              minHeight: 100,
            }}
          >
            <motion.span
              className="text-[26px] leading-none"
              animate={{ scale: streak > 0 ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔥
            </motion.span>
            <p
              className="font-bold text-[18px] leading-none"
              style={{ color: "#10b981" }}
            >
              {streak}
            </p>
            <p
              className="text-[9px]"
              style={{ color: "rgba(16,185,129,0.65)" }}
            >
              يوم متتالٍ
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/journey"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[16px] font-bold text-sm active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            color: "#1c0f00",
            boxShadow:
              "0 4px 20px rgba(251,191,36,0.38), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {isFinished ? (
            <>
              <TrendingUp size={15} />
              <span>استعرض إنجازك</span>
            </>
          ) : (
            <>
              <span>متابعة اليوم {currentDay}</span>
              <ArrowLeft size={15} />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function SectionTawbahCard() {
  return (
    <Link
      href="/card"
      className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-primary/10 border border-amber-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
        <ImageIcon size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">بطاقة توبتي</h3>
        <p className="text-[11px] text-muted-foreground">
          اصنع بطاقة جميلة وشاركها مع الناس
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionChallenge() {
  return (
    <Link
      href="/challenge/create"
      className="flex items-center gap-4 bg-gradient-to-l from-emerald-500/10 to-primary/10 border border-emerald-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shrink-0">
        <Swords size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">تحدي التوبة</h3>
        <p className="text-[11px] text-muted-foreground">
          ابدأ تحدياً وشارك رابطه — ليدعو لك الناس
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionMap() {
  return (
    <Link
      href="/map"
      className="flex items-center gap-4 bg-gradient-to-l from-blue-500/10 to-primary/10 border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0">
        <Globe size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">خريطة التوبة العالمية</h3>
        <p className="text-[11px] text-muted-foreground">
          من أي دول يتوب المسلمون الآن؟
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionJourney30() {
  return (
    <Link
      href="/journey"
      className="flex items-center gap-4 bg-gradient-to-l from-violet-500/10 to-primary/10 border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0">
        <CalendarDays size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">رحلة ٣٠ يوماً</h3>
        <p className="text-[11px] text-muted-foreground">
          برنامج تدريجي يومي للتوبة والاستقامة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDhikrRooms() {
  return (
    <Link
      href="/dhikr-rooms"
      className="flex items-center gap-4 bg-gradient-to-l from-teal-500/10 to-primary/10 border border-teal-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
        <Users size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">غرف الذكر الجماعي</h3>
        <p className="text-[11px] text-muted-foreground">
          سبّح مع آلاف المسلمين الآن
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionAmeen() {
  return (
    <Link
      href="/ameen"
      className="flex items-center gap-4 bg-gradient-to-l from-rose-500/10 to-pink-500/5 border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md shrink-0">
        <HandHeart size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">قل آمين 🤲</h3>
        <p className="text-[11px] text-muted-foreground">
          ادعُ لأخٍ مجهول — وقل آمين لدعائه
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionInvite() {
  return <InviteFriendCard />;
}

function SectionLiveStats() {
  return <LiveStats />;
}

function SectionKaffarah() {
  return (
    <Link
      href="/kaffarah"
      className="flex items-center gap-4 bg-card border border-destructive/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
        <ScrollText size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الكفارات الشرعية</h3>
        <p className="text-[11px] text-muted-foreground">
          خطوات مفصّلة لكل ذنب
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionRajaa() {
  return (
    <Link
      href="/rajaa"
      className="flex items-center gap-4 bg-card border border-primary/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        <BookOpen size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مكتبة الرجاء</h3>
        <p className="text-[11px] text-muted-foreground">
          آيات وأحاديث وقصص تبعث الأمل
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDhikr() {
  return (
    <Link
      href="/dhikr"
      className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 text-secondary-foreground">
        <CircleDot size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مسبحة الذكر</h3>
        <p className="text-[11px] text-muted-foreground">
          استغفار وتسبيح بين يديك
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionSigns() {
  return (
    <Link
      href="/signs"
      className="flex items-center gap-4 bg-card border border-green-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 text-green-500">
        <HeartHandshake size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">تباشير القبول</h3>
        <p className="text-[11px] text-muted-foreground">
          علامات قبول التوبة الصادقة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionJournal() {
  return (
    <Link
      href="/journal"
      className="flex items-center gap-4 bg-card border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500">
        <PenLine size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">يوميات التوبة</h3>
        <p className="text-[11px] text-muted-foreground">مساحة سرية خاصة بك</p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionProgressMap() {
  return (
    <Link
      href="/progress"
      className="flex items-center gap-4 bg-card border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
        <BarChart2 size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">خريطة التقدم</h3>
        <p className="text-[11px] text-muted-foreground">
          إحصاءاتك الروحية ومسيرتك
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDangerTimes() {
  return (
    <Link
      href="/danger-times"
      className="flex items-center gap-4 bg-card border border-orange-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">أوقات الخطر</h3>
        <p className="text-[11px] text-muted-foreground">تذكيرات وقائية ذكية</p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionRelapse() {
  return (
    <Link
      href="/relapse"
      className="flex items-center gap-4 bg-card border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500">
        <Heart size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ضعفت وعدت؟</h3>
        <p className="text-[11px] text-muted-foreground">
          اقرأ هذا فوراً — لا تيأس
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionHadiTasks() {
  return (
    <Link
      href="/hadi-tasks"
      className="flex items-center gap-4 bg-card border border-emerald-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
        <ListChecks size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مهام هادي</h3>
        <p className="text-[11px] text-muted-foreground">
          نصائح الزكي تتحول لمهام تتابعها
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionSecretDua() {
  return (
    <Link
      href="/secret-dua"
      className="flex items-center gap-4 bg-card border border-rose-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500">
        <Heart size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الصديق السري</h3>
        <p className="text-[11px] text-muted-foreground">
          ادعُ لأخٍ مجهول بلا أسماء
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionPrayerTimes() {
  return (
    <Link
      href="/prayer-times"
      className="flex items-center gap-4 bg-card border border-indigo-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مواقيت الصلاة</h3>
        <p className="text-[11px] text-muted-foreground">
          تذكيرات ذكية قبل كل صلاة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionNotifications() {
  return (
    <Link
      href="/notifications"
      className="flex items-center gap-4 bg-card border border-amber-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
        <Bell size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الإشعارات</h3>
        <p className="text-[11px] text-muted-foreground">
          ضبط تنبيهات الصلاة والأذكار
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

// ─── Section label map ────────────────────────────────────────────────────────

const SECTION_LABELS: Record<ListId, string> = {
  "quran-card": "القرآن الكريم",
  "hadith-card": "الحديث الشريف",
  "soul-meter": "مقياس الروح",
  "journey-card": "رحلة التوبة ٣٠ يوماً",
  journey30: "رحلة ٣٠ يوماً (رابط)",
  invite: "ادعُ رفيقاً",
  ameen: "قل آمين",
  "tawbah-card": "بطاقة توبتي",
  signs: "تباشير القبول",
  map: "خريطة التوبة",
  "live-stats": "إحصاءات حية",
  "islamic-programs": "برامج إسلامية",
  garden: "شجرة التوبة",
  munajat: "وضع المناجاة",
  adhkar: "الأذكار والأدعية",
};

function SectionSoulMeter() {
  return <SoulMeter />;
}

// ─── Quran Hero Card ──────────────────────────────────────────────────────────

const QURAN_BANNER_AYAHS = [
  {
    text: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    ref: "الإسراء: ٩",
  },
  {
    text: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ",
    ref: "الإسراء: ٨٢",
  },
  {
    text: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
    ref: "ص: ٢٩",
  },
  { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", ref: "البخاري" },
];

function SectionQuranCard() {
  const [ayahIdx, setAyahIdx] = useState(0);
  const [pages, setPages] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("quran_pages_today") ?? "0") || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const t = setInterval(
      () => setAyahIdx((i) => (i + 1) % QURAN_BANNER_AYAHS.length),
      5500,
    );
    return () => clearInterval(t);
  }, []);

  const addPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = pages + 1;
    setPages(next);
    try {
      localStorage.setItem("quran_pages_today", String(next));
    } catch {}
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const target = 5;
  const progress = Math.min((pages / target) * 100, 100);
  const done = pages >= target;

  return (
    <Link href="/quran">
      <div
        className="relative overflow-hidden rounded-[24px] cursor-pointer active:scale-[0.985] transition-transform"
        style={{
          background:
            "linear-gradient(160deg, #040d18 0%, #071428 45%, #030b15 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 16px 50px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.3)",
        }}
      >
        {/* Stars */}
        {[
          [12, 8],
          [88, 5],
          [35, 15],
          [65, 7],
          [90, 18],
          [20, 22],
          [75, 12],
          [50, 4],
          [42, 20],
          [80, 24],
        ].map(([x, y], i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 2.5 : 1.5,
              height: i % 3 === 0 ? 2.5 : 1.5,
              background: i % 2 === 0 ? "#c8a84b" : "#7dd3fc",
            }}
            animate={{ opacity: [0.1, 0.65, 0.1] }}
            transition={{
              duration: 2.5 + (i % 4) * 0.7,
              repeat: Infinity,
              delay: (i * 0.4) % 3,
            }}
          />
        ))}

        {/* Top glow */}
        <div
          className="absolute inset-x-0 top-0 h-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(200,168,75,0.2) 0%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />

        <div className="relative z-10 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(200,168,75,0.3) 0%, rgba(200,168,75,0.1) 100%)",
                  border: "1px solid rgba(200,168,75,0.45)",
                }}
              >
                <span style={{ fontSize: 20 }}>📖</span>
              </div>
              <div>
                <h2
                  className="font-bold leading-tight pt-[5px] pb-[5px]"
                  style={{
                    fontSize: 17,
                    background:
                      "linear-gradient(90deg, #ffffff 0%, #c8a84b 60%, #a07c2a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Amiri Quran', serif",
                  }}
                >
                  القرآن الكريم
                </h2>
                <p style={{ color: "rgba(200,168,75,0.55)", fontSize: 10 }}>
                  مكتبة شاملة — تلاوة وتفسير وعلوم
                </p>
              </div>
            </div>
            {/* Mini stats */}
            <div className="flex gap-1.5">
              {[
                ["١١٤", "سورة"],
                ["٣٠", "جزءاً"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="flex flex-col items-center px-2.5 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(200,168,75,0.1)",
                    border: "1px solid rgba(200,168,75,0.2)",
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#c8a84b" }}
                  >
                    {n}
                  </span>
                  <span
                    style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rotating Ayah */}
          <div
            className="rounded-xl px-4 py-3 mb-3"
            style={{
              background: "rgba(200,168,75,0.07)",
              border: "1px solid rgba(200,168,75,0.18)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={ayahIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  className="text-center leading-loose mb-1"
                  style={{
                    fontFamily: "'Amiri Quran', serif",
                    fontSize: 14.5,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  ﴿{QURAN_BANNER_AYAHS[ayahIdx]!.text}﴾
                </p>
                <p
                  className="text-center"
                  style={{ fontSize: 10, color: "rgba(200,168,75,0.6)" }}
                >
                  — {QURAN_BANNER_AYAHS[ayahIdx]!.ref}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Reading Tracker row */}
          <div className="flex items-center gap-2">
            {/* Progress mini bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                  ورد اليوم
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: done ? "#10b981" : "rgba(200,168,75,0.7)",
                    fontWeight: 700,
                  }}
                >
                  {done ? "✓ مكتمل" : `${pages}/${target} ص`}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: done
                      ? "#10b981"
                      : "linear-gradient(90deg,#c8a84b,#f0d070)",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* +page button */}
            <button
              onClick={addPage}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[11px] active:scale-[0.94] transition-all"
              style={{
                background: done
                  ? "rgba(16,185,129,0.2)"
                  : "linear-gradient(135deg,rgba(200,168,75,0.3),rgba(200,168,75,0.15))",
                border: `1px solid ${done ? "rgba(16,185,129,0.4)" : "rgba(200,168,75,0.4)"}`,
                color: done ? "#10b981" : "#c8a84b",
              }}
            >
              <BookMarked size={12} />+ صفحة
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Hadith Card ──────────────────────────────────────────────────────────────

const HOME_HADITHS = [
  { text: "التائبُ من الذنبِ كمَن لا ذنبَ له", narrator: "رواه ابن ماجه" },
  {
    text: "إنَّ اللهَ يَقبلُ توبةَ العبدِ ما لم يُغَرْغِر",
    narrator: "رواه الترمذي",
  },
  {
    text: "إن الله أفرح بتوبة عبده المؤمن من رجل في أرض دَوِيَّة مَهلَكة",
    narrator: "متفق عليه",
  },
  {
    text: "كلُّ ابنِ آدمَ خطَّاءٌ وخيرُ الخطَّائينَ التوَّابونَ",
    narrator: "رواه الترمذي",
  },
  {
    text: "من قال أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه غُفر له",
    narrator: "رواه أبو داود",
  },
];

function SectionHadithCard() {
  const todayIdx = new Date().getDate() % HOME_HADITHS.length;
  const hadith = HOME_HADITHS[todayIdx]!;

  return (
    <div
      className="flex items-start gap-3.5 rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(145deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.04) 100%)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.1) 100%)",
          border: "1px solid rgba(245,158,11,0.35)",
        }}
      >
        <span style={{ fontSize: 18 }}>🌙</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", color: "#d97706" }}
          >
            حديث اليوم
          </span>
        </div>
        <p
          className="font-semibold leading-relaxed text-right mb-1.5 text-foreground"
          style={{ fontSize: 13 }}
        >
          «{hadith.text}»
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {hadith.narrator}
        </p>
      </div>
    </div>
  );
}

// ─── Journey Bento Hero — sub-cells ──────────────────────────────────────────

type BentoRipple = { id: string; x: number; y: number };

const BENTO_VERSES = [
  { text: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", ref: "الزمر: ٥٣" },
  { text: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ", ref: "البقرة: ٢٢٢" },
  {
    text: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ",
    ref: "الشورى: ٢٥",
  },
  { text: "إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ", ref: "هود: ١١٤" },
];

const DAILY_SECRETS = [
  "«خيرُ الذِّكرِ الخفيّ» — ابدأ الآن",
  "«من قرأ آية الكرسي دبر كل صلاة»",
  "صلِّ على النبي ﷺ ٣ مرات الآن",
  "«سبحان الله وبحمده» مئة مرة",
];

function DhikrCounterCell() {
  const [count, setCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem("home_dhikr_count") ?? "0") || 0;
    } catch {
      return 0;
    }
  });
  const [ripples, setRipples] = useState<BentoRipple[]>([]);

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now().toString();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    const next = count + 1;
    setCount(next);
    try {
      localStorage.setItem("home_dhikr_count", String(next));
    } catch {}
    if (navigator.vibrate) navigator.vibrate(14);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      700,
    );
  };

  return (
    <button
      onClick={handleTap}
      className="relative overflow-hidden flex flex-col items-center justify-center gap-2 w-full h-full rounded-[18px] active:scale-[0.96] transition-transform select-none"
      style={{
        background:
          "linear-gradient(145deg, rgba(251,191,36,0.2) 0%, rgba(217,119,6,0.08) 100%)",
        border: "1px solid rgba(251,191,36,0.28)",
        minHeight: 112,
      }}
    >
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            x: "-50%",
            y: "-50%",
            background: "rgba(251,191,36,0.32)",
          }}
          initial={{ width: 0, height: 0, opacity: 0.9 }}
          animate={{ width: 240, height: 240, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[70px] h-[70px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)",
          }}
        />
      </div>
      <motion.p
        key={count}
        initial={{ scale: 1.35, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative font-bold leading-none tabular-nums"
        style={{ fontSize: 32, color: "#fbbf24" }}
      >
        {count}
      </motion.p>
      <p
        className="relative text-[10px] font-semibold"
        style={{ color: "rgba(251,191,36,0.65)" }}
      >
        استغفر — اضغط هنا
      </p>
    </button>
  );
}

function VerseCellBento() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % BENTO_VERSES.length),
      7000,
    );
    return () => clearInterval(t);
  }, []);
  const v = BENTO_VERSES[idx]!;
  return (
    <div
      className="flex items-center gap-3 w-full rounded-[18px] px-4 py-3"
      style={{
        background:
          "linear-gradient(145deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.06) 100%)",
        border: "1px solid rgba(16,185,129,0.24)",
        minHeight: 68,
      }}
    >
      <div
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(16,185,129,0.22)" }}
      >
        <BookMarked size={12} style={{ color: "#10b981" }} />
      </div>
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="font-bold leading-relaxed text-right truncate"
            style={{
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Amiri Quran', serif",
              fontSize: 12,
            }}
          >
            ﴿{v.text}﴾
          </motion.p>
        </AnimatePresence>
        <p
          className="text-[9px] text-right mt-0.5"
          style={{ color: "rgba(16,185,129,0.75)" }}
        >
          {v.ref}
        </p>
      </div>
    </div>
  );
}

function LiveCounterCellBento() {
  const [count, setCount] = useState(
    () => 12450 + Math.floor(Math.random() * 300),
  );
  useEffect(() => {
    const t = setInterval(
      () => setCount((c) => c + Math.floor(Math.random() * 4 + 1)),
      2600,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 w-full h-full rounded-[18px]"
      style={{
        background:
          "linear-gradient(145deg, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.07) 100%)",
        border: "1px solid rgba(99,102,241,0.22)",
        minHeight: 66,
      }}
    >
      <div className="flex items-center gap-1.5">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#818cf8" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <p
          className="font-bold tabular-nums"
          style={{ fontSize: 14, color: "#818cf8" }}
        >
          {count.toLocaleString("ar-EG")}
        </p>
      </div>
      <p className="text-[9px]" style={{ color: "rgba(129,140,248,0.65)" }}>
        يتوبون الآن
      </p>
    </div>
  );
}

function SecretOfTheDayCellBento() {
  const hour = new Date().getHours();
  const isUnlocked = hour >= 5;
  const [open, setOpen] = useState(false);
  const secret = DAILY_SECRETS[new Date().getDate() % DAILY_SECRETS.length]!;
  return (
    <div
      onClick={() => isUnlocked && setOpen((v) => !v)}
      className="flex flex-col items-center justify-center gap-1.5 w-full h-full rounded-[18px] overflow-hidden relative"
      style={{
        background: isUnlocked
          ? "linear-gradient(145deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.07) 100%)"
          : "linear-gradient(145deg, rgba(40,40,60,0.7) 0%, rgba(25,25,40,0.85) 100%)",
        border: isUnlocked
          ? "1px solid rgba(245,158,11,0.28)"
          : "1px solid rgba(100,100,140,0.2)",
        minHeight: 66,
        cursor: isUnlocked ? "pointer" : "default",
      }}
    >
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[20px]">🔒</span>
            <p
              className="text-[8.5px] text-center leading-tight"
              style={{ color: "rgba(160,160,200,0.75)" }}
            >
              يفتح بعد
              <br />
              الفجر
            </p>
          </motion.div>
        ) : open ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1 px-2"
          >
            <span className="text-[14px]">✨</span>
            <p
              className="text-[9px] font-bold text-center leading-snug"
              style={{ color: "#fbbf24" }}
            >
              {secret}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <motion.span
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              🔑
            </motion.span>
            <p
              className="text-[9px]"
              style={{ color: "rgba(245,158,11,0.75)" }}
            >
              خبيئة اليوم
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Qibla + Prayer Hook ──────────────────────────────────────────────────────

const MECCA = { lat: 21.4225, lon: 39.8262 };
const PRAYER_NAMES: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};
const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function calcQibla(lat: number, lon: number): number {
  const toR = (d: number) => (d * Math.PI) / 180;
  const lat1 = toR(lat),
    lat2 = toR(MECCA.lat);
  const dLon = toR(MECCA.lon - lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getNextPrayerFromTimings(
  timings: Record<string, string>,
): { name: string; time: string; minsLeft: number } | null {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const key of PRAYER_ORDER) {
    const t = timings[key];
    if (!t) continue;
    const [h, m] = t.split(":").map(Number);
    const pMins = h * 60 + m;
    if (pMins > nowMins) {
      const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const suffix = h < 12 ? "ص" : "م";
      return {
        name: PRAYER_NAMES[key] ?? key,
        time: `${hh}:${String(m).padStart(2, "0")} ${suffix}`,
        minsLeft: pMins - nowMins,
      };
    }
  }
  return null;
}

function useQiblaAndPrayer() {
  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    minsLeft: number;
  } | null>(null);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init(lat: number, lon: number) {
      if (!mounted) return;
      setQibla(calcQibla(lat, lon));

      const cacheKey = `bento_prayer_${Math.floor(Date.now() / (1000 * 60 * 60))}`;
      let timings: Record<string, string> | null = null;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) timings = JSON.parse(cached);
      } catch {}

      if (!timings) {
        try {
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=4`,
          );
          const data = await res.json();
          if (data.code === 200) {
            const raw = data.data.timings as Record<string, string>;
            timings = {};
            for (const key of PRAYER_ORDER) {
              timings[key] = (raw[key] ?? "").split(" ")[0]!;
            }
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(timings));
            } catch {}
          }
        } catch {}
      }

      if (timings && mounted) {
        setNextPrayer(getNextPrayerFromTimings(timings));
      }
    }

    const cachedLat = parseFloat(localStorage.getItem("prayerLat") ?? "");
    const cachedLon = parseFloat(localStorage.getItem("prayerLng") ?? "");

    if (!isNaN(cachedLat) && !isNaN(cachedLon)) {
      init(cachedLat, cachedLon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            localStorage.setItem("prayerLat", String(pos.coords.latitude));
            localStorage.setItem("prayerLng", String(pos.coords.longitude));
          } catch {}
          init(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (mounted) setPermDenied(true);
        },
        { timeout: 6000, maximumAge: 3600000 },
      );
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!mounted) return;
      const alpha = e.alpha ?? (e as any).webkitCompassHeading;
      if (alpha !== null && alpha !== undefined) setHeading(alpha);
    };

    async function requestCompass() {
      const DevOri = DeviceOrientationEvent as any;
      if (typeof DevOri.requestPermission === "function") {
        try {
          const perm = await DevOri.requestPermission();
          if (perm === "granted") {
            window.addEventListener(
              "deviceorientation",
              handleOrientation,
              true,
            );
          }
        } catch {}
      } else {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    }
    requestCompass();

    return () => {
      mounted = false;
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  const needleRotation =
    qibla !== null ? (heading !== null ? qibla - heading : qibla) : null;

  return { qibla, needleRotation, nextPrayer, permDenied };
}

// ─── Live Compass Widget ──────────────────────────────────────────────────────

function BentoCompassWidget() {
  const { needleRotation, nextPrayer, qibla, permDenied } = useQiblaAndPrayer();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const hasLocation = qibla !== null;

  return (
    <div className="flex items-center gap-2">
      <div className="text-right min-w-0">
        {hasLocation ? (
          <>
            <p
              className="text-[9.5px] font-bold leading-tight"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              القبلة {Math.round(qibla!)}°
            </p>
            {nextPrayer ? (
              <p
                className="text-[8px] leading-tight mt-0.5"
                style={{ color: "rgba(255,200,80,0.8)" }}
              >
                {nextPrayer.name} {nextPrayer.time}
              </p>
            ) : (
              <p
                className="text-[8px] leading-tight"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                جاري الحساب…
              </p>
            )}
          </>
        ) : permDenied ? (
          <>
            <p
              className="text-[9.5px] font-bold"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              القبلة
            </p>
            <p
              className="text-[8px]"
              style={{ color: "rgba(255,100,100,0.6)" }}
            >
              الموقع مرفوض
            </p>
          </>
        ) : (
          <>
            <p
              className="text-[9.5px] font-bold"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              القبلة
            </p>
            <p
              className="text-[8px]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              جاري…
            </p>
          </>
        )}
      </div>

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden"
        style={{
          background: hasLocation
            ? "linear-gradient(135deg, rgba(200,168,75,0.2) 0%, rgba(255,255,255,0.06) 100%)"
            : "rgba(255,255,255,0.08)",
          border: hasLocation
            ? "1px solid rgba(200,168,75,0.45)"
            : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Cardinal marks */}
        {hasLocation && (
          <>
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 w-[2px] h-[4px] rounded-full"
              style={{ background: "rgba(255,255,255,0.25)" }}
            />
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-[4px] rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
          </>
        )}

        {hasLocation && needleRotation !== null ? (
          <motion.div
            animate={{ rotate: needleRotation }}
            transition={{ type: "spring", damping: 15, stiffness: 80 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg width="28" height="28" viewBox="0 0 28 28">
              <polygon points="14,3 16,13 12,13" fill="#c8a84b" />
              <polygon
                points="14,25 16,15 12,15"
                fill="rgba(255,255,255,0.25)"
              />
              <circle cx="14" cy="14" r="2" fill="rgba(255,255,255,0.6)" />
            </svg>
          </motion.div>
        ) : (
          <motion.span
            style={{ fontSize: 18 }}
            animate={hasLocation ? {} : { rotate: [0, 8, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🧭
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ─── Background star dots for bento card ─────────────────────────────────────
function StarDots() {
  const dots = [
    [18, 12],
    [85, 8],
    [42, 22],
    [70, 5],
    [95, 18],
    [30, 6],
    [60, 24],
    [10, 20],
    [50, 10],
    [78, 20],
    [22, 28],
    [92, 28],
  ] as [number, number][];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
      {dots.map(([x, y], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: i % 3 === 0 ? 2 : 1.5,
            height: i % 3 === 0 ? 2 : 1.5,
            background: "#fbbf24",
          }}
          animate={{ opacity: [0.15, 0.55, 0.15] }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: (i * 0.4) % 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── The full bento journey card ──────────────────────────────────────────────
function SectionJourneyCard() {
  const { data: progress } = useAppUserProgress();
  const hasCovenant = progress?.covenantSigned;
  const dayOneDone = progress?.firstDayTasksCompleted;

  if (hasCovenant && dayOneDone) return <Journey30HeroCard />;

  const ctaHref = !hasCovenant ? "/covenant" : "/day-one";
  const ctaLabel = !hasCovenant ? "ابدأ رحلتك الآن" : "أكمل اللحظة الأولى";

  // Live counter simulation
  const [joinCount, setJoinCount] = useState(() => 8400 + Math.floor(Math.random() * 300));
  useEffect(() => {
    const t = setInterval(() => setJoinCount(c => c + Math.floor(Math.random() * 2 + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  const PILLARS = [
    { emoji: "🤲", label: "توبة صادقة",    color: "#34d399" },
    { emoji: "📖", label: "ورد يومي",       color: "#fbbf24" },
    { emoji: "🌱", label: "نمو روحي",       color: "#818cf8" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px]"
      style={{
        background: "linear-gradient(145deg, #050f0a 0%, #0a1f12 40%, #0c2518 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <StarDots />

      {/* Top radiant light */}
      <div className="absolute inset-x-0 top-0 h-[120px] pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 70%)",
      }} />

      {/* Side accent lines */}
      <div className="absolute right-0 top-0 bottom-0 w-[3px] pointer-events-none" style={{
        background: "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.5) 30%, rgba(251,191,36,0.5) 70%, transparent 100%)",
      }} />

      <div className="relative z-10 p-5 flex flex-col gap-4">

        {/* Live badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.28)" }}>
            <motion.div className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>
              {joinCount.toLocaleString("ar-EG")} مسافر
            </span>
          </div>
          <BentoCompassWidget />
        </div>

        {/* Main title */}
        <div className="text-center">
          <p className="text-[10px] font-bold mb-1 tracking-widest" style={{ color: "rgba(251,191,36,0.5)", letterSpacing: "0.12em" }}>
            ✦ ٣٠ يوماً من النور ✦
          </p>
          <h2
            className="font-black leading-tight mb-2"
            style={{
              fontSize: 26,
              background: "linear-gradient(135deg, #ffffff 0%, #fde68a 40%, #f59e0b 70%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              fontFamily: "'Amiri Quran', serif",
            }}
          >
            رحلة العودة إلى الله
          </h2>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            {!hasCovenant ? "التوبة ليست لحظة واحدة — هي رحلة تتغيّر فيها يوماً بيوم" : "واصل — بقيت خطوات قليلة لبدء رحلتك"}
          </p>
        </div>

        {/* Verse */}
        <div className="rounded-2xl px-4 py-3 text-center" style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(251,191,36,0.15)",
        }}>
          <p className="leading-loose" style={{
            fontFamily: "'Amiri Quran', serif", fontSize: 14.5, color: "rgba(255,255,255,0.88)"
          }}>
            ﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾
          </p>
          <p className="text-[9px] mt-1" style={{ color: "rgba(251,191,36,0.5)" }}>— البقرة: ٢٢٢</p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-3 gap-2">
          {PILLARS.map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: `${p.color}10`, border: `1px solid ${p.color}25` }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span className="text-[9px] font-bold text-center" style={{ color: p.color }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Bento row */}
        <div className="flex gap-2">
          <div className="flex-[3]"><DhikrCounterCell /></div>
          <div className="flex-[2]"><SecretOfTheDayCellBento /></div>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[18px] font-black text-sm active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
            color: "#0d0700",
            boxShadow: "0 6px 24px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.4)",
            fontSize: 15,
          }}
        >
          <span>⚡ {ctaLabel}</span>
          <ArrowLeft size={16} />
        </Link>
      </div>
    </div>
  );
}

function SectionIslamicPrograms() {
  return (
    <Link
      href="/islamic-programs"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-[-20px] left-[-20px] w-[90px] h-[90px] rounded-full opacity-15 bg-white pointer-events-none" />
      <div className="absolute bottom-[-30px] right-[30%] w-[80px] h-[80px] rounded-full opacity-10 bg-white pointer-events-none" />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(6px)",
        }}
      >
        📺
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>
          برامج إسلامية
        </h3>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          50 برنامج • تفسير · دعوة · فتاوى · سيرة · إذاعة
        </p>
      </div>

      {/* Small program previews */}
      <div className="flex gap-1 shrink-0">
        {["📖", "🤝", "🎬"].map((icon, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            {icon}
          </div>
        ))}
      </div>

      <ArrowLeft
        size={16}
        style={{ color: "rgba(255,255,255,0.5)" }}
        className="shrink-0"
      />
    </Link>
  );
}

const GARDEN_STAGES = [
  { min: 0,   max: 49,  emoji: "🌱", name: "بذرة",   color: "#a7f3d0", desc: "البداية — كل رحلة تبدأ بخطوة" },
  { min: 50,  max: 199, emoji: "🌿", name: "شتلة",   color: "#6ee7b7", desc: "جذورك تتعمق — واصل الذكر" },
  { min: 200, max: 499, emoji: "🌳", name: "شجرة",   color: "#34d399", desc: "شجرة راسخة — ثمارها نور" },
  { min: 500, max: 999, emoji: "🌲", name: "غابة",   color: "#10b981", desc: "غابة بركة — روح مزهرة" },
  { min: 1000, max: Infinity, emoji: "🏡", name: "جنة", color: "#059669", desc: "جنة الدنيا — تُظلّ من حولك" },
];

function SectionGarden() {
  const count = (() => {
    try { return parseInt(localStorage.getItem("home_dhikr_count") ?? "0") || 0; }
    catch { return 0; }
  })();

  const stageIdx = GARDEN_STAGES.findIndex(s => count >= s.min && count <= s.max);
  const stage = GARDEN_STAGES[Math.max(0, stageIdx)]!;
  const nextStage = GARDEN_STAGES[stageIdx + 1];
  const pct = nextStage
    ? Math.min(((count - stage.min) / (nextStage.min - stage.min)) * 100, 100)
    : 100;

  return (
    <Link
      href="/garden"
      className="block rounded-[24px] overflow-hidden relative active:scale-[0.98] transition-all"
      style={{
        background: "linear-gradient(145deg, #031a0d 0%, #052e14 40%, #064220 100%)",
        border: "1px solid rgba(16,185,129,0.28)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Radiant glow */}
      <div className="absolute inset-x-0 top-0 h-[80px] pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(16,185,129,0.2) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              {stage.emoji}
            </div>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>شجرة التوبة</h3>
              <p className="text-[10px]" style={{ color: "rgba(52,211,153,0.7)" }}>{stage.name} • {count.toLocaleString("ar-EG")} ذكر</p>
            </div>
          </div>
          <ArrowLeft size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
        </div>

        {/* Stage desc */}
        <p className="text-[10px] mb-3 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>{stage.desc}</p>

        {/* Journey lifecycle stages */}
        <div className="flex items-center gap-1 mb-3">
          {GARDEN_STAGES.map((s, i) => {
            const isCurrent = i === stageIdx;
            const isPast = i < stageIdx;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div
                  className="flex flex-col items-center gap-0.5 flex-1"
                  style={{ opacity: isPast ? 0.7 : isCurrent ? 1 : 0.3 }}
                >
                  <span style={{ fontSize: isCurrent ? 18 : 13 }}>{s.emoji}</span>
                  <span className="text-[7px] font-bold" style={{ color: isCurrent ? s.color : "rgba(255,255,255,0.4)" }}>
                    {s.name}
                  </span>
                </div>
                {i < GARDEN_STAGES.length - 1 && (
                  <div className="h-[1px] flex-[0.3]" style={{
                    background: i < stageIdx ? "#10b981" : "rgba(255,255,255,0.12)",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress to next stage */}
        {nextStage && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {nextStage.min - count} ذكر للمرحلة التالية {nextStage.emoji}
              </span>
              <span className="text-[9px] font-bold" style={{ color: stage.color }}>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${stage.color}, ${nextStage.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {!nextStage && (
          <div className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.3)" }}>
            <span>🏆</span>
            <p className="text-[10px] font-bold" style={{ color: "#059669" }}>بلغت أعلى المراحل — تاج التوبة</p>
          </div>
        )}
      </div>
    </Link>
  );
}

function SectionMunajat() {
  const hour = new Date().getHours();
  const isAfterIsha = hour >= 20 || hour < 4;
  return (
    <Link
      href="/munajat"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #0c0a1e 0%, #1e1b4b 50%, #1a1040 100%)",
        border: "1px solid rgba(139,92,246,0.3)",
      }}
    >
      <div className="absolute top-[-15px] left-[-15px] w-[80px] h-[80px] rounded-full opacity-10 bg-white pointer-events-none" />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(6px)",
        }}
      >
        🌙
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>
          وضع المناجاة
        </h3>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "rgba(200,180,255,0.65)" }}
        >
          {isAfterIsha
            ? "⭐ الليل — وقت المناجاة"
            : "شاشة هادئة • صوت أمبيانت • ذكر"}
        </p>
      </div>
      <ArrowLeft
        size={16}
        style={{ color: "rgba(200,180,255,0.4)" }}
        className="shrink-0"
      />
    </Link>
  );
}

function SectionAdhkar() {
  return (
    <Link
      href="/adhkar"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #0d1f1a 0%, #0a2218 50%, #071a14 100%)",
        border: "1px solid rgba(52,211,153,0.28)",
      }}
    >
      <div
        className="absolute top-[-15px] right-[-15px] w-[80px] h-[80px] rounded-full pointer-events-none"
        style={{ background: "rgba(52,211,153,0.15)", filter: "blur(16px)" }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{
          background: "rgba(52,211,153,0.12)",
          border: "1px solid rgba(52,211,153,0.2)",
        }}
      >
        📿
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#6ee7b7" }}>
          الأذكار والأدعية
        </h3>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "rgba(110,231,183,0.55)" }}
        >
          ٢٨ قسماً شاملاً — صباح ومساء وصلاة وحياة
        </p>
      </div>
      <ArrowLeft
        size={16}
        style={{ color: "rgba(110,231,183,0.35)" }}
        className="shrink-0"
      />
    </Link>
  );
}

function renderSection(id: ListId) {
  switch (id) {
    case "quran-card":
      return <SectionQuranCard />;
    case "hadith-card":
      return <SectionHadithCard />;
    case "soul-meter":
      return <SectionSoulMeter />;
    case "journey-card":
      return <SectionJourneyCard />;
    case "journey30":
      return <SectionJourney30 />;
    case "invite":
      return <SectionInvite />;
    case "ameen":
      return <SectionAmeen />;
    case "tawbah-card":
      return <SectionTawbahCard />;
    case "signs":
      return <SectionSigns />;
    case "map":
      return <SectionMap />;
    case "live-stats":
      return <SectionLiveStats />;
    case "islamic-programs":
      return <SectionIslamicPrograms />;
    case "garden":
      return <SectionGarden />;
    case "munajat":
      return <SectionMunajat />;
    case "adhkar":
      return <SectionAdhkar />;
  }
}

// ─── SortableUnifiedItem ──────────────────────────────────────────────────────

function SortableUnifiedItem({
  id,
  editMode,
}: {
  id: SectionId;
  editMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  if (isGridItem(id)) {
    const meta = GRID_META[id];
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative"
        /* each grid item takes 50% of the row, gap handled by parent */
      >
        <Link
          href={meta.href}
          className={`relative flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br ${meta.bg} border ${meta.border} px-3 py-5 active:scale-[0.96] transition-all text-center overflow-hidden`}
          style={{
            minHeight: "106px",
            borderRadius: 22,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {/* Shine */}
          <div
            className="absolute top-0 inset-x-0 h-[40%] pointer-events-none rounded-t-[22px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
            }}
          />
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.iconBg}`}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            {meta.icon}
          </div>
          <div>
            <p className="font-bold text-[11.5px] leading-tight">
              {meta.label}
            </p>
            <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-tight">
              {meta.sub}
            </p>
          </div>
        </Link>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            {...attributes}
            {...listeners}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={13} className="text-primary/70" />
          </motion.div>
        )}
      </div>
    );
  }

  // List item
  const listId = id as ListId;
  return (
    <div ref={setNodeRef} style={style} className="relative w-full">
      {editMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 -right-1 z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} className="text-primary/70" />
        </motion.div>
      )}
      <div className={editMode ? "pr-11 transition-all" : "transition-all"}>
        {renderSection(listId)}
      </div>
    </div>
  );
}

// ─── Quick Access Bar ─────────────────────────────────────────────────────────

const QUICK_ACCESS = [
  { href: "/quran", emoji: "📖", label: "القرآن", color: "#c8a84b" },
  { href: "/prayer-times", emoji: "🕌", label: "الصلاة", color: "#6366f1" },
  { href: "/dhikr", emoji: "📿", label: "مسبحة", color: "#f59e0b" },
  { href: "/rajaa", emoji: "💚", label: "مكتبة الرجاء", color: "#059669" },
  { href: "/islamic-programs", emoji: "🎓", label: "برامج", color: "#10b981" },
  { href: "/dhikr-rooms", emoji: "👥", label: "غرف الذكر", color: "#14b8a6" },
  { href: "/journal", emoji: "✍️", label: "يومياتي", color: "#8b5cf6" },
  { href: "/adhkar", emoji: "🤲", label: "الأذكار", color: "#ec4899" },
];

function QuickAccessBar() {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-0.5"
      style={
        {
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties
      }
    >
      {QUICK_ACCESS.map((item) => (
        <Link key={item.href} href={item.href}>
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              background: `${item.color}16`,
              border: `1px solid ${item.color}2e`,
            }}
          >
            <span style={{ fontSize: 13 }}>{item.emoji}</span>
            <span
              className="text-[11px] font-bold"
              style={{ color: item.color }}
            >
              {item.label}
            </span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

// ─── Daily Focus Card ─────────────────────────────────────────────────────────

const DAILY_TASKS = [
  {
    icon: "📖",
    task: "اقرأ صفحتين من القرآن الكريم بتدبر وخشوع",
    category: "قرآن",
    color: "#c8a84b",
  },
  {
    icon: "🌙",
    task: "صلِّ ركعتي الضحى قبل الظهر واسأل الله حاجتك",
    category: "صلاة",
    color: "#6366f1",
  },
  {
    icon: "📿",
    task: "سبّح الله ١٠٠ مرة بالمسبحة مع التركيز",
    category: "ذكر",
    color: "#f59e0b",
  },
  {
    icon: "✍️",
    task: "اكتب في يوميات توبتك تأملاً أو دعاءً صادقاً",
    category: "يوميات",
    color: "#8b5cf6",
  },
  {
    icon: "🤝",
    task: "ادعُ لأخٍ مجهول في الصديق السري بظهر الغيب",
    category: "دعاء",
    color: "#ec4899",
  },
  {
    icon: "💪",
    task: "أتمم مهمة واحدة من مهام هادي اليوم بنية صادقة",
    category: "عمل",
    color: "#10b981",
  },
  {
    icon: "🌟",
    task: "راجع تقدمك في رحلة الثلاثين يوماً واحتفل بيوم جديد",
    category: "تقدم",
    color: "#0ea5e9",
  },
];

function DailyFocusCard() {
  const todayTask = DAILY_TASKS[new Date().getDay() % DAILY_TASKS.length]!;
  const todayKey = `focus_done_${new Date().toDateString()}`;
  const [done, setDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem(todayKey) === "1";
    } catch {
      return false;
    }
  });

  const markDone = () => {
    setDone(true);
    try {
      localStorage.setItem(todayKey, "1");
    } catch {}
    if (navigator.vibrate) navigator.vibrate([12, 8, 12]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] p-4"
      style={{
        background: `linear-gradient(135deg, ${todayTask.color}12 0%, ${todayTask.color}05 100%)`,
        border: `1px solid ${todayTask.color}26`,
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{todayTask.icon}</span>
          <div>
            <p
              className="text-[10px] font-extrabold tracking-wide"
              style={{ color: todayTask.color }}
            >
              تركيزك اليوم
            </p>
            <p className="text-[9px] text-muted-foreground">
              {todayTask.category}
            </p>
          </div>
        </div>
        {done && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: `${todayTask.color}20` }}
          >
            <CheckCircle2 size={11} style={{ color: todayTask.color }} />
            <span
              className="text-[10px] font-bold"
              style={{ color: todayTask.color }}
            >
              أحسنت!
            </span>
          </motion.div>
        )}
      </div>

      <p className="text-[13px] font-semibold leading-relaxed text-right mb-3">
        {todayTask.task}
      </p>

      {!done ? (
        <button
          onClick={markDone}
          className="w-full py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          style={{
            background: `${todayTask.color}1a`,
            color: todayTask.color,
            border: `1px solid ${todayTask.color}30`,
          }}
        >
          ✓ أتممت هذه المهمة
        </button>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground">
          بارك الله فيك 🌟 واصل الاستمرارية كل يوم
        </p>
      )}
    </motion.div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoading } = useAppUserProgress();
  const { aiMode, toggleAiMode, decision } = useZakiyMode();
  const [showSosToast, setShowSosToast] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    if (decision?.urgency === "emergency") {
      setShowEmergency(true);
    }
  }, [decision?.urgency]);

  // Unified order for all sections (grid + list mixed freely)
  const [combinedOrder, setCombinedOrder] =
    useState<SectionId[]>(loadCombinedOrder);
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("sos_return") === "1") {
        localStorage.removeItem("sos_return");
        setShowSosToast(true);
      }
    } catch {}
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as SectionId);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setCombinedOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as SectionId);
        const newIndex = prev.indexOf(over.id as SectionId);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveCombinedOrder(next);
        return next;
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      <ZakiyEmergencyOverlay
        visible={showEmergency}
        message={decision?.message ?? ""}
        onDismiss={() => setShowEmergency(false)}
      />

      <AnimatePresence>
        {showSosToast && (
          <SosReturnToast onDismiss={() => setShowSosToast(false)} />
        )}
      </AnimatePresence>

      {/* Zakiy Mode Toggle */}
      <div className="flex justify-center pt-3 pb-1 px-5" dir="rtl">
        <button
          onClick={toggleAiMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
            aiMode
              ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${aiMode ? "text-indigo-400" : "text-white/30"}`} />
          {aiMode ? "وضع زكي مفعّل — اضغط للإيقاف" : "دع زكي يقودك"}
        </button>
      </div>

      {/* AI Mode replaces dashboard */}
      {aiMode ? (
        <ZakiyModeDashboard />
      ) : (
        <>
      {/* Hero + bell overlay */}
      <div className="relative">
        <IslamicHero />
        <HeroBellButton />
      </div>
      <div className="px-5 relative z-10 flex flex-col gap-4 pl-[7px] pr-[7px] mt-[-88px]">
        {/* ── Quick Access Bar ── */}
        <QuickAccessBar />

        <EidEntryCard />
        <div className="hidden">
          <DynamicBanner />
        </div>

        {/* ── Mood Selector ── */}
        <MoodSelector />

        {/* ── Daily Focus Card ── */}
        <DailyFocusCard />

        {/* Edit mode banner */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3"
            >
              <div>
                <p className="text-xs font-bold text-primary">
                  وضع الترتيب مفعّل
                </p>
                <p className="text-[10px] text-primary/60 mt-0.5">
                  اسحب أي بطاقة لتغيير مكانها — يمكنك خلط جميع الأنواع
                </p>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="text-xs font-bold text-primary bg-primary/15 hover:bg-primary/25 px-4 py-1.5 rounded-xl transition-colors"
              >
                تم ✓
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Unified sortable section (grid + list mixed freely) ─── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={combinedOrder} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-3">
              {combinedOrder.map((id) => (
                <Fragment key={id}>
                  {id === "tawbah-card" && (
                    <div className="w-full">
                      <KnowledgeSlider />
                    </div>
                  )}
                  <div
                    className={isGridItem(id) ? "w-[calc(50%-6px)]" : "w-full"}
                  >
                    <SortableUnifiedItem id={id} editMode={editMode} />
                  </div>
                </Fragment>
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeId ? (
              isGridItem(activeId) ? (
                <div
                  className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-sm rotate-2 scale-[1.05] flex flex-col items-center justify-center gap-2 px-3 py-4 text-center"
                  style={{ minHeight: "96px" }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${GRID_META[activeId].iconBg}`}
                  >
                    {GRID_META[activeId].icon}
                  </div>
                  <p className="text-[11px] font-bold text-primary">
                    {GRID_META[activeId].label}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/98 backdrop-blur-sm overflow-hidden rotate-1 scale-[1.03]">
                  <div className="px-4 py-3 flex items-center gap-3 bg-primary/5">
                    <GripVertical size={16} className="text-primary" />
                    <span className="text-sm font-bold text-primary">
                      {SECTION_LABELS[activeId as ListId]}
                    </span>
                  </div>
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Community Ticker ── */}
        <CommunityTicker />

        {/* Organize toggle button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setEditMode((v) => !v)}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border text-sm font-bold transition-all ${
            editMode
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
          }`}
        >
          <Settings2 size={16} />
          {editMode ? "إنهاء التنظيم" : "إعادة ترتيب البطاقات"}
        </motion.button>
      </div>
        </>
      )}
    </div>
  );
}
