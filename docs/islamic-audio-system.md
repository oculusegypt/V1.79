# نظام الصوت للبرامج الإذاعية والبودكاست — توثيق كامل

هذا الملف هو **التوثيق الرسمي** لنظام تشغيل الصوت للبرامج الإذاعية والبودكاست في المشروع.

## 1) الهدف النهائي

- **تشغيل سلس** للإذاعات المباشرة والبودكاست.
- **توحيد السلوك** بين الصفحة الرئيسية وصفحات التصنيف.
- **دعم المنصات المختلفة** (Web + APK) بنفس الطريقة.
- **إدارة حالة صوتية موحدة** (playing/paused/stopped).

## 2) المبادئ الأساسية

### 2.1 نوعان من المحتوى الصوتي

#### **الإذاعات المباشرة (Live Radio)**
- تستخدم **Radio Proxy** دائماً (`useRadioProxy: true`)
- تمر عبر `/audio-proxy/radio?url=...`
- تدعم redirects ومتابعة التدفق
- crossOrigin: `"anonymous"` في APK فقط

#### **البودكاست (Podcast)**
- تشغل مباشرة من `mediaUrl` (`useRadioProxy: false`)
- لا تمر عبر proxy
- crossOrigin: `null` في كل الحالات
- تدعم التشغيل Offline عبر Cache API (Web) أو Filesystem (APK)

### 2.2 قاعدة مهمة: Episode ID المركب

لضمان التفرد، يستخدم النظام **Episode ID المركب**:

```
{categoryId}:{episodeId}
```

**مثال:**
- `ala-khuta:aabd-allh-batrsby`

هذا يضمن عدم تكرار الأسماء بين تصنيفات مختلفة.

## 3) المكونات (Modules)

### 3.1 `src/pages/islamic-programs/index.tsx` (الصفحة الرئيسية)

**المسؤوليات:**
- إدارة الحالة الصوتية الموحدة (`activeRadioId`, `activeEpisodeId`, `isAudioPlaying`)
- دالة `playUrl()` الموحدة للإذاعات والبودكاست
- إعداد crossOrigin ديناميكي

**الدوال الرئيسية:**

```typescript
// تحويل الروابط المحلية إلى روابط خارجية للبودكاست
function resolvePodcastMediaUrl(url: string): string {
  if (url.startsWith("/islamicaudio/")) {
    return `https://islamicaudio.net${url.slice("/islamicaudio".length)}`;
  }
  return url;
}

const playUrl = async (url: string, opts?: { useRadioProxy?: boolean }) => {
  const useRadioProxy = opts?.useRadioProxy === true;
  const resolvedUrl = isNativeApp() && useRadioProxy
    ? `${getApiBase().replace(/\/+$/, "")}/audio-proxy/radio?url=${encodeURIComponent(url)}`
    : apiUrl(resolvePodcastMediaUrl(url));
  
  // crossOrigin logic
  (a as unknown as { crossOrigin: string | null }).crossOrigin = isNativeApp() && useRadioProxy
    ? "anonymous"
    : null;
  
  // Use forceDirect=true for podcasts (not using radio proxy)
  await setAudioSrc(a, resolvedUrl, !useRadioProxy);
}
```

**ملاحظة:** `resolvePodcastMediaUrl()` تحول `/islamicaudio/assets/media/...` إلى `https://islamicaudio.net/assets/media/...` لتجنب أخطاء DEMUXER_ERROR.

### 3.2 `src/pages/podcast-category.tsx` (صفحة التصنيف)

**المسؤوليات:**
- تشغيل حلقات البودكاست داخل تصنيف معين
- استخدام نفس نظام الصوت مثل الصفحة الرئيسية
- إنشاء Episode ID مركب للمطابقة

**نقطة مهمة:**
```typescript
// إنشاء Episode ID مركب للمطابقة مع الصفحة الرئيسية
const compositeEpisodeId = `${category.id}:${episodeId}`;

// تحويل الروابط المحلية + استخدام forceDirect=true للبودكاست
await setAudioSrc(a, apiUrl(resolvePodcastMediaUrl(mediaUrl)), true);
```

### 3.3.1 دوال تحويل الروابط

```typescript
// تحويل روابط الصور المحلية إلى خارجية
function resolvePodcastImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("/islamicaudio/")) {
    return `https://islamicaudio.net${url.slice("/islamicaudio".length)}`;
  }
  return url;
}

// تحويل روابط الصوت المحلية إلى خارجية
function resolvePodcastMediaUrl(url: string): string {
  if (url.startsWith("/islamicaudio/")) {
    return `https://islamicaudio.net${url.slice("/islamicaudio".length)}`;
  }
  return url;
}
```

### 3.3 `src/lib/native-audio.ts` (المكتبة الأساسية)

**المسؤوليات:**
- إدارة مصدر الصوت على المنصات المختلفة
- التحكم في crossOrigin حسب نوع المحتوى

**الدالة الرئيسية:**

```typescript
export async function setAudioSrc(
  audio: HTMLAudioElement, 
  url: string, 
  forceDirect?: boolean
): Promise<void> {
  if (!isNativeApp()) {
    audio.src = url;
    return;
  }

  // crossOrigin: "anonymous" for radio proxy, undefined for direct podcast URLs
  try {
    (audio as unknown as { crossOrigin: string | undefined }).crossOrigin = 
      forceDirect === true ? undefined : "anonymous";
  } catch {}

  audio.src = url;
}
```

**ملاحظة هامة:** المعامل `forceDirect` يتحكم في `crossOrigin`:
- `forceDirect = true` → `crossOrigin = undefined` (يسمح بـ CORS للبودكاست)
- `forceDirect = false` → `crossOrigin = "anonymous"` (للإذاعات عبر proxy)

### 3.4 `LiveRadioSection.tsx` (مكون الإذاعات)

**المسؤوليات:**
- عرض الإذاعات المباشرة
- إرسال `useRadioProxy: true` دائماً
- عرض حالة التشغيل الفعالة

### 3.5 `PodcastProgramsSection.tsx` (مكون البودكاست)

**المسؤوليات:**
- عرض البودكاست في الصفحة الرئيسية
- إرسال `useRadioProxy: false` دائماً
- إنشاء Episode ID مركب

## 4) تدفق التشغيل

### 4.1 تشغيل الإذاعة المباشرة

1. **النقر على الإذاعة** → `onToggle(station)`
2. **إنشاء Episode ID** → `station.id`
3. **استدعاء playUrl()** → `{ useRadioProxy: true }`
4. **بناء الرابط** → `${apiBase}/audio-proxy/radio?url=${encodeURIComponent(url)}`
5. **إعداد crossOrigin** → `"anonymous"` (APK فقط)
6. **التشغيل** → HTML5 Audio

### 4.2 تشغيل البودكاست

1. **النقر على الحلقة** → `onPlayEpisode({ episodeId, mediaUrl })`
2. **إنشاء Episode ID مركب** → `${categoryId}:${episodeId}`
3. **استدعاء playUrl()** → `{ useRadioProxy: false }`
4. **تحويل الرابط** → `resolvePodcastMediaUrl(mediaUrl)` (إذا كان مسار محلي `/islamicaudio/...`)
5. **تمرير عبر apiUrl()** → `apiUrl(resolvedUrl)`
6. **إعداد crossOrigin** → `null`
7. **التشغيل** → HTML5 Audio

### 4.3 تحويل الروابط المحلية إلى خارجية

عند وجود روابط نسبية مثل `/islamicaudio/assets/media/...` في `data.tsx`، يتم تحويلها:

```
قبل: /islamicaudio/assets/media/episode.mp3
بعد: https://islamicaudio.net/assets/media/episode.mp3
```

هذا يضمن:
- **الويب:** يعمل بدون الحاجة لملفات محلية
- **الـAPK:** يتجنب أخطاء DEMUXER_ERROR
- **الصور:** تعرض من المصدر الخارجي بدلاً من التضمين

## 5) إدارة الحالة

### 5.1 المتغيرات الرئيسية

```typescript
const [activeRadioId, setActiveRadioId] = useState<string | null>(null);
const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
const [isAudioPlaying, setIsAudioPlaying] = useState(false);
```

### 5.2 Event Listeners

```typescript
useEffect(() => {
  const a = audioRef.current;
  const onPlay = () => setIsAudioPlaying(true);
  const onPause = () => setIsAudioPlaying(false);
  const onEnded = () => setIsAudioPlaying(false);
  
  a.addEventListener("play", onPlay);
  a.addEventListener("pause", onPause);
  a.addEventListener("ended", onEnded);
  
  return () => {
    a.removeEventListener("play", onPlay);
    a.removeEventListener("pause", onPause);
    a.removeEventListener("ended", onEnded);
  };
}, []);
```

## 6) الفروق بين المنصات

### 6.1 الويب (Web)
- **الإذاعات:** Proxy + crossOrigin: `null`
- **البودكاست:** Direct + crossOrigin: `null`
- **التخزين:** Cache API

### 6.2 APK (Native)
- **الإذاعات:** Proxy + crossOrigin: `"anonymous"`
- **البودكاست:** Direct + crossOrigin: `null`
- **التخزين:** Filesystem (Directory.Data)

## 7) تشخيص الأعطال (Troubleshooting)

### 7.1 البودكاست لا يعمل في الصفحة الرئيسية

**الأعراض:**
- الحلقات لا تشغل عند النقر
- لا يوجد صوت أو حدث خطأ

**الأسباب المحتملة:**
1. Episode ID غير متطابق
2. crossOrigin settings خاطئة
3. عدم استخدام `setAudioSrc`

**الحلول:**
1. **تأكد من Episode ID المركب:** `${categoryId}:${episodeId}`
2. **استخدم `setAudioSrc`** بدلاً من `a.src = mediaUrl`
3. **تحقق من crossOrigin settings**

### 7.2 البودكاست يعمل في صفحة التصنيف فقط

**السبب:**
- صفحة التصنيف تستخدم `a.src = mediaUrl` مباشرة
- الصفحة الرئيسية تستخدم `setAudioSrc` و crossOrigin settings

**الحل:**
- توحيد الطريقتين باستخدام `setAudioSrc`
- استخدام نفس crossOrigin logic

### 7.3 الإذاعات لا تعمل

**الأعراض:**
- لا يوجد بث مباشر
- خطأ CORS أو 403

**الحلول:**
1. **تأكد من `useRadioProxy: true`**
2. **تحقق من Proxy endpoint:** `/audio-proxy/radio`
3. **تأكد من crossOrigin:** `"anonymous"` في APK

## 8) أفضل الممارسات

### 8.1 عند إضافة مكون صوتي جديد

1. **استخدم Episode ID المركب** دائماً
2. **استدعِ `playUrl()`** مع الإعدادات الصحيحة
3. **استخدم `setAudioSrc`** بدلاً من `a.src`
4. **أعد crossOrigin** حسب المنصة والنوع

### 8.2 عند تعديل النظام

1. **حافظ على توحيد السلوك** بين الصفحات
2. **اختبر على الويب والـ APK**
3. **تحقق من Episode IDs** في كل الصفحات
4. **اختبر الحالات الحدية** (play/pause/ended)

## 9) أمثلة عملية

### 9.1 إضافة حلقة بودكاست جديدة

```typescript
// في data.tsx
{
  id: "new-episode",
  title: "حلقة جديدة",
  mediaUrl: "https://example.com/audio.mp3"
}

// في المكون
onPlayEpisode({ 
  episodeId: `${categoryId}:new-episode`, 
  mediaUrl: "https://example.com/audio.mp3" 
})
```

### 9.2 إضافة إذاعة جديدة

```typescript
// في data.tsx
{
  id: "new-radio",
  name: "إذاعة جديدة",
  url: "https://example.com/stream"
}

// في المكون
onToggle({
  id: "new-radio",
  url: "https://example.com/stream"
})
```

## 10) ملاحظات هامة

1. **لا تخلط بين Episode IDs** البسيطة والمركبة
2. **استخدم دائماً `setAudioSrc`** للتوافق مع APK
3. **اختبر crossOrigin settings** على كل المنصات
4. **حافظ على توحيد السلوك** بين جميع الصفحات

---

**هذا التوثيق يغطي كل جوانب نظام الصوت للبرامج الإذاعية والبودكاست. أي تعديلات يجب أن تحترم هذه المبادئ لضمان التوافق والاستقرار.**
