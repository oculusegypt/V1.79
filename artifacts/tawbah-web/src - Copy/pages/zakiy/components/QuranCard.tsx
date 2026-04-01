import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Pause } from "lucide-react";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import type { MessageSegment } from "../types";
import { toGlobalAyah, reciterAudioUrl, getSurahName } from "../quran-helpers";

interface Props {
  seg: MessageSegment;
  isActive: boolean;
  isPlaying: boolean;
  onEnded: () => void;
  onManualToggle: () => void;
  reciterId: string;
}

export function QuranCard({ seg, isActive, isPlaying, onEnded, onManualToggle, reciterId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [verseText, setVerseText] = useState<string>(seg.text);
  const [verseLoading, setVerseLoading] = useState(true);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  useEffect(() => {
    setVerseLoading(true);
    const globalAyah = toGlobalAyah(seg.surah!, seg.ayah!);
    fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/quran-uthmani`)
      .then(r => r.json())
      .then((data: { data?: { text?: string } }) => {
        if (data?.data?.text) setVerseText(data.data.text);
      })
      .catch(() => {})
      .finally(() => setVerseLoading(false));
  }, [seg.surah, seg.ayah]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = reciterAudioUrl(seg.surah!, seg.ayah!, reciterId);
    audioRef.current = audio;
    setAudioError(false);
    audio.onended = () => onEndedRef.current();
    audio.onerror = () => { setAudioError(true); onEndedRef.current(); };
    return () => { audio.pause(); audio.src = ""; audio.onended = null; audio.onerror = null; audioRef.current = null; };
  }, [seg.surah, seg.ayah, reciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive && isPlaying) {
      setAudioError(false);
      audio.play().catch(() => {});
    } else {
      audio.pause();
      if (!isActive) audio.currentTime = 0;
    }
  }, [isActive, isPlaying]);

  const reciterName = QURAN_RECITERS.find(r => r.id === reciterId)?.nameAr ?? "القرآن الكريم";

  return (
    <div
      className="my-3 rounded-2xl overflow-hidden"
      style={{
        boxShadow: "0 4px 24px rgba(5,150,105,0.15), 0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: "linear-gradient(135deg,#065f46,#0d9488)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
          >
            <BookOpen size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-emerald-200 leading-none mb-1 truncate font-medium">
              {reciterName}
            </div>
            <div className="text-[13px] font-bold text-white leading-none">
              سورة {getSurahName(seg.surah!)} — آية {seg.ayah}
            </div>
          </div>
        </div>

        <button
          onClick={onManualToggle}
          className="shrink-0 flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-full transition-all font-bold active:scale-95"
          style={
            isActive && isPlaying
              ? { background: "rgba(255,255,255,0.95)", color: "#065f46" }
              : { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }
          }
        >
          {isActive && isPlaying
            ? <><Pause size={11} strokeWidth={2.5} />إيقاف</>
            : <><Play  size={11} strokeWidth={2.5} />استمع</>
          }
        </button>
      </div>

      <div
        className="relative px-5 pb-5 pt-6 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#fffbf0,#fef9f0,#fffdf5)" }}
      >
        <span className="pointer-events-none select-none absolute -top-2 left-3 text-[80px] leading-none font-serif" style={{ color: "rgba(217,119,6,0.15)" }}>﴿</span>
        <span className="pointer-events-none select-none absolute -bottom-5 right-3 text-[80px] leading-none font-serif" style={{ color: "rgba(217,119,6,0.15)" }}>﴾</span>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg,transparent,rgba(217,119,6,0.4),transparent)" }} />

        {verseLoading ? (
          <div className="flex justify-center items-center gap-2 py-7">
            {[0, 150, 300].map((d) => (
              <motion.span key={d} className="w-2 h-2 bg-emerald-400 rounded-full block"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d / 1000 }}
              />
            ))}
          </div>
        ) : (
          <p
            className="quran-text text-right leading-[2.2] relative z-10 px-2"
            style={{ color: "#1c1917", fontSize: "1.05rem" }}
          >
            ﴿{verseText}﴾
          </p>
        )}

        {isActive && isPlaying && (
          <div className="flex gap-[3px] items-end justify-center mt-4 h-5 relative z-10">
            {[4,7,11,8,5,10,7,4,9,6,11,7,5].map((h, k) => (
              <span
                key={k}
                className="quran-wave-bar w-[3px] rounded-full"
                style={{
                  height: `${h}px`,
                  background: "#059669",
                  animation: "quranWave 0.8s ease-in-out infinite alternate",
                  animationDelay: `${k * 65}ms`,
                }}
              />
            ))}
          </div>
        )}

        {audioError && (
          <p className="text-[10px] text-red-400/80 text-center mt-2 relative z-10">تعذّر تشغيل الصوت</p>
        )}
      </div>
    </div>
  );
}
