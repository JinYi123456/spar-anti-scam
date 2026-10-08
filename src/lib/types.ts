// ── SPAR core domain types ──────────────────────────────────────────
// Pipeline: Analyze (forensics) → Forge (digital twin scammer) → Duel (drills)

import type { UrlFinding } from "./urls";

export type ThreatFamily =
  | "authority_impersonation" // bank, police, government, IT support
  | "family_emergency"        // "Hi Mom" voice-clone, kidnapped relative
  | "investment_romance"      // pig-butchering, crypto "opportunities"
  | "job_task_scam"           // fake jobs, easy-money tasks, refund fraud
  | "tech_support"            // fake virus, remote access requests
  | "phishing_account"        // credential harvest, OTP requests
  | "prize_delivery"          // fake winnings, parcel customs fees
  | "generic";

export type Channel = "sms" | "whatsapp" | "email" | "call_transcript" | "chat" | "social";

export type Verdict = "scam" | "suspicious" | "likely_safe";

/** Three-step defensive protocol surfaced with every autopsy. */
export interface DefensiveProtocol {
  pause: string;
  verify: string;
  report: string;
  /** "For this to be legitimate, X would have to be true — and it isn't." */
  counterfactual: string;
}

export interface TacticHit {
  /** Machine key of the tactic */
  key: string;
  /** Short label, e.g. "False urgency" */
  label: string;
  /** Quote from the message that triggered this (trimmed) */
  evidence: string;
  /** 0–1 confidence from the engine that produced it */
  weight: number;
  /** One-sentence explanation written for a non-technical reader */
  why: string;
}

export interface ForensicReport {
  verdict: Verdict;
  /** 0–100 composite risk score */
  riskScore: number;
  /** Human headline, e.g. "Classic bank-impersonation pressure play" */
  headline: string;
  family: ThreatFamily;
  channel: Channel;
  tactics: TacticHit[];
  /** Emotional lever profile — powers the pressure gauge */
  pressure: {
    urgency: number;   // 0–100
    fear: number;
    greed: number;
    obedience: number; // deference to claimed authority
  };
  /** What the scammer wants, in plain words */
  goal: string;
  /** What data/money they're fishing for */
  hooks: string[];
  /** Personalized counter-strategy for THIS message */
  advice: string[];
  /** Safe reply the user could send — never confrontational */
  safeReply?: string;
  /** Per-link structural inspection (borrowed strength: link safety agent) */
  links?: UrlFinding[];
  /** PAUSE / VERIFY / REPORT defensive protocol + counterfactual check */
  protocol?: DefensiveProtocol;
  /** Honest uncertainty statement shown with the verdict */
  uncertainty?: string;
  /** Signature used to seed the digital twin */
  signature: string;
}

export interface TwinProfile {
  /** Display name the persona uses in drills */
  personaName: string;
  /** One-paragraph character brief for the actor LLM */
  brief: string;
  /** Escalation ladder: how pressure ramps across turns */
  escalation: string[];
  /** Things this persona must never say (keeps drills realistic, not cartoonish) */
  avoids: string[];
  /** The original scam family it mimics */
  family: ThreatFamily;
  opener: string;
}

export interface DuelTurn {
  role: "twin" | "user";
  text: string;
  /** For twin turns: which escalation rung this maps to (0-based) */
  rung?: number;
  /** New tactics that appeared in this twin message */
  newTactics?: string[];
}

export type PressureLevel = "calm" | "elevated" | "high" | "critical";

export interface DuelState {
  sessionId: string;
  twin: TwinProfile;
  history: DuelTurn[];
  turnCount: number;
  /** Live composite pressure 0–100 */
  pressure: number;
  level: PressureLevel;
  /** Tactics the twin has deployed so far in this duel */
  tacticsSeen: string[];
  /** Set when the duel ends */
  ended: boolean;
  endReason?: "defused" | "exposed" | "surrendered" | "burned" | "max_turns";
  /** If user data was phished during the drill */
  compromised: boolean;
  leaked: string[];
}

export interface DebriefScore {
  /** 0–100 */
  overall: number;
  grade: string; // S / A / B / C / D
  strengths: string[];
  mistakes: { turn: number; quote: string; problem: string; better: string }[];
  /** Golden-rule takeaways */
  lessons: string[];
}

export interface Debrief extends DuelState {
  score: DebriefScore;
}

export interface DriftLogEntry {
  ts: string;
  model: string;
  route: "analyze" | "forge" | "duel" | "debrief";
  ok: boolean;
  ms: number;
  error?: string;
}
