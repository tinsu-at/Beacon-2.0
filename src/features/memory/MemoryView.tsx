type MemoryViewProps = { memories: number };

export default function MemoryView({ memories }: MemoryViewProps) {
  return (
    <div className="content-grid single">
      <section className="glass-panel memory-panel">
        <div className="memory-glow" aria-hidden="true" />
        <span className="panel-icon">✦</span>
        <span className="tiny-label">Memory</span>
        <h2>What should Beacon remember?</h2>
        <p>Memory will be explicit, private, and under your control. Important context should help Beacon understand you—not quietly collect everything.</p>
        <div className="memory-count"><strong>{memories}</strong><span>saved memories</span></div>
      </section>
    </div>
  );
}
