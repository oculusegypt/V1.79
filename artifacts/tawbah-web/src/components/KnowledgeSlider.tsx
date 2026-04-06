import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Star, Sun, Moon, Sparkles, ChevronRight, ChevronLeft, Mic2 } from "lucide-react";
import { apiUrl } from "@/lib/api-base";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnowledgeItem {
  type: "ayah" | "hadith" | "dhikr" | "nafl" | "dua" | "wisdom" | "podcast";
  text: string;
  source?: string;
  categoryTitle?: string;
  episodeId?: string;
  mediaUrl?: string;
  imageUrl?: string;
}

// Podcast categories data (mirrored from islamic-programs.tsx)
const PODCAST_CATEGORIES_DATA = [
  { id: "ala-khuta", title: "علي خطي الرسول", color: "#064e3b", colorTo: "#065f46" },
  { id: "shrfat", title: "شرفات", color: "#0891b2", colorTo: "#06b6d4" },
  { id: "mtka", title: "مُتكأ", color: "#7c3aed", colorTo: "#8b5cf6" },
  { id: "alwan", title: "أَلوان", color: "#be185d", colorTo: "#f472b6" },
];

const PODCAST_EPISODES_DATA = [
  { catId: "ala-khuta", episodes: [
    { id: "yom-alfrkan", title: "يوم الفرقان", imageUrl: "https://islamicaudio.net/assets/media/yom-alfrkan1017_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/yom-alfrkan866.mp3" },
    { id: "hkm-alamyn", title: "حكم الأمين", imageUrl: "https://islamicaudio.net/assets/media/hkm-alamyn1029_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/hkm-alamyn871.mp3" },
    { id: "fth-mka", title: "فتح مكة", imageUrl: "https://islamicaudio.net/assets/media/fth-mk1020_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/fth-mk868.mp3" },
    { id: "slh-alhdyby", title: "صلح الحديبية", imageUrl: "https://islamicaudio.net/assets/media/slh-alhdyby1022_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/slh-alhdyby874.mp3" },
    { id: "mhajron-oansar", title: "مهاجرون وأنصار", imageUrl: "https://islamicaudio.net/assets/media/mhajron-oansar1021_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/mhajron-oansar864.mp3" },
  ]},
  { catId: "shrfat", episodes: [
    { id: "ep1", title: "قصص ملهمة من شرفات", imageUrl: "https://islamicaudio.net/ar/media/show/1314", mediaUrl: "" },
    { id: "ep2", title: "شخصيات غيرت العالم", imageUrl: "https://islamicaudio.net/ar/media/show/1314", mediaUrl: "" },
  ]},
  { catId: "mtka", episodes: [
    { id: "ep1", title: "قصص أعلام النبلاء", imageUrl: "https://islamicaudio.net/ar/media/show/1313", mediaUrl: "" },
    { id: "ep2", title: "تاريخ وحاضر", imageUrl: "https://islamicaudio.net/ar/media/show/1313", mediaUrl: "" },
  ]},
  { catId: "alwan", episodes: [
    { id: "aabd-allh-batrsby", title: "عبد الله باترسبي", imageUrl: "https://islamicaudio.net/assets/media/aroan-002725_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/02-aabd-allh-batrsby-aaaly-aldk827.mp3" },
    { id: "ayfon-rydly", title: "إيفون ريدلي", imageUrl: "https://islamicaudio.net/assets/media/aroan-011734_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/11-ayfon-rydly-aaaly-aldk818.mp3" },
    { id: "kolz", title: "فيرونيك كولز", imageUrl: "https://islamicaudio.net/assets/media/aroan-010733_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/10-kolz-aaaly-aldk819.mp3" },
    { id: "malma", title: "مالما", imageUrl: "https://islamicaudio.net/assets/media/aroan-005728_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/05-malma-aaaly-aldk824.mp3" },
    { id: "danyal-mor", title: "دانيال مور", imageUrl: "https://islamicaudio.net/assets/media/aroan-003726_mediumThumb.jpg", mediaUrl: "https://islamicaudio.net/assets/media/03-danyal-mor-aaaly-aldk826.mp3" },
  ]},
];

// Build podcast items from all categories
function getPodcastItems(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  PODCAST_CATEGORIES_DATA.forEach(cat => {
    const catData = PODCAST_EPISODES_DATA.find(c => c.catId === cat.id);
    if (catData) {
      catData.episodes.forEach(ep => {
        items.push({
          type: "podcast",
          text: ep.title,
          source: cat.title,
          categoryTitle: cat.title,
          episodeId: `${cat.id}:${ep.id}`,
          mediaUrl: ep.mediaUrl,
          imageUrl: ep.imageUrl,
        });
      });
    }
  });
  return items;
}

const TYPE_META: Record<KnowledgeItem["type"], { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  ayah:    { label: "آية كريمة",   icon: <BookOpen size={11} />,     bg: "bg-emerald-500/15 dark:bg-emerald-400/15", text: "text-emerald-600 dark:text-emerald-400" },
  hadith:  { label: "حديث شريف",  icon: <MessageCircle size={11} />, bg: "bg-amber-500/15 dark:bg-amber-400/15",    text: "text-amber-600 dark:text-amber-400"   },
  dhikr:   { label: "ذكر مأثور",  icon: <Star size={11} />,          bg: "bg-violet-500/15 dark:bg-violet-400/15",  text: "text-violet-600 dark:text-violet-400" },
  nafl:    { label: "نافلة وسنة", icon: <Sun size={11} />,           bg: "bg-sky-500/15 dark:bg-sky-400/15",        text: "text-sky-600 dark:text-sky-400"       },
  dua:     { label: "دعاء مأثور", icon: <Moon size={11} />,          bg: "bg-purple-500/15 dark:bg-purple-400/15",  text: "text-purple-600 dark:text-purple-400" },
  wisdom:  { label: "نصيحة",      icon: <Sparkles size={11} />,     bg: "bg-rose-500/15 dark:bg-rose-400/15",      text: "text-rose-600 dark:text-rose-400"     },
  podcast: { label: "بودكاست",    icon: <Mic2 size={11} />,          bg: "bg-cyan-500/15 dark:bg-cyan-400/15",      text: "text-cyan-600 dark:text-cyan-400"     },
};

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_KEY   = "knowledge_slider_cache_v2";
const CACHE_TTL   = 60 * 60 * 1000; // 1 hour

function loadCache(): KnowledgeItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, expiresAt } = JSON.parse(raw) as { items: KnowledgeItem[]; expiresAt: number };
    if (Date.now() > expiresAt) return null;
    return items;
  } catch { return null; }
}

function saveCache(items: KnowledgeItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, expiresAt: Date.now() + CACHE_TTL }));
  } catch {}
}

// ── Daily start index ─────────────────────────────────────────────────────────

function getDailyStartIdx(total: number): number {
  if (total === 0) return 0;
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % total;
}

// ── Fallback static content ───────────────────────────────────────────────────

const FALLBACK: KnowledgeItem[] = [
  { type: "ayah",   text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجاً ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", source: "الطلاق: 2-3" },
  { type: "hadith", text: "التائبُ من الذنبِ كمن لا ذنبَ له", source: "ابن ماجه" },
  { type: "ayah",   text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", source: "الزمر: 53" },
  { type: "dhikr",  text: "سبحان الله وبحمده، سبحان الله العظيم", source: "متفق عليه — خفيفتان على اللسان ثقيلتان في الميزان" },
  { type: "hadith", text: "إن الله يبسط يده بالليل ليتوب مسيء النهار، ويبسط يده بالنهار ليتوب مسيء الليل", source: "مسلم" },
  { type: "wisdom", text: "البداية الحقيقية لا تحتاج يوماً جديداً — تحتاج نية صادقة في هذه اللحظة" },
];

// ── Main component ────────────────────────────────────────────────────────────

export function KnowledgeSlider() {
  const [items, setItems]     = useState<KnowledgeItem[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchContent = useCallback(async () => {
    const cached = loadCache();
    if (cached?.length) {
      setItems(cached);
      setIdx(getDailyStartIdx(cached.length));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/hero-content"));
      if (!res.ok) throw new Error("failed");
      const data = await res.json() as { items: KnowledgeItem[] };
      let list = data.items?.length ? data.items : FALLBACK;
      
      // Add podcast items to the list for random display
      const podcastItems = getPodcastItems();
      if (podcastItems.length > 0) {
        // Shuffle podcast items using Fisher-Yates
        const shuffled = [...podcastItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Take up to 4 random podcast episodes
        list = [...list, ...shuffled.slice(0, 4)];
        // Shuffle the combined list
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      
      saveCache(list);
      setItems(list);
      setIdx(getDailyStartIdx(list.length));
    } catch {
      // On error, still include podcast items with fallback
      const podcastItems = getPodcastItems();
      const combined = [...FALLBACK, ...podcastItems.slice(0, 4)];
      setItems(combined);
      setIdx(getDailyStartIdx(combined.length));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 9000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  const goNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i + 1) % items.length);
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 9000);
  };

  const goPrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i - 1 + items.length) % items.length);
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 9000);
  };

  const item = items[idx] ?? null;
  const meta = item ? TYPE_META[item.type] : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header strip — shows current content type dynamically */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <AnimatePresence mode="wait">
          {loading || !meta ? (
            <motion.div
              key="loading-type"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles size={13} className="text-primary" />
              <span className="text-[11px] font-bold text-muted-foreground">زكي يُذكّرك يومياً</span>
            </motion.div>
          ) : (
            <motion.div
              key={`type-${idx}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                {meta.icon}
                {meta.label}
              </span>
              {item?.source && (
                <span className="text-[10px] text-muted-foreground/80 font-medium">{item.source}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="السابق"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {idx + 1} / {items.length}
            </span>
            <button
              onClick={goNext}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="relative min-h-[100px] px-4 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-primary/60"
              >
                <Sparkles size={14} />
              </motion.div>
              <p className="text-[12px] text-muted-foreground">زكي يُعد محتوى اليوم...</p>
            </motion.div>
          ) : item ? (
            <motion.div
              key={`item-${idx}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="flex flex-col items-center gap-2.5"
            >
              <p
                className="text-[13.5px] leading-[1.9] font-medium text-foreground text-center"
                dir="rtl"
              >
                {item.type === "ayah" ? (item.text.startsWith("﴿") ? item.text : `﴿${item.text}﴾`) : item.text}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setIdx(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 18 : 5,
                height: 5,
                backgroundColor: i === idx ? "var(--primary)" : "var(--muted-foreground)",
                opacity: i === idx ? 1 : 0.25,
              }}
              aria-label={`الانتقال إلى ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
