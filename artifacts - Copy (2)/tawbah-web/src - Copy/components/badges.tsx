import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Share2, X } from "lucide-react";
import { useAppUserProgress, useAppDhikrCount } from "@/hooks/use-app-data";

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  shareText: string;
  unlocked: boolean;
  color: string;
  glow: string;
}

function getSosCount(): number {
  try { return parseInt(localStorage.getItem("sos_count") || "0", 10); } catch { return 0; }
}

export function useBadges(): Badge[] {
  const { data: progress } = useAppUserProgress();
  const { data: dhikr } = useAppDhikrCount();
  const sosCount = getSosCount();

  const streak = progress?.streakDays || 0;
  const day40 = progress?.day40Progress || 0;
  const signed = progress?.covenantSigned || false;
  const istighfar = dhikr?.istighfar || 0;

  return [
    {
      id: "seed",
      icon: "🌱",
      name: "بذرة التوبة",
      desc: "وقّعت معاهدتك مع الله",
      shareText: "وقّعت اليوم معاهدة التوبة مع الله 🌱 — بدأت رحلة جديدة نحو الله. #رحلة_التوبة",
      unlocked: signed,
      color: "from-emerald-400/20 to-emerald-600/5 border-emerald-400/40",
      glow: "shadow-emerald-400/30",
    },
    {
      id: "three_days",
      icon: "🔥",
      name: "3 أيام متواصلة",
      desc: "ثبتّ على العبادة 3 أيام",
      shareText: "أتممت 3 أيام متواصلة في رحلة التوبة 🔥 — الله يُعين من يصبر. #رحلة_التوبة",
      unlocked: streak >= 3,
      color: "from-orange-400/20 to-orange-600/5 border-orange-400/40",
      glow: "shadow-orange-400/30",
    },
    {
      id: "week",
      icon: "🌙",
      name: "أسبوع إيمان",
      desc: "7 أيام متواصلة من الالتزام",
      shareText: "أسبوع كامل على طاعة الله 🌙 — سبعة أيام تُكتب في ميزان حسناتي. #رحلة_التوبة",
      unlocked: streak >= 7,
      color: "from-indigo-400/20 to-indigo-600/5 border-indigo-400/40",
      glow: "shadow-indigo-400/30",
    },
    {
      id: "halfway",
      icon: "⭐",
      name: "نصف الطريق",
      desc: "15 يوماً من الثبات",
      shareText: "وصلت اليوم 15 في رحلة التوبة ⭐ — نصف الطريق بفضل الله. #رحلة_التوبة",
      unlocked: day40 >= 15 || streak >= 15,
      color: "from-yellow-400/20 to-yellow-600/5 border-yellow-400/40",
      glow: "shadow-yellow-400/30",
    },
    {
      id: "thirty",
      icon: "🏆",
      name: "30 يوم مجيد",
      desc: "ثلاثون يوماً من الثبات",
      shareText: "30 يوماً على طاعة الله! 🏆 — من داوم انتصر. الحمد لله. #رحلة_التوبة",
      unlocked: day40 >= 30 || streak >= 30,
      color: "from-amber-400/20 to-amber-600/5 border-amber-400/40",
      glow: "shadow-amber-400/30",
    },
    {
      id: "istighfar_100",
      icon: "📿",
      name: "مئة استغفار",
      desc: "أتممت 100 استغفار في يوم واحد",
      shareText: "قلت 100 استغفار اليوم 📿 — «التائب من الذنب كمن لا ذنب له». #رحلة_التوبة",
      unlocked: istighfar >= 100,
      color: "from-violet-400/20 to-violet-600/5 border-violet-400/40",
      glow: "shadow-violet-400/30",
    },
    {
      id: "warrior",
      icon: "🛡️",
      name: "محارب النفس",
      desc: "لجأت لله في لحظة ضعف ونجوت",
      shareText: "طلبت الله في لحظة صعبة وانتصرت 🛡️ — الجهاد الأكبر هو جهاد النفس. #رحلة_التوبة",
      unlocked: sosCount >= 1,
      color: "from-rose-400/20 to-rose-600/5 border-rose-400/40",
      glow: "shadow-rose-400/30",
    },
  ];
}

function BadgeShareModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = badge.shareText + "\n\nhttps://tawbah.app";
    if (navigator.share) {
      try {
        await navigator.share({ text, title: badge.name });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-1 pb-4">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        <div className={`bg-gradient-to-br ${badge.color} rounded-2xl p-6 text-center mb-5 border shadow-lg ${badge.glow}`}>
          <div className="text-5xl mb-3">{badge.icon}</div>
          <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
          <p className="text-sm text-muted-foreground">{badge.desc}</p>
        </div>

        <div className="bg-muted/40 rounded-xl p-4 mb-5 text-sm text-muted-foreground leading-relaxed text-right border border-border/50">
          {badge.shareText}
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        >
          <Share2 size={18} />
          {copied ? "تم النسخ! ✓" : "شارك هذا الإنجاز"}
        </button>

        <button onClick={onClose} className="w-full py-3 text-muted-foreground text-sm mt-2">
          إغلاق
        </button>
      </motion.div>
    </motion.div>
  );
}

export function BadgesSection() {
  const badges = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🏅</span>
            <h2 className="font-bold text-sm">الأوسمة والإنجازات</h2>
          </div>
          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-bold">
            {unlockedCount}/{badges.length}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge, i) => (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => badge.unlocked && setSelectedBadge(badge)}
              disabled={!badge.unlocked}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                badge.unlocked
                  ? `bg-gradient-to-br ${badge.color} active:scale-95 shadow-sm ${badge.glow}`
                  : "bg-muted/30 border-border/40 opacity-40 cursor-not-allowed grayscale"
              }`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className={`text-[9px] font-bold text-center leading-tight ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {badge.name}
              </span>
            </motion.button>
          ))}
        </div>

        {unlockedCount > 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            اضغط على أي وسام لمشاركته 🌿
          </p>
        )}
      </div>

      <AnimatePresence>
        {selectedBadge && (
          <BadgeShareModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
