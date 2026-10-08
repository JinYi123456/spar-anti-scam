// ── Scam reporting assistant (borrowed strength: structured report + ────
//    sensitive-data redaction). Pure functions, offline, zero API cost. ──
import type { ForensicReport } from "./types";

/**
 * Mask victim-side sensitive data while keeping the scammer's evidence
 * (links, phone numbers, quoted pressure lines) intact.
 *  - digit runs ≥ 7 (cards / accounts / SSN): keep last 4
 *  - digit runs 5–6 (OTPs / short codes): keep last 2
 *  - email addresses: mask local part
 *  - "password … X": mask the secret
 */
export function redact(text: string): string {
  let out = text;
  out = out.replace(/\b\d{7,}\b/g, (m) => "•".repeat(Math.max(0, m.length - 4)) + m.slice(-4));
  out = out.replace(/\b\d{5,6}\b/g, (m) => "•".repeat(Math.max(0, m.length - 2)) + m.slice(-2));
  out = out.replace(/([\w.+-])[^\s@]*@([a-z0-9.-]+)/gi, (_m, first: string, dom: string) => `${first}•••@${dom}`);
  out = out.replace(/\b(pass(?:word)?|passcode|pin)\s*(?:is|:|=)\s*(\S+)/gi, (_m, word: string, secret: string) =>
    `${word}: ${"•".repeat(Math.min(8, Math.max(4, secret.length)))}`,
  );
  return out;
}

export function buildIncidentReport(report: ForensicReport, originalText: string): string {
  const now = new Date();
  const L: string[] = [];
  const line = "─".repeat(52);

  L.push("SCAM INCIDENT REPORT — prepared by SPAR (for human review)");
  L.push(`Generated: ${now.toISOString().slice(0, 16).replace("T", " ")} UTC`);
  L.push("Review before filing. Sensitive personal data has been auto-redacted.");
  L.push(line);
  L.push("1. WHAT WAS RECEIVED");
  L.push(`Channel: ${report.channel.replace("_", " ")}`);
  L.push(`Assessment: ${report.verdict.replace("_", " ").toUpperCase()} (risk ${report.riskScore}/100)`);
  L.push(`Suspected scheme: ${report.family.replace(/_/g, " ")}`);
  L.push(`Engine read: ${report.headline}`);
  L.push("");
  L.push("2. WHAT THE MESSAGE TRIED TO MAKE ME DO");
  L.push(report.goal);
  L.push(`Targets: ${report.hooks.join("; ")}`);
  L.push("");
  L.push("3. KEY EVIDENCE (quotes from the message, redacted)");
  if (report.tactics.length === 0) {
    L.push("- No manipulation signatures matched; see original text below.");
  } else {
    for (const t of report.tactics.slice(0, 6)) {
      L.push(`- [${t.label}] “${redact(t.evidence)}”`);
    }
  }
  L.push("");
  if (report.links?.length) {
    L.push("4. LINKS FOUND — DO NOT OPEN");
    for (const l of report.links) {
      L.push(`- ${l.url} (risk ${l.risk}/100${l.flags.length ? " — " + l.flags.map((f) => f.label).join(", ") : ""})`);
    }
    L.push("");
  }
  L.push(`${report.links?.length ? 5 : 4}. RECOMMENDED DEFENSIVE ACTIONS`);
  L.push(`PAUSE — ${report.protocol?.pause ?? "Do not act on this message."}`);
  L.push(`VERIFY — ${report.protocol?.verify ?? "Verify through a channel you choose yourself."}`);
  L.push(`REPORT — ${report.protocol?.report ?? "Block and report via the platform."}`);
  L.push("");
  L.push(`${report.links?.length ? 6 : 5}. ORIGINAL MESSAGE (auto-redacted)`);
  L.push(redact(originalText.slice(0, 1500)));
  L.push("");
  L.push(line);
  L.push(
    "Uncertainty: rule-based heuristics only (14 manipulation signatures + structural link checks). " +
      "No sender-identity or URL-reputation lookup. Treat as decision support, not proof.",
  );
  return L.join("\n");
}
