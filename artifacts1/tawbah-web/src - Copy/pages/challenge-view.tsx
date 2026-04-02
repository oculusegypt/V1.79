import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Heart, Share2, CheckCircle2, Clock, Swords } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type ChallengeData = {
  slug: string;
  duration: number;
  pledge: string | null;
  startDate: string;
  daysPassed: number;
  encouragements: number;
};

const DURATION_LABELS: Record<number, string> = {
  7: "٧ أيام",
  21: "٢١ يوماً",
  40: "٤٠ يوماً",
  90: "٩٠ يوماً",
};

function toArabicNumerals(n: number) {
  return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function ChallengeView() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/challenge/:slug");
  const slug = params?.slug ?? "";

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [data, setData] = useState<ChallengeData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [encouraged, setEncouraged] = useState(false);
  const [encouraging, setEncouraging] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/api/challenges/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  const handleEncourage = async () => {
    if (encouraged || !data) return;
    setEncouraging(true);
    await fetch(`${BASE}/api/challenges/${slug}/encourage`, { method: "POST" });
    setData(d => d ? { ...d, encouragements: d.encouragements + 1 } : d);
    setEncouraged(true);
    setEncouraging(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `أحدهم بدأ رحلة توبة لمدة ${DURATION_LABELS[data?.duration ?? 7]}.\n🌿 ادعُ له بالثبات:\n${url}`;
    if (navigator.share) {
      await navigator.share({ text, url });
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (notFound) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-xl font-bold text-foreground mb-2">التحدي غير موجود</h1>
      <p className="text-muted-foreground text-sm mb-6">ربما انتهى أو الرابط خاطئ</p>
      <button onClick={() => setLocation("/")} className="text-primary font-medium">
        العودة للرئيسية
      </button>
    </div>
  );

  if (!data) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const pct = Math.round((data.daysPassed / data.duration) * 100);
  const done = data.daysPassed >= data.duration;
  const remaining = data.duration - data.daysPassed;

  return (
    <>
      <PageHeader title="تحدي التوبة" subtitle="استمر في رحلتك نحو الاستقامة" icon={<Swords size={16} />} />
      <div className="flex-1 flex flex-col bg-background p-6" dir="rtl">

      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl ${
            done ? "bg-primary/10 text-primary" : "bg-primary/10"
          }`}
        >
          {done ? <CheckCircle2 size={40} className="text-primary" /> : <Clock size={40} className="text-primary" />}
        </motion.div>
        <h1 className="text-xl font-display font-bold text-foreground mb-1">
          {done ? "🎉 أتمّ التحدي!" : "رحلة توبة جارية"}
        </h1>
        <p className="text-muted-foreground text-sm">
          تحدي {DURATION_LABELS[data.duration]}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>اليوم {toArabicNumerals(data.daysPassed)} من {toArabicNumerals(data.duration)}</span>
          <span>{toArabicNumerals(pct)}٪</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        {!done && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {toArabicNumerals(remaining)} يوم متبقٍّ
          </p>
        )}
      </div>

      {data.pledge && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1 font-medium">وعده لنفسه</p>
          <p className="text-sm text-foreground leading-relaxed italic">"{data.pledge}"</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">أدعية الداعمين</p>
          <p className="text-2xl font-bold text-primary">{toArabicNumerals(data.encouragements)}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleEncourage}
          disabled={encouraged || encouraging}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            encouraged
              ? "bg-primary/20 text-primary"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Heart size={18} fill={encouraged ? "currentColor" : "none"} />
          {encouraged ? "أرسلت دعاءك" : "ادعُ له"}
        </motion.button>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleShare}
        className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-bold text-base flex items-center justify-center gap-2"
      >
        <Share2 size={20} />
        {shared ? "نُسخ الرابط ✓" : "شارك التحدي — ادعُ له"}
      </motion.button>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground mb-3">هل أنت صاحب هذا التحدي؟</p>
        <button
          onClick={() => setLocation("/challenge/create")}
          className="text-xs text-primary underline"
        >
          أنشئ تحدياً جديداً لنفسك
        </button>
      </div>
      </div>
    </>
  );
}
