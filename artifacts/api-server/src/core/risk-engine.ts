export interface RiskContext {
  inactiveDays: number;
  lastRelapse: string | null;
  streakDays: number;
  currentHour: number;
  dangerHours?: number[];
}

export interface RiskResult {
  score: number;
  triggers: string[];
  shouldTriggerSOS: boolean;
}

export function analyzeRisk(ctx: RiskContext): RiskResult {
  let score = 0;
  const triggers: string[] = [];

  if (ctx.lastRelapse) {
    const hoursSince =
      (Date.now() - new Date(ctx.lastRelapse).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      score += 0.4;
      triggers.push("انتكاسة حديثة (أقل من 24 ساعة)");
    }
  }

  if (ctx.inactiveDays >= 3) {
    score += 0.3;
    triggers.push("غياب طويل عن التطبيق (3 أيام أو أكثر)");
  } else if (ctx.inactiveDays >= 1) {
    score += 0.1;
    triggers.push("لم يفتح التطبيق أمس");
  }

  if (ctx.dangerHours && ctx.dangerHours.includes(ctx.currentHour)) {
    score += 0.2;
    triggers.push("وقت خطر محدد من المستخدم");
  }

  if (ctx.streakDays === 0) {
    score += 0.1;
    triggers.push("لا يوجد streak نشط");
  }

  if (ctx.streakDays > 7) {
    score = Math.max(0, score - 0.2);
  }

  score = Math.min(1, Math.max(0, score));

  return {
    score,
    triggers,
    shouldTriggerSOS: score > 0.9,
  };
}

export function shouldTriggerSOS(score: number): boolean {
  return score > 0.9;
}
