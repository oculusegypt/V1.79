import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";
import { voicePending } from "@/lib/voice-pending";
import { isNativeApp } from "@/lib/api-base";

const NUM_BARS = 34;

const IDLE_HEIGHTS = Array.from({ length: NUM_BARS }, (_, i) => {
  const x = i / (NUM_BARS - 1);
  const bell = Math.exp(-Math.pow((x - 0.5) * 3.8, 2));
  return 0.05 + bell * 0.18;
});

export function VoiceOrbOverlay({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [bars, setBars] = useState<number[]>(IDLE_HEIGHTS);
  const [phase, setPhase] = useState<"entering" | "listening" | "done">("entering");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");

  const recognitionRef = useRef<any>(null);
  const capturedTextRef = useRef("");
  const barAnimRef = useRef<number>(0);
  const listeningRef = useRef(false);

  const stopBarAnim = useCallback(() => {
    listeningRef.current = false;
    cancelAnimationFrame(barAnimRef.current);
  }, []);

  const startBarAnim = useCallback(() => {
    listeningRef.current = true;
    const tick = () => {
      if (!listeningRef.current) return;
      setBars((prev) =>
        prev.map((h, i) => {
          const center = NUM_BARS / 2;
          const dist = Math.abs(i - center) / center;
          const maxH = 0.92 - dist * 0.28;
          const speed = 0.52 - dist * 0.15;
          const delta = (Math.random() - 0.5) * speed;
          return Math.max(0.04, Math.min(maxH, h + delta));
        })
      );
      barAnimRef.current = requestAnimationFrame(tick);
    };
    barAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const finishAndNavigate = useCallback((text: string) => {
    stopBarAnim();
    setBars(IDLE_HEIGHTS);
    setPhase("done");
    const trimmed = text.trim();
    if (trimmed) {
      voicePending.set(trimmed);
      localStorage.setItem("zakiy_voice_input", trimmed);
    }
    setTimeout(() => {
      navigate("/zakiy");
      onClose();
      if (trimmed) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("zakiy:voice-input", { detail: trimmed }));
        }, 750);
      }
    }, 380);
  }, [stopBarAnim, navigate, onClose]);

  const startListening = useCallback(() => {
    setPhase("listening");
    startBarAnim();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { finishAndNavigate(""); return; }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) { capturedTextRef.current = final.trim(); setFinalText(final.trim()); setInterimText(""); }
    };
    recognition.onend = () => finishAndNavigate(capturedTextRef.current);
    recognition.onerror = () => finishAndNavigate(capturedTextRef.current);
    recognition.start();
  }, [startBarAnim, finishAndNavigate]);

  useEffect(() => { const t = setTimeout(startListening, 520); return () => clearTimeout(t); }, [startListening]);
  useEffect(() => { return () => { stopBarAnim(); recognitionRef.current?.abort(); }; }, [stopBarAnim]);

  const displayText = finalText || interimText;
  const isListening = phase === "listening";

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ background: "radial-gradient(ellipse 90% 80% at 50% 55%, #0a0c1a 0%, #050609 100%)" }}
      onClick={onClose}
    >
      {/* ── Ambient background glow — single hue, like Gemini ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 480, height: 480,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(108,87,255,0.13) 0%, rgba(56,140,255,0.07) 50%, transparent 75%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />

      {/* ── Subtle dot grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 100%)",
        }}
      />

      <div
        className="flex flex-col items-center gap-8 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ WAVEFORM — symmetric, monochrome-ish like ChatGPT/Apple ══ */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 88 }}>
          {/* Top half */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2.5px", height: 44 }}>
            {bars.map((h, i) => {
              const t = i / (NUM_BARS - 1);
              const distFromCenter = Math.abs(t - 0.5) * 2;
              const barH = Math.max(2, h * 44);
              const opacity = isListening ? 0.7 + (1 - distFromCenter) * 0.3 : 0.18;
              const w = i % 3 === 1 ? 3.5 : 2.5;
              return (
                <motion.div
                  key={`t${i}`}
                  animate={{ height: barH }}
                  transition={{ duration: 0.09, ease: "easeOut" }}
                  style={{
                    width: w,
                    borderRadius: "3px 3px 1px 1px",
                    flexShrink: 0,
                    background: isListening
                      ? `linear-gradient(to top, rgba(108,87,255,${opacity}), rgba(130,160,255,${opacity * 0.85}))`
                      : `rgba(255,255,255,${opacity})`,
                    transition: "background 0.5s ease",
                  }}
                />
              );
            })}
          </div>

          {/* Center line */}
          <div
            style={{
              width: "100%", height: 1,
              background: isListening
                ? "linear-gradient(90deg, transparent, rgba(108,87,255,0.6), rgba(160,180,255,0.7), rgba(108,87,255,0.6), transparent)"
                : "rgba(255,255,255,0.06)",
              transition: "background 0.5s ease",
            }}
          />

          {/* Bottom half (mirror) */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "2.5px", height: 43 }}>
            {bars.map((h, i) => {
              const t = i / (NUM_BARS - 1);
              const distFromCenter = Math.abs(t - 0.5) * 2;
              const barH = Math.max(2, h * 36);
              const opacity = isListening ? 0.3 + (1 - distFromCenter) * 0.18 : 0.07;
              const w = i % 3 === 1 ? 3.5 : 2.5;
              return (
                <motion.div
                  key={`b${i}`}
                  animate={{ height: barH }}
                  transition={{ duration: 0.09, ease: "easeOut" }}
                  style={{
                    width: w,
                    borderRadius: "1px 1px 3px 3px",
                    flexShrink: 0,
                    background: isListening
                      ? `rgba(108,87,255,${opacity})`
                      : `rgba(255,255,255,${opacity})`,
                    transition: "background 0.5s ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ══ MIC ORB — Gemini-style clean gradient ══ */}
        <motion.div
          initial={{ scale: 0.4, y: 55, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 28, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative flex items-center justify-center"
          style={{ width: 152, height: 152 }}
        >
          {/* Far glow — soft, single hue */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -28,
              background: "radial-gradient(circle, rgba(108,87,255,0.22) 0%, rgba(80,130,255,0.1) 50%, transparent 75%)",
              filter: "blur(20px)",
              opacity: isListening ? 1 : 0.4,
              transition: "opacity 0.6s ease",
            }}
            animate={{ scale: isListening ? [1, 1.06, 1] : 1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Slow-rotating gradient halo — like Gemini's outer shimmer */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -5,
              background:
                "conic-gradient(from 0deg, rgba(108,87,255,0.55), rgba(80,140,255,0.35), rgba(160,120,255,0.5), rgba(60,120,255,0.3), rgba(108,87,255,0.55))",
              filter: "blur(7px)",
              opacity: isListening ? 0.75 : 0.28,
              transition: "opacity 0.6s ease",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Thin crisp border — subtle */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -1,
              background:
                "conic-gradient(from 180deg, rgba(140,110,255,0.7), rgba(80,150,255,0.5), rgba(180,140,255,0.65), rgba(90,130,255,0.5), rgba(140,110,255,0.7))",
              padding: "1.5px",
              borderRadius: "50%",
              opacity: isListening ? 0.9 : 0.4,
              transition: "opacity 0.5s ease",
            }}
          />

          {/* Inner sphere — dark, deep, like ChatGPT's core */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 1.5,
              background:
                "radial-gradient(circle at 40% 32%, rgba(255,255,255,0.055) 0%, rgba(12,11,28,0.98) 52%, rgba(6,5,18,1) 100%)",
              boxShadow:
                "inset 0 0 24px rgba(0,0,0,0.7), inset 0 2px 6px rgba(255,255,255,0.03)",
            }}
          />

          {/* Inner color breathe — very subtle, single hue */}
          <motion.div
            className="absolute rounded-full"
            style={{ inset: 1.5 }}
            animate={{
              background: [
                "radial-gradient(circle at 44% 40%, rgba(108,87,255,0.28) 0%, transparent 60%)",
                "radial-gradient(circle at 54% 36%, rgba(80,130,255,0.22) 0%, transparent 60%)",
                "radial-gradient(circle at 46% 52%, rgba(120,100,255,0.28) 0%, transparent 60%)",
                "radial-gradient(circle at 44% 40%, rgba(108,87,255,0.28) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Mic icon — clean white, Apple-style */}
          <div className="relative z-10 flex items-center justify-center">
            <motion.div
              animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mic
                size={52}
                strokeWidth={1.3}
                style={{
                  color: "rgba(255,255,255,0.9)",
                  filter: isListening
                    ? "drop-shadow(0 0 10px rgba(160,140,255,0.6)) drop-shadow(0 0 22px rgba(108,87,255,0.35))"
                    : "drop-shadow(0 0 6px rgba(255,255,255,0.15))",
                  transition: "filter 0.5s ease",
                }}
              />
            </motion.div>
          </div>

          {/* Sound wave rings — water-ripple style, emanate from mic edge */}
          {isListening && [0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 0,
                border: `${1.8 - i * 0.2}px solid rgba(108,87,255,${0.55 - i * 0.08})`,
              }}
              animate={{
                scale: [1, 2.6],
                opacity: [0.6 - i * 0.06, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.42,
                ease: [0.2, 0.6, 0.4, 1],
              }}
            />
          ))}

          {/* Extra fast inner ring for immediate audio feel */}
          {isListening && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: 0, border: "2px solid rgba(130,110,255,0.5)" }}
              animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* ══ STATUS ══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col items-center gap-2"
          >
            <p style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: isListening ? "rgba(180,170,255,0.9)" : "rgba(255,255,255,0.38)",
              transition: "color 0.5s ease",
            }}>
              {phase === "entering" ? "جاري التجهيز..." : phase === "listening" ? "تحدث الآن..." : "جاري الإرسال..."}
            </p>

            {/* Minimal equalizer indicator — like Siri's */}
            {isListening && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.5].map((h, i) => (
                  <motion.div
                    key={i}
                    style={{
                      width: 3, borderRadius: 2,
                      background: "rgba(140,120,255,0.7)",
                    }}
                    animate={{ height: [4, Math.round(h * 16), 4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ══ TRANSCRIPT ══ */}
        <AnimatePresence mode="wait">
          {displayText ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="max-w-[280px] text-center"
            >
              <p style={{
                fontSize: 14,
                lineHeight: "1.65",
                padding: "10px 20px",
                borderRadius: 14,
                color: finalText ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                background: finalText ? "rgba(108,87,255,0.14)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${finalText ? "rgba(120,100,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                fontStyle: finalText ? "normal" : "italic",
                backdropFilter: "blur(8px)",
                transition: "all 0.3s ease",
              }}>
                {displayText}
              </p>
            </motion.div>
          ) : phase === "listening" ? (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>ما تقوله سيظهر هنا...</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          transition={{ delay: 1.2 }}
          style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em" }}
        >
          اضغط للإغلاق
        </motion.p>
      </div>
    </motion.div>
  );
}
