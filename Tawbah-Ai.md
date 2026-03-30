# خطة تحويل تطبيق تَوبة — Zakiy AI-Assisted Mode

> **للوكيل اللي هيكمل من هنا:** اقرأ القسم "حالة التقدم" أولاً، روح على أول مهمة حالتها `IN_PROGRESS` أو أول `TODO` في الـ Phase الحالي.

---

## حالة التقدم الكلية

| Phase | الاسم | الحالة |
|-------|-------|--------|
| Phase 1 | Backend Core (risk + zakiy + task engines) | `DONE` |
| Phase 2 | Frontend Core (context + components) | `DONE` |
| Phase 3 | ربط الصفحات (Home + Dhikr + Journey) | `DONE` |

**آخر مهمة منتهية:** T3.3 — Zakiy Panel في Journey  
**آخر تحديث:** بعد اكتمال التنفيذ الكامل

---

## المبدأ الأساسي (تحديث نهائي)

**لا شيء يُحذف. لا شيء يُكسر.**

نضيف طبقة جديدة فوق التطبيق الحالي:
> **AI-Assisted Mode (Zakiy Mode)** — المستخدم يختار، زكي يرشد ولا يُجبر.

### قاعدة الـ Emergency الوحيدة:
- `riskScore > 0.9`: عرض overlay كامل + اهتزاز + صوت، لكن **المستخدم يؤكد** قبل الانتقال.

---

## تحليل الواقع الحالي

**الصفحات:** 40+ صفحة، كلها تبقى كما هي بدون أي تعديل إلا Home و Dhikr و Journey (إضافات فقط).

**قاعدة البيانات:**
- `user_progress` — streak، covenantDate، sinCategory، currentPhase، lastActiveDate
- `zakiy_memory` — traits، challenges، promises، slips (يُستخدم للـ message)
- `push_jobs` — موجود ويعمل

**Auth:** Supabase + sessionId في localStorage (`tawbah_session`)

**Zakiy الحالي:** chat فقط في `/zakiy` — يبقى كما هو، نضيف endpoint جديد `/api/zakiy/decide`

---

## الملفات الجديدة (ملخص)

### Backend
| الملف | الوظيفة |
|-------|---------|
| `artifacts/api-server/src/core/risk-engine.ts` | حساب riskScore (0-1) |
| `artifacts/api-server/src/core/task-engine.ts` | قائمة موحدة للمهام اليومية |
| `artifacts/api-server/src/core/zakiy-engine.ts` | decision engine (rule + GPT message) |
| إضافة في `zakiy.ts` | endpoint: `POST /api/zakiy/decide` |

### Frontend
| الملف | الوظيفة |
|-------|---------|
| `artifacts/tawbah-web/src/context/ZakiyModeContext.tsx` | global aiMode + trustLevel state |
| `artifacts/tawbah-web/src/core/user-state.ts` | unified user state hook |
| `artifacts/tawbah-web/src/components/ZakiyModeDashboard.tsx` | واجهة aiMode في Home |
| `artifacts/tawbah-web/src/components/ZakiyPanel.tsx` | panel صغير في الصفحات |
| `artifacts/tawbah-web/src/components/ZakiyEmergencyOverlay.tsx` | emergency overlay |

### تعديلات موجودة
| الملف | التغيير |
|-------|---------|
| `home.tsx` | إضافة toggle + ZakiyModeDashboard (conditional) |
| `dhikr.tsx` | إضافة ZakiyPanel (conditional) |
| `journey/index.tsx` | إضافة ZakiyPanel (conditional) |
| `App.tsx` | إضافة ZakiyModeProvider |

---

## Phase 1: Backend Core

### T1.1 — Risk Engine
**الحالة:** `DONE`  
**الملف:** `artifacts/api-server/src/core/risk-engine.ts`

```typescript
// riskScore: 0.0 → 1.0
// shouldTriggerSOS: true لما riskScore > 0.9
export function analyzeRisk(ctx: RiskContext): RiskResult
```

**قواعد الـ score:**
- `lastRelapse` منذ أقل من 24 ساعة: `+0.4`
- `inactiveDays >= 3`: `+0.3`
- `dangerHours` includes currentHour: `+0.2`
- `streakDays === 0`: `+0.1`
- `streakDays > 7`: `-0.2` (وقاية)
- max: 1.0

---

### T1.2 — Task Engine
**الحالة:** `DONE`  
**الملف:** `artifacts/api-server/src/core/task-engine.ts`

```typescript
export async function getTodayTasks(sessionId: string, phase: number): Promise<UnifiedTask[]>
```

---

### T1.3 — Zakiy Engine
**الحالة:** `DONE`  
**الملف:** `artifacts/api-server/src/core/zakiy-engine.ts`

**Input:** ZakiyContext (sessionId, streakDays, riskScore, trustLevel, todayTasks, timeOfDay...)  
**Output:**
```typescript
{
  message: string,        // من GPT-4o بالعربية
  action: { type: 'redirect', target: string },
  actionLabel: string,    // نص الزر
  urgency: 'low' | 'medium' | 'high' | 'emergency',
  task?: UnifiedTask
}
```

**قواعد الـ action (rule-based، message من GPT):**
- `riskScore > 0.9` → target: `/sos`, urgency: emergency
- `inactiveDays >= 3` → target: `/relapse`, urgency: high
- `!covenantSigned` → target: `/covenant`, urgency: high
- `phase === 1` + today tasks موجودة → target: `/journey`, urgency: medium
- default → target: `/dhikr`, urgency: low

---

### T1.4 — API Endpoint: POST /api/zakiy/decide
**الحالة:** `DONE`  
**إضافة في:** `artifacts/api-server/src/routes/zakiy.ts`

```
POST /api/zakiy/decide
Body: { sessionId: string }
Response: ZakiyDecision
```

---

## Phase 2: Frontend Core

### T2.1 — ZakiyModeContext
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/context/ZakiyModeContext.tsx`

```typescript
interface ZakiyModeContextValue {
  aiMode: boolean;
  toggleAiMode: () => void;
  trustLevel: number;        // 0-3, persisted في localStorage
  setTrustLevel: (n: number) => void;
  decision: ZakiyDecision | null;
  fetchDecision: (sessionId: string) => Promise<void>;
  isLoading: boolean;
}
```

**Persistence:** aiMode و trustLevel في localStorage.

---

### T2.2 — User State Hook
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/core/user-state.ts`

---

### T2.3 — ZakiyModeDashboard Component
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/components/ZakiyModeDashboard.tsx`

يظهر عندما `aiMode = true` في الـ home:
```
[رسالة زكي]
[حالة المستخدم: streak، مرحلة، آخر نشاط]
[زر: "ابدأ الآن"]
  ← يستدعي /api/zakiy/decide
  ← يعرض message + زر تأكيد
  ← المستخدم يضغط → navigate
```

---

### T2.4 — ZakiyPanel Component
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/components/ZakiyPanel.tsx`

Panel صغير يظهر في أسفل الصفحات عندما `aiMode = true`.  
يعرض: آخر suggestion من زكي + زر "اتبع إرشاد زكي".

---

### T2.5 — ZakiyEmergencyOverlay
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/components/ZakiyEmergencyOverlay.tsx`

يظهر فقط لما `urgency === 'emergency'`:
- Full screen overlay
- رسالة تحذيرية
- زرّان: "اذهب لـ SOS الآن" + "أنا بخير"
- يهتز الهاتف لو capacitor متاح

---

## Phase 3: ربط الصفحات

### T3.1 — Home Page
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/pages/home.tsx`

**التغييرات (إضافات فقط):**
1. إضافة toggle button "دع زكي يقودك" (أو "وضع يدوي") في أعلى الصفحة
2. إضافة `ZakiyEmergencyOverlay` (يظهر عند emergency)
3. Conditional: لو `aiMode = true` → عرض `ZakiyModeDashboard` بدل المحتوى العادي

```tsx
// في بداية return في home.tsx
{aiMode ? <ZakiyModeDashboard /> : <>{/* existing content */}</>}
```

---

### T3.2 — Dhikr Page
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/pages/dhikr.tsx`

إضافة `<ZakiyPanel />` في آخر الصفحة (conditional على aiMode).

---

### T3.3 — Journey Page
**الحالة:** `DONE`  
**الملف:** `artifacts/tawbah-web/src/pages/journey/index.tsx`

إضافة `<ZakiyPanel />` في آخر الصفحة (conditional على aiMode).

---

## Trust Level System

| Level | السلوك |
|-------|--------|
| 0 | suggestions فقط — زكي يقترح، المستخدم يتجاهل أو يتبع |
| 1 | suggest + تلوين المهمة الأفضل باللون الذهبي |
| 2 | suggest + ترتيب المهام بحيث الأهم أولاً |
| 3 | يسمح بـ emergency overlay (auto-show عند riskScore > 0.9) |

---

## ترتيب التنفيذ

```
T1.1 (risk-engine) ← أولاً، لا dependencies
T1.2 (task-engine) ← بالتوازي مع T1.1
    ↓
T1.3 (zakiy-engine) ← يحتاج T1.1 + T1.2
    ↓
T1.4 (API endpoint) ← يحتاج T1.3
    ↓
T2.1 (ZakiyModeContext) ← يحتاج T1.4
T2.2 (user-state hook)  ← بالتوازي
T2.3 (ZakiyModeDashboard) ← يحتاج T2.1
T2.4 (ZakiyPanel)         ← يحتاج T2.1
T2.5 (EmergencyOverlay)   ← يحتاج T2.1
    ↓
T3.1 (Home)    ← يحتاج T2.1 + T2.3 + T2.5
T3.2 (Dhikr)   ← يحتاج T2.4
T3.3 (Journey) ← يحتاج T2.4
```

---

## ما لن يُعمل (قرار نهائي)

| الفكرة | القرار | السبب |
|--------|--------|-------|
| حذف أي route موجود | ❌ | CORE RULE |
| Forced navigation بدون confirmation | ❌ | CORE RULE |
| Zakiy يتحكم بالـ navigation تلقائياً | ❌ | Zakiy يرشد فقط |
| إعادة كتابة home.tsx | ❌ | 3549 سطر، تعديل minimal فقط |

---

## كيف تحدّث هذا الملف

```markdown
### T1.1 — Risk Engine
**الحالة:** `DONE`       ← غيّر من TODO
**منتهية في:** 2026-03-30
**ملاحظات:** [أي ملاحظة]
```

---

*هذا الملف المرجع الوحيد. لا تنفذ شيئاً غير موجود هنا.*
