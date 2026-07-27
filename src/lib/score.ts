import type { Choice, Metrics } from "../data/scenarios";
import { initialMetrics } from "../data/scenarios";

export const clampMetric = (value: number) => Math.max(0, Math.min(100, value));

export const applyChoice = (metrics: Metrics, choice: Choice): Metrics => ({
  teamTrust: clampMetric(metrics.teamTrust + choice.delta.teamTrust),
  stress: clampMetric(metrics.stress + choice.delta.stress),
  reputation: clampMetric(metrics.reputation + choice.delta.reputation),
  career: clampMetric(metrics.career + choice.delta.career),
});

export const scoreFromChoices = (choices: Choice[]) =>
  choices.reduce((total, choice) => total + choice.score, 0);

export const rankTitle = (score: number) => {
  if (score >= 950) return "Confident Colleague";
  if (score >= 760) return "Workplace Wise";
  if (score >= 560) return "Careful Starter";
  return "Learning Navigator";
};

export const resetMetrics = () => ({ ...initialMetrics });
