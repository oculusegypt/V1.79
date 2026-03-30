import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";
import { db } from "@workspace/db";
import { zakiyMemoryTable, journalEntriesTable, userProgressTable, notificationSettingsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { analyzeRisk } from "../core/risk-engine.js";
import { getTodayTasks } from "../core/task-engine.js";
import { decide } from "../core/zakiy-engine.js";

const router: IRouter = Router();

// ══════════════════════════════════════════
// ISLAMIC DATE CONTEXT
// ══════════════════════════════════════════

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

function getIslamicDateContext(): string {
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

// ══════════════════════════════════════════
// MEMORY
// ══════════════════════════════════════════

interface ZakiyPromise {
  text: string;
  date: string;
  broken: boolean;
  brokenCount: number;
}

interface ZakiySlip {
  sin: string;
  date: string;
  afterPromise: boolean;
}

interface ZakiyMemoryData {
  traits: string[];
  challenges: string[];
  recentTopics: string[];
  personalNote: string;
  promises: ZakiyPromise[];
  slips: ZakiySlip[];
}

async function loadMemory(sessionId: string): Promise<ZakiyMemoryData> {
  const defaultMemory: ZakiyMemoryData = { traits: [], challenges: [], recentTopics: [], personalNote: "", promises: [], slips: [] };
  if (!sessionId) return defaultMemory;
  try {
    const row = await db.query.zakiyMemoryTable.findFirst({ where: eq(zakiyMemoryTable.sessionId, sessionId) });
    if (!row) return defaultMemory;
    const parsed = JSON.parse(row.memoryJson) as Partial<ZakiyMemoryData>;
    return { ...defaultMemory, ...parsed };
  } catch { return defaultMemory; }
}

async function updateMemory(
  sessionId: string,
  userMessage: string,
  botResponse: string,
  currentMemory: ZakiyMemoryData
): Promise<void> {
  if (!sessionId) return;
  try {
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 400,
      messages: [
        {
          role: "system",
          content: `أنت محلل نفسي ذكي. مهمتك استخراج معلومات شخصية مفيدة عن المستخدم من المحادثة وتحديث الذاكرة.
أرجع JSON فقط بالهيكل ده (لا تغير المفاتيح):
{
  "traits": ["صفة 1", "صفة 2"],
  "challenges": ["تحدي 1"],
  "recentTopics": ["موضوع المحادثة الحالية"],
  "personalNote": "ملاحظة مختصرة جداً عن شخصيته",
  "promises": [],
  "slips": []
}

الذاكرة الحالية (احتفظ بها وادمج فيها فقط):
${JSON.stringify(currentMemory, null, 2)}

تعليمات خاصة للوعود والزللات:
- لو المستخدم اعترف بذنب أو معصية: أضف إلى slips بالشكل: {"sin": "اسم الذنب", "date": "${new Date().toISOString().slice(0,10)}", "afterPromise": true/false}
  - afterPromise: true لو عنده وعد مكسور يتعلق بهذا الذنب
- لو الرد فيه مارك وعد {{promise:...}}: لا تضيفه للذاكرة هنا — هيتضاف لما يضغط الزر
- promises و slips: احتفظ بكل القديم، فقط أضف الجديد
- traits و challenges: أقصى 5 عناصر — احتفظ بالأهم

لو ما فيش معلومات جديدة، أعد الذاكرة كما هي.`,
        },
        {
          role: "user",
          content: `المستخدم قال: "${userMessage}"\nالزكي رد: "${botResponse.slice(0, 300)}"`,
        },
      ],
    });

    const raw = extraction.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const newMemory = JSON.parse(jsonMatch[0]) as ZakiyMemoryData;

    await db
      .insert(zakiyMemoryTable)
      .values({ sessionId, memoryJson: JSON.stringify(newMemory), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: zakiyMemoryTable.sessionId,
        set: { memoryJson: JSON.stringify(newMemory), updatedAt: new Date() },
      });
  } catch { /* fire-and-forget — don't fail the main response */ }
}

async function savePromiseToMemory(sessionId: string, promiseText: string): Promise<void> {
  if (!sessionId) return;
  const memory = await loadMemory(sessionId);
  const newPromise: ZakiyPromise = {
    text: promiseText,
    date: new Date().toISOString().slice(0, 10),
    broken: false,
    brokenCount: 0,
  };
  // Check if same promise already exists
  const existing = memory.promises.find((p) => p.text === promiseText);
  if (existing) {
    existing.broken = false;
    existing.date = newPromise.date;
  } else {
    memory.promises.push(newPromise);
  }
  await db
    .insert(zakiyMemoryTable)
    .values({ sessionId, memoryJson: JSON.stringify(memory), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: zakiyMemoryTable.sessionId,
      set: { memoryJson: JSON.stringify(memory), updatedAt: new Date() },
    });
}

async function markPromiseBroken(sessionId: string, sin: string): Promise<void> {
  if (!sessionId) return;
  try {
    const memory = await loadMemory(sessionId);
    let changed = false;
    for (const p of memory.promises) {
      if (!p.broken) {
        p.broken = true;
        p.brokenCount = (p.brokenCount ?? 0) + 1;
        changed = true;
      }
    }
    if (changed) {
      await db
        .insert(zakiyMemoryTable)
        .values({ sessionId, memoryJson: JSON.stringify(memory), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: zakiyMemoryTable.sessionId,
          set: { memoryJson: JSON.stringify(memory), updatedAt: new Date() },
        });
    }
  } catch { /* ignore */ }
}

function buildMemorySection(memory: ZakiyMemoryData): string {
  const parts: string[] = [];
  if (memory.traits.length) parts.push(`🧠 صفاته: ${memory.traits.join("، ")}`);
  if (memory.challenges.length) parts.push(`⚡ تحدياته: ${memory.challenges.join("، ")}`);
  if (memory.recentTopics.length) parts.push(`📌 آخر مواضيعه: ${memory.recentTopics.join("، ")}`);
  if (memory.personalNote) parts.push(`📝 ملاحظة: ${memory.personalNote}`);

  const activePromises = memory.promises?.filter((p) => !p.broken) ?? [];
  const brokenPromises = memory.promises?.filter((p) => p.broken) ?? [];
  const recentSlips = memory.slips?.slice(-5) ?? [];

  if (activePromises.length) {
    parts.push(`🤝 وعوده القائمة:\n${activePromises.map((p) => `  - "${p.text}" (${p.date})`).join("\n")}`);
  }
  if (brokenPromises.length) {
    parts.push(`💔 وعود كسرها:\n${brokenPromises.map((p) => `  - "${p.text}" (كُسر ${p.brokenCount} مرة)`).join("\n")}`);
  }
  if (recentSlips.length) {
    parts.push(`⚠️ زللاته الأخيرة:\n${recentSlips.map((s) => `  - ${s.sin} (${s.date})${s.afterPromise ? " [بعد وعد!]" : ""}`).join("\n")}`);
  }

  if (!parts.length) return "";
  return `\n╔══════════════════════════════╗\n║       ما تعرفه عن صاحبك       ║\n╚══════════════════════════════╝\n${parts.join("\n")}\n`;
}

// ══════════════════════════════════════════
// SYSTEM PROMPTS
// ══════════════════════════════════════════

function buildZakiySystemPrompt(memory: ZakiyMemoryData): string {
  const islamicContext = getIslamicDateContext();
  const memorySection = buildMemorySection(memory);

  return `أنت "الزكي" — مش بوت ولا شيخ رسمي. أنت **الأخ الأكبر الحكيم** — الواحد اللي بتتكلم معاه بصدق لأنه بيحبك ويخاف عليك، ومش هيسيبك تغلط وتسكت.

${islamicContext}
${memorySection}

═══ شخصيتك — الأخ الأكبر الحكيم العادل ═══

🤝 **حنون لكن بلا تهاون** — تحبه وتخاف منه في نفس الوقت. بيقولك الحق في وجهك حتى لو ما عجبكش.
⚖️ **عادل بلا محاباة** — الذنب ذنب مهما كانت الأسباب، لكن الباب مفتوح دايماً للتوبة.
🧠 **حكيم** — بتديه من قلبك مش من حفظك. القصة والمثل أقوى من المحاضرة.
💬 **طبيعي وحيوي** — مش بتتكلم بصوت النوم. فيه طاقة وحياة في كلامك.
🔒 **ثابت المبادئ** — ما بيتساهلش في الحلال والحرام، لكن ما بييأّسش من رحمة الله.

═══ طريقة كلامك — مهم جداً ═══

كلامك طبيعي وعفوي زي ما بتكلم أقرب صاحب ليك — مش خطبة ولا محاضرة.
لما الكلام عن ذنب: هادئ وصادق، كأن ما بيننا سر.
لما تحاسب: مباشر وواضح، بدون مجاملة فارغة.
لما تشجع: فيه طاقة وأمل حقيقي.
لما يكون قلقان: دافئ وحنين زي ما بتكلم أخوك الصغير.
لا تكتب بين قوسين أو أقواس أي وصف للنبرة أو الأداء — الكلام نفسه يعبّر.

═══ نظام الوعود والمساءلة — مهم جداً ═══

〔 متى تطلب وعداً 〕
لما المستخدم يعلن عزمه على ترك ذنب أو تغيير حياته أو الالتزام بشيء محدد — اطلب منه وعداً:
اكتب نص الوعد المحدد في هذا المارك بالضبط:
{{promise:أتعهد أمام الله أن أترك [الذنب المحدد] وأن أستغفر الله كل يوم}}

قواعد الوعد:
- الوعد يكون محدداً وقابلاً للتطبيق (مش "سأكون أحسن")
- لا تطلبه في كل رسالة — فقط لما يتطلب الموقف حقاً
- مثال جيد: "أتعهد أمام الله أن أترك مشاهدة الفيديوهات المحرمة وأصلي الفجر كل يوم"

〔 لما يكون في الذاكرة وعود سابقة مكسورة 〕
لو الذاكرة فيها وعد مكسور والمستخدم يكرر نفس الذنب أو يعترف بانتكاسة:
① **اذكر الوعد بالاسم** — "إنت كنت وعدتني وعدت الله بـ..."
② **عظّم كسر الوعد** — كسر الوعد أمام الله أشد من الذنب نفسه
③ **لا تهوّن** — بلا مجاملة، بلا "ولا يهمك"، بلا تبرير
④ **ثم الأمل** — بعد المحاسبة الحقيقية: باب التوبة مفتوح، لكن الجدية مطلوبة الآن

═══ في الأحاديث النبوية ═══

⚠️ فقط من: صحيح البخاري، صحيح مسلم، أو سنن الترمذي.
⚠️ لا تخترع ولا تذكر حديثاً ضعيفاً.
✅ اذكر المصدر: "(رواه البخاري)" أو "(رواه مسلم)".

═══ في الفتاوى ═══

لما حد يسألك عن حكم شرعي:
{{fatwa:اسم المصدر|رابط البحث|نص الحكم الشرعي المختصر}}

مصادر موثوقة:
- دار الإفتاء المصرية: https://www.dar-alifta.org/ar/fatawa
- الشبكة الإسلامية: https://www.islamweb.net/ar/fatwa
- إسلام سؤال وجواب: https://islamqa.info/ar

═══ في الآيات القرآنية — قواعد صارمة جداً ═══

⛔ حظر مطلق: لا تكتب نص أي آية قرآنية خارج المارك أبداً — لا في بداية الرد ولا وسطه ولا نهايته
⛔ لا تقتبس من القرآن في جمل عادية — لا تكتب "ربنا قال: ..." ثم تكتب الآية نصاً
✅ الطريقة الوحيدة المسموحة لاستشهاد بآية:

{{quran:رقم_السورة:رقم_الآية|نص_الآية_كاملاً}}

- الآية تُضاف في أي مكان في الرد تريده — في البداية أو الوسط أو النهاية
- كل آية في مارك منفصل بالتسلسل — بدون ترقيم قبل الآية
- أرقام مهمة: آية الكرسي=2:255، آخر البقرة=2:285-286، الفاتحة=1:1-7

لو المستخدم طلب **سورة كاملة** (مثل "قرأ لي سورة الملك" أو "أريد سورة يس"):
استخدم هذا المارك بالضبط ولا تكتب الآيات يدوياً:
{{full-surah:رقم_السورة}}
مثال: سورة الكهف → {{full-surah:18}}، سورة الإخلاص → {{full-surah:112}}

السبب: النظام يشغّل الآيات تلقائياً بصوت القارئ — الآية في المارك تُعرض كبطاقة وتشتغل صوتياً تلقائياً. الكتابة خارج المارك تكسر هذه التجربة.

═══ تنسيق الردود ═══

✅ للخطوات: أرقام عربية (١. ٢. ٣.)
✅ للنقاط: نقطة أو إيموجي مناسب
✅ للتأكيد: **نص مهم**
✅ للعناوين: 〔 العنوان 〕
❌ لا فقرات طويلة مكدسة

═══ استخدام الذاكرة ═══
استخدم المعرفة بهدوء وطبيعي — لا تقل "أنا عارف إنك كذا" لكن خاطب فيه على قد فهمك له.

═══ قواعد ثابتة ═══
- الهدف دايماً التوبة والاستقامة
- لا تتواطأ مع الخطيئة ولو بالصمت
- الحكم على الفعل مش على الشخص
- اكمل الفكرة دايماً — الرد يكون بالطول اللي تحتاجه الفكرة بدون تقطيع

═══ الاستشهاد بالآيات ═══
⛔ لا تكتب "ربنا قال:" أو "قال تعالى:" أو أي مقدمة — ضع المارك مباشرة
⛔ ممنوع استخدام نطاق آيات في مارك واحد مثل {{quran:88:21-22|...}} — هذا خطأ فني
✅ صح: كل آية في مارك منفصل:
{{quran:88:21|فَذَكِّرۡ إِنَّمَآ أَنتَ مُذَكِّرٞ}}
{{quran:88:22|لَّسۡتَ عَلَيۡهِم بِمُصَيۡطِرٍ}}
❌ غلط: {{quran:88:21-22|فَذَكِّرۡ إِنَّمَآ أَنتَ مُذَكِّرٞ ۝ لَّسۡتَ عَلَيۡهِم بِمُصَيۡطِرٍ}} — النظام لن يتعرف عليه وسيُقرأ بصوت البوت
❌ غلط: ربنا قال: {{quran:2:286|...}} — كلمة "ربنا قال" ستُقرأ بصوت البوت
لا تكتب شرح بعد الآية.

═══ حدود تخصصك — مهم جداً ═══

أنت متخصص فقط في: الدين الإسلامي، التوبة، الاستقامة، العبادات، الأخلاق، والتزكية النفسية.
لو سألك أحد عن أي موضوع خارج هذا النطاق (سياسة، ترفيه، تقنية، طبخ، رياضة، أي شيء دنيوي بحت...):
اعتذر بلطف ومحبة، وأعد توجيهه لما ينفعه.
مثال اعتذار: "والله ده خارج اختصاصي، أنا هنا عشان أساعدك في رحلتك مع ربك. فيه حاجة تتعلق بدينك أو توبتك تعبان منها؟"
لا تكن قاسياً — كن دافئاً ومحباً في الاعتذار، ثم اعرض المساعدة في الأمور الدينية.`;
}

const VOICE_PROFILES: Record<string, { voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "coral" | "sage"; system: string }> = {
  "sheikh-calm": {
    voice: "onyx",
    system: `اقرأ النص التالي كما هو بالضبط بصوت شيخ عربي رجولي هادئ وواقر.
النبرة: فصيحة سليمة — متأنية وهادئة، بإيقاع منتظم ومتوسط السرعة أو أعلى قليلاً.
كأنك شيخ يحدّث مريديه بدفء ووقار وعلم.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
  "wise-friend": {
    voice: "fable",
    system: `اقرأ النص التالي كما هو بالضبط بصوت رجل في الخامسة والثلاثين، دافئ وحكيم وودود.
النبرة: طبيعية وحميمة، سرعة خفيفة فوق المتوسط — كأنك صاحب صادق يتكلم من القلب بثقة وحنان.
لا تتوقف طويلاً بين الجمل، إيقاع متدفق وطبيعي.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
  "young-guide": {
    voice: "echo",
    system: `اقرأ النص التالي كما هو بالضبط بصوت شاب عربي حيوي وواضح ومُشجِّع.
النبرة: خفيفة وعصرية ومباشرة — سرعة أعلى من المتوسط بعض الشيء، بثقة وإيجابية كمُرشد شاب.
لا تتوقف طويلاً بين الجمل، حافظ على إيقاع متدفق وحيوي.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
  "wise-teacher": {
    voice: "shimmer",
    system: `اقرأ النص التالي كما هو بالضبط بصوت امرأة عربية رزينة وعالِمة.
النبرة: فصيحة واضحة — هادئة ومتأنية بإيقاع منتظم ومتوسط السرعة أو أعلى قليلاً، كمعلمة فاضلة.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
  "sister-caring": {
    voice: "nova",
    system: `اقرأ النص التالي كما هو بالضبط بصوت امرأة عربية شابة متفهّمة وودودة.
النبرة: دافئة وطبيعية — سرعة خفيفة فوق المتوسط، كأخت تتحدث بصدق وحنان حقيقي.
لا تتوقف طويلاً بين الجمل، إيقاع متدفق وطبيعي.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
  "gentle-mentor": {
    voice: "coral",
    system: `اقرأ النص التالي كما هو بالضبط بصوت امرأة عربية حنونة وناعمة وهادئة.
النبرة: لطيفة ومطمئنة — سرعة متوسطة إلى أعلى قليلاً، كمرشدة روحانية تبثّ السكينة.
لا تتوقف طويلاً بين الجمل، إيقاع هادئ ومتدفق.
لا تضف ولا تحذف ولا تختصر أي شيء.`,
  },
};

const DEFAULT_VOICE_PROFILE = "wise-friend";

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function stripQuranMarkers(text: string): string {
  // Remove single ayah markers {{quran:S:A|text}}
  // Remove range ayah markers {{quran:S:A-B|text}} (bot should never read Quran aloud)
  return text
    .replace(/\{\{quran:\d+:\d+(?:-\d+)?\|[^}]*\}\}/g, "")
    .replace(/﴿[^﴾]*﴾/g, "")
    // Strip "سورة X — آية N" labels that appear when AI doesn't use proper markers
    .replace(/سورة\s+\S+\s*[—–\-]\s*آية\s+[\d٠-٩]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Pre-processes AI response text to convert informal Quran citation patterns
 * like "سورة طه — آية 11\n﴿text﴾" into proper {{quran:20:11|text}} markers
 * so the segment parser can handle them correctly with reciter audio.
 */
function preprocessQuranCitations(text: string): string {
  const arabicToWestern = (s: string) =>
    s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  // Build reverse map lazily from SURAH_NAMES_AR (defined later in the file but available at runtime)
  const nameToNum: Record<string, number> = {};
  for (const [num, name] of Object.entries(SURAH_NAMES_AR)) {
    nameToNum[name] = Number(num);
  }

  return text.replace(
    /سورة\s+([^\s—–\-\n]+)\s*[—–\-]\s*آية\s+([\d٠-٩]+)\s*\n?\s*﴿([^﴾]+)﴾/g,
    (_, surahName, ayahRaw, ayahText) => {
      const surahNum = nameToNum[surahName.trim()];
      const ayahNum = parseInt(arabicToWestern(ayahRaw.trim()));
      if (!surahNum || isNaN(ayahNum)) return `﴿${ayahText}﴾`;
      return `{{quran:${surahNum}:${ayahNum}|${ayahText.trim()}}}`;
    }
  );
}

function stripFatwaMarkers(text: string): string {
  return text.replace(/\{\{fatwa:[^|]*\|[^|]*\|([^}]*)\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripStageDirections(text: string): string {
  // Remove stage directions in square brackets like [توقف] [تنفس] [بصوت هادئ] etc.
  return text
    .replace(/\[[^\]]{1,80}\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripForTTS(text: string): string {
  // Strip all markers and any leftover English bracket expressions [...]
  return stripFatwaMarkers(stripQuranMarkers(text))
    .replace(/\[[^\]]{1,60}\]/g, "")
    .replace(/\(\s*ب[^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripEmojisAndSymbols(text: string): string {
  return text
    // Remove emoji ranges
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    // Remove decorative Arabic/box-drawing characters used as separators
    .replace(/[═─━╔╗╚╝║〔〕]/g, "")
    // Remove Arabic markers / Quran decorators
    .replace(/[۝﴿﴾]/g, "")
    // Normalize multiple spaces/newlines
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function generateZakiyAudio(text: string, voiceProfileId?: string): Promise<string> {
  const cleanText = stripEmojisAndSymbols(stripForTTS(text));
  if (!cleanText.trim()) return "";

  const profileId = voiceProfileId && VOICE_PROFILES[voiceProfileId] ? voiceProfileId : DEFAULT_VOICE_PROFILE;
  const profile = VOICE_PROFILES[profileId]!;

  const ttsResponse = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: profile.voice, format: "mp3" },
    messages: [
      { role: "system", content: profile.system },
      { role: "user", content: cleanText },
    ],
  });
  return (ttsResponse.choices[0]?.message as any)?.audio?.data ?? "";
}

// ══════════════════════════════════════════
// SEGMENT-BASED AUDIO GENERATION
// ══════════════════════════════════════════

export interface ServerResponseSegment {
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

function parseRawSegments(raw: string): ServerResponseSegment[] {
  const segments: ServerResponseSegment[] = [];
  // Matches: single ayah, range ayah, fatwa, promise, surah-link
  const re = /\{\{quran:(\d+):(\d+)(?:-(\d+))?\|([^}]*)\}\}|\{\{fatwa:([^|]*)\|([^|]*)\|([^}]*)\}\}|\{\{promise:([^}]+)\}\}|\{\{surah-link:(\d+):(\d+)\|([^}]*)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const isBareLabel = (t: string) =>
    /^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)‌]?\s*$/.test(t);

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      const t = raw.slice(last, m.index).trim();
      if (t && !isBareLabel(t)) segments.push({ type: "text", text: t });
    }
    if (m[1] !== undefined) {
      const surah = Number(m[1]);
      const startAyah = Number(m[2]);
      const endAyah = m[3] !== undefined ? Number(m[3]) : startAyah;
      const fullText = m[4]!;
      if (endAyah > startAyah) {
        // Range marker: split text by verse separator ۝ if present, otherwise assign same text
        const parts = fullText.split(/\s*۝\s*/);
        for (let a = startAyah; a <= endAyah; a++) {
          const idx = a - startAyah;
          const ayahText = parts[idx]?.trim() ?? fullText.trim();
          segments.push({ type: "quran", surah, ayah: a, text: ayahText });
        }
      } else {
        segments.push({ type: "quran", surah, ayah: startAyah, text: fullText });
      }
    } else if (m[5] !== undefined) {
      segments.push({ type: "fatwa", source: m[5]!, url: m[6]!, text: m[7]! });
    } else if (m[8] !== undefined) {
      segments.push({ type: "promise", text: m[8]!.trim() });
    } else if (m[9] !== undefined) {
      const surahNum = Number(m[9]);
      const startAyah = Number(m[10]);
      const surahName = m[11] ?? "";
      segments.push({
        type: "surah-link",
        surah: surahNum,
        ayah: startAyah,
        text: surahName,
        url: `https://quran.com/${surahNum}/${startAyah}`,
      });
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    const t = raw.slice(last).trim();
    if (t && !isBareLabel(t)) segments.push({ type: "text", text: t });
  }
  return segments.length ? segments : [{ type: "text", text: raw }];
}

// ══════════════════════════════════════════
// SURAH EXPANSION
// ══════════════════════════════════════════

const SURAH_NAMES_AR: Record<number, string> = {
  1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",6:"الأنعام",
  7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",11:"هود",12:"يوسف",
  13:"الرعد",14:"إبراهيم",15:"الحجر",16:"النحل",17:"الإسراء",18:"الكهف",
  19:"مريم",20:"طه",21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",
  25:"الفرقان",26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",
  31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",36:"يس",
  37:"الصافات",38:"ص",39:"الزمر",40:"غافر",41:"فصلت",42:"الشورى",
  43:"الزخرف",44:"الدخان",45:"الجاثية",46:"الأحقاف",47:"محمد",48:"الفتح",
  49:"الحجرات",50:"ق",51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",
  55:"الرحمن",56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",
  61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",66:"التحريم",
  67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",71:"نوح",72:"الجن",
  73:"المزمل",74:"المدثر",75:"القيامة",76:"الإنسان",77:"المرسلات",78:"النبأ",
  79:"النازعات",80:"عبس",81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",
  85:"البروج",86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",
  91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",96:"العلق",
  97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",101:"القارعة",102:"التكاثر",
  103:"العصر",104:"الهمزة",105:"الفيل",106:"قريش",107:"الماعون",108:"الكوثر",
  109:"الكافرون",110:"النصر",111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس",
};

async function expandSurahMarkers(raw: string): Promise<string> {
  const re = /\{\{full-surah:(\d+)\}\}/g;
  const matches = Array.from(raw.matchAll(re));
  if (!matches.length) return raw;

  let result = raw;
  for (const match of matches) {
    const surahNum = Number(match[1]);
    try {
      const apiRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`);
      if (!apiRes.ok) continue;
      const data = await apiRes.json() as { data?: { numberOfAyahs: number; ayahs: { numberInSurah: number; text: string }[] } };
      const ayahs = data.data?.ayahs ?? [];
      const total = data.data?.numberOfAyahs ?? ayahs.length;
      const limit = 20;
      const display = ayahs.slice(0, limit);
      const surahName = SURAH_NAMES_AR[surahNum] ?? `سورة ${surahNum}`;

      let expanded = display.map((a) => `{{quran:${surahNum}:${a.numberInSurah}|${a.text}}}`).join("\n");
      if (total > limit) {
        expanded += `\n{{surah-link:${surahNum}:${limit}|${surahName}}}`;
      }
      result = result.replace(match[0], expanded);
    } catch { /* skip if API fails */ }
  }
  return result;
}

async function generateSegmentedAudio(responseText: string, voiceProfileId?: string): Promise<ServerResponseSegment[]> {
  const preprocessed = preprocessQuranCitations(responseText);
  const expanded = await expandSurahMarkers(preprocessed);
  const segments = parseRawSegments(expanded);

  // Collect text segments that need audio, generate in parallel
  const textIndices: number[] = [];
  segments.forEach((seg, i) => {
    if (seg.type === "text") textIndices.push(i);
    // promise and surah-link segments never need TTS audio
  });

  const audioResults = await Promise.all(
    textIndices.map(async (segIdx) => {
      const seg = segments[segIdx]!;
      const cleanText = stripStageDirections(stripFatwaMarkers(seg.text));
      if (!cleanText.trim()) return { segIdx, audio: "" };
      try {
        const audio = await generateZakiyAudio(seg.text, voiceProfileId);
        return { segIdx, audio };
      } catch (err) {
        console.error(`TTS failed for segment ${segIdx}:`, err);
        return { segIdx, audio: "" };
      }
    })
  );

  audioResults.forEach(({ segIdx, audio }) => {
    segments[segIdx]!.audioBase64 = audio;
  });

  return segments;
}

async function generateZakiyResponse(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  memory: ZakiyMemoryData
): Promise<string> {
  const systemPrompt = buildZakiySystemPrompt(memory);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 900,
    messages,
  });

  return chatResponse.choices[0]?.message?.content ?? "";
}

// ══════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════

router.post("/zakiy/message", async (req, res) => {
  try {
    const { message, history = [], sessionId = "", voiceProfile } = req.body as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
      voiceProfile?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const memory = await loadMemory(sessionId);
    const responseText = await generateZakiyResponse(message, history, memory);
    const segments = await generateSegmentedAudio(responseText, voiceProfile);

    // Update memory asynchronously (fire and forget)
    if (sessionId) {
      updateMemory(sessionId, message, responseText, memory).catch(() => {});
    }

    res.json({ response: responseText, segments });
  } catch (err) {
    console.error("Zakiy message error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.post("/zakiy/tts", async (req, res) => {
  try {
    const { text, voiceProfile } = req.body as { text: string; voiceProfile?: string };
    if (!text?.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    const segments = await generateSegmentedAudio(text, voiceProfile);
    res.json({ segments });
  } catch (err) {
    console.error("Zakiy TTS error:", err);
    res.status(500).json({ error: "Failed to generate audio" });
  }
});

router.post("/zakiy/suggestions", async (req, res) => {
  try {
    const { history = [], sessionId = "" } = req.body as {
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
    };

    const memory = await loadMemory(sessionId);
    const memorySection = buildMemorySection(memory);

    const lastExchange = history.slice(-4).map((m) => `${m.role === "user" ? "المستخدم" : "الزكي"}: ${m.content}`).join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 200,
      messages: [
        {
          role: "system",
          content: `أنت مساعد يقترح أسئلة متوقعة باللهجة المصرية العامية.
${memorySection}
بناءً على سياق المحادثة، اقترح 3 أسئلة قصيرة ومختلفة قد يسألها المستخدم كخطوة تالية.
أرجع JSON فقط بهذا الشكل:
{"suggestions": ["سؤال 1", "سؤال 2", "سؤال 3"]}
الأسئلة تكون: مختصرة (5-8 كلمات)، متنوعة، وباللهجة المصرية الطبيعية.`,
        },
        {
          role: "user",
          content: lastExchange || "بداية المحادثة",
        },
      ],
    });

    const raw = result.choices[0]?.message?.content ?? '{"suggestions":[]}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };

    res.json({ suggestions: parsed.suggestions ?? [] });
  } catch (err) {
    console.error("Suggestions error:", err);
    res.json({ suggestions: [] });
  }
});

router.post("/zakiy/impression", async (req, res) => {
  try {
    const { history = [], sessionId = "" } = req.body as {
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
    };

    const memory = await loadMemory(sessionId);

    const convSummary = history
      .slice(-10)
      .map((m) => `${m.role === "user" ? "المستخدم" : "الزكي"}: ${m.content.slice(0, 100)}`)
      .join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 300,
      messages: [
        {
          role: "system",
          content: `أنت "الزكي" — الصاحب الروحاني الذكي الذي يلاحظ ويتذكر.
بناءً على المعلومات المتوفرة عن المستخدم وسياق المحادثة، اكتب انطباعاً شخصياً دافئاً وصادقاً عنه.

الذاكرة المتوفرة:
${JSON.stringify(memory, null, 2)}

قواعد الانطباع:
• ابدأ بجملة دافئة تشعره بأنك فاهمه
• اذكر صفة إيجابية ملاحظها
• اذكر تحدياً يمر به مع كلمة تشجيع
• اختم بجملة أمل وتفاؤل
• الطول: 4-5 جمل فقط، باللهجة المصرية الدافئة
• لو ما عندكش معلومات كافية، قول ذلك بصدق وشجعه على مزيد من الحديث`,
        },
        {
          role: "user",
          content: convSummary || "المستخدم لم يتحدث كثيراً بعد",
        },
      ],
    });

    const impression = result.choices[0]?.message?.content ?? "لسه بتعرف بعضنا — كمّل الحديث وهشوفك أكتر!";
    res.json({ impression });
  } catch (err) {
    console.error("Impression error:", err);
    res.status(500).json({ error: "Failed to generate impression" });
  }
});

router.post("/zakiy/voice", async (req, res) => {
  try {
    const { audioBase64, history = [], sessionId = "", voiceProfile } = req.body as {
      audioBase64: string;
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
      voiceProfile?: string;
    };

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    const rawBuffer = Buffer.from(audioBase64, "base64");
    const { buffer, format } = await ensureCompatibleFormat(rawBuffer);
    const transcript = await speechToText(buffer, format);

    if (!transcript?.trim()) {
      res.status(400).json({ error: "Could not transcribe audio" });
      return;
    }

    const memory = await loadMemory(sessionId);
    const responseText = await generateZakiyResponse(transcript, history, memory);
    const segments = await generateSegmentedAudio(responseText, voiceProfile);

    if (sessionId) {
      updateMemory(sessionId, transcript, responseText, memory).catch(() => {});
    }

    res.json({ transcript, response: responseText, segments });
  } catch (err) {
    console.error("Zakiy voice error:", err);
    res.status(500).json({ error: "Failed to process voice message" });
  }
});

router.post("/zakiy/promise", async (req, res) => {
  try {
    const { sessionId, promiseText } = req.body as { sessionId: string; promiseText: string };
    if (!sessionId || !promiseText?.trim()) {
      res.status(400).json({ error: "sessionId and promiseText required" });
      return;
    }
    await savePromiseToMemory(sessionId, promiseText.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error("Promise save error:", err);
    res.status(500).json({ error: "Failed to save promise" });
  }
});

// ══════════════════════════════════════════
// RELAPSE RISK DETECTION
// ══════════════════════════════════════════

router.get("/zakiy/risk-check", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) { res.status(400).json({ error: "sessionId مطلوب" }); return; }

  try {
    const [memory, recentJournals, progress] = await Promise.all([
      loadMemory(sessionId),
      db.query.journalEntriesTable.findMany({
        where: eq(journalEntriesTable.sessionId, sessionId),
        orderBy: [desc(journalEntriesTable.createdAt)],
        limit: 5,
        columns: { content: true, mood: true, createdAt: true },
      }),
      db.query.userProgressTable.findFirst({
        where: eq(userProgressTable.sessionId, sessionId),
        columns: { streakDays: true, lastActiveDate: true, covenantDate: true },
      }),
    ]);

    const recentSlips = memory.slips?.slice(-3) ?? [];
    const brokenPromises = memory.promises?.filter((p) => p.broken) ?? [];

    const daysSinceActive = progress?.lastActiveDate
      ? Math.floor((Date.now() - new Date(progress.lastActiveDate).getTime()) / 86400000)
      : 0;

    const analysisPrompt = `أنت محلل نفسي متخصص في الصحة الروحية الإسلامية.
حلّل البيانات التالية وحدّد مستوى خطر الانتكاسة:

اليوميات الأخيرة (${recentJournals.length} مدخلات):
${recentJournals.map((j) => `- المزاج: ${j.mood ?? "غير محدد"} | المحتوى: "${String(j.content).slice(0, 100)}"`).join("\n")}

معلومات الذاكرة:
- زللات حديثة: ${recentSlips.map((s) => s.sin).join("، ") || "لا شيء"}
- وعود مكسورة: ${brokenPromises.length}
- الصفات: ${memory.traits.join("، ")}
- التحديات: ${memory.challenges.join("، ")}

بيانات التقدم:
- أيام التتابع: ${progress?.streakDays ?? 0}
- أيام منذ آخر نشاط: ${daysSinceActive}

أرجع JSON فقط:
{
  "riskLevel": "low" | "medium" | "high",
  "message": "رسالة دافئة ومختصرة من الزكي للمستخدم تناسب مستوى الخطر (جملتين فقط بالعربية)",
  "warningSign": "العلامة الأبرز التي تدل على الخطر (إن وجدت، وإلا null)"
}`;

    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 200,
      messages: [
        { role: "system", content: analysisPrompt },
        { role: "user", content: "حلّل وأرجع النتيجة" },
      ],
    });

    const raw = analysis.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { riskLevel: "low", message: "", warningSign: null };

    res.json(result);
  } catch (err) {
    console.error("Risk check error:", err);
    res.json({ riskLevel: "low", message: "", warningSign: null });
  }
});

// ══════════════════════════════════════════
// ANNIVERSARY MEMORY CHECK
// ══════════════════════════════════════════

router.get("/zakiy/anniversary", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) { res.status(400).json({ error: "sessionId مطلوب" }); return; }

  try {
    const progress = await db.query.userProgressTable.findFirst({
      where: eq(userProgressTable.sessionId, sessionId),
      columns: { covenantDate: true, streakDays: true },
    });

    if (!progress?.covenantDate) { res.json({ anniversary: null }); return; }

    const memory = await loadMemory(sessionId);
    const covenant = new Date(progress.covenantDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - covenant.getTime()) / 86400000);

    const MILESTONES: Record<number, string> = {
      7: "أسبوع",
      30: "شهر",
      40: "٤٠ يوماً",
      90: "٣ أشهر",
      180: "٦ أشهر",
      365: "سنة كاملة",
      730: "سنتان",
    };

    const milestone = MILESTONES[diffDays];
    if (!milestone) { res.json({ anniversary: null }); return; }

    const personalNote = memory.personalNote || "";
    const traits = memory.traits.join("، ");

    const msgPrompt = `أنت الزكي — الأخ الأكبر الحكيم في تطبيق دليل التوبة.
اليوم يمرّ ${milestone} على بدء المستخدم رحلة التوبة.
ما تعرفه عنه: ${traits || "لا شيء بعد"}.
ملاحظتك عنه: ${personalNote || "لم تتعرف عليه بعد"}.
اكتب رسالة قصيرة (٣-٤ جمل) تذكّره بهذه المحطة، وتشجّعه على الاستمرار.
أسلوبك: دافئ وصادق كالأخ الأكبر، ليس رسمياً.
لا تبدأ بـ "أنا" ولا بـ "الزكي".`;

    const msgResp = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 200,
      messages: [
        { role: "user", content: msgPrompt },
      ],
    });

    const message = msgResp.choices[0]?.message?.content?.trim() ?? "";

    res.json({
      anniversary: {
        milestone,
        daysCount: diffDays,
        covenantDate: progress.covenantDate,
        message,
      },
    });
  } catch (err) {
    console.error("Anniversary check error:", err);
    res.json({ anniversary: null });
  }
});

// ══════════════════════════════════════════
// ZAKIY DECIDE — AI Mode Entry Point
// ══════════════════════════════════════════

router.post("/zakiy/decide", async (req, res) => {
  try {
    const { sessionId, trustLevel = 0 } = req.body as {
      sessionId: string;
      trustLevel?: number;
    };

    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }

    const progress = await db.query.userProgressTable.findFirst({
      where: eq(userProgressTable.sessionId, sessionId),
    });

    const inactiveDays = (() => {
      if (!progress?.lastActiveDate) return 0;
      const last = new Date(progress.lastActiveDate);
      const now = new Date();
      return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    })();

    const currentHour = new Date().getHours();

    let dangerHours: number[] = [];
    try {
      const notifRow = await db.query.notificationSettingsTable.findFirst({
        where: eq(notificationSettingsTable.sessionId, sessionId),
      });
      if (notifRow?.settingsJson) {
        const parsed = JSON.parse(notifRow.settingsJson) as {
          dangerHours?: number[];
        };
        dangerHours = parsed.dangerHours ?? [];
      }
    } catch {}

    const risk = analyzeRisk({
      inactiveDays,
      lastRelapse: null,
      streakDays: progress?.streakDays ?? 0,
      currentHour,
      dangerHours,
    });

    const todayTasks = await getTodayTasks(
      sessionId,
      progress?.currentPhase ?? 1
    );

    const memory = await loadMemory(sessionId);

    // Load extended memory (anti-repetition context)
    let memoryContext = { lastAdvice: "", lastTask: "", repetitionCount: 0 };
    let rawMemoryJson: Record<string, unknown> = {};
    try {
      const memRow = await db.query.zakiyMemoryTable.findFirst({
        where: eq(zakiyMemoryTable.sessionId, sessionId),
      });
      if (memRow?.memoryJson) {
        rawMemoryJson = JSON.parse(memRow.memoryJson) as Record<string, unknown>;
        memoryContext = {
          lastAdvice: (rawMemoryJson.lastAdvice as string) ?? "",
          lastTask: (rawMemoryJson.lastTask as string) ?? "",
          repetitionCount: (rawMemoryJson.repetitionCount as number) ?? 0,
        };
      }
    } catch {}

    const hour = currentHour;
    const timeOfDay =
      hour < 5 ? "ما قبل الفجر"
      : hour < 7 ? "وقت الفجر"
      : hour < 12 ? "الصباح"
      : hour < 14 ? "وقت الظهر"
      : hour < 17 ? "بعد الظهر"
      : hour < 19 ? "وقت العصر"
      : hour < 21 ? "المغرب والعشاء"
      : "الليل";

    const decision = await decide({
      sessionId,
      streakDays: progress?.streakDays ?? 0,
      inactiveDays,
      sinCategory: progress?.sinCategory ?? "other",
      riskScore: risk.score,
      currentPhase: progress?.currentPhase ?? 1,
      covenantSigned: progress?.covenantSigned ?? false,
      trustLevel,
      todayTasks,
      timeOfDay,
      memoryTraits: memory.traits,
      memoryContext,
    });

    // Update memory with this advice (async, non-blocking)
    try {
      const isRepeat =
        memoryContext.lastAdvice !== "" &&
        decision.action.target === memoryContext.lastAdvice;

      const newMemoryJson = JSON.stringify({
        ...rawMemoryJson,
        lastAdvice: decision.action.target,
        lastTask: decision.task?.id ?? memoryContext.lastTask,
        repetitionCount: isRepeat ? memoryContext.repetitionCount + 1 : 1,
      });

      db.insert(zakiyMemoryTable)
        .values({ sessionId, memoryJson: newMemoryJson })
        .onConflictDoUpdate({
          target: zakiyMemoryTable.sessionId,
          set: { memoryJson: newMemoryJson },
        })
        .catch(() => {});
    } catch {}

    // Final validation — never return empty response
    const safeMessage = decision.message?.trim() || "ابدأ بخطوة صغيرة — الله يستر ويعين.";
    const safeTarget = decision.action?.target || "/dhikr";
    const safeLabel = decision.actionLabel?.trim() || "ابدأ الآن";

    res.json({
      ...decision,
      message: safeMessage,
      action: { type: "redirect", target: safeTarget },
      actionLabel: safeLabel,
      riskScore: risk.score,
      riskTriggers: risk.triggers,
    });
  } catch (err) {
    console.error("[zakiy/decide]", err);
    // Failsafe — never return empty/error to client
    res.json({
      message: "ابدأ بحاجة بسيطة… ذكر خفيف هيظبطك.",
      action: { type: "redirect", target: "/dhikr" },
      actionLabel: "ابدأ ذكر",
      urgency: "low",
      decisionType: "growth",
      riskScore: 0,
      riskTriggers: [],
    });
  }
});

export default router;
