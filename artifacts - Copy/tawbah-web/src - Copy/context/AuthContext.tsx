import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { clearAuthToken, setAuthToken } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";

type AuthUser = { id: string; email: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncFromSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        clearAuthToken();
        setUser(null);
        setIsLoading(false);
        return;
      }
      setAuthToken(session.access_token);
      setUser({ id: session.user.id, email: session.user.email ?? "" });
      try {
        localStorage.setItem("tawbah_session", `user_${session.user.id}`);
        localStorage.setItem("tawbah_user_id", session.user.id);
      } catch {}
      setIsLoading(false);
    };

    syncFromSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!session) {
        clearAuthToken();
        setUser(null);
        setIsLoading(false);
        return;
      }
      setAuthToken(session.access_token);
      setUser({ id: session.user.id, email: session.user.email ?? "" });
      try {
        localStorage.setItem("tawbah_session", `user_${session.user.id}`);
        localStorage.setItem("tawbah_user_id", session.user.id);
      } catch {}
      setIsLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const linkSessionToUser = (userId: string) => {
    try {
      const prev = localStorage.getItem("tawbah_session");
      if (!prev || prev === "guest" || !prev.startsWith("user_")) {
        localStorage.setItem("tawbah_session", `user_${userId}`);
      }
      localStorage.setItem("tawbah_user_id", userId);
    } catch {}
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error("login_failed");
    setAuthToken(data.session.access_token);
    setUser({ id: data.session.user.id, email: data.session.user.email ?? email });
    linkSessionToUser(data.session.user.id);
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error("register_failed");
    const session = data.session;
    if (session) {
      setAuthToken(session.access_token);
      setUser({ id: session.user.id, email: session.user.email ?? email });
      linkSessionToUser(session.user.id);
    } else {
      clearAuthToken();
      setUser(null);
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    clearAuthToken();
    try {
      localStorage.removeItem("tawbah_user_id");
      const guestId = `guest_${Date.now()}`;
      localStorage.setItem("tawbah_session", guestId);
    } catch {}
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, isLoading, login, register, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
