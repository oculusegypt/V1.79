import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      setLocation("/account");
    } catch {
      setError(mode === "login" ? "فشل تسجيل الدخول" : "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5" dir="rtl">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-5">
        <h1 className="text-lg font-black text-center">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {mode === "login" ? "سجّل دخولك لبدء رحلة ٣٠ يوماً" : "أنشئ حسابًا لتزامن بيانات الرحلة"}
        </p>

        <div className="mt-4 grid grid-cols-2 bg-muted/50 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-xl text-sm font-bold transition-colors ${mode === "login" ? "bg-background border border-border" : "text-muted-foreground"}`}
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 rounded-xl text-sm font-bold transition-colors ${mode === "register" ? "bg-background border border-border" : "text-muted-foreground"}`}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</label>
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

          <label className="text-xs font-bold text-muted-foreground mt-2">كلمة المرور</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            dir="ltr"
          />

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
            {loading ? "جارٍ المتابعة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>

          <button
            type="button"
            onClick={() => setLocation("/account")}
            className="w-full py-3 rounded-2xl bg-muted text-foreground font-bold text-sm"
          >
            رجوع
          </button>
        </form>
      </div>
    </div>
  );
}
