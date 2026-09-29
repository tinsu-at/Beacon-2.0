type HomeViewProps = {
  firstName: string;
  goals: number;
  projects: number;
  memories: number;
  dashboardLoading: boolean;
  onOpenJournal: () => void;
};

export default function HomeView({ firstName, goals, projects, memories, dashboardLoading, onOpenJournal }: HomeViewProps) {
  return (
    <div className="home-layout">
      <section className="welcome-panel glass-panel">
        <div className="welcome-copy">
          <span className="tiny-label">Your space</span>
          <h2>Hello, {firstName}.</h2>
          <p>A quiet place to think, plan, and grow with intention.</p>
        </div>
        <div className="beacon-orb large" aria-hidden="true"><span /></div>
      </section>

      <section className="daily-card glass-panel">
        <div className="section-topline">
          <span>Today</span>
          <span className="soft-dot" />
        </div>
        <h2>What matters today?</h2>
        <p>Start with one clear intention. The rest can follow.</p>
        <button className="text-action" type="button" onClick={onOpenJournal}>
          Open journal <span>→</span>
        </button>
      </section>

      <div className="stats-row">
        <article className="mini-card">
          <span>Goals</span>
          <strong>{dashboardLoading ? "…" : goals}</strong>
          <small>active goals</small>
        </article>
        <article className="mini-card">
          <span>Projects</span>
          <strong>{dashboardLoading ? "…" : projects}</strong>
          <small>active projects</small>
        </article>
        <article className="mini-card">
          <span>Memory</span>
          <strong>{dashboardLoading ? "…" : memories}</strong>
          <small>saved memories</small>
        </article>
      </div>
    </div>
  );
}
