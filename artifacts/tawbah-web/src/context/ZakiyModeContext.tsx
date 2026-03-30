import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getSessionId } from "@/lib/session";

export interface ZakiyDecision {
  message: string;
  action: { type: "redirect"; target: string };
  actionLabel: string;
  urgency: "low" | "medium" | "high" | "emergency";
  riskScore: number;
  riskTriggers: string[];
  task?: {
    id: string;
    source: string;
    title: string;
    completed: boolean;
    priority: string;
    route?: string;
  };
}

interface ZakiyModeContextValue {
  aiMode: boolean;
  toggleAiMode: () => void;
  trustLevel: number;
  setTrustLevel: (n: number) => void;
  decision: ZakiyDecision | null;
  fetchDecision: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ZakiyModeContext = createContext<ZakiyModeContextValue | null>(null);

const AI_MODE_KEY = "tawbah_ai_mode";
const TRUST_LEVEL_KEY = "tawbah_trust_level";

export function ZakiyModeProvider({ children }: { children: ReactNode }) {
  const [aiMode, setAiMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AI_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [trustLevel, setTrustLevelState] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(TRUST_LEVEL_KEY) ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  });

  const [decision, setDecision] = useState<ZakiyDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAiMode = useCallback(() => {
    setAiMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AI_MODE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const setTrustLevel = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(3, n));
    setTrustLevelState(clamped);
    try {
      localStorage.setItem(TRUST_LEVEL_KEY, String(clamped));
    } catch {}
  }, []);

  const fetchDecision = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      const resp = await fetch("/api/zakiy/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, trustLevel }),
      });
      if (!resp.ok) throw new Error("server error");
      const data = (await resp.json()) as ZakiyDecision;
      setDecision(data);
    } catch (err) {
      setError("تعذّر الاتصال بزكي الآن");
      console.error("[ZakiyMode] fetchDecision error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [trustLevel]);

  return (
    <ZakiyModeContext.Provider
      value={{
        aiMode,
        toggleAiMode,
        trustLevel,
        setTrustLevel,
        decision,
        fetchDecision,
        isLoading,
        error,
      }}
    >
      {children}
    </ZakiyModeContext.Provider>
  );
}

export function useZakiyMode() {
  const ctx = useContext(ZakiyModeContext);
  if (!ctx) throw new Error("useZakiyMode must be inside ZakiyModeProvider");
  return ctx;
}
