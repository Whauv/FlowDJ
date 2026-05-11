import { buildTransitionGuidance, computeCompatibility } from "./engine";
import { SAMPLE_TRACKS } from "./sampleTracks";

export interface TransitionTestCaseResult {
  name: string;
  topTrack: string;
  score: number;
  warnings: string[];
}

export function runTransitionTestCases(): TransitionTestCaseResult[] {
  const sourceA = SAMPLE_TRACKS[0];
  const sourceB = SAMPLE_TRACKS[4];

  const case1 = buildTransitionGuidance("A", "B", sourceA, SAMPLE_TRACKS.slice(1), 96, false);
  const case2 = buildTransitionGuidance("B", "A", sourceB, SAMPLE_TRACKS.slice(0, 4), 140, true);
  const comp = computeCompatibility(sourceA, SAMPLE_TRACKS[3], false);

  return [
    {
      name: "Balanced house blend",
      topTrack: case1.recommendations[0]?.track.title ?? "None",
      score: case1.recommendations[0]?.compatibility.total ?? 0,
      warnings: case1.recommendations[0]?.compatibility.warnings ?? []
    },
    {
      name: "Safe mix conservative",
      topTrack: case2.recommendations[0]?.track.title ?? "None",
      score: case2.recommendations[0]?.compatibility.total ?? 0,
      warnings: case2.recommendations[0]?.compatibility.warnings ?? []
    },
    {
      name: "Energy clash detection",
      topTrack: SAMPLE_TRACKS[3].title,
      score: comp.total,
      warnings: comp.warnings
    }
  ];
}
