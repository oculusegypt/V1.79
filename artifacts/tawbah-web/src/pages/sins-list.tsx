import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowLeft, AlertTriangle, CheckCircle2,
  BookOpen, Scale, Info, Plus, Check, X, Save,
  Mic, MicOff, Send, Sparkles, RotateCcw, ChevronDown, Bot, SparklesIcon,
} from "lucide-react";
import {
  SINS, CATEGORY_META, SIN_CATEGORY_ORDER, SEVERITY_META,
  type Sin, type SinCategory, type SinSeverity,
} from "@/lib/sins-data";
import { getAuthHeader } from "@/lib/auth-client";
import { getSessionId } from "@/lib/session";
import { apiUrl } from "@/lib/api-base";

type FilterType = "all" | SinCategory;

// ─────────────────────────────────────────────
// AI Sin Detector Component
// ─────────────────────────────────────────────

type DetectResult = { matchedIds: string[]; transcription: string; explanation: string };

function AiSinDetector({ onDetected }: { onDetected: (ids: string[], explanation: string) => void }) {
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
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("متصفح التطبيق لا يدعم الميكروفون. جرّب تحديث التطبيق أو استخدم Chrome.");
        return;
      }
      if (typeof (window as any).MediaRecorder === "undefined") {
        setError("التسجيل الصوتي غير مدعوم على جهازك. جرّب تحديث WebView.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const pickMimeType = () => {
        const MR = (window as any).MediaRecorder as typeof MediaRecorder | undefined;
        const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
        for (const t of candidates) {
          try {
            if (MR?.isTypeSupported?.(t)) return t;
          } catch {}
        }
        return "";
      };

      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType });
          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("file_reader_failed"));
            reader.onload = () => {
              const result = String(reader.result ?? "");
              const commaIdx = result.indexOf(",");
              if (commaIdx === -1) return reject(new Error("base64_parse_failed"));
              resolve(result.slice(commaIdx + 1));
            };
            reader.readAsDataURL(blob);
          });

          await detect(undefined, b64);
        } catch (e) {
          console.error("[SinDetector] Voice input failed:", e);
          setError("ما قدرت أسمعك — تأكد من السماح بالميكروفون.");
        }
      };

      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (e) {
      console.error("[SinDetector] getUserMedia/MediaRecorder failed:", e);
      setError("تعذّر الوصول للميكروفون. تأكد من منح الإذن.");
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
      const sinsLookup = SINS.map(s => ({ id: s.id, name: s.name, category: s.category, description: s.desc }));
      const res = await fetch(apiUrl("/api/detect-sins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, audioBase64, sinsLookup }),
      });
      const data = await res.json() as DetectResult & { error?: string };
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
    onDetected(result.matchedIds, result.explanation);
    setResult(null);
    setText("");
  };

  return (
    <div className="p-4 bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/25 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 pb-3 border-b border-primary/15 mb-3">
        <Sparkles size={14} className="text-primary" />
        <p className="text-xs font-bold text-primary flex-1">كشف الذنب بالذكاء الاصطناعي</p>
        <p className="text-[10px] text-muted-foreground">صف حالك أو انطق بها</p>
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="مثال: «أنا أشاهد أشياء محرمة على الإنترنت وأضيّع صلاة الفجر كثيراً»"
          rows={2}
          disabled={loading || recording}
          className="flex-1 bg-background/80 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 placeholder:text-[11px] leading-relaxed"
          dir="rtl"
        />
        <div className="flex flex-col gap-1.5">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={() => detect()}
            disabled={!text.trim() || loading || recording}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-all hover:bg-primary/90"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>

      {recording && (
        <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          يتم التسجيل... {recordingSeconds}ث — اضغط ⏹ للإيقاف
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          {result.transcription && (
            <p className="text-[11px] text-muted-foreground mb-2 italic">
              «{result.transcription}»
            </p>
          )}
          {result.matchedIds.length === 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-muted-foreground">لم يُعثَر على ذنب مطابق في القائمة. يمكنك اختيار ذنبك يدوياً أدناه.</p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">
                {result.explanation && <span>{result.explanation} — </span>}
                وجدتُ {result.matchedIds.length} {result.matchedIds.length === 1 ? "ذنب مطابق" : "ذنوب مطابقة"}:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.matchedIds.map(id => {
                  const sin = SINS.find(s => s.id === id);
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
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-xs font-bold"
                >
                  <Check size={14} />
                  أضفها لاختياراتي
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-2.5 bg-muted rounded-xl text-xs text-muted-foreground"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SinDetailSheet({ sin, onClose }: { sin: Sin; onClose: () => void }) {
  const [added, setAdded] = useState(false);
  const meta = CATEGORY_META[sin.category];

  const handleAddKaffarah = () => {
    if (!sin.kaffarahId) return;
    setAdded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm pt-3 pb-3 px-5 border-b border-border/50 z-10">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sin.icon}</span>
            <div className="flex-1">
              <h2 className="font-bold text-base">{sin.name}</h2>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.borderColor} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{sin.desc}</p>

          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-start gap-2">
              <BookOpen size={13} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">{sin.daleel}</p>
            </div>
          </div>

          {sin.warning && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3.5">
              <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-relaxed">{sin.warning}</p>
            </div>
          )}

          {sin.note && (
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3.5">
              <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{sin.note}</p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary" />
              شروط التوبة والإصلاح
            </h3>
            <div className="flex flex-col gap-2">
              {sin.conditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed">{cond}</p>
                </div>
              ))}
            </div>
          </div>

          {sin.kaffarahId && (
            <div className="bg-gradient-to-l from-red-500/10 to-orange-500/5 border border-red-400/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={15} className="text-red-500" />
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400">{sin.kaffarahLabel}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                هذا الذنب له كفارة شرعية محددة. يمكنك إضافتها لخطتك ومتابعة تنفيذها.
              </p>
              {added ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-emerald-600 dark:text-emerald-400">
                  <Check size={16} />
                  <span className="text-sm font-bold">أُضيفت للخطة</span>
                  <Link href="/kaffarah" className="mr-auto text-xs underline underline-offset-2" onClick={onClose}>
                    انتقل للخطة ←
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAddKaffarah}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md shadow-red-500/20"
                >
                  <Plus size={16} />
                  أضف الكفارة لخطتي
                </button>
              )}
            </div>
          )}

          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SinCard({
  sin, selected, onToggle, onDetail,
}: { sin: Sin; selected: boolean; onToggle: () => void; onDetail: () => void }) {
  const meta = CATEGORY_META[sin.category];
  const severityMeta = SEVERITY_META[sin.severity];

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
      selected ? `${meta.bg} ${meta.borderColor} ring-1 ring-inset ${meta.borderColor}` : "bg-card border-border"
    }`}>
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
        }`}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </button>
      <span className="text-xl shrink-0">{sin.icon}</span>
      <button className="flex-1 min-w-0 text-right" onClick={onDetail}>
        <p className={`font-bold text-sm truncate ${selected ? meta.color : ""}`}>{sin.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${severityMeta.bg} ${severityMeta.color} ${severityMeta.borderColor}`}>
            {sin.severity === "kabira" ? "⚠️" : "•"} {severityMeta.label}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.borderColor}`}>
            {meta.label}
          </span>
        </div>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        {sin.kaffarahId && <Scale size={12} className="text-red-400" />}
        <button onClick={onDetail} className="p-1 text-muted-foreground">
          <Info size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SinsList() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const fromParam = params.get("from"); // "journey" | "account" | null

  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<SinCategory>>(new Set(SIN_CATEGORY_ORDER));
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedSin, setSelectedSin] = useState<Sin | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getReturnPath = () => {
    if (fromParam === "journey") return "/journey";
    if (fromParam === "account") return "/account";
    return null; // new journey → go to covenant
  };

  const toggleCategory = (category: SinCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const filtered = filter === "all" ? SINS : SINS.filter(s => s.category === filter);

  const toggleSin = (id: string) => {
    setSaved(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const sins = SINS.filter(s => selectedIds.has(s.id));
    try {
      const res = await fetch(apiUrl("/api/user/sins"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ sinIds: sins.map(s => s.id), sessionId: getSessionId() }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaved(true);
      setTimeout(() => {
        const returnPath = getReturnPath();
        window.location.href = returnPath ?? "/covenant";
      }, 300);
    } catch {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const returnPath = getReturnPath();
    window.location.href = returnPath ?? "/covenant";
  };

  const handleAiDetected = (ids: string[], _explanation: string) => {
    setSaved(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    // scroll to first matched sin
    if (ids.length > 0) {
      const el = document.getElementById(`sin-${ids[0]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const counts: Record<FilterType, number> = {
    all: SINS.length,
    with_kaffarah: SINS.filter(s => s.category === "with_kaffarah").length,
    major: SINS.filter(s => s.category === "major").length,
    huquq_ibad: SINS.filter(s => s.category === "huquq_ibad").length,
    common: SINS.filter(s => s.category === "common").length,
  };

  const filterBtns: { key: FilterType; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "with_kaffarah", label: "لها كفارة" },
    { key: "major", label: "كبائر" },
    { key: "huquq_ibad", label: "حقوق العباد" },
    { key: "common", label: "شائعة" },
  ];

  return (
    <div className="flex flex-col flex-1 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 -mx-5 px-5 pt-2 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}
            className="p-2 -ml-2 rounded-xl hover:bg-muted/50 text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold">قائمة الذنوب</h1>
            <p className="text-[10px] text-muted-foreground">اختر ذنبك لتُبنى خطتك عليه</p>
          </div>
          {/* Small Zakiy Icon at Top */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAiModalOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <Sparkles size={18} className="text-primary-foreground" />
          </motion.button>
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border hover:border-border/60 transition-colors"
          >
            تخطّ
          </button>
        </div>

        {/* Filter buttons in header */}
        <div className="mt-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
          <div className="flex gap-2 min-w-max">
            {filterBtns.map(f => {
              const catMeta = f.key === "all" ? null : CATEGORY_META[f.key as SinCategory];
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isActive && catMeta
                      ? `${catMeta.bg} ${catMeta.color} ${catMeta.borderColor} shadow-sm`
                      : isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card/80 text-muted-foreground border-border hover:border-border/70"
                  }`}
                >
                  {f.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-muted"}`}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="mx-5 mt-3 mb-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          حدّد ذنبك يدوياً من المجموعات أدناه، ثم احفظ لتُحدَّث خطتك تلقائياً.
        </p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {filter === "all" ? (
          // Grouped by category with accordion
          SIN_CATEGORY_ORDER.map(category => {
            const categorySins = SINS.filter(s => s.category === category);
            const meta = CATEGORY_META[category];
            const isExpanded = expandedCategories.has(category);
            const selectedInCategory = categorySins.filter(s => selectedIds.has(s.id)).length;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden"
              >
                {/* Category Header - Accordion Button */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                    isExpanded
                      ? `${meta.bg} ${meta.borderColor} shadow-sm`
                      : "bg-card border-border hover:border-border/70"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-xl`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 text-right">
                    <p className={`font-bold text-sm ${isExpanded ? meta.color : ""}`}>{meta.groupLabel}</p>
                    <p className="text-[10px] text-muted-foreground">{categorySins.length} ذنب</p>
                  </div>
                  {selectedInCategory > 0 && (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                      {selectedInCategory} مختار
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-1.5 rounded-lg ${isExpanded ? meta.bg : "bg-muted"}`}
                  >
                    <ChevronDown size={16} className={isExpanded ? meta.color : "text-muted-foreground"} />
                  </motion.div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-2 flex flex-col gap-2">
                        {categorySins.map((sin, i) => (
                          <motion.div
                            key={sin.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <SinCard
                              sin={sin}
                              selected={selectedIds.has(sin.id)}
                              onToggle={() => toggleSin(sin.id)}
                              onDetail={() => setSelectedSin(sin)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          // Single category view (filter selected)
          <AnimatePresence mode="popLayout">
            {filtered.map((sin, i) => (
              <motion.div
                key={sin.id}
                id={`sin-${sin.id}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.025 }}
              >
                <SinCard
                  sin={sin}
                  selected={selectedIds.has(sin.id)}
                  onToggle={() => toggleSin(sin.id)}
                  onDetail={() => setSelectedSin(sin)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Large Floating Zakiy AI Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-5 mt-6 mb-4"
      >
        <button
          onClick={() => setAiModalOpen(true)}
          className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 group hover:border-primary/50 transition-all"
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 group-hover:from-primary/10 transition-all duration-500" />
          
          <div className="relative flex items-center gap-4">
            {/* Large floating Zakiy icon */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-green-600 shadow-xl shadow-primary/30 flex items-center justify-center text-4xl"
            >
              🤖
            </motion.div>
            
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-primary" />
                <h3 className="font-bold text-foreground">مساعد الزكي الذكي</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                اكتشف ذنوبك تلقائياً بالذكاء الاصطناعي! فقط صف حالتك أو تحدث وستقوم الخوارزمية بتحليلها وتحديد الذنوب المناسبة لك.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  جرب الآن مجاناً
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Sticky Save Button */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 px-5 z-40"
          >
            <button
              onClick={handleSave}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all"
            >
              {saved ? (
                <>
                  <Check size={18} />
                  تم الحفظ! جاري الانتقال...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {fromParam ? `احفظ وعُد (${selectedIds.size} ${selectedIds.size === 1 ? "ذنب" : "ذنوب"})` : `احفظ وتابع إلى الميثاق (${selectedIds.size} ${selectedIds.size === 1 ? "ذنب" : "ذنوب"})`}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSin && (
          <SinDetailSheet sin={selectedSin} onClose={() => setSelectedSin(null)} />
        )}
      </AnimatePresence>

      {/* AI Detector Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setAiModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
            >
              <AiSinDetector onDetected={(ids, explanation) => {
                handleAiDetected(ids, explanation);
                setAiModalOpen(false);
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
