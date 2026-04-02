export type EidType = "fitr" | "adha";

export type EidPeriod =
  | "pre_fitr"
  | "eid_fitr"
  | "pre_adha_dhul_hijja"
  | "arafah"
  | "eid_adha"
  | "none";

interface EidDateRange {
  type: EidType;
  period: "pre" | "eid";
  start: Date;
  end: Date;
}

function date(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}

const EID_DATES: EidDateRange[] = [
  { type: "fitr", period: "pre",  start: date(2025, 3, 27), end: date(2025, 3, 29) },
  { type: "fitr", period: "eid",  start: date(2025, 3, 30), end: date(2025, 4, 1) },
  { type: "adha", period: "pre",  start: date(2025, 6, 1),  end: date(2025, 6, 5) },
  { type: "adha", period: "eid",  start: date(2025, 6, 6),  end: date(2025, 6, 8) },
  { type: "fitr", period: "pre",  start: date(2026, 3, 17), end: date(2026, 3, 19) },
  { type: "fitr", period: "eid",  start: date(2026, 3, 20), end: date(2026, 3, 22) },
  { type: "adha", period: "pre",  start: date(2026, 5, 21), end: date(2026, 5, 26) },
  { type: "adha", period: "eid",  start: date(2026, 5, 27), end: date(2026, 5, 29) },
  { type: "fitr", period: "pre",  start: date(2027, 3, 7),  end: date(2027, 3, 9) },
  { type: "fitr", period: "eid",  start: date(2027, 3, 10), end: date(2027, 3, 12) },
  { type: "adha", period: "pre",  start: date(2027, 5, 11), end: date(2027, 5, 16) },
  { type: "adha", period: "eid",  start: date(2027, 5, 17), end: date(2027, 5, 19) },
];

const ARAFAH_DATES = [date(2025, 6, 5), date(2026, 5, 26), date(2027, 5, 16)];

export interface EidStatus {
  period: EidPeriod;
  eidType: EidType | null;
  daysUntilEid: number | null;
  eidDay: number | null;
  eidStartDate: Date | null;
  isActive: boolean;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function getEidStatus(now = new Date()): EidStatus {
  const today = startOfDay(now);

  for (const arafah of ARAFAH_DATES) {
    if (diffDays(today, arafah) === 0) {
      return { period: "arafah", eidType: "adha", daysUntilEid: 1, eidDay: null, eidStartDate: arafah, isActive: true };
    }
  }

  for (const range of EID_DATES) {
    const start = startOfDay(range.start);
    const end = startOfDay(range.end);
    const diff = diffDays(today, start);

    if (today >= start && today <= end) {
      if (range.period === "eid") {
        const dayNum = diffDays(start, today) + 1;
        return {
          period: range.type === "fitr" ? "eid_fitr" : "eid_adha",
          eidType: range.type,
          daysUntilEid: 0,
          eidDay: dayNum,
          eidStartDate: range.start,
          isActive: true,
        };
      } else {
        const eidRange = EID_DATES.find(
          (r) => r.type === range.type && r.period === "eid" && r.start > range.start
        );
        const daysUntil = eidRange ? diffDays(today, eidRange.start) : null;
        const preP: EidPeriod =
          range.type === "fitr" ? "pre_fitr" : "pre_adha_dhul_hijja";
        return {
          period: preP,
          eidType: range.type,
          daysUntilEid: daysUntil,
          eidDay: null,
          eidStartDate: eidRange?.start ?? null,
          isActive: true,
        };
      }
    }
  }

  const upcoming = EID_DATES.filter(
    (r) => r.period === "eid" && startOfDay(r.start) > today
  ).sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  return {
    period: "none",
    eidType: null,
    daysUntilEid: upcoming ? diffDays(today, upcoming.start) : null,
    eidDay: null,
    eidStartDate: upcoming?.start ?? null,
    isActive: false,
  };
}

export const EID_FITR_INSTRUCTIONS = [
  { icon: "🌙", title: "زكاة الفطر", body: "تجب قبل صلاة العيد — نحو صاع من غالب قوت البلد (حوالي 2.5 كغ). يمكن إخراجها نقداً." },
  { icon: "🛁", title: "الغُسل", body: "يُستحب الاغتسال قبل الخروج لصلاة العيد — سنةٌ مؤكدة عن النبي ﷺ." },
  { icon: "👗", title: "لبس أحسن الثياب", body: "لبس أحسن الثياب المباح — من هدي النبي ﷺ في العيدين." },
  { icon: "🍬", title: "الفطر قبل الصلاة", body: "يُستحب تناول تمرات وترًا (1، 3، 5...) قبل الخروج للصلاة — هدي النبي ﷺ." },
  { icon: "📢", title: "التكبير", body: "يُستحب التكبير من غروب شمس آخر رمضان حتى تُكبِّر الإمام: «الله أكبر الله أكبر لا إله إلا الله، الله أكبر الله أكبر ولله الحمد»" },
  { icon: "🛤️", title: "التحوّل في الطريق", body: "يُستحب الذهاب من طريق والعودة من طريق آخر — هدي النبي ﷺ." },
];

export const EID_ADHA_INSTRUCTIONS = [
  { icon: "📢", title: "التكبير المطلق والمقيد", body: "التكبير المطلق من أول ذي الحجة، والمقيد من فجر يوم عرفة حتى عصر آخر أيام التشريق (13 ذو الحجة)." },
  { icon: "🛁", title: "الغُسل", body: "يُستحب الاغتسال قبل صلاة العيد." },
  { icon: "🍖", title: "لا أكل قبل الصلاة", body: "يُستحب لمن يُضحي ألا يأكل حتى يُصلي ويُضحي." },
  { icon: "🐑", title: "الأضحية", body: "تبدأ بعد صلاة العيد حتى غروب اليوم الثالث (13 ذو الحجة). شاة أو سُبع بقرة أو سُبع بدنة." },
  { icon: "👗", title: "أحسن الثياب", body: "التجمّل من هدي النبي ﷺ في العيدين." },
  { icon: "🤲", title: "يوم عرفة للحجاج وغيرهم", body: "صيام يوم عرفة لغير الحاج يُكفّر سنتين. وهو خير يوم طلعت فيه الشمس." },
];

export const COUNTRY_GUIDELINES: Record<string, { flag: string; name: string; tip: string }> = {
  SA: { flag: "🇸🇦", name: "السعودية", tip: "الصلاة في المساجد الكبرى والملاعب. يُعلَن الموعد رسمياً من وزارة الشؤون الإسلامية." },
  EG: { flag: "🇪🇬", name: "مصر", tip: "صلاة العيد في الساحات والمساجد الكبرى. تُقام عادةً الساعة 7 أو 7:30 صباحاً." },
  AE: { flag: "🇦🇪", name: "الإمارات", tip: "تُحدَّد مواعيد الصلاة من هيئة الإمارات للفضاء والهيئة العامة للشؤون الإسلامية." },
  MA: { flag: "🇲🇦", name: "المغرب", tip: "الصلاة في المصليات والمساجد. يُعلَن الموعد من وزارة الأوقاف قبل 24 ساعة." },
  TR: { flag: "🇹🇷", name: "تركيا", tip: "Bayram namazı — في جميع المساجد. الوقت يُعلَن من ديانت إشلري رياسة." },
  PK: { flag: "🇵🇰", name: "باكستان", tip: "صلاة العيد في المساجد والميادين الكبرى. توقيت مختلف حسب المدينة." },
  ID: { flag: "🇮🇩", name: "إندونيسيا", tip: "Salat Idul — في المساجد والساحات المفتوحة. أكبر تجمع عيد في العالم." },
  MY: { flag: "🇲🇾", name: "ماليزيا", tip: "Solat Eid — في مساجد الولايات. الحضور مبكراً مُهم لضيق المكان." },
  GB: { flag: "🇬🇧", name: "المملكة المتحدة", tip: "الصلاة في المساجد والمراكز الإسلامية. بعض الجاليات تُصلي في الملاعب والحدائق." },
  US: { flag: "🇺🇸", name: "الولايات المتحدة", tip: "الصلاة في المراكز الإسلامية والملاعب. الوقت يختلف بين المدن — تحقق مع المسجد المحلي." },
  DE: { flag: "🇩🇪", name: "ألمانيا", tip: "الصلاة في المساجد والمراكز الإسلامية. DITIB تُنظم الصلاة في كثير من المدن." },
  FR: { flag: "🇫🇷", name: "فرنسا", tip: "الصلاة في المساجد والمراكز الثقافية. يُستحسن الحجز المسبق في بعضها." },
};
