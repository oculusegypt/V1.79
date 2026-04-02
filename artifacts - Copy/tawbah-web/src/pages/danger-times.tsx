import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Bell, BellOff, Plus, Trash2, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface DangerTime {
  id: string;
  label: string;
  time: string;
  active: boolean;
}

const PRESET_TIMES: { label: string; time: string }[] = [
  { label: "بعد منتصف الليل", time: "00:30" },
  { label: "وقت الفراغ صباحاً", time: "10:00" },
  { label: "فترة القيلولة", time: "14:00" },
  { label: "وقت السهر المتأخر", time: "23:00" },
];

const REMINDER_MESSAGES = [
  "تذكّر عهدك مع الله. أنت أقوى من هذه اللحظة.",
  "الله يراك الآن. كيف تريده أن يراك؟",
  "هذه الدقيقة ستمضي، لكن قرارك فيها يبقى.",
  "قبل أي خطوة: ﴿وَاللَّهُ يُرِيدُ أَن يَتُوبَ عَلَيْكُمْ﴾",
  "تذكّر المعاهدة التي قطعتها مع ربك.",
];

export default function DangerTimes() {
  const [times, setTimes] = useState<DangerTime[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("22:00");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [randomMsg] = useState(() => REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)]);

  useEffect(() => {
    const saved = localStorage.getItem("danger_times");
    if (saved) setTimes(JSON.parse(saved));
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  const saveTimes = (updated: DangerTime[]) => {
    setTimes(updated);
    localStorage.setItem("danger_times", JSON.stringify(updated));
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  const addPreset = (label: string, time: string) => {
    const newEntry: DangerTime = {
      id: Date.now().toString(),
      label,
      time,
      active: true,
    };
    saveTimes([...times, newEntry]);
  };

  const addCustom = () => {
    if (!newLabel.trim()) return;
    addPreset(newLabel.trim(), newTime);
    setNewLabel("");
    setNewTime("22:00");
    setAdding(false);
  };

  const toggleTime = (id: string) => {
    saveTimes(times.map((t) => t.id === id ? { ...t, active: !t.active } : t));
  };

  const deleteTime = (id: string) => {
    saveTimes(times.filter((t) => t.id !== id));
  };

  const formatTime12 = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "م" : "ص";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="flex flex-col flex-1 pb-8">
      <PageHeader title="أوقات الخطر الذكية" subtitle="حدد أوقات ضعفك لتتلقى تذكيرات وقائية" icon={<Shield size={16} />} />
      <div className="px-5 pt-4">

      {notifPermission !== "granted" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-primary" />
            <p className="font-bold text-sm text-primary">فعّل الإشعارات للتذكيرات الذكية</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">لتصلك تذكيرات قبل أوقات ضعفك</p>
          <button
            onClick={requestNotifications}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            تفعيل الإشعارات
          </button>
        </motion.div>
      )}

      <div className="bg-muted/30 rounded-xl p-3 mb-5">
        <p className="text-xs text-muted-foreground text-center italic">"{randomMsg}"</p>
      </div>

      <div className="mb-5">
        <h2 className="text-sm font-bold mb-3">أوقات مقترحة</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_TIMES.map((p) => {
            const already = times.some((t) => t.time === p.time);
            return (
              <button
                key={p.time}
                onClick={() => !already && addPreset(p.label, p.time)}
                disabled={already}
                className={`p-3 rounded-xl border text-right transition-all ${
                  already
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border hover:border-primary/40 text-foreground"
                }`}
              >
                <p className="text-xs font-bold mb-0.5">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">{formatTime12(p.time)}</p>
                {already && <p className="text-[10px] text-primary mt-1">✓ مضاف</p>}
              </button>
            );
          })}
        </div>
      </div>

      {times.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold mb-3">أوقاتك المحددة</h2>
          <div className="flex flex-col gap-2">
            {times.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${t.active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Clock size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{formatTime12(t.time)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleTime(t.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    {t.active ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
                  </button>
                  <button onClick={() => deleteTime(t.id)} className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {adding ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-primary/20 p-4 mb-4"
        >
          <p className="font-bold text-sm mb-3">وقت مخصص</p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="اسم الوقت (مثل: وقت السهر)"
              className="w-full px-3 py-2.5 bg-muted/50 rounded-lg text-sm text-right placeholder:text-muted-foreground/60 outline-none border border-border focus:border-primary/40 transition-colors"
              dir="rtl"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/50 rounded-lg text-sm outline-none border border-border focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addCustom} disabled={!newLabel.trim()} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50">
              إضافة
            </button>
            <button onClick={() => { setAdding(false); setNewLabel(""); }} className="px-4 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-bold">
              إلغاء
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all mb-4"
        >
          <Plus size={18} />
          <span className="font-bold text-sm">إضافة وقت مخصص</span>
        </button>
      )}

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-primary" />
          <h3 className="font-bold text-sm">كيف تعمل هذه الميزة؟</h3>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>حدد الأوقات التي تشعر فيها بالضعف أو الإغراء</li>
          <li>التطبيق سيذكّرك بتذكير وقائي في تلك الأوقات</li>
          <li>التذكير يتضمن آية أو دعاء يقويك على الصمود</li>
          <li>يُحفظ كل شيء على جهازك فقط لخصوصيتك</li>
        </ul>
      </div>
      </div>
    </div>
  );
}
