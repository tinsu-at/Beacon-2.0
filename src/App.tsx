import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";
import { emptyDashboard, loadDashboard, type DashboardData } from "./services/dashboard";
import HomeView from "./features/home/HomeView";
import WorkView from "./features/work/WorkView";
import JournalView from "./features/journal/JournalView";
import MemoryView from "./features/memory/MemoryView";
import MoreView from "./features/more/MoreView";

type Theme = "light" | "dark";
type View = "home" | "work" | "journal" | "memory" | "more";

const views: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "work", label: "Work", icon: "◇" },
  { id: "journal", label: "Journal", icon: "✎" },
  { id: "memory", label: "Memory", icon: "✦" },
  { id: "more", label: "More", icon: "⋯" },
];

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("beacon-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<View>("home");
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.body.style.colorScheme = theme;
    localStorage.setItem("beacon-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setShowAuth(false);
      setAuthReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;

    let active = true;
    const userId = session.user.id;

    async function refreshDashboard() {
      setDashboardLoading(true);
      const data = await loadDashboard(userId);
      if (!active) return;
      setDashboard(data);
      setDashboardLoading(false);
    }
