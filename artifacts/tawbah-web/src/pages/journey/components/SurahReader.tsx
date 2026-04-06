import { useState, useEffect, useRef } from "react";
import { setAudioSrc } from "@/lib/native-audio";
import { BookOpen, BookText, X, Loader2, Play } from "lucide-react";
import { toArabicIndic, toGlobalAyah } from "../utils";
import { getApiBase } from "@/lib/api-base";

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
  if (surahNumber === 1 || surahNumber === 9) return false;
  if (ayah.numberInSurah !== 1) return false;
  const normalized = ayah.text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s+/g, "");
  if (!normalized.startsWith("بسماللهالرحمن") && !normalized.startsWith("بسمالله")) return false;
  return ayah.text.trim().split(/\s+/).length <= 5;
}

export interface SurahRef { number: number; name: string; startAyah?: number; endAyah?: number; }
interface SurahAyah { number: number; numberInSurah: number; text: string; }

const SURAH_TASK_MAP: Array<{ pattern: RegExp; surahs: SurahRef[] }> = [
  { pattern: /سورة التوبة/,       surahs: [{ number: 9,   name: "سورة التوبة" }] },
  { pattern: /قصة يوسف/,          surahs: [{ number: 12,  name: "سورة يوسف" }] },
  { pattern: /المعوذتين/,          surahs: [{ number: 113, name: "سورة الفلق" }, { number: 114, name: "سورة الناس" }] },
  { pattern: /الكهف/,              surahs: [{ number: 18,  name: "سورة الكهف" }] },
  { pattern: /الفاتحة/,            surahs: [{ number: 1,   name: "سورة الفاتحة" }] },
  { pattern: /البقرة/,             surahs: [{ number: 2,   name: "سورة البقرة" }] },
  { pattern: /آية الكرسي/,        surahs: [{ number: 2,   name: "آية الكرسي", startAyah: 255, endAyah: 255 }] },
];

export function extractSurahsFromTask(task: string): SurahRef[] | null {
  for (const entry of SURAH_TASK_MAP) {
    if (entry.pattern.test(task)) return entry.surahs;
  }
  return null;
}

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
      } catch { setError(true); } finally { setLoading(false); }
    })();
  }, [surahNumber]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); preloadRef.current?.pause(); };
  }, []);

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
    const url = `${getApiBase()}/audio-proxy/quran/ar.alafasy/${toGlobalAyah(surahNumber, ayah.numberInSurah)}.mp3`;
    void setAudioSrc(pre, url).then(() => {
      pre.load();
      pre.volume = 0;
      pre.play().then(() => { pre.pause(); pre.currentTime = 0; pre.volume = 1; }).catch(() => { pre.volume = 1; });
    }).catch(() => {});
    preloadedIdxRef.current = idx;
  };

  const playFromIdx = (idx: number) => {
    if (!displayAyahs[idx]) return;
    const ayah = displayAyahs[idx]!;
    
    // Stop any currently playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; }
    
    // Always use fresh audio load for reliability
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.pause();
    audio.onended = null;
    
    const url = `${getApiBase()}/audio-proxy/quran/ar.alafasy/${toGlobalAyah(surahNumber, ayah.numberInSurah)}.mp3`;
    
    void setAudioSrc(audio, url).then(() => {
      audio.load();
      // Set up onended handler after audio is loaded
      audio.onended = () => {
        const next = idx + 1;
        if (next < displayAyahs.length) {
          setCurrentIdx(next);
          playFromIdxRef.current(next);
          ayahRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else { setIsPlaying(false); setCurrentIdx(null); }
      };
      audio.play().catch(() => {});
    }).catch(() => {});
    
    setCurrentIdx(idx); setIsPlaying(true);
    ayahRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    const next = idx + 1;
    if (next < displayAyahs.length) preloadFromIdx(next);
  };

  useEffect(() => { playFromIdxRef.current = playFromIdx; });

  const togglePlayPause = () => {
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
    else {
      if (currentIdx === null || !audioRef.current) playFromIdx(currentIdx ?? 0);
      else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
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
    } catch {} finally { setTafseerLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingBottom: "80px" }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative mt-auto mx-auto w-full max-w-lg bg-card rounded-t-2xl border border-border shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between px-5 mb-2">
            <div className="w-8" />
            <div className="text-center">
              <p className="text-2xl text-primary font-bold" style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}>
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

        <div className="flex gap-2 px-5 py-3 border-b border-border shrink-0">
          <button
            onClick={() => setShowTafseer(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              !showTafseer ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            <BookOpen size={13} /> قراءة السورة
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

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>}
          {error && <p className="text-sm text-muted-foreground text-center py-8">تعذّر تحميل السورة. تأكد من اتصالك بالإنترنت.</p>}
          {!loading && !error && (
            <div className="pb-4">
              {!isRanged && surahNumber !== 9 && (
                <div className="flex flex-col items-center my-5">
                  <div className="flex items-center w-full gap-3 mb-1">
                    <div className="flex-1 h-px bg-border/60" />
                    <p className="text-center text-foreground" dir="rtl" style={{ fontFamily: "'Amiri Quran', 'Amiri', serif", fontSize: "20px", lineHeight: 2 }}>
                      بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
                    </p>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                </div>
              )}

              {!showTafseer && (
                <div dir="rtl" className="leading-[3] text-[18px] text-right" style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif", textAlign: "justify" }}>
                  {displayAyahs.map((ayah, displayIdx) => {
                    const isCurrent = currentIdx === displayIdx;
                    const displayText = displayIdx === 0 && !isRanged && surahNumber !== 1 && surahNumber !== 9
                      ? stripBismillahPrefix(ayah.text)
                      : ayah.text;
                    return (
                      <span key={ayah.number}>
                        <span
                          ref={(el) => { ayahRefs.current[displayIdx] = el; }}
                          onClick={() => playFromIdx(displayIdx)}
                          className={`cursor-pointer rounded transition-colors ${isCurrent ? "bg-primary/20 text-primary" : "hover:bg-muted/60"}`}
                        >
                          {displayText}
                        </span>
                        {" "}
                        <span
                          onClick={() => playFromIdx(displayIdx)}
                          title={`الآية ${ayah.numberInSurah}`}
                          className={`cursor-pointer transition-colors ${isCurrent ? "text-primary" : "text-primary/70 hover:text-primary"}`}
                          style={{ fontFamily: "'Amiri Quran', 'Amiri', serif", fontSize: "1em", position: "relative", top: "-0.12em", display: "inline-block" }}
                        >
                          {"\u06DD"}{toArabicIndic(ayah.numberInSurah)}
                        </span>
                        {" "}
                      </span>
                    );
                  })}
                </div>
              )}

              {showTafseer && (
                <div className="flex flex-col gap-3">
                  {tafseerDisplayAyahs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">جاري تحميل التفسير...</p>
                  ) : (
                    displayAyahs.map((ayah, displayIdx) => {
                      const isCurrent = currentIdx === displayIdx;
                      const tafseer = tafseerDisplayAyahs[displayIdx];
                      return (
                        <div key={ayah.number} ref={(el) => { ayahRefs.current[displayIdx] = el; }}
                          className={`rounded-xl border overflow-hidden transition-all ${isCurrent ? "border-primary/40 shadow-sm" : "border-border/50"}`}
                        >
                          <div className={`px-4 py-3 cursor-pointer ${isCurrent ? "bg-primary/10" : "bg-muted/20 hover:bg-muted/40"}`}
                            onClick={() => playFromIdx(displayIdx)} dir="rtl"
                          >
                            <span className="leading-[2.8] text-[17px]" style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}>
                              {displayIdx === 0 && !isRanged && surahNumber !== 1 && surahNumber !== 9
                                ? stripBismillahPrefix(ayah.text) : ayah.text}
                              {" "}
                              <span className={isCurrent ? "text-primary" : "text-primary/70"}
                                style={{ fontFamily: "'Amiri Quran', 'Amiri', serif", fontSize: "1em", position: "relative", top: "-0.12em", display: "inline-block" }}
                              >
                                {"\u06DD"}{toArabicIndic(ayah.numberInSurah)}
                              </span>
                            </span>
                          </div>
                          {tafseer && (
                            <div className="px-4 py-2.5 border-t border-border/40 bg-card/60" dir="rtl">
                              <p className="text-[12px] text-muted-foreground leading-relaxed">{tafseer.text}</p>
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
                ) : <Play size={16} className="mr-[-2px]" />}
              </button>
              <div className="flex-1 min-w-0">
                {currentIdx !== null ? (
                  <>
                    <p className="text-xs font-bold truncate">{isPlaying ? "يُشغَّل الآن" : "متوقف"} — الآية {displayAyahs[currentIdx]?.numberInSurah}</p>
                    <div className="w-full bg-primary/10 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / displayAyahs.length) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">اضغط على أي آية للاستماع من هناك</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => currentIdx !== null && currentIdx > 0 && playFromIdx(currentIdx - 1)}
                  disabled={currentIdx === null || currentIdx === 0}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <button onClick={() => currentIdx !== null && currentIdx < displayAyahs.length - 1 && playFromIdx(currentIdx + 1)}
                  disabled={currentIdx === null || currentIdx === displayAyahs.length - 1}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
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

export function SurahButton({ task }: { task: string }) {
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
          <SurahReaderModal surahNumber={openSurah.number} surahName={openSurah.name} startAyah={openSurah.startAyah} endAyah={openSurah.endAyah} onClose={() => setOpenSurah(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {surahs.map((s) => (
          <button key={s.number} onClick={() => setOpenSurah(s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <BookOpen size={12} /> {s.name}
          </button>
        ))}
      </div>
      {openSurah && (
        <SurahReaderModal surahNumber={openSurah.number} surahName={openSurah.name} startAyah={openSurah.startAyah} endAyah={openSurah.endAyah} onClose={() => setOpenSurah(null)} />
      )}
    </>
  );
}
