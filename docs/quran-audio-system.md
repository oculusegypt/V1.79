# نظام صوت القرآن (Web + APK) — توثيق كامل

هذا الملف هو **التوثيق الرسمي الوحيد** لنظام تشغيل صوت القرآن في المشروع. أي توثيق سابق غير معتمد.

## 1) الهدف النهائي

- **تشغيل متواصل** لآيات السورة آية بعد آية.
- **بدون فجوات محسوسة** قدر الإمكان (خصوصًا داخل صفحة القراءة التي تدعم Web Audio overlap).
- **prefetch**: أثناء تشغيل الآية الحالية يتم تحميل الآية التالية.
- **توحيد السلوك** بين:
  - `src/pages/quran/read.tsx`
  - `src/pages/quran/listen.tsx`
  - `src/pages/quran.tsx`
- **Offline**:
  - على الويب: باستخدام Cache API.
  - على APK: باستخدام Capacitor Filesystem (مجلد دائم في ذاكرة التطبيق).

## 2) المبادئ الأساسية

### 2.1 لماذا Proxy؟
المصدر الأصلي للـ MP3 قد يسبب مشاكل (403 / قيود CDN / CORS). لذلك كل التشغيل يمر عبر:

`/audio-proxy/quran/{reciterId}/{globalAyah}.mp3`

الـ Proxy موجود في الـ API server ويضمن:

- **Headers صحيحة** و **Range requests** لتدفق الصوت.
- استقرار أعلى على WebView.

### 2.2 قاعدة مهمة: لا تكرر `/api`
على الويب `getApiBase()` يرجع `/api`.

لذلك روابط الصوت يجب أن تُبنى كالتالي:

`{getApiBase()}/audio-proxy/...`

وليس:

`{getApiBase()}/api/audio-proxy/...`

تم توحيد هذا داخل `quran-audio.ts` و `quran-audio-native.ts`.

## 3) المكونات (Modules)

### 3.1 `src/lib/api-base.ts`

**مسؤوليات:**

- `isNativeApp()` يحدد إذا نحن داخل Capacitor (APK).
- `getApiBase()` يرجع:
  - على الويب: `/api`
  - على APK: URL كامل مثل `https://.../api`

### 3.2 `src/lib/quran-audio.ts` (Web)

**مسؤوليات:**

- تكوين رابط الصوت الصحيح عبر الـ Proxy.
- تقديم مسارين للتعامل مع التحميل:
  - `preloadQuranVerseFast(source)`:
    - تحميل سريع “warm-up” للآية القادمة (بدون Cache API overhead).
  - `preloadQuranVerseForCache(source)`:
    - تخزين فعلي داخل Cache API من أجل Offline.
- `getCachedAudioUrl(source)`:
  - على الويب: يحاول جلب الصوت من Cache API ويرجع `blob:` URL.
  - إذا غير موجود: يرجع رابط Proxy.
- `getAudioUrlDirect(source)`:
  - يرجع رابط Proxy مباشرة (بدون كاش).

**ملاحظات مهمة:**

- Cache name: `quran-audio-v1`.
- `getProxyUrl()` هو المرجع الوحيد لبناء رابط الصوت على الويب.

### 3.3 `src/lib/quran-audio-native.ts` (APK)

**مسؤوليات:**

- عمل Offline حقيقي داخل APK عبر ملفات فعلية في ذاكرة التطبيق.

**مسار الملفات داخل التطبيق:**

`Directory.Data/quran-audio/{reciterId}/{globalAyah}.mp3`

**الدوال:**

- `preloadQuranVerseNative(source)`:
  - إذا الملف موجود: يرجع `data:audio/mpeg;base64,...`.
  - إذا غير موجود: ينزله من Proxy ويكتبه في Filesystem ثم يرجع data URL.
- `getCachedAudioUrlNative(source)`:
  - يفضل الملف المحلي، وإلا يرجع رابط Proxy.
- `clearAudioCache()`:
  - يمسح المجلد بالكامل.

**ملاحظة أداء:**

- تحويل MP3 إلى base64 قد يزيد الحجم في الذاكرة أثناء التشغيل. لكنه يحقق استقرار أعلى في WebView ويضمن Offline بعد إعادة فتح التطبيق.

### 3.4 `src/lib/native-audio.ts`

هذا الملف مسؤول عن `setAudioSrc(audio, url)`.

- في النظام الحالي: معظم التشغيل في APK صار يعتمد على `data:` URL أو Proxy URL مباشرة، لذلك `setAudioSrc` لم يعد نقطة الاعتماد الأساسية لتفادي مشاكل silent playback.

## 4) الصفحات (Pages) وتدفق التشغيل

### 4.1 `src/pages/quran/read.tsx` (القراءة)

**الهدف:** قراءة + تشغيل آية/آيات بتجربة سلسة.

**مسارات التشغيل:**

- على APK:
  - يحاول Web Audio API أولًا.
  - إذا فشل: ينتقل لـ HTMLAudio.
- على الويب:
  - HTMLAudio مباشرة.

**gapless (تقريبًا):**

- Web Audio API path يستخدم overlap صغير (مثل `0.015s`) لتقليل الفجوة بين آيتين.

**prefetch:**

- أثناء تشغيل idx:
  - يقوم بعمل preload لـ `idx+1`.

### 4.2 `src/pages/quran.tsx` (القرآن الرئيسي)

- HTMLAudio فقط.
- يشغل آية عند الضغط عليها.
- يعمل preload للآية التالية.
- على APK يستخدم `getCachedAudioUrlNative`.

### 4.3 `src/pages/quran/listen.tsx` (الاستماع)

- HTMLAudio أساسًا (مع أدوات UI للتقدم/التوقيت/التكرار).
- تم توحيده ليستخدم نفس مصدر الروابط من `quran-audio.ts`:
  - Web: `getAudioUrlDirect(source)`
  - APK: `getCachedAudioUrlNative(source)`
- يعمل preload للآية التالية.

## 5) Offline: ما الذي “يُخزن” فعلًا؟

### 5.1 الويب

- التخزين في Cache API.
- يبقى طالما المتصفح لم يمسح البيانات (وقد يُحذف تلقائيًا في بعض الحالات).

### 5.2 APK

- التخزين في `Filesystem Directory.Data`.
- **يبقى بعد إغلاق وفتح التطبيق**.
- يعتمد على مساحة التطبيق الداخلية.

## 6) تشخيص الأعطال (Troubleshooting)

### 6.1 `waiting / stalled` في console
أشهر سبب: رابط الصوت خاطئ.

علامة واضحة:

- `404` على `.../api/api/audio-proxy/...`

الحل:

- تأكد أن بناء الروابط يتم عبر:
  - `getAudioUrlDirect(source)` (Web)
  - `getCachedAudioUrlNative(source)` (APK)

### 6.2 توقف بعد الآية 2

أسباب محتملة:

- عدم تنفيذ auto-advance في أحد المسارات.
- فشل في `play()` أو فشل في تحميل الآية التالية.

قاعدة النظام:

- عند `onended` يجب دائمًا استدعاء تشغيل الآية التالية إن وجدت.

### 6.3 Offline على APK لا يعمل بعد إعادة التشغيل

أسباب محتملة:

- عدم كتابة الملف فعلًا لـ Filesystem.
- عدم قراءة نفس المسار عند التشغيل.

قاعدة النظام:

- `quran-audio-native.ts` هو المصدر الوحيد للمسار والتخزين.

## 7) متطلبات التطابق Web vs APK

التطابق المقصود هنا هو **تطابق التجربة والسلوك** مع اختلاف “وسيط التخزين”:

- نفس reciterId + نفس globalAyah => نفس ملف.
- نفس proxy endpoint.
- نفس prefetch (تحميل الآية التالية أثناء الحالية).

الاختلاف الطبيعي:

- Web: Cache API.
- APK: Filesystem.

## 8) ملاحق سريعة

### 8.1 تعريف `globalAyah`

- globalAyah = رقم الآية العالمي عبر المصحف (1..6236) ويتم حسابه من (surahId + ayahNum داخل السورة).

### 8.2 مسار ملف APK (للمراجعة)

`Directory.Data/quran-audio/{reciterId}/{globalAyah}.mp3`

هذا هو “الفولدر” الذي يعتمد عليه النظام عند عدم وجود إنترنت.
