import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { recordEvent } from "@/components/live-stats";

const DURATIONS = [
  { days: 7, label: "٧ أيام", desc: "أسبوع من البداية الجديدة" },
  { days: 21, label: "٢١ يوماً", desc: "وقت كافٍ لتكوين عادة" },
  { days: 40, label: "٤٠ يوماً", desc: "عدد أيام التوبة والصفاء" },
  { days: 90, label: "٩٠ يوماً", desc: "ثلاثة أشهر تحوّل الحياة" },
];

export default function ChallengeCreate() {
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState<number | null>(null);
  const [pledge, setPledge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleCreate = async () => {
    if (!duration) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, pledge: pledge.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطأ");
      recordEvent("tawbah");
      setLocation(`/challenge/${data.slug}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="تحدي التوبة" subtitle="ألزم نفسك بالاستقامة وشارك رحلتك" icon={<Swords size={16} />} />
      <div className="flex-1 flex flex-col bg-background p-6" dir="rtl">

      <div className="mb-4 bg-primary/5 border border-primary/15 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          ابدأ تحدياً وشارك رابطه مع من تثق به ليشهد على تحوّلك ويشجّعك بدعاء
        </p>
      </div>

      <h2 className="text-base font-bold text-foreground mb-3">اختر مدة التحدي</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {DURATIONS.map(d => (
          <motion.button
            key={d.days}
            whileTap={{ scale: 0.96 }}
            onClick={() => setDuration(d.days)}
            className={`p-4 rounded-2xl border-2 text-right transition-all ${
              duration === d.days
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            <p className="text-lg font-bold text-foreground">{d.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          وعدك لنفسك <span className="text-muted-foreground font-normal">(اختياري)</span>
        </label>
        <textarea
          value={pledge}
          onChange={e => setPledge(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="أعاهد الله أن أبتعد عن... وأن ألتزم بـ..."
          className="w-full bg-card border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-left">{pledge.length}/200</p>
      </div>

      {error && <p className="text-sm text-destructive mb-3 text-center">{error}</p>}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCreate}
        disabled={!duration || loading}
        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-40"
      >
        {loading ? "جارٍ إنشاء التحدي..." : "ابدأ التحدي ← شارك الرابط"}
      </motion.button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        لا يُحفظ اسمك — التحدي مجهول الهوية تماماً
      </p>
      </div>
    </>
  );
}
