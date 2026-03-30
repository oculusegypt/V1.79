# خطة تحويل تطبيق تَوبة إلى نظام ذكاء اصطناعي مُوَجِّه (AI-Orchestrated)

> **للوكيل اللي هيكمل من هنا:** اقرأ القسم "حالة التقدم" أولاً، بعدين روح على المهمة اللي حالتها `IN_PROGRESS` أو أول `TODO` في الـ Phase الحالي.

---

## حالة التقدم الكلية

| Phase | الاسم | الحالة |
|-------|-------|--------|
| Phase 1 | تثبيت الأساس | `TODO` |
| Phase 2 | دمج الأنظمة | `TODO` |
| Phase 3 | التحكم الذكي | `TODO` |
| Phase 4 | تحسين التجربة | `TODO` |

**آخر مهمة منتهية:** لا شيء بعد  
**آخر تحديث:** بداية الخطة

---

## تحليل الواقع الحالي (بدون تجميل)

### ما يوجد فعلاً في المشروع

**الصفحات (40+ صفحة مستقلة):**
- كل صفحة تعمل لوحدها بدون وعي بالصفحات الأخرى
- `home.tsx` = 3549 سطر — أكبر ملف في المشروع
- `journey30.tsx` = سطر واحد فقط (redirect لـ `journey/index`)
- `sos.tsx` = 254 سطر، `danger-times.tsx` = 231 سطر

**قاعدة البيانات (PostgreSQL + Drizzle):**
- `user_progress` — streak، covenantDate، sinCategory، currentPhase
- `habits` — عادات يومية بالتاريخ
- `dhikr_count` — عدادات الذكر
- `kaffarah_steps` — خطوات الكفارة
- `journal_entries` — يوميات
- `zakiy_memory` — ذاكرة الزكي (traits، challenges، promises، slips)
- `push_jobs` — نظام إشعارات موجود بالفعل
- `hadi_task_groups` + `hadi_task_items` — مهام هادي

**API Routes الموجودة:**
- `tawbah.ts` — progress، habits، dhikr، kaffarah، journal
- `zakiy.ts` — chat، memory، anniversary
- `hadi-tasks.ts` — extract tasks من نص
- `push.ts` — نظام push notifications
- `dhikr-rooms.ts` — غرف الذكر الجماعية

**State Management الحالي:**
- `AuthContext` — Supabase auth + session IDs في localStorage
- `SettingsContext` — theme، language
- `NotificationsContext` — dua peak، adhkar modals
- `useUserProgress()` hook — يجلب progress من API
- localStorage: `tawbah_session`، `tawbah_user_id`

**نظام Auth:**
- Supabase (يحتاج `SUPABASE_URL` + `SUPABASE_ANON_KEY`)
- Session ID: إما `user_<supabase_id>` أو `guest_<timestamp>`

---

## المشاكل الحقيقية (مش رأي — حقائق من الكود)

### المشكلة 1: الزكي مجرد chat
**الملف:** `artifacts/tawbah-web/src/pages/zakiy.tsx` و `artifacts/api-server/src/routes/zakiy.ts`  
**الواقع:** الزكي يستقبل رسالة ويرجع رد نصي فقط. لا يوجد `action` أو `redirect`.

### المشكلة 2: لا يوجد User State موحد
**الواقع:** البيانات موزعة — progress من API، session من localStorage، theme من SettingsContext. لا يوجد ملف واحد يجمعها.

### المشكلة 3: Risk Engine غير موجود
**الواقع:** منطق الخطر موجود داخل UI مباشرة في `danger-times.tsx` و `sos.tsx`، مش في service منفصلة.

### المشكلة 4: Task Engine غير موجود
**الواقع:** المهام موزعة في 3 أماكن مختلفة: `habits.tsx`، `hadi-tasks.tsx`، `journey/index` — كل واحدة تعمل لوحدها.

---

## قواعد التنفيذ (لازم تتبعها)

1. **لا تكسر ما يعمل** — كل ملف جديد يُضاف، لا يحل محل القديم فوراً إلا بعد ربطه بالكامل
2. **ابدأ من الـ backend** — الـ frontend يعتمد على API موجود أولاً
3. **Tests بسيطة** — بعد كل مهمة تأكد أن الـ workflow شغّال (`curl localhost:8080/api/healthz`)
4. **لا تعدّل `home.tsx`** إلا في Phase 3 وبعد اكتمال Phases 1 و2
5. **Database migrations أولاً** — أي جدول جديد يتعمل بـ `drizzle-kit push` قبل الكود

---

## Phase 1: تثبيت الأساس

> **الهدف:** بناء 4 ملفات core لا تكسر أي شيء موجود. المشروع يشتغل قبلها وبعدها بنفس الطريقة.

---

### T1.1 — Zakiy Engine (Backend)
**الحالة:** `TODO`  
**يعتمد على:** لا شيء  
**الملف الجديد:** `artifacts/api-server/src/core/zakiy-engine.ts`

**المهمة:**
إنشاء service تستقبل user state وترجع decision بدون أي تأثير على الكود الموجود.

```typescript
// Input
interface ZakiyContext {
  sessionId: string;
  streakDays: number;
  lastActiveDate: string | null;
  sinCategory: string;
  riskScore: number;          // 0-100
  currentPhase: number;
  covenantSigned: boolean;
  lastRelapse: string | null;
  timeOfDay: 'fajr' | 'morning' | 'afternoon' | 'asr' | 'maghrib' | 'isha' | 'night';
  inactiveDays: number;       // كم يوم مش فاتح التطبيق
}

// Output
interface ZakiyDecision {
  message: string;            // رسالة عربية للمستخدم
  action: ZakiyAction;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  task?: {
    title: string;
    route: string;
  };
}

type ZakiyAction =
  | { type: 'navigate'; route: string }
  | { type: 'stay' }
  | { type: 'sos' }
  | { type: 'show_message' };
```

**منطق القرار (rule-based أولاً، AI لاحقاً):**
- `riskScore >= 80` → action: sos، urgency: emergency
- `inactiveDays >= 3` → navigate: /relapse، urgency: high
- `streakDays === 0 && !covenantSigned` → navigate: /covenant، urgency: high
- `streakDays > 0 && currentPhase === 1` → navigate: /journey، urgency: low
- default → navigate: /dhikr، urgency: low

**ربط بـ OpenAI:** الـ message دايماً تتولد من GPT-4o باستخدام context. الـ action rule-based فقط.

**تحقق من النجاح:**
```bash
curl -X POST localhost:8080/api/zakiy-engine \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","streakDays":0,"sinCategory":"other","riskScore":30,"currentPhase":1,"covenantSigned":false,"lastRelapse":null,"timeOfDay":"morning","inactiveDays":0}'
```
يرجع: `{ message: "...", action: { type: "navigate", route: "/covenant" }, urgency: "high" }`

---

### T1.2 — API Endpoint: POST /api/zakiy/decide
**الحالة:** `TODO`  
**يعتمد على:** T1.1  
**الملف المعدَّل:** `artifacts/api-server/src/routes/zakiy.ts` (إضافة route جديد، لا حذف)

**المهمة:**  
إضافة endpoint جديد `POST /api/zakiy/decide` يجمع user state من DB ويستدعي `zakiy-engine.ts`.

```
POST /api/zakiy/decide
Body: { sessionId: string }

Response:
{
  message: string,
  action: ZakiyAction,
  urgency: string,
  task?: { title: string, route: string }
}
```

**الخطوات:**
1. جلب `userProgressTable` بالـ sessionId
2. حساب `inactiveDays` من `lastActiveDate`
3. حساب `riskScore` (انظر T1.3)
4. استدعاء `zakiyEngine.decide(context)`
5. إرجاع النتيجة

**تحقق من النجاح:** نفس الـ curl السابق مع `/api/zakiy/decide`

---

### T1.3 — Risk Engine
**الحالة:** `TODO`  
**يعتمد على:** لا شيء  
**الملف الجديد:** `artifacts/api-server/src/core/risk-engine.ts`

**المهمة:**  
استخراج منطق الخطر من `danger-times.tsx` و `sos.tsx` إلى service مستقلة في الـ backend.

```typescript
interface RiskContext {
  sessionId: string;
  inactiveDays: number;
  lastRelapse: string | null;
  dangerTimes: Array<{ hour: number; days: number[] }>;  // من إعدادات المستخدم
  currentHour: number;
  streakDays: number;
}

interface RiskResult {
  score: number;              // 0-100
  triggers: string[];         // أسباب الخطر
  shouldTriggerSOS: boolean;
}

export function analyzeRisk(context: RiskContext): RiskResult
export function shouldTriggerSOS(score: number): boolean
```

**قواعد الـ score:**
- `lastRelapse` منذ أقل من 24 ساعة: +40
- `inactiveDays >= 3`: +30
- الوقت الحالي داخل `dangerTimes`: +20
- `streakDays === 0`: +10
- `streakDays > 7`: -20 (وقاية)

**ملاحظة مهمة:** `danger-times.tsx` و `sos.tsx` لا يُحذفان — يبقيان كـ UI، فقط منطق الحساب يتنقل للـ backend.

**تحقق من النجاح:** unit test بسيط:
```typescript
const result = analyzeRisk({ inactiveDays: 4, lastRelapse: null, dangerTimes: [], currentHour: 14, streakDays: 0 });
// result.score === 40, result.shouldTriggerSOS === false
```

---

### T1.4 — User State Hook (Frontend)
**الحالة:** `TODO`  
**يعتمد على:** T1.2  
**الملف الجديد:** `artifacts/tawbah-web/src/core/user-state.ts`

**المهمة:**  
إنشاء hook موحد يجمع كل state المستخدم في مكان واحد بدون حذف الـ contexts الموجودة.

```typescript
interface UserState {
  // من AuthContext
  userId: string | null;
  sessionId: string;
  isLoggedIn: boolean;

  // من API (userProgressTable)
  streakDays: number;
  currentPhase: number;
  covenantSigned: boolean;
  sinCategory: string;
  covenantDate: string | null;
  lastActiveDate: string | null;

  // محسوب
  inactiveDays: number;
  riskScore: number;
  timeOfDay: TimeOfDay;

  // Zakiy Decision (يتحدث عند طلب)
  zakiyDecision: ZakiyDecision | null;
  fetchZakiyDecision: () => Promise<void>;
  isLoadingDecision: boolean;
}

export function useUserState(): UserState
```

**التطبيق:**  
- يستخدم `useAuth()` للـ userId
- يستخدم `useUserProgress()` للـ progress
- يحسب `inactiveDays` و `timeOfDay` محلياً
- `fetchZakiyDecision` يستدعي `POST /api/zakiy/decide`

**تحقق من النجاح:** إضافة `useUserState()` في صفحة بسيطة وعرض `streakDays` في console بدون أخطاء.

---

## Phase 2: دمج الأنظمة

> **الهدف:** دمج الصفحات المتشابهة في modules أكثر ترتيباً. كل دمج يحافظ على نفس الـ routes القديمة عبر redirects.

---

### T2.1 — Task Engine (Backend)
**الحالة:** `TODO`  
**يعتمد على:** T1.1  
**الملف الجديد:** `artifacts/api-server/src/core/task-engine.ts`

**المهمة:**  
إنشاء service تجمع مصادر المهام الثلاثة وترجع قائمة موحدة.

```typescript
type TaskSource = 'habits' | 'hadi' | 'journey';

interface UnifiedTask {
  id: string;
  source: TaskSource;
  title: string;
  completed: boolean;
  priority: 'required' | 'recommended' | 'optional';
  route?: string;             // الصفحة اللي تفتحها لو بغى يعمل المهمة
}

export async function getTodayTasks(sessionId: string, phase: number): Promise<UnifiedTask[]>
```

**المنطق:**
- Phase 1: جلب first-day tasks من `habitsTable` (key في `TODAY_HABITS`)
- Phase 2+: جلب habits يومية + hadi tasks من `hadiTaskItemsTable`
- ترتيب: required أولاً، بعدين recommended، بعدين optional

**endpoint جديد:** `GET /api/tasks/today?sessionId=xxx`

**تحقق من النجاح:** يرجع array من tasks بدون أخطاء لـ session موجودة.

---

### T2.2 — Journey Flow Consolidation
**الحالة:** `TODO`  
**يعتمد على:** لا شيء  
**الملفات المعنية:**
- `artifacts/tawbah-web/src/pages/journey/` (الموجود)
- `artifacts/tawbah-web/src/pages/day-one.tsx` (الموجود)
- `artifacts/tawbah-web/src/pages/relapse.tsx` (الموجود)
- `artifacts/tawbah-web/src/pages/progress-chart.tsx` (الموجود)

**المهمة:**  
إضافة navigation links بين هذه الصفحات بدون دمجها جسدياً. المستخدم يشعر أنها flow واحد.

**التغييرات:**
1. في `journey/index.tsx`: إضافة زر "عندي انتكاسة" يفتح `/relapse`
2. في `relapse.tsx`: إضافة زر "العودة للرحلة" يرجع لـ `/journey`
3. في `progress-chart.tsx`: إضافة link للـ journey
4. في `day-one.tsx`: عند الإتمام، redirect تلقائي لـ `/journey`

**هذا النهج آمن تماماً** — لا حذف، فقط تحسين navigation.

**تحقق من النجاح:** تأكد أن كل صفحة عندها back button لـ `/journey`.

---

### T2.3 — Community Page Consolidation
**الحالة:** `TODO`  
**يعتمد على:** لا شيء  
**الملف الجديد:** `artifacts/tawbah-web/src/pages/community.tsx`  
**الصفحات المدموجة (كـ tabs):**
- `/ameen` → CommunityDuas
- `/secret-dua` → SecretDua
- `/dhikr-rooms` → DhikrRooms
- `/map` → TawbahMap

**المهمة:**  
إنشاء `/community` كصفحة tabs تحتوي على 4 tabs. الـ routes القديمة تبقى وتعمل redirect لـ `/community?tab=xxx`.

```tsx
// community.tsx
const TABS = [
  { id: 'ameen', label: 'آمين', component: CommunityDuas },
  { id: 'secret-dua', label: 'دعاء سري', component: SecretDua },
  { id: 'rooms', label: 'غرف الذكر', component: DhikrRooms },
  { id: 'map', label: 'الخريطة', component: TawbahMap },
];
```

**في `App.tsx`:** إضافة `<Route path="/community" component={Community} />`  
**الـ routes القديمة تبقى** — لا تُحذف.

**تحقق من النجاح:** `/community` يفتح بدون أخطاء ويعرض 4 tabs.

---

## Phase 3: التحكم الذكي

> **تحذير:** هذا الـ Phase يعدل على `home.tsx` (3549 سطر). التعديلات تكون additive فقط في البداية.

---

### T3.1 — Smart Home Banner
**الحالة:** `TODO`  
**يعتمد على:** T1.4 (user-state hook)، T1.2 (zakiy/decide endpoint)  
**الملف المعدَّل:** `artifacts/tawbah-web/src/pages/home.tsx`

**المهمة:**  
إضافة component جديد في أعلى الـ home يعرض Zakiy Decision. الـ home القديمة تبقى تماماً.

```tsx
// إضافة في أعلى home.tsx فقط — لا حذف لأي شيء
function ZakiySmartBanner() {
  const { zakiyDecision, fetchZakiyDecision, isLoadingDecision } = useUserState();

  useEffect(() => { fetchZakiyDecision(); }, []);

  if (!zakiyDecision || isLoadingDecision) return null;

  return (
    <div className="zakiy-banner">
      <p>{zakiyDecision.message}</p>
      <button onClick={() => navigate(zakiyDecision.action.route)}>
        ابدأ الآن
      </button>
    </div>
  );
}
```

**هذا النهج آمن:** لو الـ API فشل، الـ banner مش بيعرض — الـ home تبقى كما هي.

**تحقق من النجاح:** الـ banner يظهر في أعلى الصفحة مع رسالة من الزكي.

---

### T3.2 — Auto SOS Trigger
**الحالة:** `TODO`  
**يعتمد على:** T1.3 (risk-engine)، T1.4 (user-state)

**المهمة:**  
في `useUserState()`: إذا كان `riskScore >= 80`، عرض modal SOS تلقائياً بدون انتظار المستخدم.

```typescript
// في user-state.ts
useEffect(() => {
  if (userState.riskScore >= 80 && !sosTriggeredRef.current) {
    sosTriggeredRef.current = true;
    navigate('/sos');
  }
}, [userState.riskScore]);
```

**شرط مهم:** يتفعّل مرة واحدة فقط كل 24 ساعة (حفظ في localStorage).

**تحقق من النجاح:** مستخدم بـ `inactiveDays >= 3` و `lastRelapse < 24h` يُعاد توجيهه لـ `/sos`.

---

### T3.3 — Event-Based Notifications Enhancement
**الحالة:** `TODO`  
**يعتمد على:** T1.3 (risk-engine)  
**الملفات:** `artifacts/api-server/src/routes/push.ts` (إضافة)

**المهمة:**  
إضافة endpoint يُشغَّل عند تحديث user progress ويُنشئ push job بناءً على risk.

```typescript
// POST /api/zakiy/notify — يُستدعى من frontend بعد أي تغيير في state
router.post('/zakiy/notify', async (req, res) => {
  const { sessionId, event } = req.body;
  // event: 'login' | 'habit_completed' | 'relapse' | 'inactivity'

  const progress = await getProgress(sessionId);
  const risk = analyzeRisk({ ...progress });

  if (risk.score >= 60) {
    // أنشئ push job يُرسل خلال ساعة
    await schedulePushJob(sessionId, {
      type: 'risk_alert',
      fireAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  }
});
```

**تحقق من النجاح:** استدعاء الـ endpoint ينشئ row في `push_jobs`.

---

## Phase 4: تحسين التجربة

---

### T4.1 — Dynamic UI Theme
**الحالة:** `TODO`  
**يعتمد على:** T1.4 (user-state)  
**الملف المعدَّل:** `artifacts/tawbah-web/src/context/SettingsContext.tsx`

**المهمة:**  
إضافة `moodTheme` للـ SettingsContext بناءً على `riskScore`.

```typescript
type MoodTheme = 'calm' | 'alert' | 'emergency';

// في SettingsContext
const moodTheme: MoodTheme =
  riskScore >= 80 ? 'emergency' :
  riskScore >= 50 ? 'alert' : 'calm';
```

**CSS Variables:**
- `calm`: ألوان خضراء هادئة (الحالية)
- `alert`: ألوان برتقالية / ذهبية
- `emergency`: ألوان حمراء داكنة

**تحقق من النجاح:** تغيير `riskScore` يغير لون الـ header.

---

### T4.2 — Audio Mode Enhancement
**الحالة:** `TODO`  
**يعتمد على:** T1.4 (user-state)

**المهمة:**  
في `munajat.tsx`: إضافة auto-detect للوقت وتشغيل audio مناسب.
- وقت الفجر: أذكار الصباح
- وقت الليل: سورة البقرة أو المعوذتين
- وقت المغرب: أذكار المساء

**هذا الـ feature موجود جزئياً في `munajat.tsx`** — فقط إضافة auto-detect.

**تحقق من النجاح:** فتح `/munajat` في وقت الفجر يشغّل أذكار الصباح تلقائياً.

---

## ترتيب التنفيذ الصح

```
T1.3 (Risk Engine)           ← لا dependencies
    ↓
T1.1 (Zakiy Engine)          ← يستخدم Risk Engine
    ↓
T1.2 (API /zakiy/decide)     ← يستخدم Zakiy Engine
    ↓
T1.4 (User State Hook)       ← يستخدم /zakiy/decide
    ↓
T2.1 (Task Engine)           ← يعتمد على T1.1 للـ context
T2.2 (Journey Navigation)    ← مستقل
T2.3 (Community Page)        ← مستقل
    ↓ (بعد Phase 2)
T3.1 (Smart Home Banner)     ← يعتمد على T1.4 + T1.2
T3.2 (Auto SOS)              ← يعتمد على T1.3 + T1.4
T3.3 (Event Notifications)   ← يعتمد على T1.3
    ↓ (بعد Phase 3)
T4.1 (Dynamic Theme)         ← يعتمد على T1.4
T4.2 (Audio Enhancement)     ← يعتمد على T1.4
```

T2.2 و T2.3 يمكن تشغيلهم بالتوازي مع T2.1.

---

## ما لن يُعمل في هذه الخطة (وسبب واضح)

| الفكرة الأصلية | القرار | السبب |
|---|---|---|
| حذف كل الصفحات وعمل صفحة Home بزر واحد | ❌ لن يُنفَّذ | `home.tsx` = 3549 سطر من كود يعمل. الحذف الكامل سيكسر المشروع لأسابيع |
| Community merge بحذف الصفحات القديمة | ❌ لن يُحذف | الروابط القديمة موجودة في الـ home وأماكن أخرى |
| Journey merge كـ ملف واحد | ❌ تعقيد بدون فائدة | التنقل بين الصفحات يحقق نفس الهدف |
| مكالمة Zakiy لكل حركة في التطبيق | ❌ مكلف جداً | GPT-4o = API call مكلف. Rule-based engine أولاً، AI للـ message فقط |

---

## متطلبات البيئة

قبل البدء، تأكد من وجود هذه المتغيرات:

```bash
echo $DATABASE_URL        # يجب أن يكون موجوداً
echo $SUPABASE_URL        # للـ auth
echo $SUPABASE_ANON_KEY   # للـ auth
# OPENAI_API_KEY مُدار عبر Replit proxy تلقائياً
```

---

## كيف تحدّث هذا الملف

بعد إنهاء كل مهمة:

```markdown
### T1.1 — Zakiy Engine (Backend)
**الحالة:** `DONE`  ← غيّر من TODO
**منتهية في:** 2026-03-30
**ملاحظات:** [أي ملاحظة مهمة]
```

وحدّث جدول "حالة التقدم الكلية" في الأعلى.

---

*هذا الملف المرجع الوحيد للخطة. لا تنفذ شيئاً غير موجود هنا.*
