export function LibraryPanel() {
  return (
    <section className="panel library">
      <h3>Library</h3>
      <p>Browse Mode controls are mode-aware and keyboard-first.</p>
      <p className="tiny-text">Use Up/Down for crate navigation, / for search placeholder, Q/P to load deck.</p>
      <p className="tiny-text">Recommendation panel uses this library context + current session history.</p>
    </section>
  );
}
