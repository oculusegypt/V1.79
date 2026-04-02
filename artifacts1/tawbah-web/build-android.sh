#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# سكريبت بناء تطبيق Android لـ Firebase App Distribution / Play Store
# استخدام: ./build-android.sh [API_BASE_URL]
# مثال:    ./build-android.sh https://your-app.replit.app/api
# ──────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

API_URL="${1:-https://tawbah.replit.app/api}"

echo "🏗️  بناء تطبيق التوبة النصوح للأندرويد"
echo "🔗  API Base URL: $API_URL"
echo ""

# 1. Build web assets
echo "📦  بناء ملفات الويب..."
VITE_API_BASE_URL="$API_URL" pnpm build

# 2. Sync with Android
echo "🔄  مزامنة مع مشروع Android..."
if [ ! -d "android" ]; then
  echo "📱  مجلد android غير موجود — إنشاء منصة Android عبر Capacitor..."
  npx cap add android
fi
npx cap sync android

# 3. Copy google-services.json
echo "🔥  نسخ إعدادات Firebase..."
if [ -f "android-config/google-services.json" ]; then
  cp android-config/google-services.json android/app/google-services.json
else
  echo "⚠️  لم يتم العثور على android-config/google-services.json — سيتم تخطي Firebase config"
fi

# 4. Build Android APK (debug)
echo "🤖  بناء ملف APK..."
cd android
./gradlew assembleDebug --no-daemon 2>&1 | tail -20

# 5. Copy output
echo ""
echo "✅  تم بناء التطبيق بنجاح!"
echo "📱  ملف APK موجود في:"
find . -name "*.apk" -type f 2>/dev/null | head -5

echo ""
echo "📤  للرفع على Firebase App Distribution:"
echo "    firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \\"
echo "    --app 1:311033068455:android:ac626d18c855136d3cd482 \\"
echo "    --groups testers"
