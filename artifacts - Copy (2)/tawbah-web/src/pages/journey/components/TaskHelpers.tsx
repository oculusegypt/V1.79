import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BookOpen, Play, Square, RotateCcw, X } from "lucide-react";
import { toArabicIndic, toGlobalAyah as _toGlobalAyah } from "../utils";

export function parseIstighfarCount(task: string): number {
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

export function isIstighfarTask(task: string): boolean {
  return /استغفر|الاستغفار|أستغفر/.test(task) && !/سورة/.test(task);
}

export function isDhikrCounterTask(task: string): boolean {
  return /(\d+|مائة|مئة|سبعين|ثمانين|خمسين|أربعين|ثلاثين|عشرين|عشرة)\s*مرة/.test(task) && !/سورة|صفحت|صفحتين/.test(task);
}

export function getDhikrLabel(task: string): string {
  if (/استغفر|أستغفر|الاستغفار/.test(task)) return "اضغط للاستغفار";
  if (/سبحان الله/.test(task)) return "اضغط للتسبيح";
  if (/الحمد لله/.test(task)) return "اضغط للتحميد";
  if (/الله أكبر/.test(task)) return "اضغط للتكبير";
  return "اضغط للذكر";
}

export function isPrayerTask(task: string): boolean {
  return /صلاة (الفجر|الظهر|العصر|المغرب|العشاء)|أدِّ صلاة|أدّ صلاة|صلِّ الفريضة|صلّ الفريضة/.test(task);
}

export function extractPrayerName(task: string): string {
  const m = task.match(/صلاة (الفجر|الظهر|العصر|المغرب|العشاء)/);
  return m ? m[1]! : "الصلاة";
}

export function isQuranPagesTask(task: string): boolean {
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

// ─── IstighfarCounter ────────────────────────────────────────────────────────

export function IstighfarCounter({
  count, done, onDone, label,
}: { count: number; done: boolean; onDone: () => void; label?: string }) {
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
          <button
            onClick={() => setCurrent(0)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="إعادة"
          >
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

export function PrayerReminderButton({ task }: { task: string }) {
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
        onClick={() => setShowOptions((v) => !v)}
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
              {["قبل ٥ دقائق", "قبل ١٠ دقائق", "عند الأذان", "وقت مخصص"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleSet(label)}
                  className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0"
                >
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── QuranPagePanel ───────────────────────────────────────────────────────────

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
    pre.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${_toGlobalAyah(ayah.surah.number, ayah.numberInSurah)}.mp3`;
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
      audio.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${_toGlobalAyah(ayah.surah.number, ayah.numberInSurah)}.mp3`;
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <p dir="rtl" className="leading-[2.8] text-[16px] text-right" style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}>
            {ayahs.map((ayah, idx) => (
              <span key={ayah.number} onClick={() => { setCurrentIdx(idx); playFromIdx(idx); }}
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

// ─── QuranPagesButton ─────────────────────────────────────────────────────────

export function QuranPagesButton({ done, onDone }: { done: boolean; onDone: () => void }) {
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
              <button key={p1} onClick={() => handleSelect([p1, p2])}
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
