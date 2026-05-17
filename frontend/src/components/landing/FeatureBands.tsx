import { useMemo, useState } from "react";
import type { DeckId } from "../../state/types";
import type { TrackAsset } from "../../services/api/trackSourcesApi";

interface LibraryPanelProps {
  tracks: TrackAsset[];
  busy: boolean;
  error: string | null;
  onUploadMp3: (file: File | null) => void;
  onImportYoutube: (url: string) => void;
  onLoadToDeck: (track: TrackAsset, deckId: DeckId) => void;
}

export function LibraryPanel({ tracks, busy, error, onUploadMp3, onImportYoutube, onLoadToDeck }: LibraryPanelProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const hasTracks = tracks.length > 0;
  const statusLabel = useMemo(() => (busy ? "Working..." : "Ready"), [busy]);

  return (
    <section className="panel library">
      <h3>Library</h3>
      <p>Source tracks from your local MP3 files or YouTube import (stored as MP3 on backend).</p>
      <div className="row">
        <label className="action-btn file-btn">
          Upload Owned MP3
          <input
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={(event) => {
              onUploadMp3(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <div className="row">
        <input
          type="url"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
        <button className="action-btn" onClick={() => onImportYoutube(youtubeUrl)} disabled={busy || youtubeUrl.trim().length < 8}>
          Import YouTube as MP3
        </button>
      </div>
      <p className="tiny-text">Status: {statusLabel}</p>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="library-list">
        {!hasTracks ? <p className="tiny-text">No tracks in library yet.</p> : null}
        {tracks.map((track) => (
          <div className="library-item" key={track.id}>
            <div>
              <strong>{track.title}</strong>
              <p className="tiny-text">{track.source.toUpperCase()} | {track.filename}</p>
            </div>
            <div className="row">
              <button className="action-btn" onClick={() => onLoadToDeck(track, "A")}>Load A</button>
              <button className="action-btn" onClick={() => onLoadToDeck(track, "B")}>Load B</button>
            </div>
          </div>
        ))}
      </div>
      <p className="tiny-text">Use Up/Down for crate navigation, / for search placeholder, Q/P to load deck.</p>
      <p className="tiny-text">Critical controls remain keyboard-first in Mix/FX/Recovery modes.</p>
    </section>
  );
}
