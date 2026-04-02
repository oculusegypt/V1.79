import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  X,
  Volume2,
  Check,
  Loader2,
  Sun,
  Bookmark,
  Share2,
  Zap,
  Sparkles,
  Flame,
  Star,
  Brain,
  BookMarked,
} from "lucide-react";
import { Link } from "wouter";
import { StandardHeader } from "@/components/header/StandardHeader";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { getApiBase } from "@/lib/api-base";

// ─── Audio helpers ─────────────────────────────────────────────────────────────

const SURAH_LENGTHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function cdnAudioUrl(
  surahId: number,
  ayahNum: number,
  reciterId: string,
): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${toGlobalAyah(surahId, ayahNum)}.mp3`;
}

const TO_AR = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toEasternArabic(n: number): string {
  return String(n)
    .split("")
    .map((d) => TO_AR[parseInt(d)] ?? d)
    .join("");
}

let activeQuranAudio: { element: HTMLAudioElement; stop: () => void } | null =
  null;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Surah {
  id: number;
  name: string;
  nameEn: string;
  revelation: "مكية" | "مدنية";
  ayahCount: number;
  juz: number;
  meaning: string;
}

interface QuranMiracle {
  id: number;
  title: string;
  icon: string;
  category: "عددي" | "علمي" | "لغوي" | "تاريخي";
  description: string;
  detail: string;
  color: string;
}

interface QuranScience {
  id: number;
  title: string;
  icon: string;
  description: string;
  gradient: string;
  border: string;
  route: string;
}

interface DailyAyah {
  arabic: string;
  surah: string;
  ayahNum: number;
  tafsir: string;
  memorize: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SURAHS: Surah[] = [
  {
    id: 1,
    name: "الفاتحة",
    nameEn: "Al-Fatiha",
    revelation: "مكية",
    ayahCount: 7,
    juz: 1,
    meaning: "الفاتحة",
  },
  {
    id: 2,
    name: "البقرة",
    nameEn: "Al-Baqara",
    revelation: "مدنية",
    ayahCount: 286,
    juz: 1,
    meaning: "البقرة",
  },
  {
    id: 3,
    name: "آل عمران",
    nameEn: "Aal Imran",
    revelation: "مدنية",
    ayahCount: 200,
    juz: 3,
    meaning: "آل عمران",
  },
  {
    id: 4,
    name: "النساء",
    nameEn: "An-Nisa",
    revelation: "مدنية",
    ayahCount: 176,
    juz: 4,
    meaning: "النساء",
  },
  {
    id: 5,
    name: "المائدة",
    nameEn: "Al-Maida",
    revelation: "مدنية",
    ayahCount: 120,
    juz: 6,
    meaning: "المائدة",
  },
  {
    id: 6,
    name: "الأنعام",
    nameEn: "Al-Anam",
    revelation: "مكية",
    ayahCount: 165,
    juz: 7,
    meaning: "الأنعام",
  },
  {
    id: 7,
    name: "الأعراف",
    nameEn: "Al-Araf",
    revelation: "مكية",
    ayahCount: 206,
    juz: 8,
    meaning: "الأعراف",
  },
  {
    id: 8,
    name: "الأنفال",
    nameEn: "Al-Anfal",
    revelation: "مدنية",
    ayahCount: 75,
    juz: 9,
    meaning: "الأنفال",
  },
  {
    id: 9,
    name: "التوبة",
    nameEn: "At-Tawba",
    revelation: "مدنية",
    ayahCount: 129,
    juz: 10,
    meaning: "التوبة",
  },
  {
    id: 10,
    name: "يونس",
    nameEn: "Yunus",
    revelation: "مكية",
    ayahCount: 109,
    juz: 11,
    meaning: "نبي الله يونس",
  },
  {
    id: 11,
    name: "هود",
    nameEn: "Hud",
    revelation: "مكية",
    ayahCount: 123,
    juz: 11,
    meaning: "نبي الله هود",
  },
  {
    id: 12,
    name: "يوسف",
    nameEn: "Yusuf",
    revelation: "مكية",
    ayahCount: 111,
    juz: 12,
    meaning: "نبي الله يوسف",
  },
  {
    id: 13,
    name: "الرعد",
    nameEn: "Ar-Rad",
    revelation: "مدنية",
    ayahCount: 43,
    juz: 13,
    meaning: "الرعد",
  },
  {
    id: 14,
    name: "إبراهيم",
    nameEn: "Ibrahim",
    revelation: "مكية",
    ayahCount: 52,
    juz: 13,
    meaning: "نبي الله إبراهيم",
  },
  {
    id: 15,
    name: "الحجر",
    nameEn: "Al-Hijr",
    revelation: "مكية",
    ayahCount: 99,
    juz: 14,
    meaning: "الحجر",
  },
  {
    id: 16,
    name: "النحل",
    nameEn: "An-Nahl",
    revelation: "مكية",
    ayahCount: 128,
    juz: 14,
    meaning: "النحل",
  },
  {
    id: 17,
    name: "الإسراء",
    nameEn: "Al-Isra",
    revelation: "مكية",
    ayahCount: 111,
    juz: 15,
    meaning: "الإسراء",
  },
  {
    id: 18,
    name: "الكهف",
    nameEn: "Al-Kahf",
    revelation: "مكية",
    ayahCount: 110,
    juz: 15,
    meaning: "الكهف",
  },
  {
    id: 19,
    name: "مريم",
    nameEn: "Maryam",
    revelation: "مكية",
    ayahCount: 98,
    juz: 16,
    meaning: "مريم",
  },
  {
    id: 20,
    name: "طه",
    nameEn: "Ta-Ha",
    revelation: "مكية",
    ayahCount: 135,
    juz: 16,
    meaning: "طه",
  },
  {
    id: 21,
    name: "الأنبياء",
    nameEn: "Al-Anbiya",
    revelation: "مكية",
    ayahCount: 112,
    juz: 17,
    meaning: "الأنبياء",
  },
  {
    id: 22,
    name: "الحج",
    nameEn: "Al-Hajj",
    revelation: "مدنية",
    ayahCount: 78,
    juz: 17,
    meaning: "الحج",
  },
  {
    id: 23,
    name: "المؤمنون",
    nameEn: "Al-Muminun",
    revelation: "مكية",
    ayahCount: 118,
    juz: 18,
    meaning: "المؤمنون",
  },
  {
    id: 24,
    name: "النور",
    nameEn: "An-Nur",
    revelation: "مدنية",
    ayahCount: 64,
    juz: 18,
    meaning: "النور",
  },
  {
    id: 25,
    name: "الفرقان",
    nameEn: "Al-Furqan",
    revelation: "مكية",
    ayahCount: 77,
    juz: 18,
    meaning: "الفرقان",
  },
  {
    id: 26,
    name: "الشعراء",
    nameEn: "Ash-Shuara",
    revelation: "مكية",
    ayahCount: 227,
    juz: 19,
    meaning: "الشعراء",
  },
  {
    id: 27,
    name: "النمل",
    nameEn: "An-Naml",
    revelation: "مكية",
    ayahCount: 93,
    juz: 19,
    meaning: "النمل",
  },
  {
    id: 28,
    name: "القصص",
    nameEn: "Al-Qasas",
    revelation: "مكية",
    ayahCount: 88,
    juz: 20,
    meaning: "القصص",
  },
  {
    id: 29,
    name: "العنكبوت",
    nameEn: "Al-Ankabut",
    revelation: "مكية",
    ayahCount: 69,
    juz: 20,
    meaning: "العنكبوت",
  },
  {
    id: 30,
    name: "الروم",
    nameEn: "Ar-Rum",
    revelation: "مكية",
    ayahCount: 60,
    juz: 21,
    meaning: "الروم",
  },
  {
    id: 31,
    name: "لقمان",
    nameEn: "Luqman",
    revelation: "مكية",
    ayahCount: 34,
    juz: 21,
    meaning: "لقمان الحكيم",
  },
  {
    id: 32,
    name: "السجدة",
    nameEn: "As-Sajda",
    revelation: "مكية",
    ayahCount: 30,
    juz: 21,
    meaning: "السجدة",
  },
  {
    id: 33,
    name: "الأحزاب",
    nameEn: "Al-Ahzab",
    revelation: "مدنية",
    ayahCount: 73,
    juz: 21,
    meaning: "الأحزاب",
  },
  {
    id: 34,
    name: "سبأ",
    nameEn: "Saba",
    revelation: "مكية",
    ayahCount: 54,
    juz: 22,
    meaning: "سبأ",
  },
  {
    id: 35,
    name: "فاطر",
    nameEn: "Fatir",
    revelation: "مكية",
    ayahCount: 45,
    juz: 22,
    meaning: "الملائكة",
  },
  {
    id: 36,
    name: "يس",
    nameEn: "Ya-Sin",
    revelation: "مكية",
    ayahCount: 83,
    juz: 22,
    meaning: "قلب القرآن",
  },
  {
    id: 37,
    name: "الصافات",
    nameEn: "As-Saffat",
    revelation: "مكية",
    ayahCount: 182,
    juz: 23,
    meaning: "الصافات",
  },
  {
    id: 38,
    name: "ص",
    nameEn: "Sad",
    revelation: "مكية",
    ayahCount: 88,
    juz: 23,
    meaning: "ص",
  },
  {
    id: 39,
    name: "الزمر",
    nameEn: "Az-Zumar",
    revelation: "مكية",
    ayahCount: 75,
    juz: 23,
    meaning: "الزمر",
  },
  {
    id: 40,
    name: "غافر",
    nameEn: "Ghafir",
    revelation: "مكية",
    ayahCount: 85,
    juz: 24,
    meaning: "المؤمن",
  },
  {
    id: 41,
    name: "فصلت",
    nameEn: "Fussilat",
    revelation: "مكية",
    ayahCount: 54,
    juz: 24,
    meaning: "فصلت",
  },
  {
    id: 42,
    name: "الشورى",
    nameEn: "Ash-Shura",
    revelation: "مكية",
    ayahCount: 53,
    juz: 25,
    meaning: "الشورى",
  },
  {
    id: 43,
    name: "الزخرف",
    nameEn: "Az-Zukhruf",
    revelation: "مكية",
    ayahCount: 89,
    juz: 25,
    meaning: "الزخرف",
  },
  {
    id: 44,
    name: "الدخان",
    nameEn: "Ad-Dukhan",
    revelation: "مكية",
    ayahCount: 59,
    juz: 25,
    meaning: "الدخان",
  },
  {
    id: 45,
    name: "الجاثية",
    nameEn: "Al-Jathiya",
    revelation: "مكية",
    ayahCount: 37,
    juz: 25,
    meaning: "الجاثية",
  },
  {
    id: 46,
    name: "الأحقاف",
    nameEn: "Al-Ahqaf",
    revelation: "مكية",
    ayahCount: 35,
    juz: 26,
    meaning: "الأحقاف",
  },
  {
    id: 47,
    name: "محمد",
    nameEn: "Muhammad",
    revelation: "مدنية",
    ayahCount: 38,
    juz: 26,
    meaning: "محمد ﷺ",
  },
  {
    id: 48,
    name: "الفتح",
    nameEn: "Al-Fath",
    revelation: "مدنية",
    ayahCount: 29,
    juz: 26,
    meaning: "الفتح",
  },
  {
    id: 49,
    name: "الحجرات",
    nameEn: "Al-Hujurat",
    revelation: "مدنية",
    ayahCount: 18,
    juz: 26,
    meaning: "الحجرات",
  },
  {
    id: 50,
    name: "ق",
    nameEn: "Qaf",
    revelation: "مكية",
    ayahCount: 45,
    juz: 26,
    meaning: "ق",
  },
  {
    id: 51,
    name: "الذاريات",
    nameEn: "Adh-Dhariyat",
    revelation: "مكية",
    ayahCount: 60,
    juz: 26,
    meaning: "الذاريات",
  },
  {
    id: 52,
    name: "الطور",
    nameEn: "At-Tur",
    revelation: "مكية",
    ayahCount: 49,
    juz: 27,
    meaning: "الطور",
  },
  {
    id: 53,
    name: "النجم",
    nameEn: "An-Najm",
    revelation: "مكية",
    ayahCount: 62,
    juz: 27,
    meaning: "النجم",
  },
  {
    id: 54,
    name: "القمر",
    nameEn: "Al-Qamar",
    revelation: "مكية",
    ayahCount: 55,
    juz: 27,
    meaning: "القمر",
  },
  {
    id: 55,
    name: "الرحمن",
    nameEn: "Ar-Rahman",
    revelation: "مدنية",
    ayahCount: 78,
    juz: 27,
    meaning: "عروس القرآن",
  },
  {
    id: 56,
    name: "الواقعة",
    nameEn: "Al-Waqia",
    revelation: "مكية",
    ayahCount: 96,
    juz: 27,
    meaning: "الواقعة",
  },
  {
    id: 57,
    name: "الحديد",
    nameEn: "Al-Hadid",
    revelation: "مدنية",
    ayahCount: 29,
    juz: 27,
    meaning: "الحديد",
  },
  {
    id: 58,
    name: "المجادلة",
    nameEn: "Al-Mujadila",
    revelation: "مدنية",
    ayahCount: 22,
    juz: 28,
    meaning: "المجادلة",
  },
  {
    id: 59,
    name: "الحشر",
    nameEn: "Al-Hashr",
    revelation: "مدنية",
    ayahCount: 24,
    juz: 28,
    meaning: "الحشر",
  },
  {
    id: 60,
    name: "الممتحنة",
    nameEn: "Al-Mumtahina",
    revelation: "مدنية",
    ayahCount: 13,
    juz: 28,
    meaning: "الممتحنة",
  },
  {
    id: 61,
    name: "الصف",
    nameEn: "As-Saf",
    revelation: "مدنية",
    ayahCount: 14,
    juz: 28,
    meaning: "الصف",
  },
  {
    id: 62,
    name: "الجمعة",
    nameEn: "Al-Jumua",
    revelation: "مدنية",
    ayahCount: 11,
    juz: 28,
    meaning: "الجمعة",
  },
  {
    id: 63,
    name: "المنافقون",
    nameEn: "Al-Munafiqun",
    revelation: "مدنية",
    ayahCount: 11,
    juz: 28,
    meaning: "المنافقون",
  },
  {
    id: 64,
    name: "التغابن",
    nameEn: "At-Taghabun",
    revelation: "مدنية",
    ayahCount: 18,
    juz: 28,
    meaning: "التغابن",
  },
  {
    id: 65,
    name: "الطلاق",
    nameEn: "At-Talaq",
    revelation: "مدنية",
    ayahCount: 12,
    juz: 28,
    meaning: "الطلاق",
  },
  {
    id: 66,
    name: "التحريم",
    nameEn: "At-Tahrim",
    revelation: "مدنية",
    ayahCount: 12,
    juz: 28,
    meaning: "التحريم",
  },
  {
    id: 67,
    name: "الملك",
    nameEn: "Al-Mulk",
    revelation: "مكية",
    ayahCount: 30,
    juz: 29,
    meaning: "المانعة",
  },
  {
    id: 68,
    name: "القلم",
    nameEn: "Al-Qalam",
    revelation: "مكية",
    ayahCount: 52,
    juz: 29,
    meaning: "ن",
  },
  {
    id: 69,
    name: "الحاقة",
    nameEn: "Al-Haaqqa",
    revelation: "مكية",
    ayahCount: 52,
    juz: 29,
    meaning: "الحاقة",
  },
  {
    id: 70,
    name: "المعارج",
    nameEn: "Al-Maarij",
    revelation: "مكية",
    ayahCount: 44,
    juz: 29,
    meaning: "المعارج",
  },
  {
    id: 71,
    name: "نوح",
    nameEn: "Nuh",
    revelation: "مكية",
    ayahCount: 28,
    juz: 29,
    meaning: "نبي الله نوح",
  },
  {
    id: 72,
    name: "الجن",
    nameEn: "Al-Jinn",
    revelation: "مكية",
    ayahCount: 28,
    juz: 29,
    meaning: "الجن",
  },
  {
    id: 73,
    name: "المزمل",
    nameEn: "Al-Muzzammil",
    revelation: "مكية",
    ayahCount: 20,
    juz: 29,
    meaning: "المزمل",
  },
  {
    id: 74,
    name: "المدثر",
    nameEn: "Al-Muddaththir",
    revelation: "مكية",
    ayahCount: 56,
    juz: 29,
    meaning: "المدثر",
  },
  {
    id: 75,
    name: "القيامة",
    nameEn: "Al-Qiyama",
    revelation: "مكية",
    ayahCount: 40,
    juz: 29,
    meaning: "القيامة",
  },
  {
    id: 76,
    name: "الإنسان",
    nameEn: "Al-Insan",
    revelation: "مدنية",
    ayahCount: 31,
    juz: 29,
    meaning: "الإنسان",
  },
  {
    id: 77,
    name: "المرسلات",
    nameEn: "Al-Mursalat",
    revelation: "مكية",
    ayahCount: 50,
    juz: 29,
    meaning: "المرسلات",
  },
  {
    id: 78,
    name: "النبأ",
    nameEn: "An-Naba",
    revelation: "مكية",
    ayahCount: 40,
    juz: 30,
    meaning: "النبأ العظيم",
  },
  {
    id: 79,
    name: "النازعات",
    nameEn: "An-Naziat",
    revelation: "مكية",
    ayahCount: 46,
    juz: 30,
    meaning: "النازعات",
  },
  {
    id: 80,
    name: "عبس",
    nameEn: "Abasa",
    revelation: "مكية",
    ayahCount: 42,
    juz: 30,
    meaning: "عبس",
  },
  {
    id: 81,
    name: "التكوير",
    nameEn: "At-Takwir",
    revelation: "مكية",
    ayahCount: 29,
    juz: 30,
    meaning: "التكوير",
  },
  {
    id: 82,
    name: "الانفطار",
    nameEn: "Al-Infitar",
    revelation: "مكية",
    ayahCount: 19,
    juz: 30,
    meaning: "الانفطار",
  },
  {
    id: 83,
    name: "المطففين",
    nameEn: "Al-Mutaffifin",
    revelation: "مكية",
    ayahCount: 36,
    juz: 30,
    meaning: "المطففين",
  },
  {
    id: 84,
    name: "الانشقاق",
    nameEn: "Al-Inshiqaq",
    revelation: "مكية",
    ayahCount: 25,
    juz: 30,
    meaning: "الانشقاق",
  },
  {
    id: 85,
    name: "البروج",
    nameEn: "Al-Buruj",
    revelation: "مكية",
    ayahCount: 22,
    juz: 30,
    meaning: "البروج",
  },
  {
    id: 86,
    name: "الطارق",
    nameEn: "At-Tariq",
    revelation: "مكية",
    ayahCount: 17,
    juz: 30,
    meaning: "الطارق",
  },
  {
    id: 87,
    name: "الأعلى",
    nameEn: "Al-Ala",
    revelation: "مكية",
    ayahCount: 19,
    juz: 30,
    meaning: "الأعلى",
  },
  {
    id: 88,
    name: "الغاشية",
    nameEn: "Al-Ghashiya",
    revelation: "مكية",
    ayahCount: 26,
    juz: 30,
    meaning: "الغاشية",
  },
  {
    id: 89,
    name: "الفجر",
    nameEn: "Al-Fajr",
    revelation: "مكية",
    ayahCount: 30,
    juz: 30,
    meaning: "الفجر",
  },
  {
    id: 90,
    name: "البلد",
    nameEn: "Al-Balad",
    revelation: "مكية",
    ayahCount: 20,
    juz: 30,
    meaning: "البلد",
  },
  {
    id: 91,
    name: "الشمس",
    nameEn: "Ash-Shams",
    revelation: "مكية",
    ayahCount: 15,
    juz: 30,
    meaning: "الشمس",
  },
  {
    id: 92,
    name: "الليل",
    nameEn: "Al-Layl",
    revelation: "مكية",
    ayahCount: 21,
    juz: 30,
    meaning: "الليل",
  },
  {
    id: 93,
    name: "الضحى",
    nameEn: "Ad-Duha",
    revelation: "مكية",
    ayahCount: 11,
    juz: 30,
    meaning: "الضحى",
  },
  {
    id: 94,
    name: "الشرح",
    nameEn: "Ash-Sharh",
    revelation: "مكية",
    ayahCount: 8,
    juz: 30,
    meaning: "ألم نشرح",
  },
  {
    id: 95,
    name: "التين",
    nameEn: "At-Tin",
    revelation: "مكية",
    ayahCount: 8,
    juz: 30,
    meaning: "التين",
  },
  {
    id: 96,
    name: "العلق",
    nameEn: "Al-Alaq",
    revelation: "مكية",
    ayahCount: 19,
    juz: 30,
    meaning: "اقرأ",
  },
  {
    id: 97,
    name: "القدر",
    nameEn: "Al-Qadr",
    revelation: "مكية",
    ayahCount: 5,
    juz: 30,
    meaning: "ليلة القدر",
  },
  {
    id: 98,
    name: "البينة",
    nameEn: "Al-Bayyina",
    revelation: "مدنية",
    ayahCount: 8,
    juz: 30,
    meaning: "البينة",
  },
  {
    id: 99,
    name: "الزلزلة",
    nameEn: "Az-Zalzala",
    revelation: "مدنية",
    ayahCount: 8,
    juz: 30,
    meaning: "الزلزلة",
  },
  {
    id: 100,
    name: "العاديات",
    nameEn: "Al-Adiyat",
    revelation: "مكية",
    ayahCount: 11,
    juz: 30,
    meaning: "العاديات",
  },
  {
    id: 101,
    name: "القارعة",
    nameEn: "Al-Qaria",
    revelation: "مكية",
    ayahCount: 11,
    juz: 30,
    meaning: "القارعة",
  },
  {
    id: 102,
    name: "التكاثر",
    nameEn: "At-Takathur",
    revelation: "مكية",
    ayahCount: 8,
    juz: 30,
    meaning: "التكاثر",
  },
  {
    id: 103,
    name: "العصر",
    nameEn: "Al-Asr",
    revelation: "مكية",
    ayahCount: 3,
    juz: 30,
    meaning: "العصر",
  },
  {
    id: 104,
    name: "الهمزة",
    nameEn: "Al-Humaza",
    revelation: "مكية",
    ayahCount: 9,
    juz: 30,
    meaning: "الهمزة",
  },
  {
    id: 105,
    name: "الفيل",
    nameEn: "Al-Fil",
    revelation: "مكية",
    ayahCount: 5,
    juz: 30,
    meaning: "الفيل",
  },
  {
    id: 106,
    name: "قريش",
    nameEn: "Quraysh",
    revelation: "مكية",
    ayahCount: 4,
    juz: 30,
    meaning: "قريش",
  },
  {
    id: 107,
    name: "الماعون",
    nameEn: "Al-Maun",
    revelation: "مكية",
    ayahCount: 7,
    juz: 30,
    meaning: "الماعون",
  },
  {
    id: 108,
    name: "الكوثر",
    nameEn: "Al-Kawthar",
    revelation: "مكية",
    ayahCount: 3,
    juz: 30,
    meaning: "نهر الجنة",
  },
  {
    id: 109,
    name: "الكافرون",
    nameEn: "Al-Kafirun",
    revelation: "مكية",
    ayahCount: 6,
    juz: 30,
    meaning: "الكافرون",
  },
  {
    id: 110,
    name: "النصر",
    nameEn: "An-Nasr",
    revelation: "مدنية",
    ayahCount: 3,
    juz: 30,
    meaning: "نصر الله",
  },
  {
    id: 111,
    name: "المسد",
    nameEn: "Al-Masad",
    revelation: "مكية",
    ayahCount: 5,
    juz: 30,
    meaning: "أبو لهب",
  },
  {
    id: 112,
    name: "الإخلاص",
    nameEn: "Al-Ikhlas",
    revelation: "مكية",
    ayahCount: 4,
    juz: 30,
    meaning: "ثلث القرآن",
  },
  {
    id: 113,
    name: "الفلق",
    nameEn: "Al-Falaq",
    revelation: "مكية",
    ayahCount: 5,
    juz: 30,
    meaning: "المعوذتان",
  },
  {
    id: 114,
    name: "الناس",
    nameEn: "An-Nas",
    revelation: "مكية",
    ayahCount: 6,
    juz: 30,
    meaning: "المعوذتان",
  },
];

const DAILY_AYAHS: DailyAyah[] = [
  {
    arabic: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    surah: "الإسراء",
    ayahNum: 9,
    tafsir:
      "إن القرآن الكريم يرشد الناس إلى أعدل الطرق وأقومها وأصوبها في الاعتقاد والعمل والسلوك — فهو دستور الحياة الكاملة.",
    memorize: "احفظ هذه الآية اليوم وكررها ٣ مرات",
  },
  {
    arabic:
      "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ",
    surah: "الإسراء",
    ayahNum: 82,
    tafsir:
      "القرآن شفاء للقلوب من الشك والنفاق، وشفاء للأجساد بالرقية، ورحمة لمن آمن به وعمل بأحكامه.",
    memorize: "رددها عند قراءة القرآن",
  },
  {
    arabic: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
    surah: "ص",
    ayahNum: 29,
    tafsir:
      "أنزلنا هذا القرآن المبارك ليتأمل الناس آياته ويفهموا معانيها — والغاية الكبرى من الإنزال هي التدبر لا مجرد التلاوة.",
    memorize: "تأمل آية من القرآن اليوم",
  },
  {
    arabic:
      "أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ ۚ وَلَوْ كَانَ مِنْ عِندِ غَيْرِ اللَّهِ لَوَجَدُوا فِيهِ اخْتِلَافًا كَثِيرًا",
    surah: "النساء",
    ayahNum: 82,
    tafsir:
      "ألا يتأملون القرآن تأملاً عميقاً؟ لو كان من عند غير الله لوجدوا فيه تناقضات كثيرة — لكنه كلام الله فهو محكم متسق.",
    memorize: "هذه الآية دليل الإعجاز",
  },
];

const MIRACLES: QuranMiracle[] = [
  {
    id: 1,
    title: "إعجاز عددي مذهل",
    icon: "🔢",
    category: "عددي",
    description: "تكررت كلمة «يوم» في القرآن ٣٦٥ مرة — عدد أيام السنة",
    detail:
      "الدنيا والآخرة ١١٥ مرة لكلٍّ منهما • الملائكة والشياطين ٨٨ مرة • الحياة والموت ١٤٥ مرة — توازن مستحيل في أي كتاب بشري",
    color: "from-violet-600/20 to-purple-400/5",
  },
  {
    id: 2,
    title: "إعجاز علمي كوني",
    icon: "🌌",
    category: "علمي",
    description: "وصف القرآن توسع الكون قبل ١٤٠٠ سنة من اكتشافه",
    detail:
      "﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾ — الذاريات: ٤٧. اكتشف العلماء عام ١٩٢٩ أن الكون يتوسع. القرآن أخبرنا بهذا قبل ١٤ قرناً.",
    color: "from-blue-600/20 to-sky-400/5",
  },
  {
    id: 3,
    title: "إعجاز بيولوجي دقيق",
    icon: "🧬",
    category: "علمي",
    description: "وصف مراحل خلق الجنين بدقة لم يعرفها العلم إلا حديثاً",
    detail:
      "﴿وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ﴾ — ثم العلقة والمضغة والعظام. قال الدكتور كيث مور: «لم يكن ممكناً وصف هذا بدون مجهر متطور».",
    color: "from-emerald-600/20 to-teal-400/5",
  },
  {
    id: 4,
    title: "إعجاز بحري أسرار",
    icon: "🌊",
    category: "علمي",
    description: "ذكر وجود حواجز بين البحار اكتُشفت حديثاً",
    detail:
      "﴿مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ * بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ﴾ — الرحمن. اكتشف العلماء وجود حواجز سطحية وعمقية تفصل البحار. الإنسان لم يعرف ذلك إلا بعد اختراع الغواصات.",
    color: "from-cyan-600/20 to-blue-400/5",
  },
  {
    id: 5,
    title: "الإعجاز اللغوي الفريد",
    icon: "📖",
    category: "لغوي",
    description: "تحدى القرآن البشر أن يأتوا بمثله منذ ١٤ قرناً — والتحدي قائم",
    detail:
      "﴿قُل لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ﴾. بعد ١٤ قرناً من الزمن ولم يستطع أحد — لا شعراء العرب ولا أدباء العالم.",
    color: "from-amber-600/20 to-yellow-400/5",
  },
  {
    id: 6,
    title: "حفظ إلهي ضامن",
    icon: "🛡️",
    category: "تاريخي",
    description: "الوحيد في التاريخ المحفوظ حرفاً بحرف منذ نزوله",
    detail:
      "﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ — الحجر: ٩. أكثر من مليار مسلم يحفظونه عن ظهر قلب. أي تحريف في أي نسخة يُكتشف فوراً من قِبل الحافظين.",
    color: "from-rose-600/20 to-pink-400/5",
  },
];

const SCIENCES: QuranScience[] = [
  {
    id: 1,
    title: "علم التفسير",
    icon: "📚",
    description: "شرح معاني القرآن وبيان مراد الله من كلامه",
    gradient: "from-emerald-500/15 to-teal-400/5",
    border: "border-emerald-400/30",
    route: "/quran/tafsir",
  },
  {
    id: 2,
    title: "علم التجويد",
    icon: "🎙️",
    description: "إتقان النطق وأحكام تلاوة القرآن الكريم",
    gradient: "from-blue-500/15 to-sky-400/5",
    border: "border-blue-400/30",
    route: "/quran/tajweed",
  },
  {
    id: 3,
    title: "علم أسباب النزول",
    icon: "⚡",
    description: "القصص والأحداث التي نزلت فيها الآيات الكريمة",
    gradient: "from-amber-500/15 to-yellow-400/5",
    border: "border-amber-400/30",
    route: "/quran/asbab",
  },
  {
    id: 4,
    title: "علم الناسخ والمنسوخ",
    icon: "🔄",
    description: "فهم تطور الأحكام الشرعية في القرآن الكريم",
    gradient: "from-violet-500/15 to-purple-400/5",
    border: "border-violet-400/30",
    route: "/quran/naskh",
  },
  {
    id: 5,
    title: "علم القراءات",
    icon: "🌐",
    description: "الروايات والقراءات المتواترة للقرآن الكريم",
    gradient: "from-rose-500/15 to-pink-400/5",
    border: "border-rose-400/30",
    route: "/quran/qiraat",
  },
  {
    id: 6,
    title: "إعجاز القرآن",
    icon: "✨",
    description: "الوجوه الإعجازية العلمية والأدبية والتشريعية",
    gradient: "from-cyan-500/15 to-blue-400/5",
    border: "border-cyan-400/30",
    route: "/quran/miracles",
  },
];

const VIRTUES = [
  { icon: "👑", text: "خيركم من تعلّم القرآن وعلّمه", source: "البخاري" },
  {
    icon: "🌟",
    text: "الماهر بالقرآن مع السفرة الكرام البررة",
    source: "مسلم",
  },
  {
    icon: "💎",
    text: "اقرأ القرآن فإنه يأتي شفيعاً لأصحابه يوم القيامة",
    source: "مسلم",
  },
  {
    icon: "🔥",
    text: "من قرأ حرفاً من كتاب الله فله حسنة والحسنة بعشر أمثالها",
    source: "الترمذي",
  },
  {
    icon: "🏠",
    text: "البيت الذي يُقرأ فيه القرآن يتسع على أهله وتحضره الملائكة",
    source: "أحمد",
  },
  {
    icon: "💫",
    text: "يُقال لصاحب القرآن اقرأ وارتقِ ورتّل كما كنت ترتّل في الدنيا",
    source: "أبو داود",
  },
];

// ─── Surah Reader Sheet ───────────────────────────────────────────────────────

interface AlQuranAyah {
  numberInSurah: number;
  text: string;
}

interface AlQuranResponse {
  code: number;
  data: {
    name: string;
    englishName: string;
    numberOfAyahs: number;
    ayahs: AlQuranAyah[];
  };
}

// ─── Mushaf Inline Display ────────────────────────────────────────────────────

function MushafDisplay({
  surahId,
  ayahs,
  reciterId,
}: {
  surahId: number;
  ayahs: AlQuranAyah[];
  reciterId: string;
}) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const preloadedIdxRef = useRef<number | null>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Ref holding latest playIdx to avoid stale closures inside onended
  const playIdxRef = useRef<(idx: number) => void>(() => {});

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.src = "";
    }
    if (preloadRef.current) {
      preloadRef.current.pause();
      preloadRef.current.src = "";
    }
    preloadedIdxRef.current = null;
    setPlayingIdx(null);
    setIsPlaying(false);
    if (activeQuranAudio) activeQuranAudio = null;
  }, []);

  const preloadIdx = useCallback(
    (idx: number) => {
      const ayah = ayahs[idx];
      if (!ayah) return;
      if (!preloadRef.current) preloadRef.current = new Audio();
      const pre = preloadRef.current;
      // Cancel any previous preload
      pre.pause();
      pre.onended = null;
      // preload="auto" tells the browser to download the full file, not just metadata
      pre.preload = "auto";
      pre.src = cdnAudioUrl(surahId, ayah.numberInSurah, reciterId);
      pre.load();
      preloadedIdxRef.current = idx;
      // Warm up the audio pipeline: start silent playback then pause immediately.
      // This primes the OS audio stack so switching to this element is instant.
      pre.volume = 0;
      pre
        .play()
        .then(() => {
          pre.pause();
          pre.currentTime = 0;
          pre.volume = 1;
        })
        .catch(() => {
          pre.volume = 1;
        }); // Ignore autoplay errors
    },
    [ayahs, surahId, reciterId],
  );

  const playIdx = useCallback(
    (idx: number) => {
      const ayah = ayahs[idx];
      if (!ayah) return;

      // If this verse was preloaded, swap it in — it's already buffered and warmed up
      if (
        preloadedIdxRef.current === idx &&
        preloadRef.current &&
        preloadRef.current.src
      ) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.onended = null;
        }
        const pre = preloadRef.current;
        pre.volume = 1;
        pre.currentTime = 0;
        audioRef.current = pre;
        preloadRef.current = new Audio();
        preloadedIdxRef.current = null;
      } else {
        // No preload ready — load fresh
        if (!audioRef.current) audioRef.current = new Audio();
        const audio = audioRef.current;
        audio.pause();
        audio.onended = null;
        audio.src = cdnAudioUrl(surahId, ayah.numberInSurah, reciterId);
        audio.load();
      }

      const audio = audioRef.current;
      audio.play().catch(() => {});
      activeQuranAudio = { element: audio, stop: stopAudio };
      setPlayingIdx(idx);
      setIsPlaying(true);
      spanRefs.current[idx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Preload the next verse immediately
      const next = idx + 1;
      if (next < ayahs.length) preloadIdx(next);

      // Use playIdxRef so onended always calls the latest version of playIdx
      audio.onended = () => {
        if (next < ayahs.length) {
          playIdxRef.current(next);
        } else {
          setPlayingIdx(null);
          setIsPlaying(false);
        }
      };
    },
    [ayahs, surahId, reciterId, stopAudio, preloadIdx],
  );

  // Keep the ref in sync with the latest playIdx
  useEffect(() => {
    playIdxRef.current = playIdx;
  }, [playIdx]);

  const handleAyahTap = (idx: number) => {
    if (playingIdx === idx && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      activeQuranAudio = null;
    } else {
      playIdx(idx);
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  return (
    <div className="px-5 py-5">
      {/* Controls row */}
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderColor: "rgba(200,168,75,0.12)" }}
      >
        <button
          onClick={() =>
            isPlaying
              ? (audioRef.current?.pause(), setIsPlaying(false))
              : playingIdx !== null
                ? (audioRef.current?.play(), setIsPlaying(true))
                : playIdx(0)
          }
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          style={{
            background: "rgba(200,168,75,0.12)",
            border: "1px solid rgba(200,168,75,0.25)",
            color: "#c8a84b",
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          {isPlaying ? "إيقاف" : playingIdx !== null ? "متابعة" : "تشغيل الكل"}
        </button>
        {playingIdx !== null && (
          <button
            onClick={stopAudio}
            className="text-[11px] text-muted-foreground px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X size={13} />
          </button>
        )}
        <p className="text-[11px] text-muted-foreground">
          اضغط على أي آية للاستماع
        </p>
      </div>

      {/* Continuous mushaf text */}
      <p
        className="leading-[3] text-right"
        style={{
          fontFamily:
            "'Amiri Quran', 'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', serif",
          fontSize: 21,
          direction: "rtl",
          textAlign: "justify",
          color: "var(--foreground)",
          wordSpacing: "0.05em",
        }}
        dir="rtl"
      >
        {ayahs.map((ayah, idx) => (
          <span key={ayah.numberInSurah}>
            <span
              ref={(el) => {
                spanRefs.current[idx] = el;
              }}
              onClick={() => handleAyahTap(idx)}
              className="cursor-pointer rounded transition-all"
              style={{
                background:
                  playingIdx === idx ? "rgba(200,168,75,0.22)" : "transparent",
                color: playingIdx === idx ? "#c8a84b" : "inherit",
                boxShadow:
                  playingIdx === idx
                    ? "0 0 0 2px rgba(200,168,75,0.2)"
                    : "none",
                borderRadius: 6,
                padding: "1px 2px",
              }}
            >
              {ayah.text}
            </span>{" "}
            <span
              className="inline-flex items-center justify-center"
              style={{
                fontFamily: "'Amiri Quran', serif",
                fontSize: 15,
                color: playingIdx === idx ? "#c8a84b" : "rgba(200,168,75,0.75)",
                letterSpacing: 0,
              }}
            >
              ﴿{toEasternArabic(ayah.numberInSurah)}﴾
            </span>{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

function SurahReaderSheet({
  surah,
  onClose,
}: {
  surah: Surah;
  onClose: () => void;
}) {
  const { quranReciterId, setQuranReciterId } = useSettings();
  const [ayahs, setAyahs] = useState<AlQuranAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setAyahs([]);
    fetch(`${getApiBase()}/quran/surah/${surah.id}`)
      .then((r) => r.json())
      .then((data: AlQuranResponse) => {
        if (data.code === 200 && data.data?.ayahs) {
          setAyahs(data.data.ayahs);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [surah.id]);

  // Stop all audio when closing
  useEffect(() => {
    return () => {
      if (activeQuranAudio) {
        activeQuranAudio.stop();
        activeQuranAudio = null;
      }
    };
  }, []);

  const currentReciter = QURAN_RECITERS.find((r) => r.id === quranReciterId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "rgba(200,168,75,0.15)" }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
          <div className="text-center">
            <p
              className="font-bold text-base"
              style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}
            >
              سورة {surah.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {surah.ayahCount} آية · {surah.revelation} · الجزء {surah.juz}
            </p>
          </div>
          <button
            onClick={() => setShowReciterPicker((s) => !s)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors"
            style={{
              background: "rgba(200,168,75,0.1)",
              border: "1px solid rgba(200,168,75,0.25)",
            }}
          >
            <Volume2 size={12} style={{ color: "#c8a84b" }} />
            <span
              className="text-[10px] font-bold"
              style={{ color: "#c8a84b" }}
            >
              {currentReciter?.nameAr.split(" ")[0]}
            </span>
          </button>
        </div>

        {/* Reciter Picker */}
        <AnimatePresence>
          {showReciterPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden shrink-0 border-b"
              style={{ borderColor: "rgba(200,168,75,0.1)" }}
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {QURAN_RECITERS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setQuranReciterId(r.id);
                      setShowReciterPicker(false);
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-colors"
                    style={{
                      background:
                        quranReciterId === r.id
                          ? "rgba(200,168,75,0.15)"
                          : "transparent",
                      border:
                        quranReciterId === r.id
                          ? "1px solid rgba(200,168,75,0.3)"
                          : "1px solid transparent",
                    }}
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {r.nameAr}
                    </span>
                    {quranReciterId === r.id && (
                      <Check size={13} style={{ color: "#c8a84b" }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bismillah */}
        {surah.id !== 1 && surah.id !== 9 && (
          <div
            className="px-5 py-4 text-center border-b shrink-0"
            style={{ borderColor: "rgba(200,168,75,0.1)" }}
          >
            <p
              style={{
                fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                fontSize: 20,
                color: "rgba(200,168,75,0.9)",
              }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {/* Ayahs content */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2
                size={28}
                className="animate-spin"
                style={{ color: "#c8a84b" }}
              />
              <p className="text-sm text-muted-foreground">
                جارٍ تحميل السورة...
              </p>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-muted-foreground">
                تعذّر التحميل — تحقق من اتصالك
              </p>
            </div>
          )}
          {!loading && !error && ayahs.length > 0 && (
            <MushafDisplay
              surahId={surah.id}
              ayahs={ayahs}
              reciterId={quranReciterId}
            />
          )}
          <div className="h-8 mt-[45px] mb-[45px]" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuranHero() {
  const [activeAyahIdx, setActiveAyahIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveAyahIdx((i) => (i + 1) % 4), 6000);
    return () => clearInterval(t);
  }, []);

  const ayahs = [
    {
      text: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
      ref: "الإسراء: ٩",
    },
    {
      text: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ",
      ref: "الإسراء: ٨٢",
    },
    {
      text: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
      ref: "ص: ٢٩",
    },
    {
      text: "لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا",
      ref: "الحشر: ٢١",
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] mx-0"
      style={{
        background:
          "linear-gradient(160deg, #040d18 0%, #071428 40%, #030b15 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Particle stars */}
      {[
        [12, 8],
        [88, 5],
        [35, 15],
        [65, 7],
        [90, 18],
        [20, 22],
        [75, 12],
        [50, 4],
        [42, 20],
        [80, 24],
        [15, 28],
        [58, 10],
        [30, 3],
        [70, 26],
        [95, 8],
        [5, 18],
      ].map(([x, y], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: i % 4 === 0 ? 2.5 : 1.5,
            height: i % 4 === 0 ? 2.5 : 1.5,
            background:
              i % 3 === 0 ? "#c8a84b" : i % 3 === 1 ? "#7dd3fc" : "#ffffff",
          }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: 2.5 + (i % 5) * 0.8,
            repeat: Infinity,
            delay: (i * 0.35) % 4,
          }}
        />
      ))}
      {/* Top glow */}
      <div
        className="absolute inset-x-0 top-0 h-[180px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(200,168,75,0.22) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div className="relative z-10 px-5 pt-7 pb-6">
        {/* Arabic calligraphy icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(200,168,75,0.25) 0%, rgba(200,168,75,0.08) 100%)",
              border: "1px solid rgba(200,168,75,0.4)",
              boxShadow: "0 0 30px rgba(200,168,75,0.2)",
            }}
          >
            <span style={{ fontSize: 32 }}>📖</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center font-bold leading-tight mb-[16px] pt-[11px] pb-[11px]"
          style={{
            fontSize: 28,
            background:
              "linear-gradient(180deg, #ffffff 0%, #c8a84b 60%, #a07c2a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "'Amiri Quran', serif",
          }}
        >
          القرآن الكريم
        </h1>
        <p
          className="text-center text-[11px] mb-5"
          style={{ color: "rgba(200,168,75,0.6)" }}
        >
          مكتبة القرآن الشاملة — تلاوة · تفسير · علوم · إعجاز
        </p>

        {/* Rotating ayah */}
        <div
          className="rounded-2xl px-4 py-4 mb-5"
          style={{
            background: "rgba(200,168,75,0.07)",
            border: "1px solid rgba(200,168,75,0.2)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAyahIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <p
                className="text-center leading-loose mb-2"
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "'Amiri Quran', serif",
                  fontSize: 16,
                }}
              >
                ﴿{ayahs[activeAyahIdx]!.text}﴾
              </p>
              <p
                className="text-center text-[11px]"
                style={{ color: "rgba(200,168,75,0.7)" }}
              >
                — {ayahs[activeAyahIdx]!.ref}
              </p>
            </motion.div>
          </AnimatePresence>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {ayahs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveAyahIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === activeAyahIdx ? 20 : 6,
                  height: 6,
                  background:
                    i === activeAyahIdx ? "#c8a84b" : "rgba(200,168,75,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: "١١٤", label: "سورة" },
            { num: "٦٢٣٦", label: "آية" },
            { num: "٣٠", label: "جزءاً" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-2.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="font-bold"
                style={{
                  fontSize: 18,
                  color: "#c8a84b",
                  fontFamily: "'Amiri Quran', serif",
                }}
              >
                {s.num}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Daily Ayah Card ──────────────────────────────────────────────────────────

function DailyAyahCard() {
  const todayIdx = new Date().getDate() % DAILY_AYAHS.length;
  const ayah = DAILY_AYAHS[todayIdx]!;
  const [showTafsir, setShowTafsir] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-[22px] overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.04) 100%)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Sun size={13} className="text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-emerald-600">آية اليوم</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSaved((s) => !s)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: saved ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.05)",
            }}
          >
            <Bookmark
              size={13}
              className={saved ? "text-emerald-500" : "text-muted-foreground"}
            />
          </button>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <Share2 size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="px-4 py-4">
        {/* Arabic */}
        <p
          className="text-center leading-[2.2] mb-3 text-foreground"
          style={{
            fontFamily: "'Amiri Quran', serif",
            fontSize: 18,
          }}
        >
          ﴿{ayah.arabic}﴾
        </p>

        {/* Source */}
        <p className="text-center text-[11px] text-emerald-500/70 mb-3 font-semibold">
          سورة {ayah.surah} — الآية {ayah.ayahNum}
        </p>

        {/* Tafsir toggle */}
        <button
          onClick={() => setShowTafsir((s) => !s)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-colors"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
        >
          <BookOpen size={13} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-emerald-600">
            {showTafsir ? "إخفاء التفسير" : "اقرأ التفسير"}
          </span>
          {showTafsir ? (
            <ChevronUp size={13} className="text-emerald-500" />
          ) : (
            <ChevronDown size={13} className="text-emerald-500" />
          )}
        </button>

        <AnimatePresence>
          {showTafsir && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 p-3 rounded-xl"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.12)",
                }}
              >
                <p className="text-[12px] leading-loose text-foreground/80 text-right">
                  {ayah.tafsir}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2 px-1">
                <Zap size={11} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-600 font-semibold">
                  {ayah.memorize}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Surah Browser ────────────────────────────────────────────────────────────

function SurahBrowser({ onSelect }: { onSelect: (s: Surah) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"الكل" | "مكية" | "مدنية">("الكل");
  const [expanded, setExpanded] = useState(false);

  const filtered = SURAHS.filter((s) => {
    const matchFilter = filter === "الكل" || s.revelation === filter;
    const matchQuery =
      !query ||
      s.name.includes(query) ||
      s.nameEn.toLowerCase().includes(query.toLowerCase()) ||
      s.meaning.includes(query);
    return matchFilter && matchQuery;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 12);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setExpanded(true);
            }}
            placeholder="ابحث عن سورة..."
            className="w-full h-9 pr-9 pl-3 rounded-xl text-sm bg-card border border-border/60 focus:outline-none focus:border-primary/50 text-right"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1">
          {(["الكل", "مكية", "مدنية"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background:
                  filter === f
                    ? "rgba(200,168,75,0.2)"
                    : "rgba(255,255,255,0.05)",
                color: filter === f ? "#c8a84b" : "rgba(255,255,255,0.5)",
                border:
                  filter === f
                    ? "1px solid rgba(200,168,75,0.35)"
                    : "1px solid transparent",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence>
          {displayed.map((surah, i) => (
            <motion.div
              key={surah.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => onSelect(surah)}
                className="w-full text-right flex flex-col gap-1 p-3 rounded-xl border border-border/40 bg-card hover:border-amber-400/40 active:scale-[0.97] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: "rgba(200,168,75,0.15)",
                      color: "#c8a84b",
                    }}
                  >
                    {surah.id}
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                    style={{
                      background:
                        surah.revelation === "مكية"
                          ? "rgba(139,92,246,0.15)"
                          : "rgba(16,185,129,0.15)",
                      color:
                        surah.revelation === "مكية" ? "#7c3aed" : "#059669",
                    }}
                  >
                    {surah.revelation}
                  </span>
                </div>
                <p className="font-bold text-sm leading-tight">{surah.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {surah.ayahCount} آية · ج{surah.juz}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Play size={9} style={{ color: "#c8a84b" }} />
                  <span
                    className="text-[9px]"
                    style={{ color: "rgba(200,168,75,0.6)" }}
                  >
                    استمع وتلاوة
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center gap-2"
          style={{
            background: "rgba(200,168,75,0.08)",
            border: "1px solid rgba(200,168,75,0.2)",
            color: "#c8a84b",
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              <span>عرض أقل</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>عرض كل السور ({filtered.length})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Miracles Section ─────────────────────────────────────────────────────────

function MiraclesSection() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { theme } = useSettings();
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col gap-3">
      {MIRACLES.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl overflow-hidden cursor-pointer"
          style={{
            background: `linear-gradient(145deg, ${m.color})`,
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
          }}
          onClick={() => setExpanded(expanded === m.id ? null : m.id)}
        >
          <div className="flex items-center gap-3 p-3.5">
            <span className="text-[22px] shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                    color: isDark
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(0,0,0,0.55)",
                  }}
                >
                  {m.category}
                </span>
              </div>
              <p className="font-bold text-sm leading-tight">{m.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {m.description}
              </p>
            </div>
            <motion.div animate={{ rotate: expanded === m.id ? 180 : 0 }}>
              <ChevronDown
                size={16}
                className="text-muted-foreground shrink-0"
              />
            </motion.div>
          </div>

          <AnimatePresence>
            {expanded === m.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className="mx-3 mb-3 p-3 rounded-xl"
                  style={{
                    background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <p className="text-[12px] leading-loose text-right text-foreground/80">
                    {m.detail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Sciences Grid ────────────────────────────────────────────────────────────

function SciencesGrid() {
  const hasRoute = (route: string) =>
    ["/quran/tafsir", "/quran/miracles"].includes(route);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {SCIENCES.map((s, i) => {
        const active = hasRoute(s.route);
        const inner = (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl p-4 bg-gradient-to-br ${s.gradient} border ${s.border} active:scale-[0.96] transition-all cursor-pointer`}
          >
            <span className="text-[24px] mb-2 block">{s.icon}</span>
            <p className="font-bold text-sm leading-tight mb-1">{s.title}</p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {s.description}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {active ? (
                <span
                  className="text-[9px] font-bold"
                  style={{ color: "#22c55e" }}
                >
                  مفعّل ✓
                </span>
              ) : (
                <>
                  <span className="text-[9px] font-bold text-foreground/35">
                    قريباً
                  </span>
                  <Sparkles size={9} className="text-foreground/30" />
                </>
              )}
            </div>
          </motion.div>
        );
        return active ? (
          <Link key={s.id} href={s.route}>
            {inner}
          </Link>
        ) : (
          <div key={s.id}>{inner}</div>
        );
      })}
    </div>
  );
}

// ─── Virtues Section ──────────────────────────────────────────────────────────

function VirtuesSection() {
  return (
    <div className="flex flex-col gap-2">
      {VIRTUES.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-start gap-3 p-3.5 rounded-xl"
          style={{
            background: "rgba(200,168,75,0.06)",
            border: "1px solid rgba(200,168,75,0.15)",
          }}
        >
          <span className="text-[20px] shrink-0 leading-none mt-0.5">
            {v.icon}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-relaxed text-right">
              «{v.text}»
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: "rgba(200,168,75,0.65)" }}
            >
              رواه {v.source}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Reading Tracker ──────────────────────────────────────────────────────────

// Surah start pages in the standard 604-page Uthmani Mushaf
const SURAH_PAGE_MAP: [number, string][] = [
  [1,"الفاتحة"],[2,"البقرة"],[50,"آل عمران"],[77,"النساء"],[106,"المائدة"],
  [128,"الأنعام"],[151,"الأعراف"],[177,"الأنفال"],[187,"التوبة"],[208,"يونس"],
  [221,"هود"],[235,"يوسف"],[249,"الرعد"],[255,"إبراهيم"],[262,"الحجر"],
  [267,"النحل"],[282,"الإسراء"],[293,"الكهف"],[305,"مريم"],[312,"طه"],
  [322,"الأنبياء"],[333,"الحج"],[342,"المؤمنون"],[350,"النور"],[359,"الفرقان"],
  [367,"الشعراء"],[377,"النمل"],[385,"القصص"],[396,"العنكبوت"],[404,"الروم"],
  [411,"لقمان"],[415,"السجدة"],[418,"الأحزاب"],[428,"سبأ"],[434,"فاطر"],
  [440,"يس"],[446,"الصافات"],[453,"ص"],[458,"الزمر"],[467,"غافر"],
  [477,"فصلت"],[483,"الشورى"],[489,"الزخرف"],[496,"الدخان"],[499,"الجاثية"],
  [502,"الأحقاف"],[507,"محمد"],[511,"الفتح"],[515,"الحجرات"],[518,"ق"],
  [520,"الذاريات"],[523,"الطور"],[526,"النجم"],[528,"القمر"],[531,"الرحمن"],
  [534,"الواقعة"],[537,"الحديد"],[542,"المجادلة"],[545,"الحشر"],[549,"الممتحنة"],
  [551,"الصف"],[553,"الجمعة"],[554,"المنافقون"],[556,"التغابن"],[558,"الطلاق"],
  [560,"التحريم"],[562,"الملك"],[564,"القلم"],[566,"الحاقة"],[568,"المعارج"],
  [570,"نوح"],[572,"الجن"],[574,"المزمل"],[575,"المدثر"],[577,"القيامة"],
  [578,"الإنسان"],[580,"المرسلات"],[582,"النبأ"],[583,"النازعات"],[585,"عبس"],
  [586,"التكوير"],[587,"الانفطار"],[587,"المطففين"],[589,"الانشقاق"],[590,"البروج"],
  [591,"الطارق"],[591,"الأعلى"],[592,"الغاشية"],[593,"الفجر"],[594,"البلد"],
  [595,"الشمس"],[595,"الليل"],[596,"الضحى"],[596,"الشرح"],[597,"التين"],
  [597,"العلق"],[598,"القدر"],[598,"البينة"],[599,"الزلزلة"],[599,"العاديات"],
  [600,"القارعة"],[600,"التكاثر"],[601,"العصر"],[601,"الهمزة"],[601,"الفيل"],
  [602,"قريش"],[602,"الماعون"],[602,"الكوثر"],[603,"الكافرون"],[603,"النصر"],
  [603,"المسد"],[604,"الإخلاص"],[604,"الفلق"],[604,"الناس"],
];

function getSurahForPage(page: number): string {
  let result = "الفاتحة";
  for (const [startPage, name] of SURAH_PAGE_MAP) {
    if (page >= startPage) result = name;
    else break;
  }
  return result;
}

function todayDateStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

const WIRD_TARGET = 5;
const MUSHAF_PAGES = 604;

function ReadingTracker() {
  // Total pages ever completed (determines where today's wird starts)
  const [totalDone, setTotalDone] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("wird_total") ?? "0") || 0; } catch { return 0; }
  });

  // Streak: consecutive days
  const [streak, setStreak] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("wird_streak") ?? "0") || 0; } catch { return 0; }
  });

  // Which of the 5 pages are checked today
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const savedDate = localStorage.getItem("wird_date");
      if (savedDate !== todayDateStr()) return Array(WIRD_TARGET).fill(false);
      const raw = localStorage.getItem("wird_checked");
      if (!raw) return Array(WIRD_TARGET).fill(false);
      const parsed = JSON.parse(raw) as boolean[];
      return Array.isArray(parsed) && parsed.length === WIRD_TARGET ? parsed : Array(WIRD_TARGET).fill(false);
    } catch { return Array(WIRD_TARGET).fill(false); }
  });

  // Whether today's completion was already counted
  const [completedToday, setCompletedToday] = useState<boolean>(() => {
    try { return localStorage.getItem("wird_completed_date") === todayDateStr(); } catch { return false; }
  });

  const [showCelebration, setShowCelebration] = useState(false);

  // Auto-reset on new day + streak update
  useEffect(() => {
    try {
      const savedDate = localStorage.getItem("wird_date");
      const today = todayDateStr();
      if (savedDate && savedDate !== today) {
        // It's a new day — check if previous day was completed
        const wasCompleted = localStorage.getItem("wird_completed_date") === savedDate;
        if (wasCompleted) {
          // Check consecutive: yesterday should be exactly 1 day before today
          const prevDate = new Date(savedDate);
          const todayDate = new Date(today);
          const diffDays = Math.round((todayDate.getTime() - prevDate.getTime()) / 86400000);
          const newStreak = diffDays === 1 ? streak + 1 : 1;
          setStreak(newStreak);
          localStorage.setItem("wird_streak", String(newStreak));
        } else {
          // Missed a day — reset streak
          setStreak(0);
          localStorage.setItem("wird_streak", "0");
        }
        // Reset today
        setChecked(Array(WIRD_TARGET).fill(false));
        setCompletedToday(false);
        localStorage.setItem("wird_date", today);
        localStorage.setItem("wird_checked", JSON.stringify(Array(WIRD_TARGET).fill(false)));
      } else if (!savedDate) {
        localStorage.setItem("wird_date", today);
      }
    } catch {}
  }, []);

  // Calculate which pages to read today
  // Start page cycles through the Mushaf
  const startPageIdx = totalDone % MUSHAF_PAGES; // 0-based
  const todayPages = Array.from({ length: WIRD_TARGET }, (_, i) =>
    ((startPageIdx + i) % MUSHAF_PAGES) + 1
  );

  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount >= WIRD_TARGET;
  const progress = (doneCount / WIRD_TARGET) * 100;

  // Khatma progress
  const khatmasDone = Math.floor(totalDone / MUSHAF_PAGES);
  const khatmaProgress = ((totalDone % MUSHAF_PAGES) / MUSHAF_PAGES) * 100;

  const togglePage = (idx: number) => {
    const next = [...checked];
    next[idx] = !next[idx];
    setChecked(next);
    try {
      localStorage.setItem("wird_checked", JSON.stringify(next));
      localStorage.setItem("wird_date", todayDateStr());
    } catch {}

    const newDoneCount = next.filter(Boolean).length;

    // If all 5 just completed and not yet counted today
    if (newDoneCount >= WIRD_TARGET && !completedToday) {
      const newTotal = totalDone + WIRD_TARGET;
      setTotalDone(newTotal);
      setCompletedToday(true);
      setShowCelebration(true);
      try {
        localStorage.setItem("wird_total", String(newTotal));
        localStorage.setItem("wird_completed_date", todayDateStr());
      } catch {}
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  const nextStartPage = ((totalDone + WIRD_TARGET) % MUSHAF_PAGES) + 1;

  return (
    <div
      className="rounded-[22px] overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(200,168,75,0.1) 0%, rgba(200,168,75,0.03) 100%)",
        border: "1px solid rgba(200,168,75,0.25)",
      }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-bold text-sm">ورد القرآن اليومي</h3>
            <p className="text-[11px] text-muted-foreground">
              {WIRD_TARGET} صفحات يومياً — من صفحة {todayPages[0]} إلى {todayPages[WIRD_TARGET - 1]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {khatmasDone > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                <span className="text-[10px] font-bold text-emerald-500">×{khatmasDone} ختمة</span>
              </div>
            )}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.25)" }}
            >
              <Flame size={12} style={{ color: "#c8a84b" }} />
              <span className="font-bold text-[13px]" style={{ color: "#c8a84b" }}>{streak}</span>
              <span className="text-[10px] text-muted-foreground">يوم</span>
            </div>
          </div>
        </div>

        {/* Surah context */}
        <p className="text-[11px] mb-3" style={{ color: "rgba(200,168,75,0.75)" }}>
          📖 سورة {getSurahForPage(todayPages[0]!)}
          {getSurahForPage(todayPages[WIRD_TARGET - 1]!) !== getSurahForPage(todayPages[0]!) &&
            ` — ${getSurahForPage(todayPages[WIRD_TARGET - 1]!)}`}
        </p>

        {/* Overall progress bar (khatma) */}
        <div className="mb-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>تقدم الختمة</span>
            <span>{totalDone} / {MUSHAF_PAGES} ص</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #c8a84b88, #c8a84b)" }}
              animate={{ width: `${khatmaProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ── Today's 5 pages ── */}
      <div className="px-4 pb-2">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
          <span>ورد اليوم</span>
          <span>{doneCount} / {WIRD_TARGET} صفحات</span>
        </div>

        {/* Daily progress bar */}
        <div className="h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #c8a84b, #f0d070)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* 5 page tiles */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {todayPages.map((pg, idx) => {
            const isDone = checked[idx] ?? false;
            return (
              <button
                key={idx}
                onClick={() => togglePage(idx)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-[0.93]"
                style={{
                  background: isDone
                    ? "linear-gradient(145deg, rgba(200,168,75,0.4), rgba(200,168,75,0.18))"
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isDone ? "rgba(200,168,75,0.6)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isDone ? "0 2px 10px rgba(200,168,75,0.15)" : "none",
                }}
              >
                {isDone ? (
                  <Check size={14} style={{ color: "#c8a84b" }} />
                ) : (
                  <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {pg}
                  </span>
                )}
                <span
                  className="text-[9px] font-medium leading-none"
                  style={{ color: isDone ? "#c8a84b" : "rgba(255,255,255,0.25)" }}
                >
                  {isDone ? "✓ قرأت" : `ص ${pg}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Open quran.com at current page */}
        <a
          href={`https://quran.com/${getSurahForPage(todayPages[0]!).replace(/\s/g, "-")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.97] mb-3"
          style={{
            background: allDone
              ? "rgba(16,185,129,0.12)"
              : "linear-gradient(135deg, rgba(200,168,75,0.22), rgba(200,168,75,0.1))",
            border: `1px solid ${allDone ? "rgba(16,185,129,0.35)" : "rgba(200,168,75,0.35)"}`,
            color: allDone ? "#10b981" : "#c8a84b",
          }}
        >
          {allDone ? (
            <><Check size={13} /> أتممت وردك! — ورد الغد: ص {nextStartPage}</>
          ) : (
            <><BookOpen size={13} /> افتح المصحف — ابدأ من صفحة {todayPages[0]}</>
          )}
        </a>
      </div>

      {/* ── Celebration ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mx-4 mb-4 py-3 px-4 rounded-2xl text-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <p className="text-sm font-bold text-emerald-400 mb-0.5">🎉 أتممت وردك اليوم!</p>
              <p className="text-[11px] text-muted-foreground">
                ورد الغد: صفحات {nextStartPage} — {((totalDone + WIRD_TARGET - 1) % MUSHAF_PAGES) + 1}
              </p>
              {khatmasDone > 0 && Math.floor((totalDone) / MUSHAF_PAGES) > Math.floor((totalDone - WIRD_TARGET) / MUSHAF_PAGES) && (
                <p className="text-[11px] font-bold text-amber-400 mt-1">✨ ألف مبروك — أتممت ختمة كاملة!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
  sub,
  accent = "#c8a84b",
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
      >
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div>
        <h2 className="font-bold text-base leading-tight">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    {
      icon: "🎙️",
      label: "استمع",
      sub: "تلاوة صوتية",
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
      border: "rgba(59,130,246,0.25)",
      href: "/quran/listen",
    },
    {
      icon: "📖",
      label: "اقرأ",
      sub: "مصحف كامل",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.25)",
      href: "/quran/read",
    },
    {
      icon: "💡",
      label: "تفسير",
      sub: "آية بآية",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
      border: "rgba(139,92,246,0.25)",
      href: "/quran/tafsir",
    },
    {
      icon: "🌙",
      label: "حفظ",
      sub: "مساعد الحفظ",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
      href: "/quran/memorize",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl active:scale-[0.95] transition-all"
          style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
          <span className="text-[22px] leading-none">{a.icon}</span>
          <span className="font-bold text-[12px]" style={{ color: a.color }}>
            {a.label}
          </span>
          <span className="text-[9px] text-muted-foreground text-center leading-tight">
            {a.sub}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranPage() {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const quranNavItems = [
    { icon: "📖", label: "القراءة", sub: "تصفح السور", href: "/quran/read" },
    { icon: "🔊", label: "الاستماع", sub: "مع ترتيل", href: "/quran/listen" },
    { icon: "🧠", label: "الحفظ", sub: "مساعد الحفظ", href: "/quran/memorize" },
    { icon: "💡", label: "التفسير", sub: "معاني الآيات", href: "/quran/tafsir" },
    { icon: "🤲", label: "التجويد", sub: "أحكام التجويد", href: "/quran/tajweed" },
    { icon: "🤖", label: "مساعد القرآن", sub: "الذكاء الاصطناعي", href: "/quran/ai" },
    { icon: "📅", label: "الختمات", sub: "ختمات تاريخية", href: "/quran/khatmat" },
    { icon: "👥", label: "الختمة الجماعية", sub: "مع أصدقائك", href: "/quran/khatma" },
    { icon: "🔥", label: "التحديات", sub: "تحدّ نفسك", href: "/quran/challenges" },
  ];

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <StandardHeader
        title="القرآن الكريم"
        subtitle="مكتبة شاملة"
        showBack
        right={
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all border border-primary/30"
            aria-label="قائمة القرآن"
          >
            <span>أقسام</span>
            <ChevronDown size={12} className={`transition-transform ${navOpen ? "rotate-180" : ""}`} />
          </button>
        }
      />

      {/* Quran nav sheet */}
      {navOpen && (
        <div
          className="mx-4 mb-2 mt-1 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
        >
          <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-border/40 rtl:divide-x-reverse">
            {quranNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
                className="flex flex-col items-center gap-1 px-2 py-3 text-center hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[11px] font-bold text-foreground leading-tight">{item.label}</span>
                <span className="text-[9px] text-muted-foreground leading-none">{item.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-6 pt-4">
        {/* Hero */}
        <QuranHero />

        {/* Quick Actions */}
        <div>
          <SectionTitle
            icon={<Zap size={16} />}
            title="ابدأ الآن"
            sub="تلاوة · بحث · حفظ · استماع"
          />
          <QuickActions />
        </div>

        {/* New Phase 3 & 4 Features */}
        <div>
          <SectionTitle
            icon={<Sparkles size={16} />}
            title="ميزات جديدة"
            sub="مجتمع · ذكاء · إبداع"
            accent="#8b5cf6"
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: "👥",
                label: "الختمة الجماعية",
                sub: "اختم مع أصدقائك",
                color: "#8b5cf6",
                bg: "rgba(139,92,246,0.1)",
                border: "rgba(139,92,246,0.2)",
                href: "/quran/khatma",
              },
              {
                icon: "🔥",
                label: "تحديات القرآن",
                sub: "تحدّ نفسك",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.1)",
                border: "rgba(245,158,11,0.2)",
                href: "/quran/challenges",
              },
              {
                icon: "🗺️",
                label: "خريطة القرآن",
                sub: "استكشف البنية",
                color: "#06b6d4",
                bg: "rgba(6,182,212,0.1)",
                border: "rgba(6,182,212,0.2)",
                href: "/quran/map",
              },
              {
                icon: "🤖",
                label: "مساعد القرآن",
                sub: "اسأل بالذكاء الاصطناعي",
                color: "#ec4899",
                bg: "rgba(236,72,153,0.1)",
                border: "rgba(236,72,153,0.2)",
                href: "/quran/ai",
              },
              {
                icon: "🎨",
                label: "بطاقات القرآن",
                sub: "أنشئ وشارك",
                color: "#22c55e",
                bg: "rgba(34,197,94,0.1)",
                border: "rgba(34,197,94,0.2)",
                href: "/quran/cards",
              },
              {
                icon: "📅",
                label: "الختمات التاريخية",
                sub: "رمضان · ذو الحجة",
                color: "#a855f7",
                bg: "rgba(168,85,247,0.1)",
                border: "rgba(168,85,247,0.2)",
                href: "/quran/khatmat",
              },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center gap-2.5 p-3 rounded-2xl active:scale-[0.97] transition-all"
                style={{ background: a.bg, border: `1px solid ${a.border}` }}
              >
                <span className="text-xl shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p
                    className="font-bold text-[12px] leading-tight"
                    style={{ color: a.color }}
                  >
                    {a.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Daily Ayah */}
        <div>
          <SectionTitle
            icon={<Sun size={16} />}
            title="آية اليوم"
            sub="مع التفسير الميسّر"
            accent="#10b981"
          />
          <DailyAyahCard />
        </div>

        {/* Reading Tracker */}
        <div>
          <SectionTitle
            icon={<BookMarked size={16} />}
            title="ورد القرآن"
            sub="تتبع قراءتك اليومية"
          />
          <ReadingTracker />
        </div>

        {/* Surah Browser */}
        <div>
          <SectionTitle
            icon={<BookOpen size={16} />}
            title="استعرض السور"
            sub="١١٤ سورة — انقر للقراءة والاستماع"
          />
          <SurahBrowser onSelect={setSelectedSurah} />
        </div>

        {/* Sciences */}
        <div>
          <SectionTitle
            icon={<Brain size={16} />}
            title="علوم القرآن"
            sub="رحلة في العلم القرآني"
            accent="#8b5cf6"
          />
          <SciencesGrid />
        </div>

        {/* Miracles */}
        <div>
          <SectionTitle
            icon={<Sparkles size={16} />}
            title="إعجاز القرآن"
            sub="حقائق تُذهل العقول"
            accent="#f59e0b"
          />
          <MiraclesSection />
        </div>

        {/* Virtues */}
        <div>
          <SectionTitle
            icon={<Star size={16} />}
            title="فضل القرآن"
            sub="أحاديث نبوية شريفة"
            accent="#c8a84b"
          />
          <VirtuesSection />
        </div>

        {/* Bottom CTA */}
        <div
          className="rounded-[22px] p-5 text-center"
          style={{
            background:
              "linear-gradient(145deg, rgba(200,168,75,0.12) 0%, rgba(200,168,75,0.04) 100%)",
            border: "1px solid rgba(200,168,75,0.25)",
          }}
        >
          <p
            className="text-[22px] font-bold mb-1 leading-relaxed"
            style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}
          >
            ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾
          </p>
          <p className="text-[11px] text-muted-foreground mb-4">المزمل: ٤</p>
          <a
            href="https://quran.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #c8a84b, #a07c2a)",
              color: "#1a0e00",
              boxShadow: "0 4px 16px rgba(200,168,75,0.35)",
            }}
          >
            <BookOpen size={15} />
            افتح مصحف quran.com
          </a>
        </div>
      </div>

      {/* ── In-App Surah Reader Sheet ── */}
      <AnimatePresence>
        {selectedSurah && (
          <SurahReaderSheet
            surah={selectedSurah}
            onClose={() => setSelectedSurah(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
