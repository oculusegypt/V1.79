import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Send, Mic, Play, Pause, Volume2, Loader2, StopCircle, BookOpen, Scale, ExternalLink, Heart, X, CheckSquare, Handshake, BookMarked, AlertTriangle, Sparkles, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { voicePending } from "@/lib/voice-pending";
import { getApiBase, isNativeApp } from "@/lib/api-base";

// ══════════════════════════════════════════
// VOICE PROFILES
// ══════════════════════════════════════════

const VOICE_PROFILES = [
  {
    id: "sheikh-calm",
    gender: "male" as const,
    name: "الشيخ الهادئ",
    desc: "صوت رجولي وقور بفصحى سليمة",
    emoji: "🕌",
    tag: "هادئ · فصحى",
  },
  {
    id: "wise-friend",
    gender: "male" as const,
    name: "الصاحب الحكيم",
    desc: "شاب ٣٥ سنة، دافئ وحكيم كصاحب",
    emoji: "🤝",
    tag: "ودود · طبيعي",
  },
  {
    id: "young-guide",
    gender: "male" as const,
    name: "المرشد الشاب",
    desc: "شاب حيوي وواضح ومُشجِّع",
    emoji: "✨",
    tag: "حيوي · مباشر",
  },
  {
    id: "wise-teacher",
    gender: "female" as const,
    name: "المعلمة الفاضلة",
    desc: "صوت أنثوي رزين بفصحى واضحة",
    emoji: "📚",
    tag: "هادئة · فصحى",
  },
  {
    id: "sister-caring",
    gender: "female" as const,
    name: "الأخت المتفهمة",
    desc: "شابة دافئة تتكلم بصدق وحنان",
    emoji: "💙",
    tag: "حنونة · طبيعية",
  },
  {
    id: "gentle-mentor",
    gender: "female" as const,
    name: "المرشدة الحنونة",
    desc: "ناعمة ومطمئنة تبثّ السكينة",
    emoji: "🌸",
    tag: "ناعمة · مريحة",
  },
];

const VOICE_PROFILE_STORAGE_KEY = "zakiy_voice_profile";
const DEFAULT_VOICE_PROFILE_ID = "wise-friend";

function VoiceSelectorSheet({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const males = VOICE_PROFILES.filter((p) => p.gender === "male");
  const females = VOICE_PROFILES.filter((p) => p.gender === "female");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#f7f5ef 0%,#fefefe 100%)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-stone-300" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-3 border-b border-stone-200/70 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "inherit" }}>
                اختر صوت زكي 🎙️
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">الصوت يُطبَّق على الردود القادمة</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Male section */}
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">رجالي</p>
              <div className="space-y-2">
                {males.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => { onSelect(profile.id); onClose(); }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all",
                        isSelected
                          ? "bg-emerald-50 border-2 border-emerald-400"
                          : "bg-white border-2 border-transparent hover:border-stone-200"
                      )}
                      style={{ boxShadow: isSelected ? "0 2px 12px rgba(5,150,105,0.15)" : "0 1px 4px rgba(0,0,0,0.06)" }}
                    >
                      <span className="text-2xl">{profile.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", isSelected ? "text-emerald-700" : "text-stone-800")}>
                            {profile.name}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                            isSelected
                              ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                              : "bg-stone-100 text-stone-500 border-stone-200"
                          )}>
                            {profile.tag}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug">{profile.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Female section */}
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">نسائي</p>
              <div className="space-y-2">
                {females.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => { onSelect(profile.id); onClose(); }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all",
                        isSelected
                          ? "bg-emerald-50 border-2 border-emerald-400"
                          : "bg-white border-2 border-transparent hover:border-stone-200"
                      )}
                      style={{ boxShadow: isSelected ? "0 2px 12px rgba(5,150,105,0.15)" : "0 1px 4px rgba(0,0,0,0.06)" }}
                    >
                      <span className="text-2xl">{profile.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", isSelected ? "text-emerald-700" : "text-stone-800")}>
                            {profile.name}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                            isSelected
                              ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                              : "bg-stone-100 text-stone-500 border-stone-200"
                          )}>
                            {profile.tag}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug">{profile.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-4" />
          </div>
        </motion.div>
      </motion.div>
  );
}

// ══════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════

interface MessageSegment {
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  segments?: MessageSegment[];
  timestamp: Date;
  suggestions?: string[];
  suggestionsLoading?: boolean;
}

interface ApiHistory { role: "user" | "assistant"; content: string; }

// ══════════════════════════════════════════
// QURAN HELPERS
// ══════════════════════════════════════════

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
    : `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalAyah}.mp3`;
}

function getSurahName(num: number): string {
  const names: Record<number, string> = {
    1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",
    6:"الأنعام",7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",
    11:"هود",12:"يوسف",13:"الرعد",14:"إبراهيم",15:"الحجر",
    16:"النحل",17:"الإسراء",18:"الكهف",19:"مريم",20:"طه",
    21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",25:"الفرقان",
    26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",
    31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",
    36:"يس",37:"الصافات",38:"ص",39:"الزمر",40:"غافر",
    41:"فصلت",42:"الشورى",43:"الزخرف",44:"الدخان",45:"الجاثية",
    46:"الأحقاف",47:"محمد",48:"الفتح",49:"الحجرات",50:"ق",
    51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",55:"الرحمن",
    56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",
    61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",
    66:"التحريم",67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",
    71:"نوح",72:"الجن",73:"المزمل",74:"المدثر",75:"القيامة",
    76:"الإنسان",77:"المرسلات",78:"النبأ",79:"النازعات",80:"عبس",
    81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",85:"البروج",
    86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",
    91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",
    96:"العلق",97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",
    101:"القارعة",102:"التكاثر",103:"العصر",104:"الهمزة",105:"الفيل",
    106:"قريش",107:"الماعون",108:"الكوثر",109:"الكافرون",110:"النصر",
    111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس",
  };
  return names[num] ?? `السورة ${num}`;
}

// ══════════════════════════════════════════
// ZAKIY AVATAR — الأفاتار الموحَّد للزكي
// ══════════════════════════════════════════

function ZakiyAvatar({ pulse = false }: { pulse?: boolean }) {
  return (
    <div className="relative flex-shrink-0 mb-0.5">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(5,150,105,0.25) 0%, transparent 70%)",
          transform: "scale(1.5)",
        }}
        animate={pulse ? { opacity: [0.4, 0.9, 0.4], scale: [1.4, 1.7, 1.4] } : { opacity: 0.6 }}
        transition={pulse ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
      />

      {/* Main avatar circle */}
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #065f46 0%, #047857 40%, #0d9488 100%)",
          boxShadow: pulse
            ? "0 0 0 2px rgba(255,255,255,0.9), 0 4px 16px rgba(5,150,105,0.5)"
            : "0 0 0 2px rgba(255,255,255,0.9), 0 3px 12px rgba(5,150,105,0.35)",
        }}
      >
        {/* Subtle geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Arabic letter ز */}
        <span
          className="relative z-10 text-white font-bold select-none leading-none"
          style={{
            fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
            fontSize: "20px",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            marginTop: "1px",
          }}
        >
          ز
        </span>
      </div>

      {/* Online indicator dot */}
      {!pulse && (
        <div
          className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-[2px] border-white"
          style={{ background: "#22c55e" }}
        />
      )}

      {/* Recording/thinking pulse ring */}
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: "rgba(5,150,105,0.6)" }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// STARTER QUESTIONS
// ══════════════════════════════════════════

const STARTER_QUESTIONS = [
  "إزاي أتوب توبة صادقة؟",
  "أنا بعيد عن ربنا، من فين أبدأ؟",
  "عملت ذنب كبير، ربنا هيسامحني؟",
  "إزاي أثبت على الطاعة؟",
  "أنا بحس بوحشة روحية، أعمل إيه؟",
  "الاستغفار بيتقبل منين؟",
];

// ══════════════════════════════════════════
// GREETING
// ══════════════════════════════════════════

const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "أهلاً يا صاحبي! 🌿 أنا الزكي — مش بوت رسمي، أنا صاحبك اللي بيعرف دينه.\n\nابعت صوتك أو اكتب — أنا هنا أسمعك بكل قلبي.\nوالكلام اللي بيننا يفضل بيننا.",
  timestamp: new Date(),
};

// ══════════════════════════════════════════
// TONE BADGE
// ══════════════════════════════════════════

const TONE_STYLES: Array<{ keywords: string[]; emoji: string; className: string }> = [
  { keywords: ["همس", "هامس", "سر"], emoji: "🤫", className: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300/50" },
  { keywords: ["جدية", "جاد", "خطير"], emoji: "🎯", className: "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-300/50" },
  { keywords: ["حماس", "فرحة", "فرح", "نار"], emoji: "🔥", className: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300/50" },
  { keywords: ["ضحكة", "هزار", "تريق"], emoji: "😄", className: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-300/50" },
  { keywords: ["دفء", "حنان", "دافئ"], emoji: "💙", className: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300/50" },
  { keywords: ["تأمل", "هدوء", "هادئ"], emoji: "🌙", className: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300/50" },
];

function getToneStyle(text: string) {
  for (const style of TONE_STYLES) {
    if (style.keywords.some((k) => text.includes(k))) return style;
  }
  return { emoji: "💬", className: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300/50" };
}

function ToneBadge({ text }: { text: string }) {
  const style = getToneStyle(text);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border mx-0.5 align-middle",
      style.className
    )}>
      <span>{style.emoji}</span>
      <span className="font-sans">{text}</span>
    </span>
  );
}

// ══════════════════════════════════════════
// FORMATTED TEXT RENDERER (with word highlighting)
// ══════════════════════════════════════════

function FormattedText({ text, isActivePlaying }: { text: string; isActivePlaying?: boolean }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  const BULLET_EMOJI_PATTERN = /^([✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊])/;
  const NUMBERED_AR = /^([١٢٣٤٥٦٧٨٩٠]+)[.\-\)]/;
  const NUMBERED_EN = /^(\d+)[.\-\)]/;
  const SECTION_HEADER = /^〔(.+)〕$/;
  const SEPARATOR = /^[═─━─]+$/;

  function arabicNumToInt(s: string): number {
    return parseInt(s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
  }

  function renderInline(raw: string): React.ReactNode[] {
    const stripped = raw.replace(/\(\s*ب[^)]*\)/g, "").replace(/\s{2,}/g, " ");
    const parts: React.ReactNode[] = [];
    const boldRe = /\*\*([^*]+)\*\*/g;
    let cursor = 0;
    let m: RegExpExecArray | null;

    function renderPart(t: string, bold: boolean, keyBase: number): React.ReactNode[] {
      if (bold) return [<strong key={keyBase} className="font-bold text-foreground">{t}</strong>];
      return [<span key={keyBase}>{t}</span>];
    }

    while ((m = boldRe.exec(stripped)) !== null) {
      if (m.index > cursor) parts.push(...renderPart(stripped.slice(cursor, m.index), false, cursor));
      parts.push(...renderPart(m[1]!, true, m.index + 10000));
      cursor = m.index + m[0].length;
    }
    if (cursor < stripped.length) parts.push(...renderPart(stripped.slice(cursor), false, cursor + 20000));
    return parts;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();

    if (!line) { elements.push(<div key={i} className="h-1.5" />); i++; continue; }
    if (SEPARATOR.test(line)) { i++; continue; }

    const sectionMatch = SECTION_HEADER.exec(line);
    if (sectionMatch) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] font-bold text-muted-foreground tracking-widest px-2">{sectionMatch[1]}</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>
      );
      i++; continue;
    }

    if (NUMBERED_AR.test(line) || NUMBERED_EN.test(line)) {
      const listItems: string[] = [];
      let startNum = 1;
      let firstItem = true;
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (!l) { i++; continue; }
        if (!NUMBERED_AR.test(l) && !NUMBERED_EN.test(l)) break;
        i++;
        if (firstItem) {
          const arMatch = NUMBERED_AR.exec(l);
          const enMatch = NUMBERED_EN.exec(l);
          const numStr = arMatch ? arMatch[1]! : enMatch ? enMatch[1]! : "1";
          const parsed = /[١٢٣٤٥٦٧٨٩٠]/.test(numStr) ? arabicNumToInt(numStr) : parseInt(numStr);
          startNum = isNaN(parsed) ? 1 : parsed;
          firstItem = false;
        }
        const content = l.replace(/^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)]\s*/, "");
        if (content.trim()) listItems.push(content);
      }
      if (listItems.length > 0) {
        elements.push(
          <ol key={`list-${i}`} className="space-y-2 my-2.5 pr-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[13px] leading-relaxed">
                <span
                  className="flex-shrink-0 w-[22px] h-[22px] rounded-full text-white text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-sm"
                  style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
                >
                  {startNum + idx}
                </span>
                <span className="flex-1 pt-0.5">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      continue;
    }

    if (line.startsWith("•") || line.startsWith("·") || BULLET_EMOJI_PATTERN.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (l.startsWith("•") || l.startsWith("·") || BULLET_EMOJI_PATTERN.test(l)) {
          const emojiMatch = BULLET_EMOJI_PATTERN.exec(l);
          const icon = emojiMatch ? emojiMatch[1] : "•";
          const content = l.replace(/^[•·]\s*/, "").replace(/^[✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊]\s*/, "");
          listItems.push(`${icon}|||${content}`);
          i++;
        } else break;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => {
            const [icon, ...rest] = item.split("|||");
            const content = rest.join("|||");
            const isBullet = icon === "•" || icon === "·";
            return (
              <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="flex-shrink-0 mt-0.5 text-base">
                  {isBullet ? <span className="text-teal-500 font-bold">•</span> : icon}
                </span>
                <span className="flex-1">{renderInline(content!)}</span>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={i} className="text-[13px] leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }

  return (
    <div className="space-y-0.5">
      {elements}
    </div>
  );
}

// ══════════════════════════════════════════
// QURAN CARD
// ══════════════════════════════════════════

function QuranCard({
  seg, isActive, isPlaying, onEnded, onManualToggle, reciterId,
}: {
  seg: MessageSegment;
  isActive: boolean;
  isPlaying: boolean;
  onEnded: () => void;
  onManualToggle: () => void;
  reciterId: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [verseText, setVerseText] = useState<string>(seg.text);
  const [verseLoading, setVerseLoading] = useState(true);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  // Fetch the actual verse text from the official Quran API (never rely on AI text)
  useEffect(() => {
    setVerseLoading(true);
    const globalAyah = toGlobalAyah(seg.surah!, seg.ayah!);
    fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/quran-uthmani`)
      .then(r => r.json())
      .then((data: { data?: { text?: string } }) => {
        if (data?.data?.text) setVerseText(data.data.text);
      })
      .catch(() => { /* keep seg.text as fallback */ })
      .finally(() => setVerseLoading(false));
  }, [seg.surah, seg.ayah]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = reciterAudioUrl(seg.surah!, seg.ayah!, reciterId);
    audioRef.current = audio;
    setAudioError(false);
    audio.onended = () => onEndedRef.current();
    audio.onerror = () => { setAudioError(true); onEndedRef.current(); };
    return () => { audio.pause(); audio.src = ""; audio.onended = null; audio.onerror = null; audioRef.current = null; };
  }, [seg.surah, seg.ayah, reciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive && isPlaying) {
      setAudioError(false);
      audio.play().catch((e: unknown) => {
        if (e instanceof Error && e.name === "NotAllowedError") {
          setIsPlaying_noop();
        }
      });
    } else {
      audio.pause();
      if (!isActive) audio.currentTime = 0;
    }
  }, [isActive, isPlaying]);

  // no-op to avoid lint warning (isPlaying state is managed by parent)
  function setIsPlaying_noop() {}

  const reciterName = QURAN_RECITERS.find(r => r.id === reciterId)?.nameAr ?? "القرآن الكريم";

  return (
    <div
      className="my-3 rounded-2xl overflow-hidden"
      style={{
        boxShadow: "0 4px 24px rgba(5,150,105,0.15), 0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: "linear-gradient(135deg,#065f46,#0d9488)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
          >
            <BookOpen size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-emerald-200 leading-none mb-1 truncate font-medium">
              {reciterName}
            </div>
            <div className="text-[13px] font-bold text-white leading-none">
              سورة {getSurahName(seg.surah!)} — آية {seg.ayah}
            </div>
          </div>
        </div>

        <button
          onClick={onManualToggle}
          className="shrink-0 flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-full transition-all font-bold active:scale-95"
          style={
            isActive && isPlaying
              ? { background: "rgba(255,255,255,0.95)", color: "#065f46" }
              : { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }
          }
        >
          {isActive && isPlaying
            ? <><Pause size={11} strokeWidth={2.5} />إيقاف</>
            : <><Play  size={11} strokeWidth={2.5} />استمع</>
          }
        </button>
      </div>

      {/* ── Body ── */}
      <div
        className="relative px-5 pb-5 pt-6 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#fffbf0,#fef9f0,#fffdf5)" }}
      >
        {/* Decorative Arabic brackets */}
        <span className="pointer-events-none select-none absolute -top-2 left-3 text-[80px] leading-none font-serif" style={{ color: "rgba(217,119,6,0.15)" }}>﴿</span>
        <span className="pointer-events-none select-none absolute -bottom-5 right-3 text-[80px] leading-none font-serif" style={{ color: "rgba(217,119,6,0.15)" }}>﴾</span>

        {/* Golden top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg,transparent,rgba(217,119,6,0.4),transparent)" }} />

        {verseLoading ? (
          <div className="flex justify-center items-center gap-2 py-7">
            {[0, 150, 300].map((d) => (
              <motion.span key={d} className="w-2 h-2 bg-emerald-400 rounded-full block"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d / 1000 }}
              />
            ))}
          </div>
        ) : (
          <p
            className="quran-text text-right leading-[2.2] relative z-10 px-2"
            style={{ color: "#1c1917", fontSize: "1.05rem" }}
          >
            ﴿{verseText}﴾
          </p>
        )}

        {/* Waveform */}
        {isActive && isPlaying && (
          <div className="flex gap-[3px] items-end justify-center mt-4 h-5 relative z-10">
            {[4,7,11,8,5,10,7,4,9,6,11,7,5].map((h, k) => (
              <span
                key={k}
                className="quran-wave-bar w-[3px] rounded-full"
                style={{
                  height: `${h}px`,
                  background: "#059669",
                  animation: "quranWave 0.8s ease-in-out infinite alternate",
                  animationDelay: `${k * 65}ms`,
                }}
              />
            ))}
          </div>
        )}

        {audioError && (
          <p className="text-[10px] text-red-400/80 text-center mt-2 relative z-10">تعذّر تشغيل الصوت</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FATWA CARD
// ══════════════════════════════════════════

function FatwaCard({ seg }: { seg: MessageSegment }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (seg.text?.length ?? 0) > 120 ? seg.text!.slice(0, 120) + "..." : seg.text;

  return (
    <div
      className="my-2.5 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(5,150,105,0.1), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#047857,#0f766e)" }}
      >
        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Scale size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-bold text-white tracking-wide">حكم شرعي</span>
        {seg.source && <span className="mr-auto text-[10px] text-white/65 truncate">📚 {seg.source}</span>}
      </div>
      <div className="bg-white px-4 py-3.5">
        <p className="text-[13px] leading-relaxed text-stone-700 text-right">
          {expanded ? seg.text : preview}
        </p>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
          {(seg.text?.length ?? 0) > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all active:scale-95"
              style={{ background: "rgba(5,150,105,0.08)", color: "#047857" }}
            >
              {expanded ? "إخفاء ↑" : "عرض الكامل ↓"}
            </button>
          )}
          {seg.url && (
            <a href={seg.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mr-auto transition-all"
              style={{ background: "rgba(5,150,105,0.08)", color: "#047857" }}
            >
              <ExternalLink size={11} /> المصدر
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PROMISE CARD
// ══════════════════════════════════════════

function PromiseCard({ seg, sessionId }: { seg: MessageSegment; sessionId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handlePromise() {
    setState("loading");
    try {
      await fetch(`${getApiBase()}/zakiy/promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, promiseText: seg.text }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 20px rgba(217,119,6,0.18), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(245,158,11,0.3)" }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#b45309,#d97706)" }}
      >
        <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Handshake size={14} className="text-white" />
        </div>
        <span className="text-[13px] font-bold text-white tracking-wide">وعد أمام الله</span>
        <span className="mr-auto text-lg">🤝</span>
      </div>
      <div className="bg-white px-4 py-5">
        <div
          className="relative px-4 py-3 rounded-xl mb-4 text-right"
          style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <span className="absolute top-1 right-2 text-amber-200/60 text-3xl font-serif leading-none">"</span>
          <p className="text-[13px] leading-relaxed text-stone-700 font-medium relative z-10 pt-2">
            {seg.text}
          </p>
        </div>
        {state === "done" ? (
          <div
            className="flex items-center justify-center gap-2 rounded-xl py-3"
            style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
          >
            <CheckSquare size={17} className="text-emerald-600" strokeWidth={2.5} />
            <span className="text-[13px] font-bold text-emerald-800">وعدتَ الله — والله شاهد على وعدك</span>
          </div>
        ) : (
          <button
            onClick={handlePromise}
            disabled={state === "loading"}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 font-bold text-[13px] transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#b45309,#d97706)", boxShadow: "0 2px 10px rgba(180,83,9,0.3)" }}
          >
            {state === "loading"
              ? <><Loader2 size={14} className="animate-spin" /> لحظة...</>
              : <><Handshake size={14} /> أعدك بالله</>
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// SURAH LINK CARD
// ══════════════════════════════════════════

function SurahLinkCard({ seg }: { seg: MessageSegment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2.5 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 2px 14px rgba(13,148,136,0.12), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(13,148,136,0.22)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#0f766e,#0891b2)" }}
      >
        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <BookMarked size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-bold text-white tracking-wide">السورة كاملة</span>
      </div>
      <div className="bg-white px-4 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-stone-800">سورة {seg.text}</p>
          <p className="text-[11px] text-stone-500 mt-0.5">تابع من الآية {seg.ayah}</p>
        </div>
        <a
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white text-[12px] px-4 py-2 rounded-xl font-bold shrink-0 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#0f766e,#0891b2)", boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}
        >
          <ExternalLink size={12} />
          افتح
        </a>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// IMPRESSION PANEL
// ══════════════════════════════════════════

function ImpressionPanel({ impression, onClose }: { impression: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 20px rgba(225,29,72,0.15), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(251,113,133,0.3)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#be123c,#e11d48)" }}
      >
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-white fill-white/70" />
          <span className="text-[12px] font-bold text-white tracking-wide">انطباعي عنك</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">
          <X size={14} />
        </button>
      </div>
      <div className="bg-white px-4 py-4">
        <p className="text-[13px] leading-relaxed text-stone-700 text-right whitespace-pre-wrap">
          {impression}
        </p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// SUGGESTION CARDS (outside bubble, like starter cards)
// ══════════════════════════════════════════

function SuggestionCards({ suggestions, loading, onSelect }: {
  suggestions?: string[];
  loading?: boolean;
  onSelect: (q: string) => void;
}) {
  if (!loading && (!suggestions || suggestions.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 pr-9"
    >
      {loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <Loader2 size={11} className="animate-spin" />
          <span>يفكر في أسئلة...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions!.map((q, i) => {
            const isContinueBtn = /^(continue|تابع|كمّل|كمل|استمر)/i.test(q.trim());
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSelect(q)}
                className="text-right text-[11.5px] px-3.5 py-2 rounded-full transition-all active:scale-95 leading-snug font-semibold"
                style={isContinueBtn
                  ? { background: "linear-gradient(135deg,#059669,#0d9488)", color: "#fff", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }
                  : { background: "#fff", color: "#374151", border: "1.5px solid rgba(5,150,105,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                }
              >
                {isContinueBtn && <span className="ml-1">▶</span>}
                {q}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════
// STARTER CARDS
// ══════════════════════════════════════════

const STARTER_ICONS = ["🌿", "🕌", "💚", "⚡", "🌙", "🤲"];

function StarterCards({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="px-1 py-3"
    >
      <div className="flex items-center gap-2 mb-3.5 px-1">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,rgba(5,150,105,0.25))" }} />
        <span className="text-[11px] font-bold text-stone-400 tracking-wider">ابدأ بسؤال</span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,rgba(5,150,105,0.25),transparent)" }} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {STARTER_QUESTIONS.map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.055 }}
            onClick={() => onSelect(q)}
            className="text-right transition-all active:scale-95 leading-snug overflow-hidden rounded-2xl"
            style={{
              background: "#fff",
              border: "1.5px solid rgba(5,150,105,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="h-[3px] w-full"
              style={{ background: `linear-gradient(90deg,${["#059669","#0d9488","#10b981","#065f46","#0891b2","#047857"][i % 6]},transparent)` }}
            />
            <div className="px-3.5 pt-2.5 pb-3">
              <span className="text-lg block mb-1">{STARTER_ICONS[i % STARTER_ICONS.length]}</span>
              <span className="text-[12px] font-semibold text-stone-700 leading-snug block">{q}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// BOT MESSAGE BODY — sequential segment playback
// ══════════════════════════════════════════

function BotMessageBody({
  msg, onImpressionToggle, impressionOpen, impressionText, sessionId, history, isAutoPlayTarget, onAudioComplete,
}: {
  msg: Message;
  onImpressionToggle: (id: string, text?: string) => void;
  impressionOpen: boolean;
  impressionText?: string;
  sessionId: string;
  history: ApiHistory[];
  isAutoPlayTarget: boolean;
  onAudioComplete: () => void;
}) {
  const { autoPlayBotAudio, autoPlayQuran, quranReciterId } = useSettings();

  // ── Playback state machine ──
  // playIdx: which segment index is currently "active" (-1 = stopped)
  // isPlaying: whether we are currently playing (vs paused)
  const [playIdx, setPlayIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoStartedRef = useRef(false);

  const textAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

  const segments = msg.segments ?? [];

  // Helper: advance to next segment
  const advanceTo = useCallback((nextIdx: number) => {
    const seg = segments[nextIdx];
    if (!seg) {
      setPlayIdx(-1);
      setIsPlaying(false);
      onAudioComplete();
      return;
    }

    // Skip fatwa, promise, surah-link segments (no audio)
    if (seg.type === "fatwa" || seg.type === "promise" || seg.type === "surah-link") {
      advanceTo(nextIdx + 1); return;
    }

    // Quran segments play automatically with reciter audio in sequence
    setPlayIdx(nextIdx);
    setIsPlaying(true);
  }, [segments, onAudioComplete]);

  // Auto-play when this message is the designated auto-play target
  useEffect(() => {
    if (!isAutoPlayTarget || autoStartedRef.current) return;
    const hasTextAudio = segments.some(s => s.type === "text" && s.audioBase64);
    const hasQuran = segments.some(s => s.type === "quran");
    const shouldStart = (autoPlayBotAudio && hasTextAudio) || (autoPlayQuran && hasQuran);
    if (!shouldStart) {
      onAudioComplete();
      return;
    }
    autoStartedRef.current = true;
    const t = setTimeout(() => advanceTo(0), 400);
    return () => clearTimeout(t);
  }, [isAutoPlayTarget, autoPlayBotAudio, autoPlayQuran, segments]);

  // When a segment ends, move to next
  const handleSegmentEnd = useCallback((idx: number) => {
    advanceTo(idx + 1);
  }, [advanceTo]);

  // Text segment audio playback
  useEffect(() => {
    if (playIdx === -1 || !isPlaying) return;
    const seg = segments[playIdx];
    if (!seg || seg.type !== "text") return;
    if (!seg.audioBase64) { handleSegmentEnd(playIdx); return; }

    let audio = textAudioRefs.current[playIdx];
    if (!audio) {
      const binary = atob(seg.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/flac" }));
      audio = new Audio(url);
      textAudioRefs.current[playIdx] = audio;
    }

    audio.onended = () => { handleSegmentEnd(playIdx); };
    audio.play().catch((e: unknown) => {
      if (e instanceof Error && e.name === "NotAllowedError") {
        // Browser blocked autoplay — stop and let user tap the play button manually
        setIsPlaying(false);
      } else {
        // Actual audio error (bad format, network) — skip to next
        handleSegmentEnd(playIdx);
      }
    });

    return () => { audio?.pause(); };
  }, [playIdx, isPlaying]);

  // Manual play/pause toggle for entire message
  function handlePlayToggle() {
    if (segments.length === 0) return;
    if (playIdx !== -1 && isPlaying) {
      // Pause
      if (segments[playIdx]?.type === "text") {
        textAudioRefs.current[playIdx]?.pause();
      }
      setIsPlaying(false);
    } else if (playIdx !== -1 && !isPlaying) {
      // Resume
      if (segments[playIdx]?.type === "text") {
        textAudioRefs.current[playIdx]?.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      // Start from beginning
      advanceTo(0);
    }
  }

  const hasAudio = segments.some(s => s.type === "text" && s.audioBase64);
  const isCurrentlyPlaying = playIdx !== -1 && isPlaying;

  // ── Hadi Tasks ──
  const [hadiLoading, setHadiLoading] = useState(false);
  const [hadiDone, setHadiDone] = useState(false);
  const [, navigate] = useLocation();

  const hasSteps = (() => {
    const fullText = segments.map(s => s.text).join("\n");
    return /[\u0661-\u0669][\.\-\)]|^[1-9][\.\-\)]/m.test(fullText) || /^[\u0661-\u0669][\.\-\)]/m.test(fullText);
  })();

  async function handleHadiTasks() {
    setHadiLoading(true);
    try {
      const fullText = segments.map(s => s.text).join("\n").slice(0, 2000);
      const res = await fetch(`${getApiBase()}/hadi-tasks/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الاستخراج");
      setHadiDone(true);
      setTimeout(() => navigate("/hadi-tasks"), 600);
    } catch {
      setHadiDone(false);
    } finally {
      setHadiLoading(false);
    }
  }

  // ── Impression ──
  const [impressionLoading, setImpressionLoading] = useState(false);

  async function handleImpressionClick() {
    if (impressionOpen) { onImpressionToggle(msg.id); return; }
    if (impressionText) { onImpressionToggle(msg.id, impressionText); return; }
    setImpressionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/zakiy/impression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      onImpressionToggle(msg.id, data.impression ?? "لسه بتعرف بعضنا — كمّل الحديث وهشوفك أكتر!");
    } catch {
      onImpressionToggle(msg.id, "مش قدرت أوصلك الانطباع دلوقتي — جرّب تاني بعد شوية.");
    } finally {
      setImpressionLoading(false);
    }
  }

  // Render: if no segments (greeting or old format), render raw text
  if (!segments.length) {
    return <FormattedText text={msg.text} />;
  }

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === "quran") {
          return (
            <QuranCard
              key={i}
              seg={seg}
              isActive={playIdx === i}
              isPlaying={playIdx === i && isPlaying}
              onEnded={() => handleSegmentEnd(i)}
              reciterId={quranReciterId}
              onManualToggle={() => {
                if (playIdx === i && isPlaying) {
                  setIsPlaying(false);
                } else {
                  setPlayIdx(i);
                  setIsPlaying(true);
                }
              }}
            />
          );
        }
        if (seg.type === "fatwa") return <FatwaCard key={i} seg={seg} />;
        if (seg.type === "promise") return <PromiseCard key={i} seg={seg} sessionId={sessionId} />;
        if (seg.type === "surah-link") return <SurahLinkCard key={i} seg={seg} />;
        return (
          <FormattedText
            key={i}
            text={seg.text}
            isActivePlaying={playIdx === i && isPlaying}
          />
        );
      })}
      {/* Audio & impression controls */}
      <div className="flex items-center gap-2 mt-3.5 flex-wrap">
        {hasAudio && (
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-3.5 py-1.5 rounded-full transition-all active:scale-95"
            style={isCurrentlyPlaying
              ? { background: "linear-gradient(135deg,#0d9488,#059669)", color: "#fff", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }
              : { background: "rgba(5,150,105,0.08)", color: "#047857", border: "1.5px solid rgba(5,150,105,0.2)" }
            }
          >
            {isCurrentlyPlaying ? <><Pause size={11} strokeWidth={2.5} /> إيقاف</> : <><Volume2 size={11} strokeWidth={2} /> استمع</>}
          </button>
        )}

        {msg.id !== "greeting" && (
          <button
            onClick={handleImpressionClick}
            disabled={impressionLoading}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-3.5 py-1.5 rounded-full transition-all active:scale-95"
            style={impressionOpen
              ? { background: "linear-gradient(135deg,#be123c,#e11d48)", color: "#fff", boxShadow: "0 2px 8px rgba(225,29,72,0.3)" }
              : { background: "rgba(225,29,72,0.07)", color: "#be123c", border: "1.5px solid rgba(225,29,72,0.2)" }
            }
          >
            {impressionLoading
              ? <><Loader2 size={11} className="animate-spin" /> لحظة...</>
              : <><Heart size={11} strokeWidth={2} className={impressionOpen ? "fill-white" : ""} /> انطباعي</>
            }
          </button>
        )}

        {msg.id !== "greeting" && hasSteps && (
          <button
            onClick={handleHadiTasks}
            disabled={hadiLoading || hadiDone}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-3.5 py-1.5 rounded-full transition-all active:scale-95"
            style={hadiDone
              ? { background: "linear-gradient(135deg,#059669,#0d9488)", color: "#fff" }
              : { background: "rgba(5,150,105,0.07)", color: "#065f46", border: "1.5px solid rgba(5,150,105,0.18)" }
            }
          >
            {hadiLoading
              ? <><Loader2 size={11} className="animate-spin" /> جاري...</>
              : hadiDone
                ? <><CheckSquare size={11} strokeWidth={2.5} /> تمت الإضافة!</>
                : <><CheckSquare size={11} strokeWidth={2} /> مهام هادي</>
            }
          </button>
        )}
      </div>
      <AnimatePresence>
        {impressionOpen && impressionText && (
          <ImpressionPanel impression={impressionText} onClose={() => onImpressionToggle(msg.id)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════
// AUDIO HELPERS
// ══════════════════════════════════════════


// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════

export default function ZakiyPage() {
  const API_BASE = getApiBase();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [impressionOpenId, setImpressionOpenId] = useState<string | null>(null);
  const [impressionTexts, setImpressionTexts] = useState<Record<string, string>>({});
  const [riskAlert, setRiskAlert] = useState<{ level: "medium" | "high"; message: string; sign: string | null } | null>(null);
  const [riskDismissed, setRiskDismissed] = useState(false);
  const [anniversaryMilestone, setAnniversaryMilestone] = useState<string | null>(null);
  const [autoPlayMsgId, setAutoPlayMsgId] = useState<string | null>(null);
  const autoPlayQueueRef = useRef<string[]>([]);
  const [voiceProfileId, setVoiceProfileId] = useState<string>(
    () => localStorage.getItem(VOICE_PROFILE_STORAGE_KEY) ?? DEFAULT_VOICE_PROFILE_ID
  );
  const [voiceSelectorOpen, setVoiceSelectorOpen] = useState(false);

  const [interimText, setInterimText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const sessionId = getSessionId();
  const hasUserMessages = messages.some((m) => m.role === "user");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  function handleVoiceProfileSelect(id: string) {
    setVoiceProfileId(id);
    localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, id);
  }

  const currentVoiceProfile = VOICE_PROFILES.find((p) => p.id === voiceProfileId) ?? VOICE_PROFILES[1]!;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Read voice input on mount — handles the "navigating FROM another page" case.
  // Uses a module-level variable (voicePending) as the primary source so it works
  // even across React Strict Mode double-mounts. localStorage is a backup.
  // The clear timer is intentionally cancelled on Strict-Mode unmount so the
  // second mount can still read the value.
  useEffect(() => {
    const text = voicePending.get() || localStorage.getItem("zakiy_voice_input") || "";
    if (!text) return;
    setInput(text);
    const clearT = window.setTimeout(() => {
      voicePending.clear();
      localStorage.removeItem("zakiy_voice_input");
    }, 300);
    const focusT = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => {
      window.clearTimeout(clearT);
      window.clearTimeout(focusT);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for the custom event — fires when Zakiy is already mounted (same page re-use).
  // Also covers the "navigated here" case if mount effect ran before voicePending was set.
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (!text) return;
      voicePending.clear();
      localStorage.removeItem("zakiy_voice_input");
      setInput(text);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("zakiy:voice-input", handler);
    return () => window.removeEventListener("zakiy:voice-input", handler);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();

    async function checkAnniversaryAndRisk() {
      try {
        const [annRes, riskRes] = await Promise.all([
          fetch(`${API_BASE}/zakiy/anniversary?sessionId=${sessionId}`, { signal: controller.signal }),
          fetch(`${API_BASE}/zakiy/risk-check?sessionId=${sessionId}`, { signal: controller.signal }),
        ]);
        const [annData, riskData] = await Promise.all([
          annRes.json() as Promise<{ anniversary: { milestone: string; message: string } | null }>,
          riskRes.json() as Promise<{ risk: { level: "medium" | "high"; message: string; sign: string | null } | null }>,
        ]);

        if (annData.anniversary?.message) {
          const { milestone, message } = annData.anniversary;
          setAnniversaryMilestone(milestone);
          const annMsg: Message = {
            id: "anniversary-" + Date.now(),
            role: "bot",
            text: message,
            segments: [{ type: "text", text: message }],
            timestamp: new Date(),
            suggestions: [],
            suggestionsLoading: false,
          };
          setMessages((prev) => [...prev, annMsg]);
        }

        if (riskData.risk?.level === "medium" || riskData.risk?.level === "high") {
          setRiskAlert({
            level: riskData.risk.level,
            message: riskData.risk.message,
            sign: riskData.risk.sign,
          });
        }
      } catch { /* ignore — background check */ }
    }

    checkAnniversaryAndRisk();
    return () => controller.abort();
  }, [sessionId, API_BASE]);

  function buildHistory(): ApiHistory[] {
    return messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.text }));
  }

  function handleImpressionToggle(id: string, text?: string) {
    if (impressionOpenId === id) {
      setImpressionOpenId(null);
    } else {
      if (text) setImpressionTexts((prev) => ({ ...prev, [id]: text }));
      setImpressionOpenId(id);
    }
  }

  async function fetchSuggestions(history: ApiHistory[], msgId: string) {
    try {
      const res = await fetch(`${API_BASE}/zakiy/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: data.suggestions ?? [], suggestionsLoading: false }
          : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: [], suggestionsLoading: false }
          : m)
      );
    }
  }

  function handleAutoPlayComplete() {
    const next = autoPlayQueueRef.current.shift();
    setAutoPlayMsgId(next ?? null);
  }

  function addBotMessage(text: string, segments?: MessageSegment[]) {
    const id = Date.now().toString();
    const msg: Message = {
      id,
      role: "bot",
      text,
      segments: segments ?? [],
      timestamp: new Date(),
      suggestions: [],
      suggestionsLoading: true,
    };
    autoPlayQueueRef.current = [];
    setAutoPlayMsgId(id);
    setMessages((prev) => [...prev, msg]);
    const currentHistory = buildHistory();
    fetchSuggestions([...currentHistory, { role: "assistant", content: text }], msg.id);
  }

  function handleBotResponse(text: string, segments?: MessageSegment[]) {
    addBotMessage(text, segments);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "u", role: "user", text, timestamp: new Date() },
    ]);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const trimmed = text.trim();

    const history = buildHistory();
    addUserMessage(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = "42px";
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/zakiy/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, sessionId, voiceProfile: voiceProfileId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      handleBotResponse(data.response, data.segments);
    } catch {
      addBotMessage("عذراً يا صاحبي، في مشكلة تقنية. جرّب تاني بعد شوية.");
    } finally {
      setLoading(false);
    }
  }

  async function startVoiceInputNative() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        addBotMessage("متصفح التطبيق لا يدعم الميكروفون. جرّب تحديث التطبيق أو استخدم Chrome.");
        return;
      }
      if (typeof (window as any).MediaRecorder === "undefined") {
        addBotMessage("التسجيل الصوتي غير مدعوم على جهازك داخل التطبيق. جرّب تحديث WebView/Chrome.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const pickMimeType = () => {
        const MR = (window as any).MediaRecorder as typeof MediaRecorder | undefined;
        const candidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
        ];
        for (const t of candidates) {
          try {
            if (MR?.isTypeSupported?.(t)) return t;
          } catch {}
        }
        return "";
      };

      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType });

          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("file_reader_failed"));
            reader.onload = () => {
              const result = String(reader.result ?? "");
              const commaIdx = result.indexOf(",");
              if (commaIdx === -1) return reject(new Error("base64_parse_failed"));
              resolve(result.slice(commaIdx + 1));
            };
            reader.readAsDataURL(blob);
          });

          setLoading(true);
          const history = buildHistory();

          const res = await fetch(`${API_BASE}/zakiy/voice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: b64, history, sessionId, voiceProfile: voiceProfileId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error((data as { error?: string }).error ?? "voice_failed");

          const transcript = (data as { transcript?: string }).transcript ?? "";
          if (transcript.trim()) addUserMessage(transcript.trim());

          const response = (data as { response?: string }).response ?? "";
          const segments = (data as { segments?: MessageSegment[] }).segments;
          if (response) handleBotResponse(response, segments);
        } catch (e) {
          console.error("[Zakiy] Voice input failed:", e);
          addBotMessage("ما قدرت أسمعك — تأكد من السماح بالميكروفون وجرّب مرة ثانية.");
        } finally {
          setLoading(false);
          setRecording(false);
        }
      };

      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error("[Zakiy] getUserMedia/MediaRecorder failed:", e);
      addBotMessage("تعذّر الوصول للميكروفون. تأكد من منح الإذن.");
    }
  }

  function startVoiceInput() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      if (isNativeApp()) {
        void startVoiceInputNative();
        return;
      }
      addBotMessage("متصفحك لا يدعم الإدخال الصوتي — جرّب Chrome أو Edge.");
      return;
    }

    const recognition: SpeechRecognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "ar-EG";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => { setRecording(false); setInterimText(""); };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setRecording(false);
      setInterimText("");
      const err = e.error as string;
      if (err !== "aborted" && err !== "no-speech") {
        addBotMessage("ما قدرت أسمعك — تأكد من السماح بالميكروفون وجرّب مرة ثانية.");
      }
    };
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        setInterimText("");
        setInput(final.trim());
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    recognition.start();
  }

  function stopVoiceInput() {
    if (isNativeApp()) {
      try {
        mediaRef.current?.stop();
      } catch {}
      setRecording(false);
      return;
    }
    recognitionRef.current?.stop();
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Voice Selector Sheet */}
      <AnimatePresence>
        {voiceSelectorOpen && (
          <VoiceSelectorSheet
            selectedId={voiceProfileId}
            onSelect={handleVoiceProfileSelect}
            onClose={() => setVoiceSelectorOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <PageHeader
        title="الزكي"
        subtitle="صاحبك الروحاني دايماً معاك"
        icon={
          <span
            className="text-white font-bold leading-none"
            style={{ fontFamily: "'Amiri Quran', serif", fontSize: "17px" }}
          >
            ز
          </span>
        }
        right={
          <div className="flex items-center gap-1.5">
            {anniversaryMilestone && (
              <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-300/40">
                <Sparkles size={11} /> {anniversaryMilestone}
              </span>
            )}
            {/* Voice Selector Button */}
            <button
              onClick={() => setVoiceSelectorOpen(true)}
              className="flex items-center gap-1.5 bg-white/80 dark:bg-stone-800/60 px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700/50 hover:border-emerald-300 transition-colors"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <span className="text-sm leading-none">{currentVoiceProfile.emoji}</span>
              <span className="text-[11px] text-stone-600 dark:text-stone-300 font-medium max-w-[60px] truncate">{currentVoiceProfile.name}</span>
              <ChevronDown size={11} className="text-stone-400 flex-shrink-0" />
            </button>
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">متصل</span>
            </span>
          </div>
        }
      />

      {/* Risk Alert Banner */}
      <AnimatePresence>
        {riskAlert && !riskDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "overflow-hidden border-b",
              riskAlert.level === "high"
                ? "bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30"
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <AlertTriangle size={16} className={cn("mt-0.5 flex-shrink-0", riskAlert.level === "high" ? "text-red-500" : "text-amber-500")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold mb-0.5", riskAlert.level === "high" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                  {riskAlert.level === "high" ? "⚠️ الزكي قلقان عليك" : "💛 الزكي يلاحظ"}
                </p>
                <p className={cn("text-xs leading-relaxed", riskAlert.level === "high" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300")}>{riskAlert.message}</p>
                {riskAlert.sign && (
                  <p className={cn("text-[10px] mt-1", riskAlert.level === "high" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>العلامة: {riskAlert.sign}</p>
                )}
              </div>
              <button onClick={() => setRiskDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          backgroundImage: `
            linear-gradient(180deg,#f0ede5 0%,#f7f5ef 50%,#f0ede5 100%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className={cn("flex items-end gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {/* Bot avatar */}
                {msg.role === "bot" && <ZakiyAvatar />}

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[86%] rounded-2xl px-4 py-3.5",
                    msg.role === "user" ? "text-white rounded-tl-[6px]" : "rounded-tr-[6px] text-stone-800"
                  )}
                  style={msg.role === "user"
                    ? {
                        background: "linear-gradient(140deg,#059669,#0d9488)",
                        boxShadow: "0 4px 18px rgba(5,150,105,0.28), 0 1px 4px rgba(0,0,0,0.1)",
                      }
                    : {
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                        borderRight: "3px solid rgba(5,150,105,0.25)",
                      }
                  }
                >
                  {msg.role === "bot" ? (
                    <BotMessageBody
                      msg={msg}
                      onImpressionToggle={handleImpressionToggle}
                      impressionOpen={impressionOpenId === msg.id}
                      impressionText={impressionTexts[msg.id]}
                      sessionId={sessionId}
                      history={buildHistory()}
                      isAutoPlayTarget={autoPlayMsgId === msg.id}
                      onAudioComplete={handleAutoPlayComplete}
                    />
                  ) : (
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className={cn(
                    "text-[10px] opacity-50 mt-1.5 text-end",
                    msg.role === "user" ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              {msg.role === "bot" && msg.id !== "greeting" && (
                <SuggestionCards
                  suggestions={msg.suggestions}
                  loading={msg.suggestionsLoading}
                  onSelect={(q) => sendMessage(q)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasUserMessages && !loading && (
          <StarterCards onSelect={(q) => sendMessage(q)} />
        )}

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
            <ZakiyAvatar pulse />
            <div
              className="rounded-2xl rounded-tr-[6px] px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(5,150,105,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
                borderRight: "3px solid rgba(5,150,105,0.3)",
              }}
            >
              <div className="flex gap-[6px] items-end">
                {[0, 1, 2].map((idx) => (
                  <motion.span
                    key={idx}
                    className="block rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: idx === 1
                        ? "linear-gradient(135deg,#059669,#0d9488)"
                        : "rgba(5,150,105,0.35)",
                    }}
                    animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: idx * 0.18,
                      ease: [0.4, 0, 0.6, 1],
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Extra padding so last message clears the fixed input bar */}
        <div style={{ height: "100px" }} />
        <div ref={messagesEndRef} />
      </div>

      {/* ── Fixed input bar — sits at bottom ── */}
      <div
        className="fixed inset-x-0 max-w-md mx-auto z-30"
        style={{ bottom: "8px" }}
      >
        <div
          className="mx-2 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 -2px 0 rgba(0,0,0,0.04),0 -8px 24px rgba(0,0,0,0.08),0 4px 8px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          {/* Recording indicator */}
          <AnimatePresence>
            {recording && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-xs text-primary font-medium flex-1 truncate">
                    {interimText || "استمع... تكلّم الآن"}
                  </span>
                  <span className="text-[10px] text-stone-400">اضغط للإيقاف</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="flex items-end gap-2 px-3 py-2.5">
            {/* Mic button */}
            <button
              onClick={recording ? stopVoiceInput : startVoiceInput}
              disabled={loading}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                recording
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700",
                loading && "opacity-40 cursor-not-allowed"
              )}
            >
              {recording ? <StopCircle size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                  <line x1="2" y1="8" x2="4.5" y2="8" strokeWidth="1.4" opacity="0.7" />
                  <line x1="2" y1="10.5" x2="5" y2="10.5" strokeWidth="1.4" opacity="0.85" />
                  <line x1="2" y1="13" x2="4.5" y2="13" strokeWidth="1.4" opacity="0.7" />
                  <line x1="19.5" y1="8" x2="22" y2="8" strokeWidth="1.4" opacity="0.7" />
                  <line x1="19" y1="10.5" x2="22" y2="10.5" strokeWidth="1.4" opacity="0.85" />
                  <line x1="19.5" y1="13" x2="22" y2="13" strokeWidth="1.4" opacity="0.7" />
                </svg>
              )}
            </button>

            {/* Textarea */}
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                }}
                placeholder="اكتب ما في قلبك..."
                disabled={loading || recording}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl px-3.5 py-2.5 text-[13.5px] text-stone-800",
                  "border border-stone-200",
                  "bg-stone-50",
                  "placeholder:text-stone-400 placeholder:text-[12px]",
                  "focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400",
                  "focus:bg-white",
                  "max-h-32 overflow-y-auto leading-relaxed transition-all",
                  "dark:bg-background dark:border-border/60 dark:text-foreground dark:focus:border-teal-500/50",
                  (loading || recording) && "opacity-50"
                )}
                style={{ minHeight: "42px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || recording}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                input.trim() && !loading && !recording
                  ? "text-white shadow-md shadow-teal-500/30"
                  : "bg-stone-100 text-stone-400 opacity-60 cursor-not-allowed"
              )}
              style={input.trim() && !loading && !recording ? {
                background: "linear-gradient(135deg,#2dd4bf,#059669)",
              } : undefined}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="scale-x-[-1]" />}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-stone-400 pb-2">
            ما تقوله هنا آمن ومحفوظ بيننا فقط
          </p>
        </div>
      </div>
    </div>
  );
}
