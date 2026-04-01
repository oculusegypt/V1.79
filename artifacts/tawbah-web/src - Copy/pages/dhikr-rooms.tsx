import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Zap, Globe, Star, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "wouter";

interface Room {
  type: string;
  totalCount: number;
  activeNow: number;
}

const ROOM_META: Record<string, {
  label: string;
  arabic: string;
  full: string;
  color: string;
  glow: string;
  bg: string;
  darkBg: string;
  emoji: string;
  reward: string;
}> = {
  istighfar: {
    label: "الاستغفار",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    full: "أستغفر الله العظيم وأتوب إليه",
    color: "#10b981",
    glow: "rgba(16,185,129,0.4)",
    bg: "from-emerald-500/15 to-teal-500/5",
    darkBg: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    emoji: "🌿",
    reward: "يمحو الذنوب ويفتح الأبواب",
  },
  tasbih: {
    label: "التسبيح",
    arabic: "سُبْحَانَ اللَّهِ",
    full: "سبحان الله وبحمده سبحان الله العظيم",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.4)",
    bg: "from-blue-500/15 to-indigo-500/5",
    darkBg: "linear-gradient(135deg, #0c1c3c 0%, #1e3a5f 100%)",
    emoji: "💎",
    reward: "خفيفتان على اللسان ثقيلتان في الميزان",
  },
  tahmid: {
    label: "التحميد",
    arabic: "الْحَمْدُ لِلَّهِ",
    full: "الحمد لله رب العالمين حمداً كثيراً طيباً",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
    bg: "from-amber-500/15 to-yellow-500/5",
    darkBg: "linear-gradient(135deg, #2c1a00 0%, #4a2e00 100%)",
    emoji: "✨",
    reward: "تملأ الميزان يوم القيامة",
  },
  salawat: {
    label: "الصلاة على النبي",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّد",
    full: "اللهم صلِّ على محمد وعلى آل محمد",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.4)",
    bg: "from-rose-500/15 to-pink-500/5",
    darkBg: "linear-gradient(135deg, #2c0818 0%, #4a1128 100%)",
    emoji: "🌸",
    reward: "من صلى عليّ عشراً صلى الله عليه مئة",
  },
  tahlil: {
    label: "التهليل",
    arabic: "لَا إِلَهَ إِلَّا اللَّه",
    full: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
    bg: "from-violet-500/15 to-purple-500/5",
    darkBg: "linear-gradient(135deg, #1a0c3c 0%, #2d1b5e 100%)",
    emoji: "🔑",
    reward: "مفتاح الجنة وأفضل ما قاله النبيون",
  },
  takbir: {
    label: "التكبير",
    arabic: "اللَّهُ أَكْبَر",
    full: "الله أكبر كبيراً والحمد لله كثيراً",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.4)",
    bg: "from-orange-500/15 to-red-500/5",
    darkBg: "linear-gradient(135deg, #2c1000 0%, #4a1a00 100%)",
    emoji: "🌟",
    reward: "تملأ ما بين السماء والأرض",
  },
};

const ROOM_ORDER = ["istighfar", "tasbih", "tahmid", "salawat", "tahlil", "takbir"];

const AYAH = {
  text: "وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا",
  ref: "الأحزاب: ٣٥",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ألف";
  return n.toLocaleString("ar-EG");
}

function LiveDot() {
  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-400"
      animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function GlobalCounter({ rooms }: { rooms: Room[] }) {
  const total = rooms.reduce((s, r) => s + r.totalCount, 0);
  const active = rooms.reduce((s, r) => s + r.activeNow, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[22px] p-4"
      style={{
        background: "linear-gradient(135deg, #0c1a2e 0%, #0f2340 50%, #0a1828 100%)",
        border: "1px solid rgba(96,165,250,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Glow */}
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(96,165,250,0.18) 0%, transparent 100%)",
      }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} style={{ color: "#60a5fa" }} />
            <span className="text-sm font-bold" style={{ color: "#93c5fd" }}>العداد العالمي المشترك</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LiveDot />
            <span className="text-[11px]" style={{ color: "#6ee7b7" }}>{active} الآن</span>
          </div>
        </div>

        <motion.p
          key={total}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="text-4xl font-black text-center mb-1"
          style={{
            background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {formatCount(total)}
        </motion.p>
        <p className="text-center text-[11px]" style={{ color: "rgba(147,197,253,0.55)" }}>
          ذكرٌ مشترك منذ الإطلاق
        </p>

        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(96,165,250,0.12)" }}>
          <div className="flex justify-between">
            {ROOM_ORDER.slice(0, 3).map(type => {
              const meta = ROOM_META[type]!;
              const room = rooms.find(r => r.type === type);
              return (
                <div key={type} className="flex-1 text-center">
                  <p className="text-sm" style={{ fontSize: 18 }}>{meta.emoji}</p>
                  <p className="text-[10px] font-bold" style={{ color: meta.color }}>
                    {formatCount(room?.totalCount ?? 0)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoomCard({ room, rank }: { room: Room; rank: number }) {
  const meta = ROOM_META[room.type];
  if (!meta) return null;

  const qc = useQueryClient();
  const [localCount, setLocalCount] = useState(room.totalCount);
  const [sessionCount, setSessionCount] = useState(0);
  const [burst, setBurst] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [milestone, setMilestone] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setLocalCount(room.totalCount); }, [room.totalCount]);

  const tapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dhikr-rooms/${room.type}/tap`, { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.totalCount) setLocalCount(data.totalCount);
      qc.invalidateQueries({ queryKey: ["dhikr-rooms"] });
    },
  });

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    }

    const next = sessionCount + 1;
    setSessionCount(next);
    setLocalCount(c => c + 1);
    setBurst(true);
    setTimeout(() => setBurst(false), 150);

    if (next === 33 || next === 99 || next === 100) {
      setMilestone(next);
      setTimeout(() => setMilestone(null), 2000);
    }

    if (navigator.vibrate) navigator.vibrate(8);
    tapMutation.mutate();
  }, [sessionCount, tapMutation]);

  const sessionPct = Math.min((sessionCount / 33) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background: meta.darkBg,
        border: `1px solid ${meta.color}28`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 0px ${meta.color}00`,
      }}
    >
      {/* Glow top */}
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${meta.color}18 0%, transparent 100%)`,
      }} />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
              {meta.emoji}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{meta.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <LiveDot />
                <span className="text-[10px]" style={{ color: `${meta.color}99` }}>
                  {room.activeNow} يذكرون الآن
                </span>
              </div>
            </div>
          </div>
          <div className="text-left">
            <motion.p
              key={localCount}
              initial={{ scale: 1.2, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-black"
              style={{ color: meta.color }}
            >
              {formatCount(localCount)}
            </motion.p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>إجمالي</p>
          </div>
        </div>

        {/* Arabic full text */}
        <div className="rounded-xl px-3 py-2 mb-3" style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <p className="text-center text-[13px] font-bold leading-relaxed"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Amiri Quran', serif" }}>
            {meta.full}
          </p>
        </div>

        {/* Session progress */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              جلستك: {sessionCount}
            </span>
            <span className="text-[10px]" style={{ color: meta.color }}>
              {sessionCount >= 99 ? "✓ مئة" : sessionCount >= 33 ? "✓ ثلاث وثلاثون" : `/${33}`}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to left, ${meta.color}, ${meta.color}80)` }}
              animate={{ width: `${sessionPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Tap button */}
        <button
          ref={buttonRef}
          onClick={handleTap}
          className="relative overflow-hidden w-full py-4 rounded-[18px] font-black text-lg transition-transform select-none"
          style={{
            background: `linear-gradient(135deg, ${meta.color}30 0%, ${meta.color}15 100%)`,
            border: `2px solid ${meta.color}55`,
            color: meta.color,
            transform: burst ? "scale(0.97)" : "scale(1)",
            boxShadow: burst ? `0 0 20px ${meta.glow}` : `0 4px 16px rgba(0,0,0,0.3)`,
            transition: "transform 0.1s, box-shadow 0.15s",
          }}
        >
          <AnimatePresence>
            {ripples.map(r => (
              <motion.span
                key={r.id}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute rounded-full pointer-events-none"
                style={{ width: 50, height: 50, left: r.x - 25, top: r.y - 25, background: `${meta.color}35` }}
              />
            ))}
          </AnimatePresence>
          <motion.span
            key={sessionCount}
            initial={{ y: -6, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
            style={{ fontFamily: "'Amiri Quran', serif" }}
          >
            {meta.arabic}
          </motion.span>
        </button>

        {/* Reward text */}
        <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          ✨ {meta.reward}
        </p>
      </div>

      {/* Milestone toast */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 py-3 rounded-2xl z-20"
            style={{
              background: `linear-gradient(135deg, ${meta.color}35 0%, ${meta.color}20 100%)`,
              border: `1px solid ${meta.color}60`,
              backdropFilter: "blur(8px)",
            }}
          >
            <CheckCircle size={16} style={{ color: meta.color }} />
            <span className="font-bold text-sm" style={{ color: meta.color }}>
              {milestone === 33 ? "أحسنت — ثلاث وثلاثون! 🎉" :
               milestone === 99 ? "تسع وتسعون — ما شاء الله! 🌟" :
               "مئة كاملة — بارك الله فيك! 💎"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FakeFallbackRooms(): Room[] {
  return ROOM_ORDER.map(type => ({ type, totalCount: 0, activeNow: 0 }));
}

export default function DhikrRooms() {
  const { data, isLoading } = useQuery<{ rooms: Room[] }>({
    queryKey: ["dhikr-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/dhikr-rooms");
      return res.json();
    },
    refetchInterval: 8000,
  });

  const allRoomTypes = ROOM_ORDER;
  const roomsFromApi = data?.rooms ?? [];
  const rooms: Room[] = allRoomTypes.map(type => {
    const found = roomsFromApi.find(r => r.type === type);
    return found ?? { type, totalCount: 0, activeNow: 0 };
  });

  return (
    <div className="flex flex-col flex-1 pb-10 bg-background min-h-screen" dir="rtl">
      <PageHeader
        title="غرف الذكر الجماعي"
        subtitle="سبّح مع آلاف المسلمين حول العالم"
        icon={<Users size={16} />}
      />

      <div className="px-4 pt-3 flex flex-col gap-4">

        {/* Global counter */}
        {!isLoading && <GlobalCounter rooms={rooms} />}

        {/* Quran banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[18px] px-4 py-3 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <p className="text-[13px] font-bold leading-loose mb-1"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Amiri Quran', serif" }}>
            ﴿{AYAH.text}﴾
          </p>
          <p className="text-[10px]" style={{ color: "rgba(16,185,129,0.6)" }}>{AYAH.ref}</p>
        </motion.div>

        {/* Tip */}
        <div className="flex items-center gap-2 px-1">
          <Zap size={13} className="text-amber-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            كل نقرة تُضاف لعداد إخوانك حول العالم — لا أسماء ولا هويات، فقط ذكرٌ خالص
          </p>
        </div>

        {/* Room cards */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">جارٍ الاتصال بالغرف...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rooms.map((room, i) => (
              <RoomCard key={room.type} room={room} rank={i} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="rounded-[18px] p-4 text-center" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star size={13} className="text-amber-400" />
            <p className="text-xs font-bold text-foreground">فضل الذكر</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            «خذوا جُنَّتكم من النار — قولوا: سبحان الله والحمد لله ولا إله إلا الله والله أكبر»<br />
            <span className="text-[10px] opacity-60">رواه النسائي</span>
          </p>
        </div>

        <div className="flex justify-center">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground px-4 py-2 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
              <ArrowRight size={13} />
              العودة للرئيسية
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
