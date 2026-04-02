import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Check,
  BookOpen,
  Trash2,
  Share2,
  Trophy,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KhatmaMember {
  name: string;
  juz: number[];
}

interface Khatma {
  id: string;
  name: string;
  createdAt: string;
  members: KhatmaMember[];
  completedJuz: Record<number, string>; // juz -> member name
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const JUZ_NAMES: Record<number, string> = {
  1: "الجزء الأول",
  2: "الجزء الثاني",
  3: "الجزء الثالث",
  4: "الجزء الرابع",
  5: "الجزء الخامس",
  6: "الجزء السادس",
  7: "الجزء السابع",
  8: "الجزء الثامن",
  9: "الجزء التاسع",
  10: "الجزء العاشر",
  11: "الجزء الحادي عشر",
  12: "الجزء الثاني عشر",
  13: "الجزء الثالث عشر",
  14: "الجزء الرابع عشر",
  15: "الجزء الخامس عشر",
  16: "الجزء السادس عشر",
  17: "الجزء السابع عشر",
  18: "الجزء الثامن عشر",
  19: "الجزء التاسع عشر",
  20: "الجزء العشرون",
  21: "الجزء الحادي والعشرون",
  22: "الجزء الثاني والعشرون",
  23: "الجزء الثالث والعشرون",
  24: "الجزء الرابع والعشرون",
  25: "الجزء الخامس والعشرون",
  26: "الجزء السادس والعشرون",
  27: "الجزء السابع والعشرون",
  28: "الجزء الثامن والعشرون",
  29: "الجزء التاسع والعشرون",
  30: "الجزء الثلاثون",
};

function loadKhatmas(): Khatma[] {
  try {
    return JSON.parse(localStorage.getItem("quran_khatmas") || "[]");
  } catch {
    return [];
  }
}
function saveKhatmas(k: Khatma[]) {
  localStorage.setItem("quran_khatmas", JSON.stringify(k));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Create Khatma Modal ──────────────────────────────────────────────────────

function CreateKhatmaModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (k: Khatma) => void;
}) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<string[]>(["أنا"]);
  const [newMember, setNewMember] = useState("");

  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()]);
      setNewMember("");
    }
  };

  const removeMember = (m: string) =>
    setMembers(members.filter((x) => x !== m));

  const create = () => {
    if (!name.trim() || members.length === 0) return;
    const total = 30;
    const perMember = Math.floor(total / members.length);
    const khatmaMembers: KhatmaMember[] = members.map((m, i) => {
      const start = i * perMember + 1;
      const end = i === members.length - 1 ? 30 : start + perMember - 1;
      const juz: number[] = [];
      for (let j = start; j <= end; j++) juz.push(j);
      return { name: m, juz };
    });
    const khatma: Khatma = {
      id: genId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      members: khatmaMembers,
      completedJuz: {},
    };
    onCreate(khatma);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-t-3xl p-5 pt-[16px] pb-[107px] bg-card"
        style={{ border: "1px solid rgba(139,92,246,0.2)" }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4"
          style={{ background: "rgba(139,92,246,0.3)" }}
        />
        <h3 className="font-bold text-base mb-4 text-center">
          إنشاء ختمة جماعية
        </h3>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الختمة (مثل: ختمة رمضان)"
            className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-right"
            style={{
              border: "1px solid rgba(139,92,246,0.25)",
              background: "rgba(139,92,246,0.05)",
            }}
            dir="rtl"
          />

          <div>
            <p className="text-[11px] text-muted-foreground mb-2">
              الأعضاء ({members.length})
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {members.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    color: "#8b5cf6",
                  }}
                >
                  {m}
                  {m !== "أنا" && (
                    <button onClick={() => removeMember(m)}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
                placeholder="اسم عضو جديد..."
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none text-right border border-border"
                dir="rtl"
              />
              <button
                onClick={addMember}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.25)",
                }}
              >
                <Plus size={14} style={{ color: "#8b5cf6" }} />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            سيتم توزيع الأجزاء الثلاثين تلقائياً على الأعضاء
          </p>

          <button
            onClick={create}
            className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            }}
          >
            إنشاء الختمة
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Khatma Card ──────────────────────────────────────────────────────────────

function KhatmaCard({
  khatma,
  onUpdate,
  onDelete,
}: {
  khatma: Khatma;
  onUpdate: (k: Khatma) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = 30;
  const done = Object.keys(khatma.completedJuz).length;
  const pct = Math.round((done / total) * 100);
  const isComplete = done === total;

  const toggleJuz = (juz: number, memberName: string) => {
    const updated = { ...khatma.completedJuz };
    if (updated[juz]) delete updated[juz];
    else updated[juz] = memberName;
    onUpdate({ ...khatma, completedJuz: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-card"
      style={{
        background: isComplete
          ? "linear-gradient(145deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)"
          : undefined,
        border: isComplete
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isComplete
                ? "rgba(34,197,94,0.2)"
                : "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            {isComplete ? (
              <Trophy size={18} style={{ color: "#22c55e" }} />
            ) : (
              <BookOpen size={18} style={{ color: "#8b5cf6" }} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{khatma.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {khatma.members.length} أعضاء ·{" "}
              {new Date(khatma.createdAt).toLocaleDateString("ar-SA")}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/60"
            >
              {expanded ? (
                <ChevronUp size={14} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={14} className="text-muted-foreground" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.08)" }}
            >
              <Trash2 size={13} style={{ color: "#ef4444" }} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {done}/{total} جزء
            </span>
            <span
              className="text-[10px] font-bold"
              style={{ color: isComplete ? "#22c55e" : "#8b5cf6" }}
            >
              {pct}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: isComplete
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #8b5cf6, #7c3aed)",
              }}
            />
          </div>
        </div>

        {isComplete && (
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center text-[11px] font-bold py-1 rounded-xl"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            🎉 اكتملت الختمة! بارك الله فيكم
          </motion.p>
        )}
      </div>

      {/* Members & Juz Grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-4" dir="rtl">
              {khatma.members.map((member) => (
                <div key={member.name}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "rgba(139,92,246,0.2)",
                        color: "#8b5cf6",
                      }}
                    >
                      {member.name[0]}
                    </div>
                    <p className="text-xs font-bold">{member.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      ({member.juz.filter((j) => khatma.completedJuz[j]).length}
                      /{member.juz.length} جزء)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {member.juz.map((juz) => {
                      const isDone = !!khatma.completedJuz[juz];
                      return (
                        <button
                          key={juz}
                          onClick={() => toggleJuz(juz, member.name)}
                          className={`h-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all active:scale-95 ${!isDone ? "bg-muted/50" : ""}`}
                          style={{
                            background: isDone
                              ? "rgba(34,197,94,0.2)"
                              : undefined,
                            border: isDone
                              ? "1px solid rgba(34,197,94,0.4)"
                              : "1px solid var(--border)",
                            color: isDone ? "#22c55e" : "var(--foreground)",
                          }}
                        >
                          {isDone ? <Check size={12} /> : juz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranKhatmaPage() {
  const [khatmas, setKhatmas] = useState<Khatma[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setKhatmas(loadKhatmas());
  }, []);

  const createKhatma = (k: Khatma) => {
    const updated = [k, ...khatmas];
    setKhatmas(updated);
    saveKhatmas(updated);
    setShowCreate(false);
  };

  const updateKhatma = (updated: Khatma) => {
    const list = khatmas.map((k) => (k.id === updated.id ? updated : k));
    setKhatmas(list);
    saveKhatmas(list);
  };

  const deleteKhatma = (id: string) => {
    const list = khatmas.filter((k) => k.id !== id);
    setKhatmas(list);
    saveKhatmas(list);
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="الختمة الجماعية" subtitle="اختم القرآن مع أصدقائك" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Intro */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(145deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.03) 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
          >
            <Users size={18} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5">اختم القرآن جماعياً</p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              وزّع الأجزاء على أصدقائك وتتبعوا التقدم معاً حتى اكتمال الختمة
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ختماتي", value: khatmas.length, color: "#8b5cf6" },
            {
              label: "مكتملة",
              value: khatmas.filter(
                (k) => Object.keys(k.completedJuz).length === 30,
              ).length,
              color: "#22c55e",
            },
            {
              label: "جارية",
              value: khatmas.filter(
                (k) => Object.keys(k.completedJuz).length < 30,
              ).length,
              color: "#f59e0b",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-3 text-center bg-card border border-border/60"
            >
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Create Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          }}
        >
          <Plus size={16} />
          إنشاء ختمة جماعية جديدة
        </motion.button>

        {/* Khatmas List */}
        {khatmas.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <BookOpen size={24} style={{ color: "#8b5cf6" }} />
            </div>
            <p className="font-bold text-sm">لا توجد ختمات بعد</p>
            <p className="text-[11px] text-muted-foreground">
              أنشئ أول ختمة جماعية مع أصدقائك
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {khatmas.map((k) => (
              <KhatmaCard
                key={k.id}
                khatma={k}
                onUpdate={updateKhatma}
                onDelete={() => deleteKhatma(k.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateKhatmaModal
            onClose={() => setShowCreate(false)}
            onCreate={createKhatma}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
