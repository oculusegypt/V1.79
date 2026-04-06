import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { clearGuestSessionId, setSessionUserId } from "@/lib/session";
import { apiUrl } from "@/lib/api-base";

type AuthUser = { id: string; username: string | null; email: string; gender?: "male" | "female" };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, phone?: string, gender?: "male" | "female") => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage first for instant persistence
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("tawbah_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setSessionUserId(user?.id ?? null);
  }, [user]);

  useEffect(() => {
    // Verify session with server but DON'T clear user if it fails
    // User data persists in localStorage
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u) {
            const newUser = { id: String(u.id), username: u.username ?? null, email: u.email ?? "", gender: u.gender };
            setUser(newUser);
            setSessionUserId(String(u.id));
            localStorage.setItem("tawbah_user", JSON.stringify(newUser));
            if (u.gender) {
              localStorage.setItem("tawbah_gender", u.gender);
            }
          }
        }
        // If not ok, keep the user from localStorage (session might be expired but user data is valid)
      })
      .catch(() => {
        // Network error - keep localStorage user
      })
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
    const newUser = { id: String(u.id), username: u.username ?? null, email: u.email ?? "", gender: u.gender };
    setUser(newUser);
    setSessionUserId(String(u.id));
    localStorage.setItem("tawbah_user", JSON.stringify(newUser));
    if (u.gender) {
      localStorage.setItem("tawbah_gender", u.gender);
    }
  };

  const register = async (username: string, email: string, password: string, phone?: string, gender?: "male" | "female") => {
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, phone, gender }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "register_failed");
    }
    const data = await res.json();
    const u = data.user;
    const newUser = { id: String(u.id), username: u.username ?? null, email: u.email ?? "" };
    setUser(newUser);
    setSessionUserId(String(u.id));
    localStorage.setItem("tawbah_user", JSON.stringify(newUser));
    // Save gender to localStorage for Zakiy to use
    if (gender) {
      localStorage.setItem("tawbah_gender", gender);
    }
  };

  const logout = async () => {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
    setSessionUserId(null);
    clearGuestSessionId();
    localStorage.removeItem("tawbah_user");
    localStorage.removeItem("tawbah_gender");
    localStorage.removeItem("home_dhikr_count");
    localStorage.removeItem("journey30_active");
    localStorage.removeItem("journey30_restore");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("tawbah_session_id");
    // Reload to clear all cached API data
    window.location.href = "/";
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
