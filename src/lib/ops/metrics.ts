import { getRedis } from "@/lib/interview/redis";

const EVENTS_KEY = "raaha:ops:events";
const RETENTION_SECONDS = 60 * 60 * 24 * 7;
const MAX_EVENTS = 5000;

type OperationalEvent = {
  timestamp: string;
  kind: "request" | "model";
  route: string;
  status?: number;
  durationMs?: number;
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
};

function readRate(name: string): number | null {
  const raw = process.env[name];
  if (!raw?.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

async function storeEvent(event: OperationalEvent) {
  // The same structured record goes to platform logs and a short Redis retention window.
  console.log(JSON.stringify({ event: "raaha_operation", ...event }));
  try {
    const redis = getRedis();
    if (!redis.isOpen) await redis.connect();
    await redis.lPush(EVENTS_KEY, JSON.stringify(event));
    await redis.lTrim(EVENTS_KEY, 0, MAX_EVENTS - 1);
    await redis.expire(EVENTS_KEY, RETENTION_SECONDS);
  } catch {
    console.error(JSON.stringify({
      event: "raaha_operation_store_failed",
      kind: event.kind,
      route: event.route,
    }));
  }
}

export async function recordApiMetric(route: string, status: number, startedAt: number) {
  await storeEvent({
    timestamp: new Date().toISOString(),
    kind: "request",
    route,
    status,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
  });
}

export async function recordModelUsage(input: {
  route: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}) {
  const inputRate = readRate("RAAHA_OPENAI_INPUT_USD_PER_1M");
  const outputRate = readRate("RAAHA_OPENAI_OUTPUT_USD_PER_1M");
  const estimatedCostUsd =
    inputRate !== null && outputRate !== null && input.inputTokens !== null && input.outputTokens !== null
      ? (input.inputTokens * inputRate + input.outputTokens * outputRate) / 1_000_000
      : null;

  await storeEvent({
    timestamp: new Date().toISOString(),
    kind: "model",
    route: input.route,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCostUsd,
  });
}

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
  return sorted[index] ?? null;
}

export async function getOperationsSummary() {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();
  const rows = await redis.lRange(EVENTS_KEY, 0, MAX_EVENTS - 1);
  const events: OperationalEvent[] = [];
  const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const row of rows) {
    try {
      const parsed: unknown = JSON.parse(row);
      if (typeof parsed === "object" && parsed !== null && "kind" in parsed && "route" in parsed) {
        const event = parsed as OperationalEvent;
        if (typeof event.timestamp === "string" && Date.parse(event.timestamp) >= cutoffMs) {
          events.push(event);
        }
      }
    } catch {
      // Ignore corrupt old telemetry rows; no request payloads are stored here.
    }
  }

  const requests = events.filter((event) => event.kind === "request" && typeof event.status === "number");
  const modelEvents = events.filter((event) => event.kind === "model");
  const requestErrors = requests.filter((event) => (event.status ?? 0) >= 500);
  const clientErrors = requests.filter((event) => (event.status ?? 0) >= 400 && (event.status ?? 0) < 500);
  const durations = requests.flatMap((event) => typeof event.durationMs === "number" ? [event.durationMs] : []);
  const pricedModelEvents = modelEvents.filter((event) => typeof event.estimatedCostUsd === "number");
  const inputTokens = modelEvents.reduce((sum, event) => sum + (event.inputTokens ?? 0), 0);
  const outputTokens = modelEvents.reduce((sum, event) => sum + (event.outputTokens ?? 0), 0);
  const estimatedCostUsd = pricedModelEvents.reduce((sum, event) => sum + (event.estimatedCostUsd ?? 0), 0);

  const byRoute = new Map<string, OperationalEvent[]>();
  for (const request of requests) {
    const entries = byRoute.get(request.route) ?? [];
    entries.push(request);
    byRoute.set(request.route, entries);
  }

  return {
    generatedAt: new Date().toISOString(),
    retention: "Up to 7 days and 5000 most recent events, whichever is smaller.",
    requestCount: requests.length,
    serverErrorCount: requestErrors.length,
    clientErrorCount: clientErrors.length,
    serverErrorRate: requests.length ? Math.round((requestErrors.length / requests.length) * 10000) / 10000 : null,
    latencyMs: {
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      max: durations.length ? Math.max(...durations) : null,
    },
    modelUsage: {
      calls: modelEvents.length,
      inputTokens,
      outputTokens,
      callsWithPricedCost: pricedModelEvents.length,
      callsWithUnknownCost: modelEvents.length - pricedModelEvents.length,
      estimatedCostUsdForPricedCalls: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
      note: "Cost is an estimate only when per-million-token rates are configured. Unknown-cost calls are not treated as free.",
    },
    byRoute: [...byRoute.entries()].map(([route, items]) => {
      const routeDurations = items.flatMap((item) => typeof item.durationMs === "number" ? [item.durationMs] : []);
      return {
        route,
        requests: items.length,
        serverErrors: items.filter((item) => (item.status ?? 0) >= 500).length,
        p95Ms: percentile(routeDurations, 0.95),
      };
    }).sort((a, b) => a.route.localeCompare(b.route)),
  };
}
