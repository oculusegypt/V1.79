function getHijriDate(date: Date): { dayNum: number; monthNum: number; monthName: string; year: number } {
  const HIJRI_MONTHS_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  ];
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric", month: "numeric", year: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  let day = 1, month = 9, year = 1447;
  for (const p of parts) {
    if (p.type === "day") day = parseInt(p.value);
    if (p.type === "month") month = parseInt(p.value);
    if (p.type === "year") year = parseInt(p.value);
  }
  return { dayNum: day, monthNum: month, monthName: HIJRI_MONTHS_AR[month - 1] ?? "رمضان", year };
}

function buildOccasionContext(month: number, day: number, year: number): string {
  const lines: string[] = [];
  if (month === 9) {
    lines.push(`🌙 ═══ رمضان المبارك ${year}هـ — اليوم ${day} ═══`);
    if (day <= 10) {
      lines.push("📍 العشر الأولى — أيام الرحمة");
      lines.push("• كل يوم فيها غنيمة لا تُعوَّض — ربنا يفتح أبواب رحمته");
    } else if (day <= 20) {
      lines.push("📍 العشر الأوسط — أيام المغفرة");
      lines.push("• الوقت الأكثر ثقلاً للتوبة الصادقة وطلب المغفرة");
      if (day >= 18) {
        lines.push(`⚡ تنبيه: تبقّى ${21 - day} أيام على العشر الأخيرة — الاستعداد واجب الآن!`);
      }
    } else {
      const remaining = 30 - day;
      lines.push("📍 العشر الأواخر — أيام العتق من النار");
      lines.push(`⭐ تبقّى ${remaining} يوم — ده وقت الذهب الحقيقي`);
      const oddNights = [21, 23, 25, 27, 29];
      if (oddNights.includes(day)) {
        lines.push(`🌟 هذه الليلة (ليلة ${day + 1}) من أرجح ليالي القدر — لا تفوّتها!`);
        lines.push(`• دعاء القدر: "اللهم إنك عفوٌّ تحب العفو فاعفُ عنّي"`);
      }
      if (day === 27) lines.push("💎 ليلة السابع والعشرين — العلماء يرجّحونها لليلة القدر");
      lines.push("• «مَن قام ليلة القدر إيماناً واحتساباً غُفر له ما تقدم من ذنبه» (متفق عليه)");
    }
    lines.push("• استغل الدعاء قبل الإفطار — «للصائم دعوة لا تُرد عند فطره» (رواه ابن ماجه وحسّنه الألباني)");
  } else if (month === 10) {
    if (day === 1) lines.push("🎉 عيد الفطر المبارك! تقبّل الله منا ومنكم");
    else if (day <= 6) {
      lines.push("📿 أيام شوال — وقت صيام الست");
      lines.push("• «مَن صام رمضان ثم أتبعه ستًّا من شوال كان كصيام الدهر» (رواه مسلم)");
    }
  } else if (month === 12) {
    if (day <= 9) {
      lines.push(`🕋 العشر الأوائل من ذو الحجة — اليوم ${day}`);
      lines.push("• «ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام العشر» (رواه البخاري)");
    }
    if (day === 9) lines.push("🌄 يوم عرفة — أعظم أيام السنة — «صيامه يكفّر سنتين» (رواه مسلم)");
    if (day === 10) lines.push("🎊 عيد الأضحى المبارك!");
  } else if (month === 1 && day === 10) {
    lines.push("📅 يوم عاشوراء — «صيامه يكفّر السنة الماضية» (رواه مسلم)");
  } else {
    const monthNames = ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
    lines.push(`📅 ${day} ${monthNames[month - 1]} ${year}هـ`);
  }
  return lines.join("\n");
}

function getDayOfWeekFadhail(date: Date): string {
  const dayEn = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "Africa/Cairo" });
  if (dayEn === "Friday") {
    return "⭐ اليوم جمعة — «خير يوم طلعت عليه الشمس يوم الجمعة» (رواه مسلم)\n• الإكثار من الصلاة على النبي ﷺ وقراءة الكهف والدعاء قبل المغرب";
  }
  if (dayEn === "Monday" || dayEn === "Thursday") {
    const name = dayEn === "Monday" ? "الاثنين" : "الخميس";
    return `💡 اليوم ${name} — «تُعرض الأعمال يوم الاثنين والخميس» (رواه الترمذي وصحّحه) — يُستحب الصيام`;
  }
  return "";
}

export function getIslamicDateContext(): string {
  const now = new Date();
  const gregorianDate = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" });
  const gregorianEn = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" });
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
  const hour = parseInt(now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: "Africa/Cairo" }));
  const timeOfDay = hour < 5 ? "ما قبل الفجر — وقت القيام" : hour < 7 ? "وقت الفجر" : hour < 12 ? "الصباح" : hour < 13 ? "وقت الظهر" : hour < 15 ? "بعد الظهر" : hour < 17 ? "وقت العصر" : hour < 19 ? "قبيل المغرب" : hour < 20 ? "وقت المغرب والإفطار" : hour < 22 ? "العشاء" : "الليل";
  const hijri = getHijriDate(now);
  const occasion = buildOccasionContext(hijri.monthNum, hijri.dayNum, hijri.year);
  const dayFadhail = getDayOfWeekFadhail(now);

  return `
╔══════════════════════════════╗
║       السياق الزمني الآن      ║
╚══════════════════════════════╝
📅 ميلادي: ${gregorianDate}
🕌 هجري: ${hijri.dayNum} ${hijri.monthName} ${hijri.year}هـ
⏰ الوقت: ${timeOfDay} (${timeStr} القاهرة)
📆 EN: ${gregorianEn}

${occasion}
${dayFadhail}
`;
}
