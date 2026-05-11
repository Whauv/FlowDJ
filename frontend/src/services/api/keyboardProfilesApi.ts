import type { KeyboardProfilesPayload } from "../keyboard/types";

const API_BASE = "http://localhost:8000";

export async function fetchKeyboardProfiles(): Promise<KeyboardProfilesPayload | null> {
  try {
    const response = await fetch(`${API_BASE}/keyboard-profiles`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as KeyboardProfilesPayload;
  } catch {
    return null;
  }
}

export async function saveKeyboardProfiles(payload: KeyboardProfilesPayload): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/keyboard-profiles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch {
    return false;
  }
}
