import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAppNotifications } from "@/context/AppNotificationsContext";

export function HeroBellButton() {
  const [, setLocation] = useLocation();
  const { unreadCount } = useAppNotifications();
  return (
    <button
      onClick={() => setLocation("/inbox")}
      aria-label="صندوق الإشعارات"
      className="absolute top-3 left-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 active:scale-95 transition-all"
    >
      <Bell size={20} className="text-white drop-shadow" />
      {unreadCount > 0 && (
        <motion.span
          key={unreadCount}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </button>
  );
}
