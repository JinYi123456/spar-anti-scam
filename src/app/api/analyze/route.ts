import { NextResponse } from "next/server";
import { runForensics } from "@/lib/rules";
import { chat, parseJsonLoose, llmAvailable } from "@/lib/llm";
import { ANALYZE_SYSTEM, analyzeUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Narrative {
  headline?: string;
  goal?: string;
  narrative?: string;
  advice?: string[];
  safeReply?: string;
}

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ error: "Provide the suspicious message text (min 5 chars)." }, { status: 400 });
    }

    const report = runForensics(text);

    if (llmAvailable()) {
      try {
        const { text: raw } = await chat({
          system: ANALYZE_SYSTEM,
          user: analyzeUser(text, report),
          route: "analyze",
          json: true,
          temperature: 0.4,
          maxTokens: 700,
        });
        const n = parseJsonLoose<Narrative>(raw);
        if (n) {
          if (n.headline) report.headline = String(n.headline).slice(0, 140);
          if (n.goal) report.goal = String(n.goal).slice(0, 200);
          if (n.advice?.length) {
            report.advice = n.advice.filter((a) => typeof a === "string").slice(0, 4).map((a) => a.slice(0, 200));
          }
          report.safeReply = typeof n.safeReply === "string" ? n.safeReply.slice(0, 220) : undefined;
          // narrative travels out-of-band to keep ForensicReport shape stable
          return NextResponse.json({
            report,
            narrative: String(n.narrative ?? "").slice(0, 900),
            engine: "llm",
          });
        }
      } catch {
        /* fall through to deterministic engine */
      }
    }

    return NextResponse.json({
      report,
      narrative:
        report.tactics.length > 0
          ? `${report.tactics.length} manipulation pattern${report.tactics.length > 1 ? "s" : ""} matched in this text. The strongest levers here are ${report.tactics
              .slice(0, 3)
              .map((t) => t.label.toLowerCase())
              .join(", ")}. Each one is a pressure valve: its only purpose is to move you before you verify. The message earns its ${report.riskScore}/100 risk score by combining them.`
          : "No strong manipulation patterns matched. If this message still feels off, verify through an official channel you choose yourself — trust the channel, not the message.",
      engine: llmAvailable() ? "llm" : "offline",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analyze failed" },
      { status: 500 },
    );
  }
}
