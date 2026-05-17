import { useEffect, useMemo, useRef, useState } from "react";

const GITHUB_URL = "https://github.com/Whauv/FlowDJ";
const REPO_FRONTEND = `${GITHUB_URL}/tree/main/frontend/src`;
const REPO_BACKEND = `${GITHUB_URL}/tree/main/backend/app`;
const REPO_FLOWLIGHT = `${GITHUB_URL}/tree/main/frontend/src/modules/flowlight`;
const REPO_TESTS = `${GITHUB_URL}/tree/main/frontend/tests/visual`;

interface LandingTelemetry {
  mode: string;
  activeDeck: "A" | "B";
  crossfader: number;
  deckA: { bpm: number; progress: number; playing: boolean };
  deckB: { bpm: number; progress: number; playing: boolean };
  flowLightScene: string;
  analyticsState: string;
  activeTrack: string;
}

const fallbackTelemetry: LandingTelemetry = {
  mode: "mix",
  activeDeck: "A",
  crossfader: 0.48,
  deckA: { bpm: 124, progress: 0.64, playing: true },
  deckB: { bpm: 126, progress: 0.38, playing: true },
  flowLightScene: "Buildup Focus",
  analyticsState: "Live session",
  activeTrack: "No track loaded"
};

const features = [
  {
    label: "CONTROL",
    title: "Keyboard-First Deck Control",
    body: "Every critical live action has a key path: deck focus, play/pause, cue, loop, gain, crossfader nudges, and recovery triggers."
  },
  {
    label: "LIGHTING",
    title: "FlowLight Engine",
    body: "Lighting scenes are generated from real DJ state: BPM, beat phase, phrase section, crossfader position, active deck, and energy."
  },
  {
    label: "ANALYTICS",
    title: "Session Intelligence",
    body: "Post-mix analytics tracks transition quality, overlap behavior, mismatch risk, and recovery usage to help DJs improve over time."
  },
  {
    label: "SOURCE",
    title: "Track Source Flexibility",
    body: "Supports user-owned MP3 uploads and YouTube import-to-MP3 workflows through backend track-source APIs."
  }
];

const workflowSteps = [
  {
    name: "Ingest",
    detail: "Tracks enter the library from local MP3 upload or YouTube import-to-MP3. Metadata and source state are tracked by FastAPI."
  },
  {
    name: "Perform",
    detail: "The browser audio engine powers dual-deck playback while mode-aware keyboard actions drive transport, cue, loop, and mixing moves."
  },
  {
    name: "Sync Light",
    detail: "FlowLight listens to the DJ event bus and updates virtual fixtures and adapter outputs through a provider architecture."
  },
  {
    name: "Analyze",
    detail: "Session APIs store timeline and transition events, then compute transparent scoring and improvement suggestions."
  }
];

const runCommands = [
  "git clone https://github.com/Whauv/FlowDJ.git",
  "cd FlowDJ/backend",
  "python -m venv .venv",
  ".\\.venv\\Scripts\\Activate.ps1",
  "pip install -e .",
  "uvicorn app.main:app --reload --port 8000",
  "cd ../frontend",
  "npm install",
  "npm run dev"
];

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function parseTelemetry(raw: string | null): LandingTelemetry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LandingTelemetry;
    if (!parsed.deckA || !parsed.deckB) return null;
    return {
      ...parsed,
      crossfader: clamp(parsed.crossfader ?? 0.5),
      deckA: { ...parsed.deckA, progress: clamp(parsed.deckA.progress ?? 0) },
      deckB: { ...parsed.deckB, progress: clamp(parsed.deckB.progress ?? 0) }
    };
  } catch {
    return null;
  }
}

export function LandingPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [telemetry, setTelemetry] = useState<LandingTelemetry>(fallbackTelemetry);
  const [heroScrub, setHeroScrub] = useState(0.5);
  const [accentMode, setAccentMode] = useState<"control" | "lighting" | "analytics" | "source">("control");
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const mainWebsiteUrl = useMemo(() => `${window.location.origin}/console`, []);
  const sectionsRef = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const refresh = () => {
      const parsed = parseTelemetry(window.localStorage.getItem("flowdj_landing_telemetry"));
      if (parsed) setTelemetry(parsed);
    };
    refresh();
    const handle = window.setInterval(refresh, 1200);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = { ...prev };
          entries.forEach((entry) => {
            const id = entry.target.getAttribute("data-reveal-id");
            if (id && entry.isIntersecting) next[id] = true;
          });
          return next;
        });
      },
      { threshold: 0.18 }
    );
    sectionsRef.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const activeFeature = features[Math.floor(heroScrub * 3.99)] ?? features[0];

  return (
    <div className="landing-shell" data-accent={accentMode}>
      <header className="hero reveal-visible">
        <div className="hero-copy">
          <p className="eyebrow">FlowDJ / Project Showcase</p>
          <h1>A laptop-native DJ + lighting performance system built for real keyboard mixing.</h1>
          <p className="lead">
            FlowDJ combines two-deck DJ control, transition assistance, recommendation systems, and a synchronized lighting engine in one focused workflow.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={mainWebsiteUrl} target="_blank" rel="noopener noreferrer">Open Main Website</a>
            <a className="btn btn-secondary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">View GitHub</a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Live performance cockpit preview">
          <div className="cockpit">
            <div className="hud-strip">
              <span>MODE {telemetry.mode.toUpperCase()}</span>
              <span>ACTIVE DECK {telemetry.activeDeck}</span>
              <span>FLOWLIGHT {telemetry.flowLightScene.toUpperCase()}</span>
              <span>{telemetry.analyticsState.toUpperCase()}</span>
            </div>
            <div className="deck-lane lane-a">
              <div className="lane-head">
                <strong>DECK A</strong>
                <span>BPM {Math.round(telemetry.deckA.bpm || 0)}</span>
              </div>
              <div className="phrase-grid">
                <div className="playhead" style={{ left: `${telemetry.deckA.progress * 100}%` }} />
              </div>
            </div>
            <div className="deck-lane lane-b">
              <div className="lane-head">
                <strong>DECK B</strong>
                <span>BPM {Math.round(telemetry.deckB.bpm || 0)}</span>
              </div>
              <div className="phrase-grid">
                <div className="playhead alt" style={{ left: `${telemetry.deckB.progress * 100}%` }} />
              </div>
            </div>
            <div className="crossfader-hud">
              <span>CROSSFADER</span>
              <div className="cross-track">
                <div className="cross-marker" style={{ left: `${telemetry.crossfader * 100}%` }} />
              </div>
            </div>
            <div className="output-row">
              <span>FLOWLIGHT: {telemetry.flowLightScene}</span>
              <span>TRACK: {telemetry.activeTrack}</span>
            </div>
            <div className="hero-scrub">
              <label htmlFor="hero-scrub">Cue Preview</label>
              <input id="hero-scrub" type="range" min={0} max={1} step={0.01} value={heroScrub} onChange={(e) => setHeroScrub(Number(e.target.value))} />
              <p>Bar {Math.round(1 + heroScrub * 31)} • {activeFeature.label} zone</p>
            </div>
            <div className="mobile-telemetry" aria-hidden="true">
              <span>Deck A {Math.round(telemetry.deckA.bpm)} BPM</span>
              <span>Deck B {Math.round(telemetry.deckB.bpm)} BPM</span>
              <span>Crossfader {Math.round(telemetry.crossfader * 100)}%</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          ref={(n) => { sectionsRef.current[0] = n; }}
          data-reveal-id="overview"
          className={`overview reveal ${visible.overview ? "reveal-visible" : ""}`}
        >
          <p className="overview-pull">FlowDJ treats performance ergonomics, timing, and recovery as one system.</p>
          <h2>Project Overview</h2>
          <p>
            FlowDJ is designed for DJs who perform from laptops and need dependable keyboard-first control instead of mouse-heavy workflows.
            It solves a practical gap: most systems prioritize controller hardware first, while laptop users still need fast, confident live control.
          </p>
          <p>
            The project matters because it treats performance ergonomics, timing, and recovery as first-class product problems, then connects that mix state to a full lighting architecture.
          </p>
        </section>

        <section
          ref={(n) => { sectionsRef.current[1] = n; }}
          data-reveal-id="features"
          className={`feature-stream reveal ${visible.features ? "reveal-visible" : ""}`}
        >
          <p className="section-kicker">Product Capabilities</p>
          <h2>What It Does</h2>
          <div className="feature-band tone-a" onMouseEnter={() => setAccentMode("control")}>
            <article className="feature-line">
              <div>
                <p className="feature-label">{features[0].label}</p>
                <h3>{features[0].title}</h3>
              </div>
              <p>{features[0].body}</p>
            </article>
            <article className="feature-line" onMouseEnter={() => setAccentMode("lighting")}>
              <div>
                <p className="feature-label">{features[1].label}</p>
                <h3>{features[1].title}</h3>
              </div>
              <p>{features[1].body}</p>
            </article>
          </div>
          <div className="feature-band tone-b">
            <article className="feature-line" onMouseEnter={() => setAccentMode("analytics")}>
              <div>
                <p className="feature-label">{features[2].label}</p>
                <h3>{features[2].title}</h3>
              </div>
              <p>{features[2].body}</p>
            </article>
            <article className="feature-line" onMouseEnter={() => setAccentMode("source")}>
              <div>
                <p className="feature-label">{features[3].label}</p>
                <h3>{features[3].title}</h3>
              </div>
              <p>{features[3].body}</p>
            </article>
          </div>
        </section>

        <section
          ref={(n) => { sectionsRef.current[2] = n; }}
          data-reveal-id="architecture"
          className={`architecture reveal ${visible.architecture ? "reveal-visible" : ""}`}
        >
          <p className="section-kicker">System Pipeline</p>
          <div className="architecture-head">
            <h2>How It Works</h2>
            <p>From source ingestion to performance telemetry, the system is modular and event-driven.</p>
          </div>
          <div className="pipeline-strip" aria-label="event-driven pipeline">
            <div className="signal-trace" />
            <div className="timeline-bar" />
            <div className="pipeline-nodes">
              {workflowSteps.map((step, idx) => (
                <button
                  key={step.name}
                  className={`pipeline-node ${idx === activeStep ? "active" : ""}`}
                  onMouseEnter={() => setActiveStep(idx)}
                  onFocus={() => setActiveStep(idx)}
                  onClick={() => setActiveStep(idx)}
                >
                  <span className="dot" />
                  <span className="node-title">{step.name}</span>
                </button>
              ))}
            </div>
            <div className="pipeline-details">
              <p>{workflowSteps[activeStep].detail}</p>
              <p>Frontend: React + TypeScript + Zustand with modular service architecture</p>
              <p>Backend: FastAPI endpoints for session, recommendation, keyboard profile, and track source flows</p>
              <p>FlowLight: scene engine + event bus + adapter interface for DMX/Hue/MIDI-style outputs</p>
            </div>
          </div>
        </section>

        <section
          ref={(n) => { sectionsRef.current[3] = n; }}
          data-reveal-id="stack"
          className={`stack reveal ${visible.stack ? "reveal-visible" : ""}`}
        >
          <p className="section-kicker">Platform Layers</p>
          <h2>Tech Stack</h2>
          <div className="stack-zones">
            <div className="stack-zone">
              <p className="zone-label">Performance Surface</p>
              <h3>Frontend</h3>
              <p>React, TypeScript, Vite, Zustand, Web Audio API, CSS token-based design system</p>
            </div>
            <div className="stack-zone">
              <p className="zone-label">Orchestration Layer</p>
              <h3>Backend</h3>
              <p>Python, FastAPI, Uvicorn, yt-dlp integration, JSON-backed MVP storage</p>
            </div>
            <div className="stack-zone">
              <p className="zone-label">Engine Internals</p>
              <h3>Core Modules</h3>
              <p>Deck engine, keyboard mode manager, transition guidance, recommendations, analytics, FlowLight adapters</p>
            </div>
          </div>
        </section>

        <section
          ref={(n) => { sectionsRef.current[4] = n; }}
          data-reveal-id="run"
          className={`run reveal ${visible.run ? "reveal-visible" : ""}`}
        >
          <h2>How To Run</h2>
          <div className="run-module">
            <p className="prereq-note">Prerequisites: Python 3.11+, Node.js 18+, npm. Optional for YouTube import: FFmpeg on system path.</p>
            <div className="terminal-head">
              <span className="dots" aria-hidden="true"><i /><i /><i /></span>
              <span>terminal / setup</span>
            </div>
            <pre aria-label="run commands"><code>{runCommands.join("\n")}</code></pre>
            <p className="note">The landing page lives at `/`. The DJ console experience runs at `/console`.</p>
          </div>
        </section>

        <section
          ref={(n) => { sectionsRef.current[5] = n; }}
          data-reveal-id="story"
          className={`build-story reveal ${visible.story ? "reveal-visible" : ""}`}
        >
          <p className="section-kicker">Engineering Notes</p>
          <h2>Build Story & Engineering Highlights</h2>
          <div className="story-split">
            <aside className="story-rail">
              <h3>Constraint-Driven Decisions</h3>
              <p>Laptop-first control model</p>
              <p>Isolated subsystem architecture</p>
              <p>MVP-first recommendation tradeoffs</p>
            </aside>
            <div className="story-copy">
              <p>
                FlowDJ was built as a practical answer to laptop DJ constraints: fast keyboard interaction, guarded recovery mechanics, and readable transition coaching.
                A key architecture decision was isolating audio logic, keyboard mapping, recommendation engines, and lighting subsystems so each can evolve without destabilizing live performance flow.
              </p>
              <p>
                The notable tradeoff is deliberate MVP pragmatism: rule-based recommendation and analytics logic today, with interfaces designed so more advanced models can be introduced later without rewriting the product surface.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(n) => { sectionsRef.current[6] = n; }}
          data-reveal-id="cta"
          className={`closing-cta reveal ${visible.cta ? "reveal-visible" : ""}`}
        >
          <h2>Explore FlowDJ</h2>
          <p>Open the live project surface or inspect the implementation details and architecture in the repository.</p>
          <div className="cta-row">
            <a className="btn btn-primary" href={mainWebsiteUrl} target="_blank" rel="noopener noreferrer">Visit Main Website</a>
            <a className="btn btn-secondary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Explore Repository</a>
          </div>
        </section>

        <section className="project-anchors reveal-visible">
          <h2>Project Exploration Anchors</h2>
          <div className="anchor-links">
            <a href={REPO_FRONTEND} target="_blank" rel="noopener noreferrer">Frontend Surface Modules</a>
            <a href={REPO_BACKEND} target="_blank" rel="noopener noreferrer">Backend API + Core</a>
            <a href={REPO_FLOWLIGHT} target="_blank" rel="noopener noreferrer">FlowLight Engine Internals</a>
            <a href={REPO_TESTS} target="_blank" rel="noopener noreferrer">Landing Visual Test Specs</a>
          </div>
        </section>

        <footer className="status-footer reveal-visible">
          <p>Version Status</p>
          <div>
            <span>Branch: <strong>codex-phase11-premium-ui-youtube-mp3</strong></span>
            <span>Last updated: <strong>May 17, 2026</strong></span>
            <span>Coverage: <strong>Landing + Console + FlowLight + Analytics</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
}
