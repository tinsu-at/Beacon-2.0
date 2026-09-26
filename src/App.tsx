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

const views: { id: View; am: string; en: string; icon: string }[] = [
  { id: "home", am: "መነሻ", en: "Home", icon: "⌂" },
  { id: "plan", am: "እቅድ", en: "Plan", icon: "◇" },
  { id: "journal", am: "ዕለታዊ", en: "Journal", icon: "✎" },
  { id: "memory", am: "ትውስታ", en: "Memory", icon: "✦" },
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
                <small>ፈለገ ብርሃን</small>
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
                <span className="view-kicker">{activeView.am}</span>
                <h1>{activeView.en}</h1>
              </div>
              <span className="view-symbol" aria-hidden="true">{activeView.icon}</span>
            </div>

            {view === "home" && (
              <div className="home-layout">
                <section className="welcome-panel glass-panel">
                  <div className="welcome-copy">
                    <span className="tiny-label">የእርስዎ ቦታ</span>
                    <h2>ሰላም, {firstName}.</h2>
                    <p>እዚህ ለማሰብ፣ ለማቀድ እና በዓላማ ለመኖር የሚረዳዎት የግል ቦታ ነው።</p>
                    <span className="english-caption">A quiet place to think, plan, and grow.</span>
                  </div>
                  <div className="beacon-orb large" aria-hidden="true"><span /></div>
                </section>

                <section className="daily-card glass-panel">
                  <div className="section-topline">
                    <span>ዛሬ</span>
                    <span className="soft-dot" />
                  </div>
                  <h2>What matters today?</h2>
                  <p>Start with one clear intention. The rest can follow.</p>
                  <button className="text-action" type="button" onClick={() => setView("journal")}>
                    ዛሬን ጻፍ <span>→</span>
                  </button>
                </section>

                <div className="stats-row">
                  <article className="mini-card">
                    <span>ግቦች</span>
                    <strong>{dashboardLoading ? "…" : dashboard.goals}</strong>
                    <small>active goals</small>
                  </article>
                  <article className="mini-card">
                    <span>ፕሮጀክቶች</span>
                    <strong>{dashboardLoading ? "…" : dashboard.projects}</strong>
                    <small>active projects</small>
                  </article>
                  <article className="mini-card">
                    <span>ትውስታ</span>
                    <strong>{dashboardLoading ? "…" : dashboard.memories}</strong>
                    <small>saved memories</small>
                  </article>
                </div>
              </div>
            )}

            {view === "plan" && (
              <div className="content-grid">
                <section className="glass-panel feature-panel">
                  <span className="panel-icon">◇</span>
                  <span className="tiny-label">አቅጣጫ</span>
                  <h2>Goals become direction.</h2>
                  <p>የሚፈልጉትን ነገር ይግለጹ፣ ከዚያም ወደ ፕሮጀክቶች እና ተግባራት ይቀይሩት።</p>
                  <div className="number-line"><strong>{dashboard.goals}</strong><span>active goals</span></div>
                </section>
                <section className="glass-panel feature-panel">
                  <span className="panel-icon">+</span>
                  <span className="tiny-label">ስራ</span>
                  <h2>Projects become action.</h2>
                  <p>Beacon will connect your bigger intentions with the things you actually do.</p>
                  <div className="number-line"><strong>{dashboard.projects}</strong><span>active projects</span></div>
                </section>
              </div>
            )}

            {view === "journal" && (
              <div className="journal-layout">
                <section className="glass-panel journal-hero">
                  <span className="tiny-label">የዛሬ ሐሳብ</span>
                  <h2>Think clearly. Remember honestly.</h2>
                  <p>ጥያቄዎችዎን፣ ሐሳቦችዎን እና የዕለቱን ትምህርት ያስቀምጡ።</p>
                </section>
                <section className="glass-panel journal-entry">
                  <div className="section-topline">
                    <span>Latest entry</span>
                    <span>የቅርብ ጊዜ</span>
                  </div>
                  <p className={dashboard.latestJournal ? "entry-text" : "muted"}>
                    {dashboard.latestJournal ?? "No journal entries yet."}
                  </p>
                </section>
              </div>
            )}

            {view === "memory" && (
              <div className="content-grid single">
                <section className="glass-panel memory-panel">
                  <div className="memory-glow" aria-hidden="true" />
                  <span className="panel-icon">✦</span>
                  <span className="tiny-label">ትውስታ</span>
                  <h2>What should Beacon remember?</h2>
                  <p>Memory will be explicit, private, and under your control. Important context should help Beacon understand you—not quietly collect everything.</p>
                  <div className="memory-count"><strong>{dashboard.memories}</strong><span>saved memories</span></div>
                </section>
              </div>
            )}
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
                <span className="nav-am">{item.am}</span>
                <span className="nav-en">{item.en}</span>
              </button>
            ))}
          </nav>

          <footer className="language-footer">
            <span>ቤኮን</span>
            <span className="language-line">English · እንግሊዝኛ</span>
          </footer>
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
        <span className="hero-kicker">ፈለገ ብርሃን · Beacon 2.0</span>
        <h1>በዓላማ ኑር።<br /><em>Live with purpose.</em></h1>
        <p>የግል ሕይወትዎን ለማሰብ፣ ለማቀድ እና ለማሻሻል የተሰራ የግል ረዳት።</p>
        <button className="primary-button" type="button" onClick={() => setShowAuth(true)}>
          ወደ Beacon ይግቡ
        </button>
        <span className="english-caption">Enter Beacon</span>
      </section>

      <section className="landing-principles">
        <article><span>01</span><h2>አስብ</h2><p>Think with clarity.</p></article>
        <article><span>02</span><h2>አቅድ</h2><p>Plan with intention.</p></article>
        <article><span>03</span><h2>እደግ</h2><p>Grow with consistency.</p></article>
      </section>

      <footer className="site-footer">
        <span>ቤኮን · Beacon</span>
        <span>English · እንግሊዝኛ</span>
      </footer>
    </main>
  );
}

export default App;
