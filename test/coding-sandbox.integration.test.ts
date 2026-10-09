import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { executeCodingChallenge } from "../src/lib/coding/sandbox";
import { getCodingChallenge } from "../src/lib/coding/challenges";

const execFileAsync = promisify(execFile);
const challenge = getCodingChallenge("two-sum");
const dockerIntegrationEnabled = process.env.RAAHA_RUN_DOCKER_SANDBOX === "1";

describe.skipIf(!dockerIntegrationEnabled)("Docker coding sandbox integration", () => {
  it("runs a valid solution against every hidden case", async () => {
    if (!challenge) throw new Error("Two Sum challenge fixture is missing.");
    const result = await executeCodingChallenge(
      `export function twoSum(nums, target) {
        const seen = new Map();
        for (let i = 0; i < nums.length; i += 1) {
          const other = target - nums[i];
          if (seen.has(other)) return [seen.get(other), i].sort((a, b) => a - b);
          seen.set(nums[i], i);
        }
        return [];
      }`,
      challenge,
    );

    expect(result.status).toBe("passed");
    expect(result.cases).toHaveLength(challenge.hiddenCases.length);
    expect(result.cases.every((item) => item.passed)).toBe(true);
    expect(result.isolated).toBe(true);
    expect(result.networkDisabled).toBe(true);
  }, 20_000);

  it("reports a normal incorrect solution as failed", async () => {
    if (!challenge) throw new Error("Two Sum challenge fixture is missing.");
    const result = await executeCodingChallenge("export function twoSum() { return []; }", challenge);

    expect(result.status).toBe("failed");
    expect(result.cases.some((item) => !item.passed)).toBe(true);
  }, 20_000);

  it("times out an infinite loop and removes its container", async () => {
    if (!challenge) throw new Error("Two Sum challenge fixture is missing.");
    const listSandboxContainers = async () => {
      const { stdout } = await execFileAsync("docker", [
        "ps", "-a", "--filter", "name=raaha-sandbox-", "--format", "{{.Names}}",
      ], { timeout: 5_000 });
      return stdout.trim().split(/\r?\n/).filter(Boolean).sort();
    };

    const before = await listSandboxContainers();
    const result = await executeCodingChallenge("export function twoSum() { while (true) {} }", challenge);
    const after = await listSandboxContainers();

    expect(result.status).toBe("failed");
    expect(result.review.toLowerCase()).toContain("time limit");
    expect(after).toEqual(before);
  }, 20_000);
});
