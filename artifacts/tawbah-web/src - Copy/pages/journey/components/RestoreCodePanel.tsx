import { useState } from "react";
import { X } from "lucide-react";

export function RestoreCodePanel({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [inputCode, setInputCode] = useState("");
  const [tab, setTab] = useState<"view" | "enter">("view");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    const trimmed = inputCode.trim();
    if (!trimmed || trimmed === sessionId) return;
    try {
      localStorage.setItem("tawbah_session_id", trimmed);
      window.location.reload();
    } catch {}
  };

  return (
    <div className="bg-muted/40 border border-border rounded-2xl p-4" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-foreground">🔗 المزامنة بين الأجهزة</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("view")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-bold transition-all ${tab === "view" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          رمزي
        </button>
        <button
          onClick={() => setTab("enter")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-bold transition-all ${tab === "enter" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          أدخل رمزاً
        </button>
      </div>
      {tab === "view" ? (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">
            انسخ هذا الرمز واحفظه لاستعادة رحلتك من أي جهاز:
          </p>
          <div className="flex items-center gap-2 bg-background rounded-xl border border-border px-3 py-2">
            <code className="text-[10px] text-primary flex-1 break-all font-mono select-all">
              {sessionId}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded-lg font-bold"
            >
              {copied ? "✓" : "نسخ"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">الصق رمز الاستعادة الخاص بك:</p>
          <div className="flex gap-2">
            <input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="الصق الرمز هنا..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[11px] font-mono outline-none focus:border-primary"
              dir="ltr"
            />
            <button
              onClick={handleRestore}
              disabled={!inputCode.trim() || inputCode.trim() === sessionId}
              className="shrink-0 text-[11px] bg-primary text-primary-foreground px-3 py-2 rounded-xl font-bold disabled:opacity-40"
            >
              استعادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
