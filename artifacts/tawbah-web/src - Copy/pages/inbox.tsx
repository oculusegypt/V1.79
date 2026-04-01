import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Award, Star, BookOpen,
  AlertCircle, Sun, RefreshCw, Heart, X, Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useEffect } from "react";
import { useAppNotifications } from "@/context/AppNotificationsContext";
import { type AppNotification } from "@/lib/app-notifications";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ReactNode> = {
  "book-open":  <BookOpen size={16} />,
  "sun":        <Sun size={16} />,
  "heart":      <Heart size={16} />,
  "award":      <Award size={16} />,
  "star":       <Star size={16} />,
  "alert-circle": <AlertCircle size={16} />,
  "refresh-cw": <RefreshCw size={16} />,
  "bell":       <Bell size={16} />,
};

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    return `منذ ${days} أيام`;
  } catch {
    return "";
  }
}

function NotifCard({ notif, onRead, onDelete }: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [, setLocation] = useLocation();
  const icon = ICON_MAP[notif.icon] ?? <Bell size={16} />;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.link) setLocation(notif.link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
        notif.isRead
          ? "bg-card border-border/40"
          : "bg-primary/5 border-primary/25 shadow-sm"
      )}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: notif.color + "20", color: notif.color }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn("text-sm leading-snug", notif.isRead ? "font-medium text-foreground" : "font-bold text-foreground")}>
            {notif.title}
          </p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
        </div>
        <p className={cn("text-xs leading-relaxed", notif.isRead ? "text-muted-foreground" : "text-foreground/75")}>
          {notif.body}
        </p>
        {notif.link && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: notif.color }}>
            اضغط للانتقال ←
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function InboxPage() {
  const [, setLocation] = useLocation();
  const { notifications, markAllRead, markRead, removeNotification, reloadNotifications } = useAppNotifications();

  // Mark all as read on mount
  useEffect(() => {
    markAllRead();
    reloadNotifications();
  }, [markAllRead, reloadNotifications]);

  const unread = notifications.filter((n) => !n.isRead).length;

  const handleRead = (id: string) => {
    markRead(id);
  };

  const handleDelete = (id: string) => {
    removeNotification(id);
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen" dir="rtl">
      <PageHeader
        title="صندوق الإشعارات"
        subtitle={unread > 0 ? `${unread} إشعار غير مقروء` : "كل شيء مقروء ✓"}
        icon={<Bell size={16} />}
        right={notifications.length > 0 ? (
          <button
            onClick={() => setLocation("/notifications")}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="إعدادات الإشعارات"
          >
            <Settings2 size={18} />
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-4 pt-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <BellOff size={36} className="text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">لا توجد إشعارات</p>
            <p className="text-sm text-muted-foreground">ستصلك الإشعارات والتذكيرات هنا يومياً</p>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => (
                <NotifCard
                  key={notif.id}
                  notif={notif}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
