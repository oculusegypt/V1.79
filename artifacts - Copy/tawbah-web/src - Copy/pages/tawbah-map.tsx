import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type CountryEntry = { countryCode: string; count: number };

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  SA: { name: "السعودية", flag: "🇸🇦" },
  EG: { name: "مصر", flag: "🇪🇬" },
  MA: { name: "المغرب", flag: "🇲🇦" },
  DZ: { name: "الجزائر", flag: "🇩🇿" },
  TN: { name: "تونس", flag: "🇹🇳" },
  AE: { name: "الإمارات", flag: "🇦🇪" },
  KW: { name: "الكويت", flag: "🇰🇼" },
  QA: { name: "قطر", flag: "🇶🇦" },
  BH: { name: "البحرين", flag: "🇧🇭" },
  OM: { name: "عُمان", flag: "🇴🇲" },
  JO: { name: "الأردن", flag: "🇯🇴" },
  LB: { name: "لبنان", flag: "🇱🇧" },
  IQ: { name: "العراق", flag: "🇮🇶" },
  SY: { name: "سوريا", flag: "🇸🇾" },
  YE: { name: "اليمن", flag: "🇾🇪" },
  LY: { name: "ليبيا", flag: "🇱🇾" },
  SD: { name: "السودان", flag: "🇸🇩" },
  SO: { name: "الصومال", flag: "🇸🇴" },
  MR: { name: "موريتانيا", flag: "🇲🇷" },
  TR: { name: "تركيا", flag: "🇹🇷" },
  PK: { name: "باكستان", flag: "🇵🇰" },
  ID: { name: "إندونيسيا", flag: "🇮🇩" },
  MY: { name: "ماليزيا", flag: "🇲🇾" },
  NG: { name: "نيجيريا", flag: "🇳🇬" },
  DE: { name: "ألمانيا", flag: "🇩🇪" },
  GB: { name: "المملكة المتحدة", flag: "🇬🇧" },
  US: { name: "الولايات المتحدة", flag: "🇺🇸" },
  CA: { name: "كندا", flag: "🇨🇦" },
  FR: { name: "فرنسا", flag: "🇫🇷" },
  AU: { name: "أستراليا", flag: "🇦🇺" },
  IN: { name: "الهند", flag: "🇮🇳" },
  BD: { name: "بنغلاديش", flag: "🇧🇩" },
};

const COUNTRY_LIST = Object.entries(COUNTRIES)
  .sort((a, b) => a[1].name.localeCompare(b[1].name, "ar"))
  .map(([code, info]) => ({ code, ...info }));

function toArabicNumerals(n: number) {
  return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function guessCountry(): string {
  const lang = navigator.language || "";
  const map: Record<string, string> = {
    "ar-SA": "SA", "ar-EG": "EG", "ar-MA": "MA", "ar-DZ": "DZ",
    "ar-TN": "TN", "ar-AE": "AE", "ar-KW": "KW", "ar-QA": "QA",
    "ar-BH": "BH", "ar-OM": "OM", "ar-JO": "JO", "ar-IQ": "IQ",
    "ar-YE": "YE", "ar-LY": "LY", "ar-SD": "SD", "ar-SY": "SY",
    "tr": "TR", "id": "ID", "ms": "MY", "ur": "PK",
  };
  return map[lang] || map[lang.split("-")[0]] || "";
}

export default function TawbahMap() {
  const [, setLocation] = useLocation();
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [countries, setCountries] = useState<CountryEntry[]>([]);
  const [pinned, setPinned] = useState(() => localStorage.getItem("pinnedCountry") || "");
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [pinning, setPinning] = useState(false);
  const [justPinned, setJustPinned] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/stats/countries`)
      .then(r => r.json())
      .then(setCountries)
      .catch(() => {});
  }, []);

  const maxCount = Math.max(...countries.map(c => c.count), 1);

  const handlePin = async (code: string) => {
    if (pinning) return;
    setPinning(true);
    await fetch(`${BASE}/api/stats/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: code }),
    });
    setPinned(code);
    localStorage.setItem("pinnedCountry", code);
    setShowPicker(false);
    setSearch("");
    setJustPinned(true);
    setTimeout(() => setJustPinned(false), 3000);
    const res = await fetch(`${BASE}/api/stats/countries`);
    const data = await res.json();
    setCountries(data);
    setPinning(false);
  };

  const filtered = COUNTRY_LIST.filter(c =>
    c.name.includes(search) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const guessed = guessCountry();

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      <PageHeader title="خريطة التوبة العالمية" subtitle="أين المتوبون في آخر ٧ أيام؟" icon={<Globe size={16} />} />
      <AnimatePresence>
        {justPinned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 mb-4 bg-primary/10 border border-primary/30 rounded-xl p-3 text-center text-sm text-primary font-medium"
          >
            ✨ تمّ تسجيلك في الخريطة — أجرك عند الله
          </motion.div>
        )}
      </AnimatePresence>

      {!pinned ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-4 bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-sm text-foreground font-medium mb-1">أين أنت اليوم؟</p>
          <p className="text-xs text-muted-foreground mb-3">
            ضع نقطتك مجهولة الهوية على الخريطة — لا اسم ولا معلومات شخصية
          </p>
          {guessed && COUNTRIES[guessed] && (
            <button
              onClick={() => handlePin(guessed)}
              className="w-full py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2 mb-2"
            >
              <span>{COUNTRIES[guessed].flag}</span>
              أنا من {COUNTRIES[guessed].name}
            </button>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2"
          >
            <MapPin size={16} /> اختر دولتك يدوياً
          </button>
        </motion.div>
      ) : (
        <div className="mx-6 mb-4 flex items-center gap-2">
          <span className="text-lg">{COUNTRIES[pinned]?.flag}</span>
          <span className="text-sm text-muted-foreground">
            أنت مسجّل من <span className="text-foreground font-medium">{COUNTRIES[pinned]?.name}</span>
          </span>
          <button
            onClick={() => setShowPicker(true)}
            className="mr-auto text-xs text-primary underline"
          >
            تغيير
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {countries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🌍</p>
            <p className="text-muted-foreground text-sm">
              كن أول من يُضيف دولته إلى الخريطة!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {countries.map((entry, i) => {
              const info = COUNTRIES[entry.countryCode ?? ""] ?? {
                name: entry.countryCode ?? "",
                flag: "🌍",
              };
              const pct = (entry.count / maxCount) * 100;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <motion.div
                  key={entry.countryCode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{i < 3 ? medals[i] : info.flag}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{info.name}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {toArabicNumerals(entry.count)}
                    </p>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.04 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end"
            onClick={() => { setShowPicker(false); setSearch(""); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-background rounded-t-3xl max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-border">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
                <h2 className="text-base font-bold text-center mb-3">اختر دولتك</h2>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث..."
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {filtered.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handlePin(c.code)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-sm text-foreground">{c.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
