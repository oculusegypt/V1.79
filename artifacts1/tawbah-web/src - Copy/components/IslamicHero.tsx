import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  MessageCircle,
  Star,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
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
  Zap,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useLocation } from "wouter";

interface HeroItem {
  type: "ayah" | "hadith" | "dhikr" | "nafl" | "dua" | "wisdom";
  text: string;
  source?: string;
}

const TYPE_META: Record<
  HeroItem["type"],
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  ayah: {
    label: "آية كريمة",
    icon: <BookOpen size={10} />,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.18)",
  },
  hadith: {
    label: "حديث شريف",
    icon: <MessageCircle size={10} />,
    color: "#fcd34d",
    bg: "rgba(252,211,77,0.18)",
  },
  dhikr: {
    label: "ذكر مأثور",
    icon: <Star size={10} />,
    color: "#6ee7b7",
    bg: "rgba(110,231,183,0.18)",
  },
  nafl: {
    label: "نافلة وسنة",
    icon: <Sun size={10} />,
    color: "#93c5fd",
    bg: "rgba(147,197,253,0.18)",
  },
  dua: {
    label: "دعاء مأثور",
    icon: <Moon size={10} />,
    color: "#c4b5fd",
    bg: "rgba(196,181,253,0.18)",
  },
  wisdom: {
    label: "نصيحة",
    icon: <Sparkles size={10} />,
    color: "#fda4af",
    bg: "rgba(253,164,175,0.18)",
  },
};

const CACHE_KEY = "hero_content_cache_v3";
const CACHE_TTL = 60 * 60 * 1000;

function loadCache(): HeroItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, expiresAt } = JSON.parse(raw) as {
      items: HeroItem[];
      expiresAt: number;
    };
    if (Date.now() > expiresAt) return null;
    return items;
  } catch {
    return null;
  }
}

function saveCache(items: HeroItem[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ items, expiresAt: Date.now() + CACHE_TTL }),
    );
  } catch {}
}

const FALLBACK: HeroItem[] = [
  {
    type: "ayah",
    text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
    source: "الزمر: 53",
  },
  {
    type: "hadith",
    text: "التائبُ من الذنبِ كمن لا ذنبَ له",
    source: "ابن ماجه",
  },
  {
    type: "wisdom",
    text: "البداية الحقيقية لا تحتاج يوماً جديداً — تحتاج نية صادقة في هذه اللحظة",
  },
  {
    type: "dhikr",
    text: "سبحان الله وبحمده، سبحان الله العظيم",
    source: "خفيفتان ثقيلتان في الميزان",
  },
  {
    type: "ayah",
    text: "وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ",
    source: "طه: 82",
  },
];

const LIGHT_THEME_CONFIG: Record<
  string,
  {
    bg: string;
    shimmer: string;
    glowColor: string;
    textColor: string;
    subColor: string;
    cardBg: string;
    cardBorder: string;
  }
> = {
  forest: {
    bg: "linear-gradient(160deg, #f0faf4 0%, #e2f4ea 40%, #cee8d6 100%)",
    shimmer: "rgba(23,77,43,0.6)",
    glowColor: "rgba(23,77,43,0.12)",
    textColor: "#174d2b",
    subColor: "rgba(23,77,43,0.55)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(23,77,43,0.18)",
  },
  ocean: {
    bg: "linear-gradient(160deg, #eff7ff 0%, #daeeff 40%, #c3e2f8 100%)",
    shimmer: "rgba(15,76,129,0.6)",
    glowColor: "rgba(15,76,129,0.1)",
    textColor: "#0f4c81",
    subColor: "rgba(15,76,129,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(15,76,129,0.18)",
  },
  aurora: {
    bg: "linear-gradient(160deg, #f9f0ff 0%, #ede0ff 40%, #ddc9fc 100%)",
    shimmer: "rgba(107,33,168,0.55)",
    glowColor: "rgba(107,33,168,0.1)",
    textColor: "#6b21a8",
    subColor: "rgba(107,33,168,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(107,33,168,0.18)",
  },
  midnight: {
    bg: "linear-gradient(160deg, #eff2ff 0%, #dde5ff 40%, #c8d6fd 100%)",
    shimmer: "rgba(30,58,138,0.6)",
    glowColor: "rgba(30,58,138,0.1)",
    textColor: "#1e3a8a",
    subColor: "rgba(30,58,138,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(30,58,138,0.18)",
  },
  rose: {
    bg: "linear-gradient(160deg, #fff0f5 0%, #ffe0ef 40%, #ffcce5 100%)",
    shimmer: "rgba(159,18,57,0.55)",
    glowColor: "rgba(159,18,57,0.1)",
    textColor: "#9f1239",
    subColor: "rgba(159,18,57,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(159,18,57,0.18)",
  },
  sunset: {
    bg: "linear-gradient(160deg, #fffbf0 0%, #fff0d4 40%, #ffe4b2 100%)",
    shimmer: "rgba(146,64,14,0.6)",
    glowColor: "rgba(146,64,14,0.1)",
    textColor: "#92400e",
    subColor: "rgba(146,64,14,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(146,64,14,0.18)",
  },
  slate: {
    bg: "linear-gradient(160deg, #f0f4ff 0%, #dde7f5 40%, #c8d8ee 100%)",
    shimmer: "rgba(30,58,95,0.6)",
    glowColor: "rgba(30,58,95,0.1)",
    textColor: "#1e3a5f",
    subColor: "rgba(30,58,95,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(30,58,95,0.18)",
  },
  mint: {
    bg: "linear-gradient(160deg, #f0fefa 0%, #d8f8ef 40%, #c0f2e4 100%)",
    shimmer: "rgba(6,95,70,0.6)",
    glowColor: "rgba(6,95,70,0.1)",
    textColor: "#065f46",
    subColor: "rgba(6,95,70,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(6,95,70,0.18)",
  },
};

const LIGHT_HERO_FILTER: Record<string, string> = {
  forest: "brightness(1.0) saturate(1.4) hue-rotate(0deg)",
  mint: "brightness(1.0) saturate(1.5) hue-rotate(15deg)",
  ocean: "brightness(0.98) saturate(1.3) hue-rotate(-90deg) sepia(0.08)",
  midnight: "brightness(0.97) saturate(1.2) hue-rotate(-80deg) sepia(0.06)",
  aurora: "brightness(0.98) saturate(1.2) hue-rotate(-120deg) sepia(0.1)",
  rose: "brightness(1.0) saturate(1.2) hue-rotate(130deg) sepia(0.12)",
  sunset: "brightness(1.02) saturate(1.4) hue-rotate(75deg) sepia(0.15)",
  slate: "brightness(0.97) saturate(1.0) hue-rotate(-60deg) sepia(0.05)",
};

const LIGHT_LOGO_SHADOW: Record<string, string> = {
  forest:
    "drop-shadow(3px 8px 18px rgba(23,77,43,0.35)) drop-shadow(1px 3px 6px rgba(0,0,0,0.22))",
  mint: "drop-shadow(3px 8px 18px rgba(6,95,70,0.35)) drop-shadow(1px 3px 6px rgba(0,0,0,0.22))",
  ocean:
    "drop-shadow(3px 8px 18px rgba(15,76,129,0.35)) drop-shadow(1px 3px 6px rgba(0,0,0,0.22))",
  midnight:
    "drop-shadow(3px 8px 18px rgba(30,58,138,0.35)) drop-shadow(1px 3px 6px rgba(0,0,0,0.22))",
  aurora:
    "drop-shadow(3px 8px 18px rgba(107,33,168,0.32)) drop-shadow(1px 3px 6px rgba(0,0,0,0.20))",
  rose: "drop-shadow(3px 8px 18px rgba(159,18,57,0.32)) drop-shadow(1px 3px 6px rgba(0,0,0,0.20))",
  sunset:
    "drop-shadow(3px 8px 18px rgba(146,64,14,0.35)) drop-shadow(1px 3px 6px rgba(0,0,0,0.22))",
  slate:
    "drop-shadow(3px 8px 18px rgba(30,58,95,0.32)) drop-shadow(1px 3px 6px rgba(0,0,0,0.20))",
};

// ── Typing effect hook ──────────────────────────────────────────────────────
function useTypingText(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

// ── Islamic geometry SVGs ───────────────────────────────────────────────────
function IslamicGeometryDark() {
  return (
    <svg
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="goldGlowD" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blueGlowD" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.18" stroke="#fbbf24" strokeWidth="0.7" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,14 Q50,8 100,14 Q150,20 200,14 Q250,8 300,14 Q350,20 400,14" />
      </g>
      <g transform="translate(38,68)" opacity="0.13">
        <polygon
          points={Array.from({ length: 12 }, (_, i) => {
            const a = i * 30;
            const r1 = 36,
              r2 = 16;
            const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`,
            ].join(" ");
          }).join(" ")}
          fill="rgba(251,191,36,0.06)"
          stroke="#fbbf24"
          strokeWidth="0.8"
        />
        <circle
          cx="0"
          cy="0"
          r="5"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="0.8"
        />
        <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.6" />
      </g>
      <g transform="translate(362,52)" opacity="0.12">
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 45;
            const r1 = 26,
              r2 = 11;
            const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
            ].join(" ");
          }).join(" ")}
          fill="rgba(59,130,246,0.08)"
          stroke="#60a5fa"
          strokeWidth="0.9"
        />
        <circle
          cx="0"
          cy="0"
          r="3.5"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="0.7"
        />
      </g>
      <g transform="translate(375,120)" opacity="0.16">
        <path
          d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34"
          fill="#fbbf24"
        />
      </g>
      {(
        [
          [118, 16, 1.6, "#fbbf24"],
          [284, 20, 1.1, "#60a5fa"],
          [74, 88, 0.9, "#fbbf24"],
          [336, 74, 1.3, "#60a5fa"],
          [158, 44, 0.8, "#fbbf24"],
          [242, 52, 1.0, "#60a5fa"],
        ] as [number, number, number, string][]
      ).map(([cx, cy, r, c], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={c} opacity="0.28" />
      ))}
      <ellipse
        cx="200"
        cy="80"
        rx="180"
        ry="100"
        fill="url(#goldGlowD)"
        opacity="0.07"
      />
      <ellipse
        cx="330"
        cy="60"
        rx="80"
        ry="60"
        fill="url(#blueGlowD)"
        opacity="0.08"
      />
    </svg>
  );
}

function IslamicGeometryLight({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="lglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.2" stroke={color} strokeWidth="0.8" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,15 Q50,9 100,15 Q150,21 200,15 Q250,9 300,15 Q350,21 400,15" />
      </g>
      <g transform="translate(42,72)" opacity="0.18">
        <polygon
          points={Array.from({ length: 12 }, (_, i) => {
            const a = i * 30;
            const r1 = 38,
              r2 = 17;
            const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`,
            ].join(" ");
          }).join(" ")}
          fill={color}
          fillOpacity="0.07"
          stroke={color}
          strokeWidth="0.9"
        />
        <circle
          cx="0"
          cy="0"
          r="6"
          fill="none"
          stroke={color}
          strokeWidth="0.9"
        />
        <circle cx="0" cy="0" r="2.5" fill={color} opacity="0.5" />
      </g>
      <g transform="translate(358,56)" opacity="0.15">
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 45;
            const r1 = 28,
              r2 = 12;
            const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
            ].join(" ");
          }).join(" ")}
          fill={color}
          fillOpacity="0.06"
          stroke={color}
          strokeWidth="0.9"
        />
        <circle
          cx="0"
          cy="0"
          r="4"
          fill="none"
          stroke={color}
          strokeWidth="0.7"
        />
      </g>
      <g transform="translate(372,128)" opacity="0.2">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill={color} />
      </g>
      {(
        [
          [120, 18, 1.8],
          [285, 22, 1.2],
          [78, 92, 1.0],
          [338, 78, 1.4],
          [162, 46, 0.9],
          [244, 54, 1.1],
        ] as [number, number, number][]
      ).map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity="0.3" />
      ))}
      <ellipse
        cx="200"
        cy="90"
        rx="190"
        ry="110"
        fill="url(#lglow)"
        opacity="0.12"
      />
    </svg>
  );
}

function MosqueSilhouetteDark() {
  return (
    <div
      className="absolute bottom-0 inset-x-0 w-full pointer-events-none"
      style={{ height: 90 }}
    >
      <img
        src="/images/mosque-silhouette.png"
        alt=""
        aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.1, filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

function MosqueSilhouetteLight({ color }: { color: string }) {
  return (
    <div
      className="absolute bottom-0 inset-x-0 w-full pointer-events-none"
      style={{ height: 90 }}
    >
      <img
        src="/images/mosque-silhouette.png"
        alt=""
        aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.08, filter: `brightness(0) saturate(100%)` }}
      />
    </div>
  );
}

function MeshSpots({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: 220,
          height: 180,
          top: -40,
          left: "10%",
          background: isDark
            ? "rgba(59,130,246,0.12)"
            : "rgba(59,130,246,0.08)",
        }}
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[50px]"
        style={{
          width: 160,
          height: 140,
          top: 20,
          right: "5%",
          background: isDark
            ? "rgba(251,191,36,0.06)"
            : "rgba(251,191,36,0.07)",
        }}
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute rounded-full blur-[40px]"
        style={{
          width: 120,
          height: 100,
          bottom: 20,
          left: "30%",
          background: isDark
            ? "rgba(99,179,237,0.07)"
            : "rgba(99,179,237,0.06)",
        }}
        animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
    </div>
  );
}

// ── Orbital sections data ───────────────────────────────────────────────────
type OrbitalSection = {
  id: string;
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  bg: string;
};

const ORBITAL_SECTIONS: OrbitalSection[] = [
  {
    id: "rajaa",
    href: "/rajaa",
    label: "مكتبة الرجاء",
    Icon: BookOpen,
    color: "#10b981",
    bg: "rgba(16,185,129,0.22)",
  },
  {
    id: "dhikr",
    href: "/dhikr",
    label: "مسبحة الذكر",
    Icon: CircleDot,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.22)",
  },
  {
    id: "dua-timing",
    href: "/dua-timing",
    label: "لحظة الإجابة",
    Icon: Zap,
    color: "#eab308",
    bg: "rgba(234,179,8,0.22)",
  },
  {
    id: "dhikr-rooms",
    href: "/dhikr-rooms",
    label: "غرف الذكر",
    Icon: Users,
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.22)",
  },
  {
    id: "hadi-tasks",
    href: "/hadi-tasks",
    label: "مهام هادي",
    Icon: ListChecks,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.22)",
  },
  {
    id: "prayer-times",
    href: "/prayer-times",
    label: "مواقيت الصلاة",
    Icon: Clock,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.22)",
  },
  {
    id: "kaffarah",
    href: "/kaffarah",
    label: "الكفارات",
    Icon: ScrollText,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.22)",
  },
  {
    id: "relapse",
    href: "/relapse",
    label: "ضعفت وعدت؟",
    Icon: Heart,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.22)",
  },
  {
    id: "journal",
    href: "/journal",
    label: "يوميات التوبة",
    Icon: PenLine,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.22)",
  },
  {
    id: "progress-map",
    href: "/progress",
    label: "خريطة التقدم",
    Icon: BarChart2,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.22)",
  },
  {
    id: "challenge",
    href: "/challenge/create",
    label: "تحدي التوبة",
    Icon: Swords,
    color: "#f97316",
    bg: "rgba(249,115,22,0.22)",
  },
  {
    id: "notifications",
    href: "/notifications",
    label: "الإشعارات",
    Icon: Bell,
    color: "#d97706",
    bg: "rgba(217,119,6,0.22)",
  },
];

const ORBIT_RADIUS = 118; // px from logo center to bubble center
const BUBBLE_SIZE = 50; // px diameter of each bubble

function getShortLabel(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length === 1) return label;
  const last = words[words.length - 1]!;
  if (last.length <= 8) return last;
  return label.slice(0, 7);
}

// ── Main export ─────────────────────────────────────────────────────────────
export function IslamicHero() {
  const [items, setItems] = useState<HeroItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orbiting, setOrbiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, accentColor } = useSettings();
  const [, navigate] = useLocation();
  const isDark = theme === "dark";

  const fetchContent = useCallback(async () => {
    const cached = loadCache();
    if (cached?.length) {
      setItems(cached);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/hero-content");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { items: HeroItem[] };
      const list = data.items?.length ? data.items : FALLBACK;
      saveCache(list);
      setItems(list);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      9000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items]);

  const lightCfg = LIGHT_THEME_CONFIG[accentColor] ?? LIGHT_THEME_CONFIG.mint!;

  const [customBg, setCustomBg] = useState<string | null>(() =>
    localStorage.getItem("hero_custom_bg"),
  );
  const [customBgLight, setCustomBgLight] = useState<string | null>(() =>
    localStorage.getItem("hero_custom_bg_light"),
  );

  useEffect(() => {
    const handler = (e: Event) => {
      setCustomBg((e as CustomEvent).detail as string | null);
    };
    const handlerLight = (e: Event) => {
      setCustomBgLight((e as CustomEvent).detail as string | null);
    };
    window.addEventListener("hero-bg-changed", handler);
    window.addEventListener("hero-bg-light-changed", handlerLight);
    return () => {
      window.removeEventListener("hero-bg-changed", handler);
      window.removeEventListener("hero-bg-light-changed", handlerLight);
    };
  }, []);

  const topLineColor =
    "linear-gradient(to right, transparent 0%, rgba(212,175,55,0.8) 30%, rgba(212,175,55,0.8) 70%, transparent 100%)";

  // Orbit ring diameter for CSS decoration
  const ringSize = ORBIT_RADIUS * 2 + BUBBLE_SIZE;
  // Container height: orbit needs radius+bubble/2 above and below logo center
  const orbitContainerH = (ORBIT_RADIUS + BUBBLE_SIZE / 2) * 2 + 8;

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{
        minHeight: orbiting ? 340 : 278,
        transition: "min-height 0.48s cubic-bezier(0.34,1.26,0.64,1)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
      }}
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? customBg
              ? `url(${customBg})`
              : "url('/images/hero-bg.jpg')"
            : customBgLight
              ? `url(${customBgLight})`
              : "url('/images/hero-bg-light.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          filter: isDark
            ? customBg
              ? "brightness(0.88) saturate(1.05)"
              : "brightness(0.92) saturate(1.1)"
            : customBgLight
              ? "brightness(0.92) saturate(1.05)"
              : (LIGHT_HERO_FILTER[accentColor] ??
                LIGHT_HERO_FILTER["forest"]!),
        }}
      />
      {/* Overlay — tinted to match theme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "rgba(2, 22, 12, 0.48)"
            : "linear-gradient(160deg, rgba(210,240,225,0.55) 0%, rgba(180,220,200,0.35) 50%, rgba(200,235,215,0.45) 100%)",
        }}
      />
      {/* Bottom fade to page background — matches both light and dark */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
        style={{ background: topLineColor }}
      />
      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center px-5 pl-[15px] pt-[0px] pb-[100px]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 100%)",
        }}
      >
        {/* ── Orbital logo section ──
            Strategy: the logo wrapper is in normal flex flow (naturally centered
            by items-center). Orbit ring & bubbles are absolute children of the
            wrapper, anchored at the logo center (50px from wrapper left/top).
            Wrapper height expands when orbiting to create vertical space; the
            hero's overflow:hidden is relaxed to visible during orbit so elements
            above the hero don't get cut off.
        ── */}
        <div
          className="relative"
          style={{
            width: 200,
            height: 200,
            marginTop: orbiting ? ORBIT_RADIUS + BUBBLE_SIZE / 2 - 100 : -18,
            marginBottom: orbiting
              ? ORBIT_RADIUS + BUBBLE_SIZE / 2 - 100 + 0
              : 0,
            transition: "margin 0.48s cubic-bezier(0.34,1.26,0.64,1)",
          }}
        >
          {/* ── Orbit ring + bubbles (centered on logo center = 50,50) ── */}
          <AnimatePresence>
            {orbiting && (
              <>
                {/* Dashed orbit ring */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: ringSize,
                    height: ringSize,
                    top: 100 - ringSize / 2,
                    left: 100 - ringSize / 2,
                    border: isDark
                      ? "1px dashed rgba(251,191,36,0.26)"
                      : `1px dashed ${lightCfg.cardBorder}`,
                  }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                />

                {/* Inner glow ring */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: ringSize - 24,
                    height: ringSize - 24,
                    top: 100 - (ringSize - 24) / 2,
                    left: 100 - (ringSize - 24) / 2,
                    border: isDark
                      ? "1px solid rgba(96,165,250,0.08)"
                      : `1px solid ${lightCfg.glowColor}`,
                  }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.06, ease: "backOut" }}
                />

                {/* Rotating bubbles — origin at logo center (100, 100) */}
                <motion.div
                  style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    top: 100,
                    left: 100,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 42,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {ORBITAL_SECTIONS.map((section, i) => {
                    const angle = (i / ORBITAL_SECTIONS.length) * Math.PI * 2;
                    const x = ORBIT_RADIUS * Math.sin(angle);
                    const y = -ORBIT_RADIUS * Math.cos(angle);
                    const half = BUBBLE_SIZE / 2;

                    // outward direction in upright (counter-rotated) frame
                    const outX = Math.sin(angle);
                    const outY = -Math.cos(angle);
                    // label position: center is at (half + outX*dist, half + outY*dist)
                    const labelDist = half + 10;
                    const labelCX = half + outX * labelDist;
                    const labelCY = half + outY * labelDist;
                    const shortLabel = getShortLabel(section.label);

                    return (
                      <motion.div
                        key={section.id}
                        style={{
                          position: "absolute",
                          left: x - half,
                          top: y - half,
                          width: BUBBLE_SIZE,
                          height: BUBBLE_SIZE,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, rotate: -360 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          scale: {
                            type: "spring",
                            stiffness: 300,
                            damping: 22,
                            delay: i * 0.038,
                          },
                          opacity: { duration: 0.2, delay: i * 0.038 },
                          rotate: {
                            duration: 42,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                      >
                        <button
                          onClick={() => {
                            navigate(section.href);
                            setOrbiting(false);
                          }}
                          className="w-full h-full rounded-full flex flex-col items-center justify-center gap-[4px] cursor-pointer"
                          style={{
                            background: isDark
                              ? `radial-gradient(circle at 38% 32%, ${section.bg}, rgba(6,12,30,0.9))`
                              : `radial-gradient(circle at 38% 32%, ${section.bg}, rgba(255,255,255,0.92))`,
                            border: `1.5px solid ${section.color}55`,
                            boxShadow: isDark
                              ? `0 0 16px ${section.color}28, 0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)`
                              : `0 0 12px ${section.color}20, 0 3px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.95)`,
                            backdropFilter: "blur(4px)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="absolute top-0 inset-x-0 h-px pointer-events-none"
                            style={{
                              background: `linear-gradient(to right, transparent, ${section.color}70, transparent)`,
                            }}
                          />
                          <section.Icon
                            size={18}
                            style={{
                              color: section.color,
                              filter: `drop-shadow(0 0 4px ${section.color}60)`,
                            }}
                          />
                        </button>

                        {/* ── Section label floating outside bubble ── */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ delay: i * 0.038 + 0.15, duration: 0.25 }}
                          style={{
                            position: "absolute",
                            left: labelCX,
                            top: labelCY,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            zIndex: 5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            dir="rtl"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                              color: isDark ? "rgba(255,255,255,0.92)" : "rgba(15,15,25,0.85)",
                              background: isDark
                                ? `linear-gradient(135deg, rgba(6,12,30,0.82) 0%, rgba(20,30,60,0.78) 100%)`
                                : `linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(240,248,255,0.82) 100%)`,
                              border: `1px solid ${section.color}44`,
                              borderRadius: 20,
                              padding: "2px 7px 2px 5px",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                              boxShadow: isDark
                                ? `0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
                                : `0 2px 8px rgba(80,120,200,0.14), inset 0 1px 0 rgba(255,255,255,0.95)`,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: section.color,
                                boxShadow: `0 0 4px ${section.color}88`,
                                flexShrink: 0,
                              }}
                            />
                            {shortLabel}
                          </span>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Logo button (always in place, z-index above orbits) ── */}
          <motion.button
            className="w-full h-full focus:outline-none relative flex items-center justify-center mt-[0px] mb-[0px]"
            style={{ zIndex: 10, background: "none", border: "none" }}
            onClick={() => setOrbiting((v) => !v)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            aria-label={orbiting ? "إغلاق قائمة الأقسام" : "فتح قائمة الأقسام"}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: "backOut", delay: 0.1 }}
          >
            {/* ── Logo image — crystal glass effect when orbiting ── */}
            <motion.div
              animate={orbiting ? {
                scale: [1, 1.04, 1],
              } : { scale: 1 }}
              transition={{ duration: 2.4, repeat: orbiting ? Infinity : 0, ease: "easeInOut" }}
              style={{
                position: "relative",
                width: 140,
                height: 140,
                marginTop: orbiting ? 0 : 10,
                marginLeft: 4,
                marginRight: -4,
                transition: "margin-top 0.48s cubic-bezier(0.34,1.26,0.64,1)",
                borderRadius: orbiting ? "50%" : "30%",
                overflow: "hidden",
                backdropFilter: orbiting ? "blur(10px) saturate(1.6)" : "none",
                WebkitBackdropFilter: orbiting ? "blur(10px) saturate(1.6)" : "none",
                background: orbiting
                  ? isDark
                    ? "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.22) 0%, rgba(180,220,255,0.10) 45%, rgba(100,160,230,0.08) 100%)"
                    : "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55) 0%, rgba(200,230,255,0.28) 45%, rgba(160,200,240,0.15) 100%)"
                  : "transparent",
                boxShadow: orbiting
                  ? isDark
                    ? "0 0 0 1.5px rgba(255,255,255,0.18), 0 0 0 3px rgba(147,197,253,0.12), 0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(147,197,253,0.12)"
                    : "0 0 0 1.5px rgba(255,255,255,0.75), 0 0 0 3px rgba(160,200,255,0.25), 0 8px 28px rgba(80,130,200,0.22), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(160,200,255,0.3)"
                  : "none",
              }}
            >
              <img
                src="/images/logo.png"
                alt="دليل التوبة"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 2,
                  transition: "filter 0.4s ease",
                  filter: orbiting
                    ? isDark
                      ? "drop-shadow(0 0 14px rgba(147,197,253,0.5)) brightness(1.08) saturate(0.85)"
                      : "drop-shadow(0 0 12px rgba(100,160,240,0.4)) brightness(1.05) saturate(0.75)"
                    : isDark
                      ? "drop-shadow(3px 8px 22px rgba(0,0,0,0.88)) drop-shadow(1px 3px 7px rgba(0,0,0,0.60))"
                      : `saturate(0.7) brightness(0.88) ${LIGHT_LOGO_SHADOW[accentColor] ?? LIGHT_LOGO_SHADOW["forest"]!}`,
                }}
              />
              {/* Crystal shimmer overlay — only when orbiting */}
              {orbiting && (
                <>
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: isDark
                        ? "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 40%, rgba(147,197,253,0.08) 80%, transparent 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 40%, rgba(200,230,255,0.2) 80%, transparent 100%)",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    style={{
                      position: "absolute",
                      top: "8%",
                      left: "12%",
                      width: "32%",
                      height: "18%",
                      borderRadius: "50%",
                      background: isDark
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.65)",
                      filter: "blur(4px)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </>
              )}
            </motion.div>
          </motion.button>
        </div>
        {/* /logo wrapper */}

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: orbiting ? 0.35 : 1,
            y: 0,
            filter: orbiting ? "blur(4px)" : "blur(0px)",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="text-[17px] font-bold tracking-widest mb-1 text-[#facd70] mt-[-27px]"
          style={
            isDark
              ? {
                  color: "#f5c842",
                  textShadow:
                    "0 0 24px rgba(251,191,36,0.45), 0 0 60px rgba(251,191,36,0.18)",
                  letterSpacing: "0.06em",
                }
              : {
                  color: lightCfg.textColor,
                  textShadow: `0 1px 8px ${lightCfg.glowColor}`,
                  letterSpacing: "0.06em",
                }
          }
        >
          دليل التوبة النصوح
        </motion.h1>

        {/* Tap hint */}
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{
            opacity: orbiting ? 0.4 : 1,
            y: 0,
            filter: orbiting ? "blur(3px)" : "blur(0px)",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="text-[10px] tracking-wide text-[#f2b233]"
          style={{
            color: isDark ? "rgba(147,197,253,0.55)" : lightCfg.subColor,
          }}
        >
          {orbiting
            ? "اضغط على قسم للانتقال إليه ✦"
            : "اضغط على الشعار لاستعراض الأقسام ✦"}
        </motion.p>
      </div>
    </div>
  );
}

// ── Preserved (hidden) content card ─────────────────────────────────────────
interface ContentCardProps {
  item: HeroItem | null;
  meta: (typeof TYPE_META)[HeroItem["type"]] | null;
  loading: boolean;
  items: HeroItem[];
  idx: number;
  goNext: () => void;
  goPrev: () => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  isDark: boolean;
  lightCfg: (typeof LIGHT_THEME_CONFIG)[string];
}

function TypingText({
  text,
  type,
  textColor,
}: {
  text: string;
  type: HeroItem["type"];
  textColor: string;
}) {
  const fullText =
    type === "ayah" ? (text.startsWith("﴿") ? text : `﴿${text}﴾`) : text;
  const { displayed, done } = useTypingText(fullText, 22);
  return (
    <p
      className="text-[13px] leading-[1.9] font-medium text-center"
      style={{ color: textColor }}
      dir="rtl"
    >
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: textColor, opacity: 0.7 }}
        >
          |
        </motion.span>
      )}
    </p>
  );
}

function ContentCard({
  item,
  meta,
  loading,
  items,
  idx,
  goNext,
  goPrev,
  timerRef,
  isDark,
  lightCfg,
}: ContentCardProps) {
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : lightCfg.cardBg;
  const cardBorder = isDark ? "rgba(251,191,36,0.16)" : lightCfg.cardBorder;
  const headerBg = isDark
    ? "linear-gradient(to right, rgba(251,191,36,0.05), transparent)"
    : `linear-gradient(to right, ${lightCfg.glowColor}, transparent)`;
  const headerBorder = isDark ? "rgba(251,191,36,0.1)" : lightCfg.cardBorder;
  const labelColor = isDark ? "rgba(251,191,36,0.85)" : lightCfg.textColor;
  const subColor = isDark ? "rgba(200,230,215,0.5)" : lightCfg.subColor;
  const textColor = isDark ? "rgba(240,255,245,0.92)" : lightCfg.textColor;
  const dotActive = isDark ? "#fbbf24" : lightCfg.textColor;
  const dotInactive = isDark ? "rgba(251,191,36,0.18)" : lightCfg.cardBorder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="w-full max-w-sm"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            borderBottom: `1px solid ${headerBorder}`,
            background: headerBg,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {meta ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.icon}
                {meta.label}
              </span>
            ) : (
              <Sparkles size={12} style={{ color: labelColor }} />
            )}
            {item?.source && (
              <span
                className="text-[10px] truncate"
                style={{ color: subColor }}
              >
                {item.source}
              </span>
            )}
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: labelColor, background: headerBorder }}
                aria-label="السابق"
              >
                <ChevronRight size={13} />
              </button>
              <span
                className="text-[10px] tabular-nums"
                style={{ color: subColor }}
              >
                {idx + 1}/{items.length}
              </span>
              <button
                onClick={goNext}
                className="w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: labelColor, background: headerBorder }}
                aria-label="التالي"
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="h-[2px] w-full" style={{ background: dotInactive }}>
          <motion.div
            key={idx}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 9, ease: "linear" }}
            className="h-full origin-right"
            style={{ background: dotActive, opacity: 0.7 }}
          />
        </div>
        <div className="min-h-[82px] px-4 py-3.5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2.5 h-full py-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ color: labelColor }}
                >
                  <Sparkles size={13} />
                </motion.div>
                <p className="text-[12px]" style={{ color: subColor }}>
                  زكي يُعد محتوى اليوم...
                </p>
              </motion.div>
            ) : item ? (
              <motion.div
                key={`item-${idx}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <TypingText
                  text={item.text}
                  type={item.type}
                  textColor={textColor}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 18 : 5,
                  height: 5,
                  background: i === idx ? dotActive : dotInactive,
                }}
                aria-label={`الانتقال إلى ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
