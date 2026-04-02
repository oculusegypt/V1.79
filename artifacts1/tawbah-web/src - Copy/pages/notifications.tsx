import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Clock, Moon, Sun, BookOpen,
  Flame, Calendar, Star, RefreshCw, CheckCircle, XCircle,
  ChevronDown, Shield, Sparkles, Eye
} from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { AdhkarModal } from "@/components/AdhkarModal";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { isNativeApp } from "@/lib/api-base";

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
      role="switch"
      aria-checked={checked}
    >
      <span className={cn(
        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300",
        checked ? "left-[26px]" : "left-0.5"
      )} />
    </button>
  );
}

// ── Time input ────────────────────────────────────────────────────────────────

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-muted rounded-xl px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-28 text-center"
    />
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({
  icon, color = "bg-primary/10 text-primary",
  label, description, right,
}: {
  icon: React.ReactNode; color?: string;
  label: string; description?: string; right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

// ── Row with time picker ───────────────────────────────────────────────────────

function TimedRow({
  icon, color = "bg-primary/10 text-primary",
  label, description, enabled, onToggle, time, onTimeChange,
}: {
  icon: React.ReactNode; color?: string;
  label: string; description?: string;
  enabled: boolean; onToggle: (v: boolean) => void;
  time: string; onTimeChange: (v: string) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
            {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-2.5 mr-11">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">وقت التذكير:</span>
              <TimeInput value={time} onChange={onTimeChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pt-5 pb-1.5">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Advance minutes picker ────────────────────────────────────────────────────

const ADVANCE_OPTIONS = [0, 5, 10, 15, 20, 30];

function AdvancePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ADVANCE_OPTIONS.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
            value === m
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {m === 0 ? "عند الأذان" : `قبل ${m} د`}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { settings, permission, supported, updateSettings, enableNotifications, disableNotifications } = useNotifications();
  const [enabling, setEnabling] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [prayersOpen, setPrayersOpen] = useState(true);
  const [adhkarPreview, setAdhkarPreview] = useState<"morning" | "evening" | null>(null);
  const native = isNativeApp();

  const [nativeDebug, setNativeDebug] = useState<{ token: boolean; stage: string; lastError: string }>(() => {
    let token = false;
    let stage = "";
    let lastError = "";
    try {
      token = !!localStorage.getItem("fcm_token");
      stage = localStorage.getItem("push_stage") || "";
      lastError = localStorage.getItem("push_last_error") || "";
    } catch {}
    return { token, stage, lastError };
  });

  const handleEnable = async () => {
    console.log("[NotificationsPage] handleEnable clicked");
    if (native) {
      try {
        localStorage.removeItem("push_last_error");
        localStorage.removeItem("push_stage");
      } catch {}
    }
    setEnabling(true);
    setPushError(null);
    try {
      console.log("[NotificationsPage] Calling enableNotifications...");
      const result = await Promise.race([
        enableNotifications(),
        new Promise<boolean>((resolve) =>
          setTimeout(() => {
            try {
              localStorage.setItem("push_stage", "enable_timeout");
              localStorage.setItem("push_last_error", "enable_timeout");
            } catch {}
            resolve(false);
          }, 25000),
        ),
      ]);
      console.log("[NotificationsPage] enableNotifications returned:", result);
      if (!result && native) {
        let details = "";
        try { details = localStorage.getItem("push_last_error") || ""; } catch {}
        console.log("[NotificationsPage] Native push failed, error:", details);
        setPushError(
          details
            ? `فشل تفعيل الإشعارات: ${details}`
            : "فشل تفعيل الإشعارات. تأكد من السماح للتطبيق بإرسال الإشعارات في إعدادات الهاتف.",
        );
      }
    } catch (e: unknown) {
      console.error("[NotificationsPage] Exception in handleEnable:", e);
      setPushError(`خطأ: ${e instanceof Error ? e.message : 'غير معروف'}`);
    }

    if (native) {
      try {
        setNativeDebug({
          token: !!localStorage.getItem("fcm_token"),
          stage: localStorage.getItem("push_stage") || "",
          lastError: localStorage.getItem("push_last_error") || "",
        });
      } catch {}
    }
    setEnabling(false);
  };

  const up = (patch: Partial<typeof settings>) => updateSettings(patch);
  const upPrayer = (patch: Partial<typeof settings.prayers>) =>
    updateSettings({ prayers: { ...settings.prayers, ...patch } });

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen" dir="rtl">
      <PageHeader title="الإشعارات" subtitle="إدارة وتخصيص جميع التذكيرات" icon={<Bell size={16} />} />

      <div className="flex-1 overflow-y-auto px-5 pb-10">

        {/* ── Permission banner ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!supported ? (
            <motion.div
              key="unsupported"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <XCircle size={20} className="text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">الإشعارات غير مدعومة</p>
                <p className="text-xs text-muted-foreground mt-0.5">المتصفح الحالي لا يدعم إشعارات الخلفية. استخدم Chrome أو Safari على الهاتف.</p>
              </div>
            </motion.div>
          ) : permission === "denied" ? (
            <motion.div
              key="denied"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-destructive/15 rounded-2xl flex items-center justify-center">
                  <BellOff size={20} className="text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">الإشعارات محجوبة</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{native ? "يجب السماح بالإشعارات من إعدادات الهاتف" : "يجب السماح بالإشعارات من إعدادات المتصفح"}</p>
                </div>
              </div>
              <div className="bg-destructive/10 rounded-xl p-3 text-xs text-destructive leading-relaxed">
                {native
                  ? "افتح إعدادات الهاتف ← التطبيقات ← دليل التوبة النصوح ← الإشعارات ← فعّل (سماح). ثم أعد فتح التطبيق."
                  : "افتح إعدادات المتصفح ← الخصوصية والأمان ← إعدادات الموقع ← الإشعارات ← ابحث عن هذا الموقع وغيّره إلى \"سماح\""}
              </div>
            </motion.div>
          ) : settings.enabled && permission === "granted" ? (
            <motion.div
              key="enabled"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">الإشعارات مفعّلة</p>
                    <p className="text-xs text-muted-foreground mt-0.5">تذكيراتك تعمل في الخلفية تلقائياً</p>
                  </div>
                </div>
                <button
                  onClick={disableNotifications}
                  className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive border border-destructive/20 hover:border-destructive/40 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                >
                  <BellOff size={13} />
                  إيقاف
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="activate"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-2xl overflow-hidden border border-primary/30 shadow-lg shadow-primary/10"
            >
              <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/30"
                  >
                    <Bell size={22} className="text-primary-foreground" />
                  </motion.div>
                  <div>
                    <p className="text-base font-bold text-foreground">فعّل الإشعارات</p>
                    <p className="text-xs text-muted-foreground mt-0.5">لا تفوّت وقت الصلاة والأذكار اليومية</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: "🕌", text: "تنبيهات الصلاة" },
                    { icon: "📿", text: "أذكار الصباح والمساء" },
                    { icon: "📓", text: "تذكير المراجعة اليومية" },
                    { icon: "🌙", text: "تنبيهات الصيام والجمعة" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 bg-background/50 rounded-xl px-3 py-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-medium text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleEnable}
                  disabled={enabling}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {enabling ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>يجري التفعيل...</span>
                    </>
                  ) : (
                    <>
                      <Bell size={16} />
                      <span>تفعيل الإشعارات الآن</span>
                    </>
                  )}
                </button>
                {pushError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{pushError}</p>
                )}

                {native && (
                  <div className="mt-3 bg-background/60 border border-border/50 rounded-xl p-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span>حالة الإذن داخل التطبيق:</span>
                      <span className="font-bold text-foreground">{permission}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span>توكن FCM محفوظ:</span>
                      <span className="font-bold text-foreground">{nativeDebug.token ? "نعم" : "لا"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span>المرحلة:</span>
                      <span className="font-bold text-foreground">{nativeDebug.stage || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span>آخر خطأ:</span>
                      <span className="font-bold text-foreground">{nativeDebug.lastError || "-"}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content (disabled overlay if not enabled) ──────────────────────── */}
        <div className={cn("transition-opacity", (!settings.enabled || permission !== "granted") && "opacity-40 pointer-events-none select-none")}>

          {/* ── Prayer times ────────────────────────────────────────────────── */}
          <SectionHeader label="مواقيت الصلاة" />
          <div className="bg-card border border-border/40 rounded-2xl px-4 divide-y divide-border/30">

            {/* Header row with expand toggle */}
            <button
              onClick={() => setPrayersOpen(v => !v)}
              className="w-full flex items-center justify-between py-3.5 gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={15} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">تذكيرات الصلوات الخمس</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {[settings.prayers.fajr, settings.prayers.dhuhr, settings.prayers.asr, settings.prayers.maghrib, settings.prayers.isha].filter(Boolean).length} صلوات مفعّلة
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", prayersOpen && "rotate-180")} />
            </button>

            <AnimatePresence initial={false}>
              {prayersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border/20 pb-1">
                    {([
                      { key: "fajr", label: "الفجر", icon: <Moon size={13} /> },
                      { key: "sunrise", label: "الشروق (صلاة الإشراق)", icon: <Sun size={13} /> },
                      { key: "dhuhr", label: "الظهر", icon: <Sun size={13} /> },
                      { key: "asr", label: "العصر", icon: <Sun size={13} /> },
                      { key: "maghrib", label: "المغرب", icon: <Sun size={13} /> },
                      { key: "isha", label: "العشاء", icon: <Moon size={13} /> },
                    ] as const).map(p => (
                      <div key={p.key} className="flex items-center justify-between py-3 pr-11">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{p.icon}</span>
                          <span className="text-sm text-foreground">{p.label}</span>
                        </div>
                        <Toggle
                          checked={settings.prayers[p.key]}
                          onChange={(v) => upPrayer({ [p.key]: v })}
                        />
                      </div>
                    ))}

                    {/* Advance minutes */}
                    <div className="py-3.5 pr-11">
                      <p className="text-xs text-muted-foreground mb-2">وقت التنبيه قبل الصلاة:</p>
                      <AdvancePicker
                        value={settings.prayers.advanceMinutes}
                        onChange={(v) => upPrayer({ advanceMinutes: v })}
                      />
                    </div>

                    {/* City note */}
                    {!localStorage.getItem("prayerCity") && (
                      <div className="py-3 pr-11">
                        <p className="text-[11px] text-amber-600 bg-amber-500/10 px-3 py-2 rounded-xl">
                          ⚠️ لم يتم تحديد موقعك. افتح صفحة مواقيت الصلاة وحدّد مدينتك أولاً.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Adhkar ─────────────────────────────────────────────────────── */}
          <SectionHeader label="الأذكار والأوراد" />
          <div className="bg-card border border-border/40 rounded-2xl px-4 divide-y divide-border/30">
            <div>
              <TimedRow
                icon={<Sun size={15} />}
                color="bg-amber-500/15 text-amber-600"
                label="أذكار الصباح"
                description="تذكير يومي بأذكار الصباح كاملةً"
                enabled={settings.morningAdhkar}
                onToggle={(v) => up({ morningAdhkar: v })}
                time={settings.morningAdhkarTime}
                onTimeChange={(v) => up({ morningAdhkarTime: v })}
              />
              {settings.morningAdhkar && (
                <div className="pb-3">
                  <button
                    onClick={() => setAdhkarPreview("morning")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 active:scale-95 transition-all"
                  >
                    <Eye size={12} />
                    معاينة نافذة أذكار الصباح
                  </button>
                </div>
              )}
            </div>
            <div>
              <TimedRow
                icon={<Moon size={15} />}
                color="bg-indigo-500/15 text-indigo-600"
                label="أذكار المساء"
                description="تذكير يومي بأذكار المساء كاملةً"
                enabled={settings.eveningAdhkar}
                onToggle={(v) => up({ eveningAdhkar: v })}
                time={settings.eveningAdhkarTime}
                onTimeChange={(v) => up({ eveningAdhkarTime: v })}
              />
              {settings.eveningAdhkar && (
                <div className="pb-3">
                  <button
                    onClick={() => setAdhkarPreview("evening")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 active:scale-95 transition-all"
                  >
                    <Eye size={12} />
                    معاينة نافذة أذكار المساء
                  </button>
                </div>
              )}
            </div>
            <TimedRow
              icon={<Star size={15} />}
              color="bg-violet-500/15 text-violet-600"
              label="ذكر يومي"
              description="تذكير لجلسة الذكر اليومي"
              enabled={settings.dhikrReminder}
              onToggle={(v) => up({ dhikrReminder: v })}
              time={settings.dhikrReminderTime}
              onTimeChange={(v) => up({ dhikrReminderTime: v })}
            />
          </div>

          {/* ── Journey & Streak ─────────────────────────────────────────────── */}
          <SectionHeader label="رحلة التوبة والاستقامة" />
          <div className="bg-card border border-border/40 rounded-2xl px-4 divide-y divide-border/30">
            <TimedRow
              icon={<Sparkles size={15} />}
              color="bg-emerald-500/15 text-emerald-600"
              label="تذكير الرحلة اليومي"
              description="تذكير بإكمال ورد اليوم في رحلة التوبة"
              enabled={settings.journeyReminder}
              onToggle={(v) => up({ journeyReminder: v })}
              time={settings.journeyReminderTime}
              onTimeChange={(v) => up({ journeyReminderTime: v })}
            />
            <TimedRow
              icon={<Flame size={15} />}
              color="bg-orange-500/15 text-orange-600"
              label="تذكير الاستقامة اليومية"
              description="تنبيه لتسجيل يومك قبل منتصف الليل"
              enabled={settings.streakReminder}
              onToggle={(v) => up({ streakReminder: v })}
              time={settings.streakReminderTime}
              onTimeChange={(v) => up({ streakReminderTime: v })}
            />
          </div>

          {/* ── Evening review ─────────────────────────────────────────────── */}
          <SectionHeader label="المراجعة والتأمل" />
          <div className="bg-card border border-border/40 rounded-2xl px-4">
            <TimedRow
              icon={<BookOpen size={15} />}
              color="bg-rose-500/15 text-rose-600"
              label="مراجعة المساء"
              description="تذكير بكتابة تأملات اليوم في المفكرة"
              enabled={settings.eveningReview}
              onToggle={(v) => up({ eveningReview: v })}
              time={settings.eveningReviewTime}
              onTimeChange={(v) => up({ eveningReviewTime: v })}
            />
          </div>

          {/* ── Nafl fasting ─────────────────────────────────────────────────── */}
          <SectionHeader label="صيام النوافل" />
          <div className="bg-card border border-border/40 rounded-2xl px-4 divide-y divide-border/30">
            <Row
              icon={<Moon size={15} />}
              color="bg-sky-500/15 text-sky-600"
              label="تذكير صيام الاثنين"
              description="تنبيه مساء الأحد للتحضير لصيام الاثنين"
              right={<Toggle checked={settings.mondayFasting} onChange={(v) => up({ mondayFasting: v })} />}
            />
            <Row
              icon={<Moon size={15} />}
              color="bg-sky-500/15 text-sky-600"
              label="تذكير صيام الخميس"
              description="تنبيه مساء الأربعاء للتحضير لصيام الخميس"
              right={<Toggle checked={settings.thursdayFasting} onChange={(v) => up({ thursdayFasting: v })} />}
            />
            <Row
              icon={<Star size={15} />}
              color="bg-yellow-500/15 text-yellow-600"
              label="أيام البيض (13 و14 و15)"
              description="تنبيه صباح أيام 13-14-15 من كل شهر هجري"
              right={<Toggle checked={settings.ayyamBeedh} onChange={(v) => up({ ayyamBeedh: v })} />}
            />
          </div>

          {/* ── Friday ────────────────────────────────────────────────────────── */}
          <SectionHeader label="الجمعة المباركة" />
          <div className="bg-card border border-border/40 rounded-2xl px-4">
            <TimedRow
              icon={<Calendar size={15} />}
              color="bg-teal-500/15 text-teal-600"
              label="تذكير الجمعة"
              description="تذكير بقراءة الكهف والإكثار من الصلاة على النبي ﷺ"
              enabled={settings.fridayKahf}
              onToggle={(v) => up({ fridayKahf: v })}
              time={settings.fridayKahfTime}
              onTimeChange={(v) => up({ fridayKahfTime: v })}
            />
          </div>

          {/* ── Footer note ───────────────────────────────────────────────────── */}
          <div className="mt-6 px-1">
            <div className="flex items-start gap-2 text-muted-foreground">
              <RefreshCw size={13} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed">
                التذكيرات تُجدَّد تلقائياً في كل مرة تفتح فيها التطبيق. للحصول على تذكيرات الصلاة، تأكد من تحديد مدينتك في صفحة مواقيت الصلاة.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Adhkar preview modals */}
      <AdhkarModal
        visible={adhkarPreview === "morning"}
        type="morning"
        onClose={() => setAdhkarPreview(null)}
      />
      <AdhkarModal
        visible={adhkarPreview === "evening"}
        type="evening"
        onClose={() => setAdhkarPreview(null)}
      />
    </div>
  );
}
