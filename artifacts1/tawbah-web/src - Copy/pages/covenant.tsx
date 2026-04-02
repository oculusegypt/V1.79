import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Shield, ChevronLeft, ChevronUp, AlertTriangle, Sparkles,
  Mic, MicOff, Send, RotateCcw, X, Flame, BookOpen,
  HandHeart, Users, ScrollText, ArrowRight,
} from "lucide-react";
import { useAppCreateCovenant } from "@/hooks/use-app-data";
import { recordEvent } from "@/components/live-stats";
import {
  SINS, CATEGORY_META, SIN_CATEGORY_ORDER,
  saveSelectedSins, getPrimaryApiCategory,
  type Sin, type SinCategory,
} from "@/lib/sins-data";

type Step = "select" | "review";
type DetectResult = { matchedIds: string[]; transcription: string; explanation: string };

// ─── Category icons map ───────────────────────────────────────────────────────
const CAT_ICONS: Record<SinCategory, React.ReactNode> = {
  with_kaffarah: <ScrollText size={14} />,
  major: <Flame size={14} />,
  common: <BookOpen size={14} />,
  huquq_ibad: <Users size={14} />,
};

// ─── AI Detector ─────────────────────────────────────────────────────────────
function AiSinDetector({
  onDetected,
  onClose,
}: {
  onDetected: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const ab = await blob.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
        await detect(undefined, b64);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      setError("تعذّر الوصول للميكروفون.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setRecording(false);
  };

  const detect = async (descText?: string, audioBase64?: string) => {
    const description = descText ?? text.trim();
    if (!description && !audioBase64) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const sinsLookup = SINS.map((s) => ({ id: s.id, name: s.name, category: s.category, description: s.desc }));
      const res = await fetch("/api/detect-sins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, audioBase64, sinsLookup }),
      });
      const data = (await res.json()) as DetectResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "خطأ في الخادم");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onDetected(result.matchedIds);
    setResult(null);
    setText("");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mb-3 rounded-2xl overflow-hidden border border-primary/25 shadow-lg shadow-primary/10"
      style={{ background: "var(--card)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50"
        style={{ background: "linear-gradient(to left, rgba(var(--primary-rgb,99,102,241),0.06), transparent)" }}>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles size={13} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-primary">كشف الذنب بالذكاء الاصطناعي</p>
          <p className="text-[10px] text-muted-foreground">صف حالك وسيحدد الذنوب تلقائياً</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <X size={13} className="text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Input area */}
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="مثال: «أنا أشاهد أشياء محرمة على الإنترنت وأضيّع صلاة الفجر كثيراً»"
            rows={3}
            disabled={loading || recording}
            className="flex-1 bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50 placeholder:text-[11px] leading-relaxed transition-all"
            dir="rtl"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                recording ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/60"
              }`}
            >
              {recording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button
              onClick={() => detect()}
              disabled={!text.trim() || loading || recording}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-all hover:brightness-105 shadow-md shadow-primary/25"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>

        {recording && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            يتم التسجيل... {recordingSeconds}ث — اضغط ⏹ للإيقاف
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {result.transcription && (
                <p className="text-[11px] text-muted-foreground mb-2 italic border-r-2 border-primary/30 pr-2">«{result.transcription}»</p>
              )}
              {result.matchedIds.length === 0 ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">لم يُعثَر على ذنب مطابق. حدّد يدوياً من القائمة.</p>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {result.explanation && <span>{result.explanation} — </span>}
                    وجدتُ <span className="font-bold text-primary">{result.matchedIds.length}</span> {result.matchedIds.length === 1 ? "ذنب" : "ذنوب"} مطابق:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.matchedIds.map((id) => {
                      const sin = SINS.find((s) => s.id === id);
                      if (!sin) return null;
                      const meta = CATEGORY_META[sin.category];
                      return (
                        <span key={id} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.borderColor}`}>
                          {sin.icon} {sin.name}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleConfirm} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-xs font-bold shadow-md shadow-primary/20 hover:brightness-105 transition-all active:scale-[0.98]">
                      <Check size={13} />
                      أضفها لاختياراتي
                    </button>
                    <button onClick={() => setResult(null)} className="px-3 py-2.5 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors">
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Sin Card ─────────────────────────────────────────────────────────────────
function SinCard({ sin, selected, onToggle }: { sin: Sin; selected: boolean; onToggle: () => void }) {
  const meta = CATEGORY_META[sin.category];
  return (
    <motion.button
      layout
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={`w-full text-right rounded-2xl border transition-all duration-200 overflow-hidden ${
        selected
          ? `${meta.bg} ${meta.borderColor} shadow-md`
          : "bg-card border-border hover:border-border/60 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <div
          className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected ? "border-transparent bg-primary shadow-md shadow-primary/30" : "border-muted-foreground/25"
          }`}
        >
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                <Check size={12} strokeWidth={3} className="text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Icon */}
        <span className="text-2xl shrink-0 leading-none">{sin.icon}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-[13.5px] leading-tight ${selected ? meta.color : "text-foreground"}`}>{sin.name}</p>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{sin.desc}</p>
        </div>

        {/* Kaffarah badge */}
        {sin.kaffarahId && (
          <div className="shrink-0 flex items-center gap-1 bg-red-500/10 border border-red-400/20 rounded-lg px-1.5 py-0.5">
            <AlertTriangle size={9} className="text-red-500" />
            <span className="text-[9px] font-bold text-red-500">كفارة</span>
          </div>
        )}
      </div>

      {/* Selected indicator bottom bar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className={`h-[2px] w-full origin-right`}
            style={{ background: `var(--primary)` }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Collapsible category group (for "all" view) ─────────────────────────────
function SinCategoryGroup({
  category,
  sins,
  selectedIds,
  onToggle,
  defaultExpanded = true,
}: {
  category: SinCategory;
  sins: Sin[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = CATEGORY_META[category];
  const icon = CAT_ICONS[category];
  const selectedCount = sins.filter((s) => selectedIds.has(s.id)).length;

  return (
    <div className={`rounded-2xl border overflow-hidden ${meta.borderColor}`}
      style={{ background: "var(--card)" }}>
      {/* Group header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-right transition-colors ${meta.bg}`}
      >
        <div className={`w-8 h-8 rounded-xl ${meta.bg} border ${meta.borderColor} flex items-center justify-center shrink-0`}>
          <span className={meta.color}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold leading-tight ${meta.color}`}>{meta.groupLabel}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{sins.length} ذنب في هذا التصنيف</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedCount > 0 && (
            <motion.span
              key={selectedCount}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="text-[10px] font-bold text-primary bg-primary/12 border border-primary/20 px-2 py-0.5 rounded-full"
            >
              {selectedCount} ✓
            </motion.span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            <ChevronUp size={15} />
          </motion.div>
        </div>
      </button>

      {/* Sin cards */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-3 flex flex-col gap-2">
              {sins.map((sin) => (
                <SinCard
                  key={sin.id}
                  sin={sin}
                  selected={selectedIds.has(sin.id)}
                  onToggle={() => onToggle(sin.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {(["select", "review"] as Step[]).map((s, i) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            step === s ? "w-6 h-2 bg-primary" : step === "review" && i === 0 ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Covenant Seal ────────────────────────────────────────────────────────────
function CovenantSeal() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 16 }}
      className="flex flex-col items-center mb-2"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          boxShadow: "0 8px 32px rgba(5,150,105,0.35), 0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <HandHeart size={34} className="text-white" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-2 flex items-center gap-1.5"
      >
        <div className="h-px w-10 bg-emerald-500/30 rounded" />
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">الميثاق مع الله</span>
        <div className="h-px w-10 bg-emerald-500/30 rounded" />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Covenant() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<SinCategory | "all">("all");
  const [showAI, setShowAI] = useState(false);
  const createCovenant = useAppCreateCovenant();
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selected_sins");
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setSelectedIds(new Set(ids));
      }
    } catch {}
  }, []);

  const toggleSin = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAiDetected = (ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setShowAI(false);
  };

  const selectedSins = SINS.filter((s) => selectedIds.has(s.id));
  const hasKaffarah = selectedSins.some((s) => s.kaffarahId);
  const canProceed = selectedIds.size > 0;

  const handleSign = () => {
    const primaryCategory = getPrimaryApiCategory(selectedSins);
    saveSelectedSins(selectedSins);
    createCovenant.mutate({ sinCategory: primaryCategory }, {
      onSuccess: () => {
        recordEvent("covenant");
        setLocation("/day-one");
      },
    });
  };

  const filteredSins = activeCategory === "all" ? SINS : SINS.filter((s) => s.category === activeCategory);

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation("/");
  };

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      <AnimatePresence mode="wait">
        {/* ══════════════ STEP 1: SELECT ══════════════ */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* ── Custom Header ── */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40">
              <div className="flex items-center h-14 px-2 relative">
                <button
                  onClick={handleBack}
                  className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                >
                  <ArrowRight size={20} />
                </button>
                <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-primary" />
                    <h1 className="font-bold text-base text-foreground">حدّد ذنبك</h1>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ابنِ خطتك الشخصية للتوبة</p>
                </div>
                {/* AI trigger button */}
                <div className="mr-auto shrink-0">
                  <button
                    onClick={() => setShowAI((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      showAI ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-primary/8 text-primary border-primary/25 hover:bg-primary/15"
                    }`}
                  >
                    <Sparkles size={12} />
                    AI
                  </button>
                </div>
              </div>

              {/* Step dots */}
              <StepDots step={step} />
            </div>

            {/* ── Hero mini-banner ── */}
            <div className="mx-4 mt-3 mb-1 rounded-2xl overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, rgba(var(--primary-rgb,99,102,241),0.12) 0%, rgba(var(--primary-rgb,99,102,241),0.04) 100%)" }}>
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 80% 20%, var(--primary) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
              <div className="relative px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Shield size={16} className="text-primary" />
                </div>
                <p className="text-[12px] leading-relaxed text-foreground/75 flex-1" dir="rtl">
                  اختر ما تريد التوبة منه — يمكنك اختيار أكثر من ذنب وستُبنى خطتك تلقائياً.
                </p>
              </div>
            </div>

            {/* ── AI Detector (collapsible) ── */}
            <AnimatePresence>
              {showAI && (
                <div className="mt-2">
                  <AiSinDetector onDetected={handleAiDetected} onClose={() => setShowAI(false)} />
                </div>
              )}
            </AnimatePresence>

            {/* ── Category tabs ── */}
            <div
              ref={tabsRef}
              className="sticky top-[88px] z-20 bg-background/95 backdrop-blur-sm px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border/30"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {([
                { id: "all", label: "الكل", icon: null, count: SINS.length },
                ...SIN_CATEGORY_ORDER.map((cat) => ({
                  id: cat,
                  label: CATEGORY_META[cat].groupLabel,
                  icon: CAT_ICONS[cat],
                  count: SINS.filter((s) => s.category === cat).length,
                })),
              ] as { id: SinCategory | "all"; label: string; icon: React.ReactNode; count: number }[]).map((tab) => {
                const isActive = activeCategory === tab.id;
                const meta = tab.id !== "all" ? CATEGORY_META[tab.id as SinCategory] : null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all shrink-0 ${
                      isActive
                        ? meta
                          ? `${meta.bg} ${meta.color} ${meta.borderColor} shadow-sm`
                          : "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.label}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded-md font-bold ${isActive ? "bg-black/10" : "bg-muted-foreground/15"}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Sin list ── */}
            <div className="flex-1 px-4 pt-3 pb-28 flex flex-col gap-3 overflow-y-auto">
              {activeCategory === "all"
                ? SIN_CATEGORY_ORDER.map((cat) => {
                    const sinsInCat = SINS.filter((s) => s.category === cat);
                    return (
                      <SinCategoryGroup
                        key={cat}
                        category={cat}
                        sins={sinsInCat}
                        selectedIds={selectedIds}
                        onToggle={toggleSin}
                        defaultExpanded={cat === "major" || cat === "common"}
                      />
                    );
                  })
                : (
                  <div className="flex flex-col gap-2">
                    {filteredSins.map((sin) => (
                      <SinCard key={sin.id} sin={sin} selected={selectedIds.has(sin.id)} onToggle={() => toggleSin(sin.id)} />
                    ))}
                    {filteredSins.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">لا توجد ذنوب في هذا التصنيف</div>
                    )}
                  </div>
                )}
            </div>

            {/* ── Floating footer (appears only when sin selected, above nav + Zaki) ── */}
            <AnimatePresence>
              {canProceed && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="fixed inset-x-0 z-[55] px-4 max-w-md mx-auto"
                  style={{ bottom: "108px" }}
                >
                  <div
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-border/60 shadow-2xl"
                    style={{
                      background: "color-mix(in srgb, var(--background) 88%, transparent)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                    }}
                  >
                    {/* Count badge */}
                    <motion.div
                      key={selectedIds.size}
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="shrink-0 w-[46px] h-[46px] rounded-xl bg-primary/12 border border-primary/25 flex flex-col items-center justify-center gap-0.5"
                    >
                      <span className="text-base font-black text-primary leading-none">{selectedIds.size}</span>
                      <span className="text-[8px] font-bold text-muted-foreground">ذنب</span>
                    </motion.div>

                    {/* Next button */}
                    <motion.button
                      onClick={() => setStep("review")}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 h-[46px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                      style={{
                        background: "linear-gradient(to left, var(--primary), color-mix(in srgb, var(--primary) 80%, #6366f1))",
                        color: "var(--primary-foreground)",
                        boxShadow: "0 4px 16px rgba(var(--primary-rgb,99,102,241),0.40)",
                      }}
                    >
                      <span>التالي — مراجعة وتوقيع</span>
                      <ChevronLeft size={15} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══════════════ STEP 2: REVIEW ══════════════ */}
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* ── Custom Header ── */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40">
              <div className="flex items-center h-14 px-2 relative">
                <button
                  onClick={() => setStep("select")}
                  className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                >
                  <ArrowRight size={20} />
                </button>
                <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
                  <div className="flex items-center gap-1.5">
                    <HandHeart size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <h1 className="font-bold text-base text-foreground">الميثاق مع الله</h1>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">راجع ووقّع عهدك الصادق</p>
                </div>
              </div>
              <StepDots step={step} />
            </div>

            <div className="flex-1 px-4 pb-28 pt-4 overflow-y-auto flex flex-col gap-4">

              {/* ── Seal ── */}
              <CovenantSeal />

              {/* ── Selected sins summary ── */}
              <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
                  <p className="text-xs font-bold text-muted-foreground">ذنوبك المختارة</p>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedSins.length} ذنب</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {selectedSins.map((sin) => {
                    const meta = CATEGORY_META[sin.category];
                    return (
                      <div key={sin.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${meta.bg} ${meta.borderColor}`}>
                        <span className="text-xl leading-none shrink-0">{sin.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold leading-tight ${meta.color}`}>{sin.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{meta.label}</p>
                        </div>
                        {sin.kaffarahId && (
                          <div className="shrink-0 flex items-center gap-1 bg-red-500/10 border border-red-400/20 rounded-lg px-1.5 py-0.5">
                            <AlertTriangle size={9} className="text-red-500" />
                            <span className="text-[9px] font-bold text-red-500">كفارة</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Kaffarah warning ── */}
              <AnimatePresence>
                {hasKaffarah && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-start gap-3 bg-red-500/8 border border-red-400/25 rounded-2xl px-4 py-3.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={15} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-red-600 dark:text-red-400 mb-1">تنبيه: بعض ذنوبك تستلزم كفارة</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        ستجد خطة الكفارة الشرعية جاهزة في صفحة الكفارات بعد التوقيع مباشرة.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Covenant text ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl overflow-hidden border border-emerald-400/30 shadow-md"
                style={{ background: "linear-gradient(160deg, rgba(5,150,105,0.08) 0%, rgba(4,120,87,0.04) 100%)" }}
              >
                {/* Top ornament */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-400/20">
                  <div className="h-px flex-1 bg-gradient-to-l from-emerald-400/40 to-transparent" />
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">نص الميثاق</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-400/40 to-transparent" />
                </div>

                <div className="px-5 py-5 text-center">
                  <p className="text-[14.5px] leading-[2.1] text-foreground font-medium" dir="rtl">
                    «أُعاهدُ اللهَ تعالى على التوبةِ النصوح،
                    <br />
                    والإقلاعِ عن هذه الذنوب فوراً،
                    <br />
                    والندمِ عليها من أعماق قلبي،
                    <br />
                    والعزمِ الصادق على عدم العودة إليها أبداً.»
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-3 tracking-wide">بسم الله أبدأ رحلتي</p>
                </div>
              </motion.div>

              {/* ── Quran ayah ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl px-4 py-4 text-center border border-amber-400/20"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.04) 100%)" }}
              >
                <p className="text-[13px] leading-[2] text-foreground/80 font-medium" dir="rtl">
                  ﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا﴾
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2 tracking-wide">سورة الزمر — الآية ٥٣</p>
              </motion.div>

            </div>

            {/* ── Sign button (floating above nav + Zaki) ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.4 }}
              className="fixed inset-x-0 z-[55] px-4 max-w-md mx-auto"
              style={{ bottom: "108px" }}
            >
              <div
                className="p-2.5 rounded-2xl border border-border/60 shadow-2xl"
                style={{
                  background: "color-mix(in srgb, var(--background) 88%, transparent)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                }}
              >
                <motion.button
                  onClick={handleSign}
                  disabled={createCovenant.isPending}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-[50px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(to left, #059669, #047857)",
                    color: "#fff",
                  }}
                  animate={createCovenant.isPending ? {} : {
                    boxShadow: [
                      "0 4px 20px rgba(5,150,105,0.45)",
                      "0 6px 28px rgba(5,150,105,0.65)",
                      "0 4px 20px rgba(5,150,105,0.45)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {createCovenant.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جارٍ توثيق الميثاق...</span>
                    </>
                  ) : (
                    <>
                      <HandHeart size={18} className="text-white" />
                      <span>أُعاهِدُ الله الآن على التوبة النصوح</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
