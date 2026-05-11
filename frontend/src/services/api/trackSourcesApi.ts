export interface TrackAsset {
  id: string;
  title: string;
  source: "local" | "youtube";
  filename: string;
  url: string;
}

const API_BASE = "http://localhost:8000";

export async function fetchTrackAssets(): Promise<TrackAsset[]> {
  const response = await fetch(`${API_BASE}/tracks`);
  if (!response.ok) throw new Error("Failed to fetch tracks.");
  return (await response.json()) as TrackAsset[];
}

export async function uploadOwnedMp3(file: File): Promise<TrackAsset> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/tracks/upload`, { method: "POST", body: form });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Upload failed.");
  }
  return (await response.json()) as TrackAsset;
}

export async function importYoutubeMp3(url: string): Promise<TrackAsset> {
  const response = await fetch(`${API_BASE}/tracks/import-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "YouTube import failed.");
  }
  return (await response.json()) as TrackAsset;
}
