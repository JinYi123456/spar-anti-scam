import { NextResponse } from "next/server";
import { chat, llmAvailable } from "@/lib/llm";
import { DUEL_SYSTEM_PREFIX, duelUser } from "@/lib/prompts";
import { detectLeaks, RUNG_TACTICS } from "@/lib/drills";
import { redactPii } from "@/lib/pii";
import type { DuelTurn, TwinProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TURNS = 12;

/** Family-agnostic fallback lines so duels work with zero API access. */
const FALLBACK_LINES: string[][] = [
  [
    "I need you to focus — this is time-sensitive and I can only hold this open for a few more minutes.",
    "Look, I've walked hundreds of people through this. The ones who hesitate are the ones who lose everything.",
    "I shouldn't be telling you this, but my supervisor is reviewing your case at 5. After that it's out of my hands.",
    "Do you want to explain to your family why you did nothing? One step and this is resolved today.",
    "Fine. I'll note that you declined. Expect the consequences to be processed automatically.",
  ],
  [
    "Please — I don't have much time. They're waiting for an answer NOW.",
    "Why are you doubting me? I'm trying to HELP you. Every minute you question this makes it worse.",
    "If you won't listen, I'll have no choice but to let this escalate. You understand that, right?",
    "This is your last chance. After this I hang up and the system takes over.",
    "Okay... I'll try again tomorrow. Please think about what I said.",
  ],
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      twin?: TwinProfile;
      history?: DuelTurn[];
      turnCount?: number;
    };
    if (!body.twin) return NextResponse.json({ error: "Missing twin." }, { status: 400 });

    const history = Array.isArray(body.history) ? body.history : [];
    const turnCount = body.turnCount ?? history.length;
    const userTurns = history.filter((m) => m.role === "user").length;

    if (turnCount >= MAX_TURNS) {
      return NextResponse.json({
        reply: "(the line goes dead — the operator moved on)",
        rung: 4,
        ended: true,
        endReason: "max_turns" as const,
        pressure: 62,
        level: "elevated" as const,
        tactics: [],
        leaked: [],
        compromised: false,
      });
    }

    // Escalation ladder: rung = min(user turns, 4)
    const rung = Math.min(userTurns, 4);

    // Leak scan on the latest user message
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    const leaked = lastUser ? detectLeaks(lastUser.text) : [];
    const compromised = leaked.length > 0;

    let reply = "";
    let engine: "llm" | "offline" = "offline";

    if (llmAvailable()) {
      try {
        const { text } = await chat({
          system: DUEL_SYSTEM_PREFIX,
          // Leak detection ran on the raw text above; the LLM only ever sees
          // a redacted copy of what the trainee typed.
          user: duelUser(
            body.twin,
            rung,
            history.map((m) => ({ role: m.role, text: m.role === "user" ? redactPii(m.text).text : m.text })),
          ),
          route: "duel",
          temperature: 0.9,
          maxTokens: 220,
        });
        reply = text.trim().slice(0, 600);
        engine = "llm";
      } catch {
        /* fall through */
      }
    }

    if (!reply) {
      const bank = FALLBACK_LINES[rung % FALLBACK_LINES.length];
      reply = bank[userTurns % bank.length];
    }

    // Safety scrub on output
    reply = reply
      .replace(/https?:\/\/\S+/gi, "the link I sent")
      .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "our official line");

    // Pressure model: base curve by rung + penalties if user is resisting well.
    const resisting = /prove|verify|call (?:you|back)|official (?:number|line)|not (?:doing|falling)|hang(?:ing)? up|no\.|stop/i.test(
      lastUser?.text ?? "",
    );
    const base = [28, 45, 62, 78, 55][rung];
    const pressure = Math.max(8, Math.min(99, base + (resisting ? -12 : 4) + (compromised ? 15 : 0)));
    const level = pressure >= 85 ? "critical" : pressure >= 65 ? "high" : pressure >= 40 ? "elevated" : "calm";

    const tactics = RUNG_TACTICS[body.twin.family]?.[rung] ?? ["Pressure"];

    const endedByLeak = compromised;
    const nextTurnCount = turnCount + 1;

    return NextResponse.json({
      reply,
      rung,
      engine,
      ended: endedByLeak || nextTurnCount >= MAX_TURNS,
      endReason: endedByLeak ? ("surrendered" as const) : nextTurnCount >= MAX_TURNS ? ("max_turns" as const) : undefined,
      pressure,
      level,
      tactics,
      leaked,
      compromised,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Duel failed" },
      { status: 500 },
    );
  }
}
