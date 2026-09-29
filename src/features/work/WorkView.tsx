type WorkViewProps = { goals: number; projects: number };

export default function WorkView({ goals, projects }: WorkViewProps) {
  return (
    <div className="content-grid">
      <section className="glass-panel feature-panel">
        <span className="panel-icon">◇</span>
        <span className="tiny-label">Direction</span>
        <h2>Goals become direction.</h2>
        <p>Define what you want, then turn it into projects and practical next steps.</p>
        <div className="number-line"><strong>{goals}</strong><span>active goals</span></div>
      </section>
      <section className="glass-panel feature-panel">
        <span className="panel-icon">+</span>
        <span className="tiny-label">Work</span>
        <h2>Projects become action.</h2>
        <p>Beacon will connect your bigger intentions with the things you actually do.</p>
        <div className="number-line"><strong>{projects}</strong><span>active projects</span></div>
      </section>
    </div>
  );
}
