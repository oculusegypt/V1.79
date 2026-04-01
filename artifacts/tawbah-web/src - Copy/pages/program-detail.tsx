import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Play,
  Mic,
  BookOpen,
  Scale,
  Scroll,
  Radio,
  Mic2,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Volume2,
  Youtube,
  Search,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { getProgramById, type Episode, type ProgramData } from "@/data/programs-data";

// ─── Category meta ────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  quran:   { label: "تفسير القرآن",  icon: <BookOpen size={14} />, color: "#10b981" },
  dawah:   { label: "دعوية وإيمانية", icon: <Mic2 size={14} />,    color: "#8b5cf6" },
  fatwa:   { label: "فتاوى وأحكام",   icon: <Scale size={14} />,   color: "#f59e0b" },
  stories: { label: "قصص وسيرة",      icon: <Scroll size={14} />,  color: "#ef4444" },
  radio:   { label: "إذاعية",         icon: <Radio size={14} />,   color: "#3b82f6" },
};

function buildYouTubeSearchUrl(program: ProgramData, episode?: Episode): string {
  const parts = [program.name];
  if (program.host) parts.push(program.host);
  if (episode) parts.push(episode.title);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(parts.join(" "))}`;
}

function buildProgramYouTubeUrl(program: ProgramData): string {
  if (program.youtubeHandle) return `https://www.youtube.com/@${program.youtubeHandle}`;
  if (program.youtubePlaylist) return `https://www.youtube.com/playlist?list=${program.youtubePlaylist}`;
  if (program.youtubeChannel) return `https://www.youtube.com/channel/${program.youtubeChannel}`;
  const q = [program.name, program.host].filter(Boolean).join(" ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

// ─── Episode card ─────────────────────────────────────────────────────────────
function EpisodeCard({
  episode,
  index,
  program,
  isExpanded,
  onToggle,
}: {
  episode: Episode;
  index: number;
  program: ProgramData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isAudio = episode.type === "audio";
  const searchUrl = buildYouTubeSearchUrl(program, episode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-right"
      >
        {/* Number */}
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
          style={{
            background: `linear-gradient(135deg, ${program.color}, ${program.colorTo})`,
            color: "#fff",
          }}
        >
          {index + 1}
        </div>

        {/* Type icon */}
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: isAudio ? "rgba(59,130,246,0.18)" : "rgba(239,68,68,0.18)" }}
        >
          {isAudio ? (
            <Volume2 size={13} color="#3b82f6" />
          ) : (
            <Play size={11} color="#ef4444" fill="#ef4444" />
          )}
        </div>

        {/* Title */}
        <span className="flex-1 text-[13px] font-semibold leading-snug text-right">
          {episode.title}
        </span>

        {/* Duration */}
        {episode.duration && (
          <span className="shrink-0 text-[11px] text-white/40 ml-1">{episode.duration}</span>
        )}

        {/* Chevron */}
        <span className="shrink-0 text-white/40">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded: YouTube search links */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 flex flex-col gap-2">
              {/* Search this episode on YouTube */}
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-bold"
                style={{
                  background: "rgba(255,0,0,0.15)",
                  color: "#ff4d4d",
                  border: "1px solid rgba(255,0,0,0.25)",
                }}
              >
                <Youtube size={16} />
                <span>بحث عن الحلقة في يوتيوب</span>
                <ExternalLink size={12} />
              </a>

              {/* Search just the program */}
              <a
                href={buildYouTubeSearchUrl(program)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Search size={13} />
                <span>البحث عن البرنامج كاملاً</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProgramDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const program = getProgramById(params.id ?? "");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);

  if (!program) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ direction: "rtl" }}
      >
        <div className="text-6xl">🔍</div>
        <p className="text-lg font-bold">البرنامج غير موجود</p>
        <button
          onClick={() => navigate("/islamic-programs")}
          className="px-6 py-2.5 rounded-full text-[14px] font-bold"
          style={{ background: "#8b5cf6", color: "#fff" }}
        >
          العودة للبرامج
        </button>
      </div>
    );
  }

  const catMeta = CATEGORY_META[program.category];
  const videoEpisodes = program.episodes.filter((e) => e.type === "video");
  const audioEpisodes = program.episodes.filter((e) => e.type === "audio");

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const programYouTubeUrl = buildProgramYouTubeUrl(program);

  return (
    <div
      className="min-h-screen pb-28"
      style={{ direction: "rtl", background: isDark ? "#0a0a0a" : "#f9fafb" }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          minHeight: 260,
          background: `linear-gradient(160deg, ${program.color} 0%, ${program.colorTo} 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-[-60px] left-[-60px] rounded-full"
          style={{ width: 220, height: 220, background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="absolute bottom-[-40px] right-[-40px] rounded-full"
          style={{ width: 160, height: 160, background: "rgba(255,255,255,0.05)" }}
        />

        {/* Back button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => navigate("/islamic-programs")}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            <ArrowRight size={18} color="#fff" />
          </button>
        </div>

        {/* Big emoji */}
        <div
          className="absolute top-8 left-6 text-[90px] select-none"
          style={{ opacity: 0.18 }}
        >
          {program.icon}
        </div>

        {/* Content */}
        <div className="relative z-10 px-5 pt-16 pb-8">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              {catMeta?.icon}
              <span>{catMeta?.label}</span>
            </span>
          </div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-white font-black text-[26px] leading-tight mb-1"
          >
            {program.name}
          </motion.h1>

          {/* Host */}
          {program.host && (
            <p className="text-white/70 text-[13px] mb-1">{program.host}</p>
          )}

          {/* Channel */}
          {program.channel && (
            <p className="text-white/50 text-[12px]">{program.channel}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            >
              <Play size={11} fill="white" />
              <span>{videoEpisodes.length} فيديو</span>
            </div>
            {audioEpisodes.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <Mic size={11} />
                <span>{audioEpisodes.length} صوتية</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-5">

        {/* Description card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-2xl p-4"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <p
            className="text-[14px] leading-[1.85] font-medium"
            style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#374151" }}
          >
            {program.description}
          </p>

          {program.about && (
            <>
              <AnimatePresence>
                {showFullAbout && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[13px] leading-[1.85] mt-3"
                    style={{ color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280" }}
                  >
                    {program.about}
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                onClick={() => setShowFullAbout(!showFullAbout)}
                className="mt-2 text-[12px] font-bold flex items-center gap-1"
                style={{ color: catMeta?.color ?? "#8b5cf6" }}
              >
                {showFullAbout ? (
                  <><ChevronUp size={14} /> إخفاء التفاصيل</>
                ) : (
                  <><ChevronDown size={14} /> اقرأ أكثر</>
                )}
              </button>
            </>
          )}
        </motion.div>

        {/* Tags */}
        {program.tags && program.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {program.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
                }}
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* YouTube channel / search link */}
        <motion.a
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          href={programYouTubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[13px] font-bold"
          style={{
            background: "rgba(255,0,0,0.12)",
            color: "#ff4d4d",
            border: "1px solid rgba(255,0,0,0.2)",
          }}
        >
          <Youtube size={16} />
          <span>مشاهدة البرنامج على يوتيوب</span>
          <ExternalLink size={12} />
        </motion.a>

        {/* Video episodes */}
        {videoEpisodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play size={15} fill="#ef4444" color="#ef4444" />
              <h2 className="font-bold text-[15px]">حلقات الفيديو</h2>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full mr-auto"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
              >
                {videoEpisodes.length} حلقة
              </span>
            </div>
            <div className="space-y-2">
              {videoEpisodes.map((ep, i) => (
                <EpisodeCard
                  key={ep.id}
                  episode={ep}
                  index={i}
                  program={program}
                  isExpanded={expandedId === ep.id}
                  onToggle={() => toggleExpand(ep.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Audio episodes */}
        {audioEpisodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={15} color="#3b82f6" />
              <h2 className="font-bold text-[15px]">حلقات صوتية</h2>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full mr-auto"
                style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
              >
                {audioEpisodes.length} حلقة
              </span>
            </div>
            <div className="space-y-2">
              {audioEpisodes.map((ep, i) => (
                <EpisodeCard
                  key={ep.id}
                  episode={ep}
                  index={i}
                  program={program}
                  isExpanded={expandedId === ep.id}
                  onToggle={() => toggleExpand(ep.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
