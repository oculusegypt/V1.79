import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api-base";
import { setSessionUserId } from "@/lib/session";

type AuthUser = { id: string; username: string | null; email: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) { setUser(null); return; }
        const data = await res.json();
        const u = data.user;
        if (!u) { setUser(null); return; }
        setUser({ id: String(u.id), username: u.username ?? null, email: u.email ?? "" });
        setSessionUserId(String(u.id));
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "login_failed");
    }
    const data = await res.json();
    const u = data.user;
    setUser({ id: String(u.id), username: u.username ?? null, email: u.email ?? "" });
    setSessionUserId(String(u.id));
  };

  const register = async (username: string, email: string, password: string, phone?: string) => {
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "register_failed");
    }
    const data = await res.json();
    const u = data.user;
    setUser({ id: String(u.id), username: u.username ?? null, email: u.email ?? "" });
    setSessionUserId(String(u.id));
  };

  const logout = async () => {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
    setSessionUserId(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
