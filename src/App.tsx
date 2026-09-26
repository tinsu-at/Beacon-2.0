import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";

type Theme = "light" | "dark";
type View = "home" | "plan" | "journal" | "memory";

type DashboardData = {
  displayName: string;
  goals: number;
  projects: number;
  memories: number;
  latestJournal: string | null;
};

const views: { id: View; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "plan", label: "Plan" },
  { id: "journal", label: "Journal" },
  { id: "memory", label: "Memory" },
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
      <main className="app-shell">
        <section className="auth-card">
          <p className="muted">Loading Beacon…</p>
        </section>
      </main>
    );
  }

  if (session) {
    const firstName = dashboard.displayName.split(/\s+/)[0] || "there";

    return (
      <main className="app-shell">
        <div style={{ width: "min(960px, calc(100% - 24px))", margin: "0 auto" }}>
          <header className="site-header" style={{ width: "100%", padding: "16px 0" }}>
            <div className="brand">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span className="brand-name">Beacon</span>
            </div>

            <div className="header-actions">
              <button
                className="theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
              </button>
              <button className="back-button" type="button" onClick={signOut}>Sign out</button>
            </div>
          </header>

          <nav
            aria-label="Beacon sections"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              margin: "12px 0 24px",
            }}
          >
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                style={{
                  minHeight: 42,
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  background: view === item.id ? "var(--primary)" : "var(--card)",
                  color: view === item.id ? "white" : "var(--foreground)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section
            className="auth-card"
            style={{
              width: "100%",
              margin: 0,
              padding: "28px",
            }}
          >
            {view === "home" && (
              <>
                <p className="eyebrow" style={{ marginTop: 0 }}>Your command center</p>
                <h1 style={{ marginBottom: 8 }}>Good to see you, {firstName}.</h1>
                <p className="muted">
                  Beacon is being built as a personal operating system first, and an AI assistant second.
                  Your goals, actions, reflection, and memory will give the AI useful context later.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                    marginTop: 24,
                  }}
                >
                  {[
                    ["Goals", dashboard.goals],
                    ["Projects", dashboard.projects],
                    ["Memories", dashboard.memories],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: 18,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "color-mix(in oklab, var(--card) 88%, transparent)",
                      }}
                    >
                      <div className="muted" style={{ fontSize: ".78rem" }}>{label}</div>
                      <strong style={{ display: "block", marginTop: 4, fontSize: "1.7rem" }}>
                        {dashboardLoading ? "…" : value}
                      </strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: 20,
                    borderRadius: 20,
                    background: "color-mix(in oklab, var(--accent-cyan) 35%, var(--card))",
                  }}
                >
                  <p className="eyebrow" style={{ margin: 0 }}>Next layer</p>
                  <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                    Tasks and habits will connect your plans to what you actually do each day.
                  </p>
                </div>
              </>
            )}

            {view === "plan" && (
              <>
                <p className="eyebrow" style={{ marginTop: 0 }}>Plan</p>
                <h1>Goals → Projects → Actions</h1>
                <p className="muted">
                  This is where Beacon will turn long-term intentions into concrete work.
                  The existing goals and projects database is already protected per user.
                </p>
                <div className="feature-grid" style={{ marginTop: 24 }}>
                  <article className="feature-card">
                    <h2>{dashboard.goals} active goals</h2>
                    <p>Define what matters and give it a direction.</p>
                  </article>
                  <article className="feature-card">
                    <h2>{dashboard.projects} active projects</h2>
                    <p>Break important goals into meaningful areas of work.</p>
                  </article>
                  <article className="feature-card">
                    <h2>Tasks next</h2>
                    <p>We'll add the action layer before connecting AI automation.</p>
                  </article>
                </div>
              </>
            )}

            {view === "journal" && (
              <>
                <p className="eyebrow" style={{ marginTop: 0 }}>Journal</p>
                <h1>Think clearly. Remember honestly.</h1>
                <p className="muted">
                  Your journal will eventually become one of Beacon's most useful sources of personal context.
                </p>
                <div
                  style={{
                    marginTop: 24,
                    padding: 20,
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    background: "var(--input-background)",
                  }}
                >
                  <strong>Latest entry</strong>
                  <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                    {dashboard.latestJournal ?? "No journal entries yet."}
                  </p>
                </div>
              </>
            )}

            {view === "memory" && (
              <>
                <p className="eyebrow" style={{ marginTop: 0 }}>Memory</p>
                <h1>What should Beacon remember?</h1>
                <p className="muted">
                  Memory will be explicit, user-controlled, and private. Beacon should never silently
                  turn every conversation into permanent memory.
                </p>
                <div
                  style={{
                    marginTop: 24,
                    padding: 20,
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                  }}
                >
                  <strong>{dashboard.memories} saved memories</strong>
                  <p className="muted">
                    Later you'll be able to review, edit, approve, or delete individual memories.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  const features = [
    { title: "Goals", body: "Turn what matters to you into clear, deliberate goals." },
    { title: "Journal", body: "Reflect honestly, notice patterns, and learn from your days." },
    { title: "Memory", body: "Keep the important things Beacon should remember about you." },
  ];

  return (
    <main className="landing">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-name">Beacon</span>
        </div>

        <div className="header-actions">
          <span className="header-note">Beacon 2.0</span>
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-badge">
          <span className="status-dot" />
          A quiet, disciplined space for personal growth
        </div>

        <p className="eyebrow">Beacon 2.0</p>
        <h1>Build the person you want to become.</h1>
        <p className="hero-copy">
          Goals, reflection, memory, retrieval, and AI guidance will be added
          in deliberate layers—without losing the calm, focused Beacon feeling.
        </p>

        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => setShowAuth(true)}>
            Enter Beacon
          </button>
          <span className="hero-note">Start with your own private account.</span>
        </div>

        <div className="feature-grid" aria-label="Beacon foundation">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon" aria-hidden="true"><span /></div>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>Beacon</span>
        <span>Lead by example.</span>
      </footer>
    </main>
  );
}

export default App;
