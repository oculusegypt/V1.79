import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Languages, Volume2, BookOpen, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

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

function SettingRow({
  icon,
  label,
  description,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
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

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    lang, theme, autoPlayBotAudio, autoPlayQuran, quranReciterId,
    toggleLang, toggleTheme,
    setAutoPlayBotAudio, setAutoPlayQuran, setQuranReciterId,
  } = useSettings();

  const [reciterOpen, setReciterOpen] = useState(false);
  const currentReciter = QURAN_RECITERS.find(r => r.id === quranReciterId) ?? QURAN_RECITERS[0]!;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[70] max-w-md mx-auto bg-card rounded-t-3xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <h2 className="text-base font-bold text-foreground">الإعدادات</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Settings List */}
            <div className="px-5 pb-8 divide-y divide-border/40">

              {/* Theme */}
              <SettingRow
                icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                label="الوضع الليلي"
                description={theme === "dark" ? "مفعّل" : "غير مفعّل"}
                right={<Toggle checked={theme === "dark"} onToggle={toggleTheme} />}
              />

              {/* Language */}
              <SettingRow
                icon={<Languages size={16} />}
                label="اللغة"
                description={lang === "ar" ? "العربية" : "English"}
                right={
                  <button
                    onClick={toggleLang}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    {lang === "ar" ? "EN" : "عر"}
                  </button>
                }
              />

              {/* Section label */}
              <div className="pt-4 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  صوت البوت والقرآن
                </p>
              </div>

              {/* Auto-play bot audio */}
              <SettingRow
                icon={<Volume2 size={16} />}
                label="تشغيل صوت البوت تلقائياً"
                description="يبدأ الصوت فور وصول الرد"
                right={
                  <Toggle
                    checked={autoPlayBotAudio}
                    onToggle={() => setAutoPlayBotAudio(!autoPlayBotAudio)}
                  />
                }
              />

              {/* Auto-play Quran */}
              <SettingRow
                icon={<BookOpen size={16} />}
                label="تشغيل الآيات تلقائياً"
                description="تُقرأ الآيات بالتسلسل مع رد البوت"
                right={
                  <Toggle
                    checked={autoPlayQuran}
                    onToggle={() => setAutoPlayQuran(!autoPlayQuran)}
                  />
                }
              />

              {/* Quran Reciter */}
              <div className="py-3.5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">قارئ القرآن</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{currentReciter.nameAr}</p>
                  </div>
                </div>

                {/* Reciter dropdown toggle */}
                <button
                  onClick={() => setReciterOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors"
                >
                  <span>{currentReciter.nameAr}</span>
                  <ChevronDown
                    size={16}
                    className={cn("text-muted-foreground transition-transform", reciterOpen && "rotate-180")}
                  />
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
                            onClick={() => {
                              setQuranReciterId(reciter.id);
                              setReciterOpen(false);
                            }}
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

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
