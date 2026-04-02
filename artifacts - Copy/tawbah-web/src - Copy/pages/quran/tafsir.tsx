import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search, Play, Pause, Loader2, BookOpen, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { getApiBase } from "@/lib/api-base";
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

function isBismillah(text: string, surahId: number, ayahNum: number): boolean {
  if (surahId === 1 || surahId === 9) return false;
  if (ayahNum !== 1) return false;
  const normalized = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s+/g, "");
  return normalized.startsWith("بسماللهالرحمنالرحيم") && text.trim().split(/\s+/).length <= 6;
}

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

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Surah { id: number; name: string; nameEn: string; ayahCount: number; juz: number; revelation: string; }
interface Ayah { numberInSurah: number; text: string; }

const SURAHS: Surah[] = [
  { id:1,  name:"الفاتحة",  nameEn:"Al-Fatiha",   ayahCount:7,   juz:1,  revelation:"مكية"  },
  { id:2,  name:"البقرة",   nameEn:"Al-Baqara",   ayahCount:286, juz:1,  revelation:"مدنية" },
  { id:3,  name:"آل عمران", nameEn:"Aal Imran",   ayahCount:200, juz:3,  revelation:"مدنية" },
  { id:4,  name:"النساء",   nameEn:"An-Nisa",     ayahCount:176, juz:4,  revelation:"مدنية" },
  { id:5,  name:"المائدة",  nameEn:"Al-Maida",    ayahCount:120, juz:6,  revelation:"مدنية" },
  { id:6,  name:"الأنعام",  nameEn:"Al-Anam",     ayahCount:165, juz:7,  revelation:"مكية"  },
  { id:7,  name:"الأعراف",  nameEn:"Al-Araf",     ayahCount:206, juz:8,  revelation:"مكية"  },
  { id:8,  name:"الأنفال",  nameEn:"Al-Anfal",    ayahCount:75,  juz:9,  revelation:"مدنية" },
  { id:9,  name:"التوبة",   nameEn:"At-Tawba",    ayahCount:129, juz:10, revelation:"مدنية" },
  { id:10, name:"يونس",     nameEn:"Yunus",       ayahCount:109, juz:11, revelation:"مكية"  },
  { id:12, name:"يوسف",     nameEn:"Yusuf",       ayahCount:111, juz:12, revelation:"مكية"  },
  { id:17, name:"الإسراء",  nameEn:"Al-Isra",     ayahCount:111, juz:15, revelation:"مكية"  },
  { id:18, name:"الكهف",    nameEn:"Al-Kahf",     ayahCount:110, juz:15, revelation:"مكية"  },
  { id:19, name:"مريم",     nameEn:"Maryam",      ayahCount:98,  juz:16, revelation:"مكية"  },
  { id:36, name:"يس",       nameEn:"Ya-Sin",      ayahCount:83,  juz:22, revelation:"مكية"  },
  { id:39, name:"الزمر",    nameEn:"Az-Zumar",    ayahCount:75,  juz:23, revelation:"مكية"  },
  { id:55, name:"الرحمن",   nameEn:"Ar-Rahman",   ayahCount:78,  juz:27, revelation:"مدنية" },
  { id:56, name:"الواقعة",  nameEn:"Al-Waqia",    ayahCount:96,  juz:27, revelation:"مكية"  },
  { id:67, name:"الملك",    nameEn:"Al-Mulk",     ayahCount:30,  juz:29, revelation:"مكية"  },
  { id:78, name:"النبأ",    nameEn:"An-Naba",     ayahCount:40,  juz:30, revelation:"مكية"  },
  { id:87, name:"الأعلى",   nameEn:"Al-Ala",      ayahCount:19,  juz:30, revelation:"مكية"  },
  { id:93, name:"الضحى",    nameEn:"Ad-Duha",     ayahCount:11,  juz:30, revelation:"مكية"  },
  { id:94, name:"الشرح",    nameEn:"Ash-Sharh",   ayahCount:8,   juz:30, revelation:"مكية"  },
  { id:97, name:"القدر",    nameEn:"Al-Qadr",     ayahCount:5,   juz:30, revelation:"مكية"  },
  { id:103,name:"العصر",    nameEn:"Al-Asr",      ayahCount:3,   juz:30, revelation:"مكية"  },
  { id:112,name:"الإخلاص",  nameEn:"Al-Ikhlas",   ayahCount:4,   juz:30, revelation:"مكية"  },
  { id:113,name:"الفلق",    nameEn:"Al-Falaq",    ayahCount:5,   juz:30, revelation:"مكية"  },
  { id:114,name:"الناس",    nameEn:"An-Nas",      ayahCount:6,   juz:30, revelation:"مكية"  },
];

// ─── Tafsir Reader ────────────────────────────────────────────────────────────

function TafsirReader({ surah, reciterId, onBack }: { surah: Surah; reciterId: string; onBack: () => void }) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [tafsirAyahs, setTafsirAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [playingNum, setPlayingNum] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAyahs([]);
    setTafsirAyahs([]);
    setSelectedAyah(null);
    Promise.all([
      fetch(`${getApiBase()}/quran/surah/${surah.id}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/ar.muyassar`).then(r => r.json()),
    ]).then(([main, tafsir]) => {
      if (main.code === 200) {
        let list: Ayah[] = main.data.ayahs.filter((a: Ayah) => !isBismillah(a.text, surah.id, a.numberInSurah));
        if (surah.id !== 1 && surah.id !== 9 && list.length > 0 && list[0]) {
          list[0] = { ...list[0], text: stripBismillahPrefix(list[0].text) };
        }
        setAyahs(list);
      }
      if (tafsir.code === 200) {
        let tlist: Ayah[] = tafsir.data.ayahs.filter((a: Ayah) => !isBismillah(a.text, surah.id, a.numberInSurah));
        if (surah.id !== 1 && surah.id !== 9 && tlist.length > 0 && tlist[0]) {
          tlist[0] = { ...tlist[0], text: stripBismillahPrefix(tlist[0].text) };
        }
        setTafsirAyahs(tlist);
      }
    }).catch(e => setError(`Fetch failed: ${e.message}`)).finally(() => setLoading(false));
  }, [surah.id]);

  const playAyah = (num: number) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const url = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${toGlobal(surah.id, num)}.mp3`;
    void setAudioSrc(audio, url)
      .then(() => {
        audio.load();
        return audio.play();
      })
      .catch(() => {});
    setPlayingNum(num);
    audio.onended = () => setPlayingNum(null);
  };

  const stopAudio = () => { audioRef.current?.pause(); setPlayingNum(null); };
  useEffect(() => () => stopAudio(), []);

  const tafsirFor = (num: number) => tafsirAyahs.find(a => a.numberInSurah === num);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex items-center gap-3" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold" style={{ fontFamily: "'Amiri Quran', serif", color: "#8b5cf6" }}>سورة {surah.name}</p>
          <p className="text-[10px] text-muted-foreground">{surah.ayahCount} آية · انقر آية لعرض التفسير</p>
        </div>
        <div className="w-8" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: "#8b5cf6" }} />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
          <p className="text-red-400 text-sm text-center">{error}</p>
          <p className="text-muted-foreground text-xs text-center">API: {getApiBase()}/quran/surah/{surah.id}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Bismillah */}
          {surah.id !== 1 && surah.id !== 9 && (
            <p
              className="text-center py-4 px-5 border-b"
              style={{ fontFamily: "'Amiri Quran', serif", fontSize: 20, color: "rgba(139,92,246,0.85)", borderColor: "rgba(139,92,246,0.1)" }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          )}

          {/* Ayahs */}
          <div className="px-4 py-4 flex flex-col gap-1">
            {ayahs.map((ayah) => {
              const tafsir = tafsirFor(ayah.numberInSurah);
              const isSelected = selectedAyah?.numberInSurah === ayah.numberInSurah;
              const isPlaying = playingNum === ayah.numberInSurah;

              return (
                <div key={ayah.numberInSurah}>
                  <motion.button
                    onClick={() => {
                      setSelectedAyah(isSelected ? null : ayah);
                      stopAudio();
                    }}
                    className="w-full text-right px-4 py-4 rounded-xl transition-all active:scale-[0.99]"
                    style={{
                      background: isSelected ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                      border: isSelected ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ayah number badge */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 text-[12px] font-bold"
                        style={{
                          background: isSelected ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.25)",
                          color: "#8b5cf6",
                          fontFamily: "'Amiri Quran', serif",
                        }}
                      >
                        {toEA(ayah.numberInSurah)}
                      </div>
                      <p
                        className="flex-1 leading-[2.4]"
                        style={{
                          fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                          fontSize: 19,
                          color: isSelected ? "#8b5cf6" : "hsl(var(--foreground))",
                        }}
                      >
                        {ayah.text}
                      </p>
                    </div>
                  </motion.button>

                  {/* Tafsir panel */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mx-1 mb-2 rounded-xl p-4"
                          style={{
                            background: "linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.03) 100%)",
                            border: "1px solid rgba(139,92,246,0.2)",
                          }}
                        >
                          {/* Audio controls */}
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
                            <button
                              onClick={e => { e.stopPropagation(); isPlaying ? stopAudio() : playAyah(ayah.numberInSurah); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6" }}
                            >
                              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                              {isPlaying ? "إيقاف" : "استمع"}
                            </button>
                            <div className="flex items-center gap-1">
                              <BookOpen size={11} style={{ color: "#8b5cf6" }} />
                              <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>التفسير الميسّر</span>
                            </div>
                          </div>

                          {/* Tafsir text */}
                          {tafsir ? (
                            <p className="text-[13px] leading-[2] text-right" style={{ color: "rgba(255,255,255,0.8)" }}>
                              {tafsir.text}
                            </p>
                          ) : (
                            <p className="text-[12px] text-muted-foreground text-center py-2">التفسير غير متاح</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="h-6" />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranTafsirPage() {
  const { quranReciterId } = useSettings();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [search, setSearch] = useState("");
  const filtered = SURAHS.filter(s => s.name.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase()));

  if (selectedSurah) {
    return (
      <div className="min-h-screen flex flex-col pb-20">
        <TafsirReader surah={selectedSurah} reciterId={quranReciterId} onBack={() => setSelectedSurah(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <PageHeader title="التفسير التفاعلي" subtitle="انقر على أي آية للتفسير" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Intro */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "linear-gradient(145deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.03) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <BookOpen size={18} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5">التفسير الميسّر</p>
            <p className="text-[11px] text-muted-foreground leading-snug">انقر على أي آية لعرض تفسيرها والاستماع إليها مباشرة</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
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

        {/* Surahs */}
        <div className="flex flex-col gap-1.5">
          {filtered.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedSurah(s)}
              className="flex items-center gap-3 p-3 rounded-xl text-right active:scale-[0.98] transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-[12px]"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6", fontFamily: "'Amiri Quran', serif" }}>
                {toEA(s.id)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ fontFamily: "'Amiri Quran', serif" }}>{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.nameEn} · {s.ayahCount} آية · {s.revelation}</p>
              </div>
              <BookOpen size={13} className="text-muted-foreground/40" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
