import type { Choice } from "../data/scenarios";

export const scoreFromChoices = (choices: Choice[]) =>
  choices.reduce((total, choice) => total + choice.score, 0);

export const rankTitle = (score: number) => {
  if (score >= 950) return "Confident Colleague";
  if (score >= 760) return "Workplace Wise";
  if (score >= 560) return "Careful Starter";
  return "Learning Navigator";
};
