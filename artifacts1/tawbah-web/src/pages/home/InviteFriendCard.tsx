import { HeartHandshake, Share2 } from "lucide-react";
import { useState } from "react";

export function InviteFriendCard() {
  const [shared, setShared] = useState(false);
  const handleInvite = async () => {
    const text =
      "اكتشفت تطبيقاً يساعدك على التوبة الصادقة 🌿\nرحلة 30 يوماً مع خطة يومية وذكر وإرشاد روحي.\n\nابدأ رحلتك الآن 👇";
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: "دليل التوبة النصوح", text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };
  return (
    <button
      onClick={handleInvite}
      className="w-full flex items-center gap-4 bg-gradient-to-l from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all text-right"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
        <HeartHandshake size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ادعُ رفيقاً في رحلة التوبة</h3>
        <p className="text-[11px] text-muted-foreground">
          شارك التطبيق — الدال على الخير كفاعله
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {shared ? (
          <span className="text-xs font-bold text-primary">تم! ✓</span>
        ) : (
          <Share2 size={16} className="text-primary" />
        )}
      </div>
    </button>
  );
}
