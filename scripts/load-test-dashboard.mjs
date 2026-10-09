import { performance } from "node:perf_hooks";

const baseUrl = (process.env.RAAHA_LOAD_TEST_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const cookie = process.env.RAAHA_LOAD_TEST_COOKIE;
const requestCount = Number.parseInt(process.env.RAAHA_LOAD_TEST_REQUESTS ?? "100", 10);
const concurrency = Number.parseInt(process.env.RAAHA_LOAD_TEST_CONCURRENCY ?? "10", 10);

if (!baseUrl || !cookie) {
  console.error("Set RAAHA_LOAD_TEST_BASE_URL and RAAHA_LOAD_TEST_COOKIE to test a deployed, authenticated TPO dashboard.");
  process.exit(2);
}
if (!Number.isInteger(requestCount) || requestCount < 1 || requestCount > 5000) {
  console.error("RAAHA_LOAD_TEST_REQUESTS must be an integer between 1 and 5000.");
  process.exit(2);
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
  console.error("RAAHA_LOAD_TEST_CONCURRENCY must be an integer between 1 and 100.");
  process.exit(2);
}

const durations = [];
const statuses = new Map();
let cursor = 0;
let failures = 0;
const start = performance.now();

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= requestCount) return;
    const started = performance.now();
    try {
      const response = await fetch(new URL("/api/college-dashboard/summary", baseUrl), {
        headers: { Cookie: cookie, Accept: "application/json" },
        cache: "no-store",
      });
      const elapsed = performance.now() - started;
      durations.push(elapsed);
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
      await response.body?.cancel();
      if (!response.ok) failures++;
    } catch {
      durations.push(performance.now() - started);
      failures++;
      statuses.set("network-error", (statuses.get("network-error") ?? 0) + 1);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));
durations.sort((a, b) => a - b);
const percentile = (fraction) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * fraction) - 1)] ?? 0;
const elapsedMs = performance.now() - start;
const result = {
  target: new URL("/api/college-dashboard/summary", baseUrl).origin,
  requestCount,
  concurrency,
  elapsedMs: Math.round(elapsedMs),
  requestsPerSecond: Number((requestCount / (elapsedMs / 1000)).toFixed(2)),
  p50Ms: Math.round(percentile(0.5)),
  p95Ms: Math.round(percentile(0.95)),
  maxMs: Math.round(durations.at(-1) ?? 0),
  statusCounts: Object.fromEntries(statuses),
  failures,
  result: failures === 0 ? "PASS" : "FAIL",
};
console.log(JSON.stringify(result, null, 2));
if (failures > 0) process.exit(1);
