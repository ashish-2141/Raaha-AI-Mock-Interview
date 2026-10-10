import { describe, expect, it } from "vitest";
import { buildDockerArgs } from "../src/lib/coding/sandbox";
import { SANDBOX_POLICY, validateCandidateSource } from "../src/lib/coding/policy";

describe("coding sandbox policy", () => {
  it("configures non-root, network-disabled, resource-limited execution", () => {
    const args = buildDockerArgs("/tmp/raaha-test", "/tmp/raaha-test.cid");
    const valueFor = (flag: string) => args[args.indexOf(flag) + 1];

    expect(valueFor("--network")).toBe("none");
    expect(valueFor("--memory")).toBe(`${SANDBOX_POLICY.memoryMb}m`);
    expect(valueFor("--cpus")).toBe(SANDBOX_POLICY.cpuLimit);
    expect(valueFor("--pids-limit")).toBe(String(SANDBOX_POLICY.pidsLimit));
    expect(valueFor("--user")).toBe("1000:1000");
    expect(args).toContain("--read-only");
    expect(args).toContain("--cap-drop");
    expect(valueFor("--cap-drop")).toBe("ALL");
    expect(valueFor("--security-opt")).toBe("no-new-privileges");
    expect(valueFor("--stop-timeout")).toBe("1");
    expect(valueFor("--cidfile")).toBe("/tmp/raaha-test.cid");
    expect(valueFor("--mount")).not.toContain("raaha-test.cid");
    expect(valueFor("--mount")).toContain("dst=/workspace,readonly");
  });

  it("accepts a normal submission", () => {
    expect(validateCandidateSource("export function twoSum() { return [0, 1]; }")).toBeNull();
  });

  it("rejects filesystem/process escape imports", () => {
    expect(validateCandidateSource('import fs from "node:fs";')).toContain("blocked token");
  });

  it("rejects oversized source", () => {
    expect(validateCandidateSource("x".repeat(20_001))).toContain("20,000-byte");
  });
});