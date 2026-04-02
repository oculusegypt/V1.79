import { Link } from "wouter";
import {
  ArrowLeft,
  Heart,
  CircleDot,
  BookOpen,
  PenLine,
  ScrollText,
  Clock,
  BarChart2,
  ListChecks,
  Swords,
  Globe,
  CalendarDays,
  Bell,
  HandHeart,
  ImageIcon,
  Users,
} from "lucide-react";
import { SoulMeter } from "@/components/SoulMeter";
import { LiveStats } from "@/components/live-stats";
import { SectionGarden } from "./GardenSection";
import { InviteFriendCard } from "./InviteFriendCard";
import { SectionJourneyCard } from "./JourneyCard";
import { SectionQuranCard } from "./QuranCard";
import { SectionHadithCard } from "./HadithCard";
import type { ListId } from "./types";

// ─── Re-export for convenience ────────────────────────────────────────────────

export { SectionGarden };
export { SectionJourneyCard };

// ─── Section label map ────────────────────────────────────────────────────────

export const SECTION_LABELS: Record<ListId, string> = {
  "quran-card": "القرآن الكريم",
  "hadith-card": "الحديث الشريف",
  "soul-meter": "مقياس الروح",
  "journey-card": "رحلة التوبة ٣٠ يوماً",
  journey30: "رحلة ٣٠ يوماً (رابط)",
  invite: "ادعُ رفيقاً",
  ameen: "قل آمين",
  "tawbah-card": "بطاقة توبتي",
  signs: "تباشير القبول",
  map: "خريطة التوبة",
  "live-stats": "إحصاءات حية",
  "islamic-programs": "برامج إسلامية",
  garden: "شجرة التوبة",
  munajat: "وضع المناجاة",
  adhkar: "الأذكار والأدعية",
};

// ─── Individual section components ────────────────────────────────────────────

export function SectionSoulMeter() {
  return <SoulMeter />;
}

export function SectionInvite() {
  return <InviteFriendCard />;
}

export function SectionLiveStats() {
  return <LiveStats />;
}

export function SectionTawbahCard() {
  return (
    <Link
      href="/card"
      className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-primary/10 border border-amber-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
        <ImageIcon size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">بطاقة توبتي</h3>
        <p className="text-[11px] text-muted-foreground">
          اصنع بطاقة جميلة وشاركها مع الناس
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionMap() {
  return (
    <Link
      href="/map"
      className="flex items-center gap-4 bg-gradient-to-l from-blue-500/10 to-primary/10 border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0">
        <Globe size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">خريطة التوبة العالمية</h3>
        <p className="text-[11px] text-muted-foreground">
          من أي دول يتوب المسلمون الآن؟
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionJourney30() {
  return (
    <Link
      href="/journey"
      className="flex items-center gap-4 bg-gradient-to-l from-violet-500/10 to-primary/10 border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0">
        <CalendarDays size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">رحلة ٣٠ يوماً</h3>
        <p className="text-[11px] text-muted-foreground">
          برنامج تدريجي يومي للتوبة والاستقامة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionAmeen() {
  return (
    <Link
      href="/ameen"
      className="flex items-center gap-4 bg-gradient-to-l from-rose-500/10 to-pink-500/5 border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md shrink-0">
        <HandHeart size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">قل آمين 🤲</h3>
        <p className="text-[11px] text-muted-foreground">
          ادعُ لأخٍ مجهول — وقل آمين لدعائه
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionSigns() {
  return (
    <Link
      href="/signs"
      className="flex items-center gap-4 bg-card border border-green-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 text-green-500">
        <HeartHandshake size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">تباشير القبول</h3>
        <p className="text-[11px] text-muted-foreground">
          علامات قبول التوبة الصادقة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionIslamicPrograms() {
  return (
    <Link
      href="/islamic-programs"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
      }}
    >
      <div className="absolute top-[-20px] left-[-20px] w-[90px] h-[90px] rounded-full opacity-15 bg-white pointer-events-none" />
      <div className="absolute bottom-[-30px] right-[30%] w-[80px] h-[80px] rounded-full opacity-10 bg-white pointer-events-none" />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
      >
        📺
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>
          برامج إسلامية
        </h3>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
          50 برنامج • تفسير · دعوة · فتاوى · سيرة · إذاعة
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        {["📖", "🤝", "🎬"].map((icon, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            {icon}
          </div>
        ))}
      </div>
      <ArrowLeft size={16} style={{ color: "rgba(255,255,255,0.5)" }} className="shrink-0" />
    </Link>
  );
}

export function SectionMunajat() {
  const hour = new Date().getHours();
  const isAfterIsha = hour >= 20 || hour < 4;
  return (
    <Link
      href="/munajat"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #0c0a1e 0%, #1e1b4b 50%, #1a1040 100%)",
        border: "1px solid rgba(139,92,246,0.3)",
      }}
    >
      <div className="absolute top-[-15px] left-[-15px] w-[80px] h-[80px] rounded-full opacity-10 bg-white pointer-events-none" />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)" }}
      >
        🌙
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>
          وضع المناجاة
        </h3>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(200,180,255,0.65)" }}>
          {isAfterIsha ? "⭐ الليل — وقت المناجاة" : "شاشة هادئة • صوت أمبيانت • ذكر"}
        </p>
      </div>
      <ArrowLeft size={16} style={{ color: "rgba(200,180,255,0.4)" }} className="shrink-0" />
    </Link>
  );
}

export function SectionAdhkar() {
  return (
    <Link
      href="/adhkar"
      className="flex items-center gap-4 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #0d1f1a 0%, #0a2218 50%, #071a14 100%)",
        border: "1px solid rgba(52,211,153,0.28)",
      }}
    >
      <div
        className="absolute top-[-15px] right-[-15px] w-[80px] h-[80px] rounded-full pointer-events-none"
        style={{ background: "rgba(52,211,153,0.15)", filter: "blur(16px)" }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
      >
        📿
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]" style={{ color: "#6ee7b7" }}>
          الأذكار والأدعية
        </h3>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(110,231,183,0.55)" }}>
          ٢٨ قسماً شاملاً — صباح ومساء وصلاة وحياة
        </p>
      </div>
      <ArrowLeft size={16} style={{ color: "rgba(110,231,183,0.35)" }} className="shrink-0" />
    </Link>
  );
}

// Grid-ID based link sections (rendered as list items in list context)

export function SectionRajaa() {
  return (
    <Link
      href="/rajaa"
      className="flex items-center gap-4 bg-card border border-primary/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        <BookOpen size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مكتبة الرجاء</h3>
        <p className="text-[11px] text-muted-foreground">
          آيات وأحاديث وقصص تبعث الأمل
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionDhikr() {
  return (
    <Link
      href="/dhikr"
      className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 text-secondary-foreground">
        <CircleDot size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مسبحة الذكر</h3>
        <p className="text-[11px] text-muted-foreground">
          استغفار وتسبيح بين يديك
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionJournal() {
  return (
    <Link
      href="/journal"
      className="flex items-center gap-4 bg-card border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500">
        <PenLine size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">يوميات التوبة</h3>
        <p className="text-[11px] text-muted-foreground">مساحة سرية خاصة بك</p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionKaffarah() {
  return (
    <Link
      href="/kaffarah"
      className="flex items-center gap-4 bg-card border border-destructive/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
        <ScrollText size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الكفارات الشرعية</h3>
        <p className="text-[11px] text-muted-foreground">
          خطوات مفصّلة لكل ذنب
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionProgressMap() {
  return (
    <Link
      href="/progress"
      className="flex items-center gap-4 bg-card border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
        <BarChart2 size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">خريطة التقدم</h3>
        <p className="text-[11px] text-muted-foreground">
          إحصاءاتك الروحية ومسيرتك
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionHadiTasks() {
  return (
    <Link
      href="/hadi-tasks"
      className="flex items-center gap-4 bg-card border border-emerald-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
        <ListChecks size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مهام هادي</h3>
        <p className="text-[11px] text-muted-foreground">
          نصائح الزكي تتحول لمهام تتابعها
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionDhikrRooms() {
  return (
    <Link
      href="/dhikr-rooms"
      className="flex items-center gap-4 bg-gradient-to-l from-teal-500/10 to-primary/10 border border-teal-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
        <Users size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">غرف الذكر الجماعي</h3>
        <p className="text-[11px] text-muted-foreground">
          سبّح مع آلاف المسلمين الآن
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionPrayerTimes() {
  return (
    <Link
      href="/prayer-times"
      className="flex items-center gap-4 bg-card border border-indigo-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">مواقيت الصلاة</h3>
        <p className="text-[11px] text-muted-foreground">
          تذكيرات ذكية قبل كل صلاة
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionRelapse() {
  return (
    <Link
      href="/relapse"
      className="flex items-center gap-4 bg-card border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500">
        <Heart size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ضعفت وعدت؟</h3>
        <p className="text-[11px] text-muted-foreground">
          اقرأ هذا فوراً — لا تيأس
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionNotifications() {
  return (
    <Link
      href="/notifications"
      className="flex items-center gap-4 bg-card border border-amber-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
        <Bell size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الإشعارات</h3>
        <p className="text-[11px] text-muted-foreground">
          ضبط تنبيهات الصلاة والأذكار
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionDangerTimes() {
  return (
    <Link
      href="/danger-times"
      className="flex items-center gap-4 bg-card border border-orange-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">أوقات الخطر</h3>
        <p className="text-[11px] text-muted-foreground">تذكيرات وقائية ذكية</p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionSecretDua() {
  return (
    <Link
      href="/secret-dua"
      className="flex items-center gap-4 bg-card border border-rose-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500">
        <Heart size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">الصديق السري</h3>
        <p className="text-[11px] text-muted-foreground">
          ادعُ لأخٍ مجهول بلا أسماء
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export function SectionDuaTiming() {
  return (
    <Link
      href="/dua-timing"
      className="flex items-center gap-4 bg-card border border-yellow-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 text-yellow-600">
        <Swords size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">لحظة الإجابة</h3>
        <p className="text-[11px] text-muted-foreground">
          أقوى أوقات الدعاء
        </p>
      </div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

// ─── Missing import fix ───────────────────────────────────────────────────────

function HeartHandshake({ size }: { size: number }) {
  return <HandHeart size={size} />;
}

// ─── renderSection ────────────────────────────────────────────────────────────

export function renderSection(id: ListId): React.ReactNode {
  switch (id) {
    case "soul-meter":
      return <SectionSoulMeter />;
    case "journey-card":
      return <SectionJourneyCard />;
    case "journey30":
      return <SectionJourney30 />;
    case "invite":
      return <SectionInvite />;
    case "ameen":
      return <SectionAmeen />;
    case "tawbah-card":
      return <SectionTawbahCard />;
    case "signs":
      return <SectionSigns />;
    case "map":
      return <SectionMap />;
    case "live-stats":
      return <SectionLiveStats />;
    case "islamic-programs":
      return <SectionIslamicPrograms />;
    case "garden":
      return <SectionGarden />;
    case "munajat":
      return <SectionMunajat />;
    case "adhkar":
      return <SectionAdhkar />;
    case "quran-card":
      return <SectionQuranCard />;
    case "hadith-card":
      return <SectionHadithCard />;
  }
}
