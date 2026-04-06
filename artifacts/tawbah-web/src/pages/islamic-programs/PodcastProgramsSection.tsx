import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Mic2, ChevronLeft } from "lucide-react";
import type { PodcastCategory } from "./types";
import { PODCAST_CATEGORIES } from "./data";
import { extractDominantColors } from "../../lib/image-colors";

const CARD_W = 118;
const CARD_H = 86;
const GAP = 10;
const FEATURED_W = 148;
const FEATURED_H = CARD_H * 2 + GAP;

function resolvePodcastImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("/islamicaudio/")) {
    return `https://islamicaudio.net${url.slice("/islamicaudio".length)}`;
  }
  return url;
}

export function PodcastProgramsSection({
  isDark,
  activeEpisodeId,
  playing,
  onPlayEpisode,
}: {
  isDark: boolean;
  activeEpisodeId: string | null;
  playing: boolean;
  onPlayEpisode: (payload: { episodeId: string; mediaUrl: string }) => void;
}) {
  const [, setLocation] = useLocation();
  const [episodeColors, setEpisodeColors] = useState<Record<string, { color: string; colorTo: string }>>({});

  useEffect(() => {
    const loadColors = async () => {
      const colors: Record<string, { color: string; colorTo: string }> = {};
      for (const cat of PODCAST_CATEGORIES) {
        for (const ep of cat.episodes) {
          if (ep.imageUrl && !episodeColors[`${cat.id}:${ep.id}`]) {
            const extracted = await extractDominantColors(ep.imageUrl);
            colors[`${cat.id}:${ep.id}`] = extracted;
          }
        }
      }
      if (Object.keys(colors).length > 0) {
        setEpisodeColors(prev => ({ ...prev, ...colors }));
      }
    };
    loadColors();
  }, []);

  const navigateToCategory = (catId: string) => {
    setLocation(`/islamic-programs/podcast/${catId}`);
  };

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Mic2 size={16} className="text-primary" />
        <h3 className="font-bold text-[15px]">برامج - بودكاست</h3>
        <span className="text-[11px] text-muted-foreground mr-auto">{PODCAST_CATEGORIES.reduce((a, c) => a + c.episodes.length, 0)} حلقة</span>
        <ChevronLeft size={14} className="text-muted-foreground" />
      </div>

      {PODCAST_CATEGORIES.map((cat) => {
        const featuredEpisode = cat.episodes[0];
        const displayEpisodes = cat.episodes.slice(1, 6);
        const hasMore = cat.episodes.length > 5;
        const featuredImageUrl = resolvePodcastImageUrl(featuredEpisode?.imageUrl);

        return (
          <div key={cat.id} className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-[12px]">🎙️</span>
              <h4 className="font-bold text-[13px]">{cat.title}</h4>
              <span className="text-[10px] text-muted-foreground mr-auto">{cat.episodes.length} حلقة</span>
            </div>

            <div className="flex overflow-x-auto pb-2 scrollbar-hide" style={{ gap: GAP, direction: "rtl" }}>
              {featuredEpisode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="shrink-0"
                >
                  <button
                    onClick={() => onPlayEpisode({ episodeId: `${cat.id}:${featuredEpisode.id}`, mediaUrl: featuredEpisode.mediaUrl })}
                    className="relative rounded-2xl overflow-hidden flex flex-col justify-end shrink-0 active:scale-95 transition-transform"
                    style={{
                      width: FEATURED_W,
                      height: FEATURED_H,
                      background: `linear-gradient(160deg, ${cat.color}, ${cat.colorTo})`,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div className="absolute top-[-25px] right-[-25px] w-[100px] h-[100px] rounded-full opacity-15 bg-white" />
                    <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full opacity-10 bg-white" />
                    {featuredImageUrl && (
                      <div className="absolute inset-0">
                        <img src={featuredImageUrl} alt={featuredEpisode.title} className="w-full h-full object-cover opacity-40" />
                      </div>
                    )}
                    {activeEpisodeId === `${cat.id}:${featuredEpisode.id}` && playing && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(200,168,75,0.9)", color: "#1c0f00" }}>
                        يُشغَّل الآن
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-[70px]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }} />
                    <div className="relative z-10 p-3 text-right">
                      <p className="text-white font-bold text-[13px] leading-tight line-clamp-2">{featuredEpisode.title}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full w-fit" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                        <Play size={9} fill="white" />
                        <span>الأبرز</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              <div
                className="grid shrink-0"
                style={{
                  gridTemplateRows: `repeat(2, ${CARD_H}px)`,
                  gridTemplateColumns: `repeat(3, ${CARD_W}px)`,
                  gridAutoFlow: "column",
                  gap: GAP,
                }}
              >
                {displayEpisodes.map((ep, i) => {
                  const epId = `${cat.id}:${ep.id}`;
                  const isActive = activeEpisodeId === epId;
                  const epImageUrl = resolvePodcastImageUrl(ep.imageUrl);
                  // Use extracted color from image, fallback to category color
                  const extracted = episodeColors[epId];
                  const cardColor = extracted?.color || cat.color;
                  const cardColorTo = extracted?.colorTo || cat.colorTo;
                  return (
                    <motion.div
                      key={epId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                    >
                      <button
                        onClick={() => onPlayEpisode({ episodeId: epId, mediaUrl: ep.mediaUrl })}
                        className="relative rounded-xl overflow-hidden flex flex-col justify-end active:scale-95 transition-transform"
                        style={{
                          width: CARD_W,
                          height: CARD_H,
                          backgroundImage: epImageUrl
                            ? `linear-gradient(135deg, ${cardColor}99, ${cardColorTo}99), url(${epImageUrl})`
                            : isActive 
                              ? `linear-gradient(135deg, ${cardColor}, ${cardColorTo})`
                              : `linear-gradient(135deg, ${cardColor}aa, ${cardColorTo}aa)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div className="absolute top-[-12px] right-[-12px] w-[50px] h-[50px] rounded-full opacity-15 bg-white" />
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-white/30">
                          {epImageUrl ? (
                            <img src={epImageUrl} alt={ep.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-[16px]">🎙️</div>
                          )}
                        </div>
                        {isActive && playing && (
                          <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(200,168,75,0.9)", color: "#1c0f00" }}>
                            تشغيل
                          </div>
                        )}
                        <div className="relative z-10 p-2.5 text-right">
                          <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">{ep.title}</p>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      onClick={() => navigateToCategory(cat.id)}
                      className="rounded-xl flex flex-col items-center justify-center active:scale-95 transition-transform"
                      style={{
                        width: CARD_W,
                        height: CARD_H,
                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                        border: `1px dashed ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                      }}
                    >
                      <ChevronLeft size={20} className="text-muted-foreground mb-1" />
                      <span className="text-[10px] font-medium text-muted-foreground">المزيد</span>
                      <span className="text-[9px] text-muted-foreground/60">+{cat.episodes.length - 5}</span>
                    </button>
                  </motion.div>
                )}

                {hasMore && displayEpisodes.length < 5 && (
                  Array.from({ length: 5 - displayEpisodes.length }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ width: CARD_W, height: CARD_H }} />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
