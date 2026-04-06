import React from "react";
import { useLocation } from "wouter";
import { ArrowRight, Tv } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";
import { setAudioSrc } from "@/lib/native-audio";
import { apiUrl, getApiBase, isNativeApp } from "@/lib/api-base";

import { CATEGORIES, FEATURED, PROGRAMS } from "./data";
import type { CategoryId, RadioStation } from "./types";
import { HeroBanner } from "./HeroBanner";
import { LiveRadioSection } from "./LiveRadioSection";
import { PodcastProgramsSection } from "./PodcastProgramsSection";
import { CategoryRow } from "./CategoryRow";

function resolvePodcastMediaUrl(url: string): string {
  if (url.startsWith("/islamicaudio/")) {
    return `https://islamicaudio.net${url.slice("/islamicaudio".length)}`;
  }
  return url;
}

export default function IslamicPrograms() {
  const [, navigate] = useLocation();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const [activeCategory, setActiveCategory] = React.useState<CategoryId | "all">("all");
  const [featuredIndex, setFeaturedIndex] = React.useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [activeRadioId, setActiveRadioId] = React.useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = React.useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);

  const playUrl = React.useCallback(async (url: string, opts?: { useRadioProxy?: boolean }) => {
    const useRadioProxy = opts?.useRadioProxy === true;
    const resolvedUrl = isNativeApp() && useRadioProxy
      ? `${getApiBase().replace(/\/\/+$/, "")}/audio-proxy/radio?url=${encodeURIComponent(url)}`
      : apiUrl(resolvePodcastMediaUrl(url));
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.preload = "none";
    try {
      (a as unknown as { crossOrigin: string | null }).crossOrigin = isNativeApp() && useRadioProxy
        ? "anonymous"
        : null;
    } catch {}
    try {
      (a as unknown as { playsInline?: boolean }).playsInline = true;
    } catch {}

    a.pause();
    a.currentTime = 0;
    a.onstalled = () => {
      console.warn("[Radio] stalled, reloading...", resolvedUrl);
      a.load();
    };
    a.onerror = () => {
      console.error("[Radio] audio error", resolvedUrl, a.error);
    };

    await setAudioSrc(a, resolvedUrl, !useRadioProxy);
    a.load();
    try {
      await a.play();
      setIsAudioPlaying(true);
    } catch {
      setIsAudioPlaying(false);
    }
  }, []);

  const pauseAudio = React.useCallback(() => {
    audioRef.current?.pause();
    setIsAudioPlaying(false);
  }, []);

  React.useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsAudioPlaying(true);
    const onPause = () => setIsAudioPlaying(false);
    const onEnded = () => setIsAudioPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % FEATURED.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const visibleCategories = activeCategory === "all"
    ? CATEGORIES.map((c) => c.id)
    : [activeCategory];

  return (
    <div className="min-h-screen pb-27" style={{ direction: "rtl" }}>
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
        >
          <ArrowRight size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Tv size={18} className="text-primary" />
          <h1 className="font-bold text-[17px]">برامج إسلامية</h1>
        </div>
        <span
          className="mr-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
        >
          {PROGRAMS.length} برنامج
        </span>
      </div>

      <div className="px-4 pt-5">
        <div className="mb-5">
          <motion.div
            key={featuredIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <HeroBanner program={FEATURED[featuredIndex]} onClick={() => navigate(`/islamic-programs/${FEATURED[featuredIndex].id}`)} />
          </motion.div>
          <div className="flex justify-center gap-1.5 mt-3">
            {FEATURED.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === featuredIndex ? 20 : 6,
                  height: 6,
                  background: i === featuredIndex ? "#8b5cf6" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"),
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide" style={{ direction: "rtl" }}>
          <button
            onClick={() => setActiveCategory("all")}
            className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
            style={{
              background: activeCategory === "all" ? "#8b5cf6" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
              color: activeCategory === "all" ? "#fff" : undefined,
            }}
          >
            الكل
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{
                background: activeCategory === cat.id ? cat.color : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                color: activeCategory === cat.id ? "#fff" : undefined,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {activeCategory === "all" && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl p-2.5"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  minWidth: 72,
                }}
              >
                <span style={{ color: cat.color }}>{cat.icon}</span>
                <span className="text-[14px] font-bold">{PROGRAMS.filter((p) => p.category === cat.id).length}</span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{cat.label}</span>
              </div>
            ))}
          </div>
        )}

        {activeCategory === "all" && (
          <LiveRadioSection
            isDark={isDark}
            activeId={activeRadioId}
            playing={isAudioPlaying}
            onToggle={(station: RadioStation) => {
              const isSame = activeRadioId === station.id && activeEpisodeId === null;
              if (isSame && isAudioPlaying) {
                pauseAudio();
                return;
              }
              setActiveEpisodeId(null);
              setActiveRadioId(station.id);
              void playUrl(station.url, { useRadioProxy: true });
            }}
          />
        )}

        {activeCategory === "all" && (
          <PodcastProgramsSection
            isDark={isDark}
            activeEpisodeId={activeEpisodeId}
            playing={isAudioPlaying}
            onPlayEpisode={({ episodeId, mediaUrl }) => {
              const isSame = activeEpisodeId === episodeId;
              if (isSame && isAudioPlaying) {
                pauseAudio();
                return;
              }
              setActiveRadioId(null);
              setActiveEpisodeId(episodeId);
              void playUrl(mediaUrl, { useRadioProxy: false });
            }}
          />
        )}

        {visibleCategories.map((catId) => (
          <CategoryRow
            key={catId}
            catId={catId}
            onProgramClick={(id) => navigate(`/islamic-programs/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
