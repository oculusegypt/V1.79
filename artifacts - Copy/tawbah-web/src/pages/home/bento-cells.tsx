import { useState, useEffect } from "react";
import { BookMarked } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type BentoRipple = { id: string; x: number; y: number };

// ─── Constants ────────────────────────────────────────────────────────────────

export const BENTO_VERSES = [
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

// ─── Qibla + Prayer ───────────────────────────────────────────────────────────

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

export function useQiblaAndPrayer() {
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

// ─── StarDots ─────────────────────────────────────────────────────────────────

export function StarDots() {
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

// ─── BentoCompassWidget ───────────────────────────────────────────────────────

export function BentoCompassWidget() {
  const { needleRotation, nextPrayer, qibla, permDenied } = useQiblaAndPrayer();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  useEffect(() => {
    const t = setInterval(() => {}, 60_000);
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
              style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#065f46" }}
            >
              القبلة {Math.round(qibla!)}°
            </p>
            {nextPrayer ? (
              <p
                className="text-[8px] leading-tight mt-0.5"
                style={{ color: isDark ? "rgba(255,200,80,0.8)" : "#b45309" }}
              >
                {nextPrayer.name} {nextPrayer.time}
              </p>
            ) : (
              <p
                className="text-[8px] leading-tight"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(5,150,105,0.5)" }}
              >
                جاري الحساب…
              </p>
            )}
          </>
        ) : permDenied ? (
          <>
            <p
              className="text-[9.5px] font-bold"
              style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#065f46" }}
            >
              القبلة
            </p>
            <p
              className="text-[8px]"
              style={{ color: isDark ? "rgba(255,100,100,0.6)" : "#dc2626" }}
            >
              الموقع مرفوض
            </p>
          </>
        ) : (
          <>
            <p
              className="text-[9.5px] font-bold"
              style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#065f46" }}
            >
              القبلة
            </p>
            <p
              className="text-[8px]"
              style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(5,150,105,0.5)" }}
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
            ? isDark
              ? "linear-gradient(135deg, rgba(200,168,75,0.2) 0%, rgba(255,255,255,0.06) 100%)"
              : "linear-gradient(135deg, rgba(5,150,105,0.16) 0%, rgba(16,185,129,0.08) 100%)"
            : isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(5,150,105,0.08)",
          border: hasLocation
            ? isDark
              ? "1px solid rgba(200,168,75,0.45)"
              : "1px solid rgba(5,150,105,0.32)"
            : isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(5,150,105,0.18)",
        }}
      >
        {hasLocation && (
          <>
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 w-[2px] h-[4px] rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.25)" : "rgba(6,95,70,0.35)" }}
            />
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-[4px] rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(6,95,70,0.25)" }}
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
              <polygon points="14,3 16,13 12,13" fill={isDark ? "#c8a84b" : "#059669"} />
              <polygon
                points="14,25 16,15 12,15"
                fill={isDark ? "rgba(255,255,255,0.25)" : "rgba(6,95,70,0.28)"}
              />
              <circle cx="14" cy="14" r="2" fill={isDark ? "rgba(255,255,255,0.6)" : "rgba(6,95,70,0.55)"} />
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

// ─── DhikrCounterCell ─────────────────────────────────────────────────────────

export function DhikrCounterCell() {
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

// ─── VerseCellBento ───────────────────────────────────────────────────────────

export function VerseCellBento() {
  const [idx, setIdx] = useState(0);
  const { theme } = useSettings();
  const isDark = theme === "dark";
  
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
        background: isDark
          ? "linear-gradient(145deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.06) 100%)"
          : "linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.08) 100%)",
        border: isDark ? "1px solid rgba(16,185,129,0.24)" : "1px solid rgba(5,150,105,0.25)",
        minHeight: 68,
      }}
    >
      <div
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: isDark ? "rgba(16,185,129,0.22)" : "rgba(5,150,105,0.2)" }}
      >
        <BookMarked size={12} style={{ color: isDark ? "#10b981" : "#059669" }} />
      </div>
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="font-bold leading-relaxed text-center"
            style={{
              color: isDark ? "rgba(255,255,255,0.9)" : "#064e3b",
              fontFamily: "'Amiri Quran', serif",
              fontSize: 12,
            }}
          >
            ﴿{v.text}﴾
          </motion.p>
        </AnimatePresence>
        <p
          className="text-[9px] text-center mt-0.5"
          style={{ color: isDark ? "rgba(16,185,129,0.75)" : "#065f46" }}
        >
          {v.ref}
        </p>
      </div>
    </div>
  );
}

// ─── LiveCounterCellBento ─────────────────────────────────────────────────────

export function LiveCounterCellBento() {
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

// ─── SecretOfTheDayCellBento ──────────────────────────────────────────────────

export function SecretOfTheDayCellBento() {
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
