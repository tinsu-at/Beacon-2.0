export default function MoreView() {
  return (
    <div className="content-grid">
      <section className="glass-panel feature-panel">
        <span className="panel-icon">◈</span>
        <span className="tiny-label">AI & Knowledge</span>
        <h2>Give Beacon more context.</h2>
        <p>Documents, collections, RAG, and web search will live here as Beacon's knowledge layer grows.</p>
        <div className="number-line"><strong>→</strong><span>Knowledge center</span></div>
      </section>
      <section className="glass-panel feature-panel">
        <span className="panel-icon">⚙</span>
        <span className="tiny-label">Assistant</span>
        <h2>Control how Beacon helps.</h2>
        <p>Voice, notifications, reminders, permissions, and settings will become part of this area.</p>
        <div className="number-line"><strong>→</strong><span>Assistant settings</span></div>
      </section>
    </div>
  );
}
