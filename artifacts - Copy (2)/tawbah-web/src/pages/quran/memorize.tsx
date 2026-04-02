import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search, Play, Pause, Eye, EyeOff, Check, X, RotateCcw, Loader2, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { setAudioSrc } from "@/lib/native-audio";
import { getApiBase } from "@/lib/api-base";
import { useSettings } from "@/context/SettingsContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobal(surah: number, ayah: number): number {
  let c = 0;
  for (let i = 0; i < surah - 1; i++) c += SURAH_LENGTHS[i] ?? 0;
  return c + ayah;
}

const TO_AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEA(n: number) { return String(n).split('').map(d => TO_AR[parseInt(d)] ?? d).join(''); }

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Surah { id: number; name: string; nameEn: string; ayahCount: number; juz: number; revelation: string; }
interface Ayah { numberInSurah: number; text: string; }

const SHORT_SURAHS: Surah[] = [
  { id:1,  name:"الفاتحة", nameEn:"Al-Fatiha",  ayahCount:7,  juz:1,  revelation:"مكية" },
  { id:36, name:"يس",      nameEn:"Ya-Sin",     ayahCount:83, juz:22, revelation:"مكية" },
  { id:55, name:"الرحمن",  nameEn:"Ar-Rahman",  ayahCount:78, juz:27, revelation:"مدنية"},
  { id:56, name:"الواقعة", nameEn:"Al-Waqia",   ayahCount:96, juz:27, revelation:"مكية" },
  { id:67, name:"الملك",   nameEn:"Al-Mulk",    ayahCount:30, juz:29, revelation:"مكية" },
  { id:73, name:"المزمل",  nameEn:"Al-Muzzammil",ayahCount:20,juz:29, revelation:"مكية" },
  { id:78, name:"النبأ",   nameEn:"An-Naba",    ayahCount:40, juz:30, revelation:"مكية" },
  { id:87, name:"الأعلى",  nameEn:"Al-Ala",     ayahCount:19, juz:30, revelation:"مكية" },
  { id:93, name:"الضحى",   nameEn:"Ad-Duha",    ayahCount:11, juz:30, revelation:"مكية" },
  { id:94, name:"الشرح",   nameEn:"Ash-Sharh",  ayahCount:8,  juz:30, revelation:"مكية" },
  { id:95, name:"التين",   nameEn:"At-Tin",     ayahCount:8,  juz:30, revelation:"مكية" },
  { id:97, name:"القدر",   nameEn:"Al-Qadr",    ayahCount:5,  juz:30, revelation:"مكية" },
  { id:103,name:"العصر",   nameEn:"Al-Asr",     ayahCount:3,  juz:30, revelation:"مكية" },
  { id:108,name:"الكوثر",  nameEn:"Al-Kawthar", ayahCount:3,  juz:30, revelation:"مكية" },
  { id:109,name:"الكافرون",nameEn:"Al-Kafirun", ayahCount:6,  juz:30, revelation:"مكية" },
  { id:110,name:"النصر",   nameEn:"An-Nasr",    ayahCount:3,  juz:30, revelation:"مدنية"},
  { id:112,name:"الإخلاص", nameEn:"Al-Ikhlas",  ayahCount:4,  juz:30, revelation:"مكية" },
  { id:113,name:"الفلق",   nameEn:"Al-Falaq",   ayahCount:5,  juz:30, revelation:"مكية" },
  { id:114,name:"الناس",   nameEn:"An-Nas",     ayahCount:6,  juz:30, revelation:"مكية" },
];

// ─── Memorize Session ─────────────────────────────────────────────────────────

type Mode = "listen" | "cover" | "test";

function MemorizeSession({ surah, reciterId, onBack }: { surah: Surah; reciterId: string; onBack: () => void }) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("listen");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showText, setShowText] = useState(true);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<"correct" | "wrong" | null>(null);
  const [memorized, setMemorized] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${getApiBase()}/quran/surah/${surah.id}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (data.code === 200) {
          setAyahs(data.data.ayahs);
          setRevealed(new Array(data.data.ayahs.length).fill(false));
        } else {
          setError(`API error: ${data.code}`);
        }
      })
      .catch(e => setError(`Fetch failed: ${e.message}`))
      .finally(() => setLoading(false));
  }, [surah.id]);

  const playAyah = (idx: number) => {
    const ayah = ayahs[idx];
    if (!ayah) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const url = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${toGlobal(surah.id, ayah.numberInSurah)}.mp3`;
    void setAudioSrc(audio, url)
      .then(() => {
        audio.load();
        return audio.play();
      })
      .catch(() => {});
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  };

  const stopAudio = () => { audioRef.current?.pause(); setIsPlaying(false); };
  useEffect(() => () => stopAudio(), []);

  const currentAyah = ayahs[currentIdx];
  const progress = ayahs.length > 0 ? ((currentIdx) / ayahs.length) * 100 : 0;

  const checkAnswer = () => {
    if (!currentAyah) return;
    const normalize = (s: string) => s.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, "").replace(/\s+/g, " ").trim();
    const correct = normalize(testInput) === normalize(currentAyah.text);
    setTestResult(correct ? "correct" : "wrong");
    if (correct) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
      const m = new Set(memorized);
      m.add(currentIdx);
      setMemorized(m);
    } else {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    }
  };

  const nextAyah = () => {
    setTestInput("");
    setTestResult(null);
    if (currentIdx < ayahs.length - 1) setCurrentIdx(currentIdx + 1);
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex items-center gap-3" style={{ borderColor: "rgba(245,158,11,0.12)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold" style={{ fontFamily: "'Amiri Quran', serif", color: "#f59e0b" }}>سورة {surah.name}</p>
          <p className="text-[10px] text-muted-foreground">{surah.ayahCount} آية</p>
        </div>
        <div
          className="px-2 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
        >
          {memorized.size}/{surah.ayahCount}
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["listen", "cover", "test"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setCurrentIdx(0); setTestInput(""); setTestResult(null); }}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: mode === m ? "rgba(245,158,11,0.2)" : "transparent",
                color: mode === m ? "#f59e0b" : "rgba(255,255,255,0.4)",
                border: mode === m ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
              }}
            >
              {m === "listen" ? "استمع وردد" : m === "cover" ? "غطِّ وتذكر" : "اختبر نفسك"}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 shrink-0 mb-2">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "#f59e0b", width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          آية {toEA(currentIdx + 1)} من {toEA(surah.ayahCount)}
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: "#f59e0b" }} />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
          <p className="text-red-400 text-sm text-center">{error}</p>
          <p className="text-muted-foreground text-xs text-center">API: {getApiBase()}/quran/surah/{surah.id}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${mode}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              {/* Ayah card */}
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  minHeight: 150,
                }}
              >
                {currentAyah && (
                  <>
                    {mode === "test" ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-[12px] text-muted-foreground mb-2">أكمل هذه الآية:</p>
                        {testResult ? (
                          <div>
                            <p
                              className="leading-[2.5] mb-3"
                              style={{ fontFamily: "'Amiri Quran', serif", fontSize: 20, color: testResult === "correct" ? "#10b981" : "var(--foreground)" }}
                            >
                              {currentAyah.text}
                            </p>
                            {testResult === "wrong" && testInput && (
                              <p className="text-[12px] text-red-400 mb-2">إجابتك: {testInput}</p>
                            )}
                          </div>
                        ) : (
                          <textarea
                            value={testInput}
                            onChange={e => setTestInput(e.target.value)}
                            placeholder="اكتب الآية من الذاكرة..."
                            className="w-full bg-transparent border rounded-xl p-3 text-right leading-loose resize-none outline-none"
                            style={{
                              fontFamily: "'Amiri Quran', serif",
                              fontSize: 18,
                              borderColor: "rgba(255,255,255,0.1)",
                              minHeight: 120,
                            }}
                            dir="rtl"
                          />
                        )}
                      </div>
                    ) : mode === "cover" ? (
                      <div>
                        <p
                          className="leading-[2.5]"
                          style={{
                            fontFamily: "'Amiri Quran', serif",
                            fontSize: 20,
                            color: showText ? "var(--foreground)" : "transparent",
                            background: showText ? "transparent" : "rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            transition: "all 0.3s",
                            textShadow: showText ? "none" : "0 0 20px rgba(255,255,255,0.05)",
                          }}
                        >
                          {currentAyah.text}
                        </p>
                        <p className="text-[13px] mt-3" style={{ color: "rgba(245,158,11,0.7)" }}>
                          ﴿{toEA(currentAyah.numberInSurah)}﴾
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p
                          className="leading-[2.5]"
                          style={{ fontFamily: "'Amiri Quran', serif", fontSize: 20, color: "var(--foreground)" }}
                        >
                          {currentAyah.text}
                        </p>
                        <p className="text-[13px] mt-3" style={{ color: "rgba(245,158,11,0.7)" }}>
                          ﴿{toEA(currentAyah.numberInSurah)}﴾
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Result feedback */}
              {mode === "test" && testResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: testResult === "correct" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${testResult === "correct" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: testResult === "correct" ? "#10b981" : "#ef4444" }}>
                    {testResult === "correct" ? "✓ أحسنت! حفظت هذه الآية" : "✗ حاول مرة أخرى"}
                  </p>
                </motion.div>
              )}

              {/* Score (test mode) */}
              {mode === "test" && (score.correct + score.wrong > 0) && (
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="font-bold text-base text-emerald-500">{toEA(score.correct)}</p>
                    <p className="text-[10px] text-muted-foreground">صحيح</p>
                  </div>
                  <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p className="font-bold text-base text-red-400">{toEA(score.wrong)}</p>
                    <p className="text-[10px] text-muted-foreground">خطأ</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {mode === "listen" && (
                  <button
                    onClick={() => isPlaying ? stopAudio() : playAyah(currentIdx)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#1a0e00",
                      boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                    }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? "إيقاف" : "استمع للآية"}
                  </button>
                )}

                {mode === "cover" && (
                  <>
                    <button
                      onClick={() => setShowText(s => !s)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                      style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}
                    >
                      {showText ? <EyeOff size={15} /> : <Eye size={15} />}
                      {showText ? "غطِّ الآية" : "اكشف الآية"}
                    </button>
                    <button
                      onClick={() => isPlaying ? stopAudio() : playAyah(currentIdx)}
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      {isPlaying ? <Pause size={16} style={{ color: "#f59e0b" }} /> : <Play size={16} style={{ color: "#f59e0b" }} />}
                    </button>
                  </>
                )}

                {mode === "test" && !testResult && (
                  <button
                    onClick={checkAnswer}
                    disabled={!testInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{
                      background: testInput.trim() ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.05)",
                      color: testInput.trim() ? "#1a0e00" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    <Check size={16} />
                    تحقق
                  </button>
                )}

                {(mode !== "test" || testResult) && (
                  <button
                    onClick={() => {
                      setShowText(true);
                      if (currentIdx < ayahs.length - 1) nextAyah();
                      else setCurrentIdx(0);
                    }}
                    className={`${mode === "listen" ? "w-14" : mode === "test" ? "flex-1" : "w-14"} h-12 rounded-xl flex items-center justify-center font-bold text-sm`}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {currentIdx < ayahs.length - 1 ? <ChevronRight size={16} className="text-muted-foreground" style={{ transform: "scaleX(-1)" }} /> : <RotateCcw size={16} className="text-muted-foreground" />}
                  </button>
                )}
              </div>

              {/* Memorized ayahs grid */}
              {memorized.size > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {Array.from(memorized).sort((a, b) => a - b).map(idx => (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px]"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontFamily: "'Amiri Quran', serif" }}
                    >
                      {toEA(idx + 1)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranMemorizePage() {
  const { quranReciterId } = useSettings();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [search, setSearch] = useState("");
  const filtered = SHORT_SURAHS.filter(s => s.name.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase()));

  if (selectedSurah) {
    return (
      <div className="min-h-screen flex flex-col pb-20">
        <MemorizeSession surah={selectedSurah} reciterId={quranReciterId} onBack={() => setSelectedSurah(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <PageHeader title="مساعد الحفظ" subtitle="احفظ القرآن آية بآية" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Tips */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(145deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.03) 100%)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} style={{ color: "#f59e0b" }} />
            <p className="font-bold text-sm" style={{ color: "#f59e0b" }}>طريقة الحفظ الفعّالة</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { step: "١", text: "استمع للآية مرات عديدة" },
              { step: "٢", text: "غطِّها وحاول تذكرها" },
              { step: "٣", text: "اختبر نفسك باكتبها من الذاكرة" },
            ].map(t => (
              <div key={t.step} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>{t.step}</span>
                <p className="text-[12px] text-muted-foreground">{t.text}</p>
              </div>
            ))}
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
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedSurah(s)}
              className="flex items-center gap-3 p-3 rounded-xl text-right active:scale-[0.98] transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-[12px]"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "'Amiri Quran', serif" }}>
                {toEA(s.id)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ fontFamily: "'Amiri Quran', serif" }}>{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.nameEn} · {s.ayahCount} آية · {s.revelation}</p>
              </div>
              <Star size={13} className="text-muted-foreground/40" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
