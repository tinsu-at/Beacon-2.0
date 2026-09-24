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
        <span className="header-note">Beacon 2.0</span>
      </header>

      <section className="hero">
        <div className="hero-badge">
          <span className="status-dot" />
          A quiet, disciplined space for personal growth
        </div>

        <p className="eyebrow">Beacon 2.0</p>
        <h1>
          Build the person you want to become.
        </h1>
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
