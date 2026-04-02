import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Search, X, Play, Pause, Loader2, Volume2, Headphones } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { setAudioSrc } from "@/lib/native-audio";
import { getApiBase, isNativeApp } from "@/lib/api-base";

let activeGlobalAudio: { element: HTMLAudioElement; stop: () => void } | null = null;

const ACCENT = "#c8a84b";

type VerseCategory = "رجاء" | "ترغيب" | "نعيم" | "طمأنينة";

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function reciterAudioUrl(surah: number, ayah: number, reciterId: string): string {
  const globalAyah = toGlobalAyah(surah, ayah);
  return isNativeApp()
    ? `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalAyah}.mp3`
    : `${getApiBase()}/audio-proxy/quran/${reciterId}/${globalAyah}.mp3`;
}

const QURAN_VERSES: { id: number; arabic: string; source: string; tag: string; note: string; category: VerseCategory; surah: number; ayah: number }[] = [
  {
    id: 1,
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
    source: "سورة الزمر - الآية 53",
    tag: "أرجى آية",
    note: "هذه الآية أرجى آية في القرآن الكريم - قال ابن مسعود: «أرجى آية في كتاب الله». لاحظ: لا استثناء في المغفرة - «الذنوب جميعاً».",
    category: "رجاء",
    surah: 39, ayah: 53,
  },
  { id: 2, category: "رجاء", arabic: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا", source: "سورة النساء - الآية 110", tag: "وعد إلهي", note: "وعد إلهي قاطع: من استغفر وجد الله غفوراً رحيماً. الفعل «يجد» يدل على اليقين التام.", surah: 4, ayah: 110 },
  { id: 3, category: "رجاء", arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ", source: "سورة البقرة - الآية 222", tag: "محبة الله", note: "الله يُحب التائب. أن تكون محبوب الله هو أعلى درجة يمكن أن يبلغها الإنسان.", surah: 2, ayah: 222 },
  { id: 4, category: "رجاء", arabic: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ وَيَعْلَمُ مَا تَفْعَلُونَ", source: "سورة الشورى - الآية 25", tag: "صفة ثابتة", note: "قبول التوبة صفة ثابتة لله، وليس أمراً استثنائياً. «يعلم ما تفعلون» وعلى الرغم من ذلك يقبل ويعفو.", surah: 42, ayah: 25 },
  { id: 5, category: "رجاء", arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ ۗ وَكَانَ اللَّهُ غَفُورًا رَّحِيمًا", source: "سورة الفرقان - الآية 70", tag: "تبديل السيئات", note: "بشارة عظيمة: السيئات تتحوّل إلى حسنات للتائب - ليس محوها فحسب، بل تحويلها إلى رصيد إيجابي.", surah: 25, ayah: 70 },
  { id: 6, category: "رجاء", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا عَسَىٰ رَبُّكُمْ أَن يُكَفِّرَ عَنكُمْ سَيِّئَاتِكُمْ وَيُدْخِلَكُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ", source: "سورة التحريم - الآية 8", tag: "توبة نصوح", note: "التوبة النصوح تُكفّر السيئات وتفتح باب الجنة.", surah: 66, ayah: 8 },
  { id: 7, category: "رجاء", arabic: "وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ وَمَن يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ", source: "سورة آل عمران - الآية 135", tag: "صفة المتقين", note: "الوقوع في الذنب ليس نهايتك - صفة المتقين هي العودة لله فوراً.", surah: 3, ayah: 135 },
  { id: 8, category: "رجاء", arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلَحُونَ", source: "سورة النور - الآية 31", tag: "طريق الفلاح", note: "التوبة طريق الفلاح لكل مؤمن.", surah: 24, ayah: 31 },
  { id: 9, category: "رجاء", arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", source: "سورة الأعراف - الآية 23", tag: "دعاء آدم", note: "دعاء أبينا آدم فغفر الله له واصطفاه. علّمنا الله هذا الدعاء ليكون سلاحنا.", surah: 7, ayah: 23 },
  { id: 10, category: "رجاء", arabic: "نَبِّئْ عِبَادِي أَنِّي أَنَا الْغَفُورُ الرَّحِيمُ", source: "سورة الحجر - الآية 49", tag: "توازن الرجاء", note: "بدأ الله بالمغفرة والرحمة. اجمع بين الخوف والرجاء ولا تُغلّب أحدهما.", surah: 15, ayah: 49 },
  { id: 11, category: "رجاء", arabic: "وَالَّذِينَ عَمِلُوا السَّيِّئَاتِ ثُمَّ تَابُوا مِن بَعْدِهَا وَآمَنُوا إِنَّ رَبَّكَ مِن بَعْدِهَا لَغَفُورٌ رَّحِيمٌ", source: "سورة الأعراف - الآية 153", tag: "بعد السيئات", note: "«من بعدها» تأكيد أن الذنوب كانت حقيقية ومع ذلك يغفرها الله.", surah: 7, ayah: 153 },
  { id: 12, category: "رجاء", arabic: "وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ ۚ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ", source: "سورة هود - الآية 90", tag: "الله الودود", note: "«ودود» من أسماء الله. التوبة عودة إلى حضرة من يودّك.", surah: 11, ayah: 90 },
  { id: 13, category: "رجاء", arabic: "فَمَن تَابَ مِن بَعْدِ ظُلْمِهِ وَأَصْلَحَ فَإِنَّ اللَّهَ يَتُوبُ عَلَيْهِ ۗ إِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ", source: "سورة المائدة - الآية 39", tag: "شرط الإصلاح", note: "التوبة مع الإصلاح مقبولة مضمونة.", surah: 5, ayah: 39 },
  { id: 14, category: "رجاء", arabic: "غَافِرِ الذَّنبِ وَقَابِلِ التَّوْبِ شَدِيدِ الْعِقَابِ ذِي الطَّوْلِ", source: "سورة غافر - الآية 3", tag: "اسمه غافر", note: "«غافر الذنب» جاء قبل «شديد العقاب». رحمته سبقت غضبه.", surah: 40, ayah: 3 },
  { id: 15, category: "رجاء", arabic: "وَالَّذِي أَطْمَعُ أَن يَغْفِرَ لِي خَطِيئَتِي يَوْمَ الدِّينِ", source: "سورة الشعراء - الآية 82", tag: "دعاء إبراهيم", note: "إبراهيم الخليل نفسه يطمع في المغفرة. فكيف بنا؟", surah: 26, ayah: 82 },
  { id: 16, category: "رجاء", arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۚ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", source: "سورة الطلاق - الآيتان 2-3", tag: "المخرج", note: "من ترك الذنب لله فتح الله له أبواباً لم يتوقعها.", surah: 65, ayah: 2 },
  { id: 17, category: "رجاء", arabic: "وَمَن تَابَ وَعَمِلَ صَالِحًا فَإِنَّهُ يَتُوبُ إِلَى اللَّهِ مَتَابًا", source: "سورة الفرقان - الآية 71", tag: "متاب حقيقي", note: "التوبة المقرونة بالعمل الصالح هي التوبة الكاملة.", surah: 25, ayah: 71 },
  { id: 18, category: "رجاء", arabic: "رَّبُّكُمْ أَعْلَمُ بِمَا فِي نُفُوسِكُمْ ۚ إِن تَكُونُوا صَالِحِينَ فَإِنَّهُ كَانَ لِلْأَوَّابِينَ غَفُورًا", source: "سورة الإسراء - الآية 25", tag: "للأوابين", note: "«الأواب»: كثير العودة. العودة مراراً أفضل من عدم العودة.", surah: 17, ayah: 25 },
  { id: 19, category: "رجاء", arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا فَأُولَٰئِكَ يَدْخُلُونَ الْجَنَّةَ وَلَا يُظْلَمُونَ شَيْئًا", source: "سورة مريم - الآية 60", tag: "دخول الجنة", note: "بابك للجنة مفتوح مهما كان ماضيك.", surah: 19, ayah: 60 },
  { id: 20, category: "رجاء", arabic: "وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ", source: "سورة طه - الآية 82", tag: "المغفرة المضمونة", note: "«لغفار» صيغة مبالغة: كثير المغفرة عظيمها.", surah: 20, ayah: 82 },
  { id: 21, category: "ترغيب", arabic: "وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعِدَّتْ لِلْمُتَّقِينَ", source: "سورة آل عمران - الآية 133", tag: "سارع", note: "«وسارعوا» أمر بالإسراع. الجنة عرضها السماوات والأرض تنتظرك.", surah: 3, ayah: 133 },
  { id: 22, category: "ترغيب", arabic: "مَن جَاءَ بِالْحَسَنَةِ فَلَهُ عَشْرُ أَمْثَالِهَا ۖ وَمَن جَاءَ بِالسَّيِّئَةِ فَلَا يُجْزَىٰ إِلَّا مِثْلَهَا", source: "سورة الأنعام - الآية 160", tag: "مضاعفة الحسنات", note: "حسنة واحدة بعشر أمثالها.", surah: 6, ayah: 160 },
  { id: 23, category: "ترغيب", arabic: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", source: "سورة التوبة - الآية 120", tag: "الأجر محفوظ", note: "كل عمل صالح محفوظ عند الله.", surah: 9, ayah: 120 },
  { id: 24, category: "ترغيب", arabic: "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", source: "سورة الزلزلة - الآية 7", tag: "لا شيء يضيع", note: "حتى مثقال الذرة من الخير يراه صاحبه.", surah: 99, ayah: 7 },
  { id: 25, category: "ترغيب", arabic: "وَمَن يَتَّقِ اللَّهَ يُكَفِّرْ عَنْهُ سَيِّئَاتِهِ وَيُعْظِمْ لَهُ أَجْرًا", source: "سورة الطلاق - الآية 5", tag: "تكفير وتعظيم", note: "التقوى تجلب محو السيئات وتعظيم الأجر.", surah: 65, ayah: 5 },
  { id: 26, category: "نعيم", arabic: "فِيهَا مَا تَشْتَهِيهِ الْأَنفُسُ وَتَلَذُّ الْأَعْيُنُ ۖ وَأَنتُمْ فِيهَا خَالِدُونَ", source: "سورة الزخرف - الآية 71", tag: "كل ما تشتهي", note: "كل ما خطر ببالك من متعة موجود في الجنة.", surah: 43, ayah: 71 },
  { id: 27, category: "نعيم", arabic: "لَهُم مَّا يَشَاءُونَ فِيهَا وَلَدَيْنَا مَزِيدٌ", source: "سورة ق - الآية 35", tag: "فوق المنى", note: "«ولدينا مزيد» - ليس فقط ما يطلبون بل أكثر.", surah: 50, ayah: 35 },
  { id: 28, category: "طمأنينة", arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "سورة الرعد - الآية 28", tag: "سر الطمأنينة", note: "القلب المضطرب لا يهدأ إلا بذكر الله.", surah: 13, ayah: 28 },
  { id: 29, category: "طمأنينة", arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح - الآيتان 5-6", tag: "يُسر مضمون", note: "كررها الله مرتين. مع كل ضيق يُسران.", surah: 94, ayah: 5 },
  { id: 30, category: "طمأنينة", arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", source: "سورة الضحى - الآية 5", tag: "ستَرضى", note: "وعد مباشر من الله لك: ستُعطى وسترضى.", surah: 93, ayah: 5 },
];

const HADITHS = [
  {
    id: 1,
    arabic: "«لَلَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ مِنْ أَحَدِكُمْ سَقَطَ عَلَى بَعِيرِهِ وَقَدْ أَضَلَّهُ فِي أَرْضٍ فَلَاةٍ»",
    source: "متفق عليه",
    tag: "فرح الله",
    note: "تأمل هذا التشبيه: رجل في صحراء فقد راحلته، ثم وجدها. فرح الله بتوبتك أشد من فرح هذا الرجل.",
  },
  {
    id: 2,
    arabic: "«إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ، وَيَبْسُطُ يَدَهُ بِالنَّهَارِ لِيَتُوبَ مُسِيءُ اللَّيْلِ»",
    source: "رواه مسلم",
    tag: "الباب مفتوح",
    note: "ليلاً ونهاراً - لا توقف ولا إغلاق لباب التوبة. الله ينتظرك الآن.",
  },
  {
    id: 3,
    arabic: "«التَّائِبُ مِنَ الذَّنْبِ كَمَنْ لَا ذَنْبَ لَهُ»",
    source: "رواه ابن ماجه",
    tag: "محو كامل",
    note: "التائب كمن لا ذنب له - الله يمحو كل شيء ويبدأ بك صفحة جديدة.",
  },
  {
    id: 4,
    arabic: "«إِنَّ الْمُؤْمِنَ لَا يَخْلُو مِنْ فِتْنَتَيْنِ، فَمَا أُعْطِيَ مِنْهَا صَبَرَ، وَمَا أُخِذَ مِنْهَا اسْتَغْفَرَ»",
    source: "رواه الطبراني",
    tag: "الاستغفار دواء",
    note: "المؤمن يستغفر دائماً. الاستغفار ليس اعترافاً بالضعف بل قوة.",
  },
  {
    id: 5,
    arabic: "«مَنْ أَصْبَحَ مُستَغْفِرًا اللَّهَ ثَلَاثَ مَرَّاتٍ أَصْبَحَتْ لَهُ أَجْرُ عِبَادَةِ لَيْلَةٍ»",
    source: "رواه الحاكم",
    tag: "أجر عظيم",
    note: "ثلاث مرات استغفار بأجر عبادة ليلة كاملة. سهل جداً وأجره عظيم.",
  },
];

const STORIES = [
  {
    id: 1,
    title: "قصة صاحب الذنب",
    story: "كان هناك رجل أذنب ذنباً كبيراً، ثم ندم وتاب إلى الله. فأنزل الله على نبيه: «إن الله يحب التوابين ويحب المتطهرين». فرجع الناس إليه واحترموه أكثر من قبل.",
    lesson: "التوبة ترفعك لا تخفضك. كلما زاد ذنبك وزادت توبتك، زاد شرفك.",
  },
  {
    id: 2,
    story: "جاء رجل إلى النبي وقال: إني أذنبت كثيراً فهل يغفر لي؟ قال النبي: «هل تتوب كل يوم؟» قال: نعم. قال: «فأنت مسلم». ثم أنزل الله: «إن الله لا يغفر أن يشرك به ويغفر ما دون ذلك».",
    lesson: "التوبة كل يوم أفضل من الغفلة. لا تنتظر أن تكون كاملاً.",
  },
  {
    id: 3,
    story: "قال الحسن البصري: ما أحسن التوبة مع أهل الأرض، وأكثرهم يتوبون إلى الله ويعودون إليه. فإن الله يقبل التوبة ويعفو عن السيئات.",
    lesson: "كل الناس يتوبون. أنت لست وحدك في هذا الطريق.",
  },
];

type AudioPayload = 
  | { type: "story"; story: string; lesson: string }
  | { type: "hadith"; hadith: string; note: string };

function TTSPlayer({ payload }: { payload: AudioPayload }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const API_BASE = useMemo(() => getApiBase(), []);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioUrl) {
      audioRef.current?.play();
      return;
    }
    setStatus("loading");
    try {
      const body =
        payload.type === "story"
          ? { type: "story", story: payload.story, lesson: payload.lesson }
          : { type: "hadith", hadith: payload.hadith, note: payload.note };

      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`tts_failed_${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setAudioUrl(dataUrl);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioRef.current?.pause();
    setStatus("idle");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  if (status === "ready" && audioUrl) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <audio ref={audioRef} src={audioUrl} controls autoPlay className="h-8" />
        <button onClick={handleClose} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handlePlay}
      disabled={status === "loading"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
    >
      {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
      <span>استمع</span>
    </button>
  );
}

function VerseAudioPlayer({ surah, ayah }: { surah: number; ayah: number }) {
  const { quranReciterId } = useSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const url = reciterAudioUrl(surah, ayah, quranReciterId);

  const stopSelf = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setIsPlaying(false);
    if (activeGlobalAudio?.element === audio) activeGlobalAudio = null;
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (activeGlobalAudio?.element === audio) activeGlobalAudio = null;
    } else {
      if (activeGlobalAudio) activeGlobalAudio.stop();
      activeGlobalAudio = { element: audio, stop: stopSelf };
      try {
        if (isNativeApp()) {
          await setAudioSrc(audio, url);
        } else {
          audio.src = url;
        }
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("[RajaaLib] Audio error:", e);
        if (activeGlobalAudio?.element === audio) activeGlobalAudio = null;
        setIsPlaying(false);
      }
    }
  };

  const reciterName = QURAN_RECITERS.find(r => r.id === quranReciterId)?.name || "القارئ";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" onEnded={stopSelf} />
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
          isPlaying
            ? "bg-primary/15 border-primary/30 text-primary"
            : "bg-muted/60 border-border text-muted-foreground hover:text-primary hover:border-primary/30"
        }`}
        style={isPlaying ? { borderColor: "rgba(200,168,75,0.35)", color: ACCENT } : undefined}
      >
        {isPlaying ? <Pause size={14} /> : <Headphones size={14} />}
        <span>{isPlaying ? "إيقاف" : "استمع"}</span>
      </button>
      <span className="hidden sm:inline text-[10px] text-muted-foreground" style={{ maxWidth: 140 }}>
        {reciterName}
      </span>
    </div>
  );
}

export default function RajaaLibrary() {
  const { quranReciterId } = useSettings();
  const [activeTab, setActiveTab] = useState<"verses" | "hadiths" | "stories">("verses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VerseCategory | "all">("all");
  const [expandedVerse, setExpandedVerse] = useState<number | null>(null);
  const [expandedHadith, setExpandedHadith] = useState<number | null>(null);
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  const reciterName = QURAN_RECITERS.find(r => r.id === quranReciterId)?.name || "القارئ";

  const categories: { key: VerseCategory | "all"; label: string; color: string }[] = [
    { key: "all", label: "الكل", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
    { key: "رجاء", label: "رجاء", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
    { key: "ترغيب", label: "ترغيب", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
    { key: "نعيم", label: "نعيم", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
    { key: "طمأنينة", label: "طمأنينة", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  ];

  const filteredVerses = QURAN_VERSES.filter(v => {
    const matchesSearch = searchQuery === "" || 
      v.arabic.includes(searchQuery) || 
      v.source.includes(searchQuery) ||
      v.tag.includes(searchQuery);
    const matchesCategory = selectedCategory === "all" || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredHadiths = HADITHS.filter(h => 
    searchQuery === "" || h.arabic.includes(searchQuery) || h.source.includes(searchQuery)
  );

  const filteredStories = STORIES.filter(s => 
    searchQuery === "" || s.story.includes(searchQuery) || s.title?.includes(searchQuery)
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <PageHeader
        title="مكتبة الرجاء"
        subtitle={`آيات وأحاديث وقصص تبعث الأمل · القارئ: ${reciterName}`}
        icon={<Sparkles size={20} style={{ color: ACCENT }} />}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div
          className="mt-3 rounded-2xl border bg-card p-3"
          style={{ borderColor: "rgba(200,168,75,0.14)" }}
        >
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث في الآيات والأحاديث والقصص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:outline-none"
            />
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {[
              { key: "verses", label: "الآيات", icon: BookOpen },
              { key: "hadiths", label: "الأحاديث", icon: Sparkles },
              { key: "stories", label: "القصص", icon: BookOpen },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all border ${
                  activeTab === key
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                }`}
                style={activeTab === key ? { borderColor: "rgba(200,168,75,0.28)", color: ACCENT } : undefined}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories (Verses only) */}
        {activeTab === "verses" && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === key
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                } ${selectedCategory === key ? color : ""}`}
                style={selectedCategory === key ? { borderColor: "rgba(200,168,75,0.22)" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "verses" && (
            <motion.div
              key="verses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 space-y-3"
            >
              {filteredVerses.map((verse) => (
                <motion.div
                  key={verse.id}
                  layout
                  className="rounded-2xl border bg-card overflow-hidden"
                  style={{ borderColor: "rgba(200,168,75,0.12)" }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                              style={{ borderColor: "rgba(200,168,75,0.22)", color: ACCENT, background: "rgba(200,168,75,0.10)" }}
                            >
                              {verse.tag}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">{verse.source}</span>
                          </div>
                          <button
                            onClick={() => setExpandedVerse(expandedVerse === verse.id ? null : verse.id)}
                            className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                          >
                            {expandedVerse === verse.id ? "إخفاء" : "شرح"}
                          </button>
                        </div>

                        <p
                          className="text-[18px] leading-[1.9] text-foreground font-medium"
                          style={{ fontFamily: "'Amiri Quran', serif" }}
                          dir="rtl"
                        >
                          {verse.arabic}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <VerseAudioPlayer surah={verse.surah} ayah={verse.ayah} />
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedVerse === verse.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-muted/20"
                        style={{ borderColor: "rgba(200,168,75,0.08)" }}
                      >
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">
                            {verse.note}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "hadiths" && (
            <motion.div
              key="hadiths"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 space-y-3"
            >
              {filteredHadiths.map((hadith) => (
                <motion.div
                  key={hadith.id}
                  layout
                  className="rounded-2xl border bg-card overflow-hidden"
                  style={{ borderColor: "rgba(200,168,75,0.12)" }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                            style={{ borderColor: "rgba(200,168,75,0.22)", color: ACCENT, background: "rgba(200,168,75,0.10)" }}
                          >
                            {hadith.tag}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">{hadith.source}</span>
                        </div>

                        <p className="text-[16px] leading-[1.9] text-foreground font-medium" dir="rtl">
                          {hadith.arabic}
                        </p>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <TTSPlayer payload={{ type: "hadith", hadith: hadith.arabic, note: hadith.note }} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedHadith(expandedHadith === hadith.id ? null : hadith.id)}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        {expandedHadith === hadith.id ? "إخفاء الشرح" : "عرض الشرح"}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedHadith === hadith.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-muted/20"
                        style={{ borderColor: "rgba(200,168,75,0.08)" }}
                      >
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">
                            {hadith.note}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "stories" && (
            <motion.div
              key="stories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 space-y-3"
            >
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  layout
                  className="rounded-2xl border bg-card overflow-hidden"
                  style={{ borderColor: "rgba(200,168,75,0.12)" }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {story.title || "قصة"}
                          </h3>
                          <button
                            onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                            className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                          >
                            {expandedStory === story.id ? "إخفاء" : "اقرأ"}
                          </button>
                        </div>

                        <p
                          className={`text-sm text-muted-foreground leading-relaxed ${expandedStory === story.id ? "" : "line-clamp-2"}`}
                          dir="rtl"
                        >
                          {story.story}
                        </p>
                      </div>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <TTSPlayer payload={{ type: "story", story: story.story, lesson: story.lesson }} />
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedStory === story.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-muted/20"
                        style={{ borderColor: "rgba(200,168,75,0.08)" }}
                      >
                        <div className="p-4">
                          <p className="text-[11px] font-bold mb-1" style={{ color: ACCENT }}>الدرس:</p>
                          <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">
                            {story.lesson}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
