import { useEffect, useState } from "react";

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("beacon-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  return (
    <main className="landing">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
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

        <div className="feature-grid" aria-label="Beacon foundation">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon" aria-hidden="true">
                <span />
              </div>
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
