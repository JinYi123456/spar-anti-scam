import { NextResponse } from "next/server";
import { chat, parseJsonLoose, llmAvailable } from "@/lib/llm";
import { FORGE_SYSTEM, forgeUser } from "@/lib/prompts";
import { offlineTwinFor } from "@/lib/drills";
import type { ForensicReport, TwinProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function sanitizeTwin(t: Partial<TwinProfile>, fallback: TwinProfile): TwinProfile {
  const clean = (s: unknown, max: number) =>
    typeof s === "string" && s.trim() ? s.trim().slice(0, max) : undefined;

  // Hard safety scrub: no URLs or phone numbers may ever leave the forge.
  const scrub = (s: string) =>
    s
      .replace(/https?:\/\/\S+/gi, "the link I sent")
      .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "our official line");

  const escalation = Array.isArray(t.escalation)
    ? t.escalation.filter((e) => typeof e === "string" && e.trim()).slice(0, 5).map((e) => scrub(e).slice(0, 300))
    : undefined;

  return {
    personaName: clean(t.personaName, 60) ?? fallback.personaName,
    brief: clean(t.brief, 700) ?? fallback.brief,
    escalation: escalation && escalation.length >= 4 ? escalation : fallback.escalation,
    avoids: Array.isArray(t.avoids) && t.avoids.length
      ? t.avoids.filter((a) => typeof a === "string").slice(0, 4).map((a) => String(a).slice(0, 140))
      : fallback.avoids,
    family: fallback.family,
    opener: t.opener ? scrub(String(t.opener)).slice(0, 500) : fallback.opener,
  };
}

export async function POST(req: Request) {
  try {
    const { report, text } = (await req.json()) as { report?: ForensicReport; text?: string };
    if (!report || !text) {
      return NextResponse.json({ error: "Missing report or text." }, { status: 400 });
    }

    const fallback = offlineTwinFor(report.family);

    if (llmAvailable()) {
      try {
        const { text: raw } = await chat({
          system: FORGE_SYSTEM,
          user: forgeUser(report, text),
          route: "forge",
          json: true,
          temperature: 0.8,
          maxTokens: 900,
        });
        const twin = parseJsonLoose<Partial<TwinProfile>>(raw);
        if (twin) {
          return NextResponse.json({ twin: sanitizeTwin(twin, fallback), engine: "llm" });
        }
      } catch {
        /* fall through */
      }
    }

    return NextResponse.json({ twin: fallback, engine: "offline" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forge failed" },
      { status: 500 },
    );
  }
}
