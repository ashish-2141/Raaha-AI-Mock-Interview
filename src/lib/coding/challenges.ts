import type { CodingLanguage } from "./types";

export type HiddenCase = { input: unknown[]; expected: unknown };

export type CodingChallenge = {
  id: string;
  title: string;
  prompt: string;
  language: CodingLanguage;
  starterCode: string;
  hiddenCases: readonly HiddenCase[];
};

const TWO_SUM_CASES: readonly HiddenCase[] = [
  { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { input: [[3, 2, 4], 6], expected: [1, 2] },
  { input: [[3, 3], 6], expected: [0, 1] },
  { input: [[-3, 4, 3, 90], 0], expected: [0, 2] },
  { input: [[1, 5, 1, 5], 6], expected: [0, 1] },
];

export const CODING_CHALLENGES: readonly CodingChallenge[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    prompt:
      "Given an integer array nums and an integer target, return the indices of two numbers whose sum equals target. Assume exactly one valid answer exists. Return the two indices in ascending order.",
    language: "javascript",
    starterCode:
      "export function twoSum(nums, target) {\\n  // Return the two indices in ascending order.\\n}\\n",
    hiddenCases: TWO_SUM_CASES,
  },
];

export function getCodingChallenge(id: string): CodingChallenge | undefined {
  return CODING_CHALLENGES.find((challenge) => challenge.id === id);
}

export function publicCodingChallenge(challenge: CodingChallenge) {
  return {
    id: challenge.id,
    title: challenge.title,
    prompt: challenge.prompt,
    language: challenge.language,
    starterCode: challenge.starterCode,
  };
}