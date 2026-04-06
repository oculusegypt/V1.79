import React from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Play, Mic2, ChevronLeft } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { PODCAST_CATEGORIES } from "./islamic-programs/data";

const CARD_W = 118;
const CARD_H = 86;
const GAP = 10;

export default function PodcastCategoryPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const category = PODCAST_CATEGORIES.find(c => c.id === params.id);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    const onEnded = () => setPlayingId(null);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  if (!category) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ direction: "rtl" }}
      >
        <div className="text-6xl">🔍</div>
        <p className="text-lg font-bold">التصنيف غير موجود</p>
        <button
          onClick={() => setLocation("/islamic-programs")}
          className="px-6 py-2.5 rounded-full text-[14px] font-bold"
          style={{ background: "#8b5cf6", color: "#fff" }}
        >
          العودة للبرامج
        </button>
      </div>
    );
  }

  const handlePlayEpisode = async (episodeId: string, mediaUrl: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    
    if (playingId === episodeId) {
      a.pause();
      setPlayingId(null);
      return;
    }
    
    a.src = mediaUrl;
    a.preload = "none";
    try {
      await a.play();
      setPlayingId(episodeId);
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <div
      className="min-h-screen pb-28"
      style={{ direction: "rtl", background: isDark ? "#0a0a0a" : "#f9fafb" }}
    >
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          minHeight: 200,
        }}
      >
        {/* Background Image */}
        {category.imageUrl && (
          <>
            <img 
              src={category.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-contain opacity-25"
              style={{ transform: "scale(0.8)" }}
            />
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${category.color}88 0%, ${category.colorTo}99 50%, rgba(0,0,0,0.6) 100%)` }} />
          </>
        )}
        {!category.imageUrl && (
          <div 
            className="absolute inset-0"
            style={{ background: `linear-gradient(160deg, ${category.color} 0%, ${category.colorTo} 100%)` }}
          />
        )}
        
        <div className="absolute top-[-40px] right-[-40px] w-[150px] h-[150px] rounded-full opacity-15 bg-white" />
        <div className="absolute bottom-[-30px] left-[-30px] w-[100px] h-[100px] rounded-full opacity-10 bg-white" />

        <button
          type="button"
          onClick={() => setLocation("/islamic-programs")}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
        >
          <ArrowRight size={18} color="#fff" />
        </button>

        <div className="relative z-10 px-5 pt-16 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mic2 size={16} />
            <span className="text-white/70 text-[12px]">بودكاست</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-black text-[24px] leading-tight mb-2"
          >
            {category.title}
          </motion.h1>
          {category.description && (
            <p className="text-white/70 text-[12px] leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-4">
            <span
              className="text-[11px] px-3 py-1.5 rounded-full font-bold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              {category.episodes.length} حلقة
            </span>
          </div>
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="px-4 pt-5">
        <div className="grid grid-cols-3 gap-3">
          {category.episodes.map((ep, i) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <button
                onClick={() => handlePlayEpisode(ep.id, ep.mediaUrl)}
                className="relative rounded-xl overflow-hidden flex flex-col justify-end w-full aspect-[118/86] active:scale-95 transition-transform"
              >
                {ep.imageUrl ? (
                  <>
                    <img src={ep.imageUrl} alt={ep.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85))" }} />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${category.color}, ${category.colorTo})` }}
                  />
                )}
                <div className="absolute top-[-8px] right-[-8px] w-[30px] h-[30px] rounded-full opacity-15 bg-white" />
                <div className="absolute top-2 right-2 w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/30">
                  {ep.imageUrl && (
                    <img src={ep.imageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="relative z-10 p-2 text-right">
                  <p className="text-white font-bold text-[10px] leading-tight line-clamp-2">{ep.title}</p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
