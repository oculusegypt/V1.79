const HOME_HADITHS = [
  { text: "التائبُ من الذنبِ كمَن لا ذنبَ له", narrator: "رواه ابن ماجه" },
  {
    text: "إنَّ اللهَ يَقبلُ توبةَ العبدِ ما لم يُغَرْغِر",
    narrator: "رواه الترمذي",
  },
  {
    text: "إن الله أفرح بتوبة عبده المؤمن من رجل في أرض دَوِيَّة مَهلَكة",
    narrator: "متفق عليه",
  },
  {
    text: "كلُّ ابنِ آدمَ خطَّاءٌ وخيرُ الخطَّائينَ التوَّابونَ",
    narrator: "رواه الترمذي",
  },
  {
    text: "من قال أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه غُفر له",
    narrator: "رواه أبو داود",
  },
];

export function SectionHadithCard() {
  const todayIdx = new Date().getDate() % HOME_HADITHS.length;
  const hadith = HOME_HADITHS[todayIdx]!;

  return (
    <div
      className="flex items-start gap-3.5 rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(145deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.04) 100%)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.1) 100%)",
          border: "1px solid rgba(245,158,11,0.35)",
        }}
      >
        <span style={{ fontSize: 18 }}>🌙</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", color: "#d97706" }}
          >
            حديث اليوم
          </span>
        </div>
        <p
          className="font-semibold leading-relaxed text-right mb-1.5 text-foreground"
          style={{ fontSize: 13 }}
        >
          «{hadith.text}»
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {hadith.narrator}
        </p>
      </div>
    </div>
  );
}
