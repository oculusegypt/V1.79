import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Moon, Sun, Clock, Star, Heart, Droplets, BookOpen, Wind } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  calcDuaPower,
  getPowerLabel,
  getNextPeakDescription,
  buildDuaWindows,
  type DuaWindow,
} from "@/lib/dua-power";

// Icon map — keeps icons out of the shared lib (avoids React dep in lib)
const WINDOW_ICONS: Record<string, React.ReactNode> = {
  "last-third":    <Moon size={20} />,
  "friday-hour":   <Star size={20} />,
  "adhan-iqamah":  <Wind size={20} />,
  "fajr-time":     <Sun size={20} />,
  "morning-adhkar":<Sun size={20} />,
  "evening-adhkar":<Moon size={20} />,
  "mon-thur":      <BookOpen size={20} />,
  "arafa":         <Star size={20} />,
  "ramadan":       <Moon size={20} />,
  "sujood":        <Heart size={20} />,
  "rain":          <Droplets size={20} />,
};

const WINDOW_STYLE: Record<string, { color: string; border: string; iconBg: string; glowColor: string }> = {
  "last-third":    { color:"text-indigo-400", border:"border-indigo-400/30", iconBg:"bg-indigo-500/15", glowColor:"shadow-indigo-500/30" },
  "friday-hour":   { color:"text-yellow-500", border:"border-yellow-400/30", iconBg:"bg-yellow-500/15", glowColor:"shadow-yellow-500/30" },
  "adhan-iqamah":  { color:"text-emerald-500",border:"border-emerald-400/30",iconBg:"bg-emerald-500/15",glowColor:"shadow-emerald-500/30"},
  "fajr-time":     { color:"text-amber-400",  border:"border-amber-400/30",  iconBg:"bg-amber-400/15",  glowColor:"shadow-amber-400/30" },
  "morning-adhkar":{ color:"text-orange-400", border:"border-orange-400/30", iconBg:"bg-orange-400/15", glowColor:"shadow-orange-400/30"},
  "evening-adhkar":{ color:"text-purple-400", border:"border-purple-400/30", iconBg:"bg-purple-400/15", glowColor:"shadow-purple-400/30"},
  "mon-thur":      { color:"text-teal-500",   border:"border-teal-400/30",   iconBg:"bg-teal-500/15",   glowColor:"shadow-teal-500/30" },
  "arafa":         { color:"text-yellow-600", border:"border-yellow-500/30", iconBg:"bg-yellow-600/15", glowColor:"shadow-yellow-600/30"},
  "ramadan":       { color:"text-violet-500", border:"border-violet-400/30", iconBg:"bg-violet-500/15", glowColor:"shadow-violet-500/30"},
  "sujood":        { color:"text-rose-500",   border:"border-rose-400/30",   iconBg:"bg-rose-500/15",   glowColor:"shadow-rose-500/30" },
  "rain":          { color:"text-sky-500",    border:"border-sky-400/30",    iconBg:"bg-sky-500/15",    glowColor:"shadow-sky-500/30"  },
};

// Rain window (UI-only, manual toggle — not in shared lib)
const RAIN_WINDOW: DuaWindow = {
  id: "rain",
  label: "عند نزول المطر",
  sub: "لحظة استجابة مباركة",
  power: 30,
  active: false,
  hadith: "«ثنتان لا تُردان: الدعاء عند النداء (الأذان) وتحت المطر»",
  bestDua: "اللهم صيباً نافعاً",
};

export default function DuaTiming() {
  const [tick, setTick] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // suppress unused-variable warning — tick forces re-render every 30s
  void tick;

  const libWindows = buildDuaWindows();
  const allWindows = [...libWindows, RAIN_WINDOW];

  const power = calcDuaPower();
  const powerInfo = getPowerLabel(power);
  const activeWindows = allWindows.filter((w) => w.active || w.alwaysActive);
  const inactiveWindows = allWindows.filter((w) => !w.active && !w.alwaysActive);

  const barColor =
    power >= 80 ? "from-yellow-400 to-amber-500" :
    power >= 60 ? "from-amber-400 to-orange-500" :
    power >= 40 ? "from-emerald-400 to-teal-500" :
    power >= 25 ? "from-blue-400 to-indigo-500" :
    "from-slate-400 to-slate-500";

  return (
    <div className="flex flex-col flex-1 pb-24">
      <PageHeader title="لحظة الإجابة" subtitle="أوقات إجابة الدعاء الآن" icon={<Clock size={16} />} />

      <div className="px-4 pt-5 space-y-5">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-border/30 bg-gradient-to-br from-card to-card/50 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">قوة الدعاء الآن</p>
              <p className={`text-lg font-bold ${powerInfo.color} flex items-center gap-1.5`}>
                {powerInfo.pulse && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${power >= 60 ? "bg-yellow-400" : "bg-emerald-400"} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${power >= 60 ? "bg-yellow-500" : "bg-emerald-500"}`} />
                  </span>
                )}
                {powerInfo.label}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-primary/10" />
                <motion.circle
                  cx="32" cy="32" r="26" fill="none" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - power / 100)}`}
                  strokeLinecap="round"
                  style={{ stroke: power >= 80 ? "#eab308" : power >= 60 ? "#f59e0b" : power >= 40 ? "#10b981" : power >= 25 ? "#3b82f6" : "#94a3b8" }}
                  initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - power / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{power}%</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden mb-3">
            <motion.div
              className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${power}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {getNextPeakDescription(power)}
          </p>
        </motion.div>

        {activeWindows.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" />
              نوافذ الإجابة النشطة الآن
            </h2>
            <div className="space-y-2.5">
              <AnimatePresence>
                {activeWindows.map((w, i) => {
                  const s = WINDOW_STYLE[w.id] ?? WINDOW_STYLE["sujood"]!;
                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <button
                        onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                        className={`w-full text-right rounded-2xl border ${s.border} bg-gradient-to-l from-card/80 to-card p-4 shadow-sm ${s.glowColor} ${w.active ? "shadow-md" : "shadow-sm"} transition-all active:scale-[0.98]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0 ${s.color}`}>
                            {WINDOW_ICONS[w.id]}
                          </div>
                          <div className="flex-1 text-right">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold text-sm ${s.color}`}>{w.label}</h3>
                              {w.alwaysActive && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">دائماً</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{w.sub}</p>
                          </div>
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg ${s.iconBg} ${s.color}`}>
                            +{w.power}%
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedId === w.id && w.hadith && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-border/30"
                            >
                              <p className="text-xs text-muted-foreground leading-relaxed italic">{w.hadith}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {inactiveWindows.filter(w => !w.alwaysActive).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
              <Clock size={14} />
              نوافذ إجابة أخرى
            </h2>
            <div className="space-y-2">
              {inactiveWindows.filter(w => !w.alwaysActive).map((w, i) => {
                const s = WINDOW_STYLE[w.id] ?? WINDOW_STYLE["sujood"]!;
                return (
                  <motion.button
                    key={w.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                    className="w-full text-right rounded-2xl border border-border/30 bg-card/50 p-3.5 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 text-muted-foreground">
                        {WINDOW_ICONS[w.id]}
                      </div>
                      <div className="flex-1 text-right">
                        <h3 className="font-semibold text-sm text-muted-foreground">{w.label}</h3>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{w.sub}</p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId === w.id && w.hadith && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-border/30"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed italic">{w.hadith}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-l from-yellow-500/10 to-amber-400/5 p-4">
          <h3 className="font-bold text-sm text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
            <Star size={14} />
            دعاء مستحب الآن
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 font-arabic">
            «اللهم إني أسألك رحمةً من عندك تهدي بها قلبي، وتجمع بها أمري، وتُصلح بها شأني»
          </p>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/50 p-4">
          <h3 className="font-bold text-sm mb-3">آداب الدعاء</h3>
          <div className="space-y-2">
            {[
              { t: "ابدأ بالحمد والصلاة على النبي ﷺ", c: "text-amber-600" },
              { t: "استقبل القبلة وارفع يديك", c: "text-emerald-600" },
              { t: "ادعُ بيقين وحضور قلب", c: "text-blue-600" },
              { t: "كرّر الدعاء ثلاثاً", c: "text-violet-600" },
              { t: "اختم بالصلاة على النبي ﷺ والتأمين", c: "text-rose-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${item.c.replace("text-", "bg-")} shrink-0`} />
                <p className="text-xs text-muted-foreground">{item.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
