import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, CheckCircle, Volume2, VolumeX, Sun, Moon,
  Star, Loader2, Award
} from "lucide-react";
import { getApiBase, isNativeApp } from "@/lib/api-base";
import { setAudioSrc } from "@/lib/native-audio";

// ─── Types ──────────────────────────────────────────────────────────────────

type AdhkarType = "morning" | "evening";

interface AdhkarItem {
  id: string;
  arabic: string;
  source: string;
  count: number;
  isQuran?: boolean;
  surahNum?: number;    // surah number (1-based)
  ayahStart?: number;  // first ayah to play
  ayahEnd?: number;    // last ayah to play (inclusive)
}

// ─── Quran Audio Helpers (same as Rajaa) ────────────────────────────────────

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

const RECITER = "ar.alafasy";

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function ayahProxyUrl(surah: number, ayah: number): string {
  const globalAyah = toGlobalAyah(surah, ayah);
  return isNativeApp()
    ? `https://cdn.islamic.network/quran/audio/128/${RECITER}/${globalAyah}.mp3`
    : `${getApiBase()}/audio-proxy/quran/${RECITER}/${globalAyah}.mp3`;
}

// ─── Morning Adhkar Data ─────────────────────────────────────────────────────

const MORNING_ADHKAR: AdhkarItem[] = [
  {
    id: "m1", count: 1, source: "سورة البقرة: ٢٥٥", isQuran: true,
    surahNum: 2, ayahStart: 255, ayahEnd: 255,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
  },
  {
    id: "m2", count: 3, source: "سورة الإخلاص", isQuran: true,
    surahNum: 112, ayahStart: 1, ayahEnd: 4,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
  },
  {
    id: "m3", count: 3, source: "سورة الفلق", isQuran: true,
    surahNum: 113, ayahStart: 1, ayahEnd: 5,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
  },
  {
    id: "m4", count: 3, source: "سورة الناس", isQuran: true,
    surahNum: 114, ayahStart: 1, ayahEnd: 6,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
  },
  {
    id: "m5", count: 1, source: "أبو داود والترمذي",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ"
  },
  {
    id: "m6", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ"
  },
  {
    id: "m7", count: 1, source: "البخاري — سيد الاستغفار",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ"
  },
  {
    id: "m8", count: 3, source: "أبو داود والترمذي",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا"
  },
  {
    id: "m9", count: 4, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ"
  },
  {
    id: "m10", count: 1, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ"
  },
  {
    id: "m11", count: 7, source: "أبو داود وابن ماجه",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ"
  },
  {
    id: "m12", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ"
  },
  {
    id: "m13", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ"
  },
  {
    id: "m14", count: 3, source: "أبو داود وابن ماجه",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ"
  },
  {
    id: "m15", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ وَالْجُذَامِ وَمِنْ سَيِّئِ الْأَسْقَامِ"
  },
  {
    id: "m16", count: 2, source: "الترمذي وابن ماجه",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي"
  },
  {
    id: "m17", count: 10, source: "الترمذي والنسائي",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "m18", count: 100, source: "البخاري ومسلم",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
  },
  {
    id: "m19", count: 33, source: "مسلم",
    arabic: "سُبْحَانَ اللَّهِ"
  },
  {
    id: "m20", count: 33, source: "مسلم",
    arabic: "الْحَمْدُ لِلَّهِ"
  },
  {
    id: "m21", count: 34, source: "مسلم",
    arabic: "اللَّهُ أَكْبَرُ"
  },
  {
    id: "m22", count: 10, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ"
  },
  {
    id: "m23", count: 3, source: "أبو داود والترمذي",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ"
  },
  {
    id: "m24", count: 1, source: "الترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا"
  },
  {
    id: "m25", count: 1, source: "الترمذي وأحمد",
    arabic: "اللَّهُمَّ أَنْتَ رَبُّنَا لَا إِلَهَ إِلَّا أَنْتَ، عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ"
  },
  {
    id: "m26", count: 3, source: "أحمد والبيهقي",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ"
  },
  {
    id: "m27", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ، وَأَنْتَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "m28", count: 1, source: "ابن السني وأبو داود",
    arabic: "اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ"
  },
  {
    id: "m29", count: 1, source: "أبو داود",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ"
  },
  {
    id: "m30", count: 1, source: "الترمذي",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ"
  },
  {
    id: "m31", count: 1, source: "السنة",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ"
  },
];

// ─── Evening Adhkar Data ─────────────────────────────────────────────────────

const EVENING_ADHKAR: AdhkarItem[] = [
  {
    id: "e1", count: 1, source: "سورة البقرة: ٢٥٥", isQuran: true,
    surahNum: 2, ayahStart: 255, ayahEnd: 255,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
  },
  {
    id: "e2", count: 3, source: "سورة الإخلاص", isQuran: true,
    surahNum: 112, ayahStart: 1, ayahEnd: 4,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
  },
  {
    id: "e3", count: 3, source: "سورة الفلق", isQuran: true,
    surahNum: 113, ayahStart: 1, ayahEnd: 5,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
  },
  {
    id: "e4", count: 3, source: "سورة الناس", isQuran: true,
    surahNum: 114, ayahStart: 1, ayahEnd: 6,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
  },
  {
    id: "e5", count: 1, source: "أبو داود والترمذي",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا"
  },
  {
    id: "e6", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ"
  },
  {
    id: "e7", count: 1, source: "البخاري — سيد الاستغفار",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ"
  },
  {
    id: "e8", count: 3, source: "أبو داود والترمذي",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا"
  },
  {
    id: "e9", count: 4, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ"
  },
  {
    id: "e10", count: 1, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ"
  },
  {
    id: "e11", count: 7, source: "أبو داود وابن ماجه",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ"
  },
  {
    id: "e12", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ"
  },
  {
    id: "e13", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ"
  },
  {
    id: "e14", count: 3, source: "أبو داود وابن ماجه",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ"
  },
  {
    id: "e15", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي"
  },
  {
    id: "e16", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ وَالْجُذَامِ وَمِنْ سَيِّئِ الْأَسْقَامِ"
  },
  {
    id: "e17", count: 10, source: "الترمذي والنسائي",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "e18", count: 100, source: "البخاري ومسلم",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
  },
  {
    id: "e19", count: 33, source: "مسلم",
    arabic: "سُبْحَانَ اللَّهِ"
  },
  {
    id: "e20", count: 33, source: "مسلم",
    arabic: "الْحَمْدُ لِلَّهِ"
  },
  {
    id: "e21", count: 34, source: "مسلم",
    arabic: "اللَّهُ أَكْبَرُ"
  },
  {
    id: "e22", count: 10, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ"
  },
  {
    id: "e23", count: 3, source: "أبو داود والترمذي",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ"
  },
  {
    id: "e24", count: 1, source: "ابن ماجه والنسائي",
    arabic: "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا لَكَ مَمَاتُهَا وَمَحْيَاهَا إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا"
  },
  {
    id: "e25", count: 1, source: "الطبراني",
    arabic: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ"
  },
  {
    id: "e26", count: 3, source: "أحمد والبيهقي",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ"
  },
  {
    id: "e27", count: 1, source: "الترمذي",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ"
  },
  {
    id: "e28", count: 1, source: "مسلم",
    arabic: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ وَنَبِيِّكَ الَّذِي أَرْسَلْتَ"
  },
  {
    id: "e29", count: 1, source: "سورة المؤمنون: ١١٥-١١٧", isQuran: true,
    surahNum: 23, ayahStart: 115, ayahEnd: 117,
    arabic: "أَفَحَسِبْتُمْ أَنَّمَا خَلَقْنَاكُمْ عَبَثًا وَأَنَّكُمْ إِلَيْنَا لَا تُرْجَعُونَ ۝ فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ ۝ لَا إِلَٰهَ إِلَّا هُوَ رَبُّ الْعَرْشِ الْكَرِيمِ",
  },
  {
    id: "e30", count: 1, source: "الحاكم وابن حبان",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّيْطَانِ الرَّجِيمِ وَمِنْ كُلِّ شَيْطَانٍ مَارِدٍ"
  },
  {
    id: "e31", count: 1, source: "السنة",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ"
  },
];

// ─── Sequential Ayah Player ──────────────────────────────────────────────────
// Plays ayahStart → ayahEnd one by one using the api-server proxy (no CORS)

class AyahSequencePlayer {
  private surah: number;
  private ayahStart: number;
  private ayahEnd: number;
  private currentAyah: number;
  private audio: HTMLAudioElement | null = null;
  private stopped = false;
  onEnd: () => void = () => {};

  constructor(surah: number, ayahStart: number, ayahEnd: number) {
    this.surah = surah;
    this.ayahStart = ayahStart;
    this.ayahEnd = ayahEnd;
    this.currentAyah = ayahStart;
  }

  play() {
    this.stopped = false;
    this._playNext();
  }

  private _playNext() {
    if (this.stopped || this.currentAyah > this.ayahEnd) {
      this.onEnd();
      return;
    }
    const url = ayahProxyUrl(this.surah, this.currentAyah);
    this.audio = new Audio();
    void setAudioSrc(this.audio, url).catch(() => {});
    this.audio.onended = () => {
      this.currentAyah++;
      this._playNext();
    };
    this.audio.onerror = () => {
      // skip on error
      this.currentAyah++;
      this._playNext();
    };
    this.audio.play().catch(() => {
      this.currentAyah++;
      this._playNext();
    });
  }

  stop() {
    this.stopped = true;
    this.audio?.pause();
    this.audio = null;
  }

  restart() {
    this.stop();
    this.currentAyah = this.ayahStart;
    this.stopped = false;
    this._playNext();
  }
}

// ─── Single Adhkar Item Card ─────────────────────────────────────────────────

function AdhkarItemCard({
  item, index, total, done, current, onTap, audioEnabled,
}: {
  item: AdhkarItem;
  index: number;
  total: number;
  done: boolean;
  current: boolean;
  onTap: (id: string) => void;
  audioEnabled: boolean;
}) {
  const [count, setCount] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<AyahSequencePlayer | null>(null);
  const prevDoneRef = useRef(done);

  // Reset count if this item gets un-done (reset flow)
  useEffect(() => {
    if (!prevDoneRef.current && done) setCount(0);
    prevDoneRef.current = done;
  }, [done]);

  // Stop audio when item is no longer current
  useEffect(() => {
    if (!current && playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
      setPlaying(false);
    }
  }, [current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { playerRef.current?.stop(); };
  }, []);

  const handleTap = () => {
    if (done || !current) return;
    const next = Math.min(count + 1, item.count);
    setCount(next);
    if (next >= item.count) onTap(item.id);
  };

  const handleAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isQuran || !item.surahNum || !item.ayahStart || !item.ayahEnd) return;

    if (playing) {
      playerRef.current?.stop();
      playerRef.current = null;
      setPlaying(false);
      return;
    }

    setAudioLoading(true);
    // Preload first ayah to check connectivity
    const firstUrl = ayahProxyUrl(item.surahNum, item.ayahStart);
    try {
      const probe = new Audio(firstUrl);
      await new Promise<void>((resolve, reject) => {
        probe.oncanplaythrough = () => resolve();
        probe.onerror = () => reject();
        probe.load();
        // timeout safety
        setTimeout(resolve, 3000);
      });
    } catch { /* proceed anyway */ }
    setAudioLoading(false);

    const player = new AyahSequencePlayer(item.surahNum, item.ayahStart, item.ayahEnd);
    player.onEnd = () => setPlaying(false);
    playerRef.current = player;
    player.play();
    setPlaying(true);
  };

  const progressPct = item.count === 1
    ? (count > 0 ? 100 : 0)
    : Math.min((count / item.count) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.32 }}
      className="relative flex gap-3"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0"
          animate={
            done
              ? { backgroundColor: "#10b981", scale: [1, 1.15, 1] }
              : current
                ? { backgroundColor: "#f59e0b", scale: [1, 1.08, 1] }
                : { backgroundColor: "rgba(255,255,255,0.1)", scale: 1 }
          }
          transition={{ duration: 0.4 }}
          style={{
            border: done
              ? "2px solid #6ee7b7"
              : current
                ? "2px solid #fcd34d"
                : "2px solid rgba(255,255,255,0.15)",
          }}
        >
          {done
            ? <CheckCircle size={14} className="text-white" />
            : <span className="text-[10px] font-bold text-white/80">{index + 1}</span>
          }
        </motion.div>
        {index < total - 1 && (
          <div
            className="flex-1 w-[2px] min-h-[12px] mt-1 rounded-full"
            style={{ background: done ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)" }}
          />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 mb-3">
        <motion.button
          className="w-full text-right rounded-2xl p-4 select-none transition-all"
          style={{
            background: done
              ? "rgba(16,185,129,0.1)"
              : current
                ? "rgba(245,158,11,0.1)"
                : "rgba(255,255,255,0.04)",
            border: done
              ? "1.5px solid rgba(16,185,129,0.3)"
              : current
                ? "1.5px solid rgba(245,158,11,0.3)"
                : "1.5px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(8px)",
            opacity: (!done && !current) ? 0.55 : 1,
            cursor: done ? "default" : current ? "pointer" : "not-allowed",
          }}
          onClick={current ? handleTap : undefined}
          whileTap={current ? { scale: 0.985 } : {}}
          disabled={!current && !done}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: done
                  ? "rgba(16,185,129,0.18)"
                  : current
                    ? "rgba(245,158,11,0.18)"
                    : "rgba(255,255,255,0.08)",
                color: done ? "#6ee7b7" : current ? "#fcd34d" : "rgba(255,255,255,0.4)",
              }}
            >
              {item.source}
            </span>
            <div className="flex items-center gap-2">
              {/* Audio button — only for Quran items */}
              {item.isQuran && audioEnabled && (
                <button
                  onClick={handleAudio}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: playing ? "rgba(96,165,250,0.3)" : "rgba(96,165,250,0.15)",
                    border: `1px solid ${playing ? "rgba(96,165,250,0.5)" : "rgba(96,165,250,0.25)"}`,
                  }}
                >
                  {audioLoading
                    ? <Loader2 size={13} className="animate-spin text-blue-300" />
                    : playing
                      ? <VolumeX size={13} className="text-blue-300" />
                      : <Volume2 size={13} className="text-blue-300" />
                  }
                </button>
              )}
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: done ? "#6ee7b7" : current ? "#fcd34d" : "rgba(255,255,255,0.3)" }}
              >
                ×{item.count}
              </span>
            </div>
          </div>

          {/* Arabic text */}
          <p
            className="text-[15px] leading-[2.1] text-right"
            dir="rtl"
            style={{
              fontFamily: "'Amiri', 'Scheherazade New', serif",
              color: done
                ? "rgba(255,255,255,0.65)"
                : current
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.38)",
            }}
          >
            {item.arabic.length > 240
              ? item.arabic.slice(0, 240) + "..."
              : item.arabic}
          </p>

          {/* Progress bar — only for current */}
          {current && !done && (
            <div className="mt-3.5">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(to left, #f59e0b, #fcd34d)",
                  }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10px] text-white/35">اضغط على البطاقة للعد</span>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: "#fcd34d" }}>
                  {count} / {item.count}
                </span>
              </div>
            </div>
          )}

          {done && (
            <div className="mt-2 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">مكتمل</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Celebration Screen ──────────────────────────────────────────────────────

function CelebrationScreen({ type, onClose }: { type: AdhkarType; onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
      style={{
        background: "linear-gradient(160deg, rgba(0,25,15,0.98) 0%, rgba(0,15,35,0.98) 100%)",
        backdropFilter: "blur(24px)",
      }}
    >
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: `${8 + (i * 6.2) % 84}%`,
            left: `${4 + (i * 7.1) % 92}%`,
            fontSize: 8 + (i % 5) * 4,
            color: i % 3 === 0 ? "#fcd34d" : i % 3 === 1 ? "#6ee7b7" : "#93c5fd",
          }}
          animate={{ scale: [0, 1.4, 0.9, 1], opacity: [0, 1, 0.8, 1] }}
          transition={{ delay: i * 0.07, duration: 0.6 }}
        >
          ✦
        </motion.div>
      ))}

      <motion.div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 0 80px rgba(16,185,129,0.55)",
        }}
        animate={{ scale: [0.5, 1.12, 1] }}
        transition={{ duration: 0.75, ease: "backOut" }}
      >
        <Award size={58} className="text-white" />
      </motion.div>

      <motion.h2
        className="text-3xl font-bold text-white mb-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        بارك الله فيك 🌙
      </motion.h2>

      <motion.p
        className="text-center text-white/75 text-base leading-relaxed mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
      >
        {type === "morning" ? "أتممت أذكار الصباح كاملةً" : "أتممت أذكار المساء كاملةً"}
      </motion.p>

      <motion.p
        className="text-center text-emerald-300/80 text-sm leading-relaxed mb-10 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.54 }}
        dir="rtl"
      >
        «مَنْ قَالَهَا حِينَ يُصْبِحُ وَحِينَ يُمْسِي كَانَ حَقًّا عَلَى اللَّهِ أَنْ يُرْضِيَهُ يَوْمَ الْقِيَامَةِ»
      </motion.p>

      <motion.button
        className="px-12 py-3.5 rounded-2xl font-bold text-base text-white"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 6px 28px rgba(16,185,129,0.45)",
        }}
        onClick={onClose}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.64 }}
        whileTap={{ scale: 0.96 }}
      >
        ✓ إغلاق
      </motion.button>
    </motion.div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface AdhkarModalProps {
  visible: boolean;
  type: AdhkarType;
  onClose: () => void;
}

const MANDATORY_SECONDS = 3;

export function AdhkarModal({ visible, type, onClose }: AdhkarModalProps) {
  const items = type === "morning" ? MORNING_ADHKAR : EVENING_ADHKAR;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [celebrated, setCelebrated] = useState(false);
  const [countdown, setCountdown] = useState(MANDATORY_SECONDS);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIndex = items.findIndex((item) => !completedIds.has(item.id));
  const allDone = currentIndex === -1 && completedIds.size > 0;
  const canClose = countdown <= 0;

  const handleItemDone = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      const cards = scrollRef.current?.querySelectorAll("[data-adhkar-card]");
      const nextCard = cards?.[currentIndex + 1] as HTMLElement | undefined;
      nextCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }, [currentIndex]);

  useEffect(() => {
    if (allDone && !celebrated) setTimeout(() => setCelebrated(true), 450);
  }, [allDone, celebrated]);

  // Reset state when modal opens — start mandatory countdown
  useEffect(() => {
    if (visible) {
      setCompletedIds(new Set());
      setCelebrated(false);
      setCountdown(MANDATORY_SECONDS);
    }
  }, [visible]);

  // Countdown timer — ticks every second until 0
  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, countdown]);

  const isMorning = type === "morning";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            background: isMorning
              ? "linear-gradient(175deg, #0a1628 0%, #0d2340 25%, #0a1e2e 60%, #081428 100%)"
              : "linear-gradient(175deg, #0c0a1e 0%, #110d30 25%, #0a0a28 60%, #060514 100%)",
          }}
        >
          {/* Islamic background pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/images/islamic-pattern-bg.png')",
              backgroundSize: "200px 200px",
              backgroundRepeat: "repeat",
              opacity: 0.055,
              mixBlendMode: "screen",
            }}
          />

          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute rounded-full blur-[90px]"
              style={{
                width: 300, height: 300, top: -80, right: -60,
                background: isMorning ? "rgba(251,191,36,0.1)" : "rgba(99,102,241,0.1)",
              }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full blur-[110px]"
              style={{
                width: 260, height: 260, bottom: 0, left: -50,
                background: isMorning ? "rgba(16,185,129,0.07)" : "rgba(139,92,246,0.07)",
              }}
              animate={{ scale: [1, 1.22, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>

          {/* Scattered stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none text-white/15"
              style={{
                top: `${5 + (i * 4.7) % 90}%`,
                left: `${2 + (i * 6.8) % 96}%`,
                fontSize: 5 + (i % 5) * 3,
              }}
              animate={{ opacity: [0.08, 0.35, 0.08] }}
              transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.28 }}
            >
              ✦
            </motion.div>
          ))}

          {/* ── Header ── */}
          <motion.div
            className="relative z-10 flex items-center justify-between px-5 flex-shrink-0"
            style={{
              paddingTop: "max(env(safe-area-inset-top), 16px)",
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              background: "rgba(0,0,0,0.28)",
            }}
            initial={{ y: -44, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.38, delay: 0.08 }}
          >
            <button
              onClick={canClose ? onClose : undefined}
              className="rounded-full flex items-center justify-center transition-all"
              style={{
                minWidth: canClose ? 36 : 52,
                height: 36,
                padding: canClose ? 0 : "0 10px",
                background: canClose
                  ? "rgba(255,255,255,0.09)"
                  : "rgba(255,255,255,0.04)",
                border: canClose
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(255,255,255,0.06)",
                cursor: canClose ? "pointer" : "not-allowed",
                opacity: canClose ? 1 : 0.65,
                gap: 4,
              }}
            >
              {canClose ? (
                <X size={17} className="text-white/80" />
              ) : (
                <>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    تخطي
                  </span>
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ color: isMorning ? "#fcd34d" : "#a78bfa", minWidth: 12, textAlign: "center" }}
                  >
                    {countdown}
                  </span>
                </>
              )}
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                {isMorning
                  ? <Sun size={17} className="text-amber-300" />
                  : <Moon size={17} className="text-indigo-300" />
                }
                <h1 className="text-[15px] font-bold text-white">
                  {isMorning ? "أذكار الصباح" : "أذكار المساء"}
                </h1>
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.42)" }}>
                {completedIds.size} / {items.length} مكتمل
              </p>
            </div>

            <button
              onClick={() => setAudioEnabled((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{
                background: audioEnabled ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.07)",
                border: `1px solid ${audioEnabled ? "rgba(96,165,250,0.28)" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {audioEnabled
                ? <Volume2 size={15} className="text-blue-300" />
                : <VolumeX size={15} className="text-white/35" />
              }
            </button>
          </motion.div>

          {/* Progress bar */}
          <div className="relative z-10 h-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
            <motion.div
              className="h-full"
              style={{
                background: isMorning
                  ? "linear-gradient(to left, #f59e0b, #fcd34d)"
                  : "linear-gradient(to left, #6366f1, #a78bfa)",
              }}
              animate={{ width: `${(completedIds.size / items.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* ── Scrollable content ── */}
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-10"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Intro banner */}
            <motion.div
              className="mb-5 rounded-2xl p-4 text-center"
              style={{
                background: isMorning ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${isMorning ? "rgba(245,158,11,0.18)" : "rgba(99,102,241,0.18)"}`,
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star size={13} style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }} />
                <span className="text-sm font-bold" style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }}>
                  {isMorning ? "أذكار الصباح كاملةً" : "أذكار المساء كاملةً"} — {items.length} بند
                </span>
                <Star size={13} style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }} />
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.42)" }}>
                اضغط البطاقة المضيئة للعدّ • 🔊 للاستماع للآيات القرآنية بصوت مشاري العفاسي
              </p>
            </motion.div>

            {/* Items */}
            {items.map((item, index) => (
              <div key={item.id} data-adhkar-card>
                <AdhkarItemCard
                  item={item}
                  index={index}
                  total={items.length}
                  done={completedIds.has(item.id)}
                  current={currentIndex === index}
                  onTap={handleItemDone}
                  audioEnabled={audioEnabled}
                />
              </div>
            ))}

            {!allDone && currentIndex >= 0 && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-2 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.2 }}
              >
                <ChevronRight size={13} className="text-white/40" />
                <span className="text-[11px] text-white/40">
                  البند الحالي: {currentIndex + 1} من {items.length}
                </span>
              </motion.div>
            )}
          </div>

          {/* Celebration overlay */}
          <AnimatePresence>
            {celebrated && <CelebrationScreen type={type} onClose={onClose} />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
