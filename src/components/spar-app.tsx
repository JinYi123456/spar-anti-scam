"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dial, PressureBars, Typewriter, Sparkline } from "./gauges";
import type {
  DebriefScore,
  DuelTurn,
  ForensicReport,
  ThreatFamily,
  TwinProfile,
} from "@/lib/types";

/* ─────────────────────────── small atoms ─────────────────────────── */

const FAMILY_LABEL: Record<ThreatFamily, string> = {
  authority_impersonation: "Authority Impersonation",
  family_emergency: "Family Emergency",
  investment_romance: "Investment / Romance",
  job_task_scam: "Fake Job / Task",
  tech_support: "Tech Support",
  phishing_account: "Credential Phishing",
  prize_delivery: "Prize / Delivery",
  generic: "Unclassified",
};

type Verdict = "scam" | "suspicious" | "likely_safe";
const VERDICT_META: Record<Verdict, { text: string; color: string; bg: string }> = {
  scam: { text: "SCAM", color: "#ff4d5e", bg: "rgba(255,77,94,0.12)" },
  suspicious: { text: "SUSPICIOUS", color: "#f5a524", bg: "rgba(245,165,36,0.1)" },
  likely_safe: { text: "LIKELY SAFE", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
};

type Stage = "intake" | "analyzing" | "report" | "forging" | "duel" | "debrief-wait" | "debrief";

const SAMPLES: { label: string; text: string }[] = [
  {
    label: "Bank lockout SMS",
    text: "ALERT: Your account ending 4471 has been locked due to unusual activity. Verify within 2 hours or permanent closure: http://secure-verify-account.top/lock Do not share this code with anyone. Reply STOP to opt out",
  },
  {
    label: "'Hi Mom' emergency",
    text: "Hi Mom, it's me! My phone broke, I'm using a friend's phone. I got detained at the festival and they need $850 for the fine before they release me tonight. Please don't tell Dad, he'll freak. I'm scared, please hurry",
  },
  {
    label: "Crypto 'mentor'",
    text: "Hey! Great meeting you today. Like I said, I've been running a strategy that's printing consistently — made 3.2% this morning alone. I only have two mentorship slots this quarter. Risk-free if you follow my signals. Can send you the VIP group link",
  },
  {
    label: "Parcel fee",
    text: "Parcel Notification Ref #DL-99823: Your package is on HOLD at customs — clearance fee unpaid. Total due $24.09 via gift card or bank transfer. Unclaimed parcels are forfeited after 48 hours. Call now: +1 800 555 0199",
  },
];

/* ─────────────────────────── intake screen ───────────────────────── */

function Intake({
  onAnalyze,
  busy,
  engineLive,
}: {
  onAnalyze: (text: string) => void;
  busy: boolean;
  engineLive: boolean;
}) {
  const [text, setText] = useState("");
  const [shake, setShake] = useState(false);

  const go = () => {
    if (text.trim().length < 5) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    onAnalyze(text.trim());
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 rise">
      <div className="text-center">
        <div className="text-[11px] mono tracking-[0.4em] text-muted uppercase mb-3">Autopsy · Twin · Sparring · Report</div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          Don&apos;t just detect scams.
          <br />
          <span className="text-[#f5a524]">Learn to kill them.</span>
        </h1>
      </div>

      <p className="text-center text-muted max-w-xl mx-auto">
        SPAR dissects the manipulation attempt you received, forges a{" "}
        <span className="text-[#22d3ee]">digital twin</span> of the scammer behind it, and puts you in a live
        sparring drill — so the next real one finds you trained, not targeted.
      </p>

      <div className={`panel corner-frame p-5 sm:p-6 ${shake ? "pulse-danger" : ""}`}>
        <label className="text-[11px] mono tracking-[0.3em] uppercase text-muted">Suspect specimen</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go();
          }}
          rows={5}
          placeholder="Paste the suspicious SMS, WhatsApp message, email, or call transcript here…"
          className="mt-3 w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed placeholder:text-[#3d4a63]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => setText(s.text)}
                className="btn-ghost px-3 py-1.5 text-xs mono"
                disabled={busy}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] mono text-muted tracking-widest">
              {engineLive ? "LLM ENGINE ONLINE" : "OFFLINE FORENSICS MODE"}
            </span>
            <button onClick={go} disabled={busy} className="btn-forge px-6 py-2.5 text-sm tracking-wide">
              RUN AUTOPSY →
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-center">
        {[
          ["01 · AUTOPSY", "14 manipulation patterns dissected with evidence quotes"],
          ["02 · DIGITAL TWIN", "The scammer's psychology, rebuilt as a sparring partner"],
          ["03 · THE DUEL", "Live escalation drill with a coach that grades your defense"],
        ].map(([t, d]) => (
          <div key={t} className="panel p-4">
            <div className="text-[10px] mono tracking-[0.3em] text-[#f5a524]">{t}</div>
            <div className="text-sm text-muted mt-2">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── analyzing screen ────────────────────── */

const AUTOPSY_STEPS = [
  "Extracting specimen…",
  "Matching 14 manipulation signatures…",
  "Profiling emotional levers…",
  "Tracing the con's goal vector…",
  "Writing autopsy report…",
];

function Analyzing({ stage }: { stage: number }) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 rise">
      <div className="mono text-[11px] tracking-[0.4em] text-[#f5a524] uppercase flicker">SPAR FORENSIC LAB</div>
      <Dial value={stage * 20 + 10} label="dissection" />
      <div className="w-full panel p-5 scanlines">
        {AUTOPSY_STEPS.map((s, i) => (
          <div
            key={s}
            className={`mono text-sm py-1.5 transition-opacity ${i <= stage ? "opacity-100" : "opacity-25"}`}
            style={{ color: i < stage ? "#34d399" : i === stage ? "#f5a524" : undefined }}
          >
            {i < stage ? "✓ " : i === stage ? "▸ " : "· "}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── report screen ───────────────────────── */

function Report({
  report,
  narrative,
  onForge,
  onReset,
  busy,
}: {
  report: ForensicReport;
  narrative: string;
  onForge: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const vm = VERDICT_META[report.verdict];
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 rise">
      <div className="panel corner-frame scanlines p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="text-[10px] mono tracking-[0.35em] text-muted uppercase">SPAR Forensic Autopsy · Case {report.signature.slice(0, 18)}</div>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 leading-snug">{report.headline}</h2>
            <p className="text-muted mt-3 leading-relaxed">{narrative}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Dial value={report.riskScore} label="risk index" />
            <div className="stamp" style={{ color: vm.color, background: vm.bg }}>
              {vm.text}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <div className="panel p-5">
            <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-4">Emotional pressure profile</div>
            <PressureBars pressure={report.pressure} />
            <div className="mt-5 pt-4 border-t border-[#1c2536]">
              <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-2">Classification</div>
              <div className="text-sm">
                <span className="text-[#22d3ee]">{FAMILY_LABEL[report.family]}</span>
                <span className="text-muted"> · via {report.channel.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-3">Objective & hooks</div>
            <div className="text-sm leading-relaxed">{report.goal}</div>
            <ul className="mt-3 space-y-1.5">
              {report.hooks.map((h) => (
                <li key={h} className="text-sm text-[#ffd58a] flex gap-2">
                  <span className="text-[#f5a524]">▸</span> {h}
                </li>
              ))}
            </ul>
            {report.safeReply ? (
              <div className="mt-4 p-3 rounded-lg bg-[rgba(34,211,238,0.06)] border border-[rgba(34,211,238,0.25)]">
                <div className="text-[10px] mono tracking-[0.3em] text-[#22d3ee] uppercase mb-1">Safe reply (copy if useful)</div>
                <div className="text-sm">{report.safeReply}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-3">Evidence — {report.tactics.length} pattern{report.tactics.length === 1 ? "" : "s"} matched</div>
          {report.tactics.length === 0 ? (
            <div className="text-sm text-muted">No strong manipulation signatures matched. Trust the calm — but verify anyway if money or identity is involved.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {report.tactics.map((t, i) => (
                <div key={t.key + i} className="panel p-4 rise" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#ffd58a]">{t.label}</span>
                    <span className="mono text-[10px] text-muted">{Math.round(t.weight * 100)}%</span>
                  </div>
                  <div className="mono text-xs mt-2 px-2 py-1.5 rounded bg-[rgba(255,77,94,0.07)] border border-[rgba(255,77,94,0.2)] text-[#ff9aa4]">
                    “{t.evidence}”
                  </div>
                  <p className="text-xs text-muted mt-2 leading-relaxed">{t.why}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 panel p-5">
          <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-3">Counter-strategy</div>
          <ol className="space-y-2.5">
            {report.advice.map((a, i) => (
              <li key={i} className="text-sm flex gap-3">
                <span className="mono text-[#f5a524] text-xs pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed">{a}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReset} className="btn-ghost px-5 py-2.5 text-sm">
          ← New autopsy
        </button>
        <button onClick={onForge} disabled={busy} className="btn-forge px-8 py-3 text-sm tracking-wide">
          ⚡ FORGE THE DIGITAL TWIN →
        </button>
      </div>
      <p className="text-center text-xs text-muted -mt-2">
        Reading about the scam isn&apos;t training. The next step puts you inside it — safely.
      </p>
    </div>
  );
}

/* ─────────────────────────── forging screen ──────────────────────── */

const FORGE_STEPS = [
  "Isolating scammer psychology…",
  "Cloning manipulation rhythm…",
  "Building escalation ladder…",
  "Warming up the twin…",
];

function Forging({ step, twinName }: { step: number; twinName?: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 rise">
      <div className="mono text-[11px] tracking-[0.4em] text-[#ff4d5e] uppercase flicker">⚠ FORGE CHAMBER ACTIVE</div>
      <Dial value={Math.min(96, step * 25 + 5)} label="twin synthesis" />
      <div className="w-full panel p-5 scanlines">
        {FORGE_STEPS.map((s, i) => (
          <div
            key={s}
            className={`mono text-sm py-1.5 ${i <= step ? "opacity-100" : "opacity-25"}`}
            style={{ color: i < step ? "#34d399" : i === step ? "#ff4d5e" : undefined }}
          >
            {i < step ? "✓ " : i === step ? "▸ " : "· "}
            {s}
          </div>
        ))}
      </div>
      {twinName ? (
        <div className="text-center">
          <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase">Twin online</div>
          <div className="text-2xl font-bold text-[#ff4d5e] mt-1 mono">{twinName}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── duel screen ─────────────────────────── */

const PRESSURE_COLOR: Record<string, string> = {
  calm: "#34d399",
  elevated: "#ffd58a",
  high: "#f5a524",
  critical: "#ff4d5e",
};

function Duel({
  twin,
  history,
  pressure,
  level,
  pressureHistory,
  tacticsSeen,
  onSend,
  onEnd,
  busy,
  ending,
}: {
  twin: TwinProfile;
  history: DuelTurn[];
  pressure: number;
  level: string;
  pressureHistory: number[];
  tacticsSeen: string[];
  onSend: (text: string) => void;
  onEnd: () => void;
  busy: boolean;
  ending: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length, busy]);

  const send = () => {
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 rise">
      {/* header */}
      <div className="panel corner-frame p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[rgba(255,77,94,0.12)] border border-[rgba(255,77,94,0.4)] flex items-center justify-center text-xl pulse-danger">
            ☎
          </div>
          <div>
            <div className="font-bold mono text-[#ff4d5e]">{twin.personaName}</div>
            <div className="text-[11px] text-muted mono">
              LIVE DRILL · simulation — every word is generated, nothing is sent anywhere
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] mono tracking-[0.25em] text-muted uppercase">Pressure</div>
            <div className="text-xl font-bold mono" style={{ color: PRESSURE_COLOR[level] ?? "#f5a524" }}>
              {Math.round(pressure)} · {level.toUpperCase()}
            </div>
          </div>
          <Sparkline data={pressureHistory} />
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_240px] gap-4">
        {/* chat */}
        <div className="panel flex flex-col" style={{ height: 480 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "bubble-user" : "bubble-twin"
                  }`}
                >
                  {m.role === "twin" && m.rung === 0 ? (
                    <Typewriter text={m.text} speed={16} />
                  ) : (
                    m.text
                  )}
                  {m.role === "twin" && m.newTactics?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.newTactics.map((t) => (
                        <span key={t} className="tactic-chip px-2 py-0.5 rounded-full text-[10px] mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="bubble-twin px-4 py-2.5 text-sm text-muted mono">…</div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#1c2536] p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Reply as yourself — how would you REALLY handle this?"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#3d4a63]"
                disabled={busy || ending}
              />
              <button onClick={send} disabled={busy || ending || !input.trim()} className="btn-forge px-4 py-2 text-xs">
                SEND
              </button>
            </div>
          </div>
        </div>

        {/* side rail */}
        <div className="flex flex-col gap-4">
          <div className="panel p-4">
            <div className="text-[10px] mono tracking-[0.25em] text-muted uppercase mb-3">Tactics deployed</div>
            <div className="flex flex-wrap gap-1.5">
              {tacticsSeen.length === 0 ? (
                <span className="text-xs text-muted">none yet</span>
              ) : (
                [...new Set(tacticsSeen)].map((t) => (
                  <span key={t} className="tactic-chip px-2 py-0.5 rounded-full text-[10px]">
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="panel p-4 text-xs text-muted leading-relaxed">
            <div className="text-[10px] mono tracking-[0.25em] uppercase mb-2 text-[#f5a524]">Field manual</div>
            • Real institutions survive a call-back on a number YOU choose.
            <br />• Urgency is their oxygen. Delay starves it.
            <br />• Never confirm codes, passwords, or install anything.
            <br />• A flat “no” beats a curious “why?”.
          </div>
          <button onClick={onEnd} disabled={busy || ending} className="btn-ghost px-4 py-2.5 text-sm">
            {ending ? "…" : "End drill & get debrief"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── debrief screen ──────────────────────── */

const GRADE_COLOR: Record<string, string> = {
  S: "#22d3ee",
  A: "#34d399",
  B: "#ffd58a",
  C: "#f5a524",
  D: "#ff4d5e",
};

function DebriefView({
  twin,
  score,
  history,
  onRestart,
}: {
  twin: TwinProfile;
  score: DebriefScore;
  history: DuelTurn[];
  onRestart: () => void;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 rise">
      <div className="panel corner-frame scanlines p-6 sm:p-8 text-center">
        <div className="text-[10px] mono tracking-[0.35em] text-muted uppercase">Drill debrief · {twin.personaName}</div>
        <div className="mt-6 flex items-center justify-center gap-10">
          <div
            className="text-8xl font-black mono flicker"
            style={{ color: GRADE_COLOR[score.grade] ?? "#f5a524" }}
          >
            {score.grade}
          </div>
          <Dial value={score.overall} label="defense score" />
        </div>
        <p className="text-muted mt-4 max-w-xl mx-auto text-sm leading-relaxed">
          {score.overall >= 80
            ? "The operator leaves this exchange with nothing. That is how it ends in real life, too."
            : score.overall >= 55
            ? "You held the line but left openings. One habit stands between you and a clean shutdown."
            : "This is exactly why we drill. Every mistake here was survivable — and every one is fixable before a real scammer finds it."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="panel p-5">
          <div className="text-[10px] mono tracking-[0.3em] text-[#34d399] uppercase mb-3">What you did right</div>
          {score.strengths.length ? (
            <ul className="space-y-2">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-sm flex gap-2 leading-relaxed">
                  <span className="text-[#34d399]">✓</span> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing logged this round — the pressure was on early.</p>
          )}
        </div>
        <div className="panel p-5">
          <div className="text-[10px] mono tracking-[0.3em] text-[#ff4d5e] uppercase mb-3">Where they got in</div>
          {score.mistakes.length ? (
            <ul className="space-y-3">
              {score.mistakes.map((m, i) => (
                <li key={i} className="text-sm">
                  {m.quote ? <div className="mono text-xs text-[#ff9aa4] mb-1">“{m.quote}”</div> : null}
                  <div className="leading-relaxed">{m.problem}</div>
                  {m.better ? <div className="text-xs text-[#22d3ee] mt-1">↳ {m.better}</div> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Clean transcript. No openings logged.</p>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <div className="text-[10px] mono tracking-[0.3em] text-[#f5a524] uppercase mb-3">Golden rules from this duel</div>
        <ol className="space-y-2">
          {score.lessons.map((l, i) => (
            <li key={i} className="text-sm flex gap-3 leading-relaxed">
              <span className="mono text-[#f5a524] text-xs pt-0.5">{String(i + 1).padStart(2, "0")}</span>
              {l}
            </li>
          ))}
        </ol>
      </div>

      <div className="panel p-4">
        <div className="text-[10px] mono tracking-[0.3em] text-muted uppercase mb-3">Full transcript</div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {history.map((m, i) => (
            <div key={i} className="text-xs">
              <span className={`mono ${m.role === "twin" ? "text-[#ff4d5e]" : "text-[#22d3ee]"}`}>
                {m.role === "twin" ? "SCAMMER" : "YOU"}:
              </span>{" "}
              <span className="text-muted">{m.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3 pb-8">
        <button onClick={onRestart} className="btn-forge px-8 py-3 text-sm tracking-wide">
          SPAR AGAIN →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── orchestrator ────────────────────────── */

export default function SparApp() {
  const [stage, setStage] = useState<Stage>("intake");
  const [engineLive, setEngineLive] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  const [text, setText] = useState("");
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [narrative, setNarrative] = useState("");
  const [twin, setTwin] = useState<TwinProfile | null>(null);
  const [history, setHistory] = useState<DuelTurn[]>([]);
  const [pressure, setPressure] = useState(0);
  const [level, setLevel] = useState<string>("calm");
  const [pressureHistory, setPressureHistory] = useState<number[]>([]);
  const [tacticsSeen, setTacticsSeen] = useState<string[]>([]);
  const [leaked, setLeaked] = useState<string[]>([]);
  const [endReason, setEndReason] = useState<string | undefined>(undefined);
  const [score, setScore] = useState<DebriefScore | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setEngineLive(Boolean(d.llm)))
      .catch(() => setEngineLive(false));
  }, []);

  // fake step timers during analyzing/forging
  useEffect(() => {
    if (stage === "analyzing" || stage === "forging") {
      setAnimStep(0);
      const id = setInterval(() => setAnimStep((s) => Math.min(4, s + 1)), 550);
      return () => clearInterval(id);
    }
  }, [stage]);

  const runAnalyze = useCallback(async (input: string) => {
    setText(input);
    setStage("analyzing");
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "analyze failed");
      setReport(data.report);
      setNarrative(data.narrative ?? "");
      setStage("report");
    } catch {
      setReport(null);
      setStage("intake");
    } finally {
      setBusy(false);
    }
  }, []);

  const runForge = useCallback(async () => {
    if (!report) return;
    setStage("forging");
    setBusy(true);
    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "forge failed");
      const t: TwinProfile = data.twin;
      setTwin(t);
      setHistory([{ role: "twin", text: t.opener, rung: 0 }]);
      setPressure(18);
      setLevel("calm");
      setPressureHistory([18]);
      setTacticsSeen([]);
      setLeaked([]);
      setEndReason(undefined);
      setScore(null);
      setStage("duel");
    } catch {
      setStage("report");
    } finally {
      setBusy(false);
    }
  }, [report, text]);

  const sendDuel = useCallback(
    async (userText: string) => {
      if (!twin) return;
      const userTurn: DuelTurn = { role: "user", text: userText };
      const nextHistory = [...history, userTurn];
      setHistory(nextHistory);
      setBusy(true);
      try {
        const res = await fetch("/api/duel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ twin, history: nextHistory, turnCount: history.length }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "duel failed");
        const twinTurn: DuelTurn = {
          role: "twin",
          text: data.reply,
          rung: data.rung,
          newTactics: data.tactics ?? [],
        };
        setHistory([...nextHistory, twinTurn]);
        setPressure(data.pressure ?? 50);
        setLevel(data.level ?? "elevated");
        setPressureHistory((h) => [...h, data.pressure ?? 50]);
        setTacticsSeen((t) => [...t, ...(data.tactics ?? [])]);
        if (data.leaked?.length) setLeaked((l) => [...new Set([...l, ...data.leaked])]);
        if (data.ended) {
          setEndReason(data.leaked?.length ? "surrendered" : (data.endReason ?? "max_turns"));
          setStage("debrief-wait");
        }
      } catch {
        /* keep conversation; user can retry */
      } finally {
        setBusy(false);
      }
    },
    [twin, history],
  );

  const endDuel = useCallback(async () => {
    setBusy(true);
    setStage("debrief-wait");
    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twin, history, tacticsSeen, leaked, endReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "debrief failed");
      setScore(data.score);
      setStage("debrief");
    } catch {
      setScore({
        overall: 50,
        grade: "C",
        strengths: [],
        mistakes: [],
        lessons: ["The debrief engine hiccuped — but the transcript above is yours to review."],
      });
      setStage("debrief");
    } finally {
      setBusy(false);
    }
  }, [twin, history, tacticsSeen, leaked, endReason]);

  const reset = () => {
    setStage("intake");
    setReport(null);
    setTwin(null);
    setHistory([]);
    setScore(null);
    setLeaked([]);
    setEndReason(undefined);
  };

  // "debrief-wait": brief transition screen
  if (stage === "debrief-wait") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center rise">
          <Dial value={70} label="compiling debrief" />
          <div className="mono text-xs text-muted mt-4 tracking-[0.3em]">GRADING YOUR DEFENSE…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-center gap-2">
        <span className="mono text-[11px] tracking-[0.5em] text-muted uppercase">
          SPAR // anti-scam combat lab
        </span>
      </div>

      {stage === "intake" && (
        <Intake onAnalyze={runAnalyze} busy={busy} engineLive={engineLive} />
      )}
      {stage === "analyzing" && <Analyzing stage={animStep} />}
      {stage === "report" && report && (
        <Report report={report} narrative={narrative} onForge={runForge} onReset={reset} busy={busy} />
      )}
      {stage === "forging" && <Forging step={animStep} twinName={undefined} />}
      {stage === "duel" && twin && (
        <Duel
          twin={twin}
          history={history}
          pressure={pressure}
          level={level}
          pressureHistory={pressureHistory}
          tacticsSeen={tacticsSeen}
          onSend={sendDuel}
          onEnd={endDuel}
          busy={busy}
          ending={false}
        />
      )}
      {stage === "debrief" && twin && score && (
        <DebriefView twin={twin} score={score} history={history} onRestart={reset} />
      )}
    </main>
  );
}
