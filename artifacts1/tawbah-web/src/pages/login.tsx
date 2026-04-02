import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  username_required: "اسم المستخدم مطلوب",
  email_required: "البريد الإلكتروني مطلوب أو غير صحيح",
  password_min_6: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  username_invalid_chars: "اسم المستخدم يحتوي على رموز غير مسموح بها (أحرف إنجليزية، أرقام، _ أو . فقط)",
  email_taken: "هذا البريد الإلكتروني مستخدم مسبقاً",
  username_taken: "اسم المستخدم هذا مستخدم مسبقاً",
  invalid_credentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
  login_failed: "فشل تسجيل الدخول",
  register_failed: "فشل إنشاء الحساب",
};

function getErrorMsg(code: string): string {
  return ERROR_MESSAGES[code] ?? code;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, email, password, phone || undefined);
      }
      setLocation("/");
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "unknown";
      setError(getErrorMsg(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-8" dir="rtl">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-5">
        <h1 className="text-lg font-black text-center">
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {mode === "login"
            ? "سجّل دخولك لبدء رحلة التوبة"
            : "أنشئ حسابًا لمزامنة بيانات رحلتك"}
        </p>

        <div className="mt-4 grid grid-cols-2 bg-muted/50 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className={`py-2 rounded-xl text-sm font-bold transition-colors ${mode === "login" ? "bg-background border border-border" : "text-muted-foreground"}`}
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); }}
            className={`py-2 rounded-xl text-sm font-bold transition-colors ${mode === "register" ? "bg-background border border-border" : "text-muted-foreground"}`}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">
              اسم المستخدم
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="my_username"
              autoComplete="username"
              required
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              أحرف إنجليزية صغيرة، أرقام، _ أو . فقط
            </p>
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="name@email.com"
                  autoComplete="email"
                  required
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  رقم الجوال{" "}
                  <span className="text-muted-foreground font-normal">(اختياري)</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="+966501234567"
                  autoComplete="tel"
                  dir="ltr"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">
              كلمة المرور
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              dir="ltr"
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm disabled:opacity-60"
          >
            {loading
              ? "جارٍ المتابعة..."
              : mode === "login"
              ? "تسجيل الدخول"
              : "إنشاء الحساب"}
          </button>

          <button
            type="button"
            onClick={() => setLocation("/")}
            className="w-full py-3 rounded-2xl bg-muted text-foreground font-bold text-sm"
          >
            رجوع
          </button>
        </form>
      </div>
    </div>
  );
}
