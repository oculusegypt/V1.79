import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, RefreshCw, Loader2, HandHeart, Clock, Sparkles } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

interface Dua {
  id: number;
  content: string;
  amenCount: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

function DuaCard({ dua, onAmen }: { dua: Dua; onAmen: (id: number, newCount: number) => void }) {
  const [amenState, setAmenState] = useState<"idle" | "loading" | "done">("idle");
  const [localCount, setLocalCount] = useState(dua.amenCount);
  const [showPop, setShowPop] = useState(false);

  async function handleAmen() {
    if (amenState !== "idle") return;
    setAmenState("loading");
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/api/community-duas/${dua.id}/amen`, { method: "POST" });
      const data = await r.json() as { amenCount: number };
      const newCount = data.amenCount ?? localCount + 1;
      setLocalCount(newCount);
      setAmenState("done");
      setShowPop(true);
      setTimeout(() => setShowPop(false), 2000);
      onAmen(dua.id, newCount);
    } catch {
      setAmenState("idle");
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <p className="text-sm leading-relaxed text-foreground text-right mb-4 font-medium">
        {dua.content}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={11} />
          <span>{timeAgo(dua.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {localCount > 0 && (
            <span className="text-xs text-rose-500 font-bold">
              {localCount} آمين
            </span>
          )}
          <div className="relative">
            <AnimatePresence>
              {showPop && (
                <motion.span
                  key="pop"
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -30, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-rose-500 text-xl pointer-events-none"
                >
                  🤲
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={handleAmen}
              disabled={amenState !== "idle"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                amenState === "done"
                  ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              )}
            >
              {amenState === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : amenState === "done" ? (
                <><HandHeart size={14} /> قلتَ آمين</>
              ) : (
                <><Heart size={14} /> آمين</>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CommunityDuas() {
  const sessionId = getSessionId();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDua, setNewDua] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 300;

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const loadDuas = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/community-duas?limit=30`);
      const data = await r.json() as { duas: Dua[] };
      setDuas(data.duas ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { loadDuas(); }, [loadDuas]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setNewDua(val);
      setCharCount(val.length);
    }
  }

  async function handlePost() {
    if (!newDua.trim() || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`${base}/api/community-duas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: newDua.trim() }),
      });
      const data = await r.json() as { dua: Dua };
      if (data.dua) {
        setDuas((prev) => [data.dua, ...prev]);
        setNewDua("");
        setCharCount(0);
        setPosted(true);
        setTimeout(() => setPosted(false), 3000);
      }
    } catch { /* ignore */ } finally {
      setPosting(false);
    }
  }

  function updateAmen(id: number, newCount: number) {
    setDuas((prev) => prev.map((d) => d.id === id ? { ...d, amenCount: newCount } : d));
  }

  const totalAmeen = duas.reduce((sum, d) => sum + d.amenCount, 0);

  return (
    <div className="flex flex-col flex-1 pb-8">
      <PageHeader title="قل آمين" subtitle="ادعُ لإخوانك في الله بلا هويات" icon={<HandHeart size={16} />} />
      <div className="relative overflow-hidden bg-gradient-to-b from-rose-600 to-rose-800 dark:from-rose-900 dark:to-rose-950 px-6 pt-8 pb-10 rounded-b-[2.5rem] shadow-xl mb-6">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${60 + i * 40}px`, height: `${60 + i * 40}px`, top: `${i * 15}%`, right: `${i * 12}%`, opacity: 0.3 - i * 0.04 }} />
          ))}
        </div>
        <div className="relative text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <HandHeart size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">قل آمين</h1>
          <p className="text-rose-100 text-sm leading-relaxed max-w-xs mx-auto">
            ادعُ لإخوانك في الله بلا أسماء ولا هويات — فقط قلب يدعو لقلب
          </p>
          {totalAmeen > 0 && (
            <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 inline-flex items-center gap-2">
              <Sparkles size={14} className="text-rose-200" />
              <span className="text-white font-bold text-sm">{totalAmeen.toLocaleString("ar-EG")} آمين قيلت اليوم</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm"
        >
          <h2 className="text-sm font-bold mb-3 text-right flex items-center justify-end gap-1.5">
            <span>اكتب دعاءك المجهول</span>
            <Heart size={14} className="text-rose-500" />
          </h2>
          <textarea
            value={newDua}
            onChange={handleInput}
            placeholder="اللهم اشفِ مرضى إخواني المسلمين..."
            className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm text-right resize-none min-h-[90px] outline-none focus:ring-2 focus:ring-rose-400/40 leading-relaxed"
            dir="rtl"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={cn("text-xs", charCount > MAX_CHARS * 0.9 ? "text-rose-500" : "text-muted-foreground")}>
              {charCount}/{MAX_CHARS}
            </span>
            <AnimatePresence mode="wait">
              {posted ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm"
                >
                  <HandHeart size={15} /> رُفع دعاؤك — الله يستجيب
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  onClick={handlePost}
                  disabled={posting || !newDua.trim()}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95"
                >
                  {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  ارفع الدعاء
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-muted-foreground">أدعية الإخوة</h2>
          <button onClick={loadDuas} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={12} className={cn(loading && "animate-spin")} />
            تحديث
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded-lg w-4/5 mb-2 mr-auto" />
                <div className="h-4 bg-muted rounded-lg w-3/5 mr-auto" />
                <div className="h-8 bg-muted rounded-xl w-24 mt-4 ml-auto" />
              </div>
            ))}
          </div>
        ) : duas.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <HandHeart size={40} className="mx-auto mb-3 text-rose-300" />
            <p className="text-sm">لا يوجد أدعية بعد — كن أول من يدعو لإخوانه</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {duas.map((dua) => (
                <DuaCard key={dua.id} dua={dua} onAmen={updateAmen} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
