import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Lock, Star, Trophy, Flame, ChevronDown, ChevronUp,
  BookOpen, BookText, X, Loader2, Play, Square, CheckSquare,
  Scale, Sparkles, ChevronRight, Bell, RotateCcw, ArrowLeft, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { getSessionId } from "@/lib/session";
import { isNativeApp, getApiBase } from "@/lib/api-base";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { getAuthHeader, setAuthToken } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { getSelectedSins, CATEGORY_META, type Sin } from "@/lib/sins-data";
import { PageHeader } from "@/components/PageHeader";
import { setAudioSrc } from "@/lib/native-audio";

interface JourneyDay {
  day: number;
  title: string;
  tasks: string[];
  verse: string;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  taskChecks: boolean[];
}

interface JourneyData {
  days: JourneyDay[];
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12_000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function buildNativeFallbackJourney(): JourneyData {
  const days: JourneyDay[] = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      title: `اليوم ${toArabicIndic(day)}`,
      tasks: ["ذكر", "استغفار", "صلاة"],
      verse: "﴿وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَا الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ﴾",
      completed: false,
      isCurrent: day === 1,
      isLocked: day !== 1,
      taskChecks: [false, false, false],
    };
  });

  return {
    days,
    completedCount: 0,
    currentDay: 1,
    streakDays: 0,
  };
}

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function toArabicIndic(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]!);
}

// تُزيل هذه الدالة نص البسملة من مطلع الآية إن وُجد، وتُبقي على ما بعدها
function stripBismillahPrefix(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) return text;
  const norm = (s: string) =>
    s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\uFE70-\uFEFF]/g, "")
     .replace(/[أإآٱ]/g, "ا");
  const w = [norm(words[0]||""), norm(words[1]||""), norm(words[2]||""), norm(words[3]||"")];
  const isBism = w[0].includes("بسم") && w[1].includes("الله") && w[2].includes("الرحمن") && w[3].includes("الرحيم");
  if (!isBism) return text;
  return words.slice(4).join(" ").trim();
}

function isBismillahAyah(ayah: SurahAyah, surahNumber: number): boolean {
  // الفاتحة: البسملة هي الآية الأولى الحقيقية — لا تُحذف
  // التوبة: لا بسملة أصلاً
  if (surahNumber === 1 || surahNumber === 9) return false;
  if (ayah.numberInSurah !== 1) return false;
  const normalized = ayah.text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s+/g, "");
  if (!normalized.startsWith("بسماللهالرحمن") && !normalized.startsWith("بسمالله")) return false;
  // تُحذف فقط إذا كانت الآية بسملة خالصة (≤ 5 كلمات)
  return ayah.text.trim().split(/\s+/).length <= 5;
}

interface SurahRef { number: number; name: string; startAyah?: number; endAyah?: number; }

const SURAH_TASK_MAP: Array<{ pattern: RegExp; surahs: SurahRef[] }> = [
  { pattern: /سورة التوبة/,       surahs: [{ number: 9,   name: "سورة التوبة" }] },
  { pattern: /قصة يوسف/,          surahs: [{ number: 12,  name: "سورة يوسف" }] },
  { pattern: /المعوذتين/,          surahs: [{ number: 113, name: "سورة الفلق" }, { number: 114, name: "سورة الناس" }] },
  { pattern: /الكهف/,              surahs: [{ number: 18,  name: "سورة الكهف" }] },
  { pattern: /الفاتحة/,            surahs: [{ number: 1,   name: "سورة الفاتحة" }] },
  { pattern: /البقرة/,             surahs: [{ number: 2,   name: "سورة البقرة" }] },
  { pattern: /آية الكرسي/,        surahs: [{ number: 2,   name: "آية الكرسي", startAyah: 255, endAyah: 255 }] },
];

function extractSurahsFromTask(task: string): SurahRef[] | null {
  for (const entry of SURAH_TASK_MAP) {
    if (entry.pattern.test(task)) return entry.surahs;
  }
  return null;
}

interface SurahAyah { number: number; numberInSurah: number; text: string; }

function SurahReaderModal({
  surahNumber, surahName, onClose, startAyah, endAyah,
}: { surahNumber: number; surahName: string; onClose: () => void; startAyah?: number; endAyah?: number; }) {
  const [allAyahs, setAllAyahs] = useState<SurahAyah[]>([]);
  const [tafseerAllAyahs, setTafseerAllAyahs] = useState<SurahAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTafseer, setShowTafseer] = useState(false);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const preloadedIdxRef = useRef<number | null>(null);
  const playFromIdxRef = useRef<(idx: number) => void>(() => {});
  const ayahRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const json = await res.json();
        setAllAyahs(json?.data?.ayahs ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [surahNumber]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); preloadRef.current?.pause(); };
  }, []);

  // الآيات المُرشَّحة للعرض (البسملة الخالصة محذوفة، مع دعم نطاق الآيات)
  const isRanged = startAyah !== undefined || endAyah !== undefined;
  const displayAyahs = allAyahs
    .filter(a => !isBismillahAyah(a, surahNumber))
    .filter(a => (!startAyah || a.numberInSurah >= startAyah) && (!endAyah || a.numberInSurah <= endAyah));
  const tafseerDisplayAyahs = tafseerAllAyahs
    .filter(a => !isBismillahAyah(a, surahNumber))
    .filter(a => (!startAyah || a.numberInSurah >= startAyah) && (!endAyah || a.numberInSurah <= endAyah));

  const preloadFromIdx = (idx: number) => {
    if (!displayAyahs[idx]) return;
    const ayah = displayAyahs[idx]!;
    if (!preloadRef.current) preloadRef.current = new Audio();
    const pre = preloadRef.current;
    pre.pause(); pre.onended = null;
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(surahNumber, ayah.numberInSurah)}.mp3`;
    void setAudioSrc(pre, url).then(() => pre.load()).catch(() => {});
    pre.volume = 0;
    pre.play().then(() => { pre.pause(); pre.currentTime = 0; pre.volume = 1; }).catch(() => { pre.volume = 1; });
  };

  const playFromIdx = (idx: number) => {
    if (!displayAyahs[idx]) return;
    const ayah = displayAyahs[idx]!;

    if (preloadedIdxRef.current === idx && preloadRef.current?.src) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; }
      const pre = preloadRef.current;
      pre.volume = 1; pre.currentTime = 0;
      audioRef.current = pre;
      preloadRef.current = new Audio();
      preloadedIdxRef.current = null;
    } else {
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.pause(); audio.onended = null;
      const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(surahNumber, ayah.numberInSurah)}.mp3`;
      void setAudioSrc(audio, url).then(() => audio.load()).catch(() => {});
    }

    const audio = audioRef.current;
    audio.play().catch(() => {});
    setCurrentIdx(idx);
    setIsPlaying(true);
    ayahRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });

    const next = idx + 1;
    if (next < displayAyahs.length) preloadFromIdx(next);

    audio.onended = () => {
      const next = idx + 1;
      if (next < displayAyahs.length) {
        setCurrentIdx(next);
        playFromIdxRef.current(next);
        ayahRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setIsPlaying(false);
        setCurrentIdx(null);
      }
    };
  };

  useEffect(() => { playFromIdxRef.current = playFromIdx; });

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentIdx === null || !audioRef.current) {
        playFromIdx(currentIdx ?? 0);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const loadTafseer = async () => {
    if (tafseerAllAyahs.length > 0) { setShowTafseer(true); return; }
    setTafseerLoading(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.muyassar`);
      const json = await res.json();
      setTafseerAllAyahs(json?.data?.ayahs ?? []);
      setShowTafseer(true);
    } catch {
    } finally {
      setTafseerLoading(false);
    }
  };

  const hideTafseer = () => setShowTafseer(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingBottom: "80px" }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative mt-auto mx-auto w-full max-w-lg bg-card rounded-t-2xl border border-border shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between px-5 mb-2">
            <div className="w-8" />
            <div className="text-center">
              <p
                className="text-2xl text-primary font-bold"
                style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
              >
                {surahName.replace("سورة ", "")}
              </p>
              {displayAyahs.length > 0 && !isRanged && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{displayAyahs.length} آية</p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-border shrink-0">
          <button
            onClick={hideTafseer}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              !showTafseer ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            <BookOpen size={13} />
            قراءة السورة
          </button>
          <button
            onClick={loadTafseer}
            disabled={tafseerLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              showTafseer ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            {tafseerLoading ? <Loader2 size={13} className="animate-spin" /> : <BookText size={13} />}
            التفسير الميسّر
          </button>
        </div>

        {/* Ayah list */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}
          {error && (
            <p className="text-sm text-muted-foreground text-center py-8">تعذّر تحميل السورة. تأكد من اتصالك بالإنترنت.</p>
          )}
          {!loading && !error && (
            <div className="pb-4">
              {/* البسملة — تُعرض فقط للسور الكاملة (لا لنطاق الآيات) وليس سورة التوبة */}
              {!isRanged && surahNumber !== 9 && (
                <div className="flex flex-col items-center my-5">
                  <div className="flex items-center w-full gap-3 mb-1">
                    <div className="flex-1 h-px bg-border/60" />
                    <p
                      className="text-center text-foreground"
                      dir="rtl"
                      style={{
                        fontFamily: "'Amiri Quran', 'Amiri', serif",
                        fontSize: "20px",
                        lineHeight: 2,
                      }}
                    >
                      بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
                    </p>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                </div>
              )}

              {/* وضع القراءة: النص المتدفق بأسلوب المصحف */}
              {!showTafseer && (
                <div
                  dir="rtl"
                  className="leading-[3] text-[18px] text-right"
                  style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif", textAlign: "justify" }}
                >
                  {displayAyahs.map((ayah, displayIdx) => {
                    const isCurrent = currentIdx === displayIdx;
                    // إزالة البسملة من الآية الأولى إن كانت مضمّنة فيها
                    const displayText = displayIdx === 0 && !isRanged && surahNumber !== 1 && surahNumber !== 9
                      ? stripBismillahPrefix(ayah.text)
                      : ayah.text;
                    return (
                      <span key={ayah.number}>
                        <span
                          ref={(el) => { ayahRefs.current[displayIdx] = el; }}
                          onClick={() => playFromIdx(displayIdx)}
                          className={`cursor-pointer rounded transition-colors ${
                            isCurrent
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          {displayText}
                        </span>
                        {" "}
                        <span
                          onClick={() => playFromIdx(displayIdx)}
                          title={`الآية ${ayah.numberInSurah}`}
                          className={`cursor-pointer transition-colors ${
                            isCurrent ? "text-primary" : "text-primary/70 hover:text-primary"
                          }`}
                          style={{
                            fontFamily: "'Amiri Quran', 'Amiri', serif",
                            fontSize: "1em",
                            position: "relative",
                            top: "-0.12em",
                            display: "inline-block",
                          }}
                        >
                          {"\u06DD"}{toArabicIndic(ayah.numberInSurah)}
                        </span>
                        {" "}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* وضع التفسير: كل آية مع تفسيرها */}
              {showTafseer && (
                <div className="flex flex-col gap-3">
                  {tafseerDisplayAyahs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">جاري تحميل التفسير...</p>
                  ) : (
                    displayAyahs.map((ayah, displayIdx) => {
                      const isCurrent = currentIdx === displayIdx;
                      const tafseer = tafseerDisplayAyahs[displayIdx];
                      return (
                        <div
                          key={ayah.number}
                          ref={(el) => { ayahRefs.current[displayIdx] = el; }}
                          className={`rounded-xl border overflow-hidden transition-all ${
                            isCurrent ? "border-primary/40 shadow-sm" : "border-border/50"
                          }`}
                        >
                          {/* نص الآية */}
                          <div
                            className={`px-4 py-3 cursor-pointer ${isCurrent ? "bg-primary/10" : "bg-muted/20 hover:bg-muted/40"}`}
                            onClick={() => playFromIdx(displayIdx)}
                            dir="rtl"
                          >
                            <span
                              className="leading-[2.8] text-[17px]"
                              style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                            >
                              {displayIdx === 0 && !isRanged && surahNumber !== 1 && surahNumber !== 9
                                ? stripBismillahPrefix(ayah.text)
                                : ayah.text}
                              {" "}
                              <span
                                className={isCurrent ? "text-primary" : "text-primary/70"}
                                style={{
                                  fontFamily: "'Amiri Quran', 'Amiri', serif",
                                  fontSize: "1em",
                                  position: "relative",
                                  top: "-0.12em",
                                  display: "inline-block",
                                }}
                              >
                                {"\u06DD"}{toArabicIndic(ayah.numberInSurah)}
                              </span>
                            </span>
                          </div>
                          {/* التفسير */}
                          {tafseer && (
                            <div className="px-4 py-2.5 border-t border-border/40 bg-card/60" dir="rtl">
                              <p className="text-[12px] text-muted-foreground leading-relaxed">
                                {tafseer.text}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player bar */}
        {displayAyahs.length > 0 && !loading && (
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-5 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow"
              >
                {isPlaying ? (
                  <span className="flex gap-0.5">
                    <span className="w-1 h-4 bg-primary-foreground rounded-sm" />
                    <span className="w-1 h-4 bg-primary-foreground rounded-sm" />
                  </span>
                ) : (
                  <Play size={16} className="mr-[-2px]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                {currentIdx !== null ? (
                  <>
                    <p className="text-xs font-bold truncate">
                      {isPlaying ? "يُشغَّل الآن" : "متوقف"} — الآية {displayAyahs[currentIdx]?.numberInSurah}
                    </p>
                    <div className="w-full bg-primary/10 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((currentIdx + 1) / displayAyahs.length) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">اضغط على أي آية للاستماع من هناك</p>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => currentIdx !== null && currentIdx > 0 && playFromIdx(currentIdx - 1)}
                  disabled={currentIdx === null || currentIdx === 0}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                  title="الآية السابقة"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <button
                  onClick={() => currentIdx !== null && currentIdx < displayAyahs.length - 1 && playFromIdx(currentIdx + 1)}
                  disabled={currentIdx === null || currentIdx === displayAyahs.length - 1}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                  title="الآية التالية"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SurahButton({ task }: { task: string }) {
  const [openSurah, setOpenSurah] = useState<SurahRef | null>(null);
  const surahs = extractSurahsFromTask(task);
  if (!surahs) return null;

  if (surahs.length === 1) {
    return (
      <>
        <button
          onClick={() => setOpenSurah(surahs[0]!)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
        >
          <BookOpen size={12} />
          {surahs[0]?.startAyah ? surahs[0].name : "قراءة السورة"}
        </button>
        {openSurah && (
          <SurahReaderModal
            surahNumber={openSurah.number}
            surahName={openSurah.name}
            startAyah={openSurah.startAyah}
            endAyah={openSurah.endAyah}
            onClose={() => setOpenSurah(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {surahs.map((s) => (
          <button
            key={s.number}
            onClick={() => setOpenSurah(s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <BookOpen size={12} />
            {s.name}
          </button>
        ))}
      </div>
      {openSurah && (
        <SurahReaderModal
          surahNumber={openSurah.number}
          surahName={openSurah.name}
          startAyah={openSurah.startAyah}
          endAyah={openSurah.endAyah}
          onClose={() => setOpenSurah(null)}
        />
      )}
    </>
  );
}

// ─── Task type helpers ────────────────────────────────────────────────────────

function parseIstighfarCount(task: string): number {
  const wordMap: Record<string, number> = {
    "مائة": 100, "مئة": 100, "ثمانين": 80, "سبعين": 70,
    "ستين": 60, "خمسين": 50, "أربعين": 40, "ثلاثين": 30,
    "عشرين": 20, "خمسة عشر": 15, "عشرة": 10,
  };
  const numMatch = task.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1]!);
  for (const [word, num] of Object.entries(wordMap)) {
    if (task.includes(word)) return num;
  }
  return 33;
}

function isIstighfarTask(task: string): boolean {
  return /استغفر|الاستغفار|أستغفر/.test(task) && !/سورة/.test(task);
}

function isDhikrCounterTask(task: string): boolean {
  return /(\d+|مائة|مئة|سبعين|ثمانين|خمسين|أربعين|ثلاثين|عشرين|عشرة)\s*مرة/.test(task) && !/سورة|صفحت|صفحتين/.test(task);
}

function getDhikrLabel(task: string): string {
  if (/استغفر|أستغفر|الاستغفار/.test(task)) return "اضغط للاستغفار";
  if (/سبحان الله/.test(task)) return "اضغط للتسبيح";
  if (/الحمد لله/.test(task)) return "اضغط للتحميد";
  if (/الله أكبر/.test(task)) return "اضغط للتكبير";
  return "اضغط للذكر";
}

function isPrayerTask(task: string): boolean {
  return /صلاة (الفجر|الظهر|العصر|المغرب|العشاء)|أدِّ صلاة|أدّ صلاة|صلِّ الفريضة|صلّ الفريضة/.test(task);
}

function extractPrayerName(task: string): string {
  const m = task.match(/صلاة (الفجر|الظهر|العصر|المغرب|العشاء)/);
  return m ? m[1]! : "الصلاة";
}

function isQuranPagesTask(task: string): boolean {
  return /صفحت|صفحتين|صفحات من القرآن/.test(task);
}

function generatePagePairs(): [number, number][] {
  const used = new Set<number>();
  const pairs: [number, number][] = [];
  while (pairs.length < 4) {
    const p = Math.floor(Math.random() * 602) + 1;
    if (!used.has(p) && !used.has(p + 1)) {
      used.add(p); used.add(p + 1);
      pairs.push([p, p + 1]);
    }
  }
  return pairs;
}

// ─── IstighfarCounter ─────────────────────────────────────────────────────────

function IstighfarCounter({ count, done, onDone, label }: { count: number; done: boolean; onDone: () => void; label?: string }) {
  const [current, setCurrent] = useState(done ? count : 0);
  const finished = current >= count || done;
  const pct = Math.min((current / count) * 100, 100);
  const tapLabel = label ?? "اضغط للاستغفار";

  const tap = () => {
    if (finished) return;
    const next = current + 1;
    setCurrent(next);
    if (next >= count) onDone();
  };

  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={tap}
          disabled={finished}
          className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-[0.97] ${
            finished
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/25 hover:from-primary/15"
          }`}
        >
          <span className="text-xs text-muted-foreground">{finished ? "✓ اكتمل الذكر" : tapLabel}</span>
          <span className="text-primary font-bold tabular-nums">
            {toArabicIndic(current)} / {toArabicIndic(count)}
          </span>
        </button>
        {current > 0 && !finished && (
          <button onClick={() => setCurrent(0)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors" title="إعادة">
            <RotateCcw size={14} />
          </button>
        )}
      </div>
      <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}

// ─── PrayerReminderButton ─────────────────────────────────────────────────────

function PrayerReminderButton({ task }: { task: string }) {
  const prayerName = extractPrayerName(task);
  const [showOptions, setShowOptions] = useState(false);
  const [confirmed, setConfirmed] = useState(() => {
    try { return !!localStorage.getItem(`prayer_remind_${prayerName}`); } catch { return false; }
  });

  const handleSet = (label: string) => {
    try { localStorage.setItem(`prayer_remind_${prayerName}`, label); } catch {}
    setConfirmed(true);
    setShowOptions(false);
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/8 rounded-lg px-2.5 py-1.5 border border-indigo-300/30">
        <Bell size={11} />
        تذكير صلاة {prayerName} مضبوط
      </div>
    );
  }

  return (
    <div className="relative mt-1">
      <button
        onClick={() => setShowOptions(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 hover:bg-indigo-500/15 transition-all"
      >
        <Bell size={12} />
        ضبط تذكير لصلاة {prayerName}
      </button>
      <AnimatePresence>
        {showOptions && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowOptions(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full mt-1 right-0 z-30 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[190px]"
            >
              {[
                { label: "قبل ٥ دقائق" },
                { label: "قبل ١٠ دقائق" },
                { label: "عند الأذان" },
                { label: "وقت مخصص" },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleSet(opt.label)}
                  className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0"
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── QuranPageViewer ──────────────────────────────────────────────────────────

interface PageAyah { number: number; numberInSurah: number; text: string; surah: { number: number; englishName: string; name: string }; }

function QuranPagePanel({ page, onClose }: { page: number; onClose: () => void }) {
  const [ayahs, setAyahs] = useState<PageAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const preloadedIdxRef = useRef<number | null>(null);
  const playFromIdxRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${page}`);
        const json = await res.json();
        setAyahs(json?.data?.ayahs ?? []);
      } catch {} finally { setLoading(false); }
    })();
    return () => { audioRef.current?.pause(); preloadRef.current?.pause(); };
  }, [page]);

  const preloadPageIdx = (idx: number) => {
    const ayah = ayahs[idx]; if (!ayah) return;
    if (!preloadRef.current) preloadRef.current = new Audio();
    const pre = preloadRef.current;
    pre.pause();
    pre.preload = "auto";
    pre.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(ayah.surah.number, ayah.numberInSurah)}.mp3`;
    pre.load();
    preloadedIdxRef.current = idx;
    pre.volume = 0;
    pre.play().then(() => { pre.pause(); pre.currentTime = 0; pre.volume = 1; }).catch(() => { pre.volume = 1; });
  };

  const playFromIdx = (idx: number) => {
    const ayah = ayahs[idx]; if (!ayah) return;

    if (preloadedIdxRef.current === idx && preloadRef.current?.src) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; }
      const pre = preloadRef.current;
      pre.volume = 1; pre.currentTime = 0;
      audioRef.current = pre;
      preloadRef.current = new Audio();
      preloadedIdxRef.current = null;
    } else {
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.pause(); audio.onended = null;
      audio.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(ayah.surah.number, ayah.numberInSurah)}.mp3`;
      audio.load();
    }

    const audio = audioRef.current;
    audio.play().catch(() => {});
    setCurrentIdx(idx); setIsPlaying(true);

    const next = idx + 1;
    if (next < ayahs.length) preloadPageIdx(next);

    audio.onended = () => {
      const next = idx + 1;
      if (next < ayahs.length) { setCurrentIdx(next); playFromIdxRef.current(next); }
      else { setIsPlaying(false); setCurrentIdx(null); }
    };
  };

  useEffect(() => { playFromIdxRef.current = playFromIdx; });

  const togglePlay = () => {
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
    else { playFromIdx(currentIdx ?? 0); }
  };

  const surahName = ayahs[0]?.surah?.name ?? `صفحة ${page}`;

  return (
    <div className="mt-2 bg-card border border-primary/20 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary/5">
        <span className="text-[11px] font-bold text-primary">صفحة {toArabicIndic(page)} — {surahName}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={togglePlay} className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg px-2 py-1">
            {isPlaying ? <Square size={10} /> : <Play size={10} />}
            {isPlaying ? "إيقاف" : "استمع"}
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-primary" /></div>
        ) : (
          <p
            dir="rtl"
            className="leading-[2.8] text-[16px] text-right"
            style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
          >
            {ayahs.map((ayah, idx) => (
              <span
                key={ayah.number}
                onClick={() => { setCurrentIdx(idx); playFromIdx(idx); }}
                className={`cursor-pointer transition-colors ${currentIdx === idx ? "text-primary" : "hover:text-primary/70"}`}
              >
                {ayah.text}{" "}
                <span className="text-primary/60 text-[13px]">﴿{toArabicIndic(ayah.numberInSurah)}﴾</span>{" "}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function QuranPagesButton({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [pairs] = useState<[number, number][]>(generatePagePairs);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [openPages, setOpenPages] = useState<number[]>([]);

  const handleSelect = (pair: [number, number]) => {
    setSelected(pair);
    setOpenPages([pair[0], pair[1]]);
    if (!done) onDone();
  };

  return (
    <div className="mt-1.5">
      {!selected ? (
        <div>
          <p className="text-[11px] text-muted-foreground mb-2 font-bold">اختر صفحتين لقراءتهما:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {pairs.map(([p1, p2]) => (
              <button
                key={p1}
                onClick={() => handleSelect([p1, p2])}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl bg-primary/8 border border-primary/20 text-primary hover:bg-primary/15 transition-all"
              >
                <BookOpen size={14} />
                <span className="text-[11px] font-bold">{toArabicIndic(p1)} – {toArabicIndic(p2)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-bold">قراءة الصفحتين:</span>
            <button onClick={() => { setSelected(null); setOpenPages([]); }} className="text-[10px] text-primary underline">اختر غيرهما</button>
          </div>
          {openPages.map(pg => (
            <QuranPagePanel key={pg} page={pg} onClose={() => setOpenPages(prev => prev.filter(p => p !== pg))} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DayTaskList ──────────────────────────────────────────────────────────────

function DayTaskList({
  day,
  sessionId,
  onAllDone,
}: {
  day: JourneyDay;
  sessionId: string;
  onAllDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [optimistic, setOptimistic] = useState<boolean[]>(
    day.taskChecks?.length ? day.taskChecks : Array(day.tasks.length).fill(false)
  );
  const calledDone = useRef(false);

  useEffect(() => {
    setOptimistic(day.taskChecks?.length ? day.taskChecks : Array(day.tasks.length).fill(false));
    calledDone.current = false;
  }, [day.taskChecks, day.day]);

  const toggleMutation = useMutation({
    mutationFn: async ({ taskIndex, completed }: { taskIndex: number; completed: boolean }) => {
      const res = await fetch(`${getApiBase()}/journey30/task-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ dayNumber: day.day, taskIndex, completed }),
      });
      return res.json() as Promise<{ success: boolean; allDone: boolean }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
      if (data.allDone && !calledDone.current) {
        calledDone.current = true;
        onAllDone();
      }
    },
  });

  const toggle = (i: number) => {
    if (day.completed) return;
    const next = optimistic.map((v, idx) => (idx === i ? !v : v));
    setOptimistic(next);
    toggleMutation.mutate({ taskIndex: i, completed: next[i]! });
  };

  const doneCount = optimistic.filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-muted-foreground">مهام اليوم {day.day}</span>
        <motion.span
          key={doneCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-xs font-black text-primary"
        >
          {doneCount}/{day.tasks.length}
        </motion.span>
      </div>
      <div className="flex flex-col gap-2.5">
        {day.tasks.map((task, i) => {
          const surahsForTask = extractSurahsFromTask(task);
          const isCounter = isDhikrCounterTask(task);
          const isPrayer = isPrayerTask(task);
          const isPages = isQuranPagesTask(task);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              className={`rounded-2xl border transition-all ${
                optimistic[i]
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-muted/20 border-border/50"
              }`}
            >
              <div className="flex items-start gap-3 p-3.5">
                <button
                  onClick={() => toggle(i)}
                  className="shrink-0 mt-0.5"
                  disabled={day.completed}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    optimistic[i] ? "bg-primary border-primary shadow-md shadow-primary/25" : "border-muted-foreground/25"
                  }`}>
                    <AnimatePresence>
                      {optimistic[i] && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.18, type: "spring", stiffness: 400, damping: 18 }}
                        >
                          <CheckCircle2 size={13} strokeWidth={3} className="text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
                <span className={`text-sm flex-1 leading-relaxed font-medium ${
                  optimistic[i] ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {task}
                </span>
              </div>
              {/* Task-specific interactive widgets */}
              {!day.completed && (
                <div className="px-3.5 pb-3.5 flex flex-col gap-1.5">
                  {isCounter && (
                    <IstighfarCounter
                      count={parseIstighfarCount(task)}
                      done={optimistic[i] ?? false}
                      onDone={() => toggle(i)}
                      label={getDhikrLabel(task)}
                    />
                  )}
                  {isPrayer && <PrayerReminderButton task={task} />}
                  {isPages && (
                    <QuranPagesButton done={optimistic[i] ?? false} onDone={() => !optimistic[i] && toggle(i)} />
                  )}
                  {surahsForTask && !isPages && (
                    <div className="flex flex-wrap gap-1.5">
                      <SurahButton task={task} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SinIntegrationPanel ─────────────────────────────────────────────────────

function SinIntegrationPanel() {
  const [sins, setSins] = useState<Sin[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSins(getSelectedSins());
    setDismissed(localStorage.getItem("journey30_sin_panel_dismissed") === "1");
  }, []);

  if (sins.length === 0) return null;

  const hasKaffarah = sins.some(s => s.kaffarahId);
  const allConditions = Array.from(new Set(sins.flatMap(s => s.conditions)));

  if (dismissed) {
    return (
      <div className="flex items-center gap-2 flex-wrap bg-muted/30 rounded-xl px-3 py-2 border border-border/50">
        <Sparkles size={12} className="text-primary shrink-0" />
        <span className="text-[11px] text-muted-foreground">ذنوبك المختارة:</span>
        {sins.slice(0, 2).map(sin => (
          <span key={sin.id} className="text-[10px] font-bold">
            {sin.icon} {sin.name}
          </span>
        ))}
        {sins.length > 2 && <span className="text-[10px] text-muted-foreground">+{sins.length - 2}</span>}
        <button
          onClick={() => { setDismissed(false); localStorage.removeItem("journey30_sin_panel_dismissed"); }}
          className="mr-auto text-[10px] text-primary underline underline-offset-2"
        >
          عرض خطتي الشخصية
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/25 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/15">
        <Sparkles size={15} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">رحلتك الشخصية المخصصة</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">مدمجة مع ذنوبك المختارة</p>
        </div>
        <Link href="/sins" className="text-[10px] text-primary/70 hover:text-primary transition-colors">
          تعديل
        </Link>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem("journey30_sin_panel_dismissed", "1"); }}
          className="p-1 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 pt-3 pb-2">
        {/* Sin chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sins.map(sin => {
            const meta = CATEGORY_META[sin.category];
            return (
              <span
                key={sin.id}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.borderColor}`}
              >
                {sin.icon} {sin.name}
              </span>
            );
          })}
        </div>

        {/* Kaffarah alert */}
        {hasKaffarah && (
          <Link
            href="/kaffarah"
            className="flex items-center gap-2 bg-red-500/8 border border-red-400/25 rounded-xl px-3 py-2.5 mb-3 hover:bg-red-500/12 transition-colors"
          >
            <Scale size={14} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600 dark:text-red-400 flex-1 leading-snug">
              ذنوبك تستلزم كفارة شرعية — اضغط لمتابعة خطواتها
            </p>
            <ChevronRight size={13} className="text-red-400 shrink-0" />
          </Link>
        )}

        {/* Conditions toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-2 py-2 text-primary text-xs font-bold"
        >
          <BookOpen size={13} />
          {expanded ? "إخفاء شروط التوبة" : `شروط توبتك الخاصة (${allConditions.length} خطوة)`}
          <ChevronDown size={13} className={`mr-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 pb-3">
                {allConditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] leading-relaxed flex-1">{cond}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── RestoreCodePanel ─────────────────────────────────────────────────────────

function RestoreCodePanel({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [inputCode, setInputCode] = useState("");
  const [tab, setTab] = useState<"view" | "enter">("view");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    const trimmed = inputCode.trim();
    if (!trimmed || trimmed === sessionId) return;
    try {
      localStorage.setItem("tawbah_session_id", trimmed);
      window.location.reload();
    } catch {}
  };

  return (
    <div className="bg-muted/40 border border-border rounded-2xl p-4" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-foreground">🔗 المزامنة بين الأجهزة</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("view")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-bold transition-all ${tab === "view" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          رمزي
        </button>
        <button
          onClick={() => setTab("enter")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-bold transition-all ${tab === "enter" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          أدخل رمزاً
        </button>
      </div>
      {tab === "view" ? (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">انسخ هذا الرمز واحفظه لاستعادة رحلتك من أي جهاز:</p>
          <div className="flex items-center gap-2 bg-background rounded-xl border border-border px-3 py-2">
            <code className="text-[10px] text-primary flex-1 break-all font-mono select-all">{sessionId}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded-lg font-bold"
            >
              {copied ? "✓" : "نسخ"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">الصق رمز الاستعادة الخاص بك:</p>
          <div className="flex gap-2">
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              placeholder="الصق الرمز هنا..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[11px] font-mono outline-none focus:border-primary"
              dir="ltr"
            />
            <button
              onClick={handleRestore}
              disabled={!inputCode.trim() || inputCode.trim() === sessionId}
              className="shrink-0 text-[11px] bg-primary text-primary-foreground px-3 py-2 rounded-xl font-bold disabled:opacity-40"
            >
              استعادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Journey30() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [showRestoreCode, setShowRestoreCode] = useState(false);
  const [localAllDone, setLocalAllDone] = useState(false);
  const [justCompleted, setJustCompleted] = useState<{ day: number; title: string } | null>(null);
  const completingDayRef = useRef<{ day: number; title: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery<JourneyData>({
    queryKey: ["journey30", sessionId],
    queryFn: async () => {
      const doFetch = (authHeader: Record<string, string>) =>
        fetchWithTimeout(`${getApiBase()}/journey30`, { headers: authHeader });

      try {
        let res = await doFetch(getAuthHeader());

        if (res.status === 401) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            setAuthToken(refreshData.session.access_token);
            res = await doFetch(getAuthHeader());
          } else {
            setLocation("/login");
            throw new Error("session_expired");
          }
        }

        if (!res.ok) throw new Error("Failed to fetch journey");
        return res.json() as Promise<JourneyData>;
      } catch (e) {
        if (isNativeApp()) {
          return buildNativeFallbackJourney();
        }
        throw e;
      }
    },
    enabled: !!sessionId && !!user,
    refetchInterval: false,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const res = await fetch(`${getApiBase()}/journey30/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ dayNumber }),
      });
      return res.json();
    },
    onSuccess: () => {
      if (completingDayRef.current) {
        setJustCompleted(completingDayRef.current);
        completingDayRef.current = null;
        setTimeout(() => setJustCompleted(null), 7000);
      }
      setLocalAllDone(false);
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 80);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (!authLoading && !user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" dir="rtl">
        <p className="text-sm font-bold">تعذّر تحميل الرحلة</p>
        <p className="text-xs text-muted-foreground">تحقق من اتصال الإنترنت أو إعدادات السيرفر، ثم أعد المحاولة.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const currentDay = data.days.find((d) => d.isCurrent);
  const completedDays = [...data.days.filter((d) => d.completed)].reverse();
  const progress = (data.completedCount / 30) * 100;
  const tasksAllDone = localAllDone || ((currentDay?.taskChecks?.length ?? 0) > 0 && (currentDay?.taskChecks?.every(Boolean) ?? false));
  const nextDayNum = (currentDay?.day ?? 0) + 1;

  // ── Completed journey ──────────────────────────────────────────────────────
  if (data.completedCount === 30) {
    return (
      <div className="flex-1 flex flex-col bg-background" dir="rtl">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center h-14 px-4">
            <Link href="/" className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center">
              <ArrowRight size={20} />
            </Link>
            <div className="flex-1 text-center">
              <p className="font-bold text-sm">رحلة ٣٠ يوماً</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">مكتملة</p>
            </div>
            <div className="w-10" />
          </div>
          <div className="h-1 bg-primary" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <Trophy size={72} className="text-amber-500 mx-auto" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-2xl font-black mb-2">تهانينا! أتممت الرحلة</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              أتممت رحلة الثلاثين يوماً — سجّل الله لك هذا الجهد وقبل منك التوبة إن شاء الله
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.1, type: "spring" }}>
                  <Star size={20} className="text-amber-400 fill-amber-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full bg-muted/40 rounded-2xl p-4 border border-border">
            <p className="text-xs font-bold text-muted-foreground">٣٠ يوماً · {data.streakDays} يوم متتالٍ</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center h-14 px-2 relative">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </Link>
          <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none px-14">
            <p className="font-bold text-sm text-foreground">رحلة ٣٠ يوماً</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {currentDay ? `اليوم ${currentDay.day} من ٣٠` : "طريق التوبة"}
            </p>
          </div>
          <button
            onClick={() => setShowRestoreCode((v) => !v)}
            className="mr-auto text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg"
          >
            استعادة
          </button>
        </div>
        {/* Overall progress bar */}
        <div className="h-1 bg-muted/40">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 px-4 pt-5 pb-36 overflow-y-auto flex flex-col gap-5">

        {/* ── Day completion celebration banner ─────────────────────────────── */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(5,150,105,0.18) 0%, rgba(4,120,87,0.1) 50%, rgba(251,191,36,0.12) 100%)",
                border: "1px solid rgba(5,150,105,0.35)",
                boxShadow: "0 8px 32px rgba(5,150,105,0.25), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Gold shimmer line at top */}
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{
                background: "linear-gradient(90deg, transparent, #fbbf24, #10b981, #fbbf24, transparent)",
              }} />

              <div className="relative p-5 text-center">
                {/* Stars row */}
                <div className="flex justify-center gap-1.5 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 400, damping: 14 }}
                    >
                      <Star size={18} className="text-amber-400 fill-amber-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Title */}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[11px] font-bold tracking-widest mb-1"
                  style={{ color: "rgba(16,185,129,0.85)" }}
                >
                  أحسنت! اكتمل اليوم {justCompleted.day}
                </motion.p>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 }}
                  className="text-[22px] font-black mb-2 leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #fde68a 50%, #10b981 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {justCompleted.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-[12px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Amiri Quran', serif" }}
                >
                  ﴿إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾
                </motion.p>

                {/* Trophy icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
                  className="flex justify-center mt-3"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <Trophy size={22} className="text-amber-400" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore code panel */}
        <AnimatePresence>
          {showRestoreCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <RestoreCodePanel sessionId={sessionId} onClose={() => setShowRestoreCode(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
            <Flame size={13} className="text-orange-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {data.streakDays} يوم متتالٍ
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Star size={13} className="text-primary fill-primary" />
            <span className="text-xs font-bold text-primary">
              {data.completedCount} / 30 مكتمل
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full mr-auto">
            <span className="text-xs text-muted-foreground font-bold">
              {30 - data.completedCount} يوم متبقٍ
            </span>
          </div>
        </div>

        {/* Sin integration panel */}
        <SinIntegrationPanel />

        {/* ── Current day hero ─────────────────────────────────────────────── */}
        {currentDay && (
          <motion.div
            key={currentDay.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: tasksAllDone
                ? "linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.08) 100%)"
                : "linear-gradient(135deg, rgba(var(--primary-rgb, 14,165,233), 0.12) 0%, rgba(var(--primary-rgb, 14,165,233), 0.05) 40%, rgba(245,158,11,0.08) 100%)",
              border: tasksAllDone
                ? "1px solid rgba(5,150,105,0.25)"
                : "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            {/* Decorative dots */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tasksAllDone ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <Flame size={13} className="text-primary" />
                    )}
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${tasksAllDone ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                      {tasksAllDone ? "أحسنت! اكتمل اليوم" : `اليوم ${currentDay.day} من ٣٠`}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-foreground leading-tight">
                    {currentDay.title}
                  </h1>
                </div>

                {/* Progress circle */}
                <div className="shrink-0 relative w-16 h-16 mr-3">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                    <motion.circle
                      cx="32" cy="32" r="27"
                      fill="none"
                      stroke={tasksAllDone ? "#10b981" : "var(--primary)"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      animate={{ strokeDashoffset: (1 - progress / 100) * 2 * Math.PI * 27 }}
                      transition={{ duration: 0.8 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-black ${tasksAllDone ? "text-emerald-500" : "text-primary"}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Verse */}
              <div
                className="rounded-2xl px-4 py-3 border"
                style={{
                  background: "color-mix(in srgb, var(--background) 50%, transparent)",
                  borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
                }}
              >
                <p
                  className="text-sm leading-relaxed text-center text-primary"
                  style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                >
                  {currentDay.verse}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Task section ─────────────────────────────────────────────────── */}
        {currentDay && !tasksAllDone && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">مهام اليوم {currentDay.day}</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <DayTaskList
              day={currentDay}
              sessionId={sessionId}
              onAllDone={() => setLocalAllDone(true)}
            />
          </>
        )}

        {/* ── Success state when all tasks done ────────────────────────────── */}
        <AnimatePresence>
          {tasksAllDone && currentDay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="rounded-2xl px-5 py-6 text-center border border-emerald-400/30"
              style={{
                background: "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(4,120,87,0.04))",
              }}
            >
              <div className="flex justify-center gap-1 mb-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.12, type: "spring" }}
                  >
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </div>
              <p className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                أحسنت! اكتملت مهام اليوم {currentDay.day}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                «إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ» — البقرة ٢٢٢
              </p>
              {nextDayNum <= 30 && (
                <p className="text-[11px] text-muted-foreground/70">
                  اضغط على زر الانتقال لتبدأ اليوم {nextDayNum}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Completed days history ────────────────────────────────────────── */}
        {completedDays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">الأيام المكتملة</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="flex flex-col gap-2">
              {completedDays.map((day, idx) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-primary/5 border border-primary/15"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{day.title}</p>
                    <p className="text-[10px] text-muted-foreground">اليوم {day.day}</p>
                  </div>
                  <Trophy size={13} className="text-amber-400 shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating "Next Day" button ────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 z-[55] px-4 max-w-md mx-auto"
        style={{ bottom: "108px" }}
      >
        <AnimatePresence mode="wait">
          {tasksAllDone && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <div
                className="p-2.5 rounded-2xl border border-border/60 shadow-2xl"
                style={{
                  background: "color-mix(in srgb, var(--background) 88%, transparent)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                }}
              >
                {nextDayNum <= 30 ? (
                  <motion.button
                    onClick={() => {
                      if (!currentDay) return;
                      completingDayRef.current = { day: currentDay.day, title: currentDay.title };
                      completeMutation.mutate(currentDay.day);
                    }}
                    disabled={completeMutation.isPending}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      boxShadow: [
                        "0 4px 20px rgba(5,150,105,0.40)",
                        "0 6px 28px rgba(5,150,105,0.65)",
                        "0 4px 20px rgba(5,150,105,0.40)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-full h-[50px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(to left, #059669, #047857)",
                      color: "#fff",
                    }}
                  >
                    {completeMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>انطلق لليوم {nextDayNum}</span>
                        <ArrowLeft size={17} className="text-white" />
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => {
                      if (!currentDay) return;
                      completingDayRef.current = { day: currentDay.day, title: currentDay.title };
                      completeMutation.mutate(currentDay.day);
                    }}
                    disabled={completeMutation.isPending}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-[50px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(to left, #d97706, #b45309)",
                      color: "#fff",
                    }}
                  >
                    {completeMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trophy size={17} className="text-white" />
                        <span>أتممت رحلتك! احصل على الشهادة</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
