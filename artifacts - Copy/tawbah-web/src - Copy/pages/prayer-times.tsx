import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, MapPin, RefreshCw, Moon, Sun, Sunset, Sunrise } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useNotifications } from "@/context/NotificationsContext";
import { isNativeApp } from "@/lib/api-base";

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerInfo {
  key: keyof PrayerTimings;
  nameAr: string;
  dhikrBefore: string;
  icon: React.ReactNode;
  color: string;
}

const PRAYERS: PrayerInfo[] = [
  {
    key: "Fajr",
    nameAr: "الفجر",
    dhikrBefore: "الوقت الذهبي للاستغفار — قبل الفجر بـ١٠ دقائق",
    icon: <Moon size={18} />,
    color: "from-indigo-500/20 to-violet-500/10 border-indigo-400/20",
  },
  {
    key: "Sunrise",
    nameAr: "الشروق",
    dhikrBefore: "وقت صلاة الضحى وذكر الصباح",
    icon: <Sunrise size={18} />,
    color: "from-amber-500/20 to-yellow-500/10 border-amber-400/20",
  },
  {
    key: "Dhuhr",
    nameAr: "الظهر",
    dhikrBefore: "صلِّ ركعتَي السنة ثم اذكر الله",
    icon: <Sun size={18} />,
    color: "from-orange-500/20 to-amber-500/10 border-orange-400/20",
  },
  {
    key: "Asr",
    nameAr: "العصر",
    dhikrBefore: "ذكر العصر — لا تفوّته",
    icon: <Sunset size={18} />,
    color: "from-sky-500/20 to-blue-500/10 border-sky-400/20",
  },
  {
    key: "Maghrib",
    nameAr: "المغرب",
    dhikrBefore: "أذكار المساء — ابدأ فور الأذان",
    icon: <Moon size={18} />,
    color: "from-rose-500/20 to-pink-500/10 border-rose-400/20",
  },
  {
    key: "Isha",
    nameAr: "العشاء",
    dhikrBefore: "صلاة الوتر — لا تنَم قبلها",
    icon: <Moon size={18} />,
    color: "from-purple-500/20 to-violet-500/10 border-purple-400/20",
  },
];

function toArabicTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${suffix}`;
}

function getNextPrayer(timings: PrayerTimings): string | null {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const p of PRAYERS) {
    const [h, min] = timings[p.key].split(":").map(Number);
    const pMins = h * 60 + min;
    if (pMins > nowMins) return p.key;
  }
  return null;
}

function getMinutesUntil(time24: string): number {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [h, m] = time24.split(":").map(Number);
  const target = h * 60 + m;
  return target - nowMins;
}

function formatCountdown(mins: number): string {
  if (mins <= 0) return "الآن";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h} س ${m} د`;
  return `${m} دقيقة`;
}

function getDayProgress(): number {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, Math.min(1, mins / (24 * 60)));
}

function getSkyColors(): { top: string; bottom: string; sunColor: string; sunGlow: string } {
  const h = new Date().getHours();
  if (h < 4)  return { top: "#0a0520", bottom: "#1a0a3a", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.08)" };
  if (h < 6)  return { top: "#1e1035", bottom: "#4a1d73", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.18)" };
  if (h < 8)  return { top: "#7c2d12", bottom: "#ea580c", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.35)" };
  if (h < 12) return { top: "#1d4ed8", bottom: "#60a5fa", sunColor: "#fde047", sunGlow: "rgba(253,224,71,0.4)" };
  if (h < 13) return { top: "#0c4a6e", bottom: "#0ea5e9", sunColor: "#fde68a", sunGlow: "rgba(253,230,138,0.45)" };
  if (h < 16) return { top: "#78350f", bottom: "#d97706", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.3)" };
  if (h < 19) return { top: "#4c1d95", bottom: "#b45309", sunColor: "#fb923c", sunGlow: "rgba(251,146,60,0.35)" };
  return { top: "#0f172a", bottom: "#1e1b4b", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.08)" };
}

function PrayerSkyHeader() {
  const [progress, setProgress] = useState(getDayProgress);
  const sky = getSkyColors();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setProgress(getDayProgress()), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const t = Math.min(progress, 0.98);
  const sunX = 8 + (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * (50 - 8) + t * t * (92 - 8);
  const sunY = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * 10 + t * t * 85;

  const isNight = (() => { const h = new Date().getHours(); return h < 5 || h >= 20; })();

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        height: 140,
        background: `linear-gradient(to bottom, ${sky.top}, ${sky.bottom})`,
        maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
      }}
    >
      {/* Stars for night */}
      {isNight && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none opacity-70">
          {[{cx:15,cy:8,r:0.7},{cx:42,cy:5,r:0.5},{cx:70,cy:12,r:0.6},{cx:88,cy:4,r:0.5},{cx:28,cy:22,r:0.4},{cx:80,cy:28,r:0.7},{cx:55,cy:18,r:0.5}].map((s,i) => (
            <circle key={i} {...s} fill="white" opacity={0.6} />
          ))}
        </svg>
      )}
      {/* Sun arc */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="prayerSunGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d="M 8,85 Q 50,10 92,85" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" strokeDasharray="2,2" />
        {progress < 1 && (
          <>
            <circle cx={sunX} cy={sunY} r="6" fill={sky.sunGlow} filter="url(#prayerSunGlow)" />
            <circle cx={sunX} cy={sunY} r="3.2" fill={sky.sunColor} opacity={0.95} />
            <circle cx={sunX} cy={sunY} r="1.6" fill="white" opacity={0.7} />
          </>
        )}
      </svg>
      {/* Label */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center">
        <span className="text-white/60 text-[11px] font-medium tracking-wide">مسار الشمس اليوم</span>
      </div>
    </div>
  );
}

export default function PrayerTimes() {
  const [, setLocation] = useLocation();
  const { permission, enableNotifications: enableAppNotifications, updateSettings, settings } = useNotifications();
  const native = isNativeApp();
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [city, setCity] = useState(() => localStorage.getItem("prayerCity") || "");
  const [country, setCountry] = useState(() => localStorage.getItem("prayerCountry") || "");
  const [cityInput, setCityInput] = useState(city);
  const [countryInput, setCountryInput] = useState(country);
  const [notifEnabled, setNotifEnabled] = useState(() => settings.enabled);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => native ? permission : "default");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (native) {
      setNotifPermission(permission);
      setNotifEnabled(settings.enabled);
    } else if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, [native, permission, settings.enabled]);

  useEffect(() => {
    if (city && country) fetchTimes(city, country);
  }, []);

  const fetchTimes = async (c: string, cn: string) => {
    if (!c.trim() || !cn.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(c)}&country=${encodeURIComponent(cn)}&method=4`
      );
      if (!res.ok) throw new Error("المدينة غير موجودة");
      const data = await res.json();
      if (data.code !== 200) throw new Error("تعذّر جلب المواقيت");
      const t = data.data.timings as PrayerTimings;
      const cleaned: PrayerTimings = {
        Fajr: t.Fajr.split(" ")[0],
        Sunrise: t.Sunrise.split(" ")[0],
        Dhuhr: t.Dhuhr.split(" ")[0],
        Asr: t.Asr.split(" ")[0],
        Maghrib: t.Maghrib.split(" ")[0],
        Isha: t.Isha.split(" ")[0],
      };
      setTimings(cleaned);
      setCity(c);
      setCountry(cn);
      localStorage.setItem("prayerCity", c);
      localStorage.setItem("prayerCountry", cn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في جلب المواقيت");
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=4`
          );
          const data = await res.json();
          if (data.code !== 200) throw new Error("تعذّر جلب المواقيت");
          const t = data.data.timings as PrayerTimings;
          const cleaned: PrayerTimings = {
            Fajr: t.Fajr.split(" ")[0],
            Sunrise: t.Sunrise.split(" ")[0],
            Dhuhr: t.Dhuhr.split(" ")[0],
            Asr: t.Asr.split(" ")[0],
            Maghrib: t.Maghrib.split(" ")[0],
            Isha: t.Isha.split(" ")[0],
          };
          setTimings(cleaned);
          const loc = data.data.meta?.timezone?.split("/")[1]?.replace("_", " ") || "موقعك";
          setCity(loc);
          setCountry("Auto");
          setCityInput(loc);
          setCountryInput("Auto");
          localStorage.setItem("prayerCity", loc);
          localStorage.setItem("prayerCountry", "Auto");
          localStorage.setItem("prayerLat", String(pos.coords.latitude));
          localStorage.setItem("prayerLng", String(pos.coords.longitude));
          localStorage.removeItem("prayer_timings_cache");
        } catch {
          setError("تعذّر جلب المواقيت");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("رُفض الإذن بالوصول للموقع");
        setLoading(false);
      }
    );
  };

  const enablePrayerReminders = async () => {
    setError("");
    const ok = await enableAppNotifications();
    if (!ok) {
      let details = "";
      try { details = localStorage.getItem("push_last_error") || ""; } catch {}
      setError(details ? `فشل تفعيل الإشعارات: ${details}` : "فشل تفعيل الإشعارات");
      return;
    }
    updateSettings({ enabled: true });
    setNotifEnabled(true);
    setNotifPermission("granted");
  };

  const nextPrayerKey = timings ? getNextPrayer(timings) : null;

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      <PageHeader title="مواقيت الصلاة" subtitle="تذكيرات الصلاة والأذكار الذكية" icon={<Bell size={16} />} />
      {/* Sky header with animated sun arc */}
      <PrayerSkyHeader />

      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">مواقيت الصلاة</h1>
            <p className="text-xs text-muted-foreground">تذكيرات الصلاة والأذكار الذكية</p>
          </div>
        </div>

        {!timings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
          >
            <button
              onClick={handleGeolocate}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              {loading ? "يجري التحديد..." : "حدّد موقعي تلقائياً"}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground">أو أدخل يدوياً</span>
            </div>

            <div className="flex gap-2">
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="المدينة (مثل: Riyadh)"
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
              <input
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="الدولة (مثل: SA)"
                className="w-24 bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => fetchTimes(cityInput, countryInput)}
              disabled={loading || !cityInput.trim() || !countryInput.trim()}
              className="w-full py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm disabled:opacity-40"
            >
              {loading ? "جارٍ البحث..." : "ابحث"}
            </button>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </motion.div>
        )}
      </div>

      {timings && (
        <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{city}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setTimings(null); setCity(""); setCountry(""); }}
                className="text-xs text-primary underline"
              >
                تغيير
              </button>
              <button
                onClick={() => fetchTimes(city, country)}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {nextPrayerKey && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 text-center"
            >
              <p className="text-xs text-muted-foreground mb-1">الصلاة القادمة</p>
              <p className="text-xl font-bold text-foreground">
                {PRAYERS.find(p => p.key === nextPrayerKey)?.nameAr}
              </p>
              <p className="text-sm text-primary font-medium mt-1">
                بعد {formatCountdown(getMinutesUntil(timings[nextPrayerKey as keyof PrayerTimings]))}
              </p>
            </motion.div>
          )}

          <div className="flex flex-col gap-3">
            {PRAYERS.map((p, i) => {
              const mins = getMinutesUntil(timings[p.key]);
              const isPassed = mins < 0;
              const isNext = p.key === nextPrayerKey;
              return (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-gradient-to-br ${p.color} border rounded-xl p-4 transition-all ${
                    isNext ? "shadow-lg shadow-primary/10 scale-[1.01]" : ""
                  } ${isPassed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-background/60 rounded-xl flex items-center justify-center text-foreground">
                        {p.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">{p.nameAr}</p>
                          {isNext && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                              التالية
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {p.dhikrBefore}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-base text-foreground">
                        {toArabicTime(timings[p.key])}
                      </p>
                      {!isPassed && !isNext && (
                        <p className="text-[10px] text-muted-foreground">
                          بعد {formatCountdown(mins)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-2">
            {notifPermission === "granted" && notifEnabled ? (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                <Bell size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">الإشعارات مُفعَّلة ✓</p>
                  <p className="text-xs text-muted-foreground">ستصلك تذكيرات قبل كل صلاة بـ١٠ دقائق</p>
                </div>
              </div>
            ) : notifPermission === "denied" ? (
              <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
                <BellOff size={18} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  الإشعارات محجوبة — فعّلها من إعدادات المتصفح
                </p>
              </div>
            ) : (
              <button
                onClick={enablePrayerReminders}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Bell size={16} />
                فعّل التذكيرات قبل كل صلاة
              </button>
            )}
            {error && <p className="text-xs text-destructive text-center mt-2">{error}</p>}
          </div>

          <div className="text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا﴾
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
