import type { AdapterDiagnostics, AdapterKind, HardwareMode } from "../../modules/flowlight/types";

interface DeviceIntegrationPanelProps {
  mode: HardwareMode;
  diagnostics: AdapterDiagnostics[];
  onModeChange: (mode: HardwareMode) => void;
  onDiscover: (kind: AdapterKind) => void;
  onConnect: (kind: AdapterKind, deviceId?: string) => void;
  onDisconnect: (kind: AdapterKind) => void;
}

export function DeviceIntegrationPanel({ mode, diagnostics, onModeChange, onDiscover, onConnect, onDisconnect }: DeviceIntegrationPanelProps) {
  return (
    <section className="hardware-panel">
      <div className="hardware-head">
        <h3>FlowLight Rack</h3>
        <label className="tiny-text">Hardware Mode
          <select value={mode} onChange={(e) => onModeChange(e.target.value as HardwareMode)}>
            <option value="simulation">Simulation</option>
            <option value="live">Live</option>
          </select>
        </label>
      </div>
      <p className="tiny-text">Channel-strip adapters. Simulation keeps performance flow active without hardware.</p>

      {diagnostics.map((diag) => (
        <div className={`rack-strip state-${diag.state}`} key={diag.adapterId}>
          <div className="rack-strip-head">
            <p className="rack-title">{diag.kind.toUpperCase()}</p>
            <span className={`status-chip status-${diag.state}`}>{diag.state}</span>
          </div>
          <p className="tiny-text">{diag.message}</p>
          <div className="rack-controls">
            <button className="action-btn compact" onClick={() => onDiscover(diag.kind)}>Scan</button>
            <button className="action-btn compact" onClick={() => onConnect(diag.kind, diag.devices[0]?.id)} disabled={!diag.devices.length}>Arm</button>
            <button className="action-btn compact danger" onClick={() => onDisconnect(diag.kind)}>Drop</button>
          </div>
          <p className="tiny-text">Devices: {diag.devices.map((d) => `${d.label} (${d.transport})`).join(", ") || "None"}</p>
        </div>
      ))}
    </section>
  );
}
