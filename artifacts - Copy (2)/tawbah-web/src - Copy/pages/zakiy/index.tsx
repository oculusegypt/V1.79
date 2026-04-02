import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, StopCircle, AlertTriangle, Sparkles, ChevronDown, X } from "lucide-react";
import { ContextHeader } from "@/components/header/ContextHeader";
import { getZakiyState } from "@/core/theme";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { voicePending } from "@/lib/voice-pending";
import { getApiBase, isNativeApp } from "@/lib/api-base";
import type { Message, MessageSegment, ApiHistory } from "./types";
import { VOICE_PROFILES, VOICE_PROFILE_STORAGE_KEY, DEFAULT_VOICE_PROFILE_ID, GREETING } from "./constants";
import { VoiceSelectorSheet } from "./components/VoiceSelectorSheet";
import { ZakiyAvatar } from "./components/ZakiyAvatar";
import { BotMessageBody } from "./components/BotMessageBody";
import { SuggestionCards } from "./components/SuggestionCards";
import { StarterCards } from "./components/StarterCards";

export default function ZakiyPage() {
  const API_BASE = getApiBase();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [impressionOpenId, setImpressionOpenId] = useState<string | null>(null);
  const [impressionTexts, setImpressionTexts] = useState<Record<string, string>>({});
  const [riskAlert, setRiskAlert] = useState<{ level: "medium" | "high"; message: string; sign: string | null } | null>(null);
  const [riskDismissed, setRiskDismissed] = useState(false);
  const [anniversaryMilestone, setAnniversaryMilestone] = useState<string | null>(null);
  const [autoPlayMsgId, setAutoPlayMsgId] = useState<string | null>(null);
  const autoPlayQueueRef = useRef<string[]>([]);
  const [voiceProfileId, setVoiceProfileId] = useState<string>(
    () => localStorage.getItem(VOICE_PROFILE_STORAGE_KEY) ?? DEFAULT_VOICE_PROFILE_ID
  );
  const [voiceSelectorOpen, setVoiceSelectorOpen] = useState(false);
  const [interimText, setInterimText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [zakiyCurrentState] = useState(() => getZakiyState());

  const sessionId = getSessionId();
  const hasUserMessages = messages.some((m) => m.role === "user");

  function handleVoiceProfileSelect(id: string) {
    setVoiceProfileId(id);
    localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, id);
  }

  const currentVoiceProfile = VOICE_PROFILES.find((p) => p.id === voiceProfileId) ?? VOICE_PROFILES[1]!;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const text = voicePending.get() || localStorage.getItem("zakiy_voice_input") || "";
    if (!text) return;
    setInput(text);
    const clearT = window.setTimeout(() => {
      voicePending.clear();
      localStorage.removeItem("zakiy_voice_input");
    }, 300);
    const focusT = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => {
      window.clearTimeout(clearT);
      window.clearTimeout(focusT);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (!text) return;
      voicePending.clear();
      localStorage.removeItem("zakiy_voice_input");
      setInput(text);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("zakiy:voice-input", handler);
    return () => window.removeEventListener("zakiy:voice-input", handler);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();

    async function checkAnniversaryAndRisk() {
      try {
        const [annRes, riskRes] = await Promise.all([
          fetch(`${API_BASE}/zakiy/anniversary?sessionId=${sessionId}`, { signal: controller.signal }),
          fetch(`${API_BASE}/zakiy/risk-check?sessionId=${sessionId}`, { signal: controller.signal }),
        ]);
        const [annData, riskData] = await Promise.all([
          annRes.json() as Promise<{ anniversary: { milestone: string; message: string } | null }>,
          riskRes.json() as Promise<{ risk: { level: "medium" | "high"; message: string; sign: string | null } | null }>,
        ]);

        if (annData.anniversary?.message) {
          const { milestone, message } = annData.anniversary;
          setAnniversaryMilestone(milestone);
          const annMsg: Message = {
            id: "anniversary-" + Date.now(),
            role: "bot",
            text: message,
            segments: [{ type: "text", text: message }],
            timestamp: new Date(),
            suggestions: [],
            suggestionsLoading: false,
          };
          setMessages((prev) => [...prev, annMsg]);
        }

        if (riskData.risk?.level === "medium" || riskData.risk?.level === "high") {
          setRiskAlert({
            level: riskData.risk.level,
            message: riskData.risk.message,
            sign: riskData.risk.sign,
          });
        }
      } catch { /* ignore — background check */ }
    }

    checkAnniversaryAndRisk();
    return () => controller.abort();
  }, [sessionId, API_BASE]);

  function buildHistory(): ApiHistory[] {
    return messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.text }));
  }

  function handleImpressionToggle(id: string, text?: string) {
    if (impressionOpenId === id) {
      setImpressionOpenId(null);
    } else {
      if (text) setImpressionTexts((prev) => ({ ...prev, [id]: text }));
      setImpressionOpenId(id);
    }
  }

  async function fetchSuggestions(history: ApiHistory[], msgId: string) {
    try {
      const res = await fetch(`${API_BASE}/zakiy/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: data.suggestions ?? [], suggestionsLoading: false }
          : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: [], suggestionsLoading: false }
          : m)
      );
    }
  }

  function handleAutoPlayComplete() {
    const next = autoPlayQueueRef.current.shift();
    setAutoPlayMsgId(next ?? null);
  }

  function addBotMessage(text: string, segments?: MessageSegment[]) {
    const id = Date.now().toString();
    const msg: Message = {
      id,
      role: "bot",
      text,
      segments: segments ?? [],
      timestamp: new Date(),
      suggestions: [],
      suggestionsLoading: true,
    };
    autoPlayQueueRef.current = [];
    setAutoPlayMsgId(id);
    setMessages((prev) => [...prev, msg]);
    const currentHistory = buildHistory();
    fetchSuggestions([...currentHistory, { role: "assistant", content: text }], msg.id);
  }

  function handleBotResponse(text: string, segments?: MessageSegment[]) {
    addBotMessage(text, segments);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "u", role: "user", text, timestamp: new Date() },
    ]);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const trimmed = text.trim();
    const history = buildHistory();
    addUserMessage(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = "42px";
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/zakiy/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, sessionId, voiceProfile: voiceProfileId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      handleBotResponse(data.response, data.segments);
    } catch {
      addBotMessage("عذراً يا صاحبي، في مشكلة تقنية. جرّب تاني بعد شوية.");
    } finally {
      setLoading(false);
    }
  }

  async function startVoiceInputNative() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        addBotMessage("متصفح التطبيق لا يدعم الميكروفون. جرّب تحديث التطبيق أو استخدم Chrome.");
        return;
      }
      if (typeof (window as any).MediaRecorder === "undefined") {
        addBotMessage("التسجيل الصوتي غير مدعوم على جهازك داخل التطبيق. جرّب تحديث WebView/Chrome.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const pickMimeType = () => {
        const MR = (window as any).MediaRecorder as typeof MediaRecorder | undefined;
        const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
        for (const t of candidates) {
          try {
            if (MR?.isTypeSupported?.(t)) return t;
          } catch {}
        }
        return "";
      };

      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType });
          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("file_reader_failed"));
            reader.onload = () => {
              const result = String(reader.result ?? "");
              const commaIdx = result.indexOf(",");
              if (commaIdx === -1) return reject(new Error("base64_parse_failed"));
              resolve(result.slice(commaIdx + 1));
            };
            reader.readAsDataURL(blob);
          });

          setLoading(true);
          const history = buildHistory();
          const res = await fetch(`${API_BASE}/zakiy/voice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: b64, history, sessionId, voiceProfile: voiceProfileId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error((data as { error?: string }).error ?? "voice_failed");

          const transcript = (data as { transcript?: string }).transcript ?? "";
          if (transcript.trim()) addUserMessage(transcript.trim());

          const response = (data as { response?: string }).response ?? "";
          const segs = (data as { segments?: MessageSegment[] }).segments;
          if (response) handleBotResponse(response, segs);
        } catch (e) {
          console.error("[Zakiy] Voice input failed:", e);
          addBotMessage("ما قدرت أسمعك — تأكد من السماح بالميكروفون وجرّب مرة ثانية.");
        } finally {
          setLoading(false);
          setRecording(false);
        }
      };

      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error("[Zakiy] getUserMedia/MediaRecorder failed:", e);
      addBotMessage("تعذّر الوصول للميكروفون. تأكد من منح الإذن.");
    }
  }

  function startVoiceInput() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      if (isNativeApp()) {
        void startVoiceInputNative();
        return;
      }
      addBotMessage("متصفحك لا يدعم الإدخال الصوتي — جرّب Chrome أو Edge.");
      return;
    }

    const recognition: SpeechRecognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "ar-EG";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => { setRecording(false); setInterimText(""); };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setRecording(false);
      setInterimText("");
      const err = e.error as string;
      if (err !== "aborted" && err !== "no-speech") {
        addBotMessage("ما قدرت أسمعك — تأكد من السماح بالميكروفون وجرّب مرة ثانية.");
      }
    };
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        setInterimText("");
        setInput(final.trim());
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    recognition.start();
  }

  function stopVoiceInput() {
    if (isNativeApp()) {
      try { mediaRef.current?.stop(); } catch {}
      setRecording(false);
      return;
    }
    recognitionRef.current?.stop();
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <AnimatePresence>
        {voiceSelectorOpen && (
          <VoiceSelectorSheet
            selectedId={voiceProfileId}
            onSelect={handleVoiceProfileSelect}
            onClose={() => setVoiceSelectorOpen(false)}
          />
        )}
      </AnimatePresence>

      <ContextHeader
        title="الزكي"
        subtitle="صاحبك الروحاني دايماً معاك"
        zakiyState={zakiyCurrentState}
        icon={
          <span
            className="text-white font-bold leading-none"
            style={{ fontFamily: "'Amiri Quran', serif", fontSize: "17px" }}
          >
            ز
          </span>
        }
        right={
          <div className="flex items-center gap-1.5">
            {anniversaryMilestone && (
              <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-300/40">
                <Sparkles size={11} /> {anniversaryMilestone}
              </span>
            )}
            <button
              onClick={() => setVoiceSelectorOpen(true)}
              className="flex items-center gap-1.5 bg-white/80 dark:bg-stone-800/60 px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700/50 hover:border-emerald-300 transition-colors"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <span className="text-sm leading-none">{currentVoiceProfile.emoji}</span>
              <span className="text-[11px] text-stone-600 dark:text-stone-300 font-medium max-w-[60px] truncate">{currentVoiceProfile.name}</span>
              <ChevronDown size={11} className="text-stone-400 flex-shrink-0" />
            </button>
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">متصل</span>
            </span>
          </div>
        }
      />

      <AnimatePresence>
        {riskAlert && !riskDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "overflow-hidden border-b",
              riskAlert.level === "high"
                ? "bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30"
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <AlertTriangle size={16} className={cn("mt-0.5 flex-shrink-0", riskAlert.level === "high" ? "text-red-500" : "text-amber-500")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold mb-0.5", riskAlert.level === "high" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                  {riskAlert.level === "high" ? "⚠️ الزكي قلقان عليك" : "💛 الزكي يلاحظ"}
                </p>
                <p className={cn("text-xs leading-relaxed", riskAlert.level === "high" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300")}>{riskAlert.message}</p>
                {riskAlert.sign && (
                  <p className={cn("text-[10px] mt-1", riskAlert.level === "high" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>العلامة: {riskAlert.sign}</p>
                )}
              </div>
              <button onClick={() => setRiskDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll-area"
        style={{
          background: "var(--chat-bg, hsl(var(--muted)/0.3))",
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className={cn("flex items-end gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {msg.role === "bot" && <ZakiyAvatar />}

                <div
                  className={cn(
                    "max-w-[86%] rounded-2xl px-4 py-3.5",
                    msg.role === "user"
                      ? "text-white rounded-tl-[6px]"
                      : "rounded-tr-[6px] text-foreground bot-bubble"
                  )}
                  style={msg.role === "user"
                    ? {
                        background: "linear-gradient(140deg,#059669,#0d9488)",
                        boxShadow: "0 4px 18px rgba(5,150,105,0.28), 0 1px 4px rgba(0,0,0,0.1)",
                      }
                    : undefined
                  }
                >
                  {msg.role === "bot" ? (
                    <BotMessageBody
                      msg={msg}
                      onImpressionToggle={handleImpressionToggle}
                      impressionOpen={impressionOpenId === msg.id}
                      impressionText={impressionTexts[msg.id]}
                      sessionId={sessionId}
                      history={buildHistory()}
                      isAutoPlayTarget={autoPlayMsgId === msg.id}
                      onAudioComplete={handleAutoPlayComplete}
                    />
                  ) : (
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className={cn(
                    "text-[10px] opacity-50 mt-1.5 text-end",
                    msg.role === "user" ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {msg.role === "bot" && msg.id !== "greeting" && (
                <SuggestionCards
                  suggestions={msg.suggestions}
                  loading={msg.suggestionsLoading}
                  onSelect={(q) => sendMessage(q)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasUserMessages && !loading && (
          <StarterCards onSelect={(q) => sendMessage(q)} />
        )}

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
            <ZakiyAvatar pulse />
            <div className="bot-bubble rounded-2xl rounded-tr-[6px] px-5 py-4">
              <div className="flex gap-[6px] items-end">
                {[0, 1, 2].map((idx) => (
                  <motion.span
                    key={idx}
                    className="block rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: idx === 1
                        ? "linear-gradient(135deg,#059669,#0d9488)"
                        : "rgba(5,150,105,0.35)",
                    }}
                    animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: idx * 0.18,
                      ease: [0.4, 0, 0.6, 1],
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ height: "100px" }} />
        <div ref={messagesEndRef} />
      </div>

      <div
        className="fixed inset-x-0 max-w-md mx-auto z-30"
        style={{ bottom: "8px" }}
      >
        <div
          className="mx-2 rounded-2xl overflow-hidden input-bar"
          style={{
            backdropFilter: "blur(24px)",
          }}
        >
          <AnimatePresence>
            {recording && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-xs text-primary font-medium flex-1 truncate">
                    {interimText || "استمع... تكلّم الآن"}
                  </span>
                  <span className="text-[10px] text-stone-400">اضغط للإيقاف</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 px-3 py-2.5">
            <button
              onClick={recording ? stopVoiceInput : startVoiceInput}
              disabled={loading}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                recording
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                loading && "opacity-40 cursor-not-allowed"
              )}
            >
              {recording ? <StopCircle size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                  <line x1="2" y1="8" x2="4.5" y2="8" strokeWidth="1.4" opacity="0.7" />
                  <line x1="2" y1="10.5" x2="5" y2="10.5" strokeWidth="1.4" opacity="0.85" />
                  <line x1="2" y1="13" x2="4.5" y2="13" strokeWidth="1.4" opacity="0.7" />
                  <line x1="19.5" y1="8" x2="22" y2="8" strokeWidth="1.4" opacity="0.7" />
                  <line x1="19" y1="10.5" x2="22" y2="10.5" strokeWidth="1.4" opacity="0.85" />
                  <line x1="19.5" y1="13" x2="22" y2="13" strokeWidth="1.4" opacity="0.7" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                }}
                placeholder="اكتب ما في قلبك..."
                disabled={loading || recording}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl px-3.5 py-2.5 text-[13.5px]",
                  "border border-border/50 bg-muted/40 text-foreground",
                  "placeholder:text-muted-foreground/60 placeholder:text-[12px]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "focus:bg-background/80",
                  "max-h-32 overflow-y-auto leading-relaxed transition-all",
                  (loading || recording) && "opacity-50"
                )}
                style={{ minHeight: "42px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
              />
            </div>

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || recording}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                input.trim() && !loading && !recording
                  ? "text-white shadow-md shadow-primary/30"
                  : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
              )}
              style={input.trim() && !loading && !recording ? {
                background: "linear-gradient(135deg, var(--primary-soft, #2dd4bf), var(--primary, #059669))",
              } : undefined}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="scale-x-[-1]" />}
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 pb-2">
            ما تقوله هنا آمن ومحفوظ بيننا فقط
          </p>
        </div>
      </div>
    </div>
  );
}
