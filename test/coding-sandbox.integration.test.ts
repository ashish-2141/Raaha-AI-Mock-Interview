import { describe, expect, it } from "vitest";
import { getCodingChallenge } from "../src/lib/coding/challenges";
import { executeCodingChallenge } from "../src/lib/coding/sandbox";

const integrationEnabled = process.env.RAAHA_RUN_SANDBOX_INTEGRATION === "1";
const challenge = getCodingChallenge("two-sum");

describe("Docker sandbox runtime integration", () => {
  it.skipIf(!integrationEnabled)("executes a correct answer against each host-held hidden case", async () => {
    if (!challenge) throw new Error("Two Sum challenge is missing.");
    const source = `export function twoSum(nums, target) {
      const seen = new Map();
      for (let index = 0; index < nums.length; index += 1) {
        const complement = target - nums[index];
        if (seen.has(complement)) return [seen.get(complement), index];
        seen.set(nums[index], index);
      }
      return [];
    }`;

    const result = await executeCodingChallenge(source, challenge);
    expect(result.status).toBe("passed");
    expect(result.cases).toHaveLength(challenge.hiddenCases.length);
    expect(result.cases.every((item) => item.passed)).toBe(true);
  }, 120_000);

  it.skipIf(!integrationEnabled)("terminates an infinite-loop submission", async () => {
    if (!challenge) throw new Error("Two Sum challenge is missing.");
    const result = await executeCodingChallenge("export function twoSum() { while (true) {} }", challenge);

    expect(result.status).toBe("failed");
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]?.error).toContain("timed out");
    expect(result.review).toContain("time limit");
    expect(result.durationMs).toBeLessThan(15_000);
  }, 30_000);
});
