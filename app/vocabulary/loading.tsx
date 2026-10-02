export default function VocabularyLoading() {
  return (
    <div className="vocabulary-page">
      <nav className="site-nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-orb">
              <span className="logo-spark"></span>
            </span>
            <span className="logo-text">
              HSK <strong>Systems</strong>
            </span>
          </a>
        </div>
      </nav>

      <main className="vocabulary-main">
        <header className="vocabulary-header">
          <div className="vocabulary-header-content">
            <div className="animate-pulse bg-gray-200 h-10 w-48 rounded" style={{ margin: "0 auto", marginBottom: "0.5rem" }} aria-hidden="true" />
            <div className="animate-pulse bg-gray-200 h-5 w-64 rounded" style={{ margin: "0 auto" }} aria-hidden="true" />
          </div>
        </header>

        <section className="vocabulary-level-overview">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="vocabulary-level-choice" style={{ cursor: "default", border: "none", background: "var(--surface)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <span className="vocabulary-level-orb animate-pulse" style={{ background: "#e2e8f0" }} aria-hidden="true" />
              <span className="vocabulary-level-main" style={{ gap: "8px" }}>
                <span className="animate-pulse" style={{ display: "block", height: "12px", width: "60px", background: "#e2e8f0", borderRadius: "4px" }} />
                <span className="animate-pulse" style={{ display: "block", height: "20px", width: "100px", background: "#e2e8f0", borderRadius: "4px" }} />
                <span className="animate-pulse" style={{ display: "block", height: "14px", width: "140px", background: "#e2e8f0", borderRadius: "4px" }} />
              </span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
