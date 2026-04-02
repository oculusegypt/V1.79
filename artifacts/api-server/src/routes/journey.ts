import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { journey30Table, journey30TasksTable, userProgressTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { optionalAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

const JOURNEY_DAYS: Array<{ day: number; title: string; tasks: string[]; verse: string }> = [
  { day: 1, title: "يوم الانطلاق", tasks: ["قرأ سورة التوبة", "استغفر 100 مرة", "ابكِ بين يدي الله"], verse: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾" },
  { day: 2, title: "يوم الصدق", tasks: ["صلِّ الفجر في وقته", "قرأ صفحتين من القرآن", "تجنّب الخلوة الإلكترونية"], verse: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ﴾" },
  { day: 3, title: "يوم الصلاة", tasks: ["صلِّ جميع الصلوات في وقتها", "اقرأ آية الكرسي بعد كل صلاة", "صلِّ سنة الضحى"], verse: "﴿إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنكَرِ﴾" },
  { day: 4, title: "يوم الذكر", tasks: ["قل سبحان الله 100 مرة", "قل الحمد لله 100 مرة", "قل الله أكبر 100 مرة"], verse: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾" },
  { day: 5, title: "يوم القرآن", tasks: ["اقرأ ربع حزب من القرآن", "تدبّر في معاني آيات التوبة", "احفظ آية واحدة جديدة"], verse: "﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾" },
  { day: 6, title: "يوم البيئة", tasks: ["أزل كل المحتوى المحرم من هاتفك", "غيّر كلمات المرور للحسابات التي تؤذيك", "تابع حسابات علمية نافعة"], verse: "﴿وَلَا تَقْرَبُوا الْفَوَاحِشَ مَا ظَهَرَ مِنْهَا وَمَا بَطَنَ﴾" },
  { day: 7, title: "أسبوع من النور", tasks: ["صلِّ قيام الليل ولو ركعتين", "ادعُ الله بأسمائه الحسنى", "تصدّق بشيء ولو قليل"], verse: "﴿وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ﴾" },
  { day: 8, title: "يوم الشكر", tasks: ["اعدد 10 نعم من نعم الله عليك", "قل الحمد لله 100 مرة", "اتصل بأحد والديك"], verse: "﴿لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ﴾" },
  { day: 9, title: "يوم الصبر", tasks: ["تجنّب أي معصية اليوم بأي ثمن", "استعذ بالله عند كل إغراء", "قرأ قصة يوسف عليه السلام"], verse: "﴿إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ﴾" },
  { day: 10, title: "يوم الدعاء", tasks: ["ادعُ في السجود بكل ما في قلبك", "ادعُ في الثلث الأخير من الليل", "ادعُ لنفسك ولوالديك ولأمة محمد"], verse: "﴿وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ﴾" },
  { day: 11, title: "يوم التواضع", tasks: ["زر شخصاً يعلمك أو كبيراً في السن", "قل أستغفر الله العظيم 70 مرة", "اذكر ذنوبك بينك وبين الله وتب"], verse: "﴿وَعِبَادُ الرَّحْمَنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا﴾" },
  { day: 12, title: "يوم الجسد", tasks: ["نم مبكراً لتستيقظ لصلاة الفجر", "مارس رياضة خفيفة", "تجنّب كل ما يضعف إرادتك"], verse: "﴿وَلَا تُلْقُوا بِأَيْدِيكُمْ إِلَى التَّهْلُكَةِ﴾" },
  { day: 13, title: "يوم العلم", tasks: ["استمع لمحاضرة دينية", "اقرأ في كتاب إسلامي", "شارك علماً نافعاً مع أحد"], verse: "﴿هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ﴾" },
  { day: 14, title: "أسبوعان من التوبة", tasks: ["راجع أسبوعك الماضي", "استغفر عن أي تقصير", "جدّد نيتك وعزيمتك"], verse: "﴿وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ﴾" },
  { day: 15, title: "منتصف الرحلة", tasks: ["احتفل بنصف الطريق", "تصدّق بصدقة جارية", "ادعُ الله بالثبات"], verse: "﴿إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا تَتَنَزَّلُ عَلَيْهِمُ الْمَلَائِكَةُ﴾" },
  { day: 16, title: "يوم الأسرة", tasks: ["صلِّ في الجماعة", "أصلح علاقة مع أحد أقاربك", "ادعُ لوالديك بالرحمة والمغفرة"], verse: "﴿وَبِالْوَالِدَيْنِ إِحْسَانًا﴾" },
  { day: 17, title: "يوم الاستعاذة", tasks: ["قل أعوذ بالله من الشيطان كلما شعرت بإغراء", "اقرأ المعوذتين 3 مرات", "تجنّب الخلوة التامة"], verse: "﴿وَإِمَّا يَنزَغَنَّكَ مِنَ الشَّيْطَانِ نَزْغٌ فَاسْتَعِذْ بِاللَّهِ﴾" },
  { day: 18, title: "يوم التفكّر", tasks: ["تأمّل في خلق الله ساعة", "فكّر في الجنة وما أعدّ الله للتائبين", "اكتب ما تريد من الله في يوميّاتك"], verse: "﴿إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ﴾" },
  { day: 19, title: "يوم الحلاوة", tasks: ["ابحث عن حلاوة الإيمان في صلاتك", "اقرأ القرآن بتدبّر وتفكّر", "ادعُ الله أن يرزقك لذة العبادة"], verse: "﴿فَمَن يُرِدِ اللَّهُ أَن يَهْدِيَهُ يَشْرَحْ صَدْرَهُ لِلْإِسْلَامِ﴾" },
  { day: 20, title: "يوم الهمّة", tasks: ["ضع هدفاً روحياً جديداً", "عزم جديد ونيّة جديدة", "اقرأ عن همم السلف في توبتهم"], verse: "﴿وَأَنِيبُوا إِلَى رَبِّكُمْ وَأَسْلِمُوا لَهُ﴾" },
  { day: 21, title: "ثلاثة أسابيع", tasks: ["أنت الآن تشكّل عادة جديدة", "واصل لا تتوقف", "شارك رحلتك مع شخص تثق به"], verse: "﴿وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا﴾" },
  { day: 22, title: "يوم الصوم", tasks: ["صم تطوعاً إن استطعت", "أكثر من الدعاء عند الإفطار", "تصدّق بشيء بنيّة التوبة"], verse: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ﴾" },
  { day: 23, title: "يوم الصلة", tasks: ["صل رحمك", "زر مريضاً أو عُده بالهاتف", "تصدّق على محتاج"], verse: "﴿إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَى﴾" },
  { day: 24, title: "يوم المراقبة", tasks: ["تذكّر أن الله يراك في كل لحظة", "استح من الله استحياء حقيقياً", "راقب قلبك قبل أي فعل"], verse: "﴿أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَى﴾" },
  { day: 25, title: "يوم الأمل", tasks: ["اقرأ قصصاً عن توبة الصحابة", "تفاءل بالله خيراً", "ادعُ بيقين أن الله قبل توبتك"], verse: "﴿وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ﴾" },
  { day: 26, title: "يوم المحاسبة", tasks: ["حاسب نفسك على الأسبوع الماضي", "تب عن أي تقصير بنيّة صادقة", "خطّط للأسبوع القادم روحياً"], verse: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ﴾" },
  { day: 27, title: "يوم اليقين", tasks: ["تيقّن أن الله غفور رحيم", "لا تيأس من وسوسة الشيطان", "قل 100 مرة: الله أكبر وله الحمد"], verse: "﴿وَمَن يَقْنَطُ مِن رَّحْمَةِ رَبِّهِ إِلَّا الضَّالُّونَ﴾" },
  { day: 28, title: "يوم الدموع", tasks: ["ابكِ من خشية الله", "صلِّ بخشوع وحضور قلب", "اسأل الله المغفرة وأنت متأكد أنه سيغفر"], verse: "﴿إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ﴾" },
  { day: 29, title: "قبل النهاية", tasks: ["لا تتوقف — أنت على بعد يوم واحد", "راجع رحلتك كاملة بعين الامتنان", "ادعُ الله بالثبات بعد انتهاء الرحلة"], verse: "﴿وَاعْبُدْ رَبَّكَ حَتَّى يَأْتِيَكَ الْيَقِينُ﴾" },
  { day: 30, title: "يوم الختام المجيد", tasks: ["احتفل بهذا الإنجاز العظيم", "تصدّق بصدقة شكراً لله", "جدّد عهدك مع الله للمستقبل"], verse: "﴿فَأَمَّا مَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا فَعَسَى أَن يَكُونَ مِنَ الْمُفْلِحِينَ﴾" },
];

function getUserId(req: AuthenticatedRequest): string | null {
  if (req.auth?.sub) return req.auth.sub;
  const sessionId = (req.query.sessionId as string | undefined)
    ?? (req.body as { sessionId?: string } | undefined)?.sessionId;
  return sessionId ?? null;
}

router.get("/journey30", optionalAuth, async (req, res) => {
  const aReq = req as AuthenticatedRequest;
  const userId = getUserId(aReq);
  if (!userId) return res.status(400).json({ error: "sessionId or auth token required" });

  const [rows, taskRows] = await Promise.all([
    db.query.journey30Table.findMany({
      where: eq(journey30Table.userId, userId),
    }),
    db.query.journey30TasksTable.findMany({
      where: eq(journey30TasksTable.userId, userId),
    }),
  ]);

  const completedDays = new Set(rows.filter(r => r.completed).map(r => r.dayNumber));
  const currentDay = completedDays.size + 1;

  const tasksByDay: Record<number, boolean[]> = {};
  for (const t of taskRows) {
    if (!tasksByDay[t.dayNumber]) {
      const dayData = JOURNEY_DAYS.find(d => d.day === t.dayNumber);
      tasksByDay[t.dayNumber] = Array(dayData?.tasks.length ?? 0).fill(false);
    }
    if (tasksByDay[t.dayNumber]) {
      tasksByDay[t.dayNumber]![t.taskIndex] = t.completed;
    }
  }

  const days = JOURNEY_DAYS.map(d => ({
    ...d,
    completed: completedDays.has(d.day),
    isCurrent: d.day === currentDay,
    isLocked: d.day > currentDay,
    taskChecks: tasksByDay[d.day] ?? Array(d.tasks.length).fill(false),
  }));

  return res.json({
    days,
    completedCount: completedDays.size,
    currentDay,
    streakDays: completedDays.size,
  });
});

router.post("/journey30/task-toggle", optionalAuth, async (req, res) => {
  const aReq = req as AuthenticatedRequest;
  const userId = getUserId(aReq);
  if (!userId) return res.status(400).json({ error: "sessionId or auth token required" });

  const { dayNumber, taskIndex, completed } = req.body as {
    dayNumber: number; taskIndex: number; completed: boolean;
  };
  if (dayNumber == null || taskIndex == null) {
    return res.status(400).json({ error: "dayNumber, taskIndex required" });
  }

  const existing = await db.query.journey30TasksTable.findFirst({
    where: and(
      eq(journey30TasksTable.userId, userId),
      eq(journey30TasksTable.dayNumber, dayNumber),
      eq(journey30TasksTable.taskIndex, taskIndex),
    ),
  });

  if (existing) {
    await db.update(journey30TasksTable)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(and(
        eq(journey30TasksTable.userId, userId),
        eq(journey30TasksTable.dayNumber, dayNumber),
        eq(journey30TasksTable.taskIndex, taskIndex),
      ));
  } else {
    await db.insert(journey30TasksTable).values({
      userId,
      dayNumber,
      taskIndex,
      completed,
      completedAt: completed ? new Date() : null,
    });
  }

  const dayData = JOURNEY_DAYS.find(d => d.day === dayNumber);
  if (!dayData) return res.json({ success: true, allDone: false });

  const allTaskRows = await db.query.journey30TasksTable.findMany({
    where: and(
      eq(journey30TasksTable.userId, userId),
      eq(journey30TasksTable.dayNumber, dayNumber),
    ),
  });

  const completedCount = allTaskRows.filter(t => t.completed).length;
  const allDone = completedCount >= dayData.tasks.length;

  if (allDone) {
    const existingDay = await db.query.journey30Table.findFirst({
      where: and(
        eq(journey30Table.userId, userId),
        eq(journey30Table.dayNumber, dayNumber)
      ),
    });

    if (!existingDay) {
      await db.insert(journey30Table).values({
        userId,
        dayNumber,
        completed: true,
        completedAt: new Date(),
        date: new Date().toISOString().split("T")[0],
      });
    }
  }

  return res.json({ success: true, allDone });
});

router.post("/journey30/complete", optionalAuth, async (req, res) => {
  const aReq = req as AuthenticatedRequest;
  const userId = getUserId(aReq);
  if (!userId) return res.status(400).json({ error: "sessionId or auth token required" });

  const { dayNumber } = req.body as { dayNumber: number };
  if (!dayNumber) return res.status(400).json({ error: "dayNumber required" });

  const dayData = JOURNEY_DAYS.find(d => d.day === dayNumber);
  if (!dayData) return res.status(400).json({ error: "يوم غير صحيح" });

  const existing = await db.query.journey30Table.findFirst({
    where: and(
      eq(journey30Table.userId, userId),
      eq(journey30Table.dayNumber, dayNumber)
    ),
  });

  if (existing) {
    const [updated] = await db.update(journey30Table)
      .set({ completed: true, completedAt: new Date(), date: new Date().toISOString().split("T")[0] })
      .where(and(eq(journey30Table.userId, userId), eq(journey30Table.dayNumber, dayNumber)))
      .returning();
    return res.json({ success: true, day: updated });
  }

  const [created] = await db.insert(journey30Table).values({
    userId,
    dayNumber,
    completed: true,
    completedAt: new Date(),
    date: new Date().toISOString().split("T")[0],
  }).returning();

  return res.json({ success: true, day: created });
});

router.post("/journey30/relapse", optionalAuth, async (req, res) => {
  const aReq = req as AuthenticatedRequest;
  const userId = getUserId(aReq);
  if (!userId) return res.status(400).json({ error: "sessionId or auth token required" });

  await Promise.all([
    db.delete(journey30Table).where(eq(journey30Table.userId, userId)),
    db.delete(journey30TasksTable).where(eq(journey30TasksTable.userId, userId)),
  ]);

  const existingProgress = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, userId),
  });

  if (existingProgress) {
    await db
      .update(userProgressTable)
      .set({ relapseCount: (existingProgress.relapseCount ?? 0) + 1 })
      .where(eq(userProgressTable.sessionId, userId));
  }

  return res.json({ success: true });
});

export default router;
