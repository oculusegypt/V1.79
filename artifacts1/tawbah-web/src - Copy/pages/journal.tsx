import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Trash2, Lock, ChevronDown, ChevronUp, Smile, Meh, Frown, Heart, Star } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";

type Mood = "great" | "good" | "neutral" | "sad" | "struggling";

interface JournalEntry {
  id: number;
  content: string;
  mood: Mood;
  date: string;
  createdAt: string | null;
}

const MOOD_CONFIG: Record<Mood, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  great: { icon: <Star size={18} />, label: "رائع", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  good: { icon: <Smile size={18} />, label: "جيد", color: "text-green-500", bg: "bg-green-500/10" },
  neutral: { icon: <Meh size={18} />, label: "عادي", color: "text-blue-500", bg: "bg-blue-500/10" },
  sad: { icon: <Frown size={18} />, label: "حزين", color: "text-orange-500", bg: "bg-orange-500/10" },
  struggling: { icon: <Heart size={18} />, label: "أحتاج مساعدة", color: "text-red-500", bg: "bg-red-500/10" },
};

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchEntries = async () => {
    const sessionId = getSessionId();
    const res = await fetch(`/api/journal?sessionId=${encodeURIComponent(sessionId)}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const sessionId = getSessionId();
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: content.trim(), mood }),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setContent("");
      setMood("neutral");
      setWriting(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const sessionId = getSessionId();
    await fetch(`/api/journal/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDelete(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      <PageHeader
        title="يوميات التوبة"
        subtitle="مساحتك السرية مع الله"
        icon={<Lock size={14} />}
        right={
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
            <Lock size={11} />
            <span className="text-[10px] font-bold">سرية</span>
          </div>
        }
      />

      <div className="px-5 mb-4">
        <AnimatePresence>
          {!writing ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWriting(true)}
              className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all"
            >
              <PenLine size={20} />
              <span className="font-bold text-sm">اكتب في يومياتك الآن...</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card rounded-xl border border-primary/20 p-4 shadow-lg"
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ماذا تشعر الآن؟ ما الذي تريد قوله لله؟ كيف رحلتك اليوم؟..."
                className="w-full min-h-[140px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none leading-relaxed text-right"
                dir="rtl"
                autoFocus
              />

              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-bold">كيف حالك الآن؟</p>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setMood(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        mood === key
                          ? `${cfg.bg} ${cfg.color} border-current`
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <span className={mood === key ? cfg.color : ""}>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all"
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  onClick={() => { setWriting(false); setContent(""); setMood("neutral"); }}
                  className="px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {entries.length === 0 && !writing ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <PenLine size={28} />
            </div>
            <p className="text-muted-foreground text-sm">لم تكتب بعد في يومياتك</p>
            <p className="text-xs text-muted-foreground/70 mt-1">ابدأ بتسجيل أفكارك ومشاعرك</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const moodCfg = MOOD_CONFIG[entry.mood as Mood] || MOOD_CONFIG.neutral;
            const expanded = expandedId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${moodCfg.bg} ${moodCfg.color} shrink-0`}>
                    {moodCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt || entry.date)}</p>
                    <p className="text-sm text-foreground mt-0.5 truncate">{entry.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmDelete(confirmDelete === entry.id ? null : entry.id)}
                      className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-muted/40 rounded-lg p-3">
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" dir="rtl">{entry.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {confirmDelete === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 flex gap-2">
                        <button onClick={() => handleDelete(entry.id)} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-bold">
                          نعم، احذف
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold">
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
