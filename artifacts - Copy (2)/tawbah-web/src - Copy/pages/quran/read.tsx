import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search, BookOpen, Play, Pause, Loader2, X, Settings, Type, Volume2, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { getApiBase, isNativeApp } from "@/lib/api-base";
import { setAudioSrc } from "@/lib/native-audio";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

const TO_AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternArabic(n: number): string {
  return String(n).split('').map(d => TO_AR[parseInt(d)] ?? d).join('');
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

function isBismillahOnly(text: string): boolean {
  const normalized = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s+/g, "");
  return normalized.startsWith("بسماللهالرحمنالرحيم") && text.trim().split(/\s+/).length <= 6;
}

function cdnUrl(surahId: number, ayahNum: number, reciterId: string) {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${toGlobalAyah(surahId, ayahNum)}.mp3`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Surah {
  id: number;
  name: string;
  nameEn: string;
  ayahCount: number;
  juz: number;
  revelation: string;
  meaning: string;
}

interface Ayah { numberInSurah: number; text: string; }

// ─── Surah data ───────────────────────────────────────────────────────────────

const SURAHS: Surah[] = [
  { id:1,  name:"الفاتحة",   nameEn:"Al-Fatiha",      ayahCount:7,   juz:1,  revelation:"مكية",  meaning:"الفاتحة" },
  { id:2,  name:"البقرة",    nameEn:"Al-Baqara",      ayahCount:286, juz:1,  revelation:"مدنية", meaning:"البقرة" },
  { id:3,  name:"آل عمران",  nameEn:"Aal Imran",      ayahCount:200, juz:3,  revelation:"مدنية", meaning:"آل عمران" },
  { id:4,  name:"النساء",    nameEn:"An-Nisa",        ayahCount:176, juz:4,  revelation:"مدنية", meaning:"النساء" },
  { id:5,  name:"المائدة",   nameEn:"Al-Maida",       ayahCount:120, juz:6,  revelation:"مدنية", meaning:"المائدة" },
  { id:6,  name:"الأنعام",   nameEn:"Al-Anam",        ayahCount:165, juz:7,  revelation:"مكية",  meaning:"الأنعام" },
  { id:7,  name:"الأعراف",   nameEn:"Al-Araf",        ayahCount:206, juz:8,  revelation:"مكية",  meaning:"الأعراف" },
  { id:8,  name:"الأنفال",   nameEn:"Al-Anfal",       ayahCount:75,  juz:9,  revelation:"مدنية", meaning:"الأنفال" },
  { id:9,  name:"التوبة",    nameEn:"At-Tawba",       ayahCount:129, juz:10, revelation:"مدنية", meaning:"التوبة" },
  { id:10, name:"يونس",      nameEn:"Yunus",          ayahCount:109, juz:11, revelation:"مكية",  meaning:"يونس" },
  { id:11, name:"هود",       nameEn:"Hud",            ayahCount:123, juz:11, revelation:"مكية",  meaning:"هود" },
  { id:12, name:"يوسف",      nameEn:"Yusuf",          ayahCount:111, juz:12, revelation:"مكية",  meaning:"يوسف" },
  { id:13, name:"الرعد",     nameEn:"Ar-Rad",         ayahCount:43,  juz:13, revelation:"مدنية", meaning:"الرعد" },
  { id:14, name:"إبراهيم",   nameEn:"Ibrahim",        ayahCount:52,  juz:13, revelation:"مكية",  meaning:"إبراهيم" },
  { id:15, name:"الحجر",     nameEn:"Al-Hijr",        ayahCount:99,  juz:14, revelation:"مكية",  meaning:"الحجر" },
  { id:16, name:"النحل",     nameEn:"An-Nahl",        ayahCount:128, juz:14, revelation:"مكية",  meaning:"النحل" },
  { id:17, name:"الإسراء",   nameEn:"Al-Isra",        ayahCount:111, juz:15, revelation:"مكية",  meaning:"الإسراء" },
  { id:18, name:"الكهف",     nameEn:"Al-Kahf",        ayahCount:110, juz:15, revelation:"مكية",  meaning:"الكهف" },
  { id:19, name:"مريم",      nameEn:"Maryam",         ayahCount:98,  juz:16, revelation:"مكية",  meaning:"مريم" },
  { id:20, name:"طه",        nameEn:"Ta-Ha",          ayahCount:135, juz:16, revelation:"مكية",  meaning:"طه" },
  { id:21, name:"الأنبياء",  nameEn:"Al-Anbiya",      ayahCount:112, juz:17, revelation:"مكية",  meaning:"الأنبياء" },
  { id:22, name:"الحج",      nameEn:"Al-Hajj",        ayahCount:78,  juz:17, revelation:"مدنية", meaning:"الحج" },
  { id:23, name:"المؤمنون",  nameEn:"Al-Muminun",     ayahCount:118, juz:18, revelation:"مكية",  meaning:"المؤمنون" },
  { id:24, name:"النور",     nameEn:"An-Nur",         ayahCount:64,  juz:18, revelation:"مدنية", meaning:"النور" },
  { id:25, name:"الفرقان",   nameEn:"Al-Furqan",      ayahCount:77,  juz:18, revelation:"مكية",  meaning:"الفرقان" },
  { id:26, name:"الشعراء",   nameEn:"Ash-Shuara",     ayahCount:227, juz:19, revelation:"مكية",  meaning:"الشعراء" },
  { id:27, name:"النمل",     nameEn:"An-Naml",        ayahCount:93,  juz:19, revelation:"مكية",  meaning:"النمل" },
  { id:28, name:"القصص",     nameEn:"Al-Qasas",       ayahCount:88,  juz:20, revelation:"مكية",  meaning:"القصص" },
  { id:29, name:"العنكبوت",  nameEn:"Al-Ankabut",     ayahCount:69,  juz:20, revelation:"مكية",  meaning:"العنكبوت" },
  { id:30, name:"الروم",     nameEn:"Ar-Rum",         ayahCount:60,  juz:21, revelation:"مكية",  meaning:"الروم" },
  { id:31, name:"لقمان",     nameEn:"Luqman",         ayahCount:34,  juz:21, revelation:"مكية",  meaning:"لقمان" },
  { id:32, name:"السجدة",    nameEn:"As-Sajda",       ayahCount:30,  juz:21, revelation:"مكية",  meaning:"السجدة" },
  { id:33, name:"الأحزاب",   nameEn:"Al-Ahzab",       ayahCount:73,  juz:21, revelation:"مدنية", meaning:"الأحزاب" },
  { id:34, name:"سبأ",       nameEn:"Saba",           ayahCount:54,  juz:22, revelation:"مكية",  meaning:"سبأ" },
  { id:35, name:"فاطر",      nameEn:"Fatir",          ayahCount:45,  juz:22, revelation:"مكية",  meaning:"فاطر" },
  { id:36, name:"يس",        nameEn:"Ya-Sin",         ayahCount:83,  juz:22, revelation:"مكية",  meaning:"قلب القرآن" },
  { id:37, name:"الصافات",   nameEn:"As-Saffat",      ayahCount:182, juz:23, revelation:"مكية",  meaning:"الصافات" },
  { id:38, name:"ص",         nameEn:"Sad",            ayahCount:88,  juz:23, revelation:"مكية",  meaning:"ص" },
  { id:39, name:"الزمر",     nameEn:"Az-Zumar",       ayahCount:75,  juz:23, revelation:"مكية",  meaning:"الزمر" },
  { id:40, name:"غافر",      nameEn:"Ghafir",         ayahCount:85,  juz:24, revelation:"مكية",  meaning:"المؤمن" },
  { id:41, name:"فصلت",      nameEn:"Fussilat",       ayahCount:54,  juz:24, revelation:"مكية",  meaning:"فصلت" },
  { id:42, name:"الشورى",    nameEn:"Ash-Shura",      ayahCount:53,  juz:25, revelation:"مكية",  meaning:"الشورى" },
  { id:43, name:"الزخرف",    nameEn:"Az-Zukhruf",     ayahCount:89,  juz:25, revelation:"مكية",  meaning:"الزخرف" },
  { id:44, name:"الدخان",    nameEn:"Ad-Dukhan",      ayahCount:59,  juz:25, revelation:"مكية",  meaning:"الدخان" },
  { id:45, name:"الجاثية",   nameEn:"Al-Jathiya",     ayahCount:37,  juz:25, revelation:"مكية",  meaning:"الجاثية" },
  { id:46, name:"الأحقاف",   nameEn:"Al-Ahqaf",       ayahCount:35,  juz:26, revelation:"مكية",  meaning:"الأحقاف" },
  { id:47, name:"محمد",      nameEn:"Muhammad",       ayahCount:38,  juz:26, revelation:"مدنية", meaning:"محمد ﷺ" },
  { id:48, name:"الفتح",     nameEn:"Al-Fath",        ayahCount:29,  juz:26, revelation:"مدنية", meaning:"الفتح" },
  { id:49, name:"الحجرات",   nameEn:"Al-Hujurat",     ayahCount:18,  juz:26, revelation:"مدنية", meaning:"الحجرات" },
  { id:50, name:"ق",         nameEn:"Qaf",            ayahCount:45,  juz:26, revelation:"مكية",  meaning:"ق" },
  { id:51, name:"الذاريات",  nameEn:"Adh-Dhariyat",   ayahCount:60,  juz:26, revelation:"مكية",  meaning:"الذاريات" },
  { id:52, name:"الطور",     nameEn:"At-Tur",         ayahCount:49,  juz:27, revelation:"مكية",  meaning:"الطور" },
  { id:53, name:"النجم",     nameEn:"An-Najm",        ayahCount:62,  juz:27, revelation:"مكية",  meaning:"النجم" },
  { id:54, name:"القمر",     nameEn:"Al-Qamar",       ayahCount:55,  juz:27, revelation:"مكية",  meaning:"القمر" },
  { id:55, name:"الرحمن",    nameEn:"Ar-Rahman",      ayahCount:78,  juz:27, revelation:"مدنية", meaning:"عروس القرآن" },
  { id:56, name:"الواقعة",   nameEn:"Al-Waqia",       ayahCount:96,  juz:27, revelation:"مكية",  meaning:"الواقعة" },
  { id:57, name:"الحديد",    nameEn:"Al-Hadid",       ayahCount:29,  juz:27, revelation:"مدنية", meaning:"الحديد" },
  { id:58, name:"المجادلة",  nameEn:"Al-Mujadila",    ayahCount:22,  juz:28, revelation:"مدنية", meaning:"المجادلة" },
  { id:59, name:"الحشر",     nameEn:"Al-Hashr",       ayahCount:24,  juz:28, revelation:"مدنية", meaning:"الحشر" },
  { id:60, name:"الممتحنة",  nameEn:"Al-Mumtahina",   ayahCount:13,  juz:28, revelation:"مدنية", meaning:"الممتحنة" },
  { id:61, name:"الصف",      nameEn:"As-Saf",         ayahCount:14,  juz:28, revelation:"مدنية", meaning:"الصف" },
  { id:62, name:"الجمعة",    nameEn:"Al-Jumua",       ayahCount:11,  juz:28, revelation:"مدنية", meaning:"الجمعة" },
  { id:63, name:"المنافقون", nameEn:"Al-Munafiqun",   ayahCount:11,  juz:28, revelation:"مدنية", meaning:"المنافقون" },
  { id:64, name:"التغابن",   nameEn:"At-Taghabun",    ayahCount:18,  juz:28, revelation:"مدنية", meaning:"التغابن" },
  { id:65, name:"الطلاق",    nameEn:"At-Talaq",       ayahCount:12,  juz:28, revelation:"مدنية", meaning:"الطلاق" },
  { id:66, name:"التحريم",   nameEn:"At-Tahrim",      ayahCount:12,  juz:28, revelation:"مدنية", meaning:"التحريم" },
  { id:67, name:"الملك",     nameEn:"Al-Mulk",        ayahCount:30,  juz:29, revelation:"مكية",  meaning:"المانعة" },
  { id:68, name:"القلم",     nameEn:"Al-Qalam",       ayahCount:52,  juz:29, revelation:"مكية",  meaning:"ن" },
  { id:69, name:"الحاقة",    nameEn:"Al-Haaqqa",      ayahCount:52,  juz:29, revelation:"مكية",  meaning:"الحاقة" },
  { id:70, name:"المعارج",   nameEn:"Al-Maarij",      ayahCount:44,  juz:29, revelation:"مكية",  meaning:"المعارج" },
  { id:71, name:"نوح",       nameEn:"Nuh",            ayahCount:28,  juz:29, revelation:"مكية",  meaning:"نوح" },
  { id:72, name:"الجن",      nameEn:"Al-Jinn",        ayahCount:28,  juz:29, revelation:"مكية",  meaning:"الجن" },
  { id:73, name:"المزمل",    nameEn:"Al-Muzzammil",   ayahCount:20,  juz:29, revelation:"مكية",  meaning:"المزمل" },
  { id:74, name:"المدثر",    nameEn:"Al-Muddaththir", ayahCount:56,  juz:29, revelation:"مكية",  meaning:"المدثر" },
  { id:75, name:"القيامة",   nameEn:"Al-Qiyama",      ayahCount:40,  juz:29, revelation:"مكية",  meaning:"القيامة" },
  { id:76, name:"الإنسان",   nameEn:"Al-Insan",       ayahCount:31,  juz:29, revelation:"مدنية", meaning:"الإنسان" },
  { id:77, name:"المرسلات",  nameEn:"Al-Mursalat",    ayahCount:50,  juz:29, revelation:"مكية",  meaning:"المرسلات" },
  { id:78, name:"النبأ",     nameEn:"An-Naba",        ayahCount:40,  juz:30, revelation:"مكية",  meaning:"النبأ العظيم" },
  { id:79, name:"النازعات",  nameEn:"An-Naziat",      ayahCount:46,  juz:30, revelation:"مكية",  meaning:"النازعات" },
  { id:80, name:"عبس",       nameEn:"Abasa",          ayahCount:42,  juz:30, revelation:"مكية",  meaning:"عبس" },
  { id:81, name:"التكوير",   nameEn:"At-Takwir",      ayahCount:29,  juz:30, revelation:"مكية",  meaning:"التكوير" },
  { id:82, name:"الانفطار",  nameEn:"Al-Infitar",     ayahCount:19,  juz:30, revelation:"مكية",  meaning:"الانفطار" },
  { id:83, name:"المطففين",  nameEn:"Al-Mutaffifin",  ayahCount:36,  juz:30, revelation:"مكية",  meaning:"المطففين" },
  { id:84, name:"الانشقاق",  nameEn:"Al-Inshiqaq",    ayahCount:25,  juz:30, revelation:"مكية",  meaning:"الانشقاق" },
  { id:85, name:"البروج",    nameEn:"Al-Buruj",       ayahCount:22,  juz:30, revelation:"مكية",  meaning:"البروج" },
  { id:86, name:"الطارق",    nameEn:"At-Tariq",       ayahCount:17,  juz:30, revelation:"مكية",  meaning:"الطارق" },
  { id:87, name:"الأعلى",    nameEn:"Al-Ala",         ayahCount:19,  juz:30, revelation:"مكية",  meaning:"الأعلى" },
  { id:88, name:"الغاشية",   nameEn:"Al-Ghashiya",    ayahCount:26,  juz:30, revelation:"مكية",  meaning:"الغاشية" },
  { id:89, name:"الفجر",     nameEn:"Al-Fajr",        ayahCount:30,  juz:30, revelation:"مكية",  meaning:"الفجر" },
  { id:90, name:"البلد",     nameEn:"Al-Balad",       ayahCount:20,  juz:30, revelation:"مكية",  meaning:"البلد" },
  { id:91, name:"الشمس",     nameEn:"Ash-Shams",      ayahCount:15,  juz:30, revelation:"مكية",  meaning:"الشمس" },
  { id:92, name:"الليل",     nameEn:"Al-Layl",        ayahCount:21,  juz:30, revelation:"مكية",  meaning:"الليل" },
  { id:93, name:"الضحى",     nameEn:"Ad-Duha",        ayahCount:11,  juz:30, revelation:"مكية",  meaning:"الضحى" },
  { id:94, name:"الشرح",     nameEn:"Ash-Sharh",      ayahCount:8,   juz:30, revelation:"مكية",  meaning:"ألم نشرح" },
  { id:95, name:"التين",     nameEn:"At-Tin",         ayahCount:8,   juz:30, revelation:"مكية",  meaning:"التين" },
  { id:96, name:"العلق",     nameEn:"Al-Alaq",        ayahCount:19,  juz:30, revelation:"مكية",  meaning:"اقرأ" },
  { id:97, name:"القدر",     nameEn:"Al-Qadr",        ayahCount:5,   juz:30, revelation:"مكية",  meaning:"ليلة القدر" },
  { id:98, name:"البينة",    nameEn:"Al-Bayyina",     ayahCount:8,   juz:30, revelation:"مدنية", meaning:"البينة" },
  { id:99, name:"الزلزلة",   nameEn:"Az-Zalzala",     ayahCount:8,   juz:30, revelation:"مدنية", meaning:"الزلزلة" },
  { id:100,name:"العاديات",  nameEn:"Al-Adiyat",      ayahCount:11,  juz:30, revelation:"مكية",  meaning:"العاديات" },
  { id:101,name:"القارعة",   nameEn:"Al-Qaria",       ayahCount:11,  juz:30, revelation:"مكية",  meaning:"القارعة" },
  { id:102,name:"التكاثر",   nameEn:"At-Takathur",    ayahCount:8,   juz:30, revelation:"مكية",  meaning:"التكاثر" },
  { id:103,name:"العصر",     nameEn:"Al-Asr",         ayahCount:3,   juz:30, revelation:"مكية",  meaning:"العصر" },
  { id:104,name:"الهمزة",    nameEn:"Al-Humaza",      ayahCount:9,   juz:30, revelation:"مكية",  meaning:"الهمزة" },
  { id:105,name:"الفيل",     nameEn:"Al-Fil",         ayahCount:5,   juz:30, revelation:"مكية",  meaning:"الفيل" },
  { id:106,name:"قريش",      nameEn:"Quraysh",        ayahCount:4,   juz:30, revelation:"مكية",  meaning:"قريش" },
  { id:107,name:"الماعون",   nameEn:"Al-Maun",        ayahCount:7,   juz:30, revelation:"مكية",  meaning:"الماعون" },
  { id:108,name:"الكوثر",    nameEn:"Al-Kawthar",     ayahCount:3,   juz:30, revelation:"مكية",  meaning:"الكوثر" },
  { id:109,name:"الكافرون",  nameEn:"Al-Kafirun",     ayahCount:6,   juz:30, revelation:"مكية",  meaning:"الكافرون" },
  { id:110,name:"النصر",     nameEn:"An-Nasr",        ayahCount:3,   juz:30, revelation:"مدنية", meaning:"النصر" },
  { id:111,name:"المسد",     nameEn:"Al-Masad",       ayahCount:5,   juz:30, revelation:"مكية",  meaning:"أبو لهب" },
  { id:112,name:"الإخلاص",   nameEn:"Al-Ikhlas",      ayahCount:4,   juz:30, revelation:"مكية",  meaning:"ثلث القرآن" },
  { id:113,name:"الفلق",     nameEn:"Al-Falaq",       ayahCount:5,   juz:30, revelation:"مكية",  meaning:"الفلق" },
  { id:114,name:"الناس",     nameEn:"An-Nas",         ayahCount:6,   juz:30, revelation:"مكية",  meaning:"الناس" },
];

// ─── Mushaf Reader ────────────────────────────────────────────────────────────

function MushafReader({ surah, reciterId, onBack }: { surah: Surah; reciterId: string; onBack: () => void }) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAyahs([]);
    setPlayingIdx(null);
    setIsPlaying(false);
    fetch(`${getApiBase()}/quran/surah/${surah.id}`)
      .then(r => r.json())
      .then(data => {
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
          setError(`API error: ${data.code}`);
        }
      })
      .catch(e => setError(`Fetch failed: ${e.message}`))
      .finally(() => setLoading(false));
  }, [surah.id]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setPlayingIdx(null);
    setIsPlaying(false);
  }, []);

  const playIdx = useCallback(async (idx: number) => {
    const ayah = ayahs[idx];
    if (!ayah) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.pause();
    const url = cdnUrl(surah.id, ayah.numberInSurah, reciterId);
    if (isNativeApp()) {
      await setAudioSrc(audio, url);
    } else {
      audio.src = url;
    }
    audio.load();
    audio.play().catch(() => {});
    setPlayingIdx(idx);
    setIsPlaying(true);
    spanRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    audio.onended = () => {
      const next = idx + 1;
      if (next < ayahs.length) playIdx(next);
      else { setPlayingIdx(null); setIsPlaying(false); }
    };
  }, [ayahs, surah.id, reciterId]);

  const handleAyahTap = (idx: number) => {
    if (playingIdx === idx && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      playIdx(idx);
    }
  };

  useEffect(() => () => stopAudio(), [stopAudio]);

  return (
    <div className="flex flex-col h-full">
      {/* Reader header */}
      <div
        className="shrink-0 px-4 py-3 border-b flex items-center justify-between gap-3"
        style={{ borderColor: "rgba(200,168,75,0.15)" }}
      >
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-base" style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}>
            سورة {surah.name}
          </p>
          <p className="text-[10px] text-muted-foreground">{surah.ayahCount} آية · {surah.revelation} · الجزء {surah.juz}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(s => Math.max(16, s - 2))} className="w-7 h-7 rounded-lg bg-muted/60 text-[11px] font-bold flex items-center justify-center text-muted-foreground">أ-</button>
          <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="w-7 h-7 rounded-lg bg-muted/60 text-[13px] font-bold flex items-center justify-center text-muted-foreground">أ+</button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: "rgba(200,168,75,0.08)" }}>
        <button
          onClick={() => isPlaying ? (audioRef.current?.pause(), setIsPlaying(false)) : (playingIdx !== null ? (audioRef.current?.play().catch(() => {}), setIsPlaying(true)) : playIdx(0))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
          style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.25)", color: "#c8a84b" }}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? "إيقاف" : (playingIdx !== null ? "متابعة" : "تشغيل الكل")}
        </button>
        {playingIdx !== null && (
          <button onClick={stopAudio} className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
            <X size={13} className="text-muted-foreground" />
          </button>
        )}
        <p className="flex-1 text-left text-[10px] text-muted-foreground">اضغط آية للاستماع</p>
        {playingIdx !== null && (
          <span className="text-[10px] font-bold" style={{ color: "#c8a84b" }}>
            الآية {toEasternArabic(ayahs[playingIdx]?.numberInSurah ?? 0)}
          </span>
        )}
      </div>

      {/* Ayahs */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: "#c8a84b" }} />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 px-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
            <p className="text-muted-foreground text-xs text-center">API: {getApiBase()}/quran/surah/{surah.id}</p>
          </div>
        )}
        {!loading && !error && ayahs.length > 0 && (
          <div className="px-5 py-6">
            {surah.id !== 1 && surah.id !== 9 && (
              <p
                className="text-center mb-5 pb-4 border-b"
                style={{
                  fontFamily: "'Amiri Quran', serif",
                  fontSize: 20,
                  color: "rgba(200,168,75,0.85)",
                  borderColor: "rgba(200,168,75,0.12)",
                }}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            )}
            <p
              className="leading-[3.2] text-right"
              style={{
                fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                fontSize,
                direction: "rtl",
                textAlign: "justify",
              }}
              dir="rtl"
            >
              {ayahs.map((ayah, idx) => (
                <span key={ayah.numberInSurah}>
                  <span
                    ref={el => { spanRefs.current[idx] = el; }}
                    onClick={() => handleAyahTap(idx)}
                    className="cursor-pointer transition-all"
                    style={{
                      background: playingIdx === idx ? "rgba(200,168,75,0.2)" : "transparent",
                      color: playingIdx === idx ? "#c8a84b" : "var(--foreground)",
                      borderRadius: 6,
                      padding: "1px 2px",
                    }}
                  >
                    {ayah.text}
                  </span>
                  {" "}
                  <span
                    style={{
                      fontFamily: "'Amiri Quran', serif",
                      fontSize: fontSize * 0.72,
                      color: playingIdx === idx ? "#c8a84b" : "rgba(200,168,75,0.7)",
                    }}
                  >
                    ﴿{toEasternArabic(ayah.numberInSurah)}﴾
                  </span>
                  {" "}
                </span>
              ))}
            </p>
          </div>
        )}
        <div className="h-10" />
      </div>
    </div>
  );
}

// ─── Surah Picker ─────────────────────────────────────────────────────────────

function SurahPicker({ onSelect }: { onSelect: (s: Surah) => void }) {
  const [search, setSearch] = useState("");
  const filtered = SURAHS.filter(
    s => s.name.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase()) || String(s.id).includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search size={14} className="text-muted-foreground shrink-0" />
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

      {/* Surah list */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {filtered.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.008 }}
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-right active:scale-[0.98] transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-[13px]"
              style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.2)", color: "#c8a84b", fontFamily: "'Amiri Quran', serif" }}
            >
              {toEasternArabic(s.id)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight" style={{ fontFamily: "'Amiri Quran', serif" }}>{s.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.nameEn} · {s.ayahCount} آية · {s.revelation}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" style={{ transform: "scaleX(-1)" }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranReadPage() {
  const { quranReciterId, setQuranReciterId } = useSettings();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const currentReciter = QURAN_RECITERS.find(r => r.id === quranReciterId);

  return (
    <div className="min-h-screen flex flex-col pb-20" dir="rtl">
      <PageHeader
        title={selectedSurah ? `سورة ${selectedSurah.name}` : "قراءة المصحف"}
        subtitle={selectedSurah ? `${selectedSurah.ayahCount} آية · ${selectedSurah.revelation}` : "١١٤ سورة"}
        right={
          <button
            onClick={() => setShowReciterPicker(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.25)" }}
          >
            <Volume2 size={13} style={{ color: "#c8a84b" }} />
            <span className="text-[11px] font-bold" style={{ color: "#c8a84b" }}>{currentReciter?.nameAr.split(" ")[0]}</span>
          </button>
        }
      />

      {/* Reciter picker dropdown */}
      <AnimatePresence>
        {showReciterPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b shrink-0 mx-4"
            style={{ borderColor: "rgba(200,168,75,0.15)" }}
          >
            <div className="py-2 flex flex-col gap-1">
              {QURAN_RECITERS.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setQuranReciterId(r.id); setShowReciterPicker(false); }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{
                    background: quranReciterId === r.id ? "rgba(200,168,75,0.12)" : "transparent",
                    border: quranReciterId === r.id ? "1px solid rgba(200,168,75,0.25)" : "1px solid transparent",
                  }}
                >
                  <span className="text-[12px]">{r.nameAr}</span>
                  {quranReciterId === r.id && <Check size={13} style={{ color: "#c8a84b" }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSurah ? (
          <MushafReader
            surah={selectedSurah}
            reciterId={quranReciterId}
            onBack={() => setSelectedSurah(null)}
          />
        ) : (
          <SurahPicker onSelect={setSelectedSurah} />
        )}
      </div>
    </div>
  );
}
