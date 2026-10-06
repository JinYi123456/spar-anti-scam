// ── LLM client: Featherless AI (OpenAI-compatible) ──────────────────
// Server-side only. Requires FEATHERLESS_API_KEY in .env.local.
// If the key is missing or every call fails, callers fall back to the
// deterministic engine in ./rules.ts so the app ALWAYS works offline.

import type { DriftLogEntry } from "./types";

const BASE_URL = process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1";
const API_KEY = process.env.FEATHERLESS_API_KEY ?? "";

/** Fallback chain: strong generalist → fast generalist. First that answers wins. */
export const MODEL_CHAIN = [
  process.env.FEATHERLESS_MODEL,          // user override
  "Qwen/Qwen3-32B",
  "deepseek-ai/DeepSeek-V3-0324",
  "meta-llama/Meta-Llama-3.3-70B-Instruct",
  "mistralai/Mistral-Small-24B-Instruct-2501",
].filter(Boolean) as string[];

export const PRIMARY_MODEL = MODEL_CHAIN[0];

export function llmAvailable(): boolean {
  return API_KEY.length > 0;
}

/** Drift telemetry: last N calls, surfaced in UI only when things break. */
const driftLog: DriftLogEntry[] = [];
export function getDriftLog(): DriftLogEntry[] {
  return [...driftLog];
}
function log(entry: DriftLogEntry) {
  driftLog.unshift(entry);
  if (driftLog.length > 30) driftLog.pop();
}

interface ChatOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  route: DriftLogEntry["route"];
  /** Optional JSON schema hint — we still parse defensively. */
  json?: boolean;
}

async function callModel(model: string, opts: ChatOptions, started: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 900,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${body.slice(0, 180)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty completion");
    log({ ts: new Date().toISOString(), model, route: opts.route, ok: true, ms: Date.now() - started });
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/** Try every model in the chain; return the first success. Throws only if all fail. */
export async function chat(opts: ChatOptions): Promise<{ text: string; model: string }> {
  if (!API_KEY) throw new Error("FEATHERLESS_API_KEY not set");
  const started = Date.now();
  let lastErr: unknown = null;
  for (const model of MODEL_CHAIN) {
    try {
      const text = await callModel(model, opts, started);
      return { text, model };
    } catch (err) {
      lastErr = err;
      log({
        ts: new Date().toISOString(),
        model,
        route: opts.route,
        ok: false,
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all models failed");
}

/** Parse JSON out of an LLM response, tolerating code fences and prose wrappers. */
export function parseJsonLoose<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*/m, (m) => (m.includes("```") ? "" : m))
    .replace(/```[\s\S]*$/m, "");
  const candidates = [cleaned, raw];
  for (const text of candidates) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      /* try next */
    }
  }
  return null;
}
