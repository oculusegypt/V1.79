import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type Lang, getTranslations, type Translations } from "@/lib/translations";

type Theme = "light" | "dark";

export type AccentColor =
  | "forest"
  | "ocean"
  | "aurora"
  | "midnight"
  | "rose"
  | "sunset"
  | "slate"
  | "mint";

export type AccentOption = {
  id: AccentColor;
  nameAr: string;
  lightPrimary: string;
  darkPrimary: string;
  gradient: string;
};

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: "forest",
    nameAr: "الغابة",
    lightPrimary: "#174d2b",
    darkPrimary: "#c9933a",
    gradient: "linear-gradient(135deg, #174d2b 0%, #c9933a 100%)",
  },
  {
    id: "ocean",
    nameAr: "المحيط",
    lightPrimary: "#0f4c81",
    darkPrimary: "#38bdf8",
    gradient: "linear-gradient(135deg, #0f4c81 0%, #0ea5e9 100%)",
  },
  {
    id: "aurora",
    nameAr: "الشفق",
    lightPrimary: "#6b21a8",
    darkPrimary: "#c084fc",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
  },
  {
    id: "midnight",
    nameAr: "منتصف الليل",
    lightPrimary: "#1e3a8a",
    darkPrimary: "#60a5fa",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  },
  {
    id: "rose",
    nameAr: "الورود",
    lightPrimary: "#9f1239",
    darkPrimary: "#fb7185",
    gradient: "linear-gradient(135deg, #be123c 0%, #f472b6 100%)",
  },
  {
    id: "sunset",
    nameAr: "الغروب",
    lightPrimary: "#92400e",
    darkPrimary: "#fbbf24",
    gradient: "linear-gradient(135deg, #b45309 0%, #f97316 100%)",
  },
  {
    id: "slate",
    nameAr: "الصخري",
    lightPrimary: "#1e3a5f",
    darkPrimary: "#7dd3fc",
    gradient: "linear-gradient(135deg, #334155 0%, #38bdf8 100%)",
  },
  {
    id: "mint",
    nameAr: "النعناع",
    lightPrimary: "#065f46",
    darkPrimary: "#34d399",
    gradient: "linear-gradient(135deg, #047857 0%, #06b6d4 100%)",
  },
];

export type QuranReciter = {
  id: string;
  name: string;
  nameAr: string;
};

export const QURAN_RECITERS: QuranReciter[] = [
  { id: "ar.alafasy",            name: "Mishary Rashid Alafasy",      nameAr: "مشاري راشد العفاسي"       },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais",       nameAr: "عبد الرحمن السديس"        },
  { id: "ar.mahermuaiqly",       name: "Maher Al Muaiqly",            nameAr: "ماهر المعيقلي"            },
  { id: "ar.muhammadjibreel",     name: "Muhammad Jibreel",            nameAr: "محمد جبريل"               },
  { id: "ar.saoodshuraym",       name: "Saud Al-Shuraim",             nameAr: "سعود الشريم"              },
  { id: "ar.shaatree",           name: "Abu Bakr Al-Shatri",          nameAr: "أبو بكر الشاطري"          },
  { id: "ar.saadalghamdi",       name: "Saad Al-Ghamdi",              nameAr: "سعد الغامدي"              },
  { id: "ar.hanirifai",          name: "Hani Ar-Rifai",               nameAr: "هاني الرفاعي"             },
  { id: "ar.husary",             name: "Mahmoud Khalil Al-Husary",    nameAr: "محمود خليل الحصري"        },
  { id: "ar.minshawi",           name: "Mohammed Siddiq Al-Minshawi", nameAr: "محمد صديق المنشاوي"       },
  { id: "ar.abdulsamad",         name: "Abdul Basit Abdul Samad",     nameAr: "عبد الباسط عبد الصمد"     },
  { id: "ar.ahmedajamy",         name: "Ahmed Al-Ajmy",               nameAr: "أحمد العجمي"              },
];

interface SettingsContextType {
  lang: Lang;
  theme: Theme;
  accentColor: AccentColor;
  t: Translations;
  dir: "rtl" | "ltr";
  autoPlayBotAudio: boolean;
  autoPlayQuran: boolean;
  quranReciterId: string;
  toggleLang: () => void;
  toggleTheme: () => void;
  setAccentColor: (c: AccentColor) => void;
  setAutoPlayBotAudio: (v: boolean) => void;
  setAutoPlayQuran: (v: boolean) => void;
  setQuranReciterId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("tawbah_lang") as Lang) || "ar";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("tawbah_theme") as Theme | null;
    if (stored) return stored;
    return "light";
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem("tawbah_accent") as AccentColor) || "mint";
  });
  const [autoPlayBotAudio, setAutoPlayBotAudioState] = useState<boolean>(() => {
    const stored = localStorage.getItem("tawbah_autoplay_bot");
    return stored === null ? true : stored === "true";
  });
  const [autoPlayQuran, setAutoPlayQuranState] = useState<boolean>(() => {
    const stored = localStorage.getItem("tawbah_autoplay_quran");
    return stored === null ? true : stored === "true";
  });
  const [quranReciterId, setQuranReciterIdState] = useState<string>(() => {
    return localStorage.getItem("tawbah_reciter") || "ar.alafasy";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("tawbah_theme", theme);
    localStorage.setItem("tawbah-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accentColor);
    localStorage.setItem("tawbah_accent", accentColor);
    const opt = ACCENT_OPTIONS.find(o => o.id === accentColor);
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute("content", theme === "dark" ? "#0a0a12" : (opt?.lightPrimary ?? "#174d2b"));
    });
  }, [accentColor, theme]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("tawbah_lang", lang);
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setAccentColor = (c: AccentColor) => {
    setAccentColorState(c);
  };
  const setAutoPlayBotAudio = (v: boolean) => {
    setAutoPlayBotAudioState(v);
    localStorage.setItem("tawbah_autoplay_bot", String(v));
  };
  const setAutoPlayQuran = (v: boolean) => {
    setAutoPlayQuranState(v);
    localStorage.setItem("tawbah_autoplay_quran", String(v));
  };
  const setQuranReciterId = (id: string) => {
    setQuranReciterIdState(id);
    localStorage.setItem("tawbah_reciter", id);
  };

  return (
    <SettingsContext.Provider
      value={{
        lang, theme, accentColor,
        t: getTranslations(lang), dir: lang === "ar" ? "rtl" : "ltr",
        autoPlayBotAudio, autoPlayQuran, quranReciterId,
        toggleLang, toggleTheme, setAccentColor,
        setAutoPlayBotAudio, setAutoPlayQuran, setQuranReciterId,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
