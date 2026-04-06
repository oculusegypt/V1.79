import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aiservx.tawbah",
  appName: "التوبة النصوح",

  webDir: "dist/public",

  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: [
      "localhost:3001",
      "127.0.0.1:3001",
      "api.alquran.cloud",
      "cdn.islamic.network",
      "everyayah.com",
      "api.aladhan.com",
      "quran.com",
      "radiojar.com",
      "*.radiojar.com",
      "stream.radiojar.com",
      "zayedquran.gov.ae",
      "radio.alaatv.com",
      "mp3quran.net",
      "live.mp3quran.net",
      "backup.qurango.net",
      "qurango.net",
      "v-177--hadybash781.replit.app",
      "*.replit.app",
      "*.replit.dev",
    ],
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: "#0d1117",
    loggingBehavior: "debug",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#0B1E1B",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },

    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#0B1E1B",
      overlay: false,
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    WebView: {},
  },
};
export  default config;
