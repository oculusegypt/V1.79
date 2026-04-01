import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Sparkles, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSessionId } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";

const BASE = () => (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export default function SecretDua() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);
  const [matched, setMatched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"send" | "received">("send");

  const { data: received, isLoading: loadingReceived } = useQuery<{
    dua: { content: string; createdAt: string } | null;
  }>({
    queryKey: ["secret-dua-received", sessionId],
    queryFn: async () => {
      const res = await fetch(
        `${BASE()}/api/secret-dua/received?sessionId=${encodeURIComponent(sessionId)}`
      );
      return res.json();
    },
    enabled: !!sessionId && tab === "received",
    staleTime: 0,
  });

  const { data: stats } = useQuery<{ total: number }>({
    queryKey: ["secret-dua-stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/secret-dua/stats`);
      return res.json();
    },
  });

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${BASE()}/api/secret-dua`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      setSent(true);
      setMatched(data.matched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      <PageHeader title="الصديق السري" subtitle="ادعُ لأخٍ مجهول — سيبلغه دعاؤك بلا أسماء" icon={<Heart size={16} />} />
      <div className="p-6 pb-4">

        {stats && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-rose-500/5 border border-rose-400/20 rounded-xl p-3 text-center"
          >
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              ✨ {stats.total.toLocaleString("ar-EG")} دعاء أُرسل حتى الآن
            </p>
          </motion.div>
        )}
      </div>

      <div className="px-6 mb-4">
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setTab("send")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "send"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            أرسل دعاء
          </button>
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "received"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            استلمت دعاء؟
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 pb-8">
        <AnimatePresence mode="wait">
          {tab === "send" ? (
            <motion.div
              key="send"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {!sent ? (
                <>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={14} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        دعاؤك مجهول تماماً — لن يعرف أحد هويتك
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-3">
                      اكتب دعاءً لأخٍ مسلم لا تعرفه
                    </p>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={300}
                      rows={5}
                      placeholder="اللهم اغفر له وثبّته على التوبة، واجعل رحلته معك مليئة بالنور والتوفيق..."
                      className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/40 resize-none leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-left">
                      {content.length}/300
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 border border-rose-400/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles size={18} className="text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        عندما تضغط "أرسل"، يُرسَل دعاؤك لأخٍ مجهول يمشي في رحلة التوبة مثلك.
                        وقد يصلك دعاء من آخر أيضاً بإذن الله.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <Send size={18} />
                    {sending ? "يتم الإرسال..." : "أرسل الدعاء"}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-5 py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: 2 }}
                    className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center"
                  >
                    <Heart size={40} className="text-rose-500 fill-rose-500" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      وصل دعاؤك ✨
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                      {matched
                        ? "تم إيصال دعاؤك لأخٍ مسلم يسير في رحلته — جعله الله في ميزان حسناتك"
                        : "تم حفظ دعاؤك وسيصل لأول متوب جديد — جعله الله في ميزان حسناتك"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted px-4 py-2 rounded-full">
                    ﴿وَمَن يَشْفَعْ شَفَاعَةً حَسَنَةً يَكُن لَّهُ نَصِيبٌ مِّنْهَا﴾
                  </p>
                  <button
                    onClick={() => { setSent(false); setContent(""); }}
                    className="text-sm text-rose-500 font-medium underline"
                  >
                    أرسل دعاءً آخر
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="received"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {loadingReceived ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-rose-400/20 border-t-rose-500 rounded-full animate-spin" />
                </div>
              ) : received?.dua ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="text-center py-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                      <Heart size={32} className="text-rose-500 fill-rose-500" />
                    </motion.div>
                    <h2 className="text-lg font-bold text-foreground mb-1">
                      شخص يدعو لك الآن 💌
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      هذا الدعاء أُرسل إليك من أخٍ مسلم لا يعرفك
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 border border-rose-400/30 rounded-2xl p-5">
                    <p className="text-sm text-foreground leading-loose text-center font-medium italic">
                      "{received.dua.content}"
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    ﴿وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا بِأَحْسَنَ مِنْهَا﴾
                  </p>

                  <button
                    onClick={() => setTab("send")}
                    className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Heart size={16} /> ردّ بدعاء لشخص آخر
                  </button>
                </motion.div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Heart size={28} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-1">لا يوجد دعاء مستلم بعد</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                      ابدأ بإرسال دعاء لآخرين — والله يُجازي كل دعاء بمثله
                    </p>
                  </div>
                  <button
                    onClick={() => setTab("send")}
                    className="text-rose-500 text-sm font-medium underline"
                  >
                    أرسل دعاء الآن
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
