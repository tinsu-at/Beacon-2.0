import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";

type Theme = "light" | "dark";

function App() {
  const features = [
    {
      title: "Goals",
      body: "Turn what matters to you into clear, deliberate goals.",
    },
    {
      title: "Journal",
      body: "Reflect honestly, notice patterns, and learn from your days.",
    },
    {
      title: "Memory",
      body: "Keep the important things Beacon should remember about you.",
    },
  ];

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("beacon-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!authReady) {
    return <main className="app-shell"><section className="auth-card"><p className="muted">Loading Beacon…</p></section></main>;
  }

  if (session) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <div className="site-header" style={{ width: "100%", padding: 0 }}>
            <div className="brand">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span className="brand-name">Beacon</span>
            </div>
            <button className="theme-toggle" type="button" onClick={toggleTheme}>
              <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            </button>
          </div>
          <p className="eyebrow">Your space</p>
          <h1>Welcome to Beacon.</h1>
          <p className="muted">Your account is connected. Goals, Journal, Memory, and the rest of the Beacon workspace will be built here step by step.</p>
          <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
        </section>
      </main>
    );
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

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
