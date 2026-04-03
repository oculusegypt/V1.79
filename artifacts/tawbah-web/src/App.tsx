import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider, useSettings, ACCENT_OPTIONS } from "@/context/SettingsContext";
import { NotificationsProvider, useNotifications } from "@/context/NotificationsContext";
import { AppNotificationsProvider } from "@/context/AppNotificationsContext";
import { AuthProvider } from "@/context/AuthContext";
import { ZakiyModeProvider } from "@/context/ZakiyModeContext";
import { DuaPeakModal } from "@/components/DuaPeakModal";
import { AdhkarModal } from "@/components/AdhkarModal";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { isNativeApp } from "@/lib/api-base";

import { Layout } from "@/components/layout";
import AdminApp from "@/pages/admin/AdminApp";
import Home from "@/pages/home";
import Covenant from "@/pages/covenant";
import DayOne from "@/pages/day-one";

import Dhikr from "@/pages/dhikr";
import Sos from "@/pages/sos";
import Signs from "@/pages/signs";
import Relapse from "@/pages/relapse";
import Kaffarah from "@/pages/kaffarah";
import Rajaa from "@/pages/rajaa";
import RajaaLibrary from "@/pages/raja-libr";
import Zakiy from "@/pages/zakiy";
import Journal from "@/pages/journal";
import ProgressChart from "@/pages/progress-chart";
import DangerTimes from "@/pages/danger-times";
import HadiTasks from "@/pages/hadi-tasks";
import TawbahCard from "@/pages/tawbah-card";
import ChallengeCreate from "@/pages/challenge-create";
import ChallengeView from "@/pages/challenge-view";
import TawbahMap from "@/pages/tawbah-map";
import Journey30 from "@/pages/journey30";
import DhikrRooms from "@/pages/dhikr-rooms";
import SecretDua from "@/pages/secret-dua";
import PrayerTimes from "@/pages/prayer-times";
import CommunityDuas from "@/pages/community-duas";
import Account from "@/pages/account";
import SinsList from "@/pages/sins-list";
import EidPage from "@/pages/eid";
import NotificationsPage from "@/pages/notifications";
import InboxPage from "@/pages/inbox";
import DuaTiming from "@/pages/dua-timing";
import HabitsPage from "@/pages/habits";
import IslamicPrograms from "@/pages/islamic-programs";
import ProgramDetail from "@/pages/program-detail";
import Garden from "@/pages/garden";
import Munajat from "@/pages/munajat";
import Adhkar from "@/pages/adhkar";
import QuranPage from "@/pages/quran";
import QuranReadPage from "@/pages/quran/read";
import QuranListenPage from "@/pages/quran/listen";
import QuranMemorizePage from "@/pages/quran/memorize";
import QuranTafsirPage from "@/pages/quran/tafsir";
import QuranKhatmaPage from "@/pages/quran/khatma";
import QuranChallengesPage from "@/pages/quran/challenges";
import QuranMapPage from "@/pages/quran/map";
import QuranAiPage from "@/pages/quran/ai";
import QuranCardsPage from "@/pages/quran/cards";
import QuranMiraclesPage from "@/pages/quran/miracles";
import QuranKhatmatPage from "@/pages/quran/khatmat";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={LoginPage} />
        <Route path="/covenant" component={Covenant} />
        <Route path="/day-one" component={DayOne} />
        <Route path="/plan" component={HabitsPage} />
        <Route path="/habits" component={HabitsPage} />
        <Route path="/dhikr" component={Dhikr} />
        <Route path="/sos" component={Sos} />
        <Route path="/signs" component={Signs} />
        <Route path="/relapse" component={Relapse} />
        <Route path="/kaffarah" component={Kaffarah} />
        <Route path="/rajaa" component={Rajaa} />
        <Route path="/raja-libr" component={RajaaLibrary} />
        <Route path="/zakiy" component={Zakiy} />
        <Route path="/journal" component={Journal} />
        <Route path="/progress" component={ProgressChart} />
        <Route path="/danger-times" component={DangerTimes} />
        <Route path="/hadi-tasks" component={HadiTasks} />
        <Route path="/card" component={TawbahCard} />
        <Route path="/challenge/create" component={ChallengeCreate} />
        <Route path="/challenge/:slug" component={ChallengeView} />
        <Route path="/map" component={TawbahMap} />
        <Route path="/journey" component={Journey30} />
        <Route path="/dhikr-rooms" component={DhikrRooms} />
        <Route path="/secret-dua" component={SecretDua} />
        <Route path="/prayer-times" component={PrayerTimes} />
        <Route path="/ameen" component={CommunityDuas} />
        <Route path="/account" component={Account} />
        <Route path="/sins" component={SinsList} />
        <Route path="/eid" component={EidPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/inbox" component={InboxPage} />
        <Route path="/dua-timing" component={DuaTiming} />
        <Route path="/islamic-programs" component={IslamicPrograms} />
        <Route path="/islamic-programs/:id" component={ProgramDetail} />
        <Route path="/garden" component={Garden} />
        <Route path="/munajat" component={Munajat} />
        <Route path="/adhkar" component={Adhkar} />
        <Route path="/quran/read" component={QuranReadPage} />
        <Route path="/quran/listen" component={QuranListenPage} />
        <Route path="/quran/memorize" component={QuranMemorizePage} />
        <Route path="/quran/tafsir" component={QuranTafsirPage} />
        <Route path="/quran/khatma" component={QuranKhatmaPage} />
        <Route path="/quran/challenges" component={QuranChallengesPage} />
        <Route path="/quran/map" component={QuranMapPage} />
        <Route path="/quran/ai" component={QuranAiPage} />
        <Route path="/quran/cards" component={QuranCardsPage} />
        <Route path="/quran/miracles" component={QuranMiraclesPage} />
        <Route path="/quran/khatmat" component={QuranKhatmatPage} />
        <Route path="/quran" component={QuranPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function NativeBackButtonBridge() {
  const [location] = useLocation();

  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) => {
      const handler = () => {
        if (window.history.length > 1 && location !== "/") {
          window.history.back();
          return;
        }
        App.exitApp();
      };
      const listener = App.addListener("backButton", handler);
      remove = () => listener.remove();
    }).catch(() => {});
    return () => {
      try { remove?.(); } catch {}
    };
  }, [location]);

  return null;
}

function NativePullToRefreshBridge() {
  const queryClient = useQueryClient();
  const [pulling, setPulling] = useState(false);
  const [dy, setDy] = useState(0);
  const dyRef = useRef(0);

  useEffect(() => {
    if (!isNativeApp()) return;
    let startY = 0;
    let active = false;
    let triggered = false;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      if (!e.touches || e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      active = true;
      triggered = false;
      setPulling(true);
      setDy(0);
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const y = e.touches?.[0]?.clientY ?? 0;
      const delta = Math.max(0, y - startY);
      const capped = Math.min(140, delta);
      dyRef.current = capped;
      setDy(capped);
      if (capped > 30) e.preventDefault();
    };

    const onEnd = async () => {
      if (!active) return;
      active = false;
      const finalDy = dyRef.current;
      setPulling(false);
      setDy(0);
      dyRef.current = 0;

      if (!triggered && finalDy >= 90) {
        triggered = true;
        try {
          const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {}
        try {
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries();
        } catch {}
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [queryClient]);

  if (!isNativeApp() || (!pulling && dy <= 0)) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(${dy}px)`,
          transition: pulling ? "none" : "transform 180ms ease-out",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "hsl(var(--muted-foreground))",
          fontSize: 12,
        }}
      >
        سحب للتحديث
      </div>
    </div>
  );
}

function AuthCacheIsolationBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isNativeApp()) return;
    queryClient.clear();
  }, [queryClient, userId]);

  return null;
}

function DuaPeakModalBridge() {
  const { duaPeakVisible, hideDuaPeak } = useNotifications();
  return <DuaPeakModal visible={duaPeakVisible} onClose={hideDuaPeak} />;
}

function AdhkarModalBridge() {
  const { adhkarVisible, adhkarType, hideAdhkar } = useNotifications();
  return <AdhkarModal visible={adhkarVisible} type={adhkarType} onClose={hideAdhkar} />;
}

function StatusBarBridge() {
  const { theme, accentColor } = useSettings();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setReady(true), 100);
  }, []);

  useEffect(() => {
    if (!ready || !theme) return;
    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      // Capacitor: Style.Dark = dark icons (for light background), Style.Light = light icons (for dark background)
      StatusBar.setStyle({ style: theme === "dark" ? Style.Light : Style.Dark }).catch(() => {});
      // Avoid drawing under the status bar (prevents icon contrast issues and layout overlap)
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

      // Get accent color based on theme (light/dark mode)
      const opt = ACCENT_OPTIONS.find(o => o.id === accentColor);
      const accentColorValue = theme === "dark" 
        ? (opt?.darkPrimary ?? "#10551b") 
        : (opt?.lightPrimary ?? "#174d2b");
      
      StatusBar.setBackgroundColor({ color: accentColorValue }).catch(() => {});

      // Android navigation bar (requires native plugin registered in MainActivity)
      try {
        const anyWindow = window as unknown as Record<string, unknown>;
        const plugins = (anyWindow.Capacitor as Record<string, unknown> | undefined)?.Plugins as Record<string, unknown> | undefined;
        const systemBars = plugins?.SystemBars as { setNavigationBarColor?: (opts: { color: string; darkIcons?: boolean }) => Promise<void> } | undefined;
        systemBars?.setNavigationBarColor?.({
          color: accentColorValue,
          darkIcons: theme !== "dark",
        }).catch(() => {});
      } catch {}
    }).catch(() => {});
  }, [theme, accentColor, ready]);

  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <StatusBarBridge />
      <AuthProvider>
        <NotificationsProvider>
          <AppNotificationsProvider>
            <QueryClientProvider client={queryClient}>
              <NativeBackButtonBridge />
              <NativePullToRefreshBridge />
              <AuthCacheIsolationBridge />
              <ZakiyModeProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <DuaPeakModalBridge />
                  <AdhkarModalBridge />
                  <Toaster />
                </TooltipProvider>
              </ZakiyModeProvider>
            </QueryClientProvider>
          </AppNotificationsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
