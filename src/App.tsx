import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";
import HomeView from "./features/home/HomeView";
import WorkView from "./features/work/WorkView";
import JournalView from "./features/journal/JournalView";
import MemoryView from "./features/memory/MemoryView";
import MoreView from "./features/more/MoreView";

type Theme = "light" | "dark";
type View = "home" | "work" | "journal" | "memory" | "more";

type DashboardData = {
  displayName: string;
  goals: number;
  projects: number;
  memories: number;
  latestJournal: string | null;
};

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
  const [dashboard, setDashboard] = useState<DashboardData>({
    displayName: "",
    goals: 0,
    projects: 0,
    memories: 0,
    latestJournal: null,
  });
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

    async function loadDashboard() {
      setDashboardLoading(true);
      const [profileResult, goalsResult, projectsResult, memoriesResult, journalResult] =
        await Promise.all([
          supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
          supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
          supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("journal_entries").select("content").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

      if (!active) return;

      setDashboard({
        displayName: profileResult.data?.display_name?.trim() || "there",
        goals: goalsResult.count ?? 0,
        projects: projectsResult.count ?? 0,
        memories: memoriesResult.count ?? 0,
        latestJournal: journalResult.data?.content ?? null,
      });

      setDashboardLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [session]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!authReady) {
    return (
      <main className="app-screen centered-screen">
        <div className="beacon-orb" aria-hidden="true"><span /></div>
        <p className="loading-text">Beacon is waking…</p>
      </main>
    );
  }

  if (session) {
    const firstName = dashboard.displayName.split(/\s+/)[0] || "friend";
    const activeView = views.find((item) => item.id === view) ?? views[0];

    return (
      <main className="app-screen">
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />

        <div className="app-container">
          <header className="app-header">
            <button className="app-brand" type="button" onClick={() => setView("home")} aria-label="Beacon home">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span>
                <strong>Beacon</strong>
                <small>Personal assistant</small>
              </span>
            </button>

            <div className="header-actions">
              <button
                className="icon-button"
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? "☾" : "☀"}
              </button>
              <button className="avatar-button" type="button" onClick={signOut} aria-label="Sign out">
                {firstName.charAt(0).toUpperCase()}
              </button>
            </div>
          </header>

          <section className="app-content">
            <div className="view-heading">
              <div>
                <span className="view-kicker">{activeView.label}</span>
                <h1>{activeView.label}</h1>
              </div>
              <span className="view-symbol" aria-hidden="true">{activeView.icon}</span>
            </div>

            {view === "home" && (
              <HomeView
                firstName={firstName}
                goals={dashboard.goals}
                projects={dashboard.projects}
                memories={dashboard.memories}
                dashboardLoading={dashboardLoading}
                onOpenJournal={() => setView("journal")}
              />
            )}

            {view === "work" && (
              <WorkView goals={dashboard.goals} projects={dashboard.projects} />
            )}

            {view === "journal" && (
              <JournalView latestJournal={dashboard.latestJournal} />
            )}

            {view === "memory" && (
              <MemoryView memories={dashboard.memories} />
            )}

            {view === "more" && <MoreView />}
          </section>

          <nav className="bottom-nav" aria-label="Beacon sections">
            {views.map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "nav-item active" : "nav-item"}
                type="button"
                onClick={() => setView(item.id)}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          
        </div>
      </main>
    );
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  return (
    <main className="landing">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-name">Beacon</span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <section className="landing-hero">
        <div className="hero-orb beacon-orb large" aria-hidden="true"><span /></div>
        <span className="hero-kicker">Beacon 2.0 · Personal assistant</span>
        <h1>Live with purpose.<br /><em>Think clearly. Act intentionally.</em></h1>
        <p>A personal space to think, plan, remember, and steadily improve the way you live.</p>
        <button className="primary-button" type="button" onClick={() => setShowAuth(true)}>
          Enter Beacon
        </button>
        
      </section>

      <section className="landing-principles">
        <article><span>01</span><h2>Think</h2><p>Think with clarity.</p></article>
        <article><span>02</span><h2>Plan</h2><p>Plan with intention.</p></article>
        <article><span>03</span><h2>Grow</h2><p>Grow with consistency.</p></article>
      </section>

      <footer className="site-footer">
        <span>Beacon</span>
        <span>Think · Plan · Grow</span>
      </footer>
    </main>
  );
}

export default App;
