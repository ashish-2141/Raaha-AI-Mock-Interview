import { describe, expect, it } from "vitest";
import { validateCandidateSource } from "../src/lib/coding/policy";

describe("coding sandbox policy", () => {
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