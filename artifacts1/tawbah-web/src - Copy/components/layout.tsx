import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, User2, X, ChevronUp, Sparkles, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { VoiceOrbOverlay } from "./VoiceOrbOverlay";
import { isNativeApp, getApiBase } from "@/lib/api-base";

function ZakiyNavOrb({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-[60px] h-[60px]">
      {/* Ambient glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "-8px",
          background: "radial-gradient(circle, hsl(var(--primary)/0.2) 0%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      {/* Animated rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ 
            border: i === 0 ? "2px solid hsl(var(--primary)/0.35)" : "1px solid hsl(var(--primary)/0.15)",
          }}
          animate={{ 
            scale: [1, 1.15 + i * 0.08, 1], 
            opacity: [0.35 - i * 0.1, 0, 0.35 - i * 0.1] 
          }}
          transition={{ 
            duration: 3 + i * 0.5, 
            repeat: Infinity, 
            delay: i * 0.8, 
            ease: "easeInOut" 
          }}
        />
      ))}

      {/* Main orb with gradient */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: "linear-gradient(145deg, hsl(var(--primary)/0.95), hsl(var(--primary)/0.75))",
          boxShadow: isActive
            ? "0 0 0 3px hsl(var(--primary)/0.25), 0 0 20px hsl(var(--primary)/0.3), 0 4px 20px rgba(0,0,0,0.25)"
            : "0 0 0 2px hsl(var(--primary)/0.2), 0 0 12px hsl(var(--primary)/0.15), 0 3px 12px rgba(0,0,0,0.2)",
        }}
      >
        {/* Gloss effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ 
            background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.25) 0%, transparent 55%)",
          }}
        />

        {/* AI Bot Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 3, -3, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Bot 
            size={28} 
            strokeWidth={1.8}
            className="text-primary-foreground"
            style={{
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);

  // Diagnostic banner - shows build version, native status, and API base
  const native = isNativeApp();
  const apiBase = getApiBase();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  const leftItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/journey", label: "رحلتي", icon: Calendar },
  ];

  const rightItems = [
    { href: "/progress", label: "تقدمي", icon: BarChart2 },
    { href: "/account", label: "حسابي", icon: User2 },
  ];

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 280);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setShowScrollTop(false); }, [location]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const zakiHref = "/zakiy";
  const isZakiActive = location === zakiHref;
  const isSos = location === "/sos";
  const isZakiy = location === "/zakiy";

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
    const isActive = location === href;
    return (
      <Link
        href={href}
        className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 tap-highlight-transparent"
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute top-0 inset-x-2 h-[3px] bg-primary rounded-b-full"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn("transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")}
        />
        <span className={cn(
          "text-[10px] font-medium transition-colors leading-none",
          isActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div
      className={cn("min-h-[100dvh] flex flex-col bg-background relative max-w-md mx-auto shadow-2xl shadow-black/5 ring-1 ring-border/50", !isSos && !isZakiy && "pb-[80px]")}
      style={{ overflowX: "clip" }}
    >
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />

      <main className="flex-1 flex flex-col relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isSos && !isZakiy && (
        <>
          {/* Help button — moved to LEFT side, raised higher to clear chat controls */}
          <div className="fixed bottom-[110px] left-4 z-50 flex flex-col items-center gap-2">
            <AnimatePresence>
              {helpOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Link
                      href="/dhikr"
                      onClick={() => setHelpOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                    >
                      <CircleDot size={16} strokeWidth={2} />
                      <span>الذكر</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: 0 }}
                  >
                    <Link
                      href="/sos"
                      onClick={() => setHelpOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-destructive text-destructive-foreground rounded-full shadow-lg shadow-destructive/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                    >
                      <ShieldAlert size={16} strokeWidth={2.5} />
                      <span>طوارئ</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setHelpOpen(v => !v)}
              className={cn(
                "p-3.5 rounded-full shadow-lg transition-all",
                helpOpen
                  ? "bg-muted text-muted-foreground shadow-black/10"
                  : "bg-card border border-border text-muted-foreground shadow-black/10 hover:text-primary hover:border-primary/40"
              )}
              title={lang === "ar" ? "مساعدة" : "Help"}
            >
              <AnimatePresence mode="wait">
                {helpOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={22} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <HelpCircle size={22} strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Backdrop */}
          <AnimatePresence>
            {helpOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHelpOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}
          </AnimatePresence>

          {/* Voice Orb Overlay */}
          <AnimatePresence>
            {voiceOpen && (
              <VoiceOrbOverlay onClose={() => setVoiceOpen(false)} />
            )}
          </AnimatePresence>

          {/* Scroll-to-top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                key="scroll-top"
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                whileTap={{ scale: 0.88 }}
                onClick={scrollToTop}
                className="fixed z-50 p-3 rounded-full bg-card border border-border shadow-lg shadow-black/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-colors"
                style={{ bottom: "96px", right: "16px" }}
                aria-label="الصعود للأعلى"
                title="الصعود للأعلى"
              >
                <ChevronUp size={20} strokeWidth={2.2} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Floating Bottom Navigation Bar */}
          <nav className="fixed bottom-3 inset-x-0 z-40 max-w-md mx-auto px-4">
            <div className="relative">
              {/* Floating glass pill */}
              <div
                className="relative rounded-[28px] overflow-hidden bg-card/88 backdrop-blur-2xl"
                style={{
                  boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)",
                  border: "1px solid hsl(var(--border)/0.6)",
                }}
              >
                {/* Subtle top shine */}
                <div
                  className="absolute top-0 inset-x-0 h-[45%] pointer-events-none rounded-t-[28px]"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)" }}
                />

                {/* Nav content */}
                <div className="relative flex items-center h-[62px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                  {leftItems.map((item) => (
                    <NavItem key={item.href} {...item} />
                  ))}

                  {/* Center Zakiy button (inline, not raised) */}
                  <Link
                    href={zakiHref}
                    className="relative flex flex-col items-center justify-center flex-none h-full tap-highlight-transparent"
                    style={{ width: "22%" }}
                    onClick={(e) => {
                      e.preventDefault();
                      setVoiceOpen(true);
                    }}
                    aria-label="زكي"
                    title="زكي"
                  >
                    <motion.div whileTap={{ scale: 0.92 }} className="relative">
                      <div className="scale-[0.88]">
                        <ZakiyNavOrb isActive={isZakiActive} />
                      </div>
                    </motion.div>
                  </Link>

                  {rightItems.map((item) => (
                    <NavItem key={item.href} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
