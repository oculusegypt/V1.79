import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, Sparkles, Heart, BookOpen, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSessionId } from "@/lib/session";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: "💔", text: "آيات تعين على تجاوز الحزن والضيق" },
  { icon: "🤲", text: "آيات في فضل التوبة والاستغفار" },
  { icon: "💪", text: "آيات تعزز الصبر في الشدائد" },
  { icon: "🌙", text: "ما فضل قراءة القرآن في الليل؟" },
  { icon: "📖", text: "كيف أبدأ حفظ القرآن من الصفر؟" },
  { icon: "✨", text: "اقترح لي آية مناسبة لحالي الآن" },
];

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3`}
    >
      {isBot && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2 mt-auto mb-1"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div
        className="max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-[1.8]"
        style={isBot ? {
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderBottomRightRadius: 16,
          textAlign: "right",
          direction: "rtl",
        } : {
          background: "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(124,58,237,0.85))",
          color: "white",
          borderBottomLeftRadius: 4,
          textAlign: "right",
          direction: "rtl",
        }}
      >
        {msg.text}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranAiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStarted(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }));
      const systemPrompt = `أنت مساعد قرآني متخصص اسمك "نور". مهمتك مساعدة المسلم في:
- البحث عن آيات قرآنية تناسب حالته النفسية والروحية
- شرح معاني الآيات وتفسيرها بأسلوب ميسّر
- إرشاده لكيفية التعامل مع القرآن حفظاً وتلاوة وتدبراً
- اقتراح سور وآيات حسب الموضوع الذي يسأل عنه

قواعد مهمة:
- اذكر الآيات بالعربية الفصحى مع ذكر اسم السورة ورقم الآية
- اجعل ردودك دافئة وروحانية ومشجعة
- لا تتجاوز موضوع القرآن الكريم
- الرد يكون باللغة العربية دائماً
- اجعل ردودك مركزة وليست طويلة جداً`;

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text.trim(),
          history,
          systemPrompt,
          mode: "quran_ai",
        }),
      });

      if (!res.ok) throw new Error("فشل الاتصال");
      const data = await res.json();
      const botText = data.message || data.reply || data.text || "عذراً، لم أتمكن من الرد الآن. حاول مرة أخرى.";
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", text: botText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "عذراً، حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مجدداً. ﴿وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ﴾",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setMessages([]); setStarted(false); };

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <div className="shrink-0">
        <PageHeader title="مساعد القرآن الذكي" subtitle="اسأل عن أي آية أو موضوع قرآني" />
      </div>

      {!started ? (
        /* Welcome Screen */
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          {/* Hero */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Sparkles size={28} style={{ color: "#8b5cf6" }} />
            </motion.div>
            <h2 className="font-bold text-base mb-1">مساعد نور القرآني</h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed px-4">
              اسألني عن أي آية أو موضوع قرآني — سأساعدك في إيجاد الآيات المناسبة لحالك وتفسيرها بأسلوب ميسّر
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: <BookOpen size={16} style={{ color: "#8b5cf6" }} />, label: "آيات حسب الموضوع" },
              { icon: <Heart size={16} style={{ color: "#ec4899" }} />, label: "حسب حالتك النفسية" },
              { icon: <Bot size={16} style={{ color: "#22c55e" }} />, label: "تفسير ميسّر" },
            ].map(f => (
              <div key={f.label} className="rounded-xl p-3 text-center flex flex-col items-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {f.icon}
                <p className="text-[10px] text-muted-foreground leading-tight">{f.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <p className="text-[11px] font-bold text-muted-foreground mb-3">اقتراحات سريعة:</p>
          <div className="flex flex-col gap-2">
            {QUICK_PROMPTS.map((p, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-3 p-3.5 rounded-xl text-right active:scale-[0.98] transition-all"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <span className="text-lg shrink-0">{p.icon}</span>
                <p className="text-[13px] flex-1">{p.text}</p>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        /* Chat Screen */
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background: "#8b5cf6" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 pb-24 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {started && (
          <div className="flex justify-end mb-2">
            <button onClick={reset} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw size={10} /> محادثة جديدة
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="اسأل عن آية أو موضوع قرآني..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm bg-transparent outline-none text-right"
            style={{ border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.05)" }}
            dir="rtl"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
