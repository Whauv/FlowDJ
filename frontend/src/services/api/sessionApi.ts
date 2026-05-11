import type { SessionAnalyticsPayload, SessionTimelinePoint, SessionTransitionEvent } from "../../modules/analytics/types";

const API_BASE = "http://localhost:8000";

export async function startSession(startedAtIso: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ started_at_iso: startedAtIso })
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { id: string };
    return data.id;
  } catch {
    return null;
  }
}

export async function appendSession(
  id: string,
  timeline: SessionTimelinePoint[],
  transitions: SessionTransitionEvent[]
): Promise<void> {
  try {
    await fetch(`${API_BASE}/sessions/append`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, timeline, transitions })
    });
  } catch {
    return;
  }
}

export async function finalizeSession(id: string, endedAtIso: string): Promise<SessionAnalyticsPayload | null> {
  try {
    const response = await fetch(`${API_BASE}/sessions/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ended_at_iso: endedAtIso })
    });
    if (!response.ok) return null;
    return (await response.json()) as SessionAnalyticsPayload;
  } catch {
    return null;
  }
}

export function exportSessionJson(payload: SessionAnalyticsPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSessionCsv(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/export/csv`);
  if (!response.ok) return;
  const text = await response.text();
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sessionId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
