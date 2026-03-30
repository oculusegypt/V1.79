import { openai } from "@workspace/integrations-openai-ai-server";
import type { UnifiedTask } from "./task-engine.js";

export interface ZakiyContext {
  sessionId: string;
  streakDays: number;
  inactiveDays: number;
  sinCategory: string;
  riskScore: number;
  currentPhase: number;
  covenantSigned: boolean;
  trustLevel: number;
  todayTasks: UnifiedTask[];
  timeOfDay: string;
  memoryTraits?: string[];
}

export interface ZakiyDecision {
  message: string;
  action: { type: "redirect"; target: string };
  actionLabel: string;
  urgency: "low" | "medium" | "high" | "emergency";
  task?: UnifiedTask;
}

function chooseTarget(ctx: ZakiyContext): {
  target: string;
  actionLabel: string;
  urgency: ZakiyDecision["urgency"];
  task?: UnifiedTask;
} {
  if (ctx.riskScore > 0.9) {
    return {
      target: "/sos",
      actionLabel: "افتح طوارئ التوبة",
      urgency: "emergency",
    };
  }

  if (ctx.inactiveDays >= 3) {
    return {
      target: "/relapse",
      actionLabel: "اقرأ عن الانتكاسة",
      urgency: "high",
    };
  }

  if (!ctx.covenantSigned) {
    return {
      target: "/covenant",
      actionLabel: "وقّع عهد التوبة",
      urgency: "high",
    };
  }

  const incompleteRequired = ctx.todayTasks.find(
    (t) => t.priority === "required" && !t.completed
  );
  if (incompleteRequired) {
    return {
      target: incompleteRequired.route ?? "/day-one",
      actionLabel: incompleteRequired.title,
      urgency: "medium",
      task: incompleteRequired,
    };
  }

  const incompleteRecommended = ctx.todayTasks.find(
    (t) => t.priority === "recommended" && !t.completed
  );
  if (incompleteRecommended) {
    return {
      target: incompleteRecommended.route ?? "/habits",
      actionLabel: incompleteRecommended.title,
      urgency: "medium",
      task: incompleteRecommended,
    };
  }

  if (ctx.currentPhase >= 1 && ctx.covenantSigned) {
    return {
      target: "/journey",
      actionLabel: "تابع رحلتك",
      urgency: "low",
    };
  }

  return {
    target: "/dhikr",
    actionLabel: "ابدأ الذكر الآن",
    urgency: "low",
  };
}

async function generateMessage(
  ctx: ZakiyContext,
  target: string,
  urgency: ZakiyDecision["urgency"]
): Promise<string> {
  const traits =
    ctx.memoryTraits && ctx.memoryTraits.length > 0
      ? `ما تعرفه عنه: ${ctx.memoryTraits.join("، ")}.`
      : "";

  const urgencyHints: Record<ZakiyDecision["urgency"], string> = {
    emergency:
      "الموقف خطير جداً — استخدم أسلوباً حازماً لكن محبباً ومشجعاً، ليس مخيفاً.",
    high: "الموقف يحتاج تدخلاً — أسلوبك جدي ومباشر ومليء بالأمل.",
    medium: "أسلوبك مشجع وإيجابي.",
    low: "أسلوبك هادئ ودافئ.",
  };

  const contextLines = [
    `- الـ streak الحالي: ${ctx.streakDays} يوم`,
    `- أيام الغياب: ${ctx.inactiveDays}`,
    `- المرحلة: ${ctx.currentPhase}`,
    `- وقت اليوم: ${ctx.timeOfDay}`,
    `- سيتوجه لـ: ${target}`,
    traits,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `أنت الزكي — الأخ الأكبر الحكيم في تطبيق دليل التوبة.
${traits}
${urgencyHints[urgency]}

السياق:
${contextLines}

اكتب رسالة قصيرة جداً (جملتان أو ثلاث بالعربية) تناسب هذا الوضع.
لا تبدأ بـ "أنا" أو "الزكي". لا تذكر اسم التطبيق.
الرسالة موجهة مباشرة للمستخدم.`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });
    return (
      resp.choices[0]?.message?.content?.trim() ??
      "خطوة واحدة تُغيّر كل شيء — ابدأ الآن."
    );
  } catch {
    return "خطوة واحدة تُغيّر كل شيء — ابدأ الآن.";
  }
}

export async function decide(ctx: ZakiyContext): Promise<ZakiyDecision> {
  const { target, actionLabel, urgency, task } = chooseTarget(ctx);
  const message = await generateMessage(ctx, target, urgency);

  return {
    message,
    action: { type: "redirect", target },
    actionLabel,
    urgency,
    task,
  };
}
