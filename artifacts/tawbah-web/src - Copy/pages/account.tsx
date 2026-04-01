import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  User2, Settings2, Moon, Sun, Languages, Volume2, BookOpen,
  ChevronDown, Check, BarChart2, Calendar, Clock,
  ScrollText, PenLine, Bell, ChevronLeft, Shield, Palette, CheckSquare,
  Zap, Music2, ImageIcon, Upload, RotateCcw, LogOut, Bot,
} from "lucide-react";
import { useSettings, QURAN_RECITERS, ACCENT_OPTIONS, type AccentColor } from "@/context/SettingsContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useAppUserProgress, useAppDhikrCount, useAppHabits } from "@/hooks/use-app-data";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeader } from "@/lib/auth-client";
import { getSessionId } from "@/lib/session";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300",
          checked ? "left-[26px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mt-5 mb-2">
      {children}
    </p>
  );
}

function SettingRow({
  icon,
  label,
  description,
  right,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  description,
  href,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  href: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-xl px-1 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <ChevronLeft size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}

function getHijriDate() {
  try {
    return new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("ar");
  }
}

const HERO_BG_KEY = "hero_custom_bg";

export default function Account() {
  const { lang, theme, accentColor, autoPlayBotAudio, autoPlayQuran, quranReciterId,
    toggleLang, toggleTheme, setAccentColor, setAutoPlayBotAudio, setAutoPlayQuran, setQuranReciterId } = useSettings();
  const { settings: notifSettings, updateSettings: updateNotifSettings } = useNotifications();
  const { user, logout } = useAuth();
  const { data: progress } = useAppUserProgress();
  const [reciterOpen, setReciterOpen] = useState(false);
  const currentReciter = QURAN_RECITERS.find(r => r.id === quranReciterId) ?? QURAN_RECITERS[0]!;

  const [heroPreview, setHeroPreview] = useState<string | null>(() => localStorage.getItem(HERO_BG_KEY));
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(HERO_BG_KEY, dataUrl);
      setHeroPreview(dataUrl);
      setHeroUploading(false);
      window.dispatchEvent(new CustomEvent("hero-bg-changed", { detail: dataUrl }));
    };
    reader.readAsDataURL(file);
    if (heroInputRef.current) heroInputRef.current.value = "";
  };

  const resetHeroImage = () => {
    localStorage.removeItem(HERO_BG_KEY);
    setHeroPreview(null);
    window.dispatchEvent(new CustomEvent("hero-bg-changed", { detail: null }));
  };

  const [heroLightPreview, setHeroLightPreview] = useState<string | null>(() => localStorage.getItem("hero_custom_bg_light"));
  const [heroLightUploading, setHeroLightUploading] = useState(false);
  const heroLightInputRef = useRef<HTMLInputElement>(null);

  const handleHeroLightUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroLightUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem("hero_custom_bg_light", dataUrl);
      setHeroLightPreview(dataUrl);
      setHeroLightUploading(false);
      window.dispatchEvent(new CustomEvent("hero-bg-light-changed", { detail: dataUrl }));
    };
    reader.readAsDataURL(file);
    if (heroLightInputRef.current) heroLightInputRef.current.value = "";
  };

  const resetHeroLightImage = () => {
    localStorage.removeItem("hero_custom_bg_light");
    setHeroLightPreview(null);
    window.dispatchEvent(new CustomEvent("hero-bg-light-changed", { detail: null }));
  };

  const { data: dhikrData } = useAppDhikrCount();
  const { data: habits } = useAppHabits();
  const { data: journey30 } = useQuery<{ completedCount: number; currentDay: number; streakDays: number }>({
    queryKey: ["journey30-account"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const res = await fetch(`/api/journey30?sessionId=${encodeURIComponent(sessionId)}`, { headers: { ...getAuthHeader() } });
      if (!res.ok) return { completedCount: 0, currentDay: 1, streakDays: 0 };
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const streak = journey30?.streakDays ?? progress?.streakDays ?? 0;
  const signed = progress?.covenantSigned;
  const dhikrToday = dhikrData?.istighfar ?? 0;
  const habitsCompleted = habits?.filter(h => h.completed).length ?? 0;
  const habitsTotal = habits?.length ?? 0;
  const journeyDays = journey30?.completedCount ?? 0;
  const journeyCurrentDay = journey30?.currentDay ?? (journeyDays + 1);

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="relative w-20 h-20 mb-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <User2 size={38} className="text-primary/60" />
          </div>

          <Link
            href="/zakiy"
            className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:brightness-110 transition-all"
            title="زكي"
            aria-label="زكي"
          >
            <Bot size={16} strokeWidth={2.2} />
          </Link>

          {user && (
            <button
              onClick={logout}
              className="absolute -left-1 -bottom-1 w-9 h-9 rounded-full bg-card border border-border shadow-lg shadow-black/10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <h1 className="text-lg font-bold">حسابي</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{getHijriDate()}</p>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2.5 mb-5"
      >
        {/* Row 1 */}
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-primary">{streak}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">🔥 يوم متواصل</p>
        </div>
        <div className="bg-card border border-amber-400/25 rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-amber-500">{journeyDays}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">📅 من ٣٠ يوماً</p>
        </div>
        <div className="bg-card border border-emerald-400/25 rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-emerald-500">{journeyCurrentDay}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">🗓 اليوم الحالي</p>
        </div>

        {/* Row 2 */}
        <div className="bg-card border border-blue-400/25 rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-blue-500">{dhikrToday}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">📿 استغفار اليوم</p>
        </div>
        <div className="bg-card border border-violet-400/25 rounded-2xl p-3 text-center">
          <span className="text-xl font-bold text-violet-500">
            {habitsTotal > 0 ? `${habitsCompleted}/${habitsTotal}` : "—"}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">✅ عادات اليوم</p>
        </div>
        <div className="bg-card border border-emerald-400/25 rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-emerald-600">{signed ? "✓" : "—"}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">🤲 العهد مع الله</p>
        </div>
      </motion.div>

      {/* My Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card border border-border rounded-2xl px-4 mb-4"
      >
        <SectionLabel>معلوماتي</SectionLabel>
        {!user && (
          <div className="px-1 pb-3">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <p className="text-sm font-bold">سجّل دخولك</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                لا نطلب تسجيل الدخول لمعظم الصفحات. التسجيل مطلوب فقط لبدء رحلة ٣٠ يوماً.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black"
              >
                تسجيل / تسجيل دخول
              </Link>
            </div>
          </div>
        )}
        <LinkRow href="/progress" icon={<BarChart2 size={18} />} label="خريطة التقدم" description="إحصاءاتك الروحية والمسار اليومي" />
        <LinkRow href="/plan" icon={<CheckSquare size={18} />} label="عاداتي اليومية" description="تتبّع عاداتك الروحية ومكتبة العادات" iconBg="bg-emerald-500/10" iconColor="text-emerald-600" />
        <LinkRow href="/journey" icon={<Calendar size={18} />} label="رحلة التوبة ٣٠ يوماً" description="برنامج يومي تدريجي" />
        <LinkRow href="/journal" icon={<PenLine size={18} />} label="يوميات التوبة" description="مساحتك السرية الخاصة" iconBg="bg-violet-500/10" iconColor="text-violet-500" />
        <LinkRow href="/danger-times" icon={<Clock size={18} />} label="أوقات الخطر" description="تذكيرات وقائية ذكية" iconBg="bg-orange-500/10" iconColor="text-orange-500" />
        <LinkRow href="/prayer-times" icon={<Bell size={18} />} label="مواقيت الصلاة" description="تذكيرات قبل كل صلاة" iconBg="bg-indigo-500/10" iconColor="text-indigo-500" />
        <LinkRow href="/notifications" icon={<Settings2 size={18} />} label="إعدادات الإشعارات" description="تخصيص وقت وأنواع التذكيرات" iconBg="bg-violet-500/10" iconColor="text-violet-500" />
        <LinkRow href="/kaffarah" icon={<ScrollText size={18} />} label="الكفارات الشرعية" description="خطوات مفصّلة لكل ذنب" iconBg="bg-destructive/10" iconColor="text-destructive" />
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl px-4 mb-4"
      >
        <SectionLabel>الإعدادات</SectionLabel>

        <SettingRow
          icon={theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          label="الوضع الليلي"
          description={theme === "dark" ? "مفعّل" : "غير مفعّل"}
          right={<Toggle checked={theme === "dark"} onToggle={toggleTheme} />}
        />

        {/* Color theme picker */}
        <div className="py-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Palette size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">لون التطبيق</p>
              <p className="text-xs text-muted-foreground">
                {ACCENT_OPTIONS.find(o => o.id === accentColor)?.nameAr ?? "الغابة"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAccentColor(opt.id as AccentColor)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-2xl transition-all duration-200",
                    accentColor === opt.id
                      ? "ring-2 ring-offset-2 ring-offset-card scale-105 shadow-lg"
                      : "opacity-75 group-hover:opacity-100 group-hover:scale-102"
                  )}
                  style={{
                    background: opt.gradient,
                    ringColor: theme === "dark" ? opt.darkPrimary : opt.lightPrimary,
                  } as React.CSSProperties}
                >
                  {accentColor === opt.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Check size={16} className="text-white drop-shadow" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium leading-none">
                  {opt.nameAr}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hero image upload */}
        <div className="py-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 flex-shrink-0">
              <ImageIcon size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">صورة خلفية الهيرو</p>
              <p className="text-xs text-muted-foreground">
                {heroPreview ? "صورة مخصصة مفعّلة" : "الصورة الافتراضية"}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div
            className="w-full h-28 rounded-2xl mb-3 overflow-hidden border border-border/50 relative"
            style={{
              backgroundImage: heroPreview
                ? `url(${heroPreview})`
                : "url('/images/hero-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {heroPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-1 rounded-full">معاينة</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeroUpload}
            />
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={heroUploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Upload size={15} />
              {heroUploading ? "جارٍ الرفع..." : "رفع صورة"}
            </button>
            {heroPreview && (
              <button
                onClick={resetHeroImage}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-sm font-bold transition-colors"
              >
                <RotateCcw size={14} />
                إعادة تعيين
              </button>
            )}
          </div>
        </div>

        {/* Light mode hero image upload */}
        <div className="py-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
              <ImageIcon size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">خلفية الهيرو — وضع النهار</p>
              <p className="text-xs text-muted-foreground">
                {heroLightPreview ? "صورة مخصصة مفعّلة" : "الصورة الافتراضية"}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div
            className="w-full h-28 rounded-2xl mb-3 overflow-hidden border border-border/50 relative"
            style={{
              backgroundImage: heroLightPreview
                ? `url(${heroLightPreview})`
                : "url('/images/hero-bg-light.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {heroLightPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-1 rounded-full">معاينة</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <input
              ref={heroLightInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeroLightUpload}
            />
            <button
              onClick={() => heroLightInputRef.current?.click()}
              disabled={heroLightUploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Upload size={15} />
              {heroLightUploading ? "جارٍ الرفع..." : "رفع صورة"}
            </button>
            {heroLightPreview && (
              <button
                onClick={resetHeroLightImage}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-sm font-bold transition-colors"
              >
                <RotateCcw size={14} />
                إعادة تعيين
              </button>
            )}
          </div>
        </div>

        <SettingRow
          icon={<Languages size={17} />}
          label="اللغة"
          description={lang === "ar" ? "العربية" : "English"}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          right={
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              {lang === "ar" ? "EN" : "عر"}
            </button>
          }
        />

        <SettingRow
          icon={<Volume2 size={17} />}
          label="صوت المرشد تلقائياً"
          description="يبدأ الصوت فور وصول الرد"
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
          right={<Toggle checked={autoPlayBotAudio} onToggle={() => setAutoPlayBotAudio(!autoPlayBotAudio)} />}
        />

        <SettingRow
          icon={<BookOpen size={17} />}
          label="تشغيل الآيات تلقائياً"
          description="تُقرأ الآيات بالتسلسل مع الرد"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          right={<Toggle checked={autoPlayQuran} onToggle={() => setAutoPlayQuran(!autoPlayQuran)} />}
        />

        {/* Reciter selector */}
        <div className="py-3.5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
              <BookOpen size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">قارئ القرآن</p>
              <p className="text-xs text-muted-foreground">{currentReciter.nameAr}</p>
            </div>
          </div>
          <button
            onClick={() => setReciterOpen(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors"
          >
            <span>{currentReciter.nameAr}</span>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", reciterOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {reciterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 rounded-xl border border-border/50 overflow-hidden bg-background">
                  {QURAN_RECITERS.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => { setQuranReciterId(reciter.id); setReciterOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors",
                        reciter.id === quranReciterId
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span>{reciter.nameAr}</span>
                      {reciter.id === quranReciterId && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Smart Alerts Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="bg-card border border-border rounded-2xl px-4 mb-4"
      >
        <SectionLabel>إشعارات ذكية</SectionLabel>

        {/* Prayer Alert Sound */}
        <SettingRow
          icon={<Music2 size={17} />}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          label="صوت التكبير عند الصلاة"
          description="يُشغَّل صوت الله أكبر عند كل وقت صلاة"
          right={
            <Toggle
              checked={notifSettings.prayerAlertSound}
              onToggle={() => updateNotifSettings({ prayerAlertSound: !notifSettings.prayerAlertSound })}
            />
          }
        />

        <div className="h-px bg-border/50 mx-0.5" />

        {/* Dua Peak Alert */}
        <SettingRow
          icon={<Zap size={17} />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          label="تنبيه قمة الإجابة"
          description="يظهر تنبيه مع تكبير عند بلوغ قوة الدعاء للعتبة"
          right={
            <Toggle
              checked={notifSettings.duaPeakAlert}
              onToggle={() => updateNotifSettings({ duaPeakAlert: !notifSettings.duaPeakAlert })}
            />
          }
        />

        {/* Threshold selector — only shown when duaPeakAlert is ON */}
        <AnimatePresence>
          {notifSettings.duaPeakAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-3.5 px-1">
                <p className="text-xs text-muted-foreground mb-2.5 text-right">
                  عتبة قوة الدعاء للتنبيه
                </p>
                <div className="flex gap-2 justify-end" dir="ltr">
                  {([80, 90, 100] as const).map((val) => {
                    const active = (notifSettings.duaPeakThreshold ?? 100) === val;
                    return (
                      <button
                        key={val}
                        onClick={() => updateNotifSettings({ duaPeakThreshold: val })}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                          active
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"
                        )}
                      >
                        {val}%
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                  {(notifSettings.duaPeakThreshold ?? 100) === 100
                    ? "فقط عند اكتمال قوة الدعاء بالكامل"
                    : (notifSettings.duaPeakThreshold ?? 100) === 90
                    ? "عند بلوغ قوة الدعاء ٩٠٪ فأكثر"
                    : "عند بلوغ قوة الدعاء ٨٠٪ فأكثر — تنبيه مبكر"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reset / Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-card border border-border rounded-2xl px-4 mb-6"
      >
        <SectionLabel>الخصوصية والبيانات</SectionLabel>
        <div className="flex items-center gap-3 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Shield size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">تطبيق مجهول الهوية</p>
            <p className="text-xs text-muted-foreground mt-0.5">لا يتم حفظ اسمك أو بريدك — خصوصيتك محفوظة تماماً</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
