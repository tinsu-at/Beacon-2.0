type JournalViewProps = { latestJournal: string | null };

export default function JournalView({ latestJournal }: JournalViewProps) {
  return (
    <div className="journal-layout">
      <section className="glass-panel journal-hero">
        <span className="tiny-label">Today’s thought</span>
        <h2>Think clearly. Remember honestly.</h2>
        <p>Capture your questions, thoughts, lessons, and moments from the day.</p>
      </section>
      <section className="glass-panel journal-entry">
        <div className="section-topline">
          <span>Latest entry</span>
          <span>Most recent</span>
        </div>
        <p className={latestJournal ? "entry-text" : "muted"}>
          {latestJournal ?? "No journal entries yet."}
        </p>
      </section>
    </div>
  );
}
