import type { FlowMode, KeyProfile, KeyboardAction } from "../../services/keyboard/types";
import { detectMappingConflicts } from "../../services/keyboard/KeyboardManager";

interface MappingPanelProps {
  mode: FlowMode;
  profiles: KeyProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onUpdateKey: (mode: FlowMode, action: KeyboardAction, nextCode: string, nextLabel: string) => void;
  onClose: () => void;
}

export function MappingPanel({
  mode,
  profiles,
  selectedProfileId,
  onSelectProfile,
  onUpdateKey,
  onClose
}: MappingPanelProps) {
  const selected = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
  const conflicts = detectMappingConflicts(selected);

  return (
    <section className="panel modal-panel">
      <div className="row between">
        <h3>Keyboard Mapping</h3>
        <button className="action-btn" onClick={onClose}>Close</button>
      </div>

      <div className="row">
        <label>Profile</label>
        <select value={selected.id} onChange={(event) => onSelectProfile(event.target.value)}>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}{profile.compact ? " (One-hand)" : ""}
            </option>
          ))}
        </select>
      </div>

      {conflicts.length ? (
        <p className="error-text">Conflicts detected: {conflicts.join(", ")}</p>
      ) : (
        <p className="tiny-text">No duplicate key conflicts in this profile.</p>
      )}

      <div className="mapping-list">
        {selected.mappings[mode].map((entry) => (
          <div className="mapping-row" key={`${entry.action}-${mode}`}>
            <span>{entry.description}</span>
            <input
              value={entry.code}
              onChange={(event) => onUpdateKey(mode, entry.action, event.target.value, event.target.value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
