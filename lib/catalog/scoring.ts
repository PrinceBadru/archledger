export interface ScoreInput {
  lifecycleStage: string;
  dependencyCount: number;
}

export function computeHealthScore(input: ScoreInput): number {
  let score = 100;
  
  const stage = (input.lifecycleStage || "").toLowerCase();
  if (stage === "deprecated") score -= 40;
  if (stage === "proposed") score -= 10;
  if (stage === "superseded") score -= 60;
  
  // dependency penalty: -5 per dependency over 5
  if (input.dependencyCount > 5) {
    score -= (input.dependencyCount - 5) * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}
