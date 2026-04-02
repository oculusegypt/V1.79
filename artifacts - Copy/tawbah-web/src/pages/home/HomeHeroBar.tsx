import { Bell, Sun, Moon, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAppNotifications } from "@/context/AppNotificationsContext";
import { useSettings } from "@/context/SettingsContext";

export function HomeHeroBar() {
  const [, setLocation] = useLocation();
  const { unreadCount } = useAppNotifications();
  const { theme, toggleTheme, lang, toggleLang } = useSettings();

  return (
    <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 pt-3">
      {/* Left actions (RTL: visually right side of hero) */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 backdrop-blur-sm transition-all"
          aria-label={theme === "dark" ? "وضع النهار" : "وضع الليل"}
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-white drop-shadow" />
          ) : (
            <Moon size={17} className="text-white drop-shadow" />
          )}
        </motion.button>

        {/* Language toggle */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleLang}
          className="flex items-center justify-center h-9 px-2.5 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 backdrop-blur-sm transition-all"
          aria-label="تغيير اللغة"
        >
          <Globe size={15} className="text-white drop-shadow" />
          <span className="text-white text-[11px] font-bold ms-1 drop-shadow">
            {lang === "ar" ? "EN" : "ع"}
          </span>
        </motion.button>
      </div>

      {/* Right actions (RTL: visually left side of hero) */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setLocation("/inbox")}
          aria-label="صندوق الإشعارات"
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 backdrop-blur-sm transition-all"
        >
          <Bell size={17} className="text-white drop-shadow" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
