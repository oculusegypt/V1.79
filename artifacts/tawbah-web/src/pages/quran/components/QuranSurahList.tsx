import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";

const SURAH_LENGTHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const SURAH_NAMES = [
  { name: "الفاتحة", nameEn: "Al-Fatiha", meaning: "The Opening" },
  { name: "البقرة", nameEn: "Al-Baqarah", meaning: "The Cow" },
  { name: "آل عمران", nameEn: "Ali 'Imran", meaning: "The Family of Imran" },
  { name: "النساء", nameEn: "An-Nisa", meaning: "The Women" },
  { name: "المائدة", nameEn: "Al-Ma'idah", meaning: "The Table Spread" },
  { name: "الأنعام", nameEn: "Al-An'am", meaning: "The Cattle" },
  { name: "الأعراف", nameEn: "Al-A'raf", meaning: "The Heights" },
  { name: "الأنفال", nameEn: "Al-Anfal", meaning: "The Spoils of War" },
  { name: "التوبة", nameEn: "At-Tawbah", meaning: "The Repentance" },
  { name: "يونس", nameEn: "Yunus", meaning: "Jonah" },
  { name: "هود", nameEn: "Hud", meaning: "Hud" },
  { name: "يوسف", nameEn: "Yusuf", meaning: "Joseph" },
  { name: "الرعد", nameEn: "Ar-Ra'd", meaning: "The Thunder" },
  { name: "إبراهيم", nameEn: "Ibrahim", meaning: "Abraham" },
  { name: "الحجر", nameEn: "Al-Hijr", meaning: "The Rocky Tract" },
  { name: "النحل", nameEn: "An-Nahl", meaning: "The Bee" },
  { name: "الإسراء", nameEn: "Al-Isra", meaning: "The Night Journey" },
  { name: "الكهف", nameEn: "Al-Kahf", meaning: "The Cave" },
  { name: "مريم", nameEn: "Maryam", meaning: "Mary" },
  { name: "طه", nameEn: "Ta-Ha", meaning: "Ta-Ha" },
  { name: "الأنبياء", nameEn: "Al-Anbiya", meaning: "The Prophets" },
  { name: "الحج", nameEn: "Al-Hajj", meaning: "The Pilgrimage" },
  { name: "المؤمنون", nameEn: "Al-Mu'minun", meaning: "The Believers" },
  { name: "النور", nameEn: "An-Nur", meaning: "The Light" },
  { name: "الفرقان", nameEn: "Al-Furqan", meaning: "The Criterion" },
  { name: "الشعراء", nameEn: "Ash-Shu'ara", meaning: "The Poets" },
  { name: "النمل", nameEn: "An-Naml", meaning: "The Ants" },
  { name: "القصص", nameEn: "Al-Qasas", meaning: "The Stories" },
  { name: "العنكبوت", nameEn: "Al-'Ankabut", meaning: "The Spider" },
  { name: "الروم", nameEn: "Ar-Rum", meaning: "The Romans" },
  { name: "لقمان", nameEn: "Luqman", meaning: "Luqman" },
  { name: "السجدة", nameEn: "As-Sajdah", meaning: "The Prostration" },
  { name: "الأحزاب", nameEn: "Al-Ahzab", meaning: "The Combined Forces" },
  { name: "سبأ", nameEn: "Sabah", meaning: "Sheba" },
  { name: "فاطر", nameEn: "Fatir", meaning: "The Originator" },
  { name: "يس", nameEn: "Ya-Sin", meaning: "Ya-Sin" },
  { name: "الصافات", nameEn: "As-Saffat", meaning: "Those Who Set the Ranks" },
  { name: "ص", nameEn: "Sad", meaning: "Sad" },
  { name: "الزمر", nameEn: "Az-Zumar", meaning: "The Groups" },
  { name: "غافر", nameEn: "Ghafir", meaning: "The Forgiver" },
  { name: "فصلت", nameEn: "Fussilat", meaning: "Explained in Detail" },
  { name: "الشورى", nameEn: "Ash-Shura", meaning: "The Consultation" },
  { name: "الزخرف", nameEn: "Az-Zukhruf", meaning: "The Ornaments of Gold" },
  { name: "الدخان", nameEn: "Ad-Dukhan", meaning: "The Smoke" },
  { name: "الجاثية", nameEn: "Al-Jathiyah", meaning: "The Crouching" },
  { name: "الأحقاف", nameEn: "Al-Ahqaf", meaning: "The Wind-Curved Sand Dunes" },
  { name: "محمد", nameEn: "Muhammad", meaning: "Muhammad" },
  { name: "الفتح", nameEn: "Al-Fath", meaning: "The Victory" },
  { name: "الحجرات", nameEn: "Al-Hujurat", meaning: "The Rooms" },
  { name: "ق", nameEn: "Qaf", meaning: "Qaf" },
  { name: "الذاريات", nameEn: "Ad-Dariyat", meaning: "The Scatterers" },
  { name: "الطور", nameEn: "At-Tur", meaning: "The Mount" },
  { name: "النجم", nameEn: "An-Najm", meaning: "The Star" },
  { name: "القمر", nameEn: "Al-Qamar", meaning: "The Moon" },
  { name: "الرحمن", nameEn: "Ar-Rahman", meaning: "The Most Merciful" },
  { name: "الواقعة", nameEn: "Al-Waqi'ah", meaning: "The Inevitable" },
  { name: "الحديد", nameEn: "Al-Hadid", meaning: "The Iron" },
  { name: "المجادلة", nameEn: "Al-Mujadilah", meaning: "The Pleading Woman" },
  { name: "الحشر", nameEn: "Al-Hashr", meaning: "The Exile" },
  { name: "الممتحنة", nameEn: "Al-Mumtahanah", meaning: "The Tested Woman" },
  { name: "الصف", nameEn: "As-Saf", meaning: "The Ranks" },
  { name: "الجمعة", nameEn: "Al-Jumu'ah", meaning: "The Friday" },
  { name: "المنافقون", nameEn: "Al-Munafiqun", meaning: "The Hypocrites" },
  { name: "التغابن", nameEn: "At-Taghabun", meaning: "The Mutual Disappointment" },
  { name: "الطلاق", nameEn: "At-Talaq", meaning: "The Divorce" },
  { name: "التحريم", nameEn: "At-Tahrin", meaning: "The Prohibition" },
  { name: "الملك", nameEn: "Al-Mulk", meaning: "The Sovereignty" },
  { name: "القلم", nameEn: "Al-Qalam", meaning: "The Pen" },
  { name: "الحاقة", nameEn: "Al-Haqqah", meaning: "The Reality" },
  { name: "المعارج", nameEn: "Al-Ma'arij", meaning: "The Ascending Stairways" },
  { name: "نوح", nameEn: "Nuh", meaning: "Noah" },
  { name: "الجن", nameEn: "Al-Jinn", meaning: "The Jinn" },
  { name: "المزمل", nameEn: "Al-Muzzammil", meaning: "The Wrapped One" },
  { name: "المدثر", nameEn: "Al-Muddaththir", meaning: "The Cloaked One" },
  { name: "القيامة", nameEn: "Al-Qiyamah", meaning: "The Resurrection" },
  { name: "الإنسان", nameEn: "Al-Insan", meaning: "The Man" },
  { name: "المرسلات", nameEn: "Al-Mursalat", meaning: "The Emissaries" },
  { name: "النبأ", nameEn: "An-Naba", meaning: "The News" },
  { name: "النازعات", nameEn: "An-Nazi'at", meaning: "Those Who Pull Out" },
  { name: "عبس", nameEn: "'Abasa", meaning: "He Frowned" },
  { name: "التكوير", nameEn: "At-Takwir", meaning: "The Overthrowing" },
  { name: "الانفطار", nameEn: "Al-Infitar", meaning: "The Cleaving" },
  { name: "المطففين", nameEn: "Al-Mutaffifin", meaning: "The Defrauding" },
  { name: "الانشقاق", nameEn: "Al-Inshiqaq", meaning: "The Splitting Open" },
  { name: "البروج", nameEn: "Al-Buruj", meaning: "The Constellations" },
  { name: "الطارق", nameEn: "At-Tariq", meaning: "The Morning Star" },
  { name: "الأعلى", nameEn: "Al-A'la", meaning: "The Most High" },
  { name: "الغاشية", nameEn: "Al-Ghashiyah", meaning: "The Overwhelming" },
  { name: "الفجر", nameEn: "Al-Fajr", meaning: "The Dawn" },
  { name: "الليل", nameEn: "Al-Layl", meaning: "The Night" },
  { name: "الضحى", nameEn: "Ad-Duha", meaning: "The Morning Hours" },
  { name: "الشرح", nameEn: "Ash-Sharh", meaning: "The Opening of the Heart" },
  { name: "التين", nameEn: "At-Tin", meaning: "The Fig" },
  { name: "العلق", nameEn: "Al-'Alaq", meaning: "The Clot" },
  { name: "القدر", nameEn: "Al-Qadr", meaning: "The Night of Decree" },
  { name: "البينة", nameEn: "Al-Bayyinah", meaning: "The Clear Proof" },
  { name: "الزلزلة", nameEn: "Az-Zalzalah", meaning: "The Earthquake" },
  { name: "العاديات", nameEn: "Al-'Adiyat", meaning: "The Chargers" },
  { name: "القارعة", nameEn: "Al-Qari'ah", meaning: "The Calamity" },
  { name: "التكاثر", nameEn: "At-Takathur", meaning: "The Multiplication" },
  { name: "العصر", nameEn: "Al-'Asr", meaning: "The Time" },
  { name: "همزة", nameEn: "Al-Humazah", meaning: "The Slanderer" },
  { name: "الفيل", nameEn: "Al-Fil", meaning: "The Elephant" },
  { name: "قريش", nameEn: "Quraysh", meaning: "Quraysh" },
  { name: "الماعون", nameEn: "Al-Ma'un", meaning: "The Small Kindnesses" },
  { name: "الكوثر", nameEn: "Al-Kawthar", meaning: "The Abundance" },
  { name: "الكافرون", nameEn: "Al-Kafirun", meaning: "The Disbelievers" },
  { name: "النصر", nameEn: "An-Nasr", meaning: "The Victory" },
  { name: "المسد", nameEn: "Al-Masad", meaning: "The Palm Fiber" },
  { name: "الإخلاص", nameEn: "Al-Ikhlas", meaning: "The Sincerity" },
  { name: "الفلق", nameEn: "Al-Falaq", meaning: "The Dawn" },
  { name: "الناس", nameEn: "An-Nas", meaning: "The Mankind" },
];

interface QuranSurahListProps {
  onSelectSurah?: (surahId: number) => void;
}

export function QuranSurahList({ onSelectSurah }: QuranSurahListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const { quranReciterId, setQuranReciterId } = useSettings();

  const filteredSurahs = SURAH_NAMES.filter((surah, idx) => {
    const matchesSearch = searchQuery === "" || 
      surah.name.includes(searchQuery) ||
      surah.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJuz = selectedJuz === null || 
      (idx + 1 >= (selectedJuz - 1) * 20 / 7 + 1 && idx + 1 <= selectedJuz * 20 / 7 + 1);
    
    return matchesSearch && matchesJuz;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في السور..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-3 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>

      {/* Reciter selector */}
      <select
        value={quranReciterId}
        onChange={(e) => setQuranReciterId(e.target.value)}
        className="w-full p-3 rounded-xl bg-muted/50 border-0 text-sm"
      >
        {QURAN_RECITERS.map((reciter) => (
          <option key={reciter.id} value={reciter.id}>
            {reciter.nameAr}
          </option>
        ))}
      </select>

      {/* Surah list */}
      <div className="flex flex-col gap-2">
        {filteredSurahs.map((surah, idx) => {
          const surahNum = idx + 1;
          const ayahCount = SURAH_LENGTHS[idx] || 0;
          
          return (
            <Link
              key={surahNum}
              href={`/quran/read?surah=${surahNum}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {surahNum}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{surah.name}</h3>
                <p className="text-xs text-muted-foreground">{surah.nameEn} • {ayahCount} آية</p>
              </div>
              <span className="text-xs text-muted-foreground">{surah.meaning}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default QuranSurahList;
