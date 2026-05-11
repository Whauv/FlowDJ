import { useAppStore } from "../../state/useAppStore";

export function LibraryPanel() {
  const shortcuts = useAppStore((s) => s.shortcuts);

  return (
    <section className="panel library">
      <h3>Library</h3>
      <p>Track browser placeholder with keyboard mappings:</p>
      <div className="row">
        {shortcuts.map((shortcut) => (
          <span className="pill" key={shortcut.action}>
            {shortcut.description}: <span className="kbd">{shortcut.combo}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
