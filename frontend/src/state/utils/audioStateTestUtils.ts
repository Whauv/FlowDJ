export function computeDeckCrossfadeGains(crossfader: number): { A: number; B: number } {
  const clamped = Math.max(0, Math.min(1, crossfader));
  return { A: 1 - clamped, B: clamped };
}

export function clampNormalized(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function runAudioStateSanityChecks(): boolean {
  const mid = computeDeckCrossfadeGains(0.5);
  const left = computeDeckCrossfadeGains(0);
  const right = computeDeckCrossfadeGains(1);

  return (
    Math.abs(mid.A - 0.5) < 0.001 &&
    Math.abs(mid.B - 0.5) < 0.001 &&
    left.A === 1 &&
    left.B === 0 &&
    right.A === 0 &&
    right.B === 1 &&
    clampNormalized(-1) === 0 &&
    clampNormalized(2) === 1
  );
}
