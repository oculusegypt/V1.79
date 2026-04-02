import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/admin-api";

import AdminLogin from "./index";
import OverviewPage from "./overview";
import UsersPage from "./users";
import HabitsPage from "./habits";
import DhikrPage from "./dhikr";
import JournalPage from "./journal";
import KaffarahPage from "./kaffarah";
import ZakiyPage from "./zakiy";
import HadiTasksPage from "./hadi-tasks";
import Journey30Page from "./journey30";
import DuasPage from "./duas";
import ChallengesPage from "./challenges";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthenticated()) navigate("/admin");
  }, [navigate]);
  if (!isAuthenticated()) return null;
  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <Switch>
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/overview">
        <AuthGuard><OverviewPage /></AuthGuard>
      </Route>
      <Route path="/admin/users">
        <AuthGuard><UsersPage /></AuthGuard>
      </Route>
      <Route path="/admin/habits">
        <AuthGuard><HabitsPage /></AuthGuard>
      </Route>
      <Route path="/admin/dhikr">
        <AuthGuard><DhikrPage /></AuthGuard>
      </Route>
      <Route path="/admin/journal">
        <AuthGuard><JournalPage /></AuthGuard>
      </Route>
      <Route path="/admin/kaffarah">
        <AuthGuard><KaffarahPage /></AuthGuard>
      </Route>
      <Route path="/admin/zakiy">
        <AuthGuard><ZakiyPage /></AuthGuard>
      </Route>
      <Route path="/admin/hadi-tasks">
        <AuthGuard><HadiTasksPage /></AuthGuard>
      </Route>
      <Route path="/admin/journey30">
        <AuthGuard><Journey30Page /></AuthGuard>
      </Route>
      <Route path="/admin/duas">
        <AuthGuard><DuasPage /></AuthGuard>
      </Route>
      <Route path="/admin/challenges">
        <AuthGuard><ChallengesPage /></AuthGuard>
      </Route>
    </Switch>
  );
}
