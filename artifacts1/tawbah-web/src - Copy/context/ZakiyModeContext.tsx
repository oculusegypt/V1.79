import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import { getSessionId } from "@/lib/session";
import { setZakiyState, mapDecisionToZakiyState } from "@/core/theme";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ZakiyDecision {
  message: string;
  action: { type: "redirect"; target: string };
  actionLabel: string;
  urgency: "low" | "medium" | "high" | "emergency";
  decisionType: "emergency" | "repentance" | "stabilize" | "growth";
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
  navigateToDecision: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AI_MODE_KEY = "tawbah_ai_mode";
const TRUST_LEVEL_KEY = "tawbah_trust_level";
const LAST_INTERACTION_KEY = "tawbah_last_interaction";
const SOFT_INTERRUPT_MINUTES = 20;

// Safe routes that exist in the router
const VALID_ROUTES = new Set([
  "/dhikr", "/sos", "/relapse", "/covenant", "/journey",
  "/day-one", "/habits", "/hadi-tasks", "/progress", "/quran",
  "/prayer-times", "/journal", "/munajat", "/rajaa", "/kaffarah",
  "/signs", "/danger-times", "/zakiy",
]);

function safeRoute(route: string): string {
  return VALID_ROUTES.has(route) ? route : "/dhikr";
}

// ── Context ────────────────────────────────────────────────────────────────────

const ZakiyModeContext = createContext<ZakiyModeContextValue | null>(null);

export function ZakiyModeProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();

  const [aiMode, setAiMode] = useState<boolean>(() => {
    try { return localStorage.getItem(AI_MODE_KEY) === "true"; } catch { return false; }
  });

  const [trustLevel, setTrustLevelState] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(TRUST_LEVEL_KEY) ?? "0", 10) || 0; } catch { return 0; }
  });

  const [decision, setDecision] = useState<ZakiyDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock to prevent concurrent requests
  const isFetchingRef = useRef(false);

  // ── Soft Interruption ── track last user interaction
  useEffect(() => {
    const updateActivity = () => {
      try {
        localStorage.setItem(LAST_INTERACTION_KEY, String(Date.now()));
      } catch {}
    };
    const events = ["click", "touchstart", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, updateActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, updateActivity));
  }, []);

  // Soft interruption: if aiMode + trustLevel >= 1 + 20min idle → auto fetch
  useEffect(() => {
    if (!aiMode || trustLevel < 1) return;

    const checkInactivity = () => {
      try {
        const last = parseInt(localStorage.getItem(LAST_INTERACTION_KEY) ?? "0", 10);
        const minutesSince = (Date.now() - last) / 60000;
        if (minutesSince >= SOFT_INTERRUPT_MINUTES && !isLoading && !isFetchingRef.current) {
          void fetchDecision();
        }
      } catch {}
    };

    const interval = setInterval(checkInactivity, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode, trustLevel, isLoading]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleAiMode = useCallback(() => {
    setAiMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(AI_MODE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const setTrustLevel = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(3, n));
    setTrustLevelState(clamped);
    try { localStorage.setItem(TRUST_LEVEL_KEY, String(clamped)); } catch {}
  }, []);

  const fetchDecision = useCallback(async () => {
    // Prevent double requests
    if (isFetchingRef.current || isLoading) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      const resp = await fetch("/api/zakiy/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, trustLevel }),
      });

      if (!resp.ok) throw new Error(`server_error_${resp.status}`);

      const data = (await resp.json()) as ZakiyDecision;

      // Validate response before accepting it
      if (!data?.message || !data?.action?.target) {
        throw new Error("invalid_response");
      }

      // Ensure target is safe
      data.action.target = safeRoute(data.action.target);
      setDecision(data);

      // Apply Zakiy visual state to the document
      const zakiyVisualState = mapDecisionToZakiyState(data.decisionType);
      setZakiyState(zakiyVisualState);
    } catch (err) {
      console.error("[ZakiyMode] fetchDecision error:", err);
      setError("حصل خطأ بسيط… جرّب تاني");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [trustLevel, isLoading]);

  const navigateToDecision = useCallback(() => {
    if (!decision?.action?.target) return;
    const safe = safeRoute(decision.action.target);
    navigate(safe);
  }, [decision, navigate]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ZakiyModeContext.Provider
      value={{
        aiMode,
        toggleAiMode,
        trustLevel,
        setTrustLevel,
        decision,
        fetchDecision,
        navigateToDecision,
        isLoading,
        error,
        clearError,
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
