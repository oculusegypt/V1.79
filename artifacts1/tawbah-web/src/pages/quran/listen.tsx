import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Search, ChevronRight,
  Volume2, Loader2, RotateCcw, Check, X, Image, Activity,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { apiUrl, isNativeApp } from "@/lib/api-base";
import { setAudioSrc } from "@/lib/native-audio";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobal(surah: number, ayah: number): number {
  let c = 0;
  for (let i = 0; i < surah - 1; i++) c += SURAH_LENGTHS[i] ?? 0;
  return c + ayah;
}

const TO_AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEA(n: number) { return String(n).split('').map(d => TO_AR[parseInt(d)] ?? d).join(''); }

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

function isBismillahOnly(text: string): boolean {
  const normalized = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s+/g, "");
  return normalized.startsWith("بسماللهالرحمنالرحيم") && text.trim().split(/\s+/).length <= 6;
}

// ─── Nature gallery images ────────────────────────────────────────────────────

const NATURE_IMAGES = [
  "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=900&q=85",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=85",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85",
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=900&q=85",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=85",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=900&q=85",
];

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Surah { id: number; name: string; nameEn: string; ayahCount: number; juz: number; revelation: string; }
interface Ayah { numberInSurah: number; text: string; }

const SURAHS: Surah[] = [
  { id:1,  name:"الفاتحة",  nameEn:"Al-Fatiha",    ayahCount:7,   juz:1,  revelation:"مكية"  },
  { id:2,  name:"البقرة",   nameEn:"Al-Baqara",    ayahCount:286, juz:1,  revelation:"مدنية" },
  { id:3,  name:"آل عمران", nameEn:"Aal Imran",    ayahCount:200, juz:3,  revelation:"مدنية" },
  { id:4,  name:"النساء",   nameEn:"An-Nisa",      ayahCount:176, juz:4,  revelation:"مدنية" },
  { id:5,  name:"المائدة",  nameEn:"Al-Maida",     ayahCount:120, juz:6,  revelation:"مدنية" },
  { id:6,  name:"الأنعام",  nameEn:"Al-Anam",      ayahCount:165, juz:7,  revelation:"مكية"  },
  { id:7,  name:"الأعراف",  nameEn:"Al-Araf",      ayahCount:206, juz:8,  revelation:"مكية"  },
  { id:8,  name:"الأنفال",  nameEn:"Al-Anfal",     ayahCount:75,  juz:9,  revelation:"مدنية" },
  { id:9,  name:"التوبة",   nameEn:"At-Tawba",     ayahCount:129, juz:10, revelation:"مدنية" },
  { id:10, name:"يونس",     nameEn:"Yunus",        ayahCount:109, juz:11, revelation:"مكية"  },
  { id:11, name:"هود",      nameEn:"Hud",          ayahCount:123, juz:11, revelation:"مكية"  },
  { id:12, name:"يوسف",     nameEn:"Yusuf",        ayahCount:111, juz:12, revelation:"مكية"  },
  { id:13, name:"الرعد",    nameEn:"Ar-Rad",       ayahCount:43,  juz:13, revelation:"مدنية" },
  { id:14, name:"إبراهيم",  nameEn:"Ibrahim",      ayahCount:52,  juz:13, revelation:"مكية"  },
  { id:15, name:"الحجر",    nameEn:"Al-Hijr",      ayahCount:99,  juz:14, revelation:"مكية"  },
  { id:16, name:"النحل",    nameEn:"An-Nahl",      ayahCount:128, juz:14, revelation:"مكية"  },
  { id:17, name:"الإسراء",  nameEn:"Al-Isra",      ayahCount:111, juz:15, revelation:"مكية"  },
  { id:18, name:"الكهف",    nameEn:"Al-Kahf",      ayahCount:110, juz:15, revelation:"مكية"  },
  { id:19, name:"مريم",     nameEn:"Maryam",       ayahCount:98,  juz:16, revelation:"مكية"  },
  { id:20, name:"طه",       nameEn:"Ta-Ha",        ayahCount:135, juz:16, revelation:"مكية"  },
  { id:36, name:"يس",       nameEn:"Ya-Sin",       ayahCount:83,  juz:22, revelation:"مكية"  },
  { id:55, name:"الرحمن",   nameEn:"Ar-Rahman",    ayahCount:78,  juz:27, revelation:"مدنية" },
  { id:56, name:"الواقعة",  nameEn:"Al-Waqia",     ayahCount:96,  juz:27, revelation:"مكية"  },
  { id:67, name:"الملك",    nameEn:"Al-Mulk",      ayahCount:30,  juz:29, revelation:"مكية"  },
  { id:73, name:"المزمل",   nameEn:"Al-Muzzammil", ayahCount:20,  juz:29, revelation:"مكية"  },
  { id:78, name:"النبأ",    nameEn:"An-Naba",      ayahCount:40,  juz:30, revelation:"مكية"  },
  { id:97, name:"القدر",    nameEn:"Al-Qadr",      ayahCount:5,   juz:30, revelation:"مكية"  },
  { id:112,name:"الإخلاص",  nameEn:"Al-Ikhlas",    ayahCount:4,   juz:30, revelation:"مكية"  },
  { id:113,name:"الفلق",    nameEn:"Al-Falaq",     ayahCount:5,   juz:30, revelation:"مكية"  },
  { id:114,name:"الناس",    nameEn:"An-Nas",       ayahCount:6,   juz:30, revelation:"مكية"  },
];

// ─── Gallery ──────────────────────────────────────────────────────────────────

function NatureGallery({ onClose }: { onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setImgIdx(i => (i + 1) % NATURE_IMAGES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: 156 }}>
      <AnimatePresence mode="sync">
        <motion.div
          key={imgIdx}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={NATURE_IMAGES[imgIdx]}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.72) saturate(1.15)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay gradient */}
      <div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <X size={13} style={{ color: "rgba(255,255,255,0.9)" }} />
      </button>

      {/* Label */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        <Image size={11} style={{ color: "rgba(255,255,255,0.7)" }} />
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>خلق الله</span>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {NATURE_IMAGES.map((_, i) => (
          <div
            key={i}
            onClick={() => setImgIdx(i)}
            className="cursor-pointer rounded-full transition-all"
            style={{
              width: i === imgIdx ? 14 : 5,
              height: 5,
              background: i === imgIdx ? "rgba(200,168,75,0.9)" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Waveform (pure canvas animation — no Web Audio API) ──────────────────────

function Waveform({ isPlaying, onOpenGallery }: { isPlaying: boolean; onOpenGallery: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const barCount = 40;
      const barW = (W - (barCount - 1) * 2) / barCount;
      const t = Date.now() / 500;

      for (let i = 0; i < barCount; i++) {
        let barH: number;
        if (isPlaying) {
          const v1 = Math.sin(t * 1.6 + i * 0.5) * 0.35;
          const v2 = Math.sin(t * 2.8 + i * 0.8) * 0.25;
          const v3 = Math.sin(t * 0.9 + i * 0.3) * 0.25;
          const v4 = Math.sin(t * 3.5 + i * 1.2) * 0.15;
          barH = Math.max(5, ((v1 + v2 + v3 + v4 + 1) / 2) * H * 0.90);
        } else {
          barH = 4 + Math.sin(Date.now() / 2200 + i * 0.6) * 2;
        }
        const x = i * (barW + 2);
        const alpha = isPlaying ? 0.45 + (barH / H) * 0.55 : 0.22;
        ctx.fillStyle = `rgba(200,168,75,${alpha})`;
        ctx.beginPath();
        if ((ctx as CanvasRenderingContext2D & { roundRect?: (...a: unknown[]) => void }).roundRect) {
          (ctx as CanvasRenderingContext2D & { roundRect: (...a: unknown[]) => void }).roundRect(x, H - barH, barW, barH, 2);
        } else {
          ctx.rect(x, H - barH, barW, barH);
        }
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return (
    <div
      className="relative w-full rounded-2xl flex flex-col items-end justify-end overflow-hidden"
      style={{
        height: 156,
        background: "linear-gradient(160deg, rgba(200,168,75,0.06) 0%, rgba(0,0,0,0) 100%)",
        border: "1px solid rgba(200,168,75,0.13)",
      }}
    >
      <canvas ref={canvasRef} width={360} height={120} className="w-full" style={{ height: 120 }} />
      <button
        onClick={onOpenGallery}
        className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center active:scale-95"
        style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.28)" }}
      >
        <Image size={13} style={{ color: "#c8a84b" }} />
      </button>
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <Activity size={11} style={{ color: "rgba(200,168,75,0.55)" }} />
        <span className="text-[10px]" style={{ color: "rgba(200,168,75,0.55)" }}>
          {isPlaying ? "يُشغَّل الآن" : "في انتظار التشغيل"}
        </span>
      </div>
    </div>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────

function Player({ surah, reciterId, onBack }: { surah: Surah; reciterId: string; onBack: () => void }) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCT] = useState(0);
  const [loop, setLoop] = useState(false);
  const [showGallery, setShowGallery] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    async function fetchSurah(): Promise<void> {
      const parseSurah = (data: { code: number; data: { ayahs: Ayah[] } }) => {
        if (data.code === 200) {
          let list: Ayah[] = data.data.ayahs;
          if (surah.id !== 1 && surah.id !== 9) {
            list = list.filter(a => !(a.numberInSurah === 1 && isBismillahOnly(a.text)));
            if (list.length > 0 && list[0]) {
              list[0] = { ...list[0], text: stripBismillahPrefix(list[0].text) };
            }
          }
          setAyahs(list);
        } else {
          throw new Error(`API error: ${data.code}`);
        }
      };

      // Primary: app's own API proxy (caches results)
      try {
        const r = await fetch(apiUrl(`/api/quran/surah/${surah.id}`), { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json() as { code: number; data: { ayahs: Ayah[] } };
        parseSurah(data);
        return;
      } catch (primaryErr) {
        console.warn("[Quran] Primary API failed, trying CDN fallback:", primaryErr);
      }

      // Fallback: alquran.cloud directly (works on native when server unreachable)
      try {
        const r = await fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/quran-uthmani`, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) throw new Error(`CDN HTTP ${r.status}`);
        const data = await r.json() as { code: number; data: { ayahs: Ayah[] } };
        parseSurah(data);
      } catch (fallbackErr) {
        setError(`تعذّر تحميل السورة — تحقق من الاتصال بالإنترنت`);
        console.error("[Quran] CDN fallback also failed:", fallbackErr);
      }
    }

    fetchSurah().finally(() => setLoading(false));
  }, [surah.id]);

  const playAyah = useCallback((idx: number) => {
    const ayah = ayahs[idx];
    if (!ayah) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.pause();
    const globalAyah = toGlobal(surah.id, ayah.numberInSurah);
    const url = isNativeApp()
      ? `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalAyah}.mp3`
      : `${apiUrl("/api/audio-proxy/quran")}/${reciterId}/${globalAyah}.mp3`;
    void setAudioSrc(audio, url)
      .then(() => {
        audio.load();
        return audio.play();
      })
      .catch(() => {});
    setCurrentIdx(idx);
    setIsPlaying(true);
    setProgress(0);
    audio.onended = () => {
      if (loop) { audio.currentTime = 0; audio.play().catch(() => {}); }
      else if (idx + 1 < ayahs.length) playAyah(idx + 1);
      else { setIsPlaying(false); setProgress(0); }
    };
    setTimeout(() => {
      const el = scrollRef.current?.children[idx] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 100);
  }, [ayahs, surah.id, reciterId, loop]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const onTime = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCT(audio.currentTime);
        setDuration(audio.duration);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) {
      if (ayahs.length > 0) playAyah(currentIdx);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const currentAyah = ayahs[currentIdx];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b shrink-0" style={{ borderColor: "rgba(200,168,75,0.12)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold" style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}>سورة {surah.name}</p>
          <p className="text-[10px] text-muted-foreground">{surah.ayahCount} آية · {surah.revelation}</p>
        </div>
        <div className="w-8" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: "#c8a84b" }} />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
          <p className="text-red-400 text-sm text-center">{error}</p>
          <p className="text-muted-foreground text-xs text-center">API: {apiUrl("/api/quran/surah")}/${surah.id}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Current ayah display */}
          <div
            className="flex-1 flex flex-col items-center justify-center px-6 py-4"
            style={{ background: "linear-gradient(160deg, rgba(200,168,75,0.05) 0%, rgba(0,0,0,0) 100%)" }}
          >
            <AnimatePresence mode="wait">
              {currentAyah && (
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center max-w-full"
                >
                  <p
                    className="leading-[2.9] mb-3"
                    style={{
                      fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                      fontSize: 22,
                      color: isPlaying ? "#c8a84b" : "var(--foreground)",
                      transition: "color 0.4s",
                    }}
                  >
                    {currentAyah.text}
                    {" "}
                    <span style={{ fontFamily: "'Amiri Quran', serif", fontSize: 18, color: "rgba(200,168,75,0.7)" }}>
                      ﴿{toEA(currentAyah.numberInSurah)}﴾
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    آية {toEA(currentAyah.numberInSurah)} من {toEA(surah.ayahCount)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gallery / Waveform */}
          <div className="px-4 pb-2 shrink-0">
            <AnimatePresence mode="wait">
              {showGallery ? (
                <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <NatureGallery onClose={() => setShowGallery(false)} />
                </motion.div>
              ) : (
                <motion.div key="waveform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <Waveform isPlaying={isPlaying} onOpenGallery={() => setShowGallery(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ayah scroll row — ﴿١﴾ format */}
          <div
            className="overflow-x-auto px-4 py-2 border-t shrink-0 ayah-scroll-row"
            style={{ borderColor: "rgba(200,168,75,0.1)" }}
          >
            <div ref={scrollRef} className="flex gap-1.5 min-w-max">
              {ayahs.map((a, i) => (
                <button
                  key={a.numberInSurah}
                  onClick={() => playAyah(i)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-[14px] transition-all active:scale-95 ${
                    i === currentIdx
                      ? "border text-primary"
                      : "border border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                  style={{
                    background: i === currentIdx ? "rgba(200,168,75,0.18)" : "transparent",
                    borderColor: i === currentIdx ? "rgba(200,168,75,0.5)" : undefined,
                    color: i === currentIdx ? "#c8a84b" : undefined,
                    fontFamily: "'Amiri Quran', serif",
                    direction: "rtl",
                    minWidth: 36,
                    letterSpacing: 0,
                  }}
                >
                  ﴿{toEA(a.numberInSurah)}﴾
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div
              className="h-1.5 rounded-full overflow-hidden mb-1 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)" }}
              onClick={e => {
                if (!audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = ratio * duration;
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #c8a84b, #f0d070)", width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{fmtTime(currentTime)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-5 pb-5 shrink-0">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setLoop(l => !l)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: loop ? "rgba(200,168,75,0.2)" : "rgba(255,255,255,0.05)",
                  color: loop ? "#c8a84b" : "rgba(255,255,255,0.4)",
                }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => currentIdx > 0 && playAyah(currentIdx - 1)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <SkipForward size={20} className="text-muted-foreground" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #c8a84b, #a07c2a)",
                  boxShadow: isPlaying ? "0 4px 24px rgba(200,168,75,0.45)" : "0 4px 20px rgba(200,168,75,0.3)",
                }}
              >
                {isPlaying
                  ? <Pause size={26} style={{ color: "#1a0e00" }} />
                  : <Play size={26} style={{ color: "#1a0e00", marginLeft: 3 }} />}
              </button>
              <button
                onClick={() => currentIdx < ayahs.length - 1 && playAyah(currentIdx + 1)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <SkipBack size={20} className="text-muted-foreground" />
              </button>
              <div className="w-9 h-9" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Surah Picker ─────────────────────────────────────────────────────────────

function SurahList({ onSelect }: { onSelect: (s: Surah) => void }) {
  const [search, setSearch] = useState("");
  const filtered = SURAHS.filter(s => s.name.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن سورة..."
            className="flex-1 bg-transparent text-sm outline-none text-right"
            dir="rtl"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {filtered.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.01 }}
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 text-right active:scale-[0.98] transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px]"
              style={{
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#3b82f6",
                fontFamily: "'Amiri Quran', serif",
              }}
            >
              {toEA(s.id)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight" style={{ fontFamily: "'Amiri Quran', serif" }}>{s.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.nameEn} · {s.ayahCount} آية · {s.revelation}</p>
            </div>
            <Play size={14} className="text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranListenPage() {
  const { quranReciterId, setQuranReciterId } = useSettings();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const currentReciter = QURAN_RECITERS.find(r => r.id === quranReciterId);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <PageHeader
        title="الاستماع للقرآن"
        subtitle="اختر سورة وقارئاً"
        right={
          <button
            onClick={() => setShowReciterPicker(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <Volume2 size={13} style={{ color: "#3b82f6" }} />
            <span className="text-[11px] font-bold" style={{ color: "#3b82f6" }}>{currentReciter?.nameAr.split(" ")[0]}</span>
          </button>
        }
      />

      <AnimatePresence>
        {showReciterPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b mx-4 shrink-0"
            style={{ borderColor: "rgba(59,130,246,0.15)" }}
          >
            <div className="py-2 flex flex-col gap-1" dir="rtl">
              {QURAN_RECITERS.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setQuranReciterId(r.id); setShowReciterPicker(false); }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: quranReciterId === r.id ? "rgba(59,130,246,0.1)" : "transparent",
                    border: quranReciterId === r.id ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                  }}
                >
                  <span className="text-sm">{r.nameAr}</span>
                  {quranReciterId === r.id && <Check size={13} style={{ color: "#3b82f6" }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSurah ? (
          <Player surah={selectedSurah} reciterId={quranReciterId} onBack={() => setSelectedSurah(null)} />
        ) : (
          <SurahList onSelect={setSelectedSurah} />
        )}
      </div>
    </div>
  );
}
