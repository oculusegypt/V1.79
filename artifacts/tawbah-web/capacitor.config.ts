import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aiservx.tawbah",
  appName: "دليل التوبة النصوح",

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
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#2d7a4f",
      sound: "beep.wav",
    },

    Camera: {},
  },
};

export default config;
