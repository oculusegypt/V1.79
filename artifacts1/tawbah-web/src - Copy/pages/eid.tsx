import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  MapPin, Clock, ArrowLeft, ChevronRight, Navigation, Share2,
  Star, RefreshCw, Globe, Users, Bell, Heart, Sparkles,
} from "lucide-react";
import {
  getEidStatus, EID_FITR_INSTRUCTIONS, EID_ADHA_INSTRUCTIONS, COUNTRY_GUIDELINES,
  type EidType, type EidPeriod,
} from "@/lib/eid-utils";

const EID_FITR_GREETINGS = [
  "عيد فطر مبارك 🌙✨",
  "تقبّل الله منا ومنكم 🤲",
  "كل عام وأنتم بخير",
  "أعادك الله بالصحة والإيمان",
];

const EID_ADHA_GREETINGS = [
  "عيد أضحى مبارك 🐑✨",
  "تقبّل الله منا ومنكم 🤲",
  "وأنتم بخير من العائدين الفائزين",
  "أيامٌ بيضاء مباركات",
];

const PRE_FITR_MESSAGES = [
  { icon: "🌙", title: "رمضان يودّعنا", body: "اغتنم آخر ساعاته بالاستغفار والتوبة. ليلة آخر رمضان قد تكون ليلة القدر." },
  { icon: "💰", title: "زكاة الفطر تجب الآن", body: "أخرج زكاة الفطر قبل صلاة العيد — صاع من غالب قوت البلد لكل فرد في البيت." },
  { icon: "📢", title: "ابدأ التكبير الآن", body: "«الله أكبر الله أكبر لا إله إلا الله، الله أكبر الله أكبر ولله الحمد»" },
];

const PRE_ADHA_MESSAGES = [
  { icon: "⭐", title: "أفضل أيام السنة", body: "العشر من ذي الحجة — فيها يوم عرفة. أكثر من الصيام والذكر والاستغفار." },
  { icon: "🐑", title: "الأضحية", body: "ابحث الآن عن أضحيتك إن كنت تعتزم — تُذبح بعد صلاة العيد مباشرة." },
  { icon: "📢", title: "التكبير المطلق", body: "كبِّر في كل وقت من أول ذي الحجة حتى آخر أيام التشريق." },
];

interface PrayerInfo {
  time: string | null;
  loading: boolean;
  error: boolean;
}

interface Mosque {
  id: number;
  name: string;
  distance: number;
  lat: number;
  lon: number;
}

interface GeoPos { lat: number; lon: number; country?: string; city?: string }

async function reverseGeocode(lat: number, lon: number) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar`,
      { headers: { "Accept-Language": "ar" } }
    );
    const d = await r.json();
    return {
      country: d.address?.country_code?.toUpperCase() ?? null,
      city: d.address?.city || d.address?.town || d.address?.village || null,
    };
  } catch {
    return { country: null, city: null };
  }
}

async function fetchEidPrayerTime(lat: number, lon: number): Promise<string | null> {
  try {
    const now = new Date();
    const date = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    const r = await fetch(
      `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=2`
    );
    const d = await r.json();
    return d.data?.timings?.Fajr ?? null;
  } catch {
    return null;
  }
}

async function fetchNearbyMosques(lat: number, lon: number): Promise<Mosque[]> {
  const radius = 3000;
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
    );
    out center 12;
  `;
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    const d = await r.json();
    return (d.elements ?? [])
      .map((el: any) => {
        const lat2 = el.lat ?? el.center?.lat;
        const lon2 = el.lon ?? el.center?.lon;
        if (!lat2 || !lon2) return null;
        const dx = (lat2 - lat) * 111320;
        const dy = (lon2 - lon) * 111320 * Math.cos((lat * Math.PI) / 180);
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
        return {
          id: el.id,
          name: el.tags?.name || el.tags?.["name:ar"] || "مسجد",
          distance: dist,
          lat: lat2,
          lon: lon2,
        };
      })
      .filter(Boolean)
      .sort((a: Mosque, b: Mosque) => a.distance - b.distance)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function formatDist(m: number) {
  if (m < 1000) return `${m} م`;
  return `${(m / 1000).toFixed(1)} كم`;
}

function CountdownTimer({ targetDate }: { targetDate: Date | null }) {
  const [diff, setDiff] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const ms = targetDate.getTime() - Date.now();
      if (ms <= 0) { setDiff({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const s = Math.floor(ms / 1000);
      setDiff({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!diff || !targetDate) return null;

  return (
    <div className="flex gap-3 justify-center">
      {[
        { v: diff.d, l: "يوم" },
        { v: diff.h, l: "ساعة" },
        { v: diff.m, l: "دقيقة" },
        { v: diff.s, l: "ثانية" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums leading-none">{String(v).padStart(2, "0")}</span>
          <span className="text-[10px] mt-0.5 opacity-70">{l}</span>
        </div>
      ))}
    </div>
  );
}

function EidHeroSection({ eidType, period, daysUntil, eidDay, eidStartDate }: {
  eidType: EidType | null; period: EidPeriod; daysUntil: number | null; eidDay: number | null; eidStartDate: Date | null;
}) {
  const isEid = period === "eid_fitr" || period === "eid_adha";
  const isPre = period === "pre_fitr" || period === "pre_adha_dhul_hijja" || period === "arafah";
  const isAdha = eidType === "adha";

  const bg = isAdha
    ? "from-[#0d3d2e] via-[#0f4f35] to-[#1a6e45]"
    : "from-[#2d1b69] via-[#3730a3] to-[#6d28d9]";

  const accentColor = isAdha ? "#34d399" : "#f59e0b";
  const greetings = isAdha ? EID_ADHA_GREETINGS : EID_FITR_GREETINGS;

  const dayLabel = eidDay === 1 ? "اليوم الأول" : eidDay === 2 ? "اليوم الثاني" : eidDay === 3 ? "اليوم الثالث" : "";

  return (
    <div className={`relative overflow-hidden rounded-b-3xl bg-gradient-to-br ${bg} px-5 pt-10 pb-8`}>
      {/* Islamic geometric pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * 45) * Math.PI / 180;
          const x = 100 + 60 * Math.cos(angle);
          const y = 100 + 60 * Math.sin(angle);
          const pts = Array.from({ length: 8 }, (_, j) => {
            const a = (j * 45 - 90) * Math.PI / 180;
            const r = j % 2 === 0 ? 20 : 8;
            return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
          }).join(" ");
          return <polygon key={i} points={pts} fill="none" stroke="white" strokeWidth="1" />;
        })}
        <polygon points={Array.from({ length: 8 }, (_, j) => {
          const a = (j * 45 - 90) * Math.PI / 180;
          const r = j % 2 === 0 ? 40 : 16;
          return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`;
        }).join(" ")} fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="10" fill="white" opacity="0.5" />
        {[30, 50, 160, 170, 15, 185].map((x, i) => (
          <circle key={i} cx={x} cy={i * 30 + 10} r={1 + (i % 3)} fill="white" opacity="0.4" />
        ))}
      </svg>

      <div className="relative z-10 text-center text-white">
        {/* Stars animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mx-auto mb-4 w-16 h-16 flex items-center justify-center"
          style={{ filter: `drop-shadow(0 0 12px ${accentColor}88)` }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full">
            <polygon
              points={Array.from({ length: 8 }, (_, j) => {
                const a = (j * 45 - 90) * Math.PI / 180;
                const r = j % 2 === 0 ? 28 : 12;
                return `${30 + r * Math.cos(a)},${30 + r * Math.sin(a)}`;
              }).join(" ")}
              fill={accentColor}
              opacity={0.9}
            />
            <polygon
              points={Array.from({ length: 8 }, (_, j) => {
                const a = (j * 45 - 67.5) * Math.PI / 180;
                const r = j % 2 === 0 ? 22 : 9;
                return `${30 + r * Math.cos(a)},${30 + r * Math.sin(a)}`;
              }).join(" ")}
              fill="white"
              opacity={0.15}
            />
            <circle cx="30" cy="30" r="7" fill="white" opacity={0.8} />
          </svg>
        </motion.div>

        {isEid && (
          <>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold mb-1 opacity-70 tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              {isAdha ? "عيد الأضحى المبارك" : "عيد الفطر المبارك"} — {dayLabel}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black mb-1"
            >
              {greetings[0]}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm opacity-80"
            >
              {greetings[1]}
            </motion.p>
          </>
        )}

        {isPre && (
          <>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold mb-2 opacity-70 tracking-widest"
              style={{ color: accentColor }}
            >
              {period === "arafah"
                ? "يوم عرفة — أفضل الأيام 🤲"
                : isAdha
                ? "العشر من ذي الحجة"
                : "قُبيل العيد"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-black mb-2"
            >
              {period === "arafah"
                ? "اللهم اعتق رقبتنا من النار"
                : daysUntil !== null
                ? `${daysUntil === 1 ? "غداً" : `بعد ${daysUntil} أيام`} — العيد قادم`
                : "استعد للعيد"}
            </motion.h1>
            {daysUntil !== null && daysUntil > 0 && eidStartDate && (
              <div className="mt-3 py-3 px-4 rounded-2xl bg-white/10 backdrop-blur">
                <p className="text-[10px] mb-2 opacity-60">العدّ التنازلي لعيد {isAdha ? "الأضحى" : "الفطر"}</p>
                <CountdownTimer targetDate={eidStartDate} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PrayerTimeCard({ pos }: { pos: GeoPos | null }) {
  const [prayer, setPrayer] = useState<PrayerInfo>({ time: null, loading: false, error: false });

  useEffect(() => {
    if (!pos) return;
    setPrayer({ time: null, loading: true, error: false });
    fetchEidPrayerTime(pos.lat, pos.lon).then((t) => {
      if (t) {
        const [hStr, mStr] = t.split(":");
        let h = parseInt(hStr) + 1;
        const m = mStr;
        const ampm = h >= 12 ? "م" : "ص";
        if (h > 12) h -= 12;
        setPrayer({ time: `${h}:${m} ${ampm}`, loading: false, error: false });
      } else {
        setPrayer({ time: null, loading: false, error: true });
      }
    });
  }, [pos]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Clock size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm">موعد صلاة العيد</h3>
          <p className="text-[10px] text-muted-foreground">مُقدَّر بحسب موقعك</p>
        </div>
      </div>

      {!pos && (
        <p className="text-xs text-muted-foreground text-center py-2">
          فعِّل الموقع لمعرفة موعد صلاة العيد في منطقتك
        </p>
      )}
      {pos && prayer.loading && (
        <div className="flex items-center justify-center py-3 gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-xs text-muted-foreground">جارٍ الجلب…</span>
        </div>
      )}
      {pos && prayer.time && (
        <div className="text-center py-1">
          <p className="text-3xl font-black text-amber-600">{prayer.time}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            وقت تقريبي — تحقق من المسجد لتأكيده
          </p>
        </div>
      )}
      {pos && prayer.error && (
        <p className="text-xs text-destructive text-center py-2">تعذّر جلب مواعيد الصلاة — تحقق من الاتصال</p>
      )}
    </div>
  );
}

function NearbyMosquesCard({ pos }: { pos: GeoPos | null }) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = useCallback(async () => {
    if (!pos) return;
    setLoading(true);
    const m = await fetchNearbyMosques(pos.lat, pos.lon);
    setMosques(m);
    setLoading(false);
    setFetched(true);
  }, [pos]);

  useEffect(() => {
    if (pos && !fetched) load();
  }, [pos, fetched, load]);

  const openMap = (m: Mosque) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`, "_blank");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <MapPin size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm">أماكن صلاة العيد القريبة</h3>
            <p className="text-[10px] text-muted-foreground">مساجد ومصليات في نطاق 3 كم</p>
          </div>
        </div>
        {fetched && (
          <button onClick={load} className="text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {!pos && (
        <p className="text-xs text-muted-foreground text-center py-3">
          فعِّل الموقع لاكتشاف المساجد القريبة منك
        </p>
      )}

      {pos && loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {pos && fetched && mosques.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center py-3">
          لم يُعثَر على مساجد قريبة — جرّب البحث يدوياً
        </p>
      )}

      {mosques.length > 0 && (
        <div className="space-y-2">
          {mosques.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openMap(m)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted active:scale-[0.98] transition-all text-right"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <span className="text-sm">🕌</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatDist(m.distance)} منك</p>
              </div>
              <Navigation size={12} className="text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function EidInstructionsCard({ eidType, period }: { eidType: EidType | null; period: EidPeriod }) {
  const [open, setOpen] = useState<number | null>(null);
  const items =
    period === "pre_adha_dhul_hijja" || period === "arafah" || eidType === "adha"
      ? EID_ADHA_INSTRUCTIONS
      : EID_FITR_INSTRUCTIONS;

  const preItems = period === "pre_fitr" ? PRE_FITR_MESSAGES : period === "pre_adha_dhul_hijja" || period === "arafah" ? PRE_ADHA_MESSAGES : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <Sparkles size={16} className="text-violet-600" />
        </div>
        <h3 className="font-bold text-sm">
          {preItems ? "ماذا تفعل الآن؟" : `سنن عيد ${eidType === "adha" ? "الأضحى" : "الفطر"}`}
        </h3>
      </div>

      {preItems && (
        <div className="space-y-2 mb-4">
          {preItems.map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/60">
              <span className="text-lg shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-bold">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-right"
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="flex-1 text-xs font-bold">{item.title}</span>
              <ChevronRight
                size={14}
                className={`text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-90" : ""}`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-muted-foreground leading-relaxed px-4 pt-1 pb-3" dir="rtl">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountryGuideCard({ countryCode }: { countryCode: string | null }) {
  const guide = countryCode ? COUNTRY_GUIDELINES[countryCode] : null;
  const [showAll, setShowAll] = useState(false);
  const countries = Object.entries(COUNTRY_GUIDELINES);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center">
          <Globe size={16} className="text-sky-600" />
        </div>
        <h3 className="font-bold text-sm">إرشادات حسب بلدك</h3>
      </div>

      {guide && (
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/25 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{guide.flag}</span>
            <span className="font-bold text-sm">{guide.name}</span>
            <span className="text-[10px] text-muted-foreground mr-auto">موقعك الحالي</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{guide.tip}</p>
        </div>
      )}

      <div className="space-y-1.5">
        {(showAll ? countries : countries.slice(0, 4)).map(([code, g]) => (
          <div key={code} className={`flex gap-3 p-2.5 rounded-xl ${code === countryCode ? "bg-sky-500/10" : "bg-muted/50"}`}>
            <span className="text-base shrink-0">{g.flag}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold">{g.name}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{g.tip}</p>
            </div>
          </div>
        ))}
      </div>

      {countries.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full text-[11px] text-primary font-bold py-2 rounded-xl hover:bg-primary/5 transition-colors"
        >
          {showAll ? "أقل" : `عرض ${countries.length - 4} دول أخرى`}
        </button>
      )}
    </div>
  );
}

function CommunityGreetingCard({ eidType }: { eidType: EidType | null }) {
  const storageKey = `eid_greetings_${eidType}_2026`;
  const [greetings, setGreetings] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setGreetings(stored);
    } catch {}
  }, [storageKey]);

  const builtInGreetings = eidType === "adha"
    ? ["عيد أضحى مبارك من الجزائر 🇩🇿", "تقبّل الله منا ومنكم الطاعات 🤲", "أيامٌ مباركة من مصر 🇪🇬", "كل عام وأنتم أقرب إلى الله 🌿"]
    : ["عيد فطر مبارك من تركيا 🇹🇷", "تقبّل الله صيامنا وقيامنا 🤲", "رمضان ودّع — العيد أقبل 🌙", "كل عام وأنتم بخير من ماليزيا 🇲🇾"];

  const allGreetings = [...builtInGreetings, ...greetings].slice(-12);

  const handleSend = () => {
    if (!input.trim() || sent) return;
    const newList = [...greetings, input.trim()];
    setGreetings(newList);
    try { localStorage.setItem(storageKey, JSON.stringify(newList)); } catch {}
    setSent(true);
    setInput("");
    setTimeout(() => setSent(false), 3000);
  };

  const handleShare = async () => {
    const text = eidType === "adha" ? "عيد أضحى مبارك 🐑✨ — تقبّل الله منا ومنكم" : "عيد فطر مبارك 🌙✨ — تقبّل الله منا ومنكم";
    if (navigator.share) {
      try { await navigator.share({ title: "تهنئة العيد", text }); } catch {}
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <Users size={16} className="text-rose-600" />
          </div>
          <h3 className="font-bold text-sm">جدار التهاني المجتمعي</h3>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[11px] font-bold text-primary px-2.5 py-1.5 rounded-xl bg-primary/10"
        >
          <Share2 size={12} />
          شارك
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 snap-x">
        {allGreetings.map((g, i) => (
          <div
            key={i}
            className="shrink-0 snap-start bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 rounded-2xl px-4 py-3 text-center w-48"
          >
            <p className="text-[11px] font-medium leading-relaxed">{g}</p>
            <Heart size={10} className="text-rose-400 mx-auto mt-1.5" />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="أضف تهنئتك هنا…"
          className="flex-1 text-xs bg-muted border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-right"
          dir="rtl"
          maxLength={80}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          {sent ? "✓" : "أرسل"}
        </button>
      </div>
    </div>
  );
}

function LocationGateCard({ onGrant }: { onGrant: (pos: GeoPos) => void }) {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const request = async () => {
    setLoading(true);
    setDenied(false);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const geo = await reverseGeocode(lat, lon);
      onGrant({ lat, lon, country: geo.country ?? undefined, city: geo.city ?? undefined });
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
        <Navigation size={22} className="text-emerald-600" />
      </div>
      <h3 className="font-bold text-sm mb-1">اكتشف مساجد العيد بالقرب منك</h3>
      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
        نستخدم موقعك فقط لعرض أوقات الصلاة والمساجد القريبة — لا يُحفَظ أي بيانات
      </p>
      {denied && <p className="text-xs text-destructive mb-2">لم نتمكن من الوصول للموقع — تحقق من صلاحيات المتصفح</p>}
      <button
        onClick={request}
        disabled={loading}
        className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-60"
      >
        {loading
          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> جارٍ التحديد…</>
          : <><MapPin size={15} /> تحديد موقعي</>
        }
      </button>
    </div>
  );
}

export default function EidPage() {
  const status = getEidStatus();
  const [pos, setPos] = useState<GeoPos | null>(null);
  const [locationAsked, setLocationAsked] = useState(false);

  const { period, eidType, daysUntilEid, eidDay, eidStartDate } = status;

  const isEidOrPre = period !== "none";
  const upcomingType: EidType = eidType ?? "fitr";
  const accentColor = upcomingType === "adha" ? "text-emerald-600" : "text-violet-600";
  const accentBg = upcomingType === "adha" ? "bg-emerald-500/15" : "bg-violet-500/15";

  const handlePos = (p: GeoPos) => {
    setPos(p);
    setLocationAsked(true);
  };

  const nextEidLabel = upcomingType === "adha" ? "عيد الأضحى" : "عيد الفطر";

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Hero */}
      <EidHeroSection
        eidType={eidType ?? upcomingType}
        period={period === "none" ? (upcomingType === "adha" ? "eid_adha" : "eid_fitr") : period}
        daysUntil={daysUntilEid}
        eidDay={eidDay}
        eidStartDate={eidStartDate}
      />

      {/* If not in Eid period: show upcoming countdown */}
      {period === "none" && daysUntilEid !== null && (
        <div className="mx-5 -mt-4 mb-4 relative z-10">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">أقرب عيد قادم — {nextEidLabel}</p>
            <CountdownTimer targetDate={eidStartDate} />
            <p className="text-[10px] text-muted-foreground mt-2">هيّئ نفسك روحياً من الآن</p>
          </div>
        </div>
      )}

      <div className="px-5 mt-4 flex flex-col gap-4 relative z-10">

        {/* Takbeer Card — special for Eid days */}
        {(period === "eid_fitr" || period === "eid_adha") && (
          <TakbeerCard eidType={eidType!} />
        )}

        {/* Prayer time */}
        {(locationAsked || pos) ? (
          <PrayerTimeCard pos={pos} />
        ) : (
          <LocationGateCard onGrant={handlePos} />
        )}

        {/* Nearby mosques — shown after location granted */}
        {pos && <NearbyMosquesCard pos={pos} />}

        {/* Instructions */}
        <EidInstructionsCard eidType={eidType ?? upcomingType} period={period} />

        {/* Community greeting wall */}
        {(period === "eid_fitr" || period === "eid_adha" || period === "pre_fitr") && (
          <CommunityGreetingCard eidType={eidType ?? upcomingType} />
        )}

        {/* Country guide */}
        <CountryGuideCard countryCode={pos?.country ?? null} />

        {/* Navigate back */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={15} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

function TakbeerCard({ eidType }: { eidType: EidType }) {
  const key = `takbeer_count_${eidType}_2026`;
  const [count, setCount] = useState(() => {
    try { return parseInt(localStorage.getItem(key) || "0"); } catch { return 0; }
  });

  const tap = () => {
    const next = count + 1;
    setCount(next);
    try { localStorage.setItem(key, String(next)); } catch {}
  };

  const isAdha = eidType === "adha";
  const color = isAdha ? "#10b981" : "#7c3aed";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
      <p className="text-[10px] text-muted-foreground mb-1">عداد التكبير الجماعي</p>
      <p className="text-[11px] font-bold mb-3 leading-relaxed" style={{ color }}>
        «الله أكبر الله أكبر لا إله إلا الله، الله أكبر الله أكبر ولله الحمد»
      </p>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={tap}
        className="w-24 h-24 rounded-full mx-auto flex flex-col items-center justify-center shadow-lg active:shadow-md transition-shadow"
        style={{ background: `radial-gradient(circle, ${color}22, ${color}11)`, border: `2px solid ${color}44` }}
      >
        <span className="text-2xl font-black" style={{ color }}>{count.toLocaleString("ar-EG")}</span>
        <span className="text-[10px] mt-0.5" style={{ color }}>اضغط لتكبّر</span>
      </motion.button>
      <p className="text-[10px] text-muted-foreground mt-3">
        كبِّر معنا — كل ضغطة تكبيرة مباركة
      </p>
    </div>
  );
}
