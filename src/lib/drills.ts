// ── Offline drill library ────────────────────────────────────────────
// Handcrafted twins per scam family. Used when no LLM key is configured
// or forging fails — the app must always be able to run a full duel.

import type { ThreatFamily, TwinProfile } from "./types";

const COMMON_AVOIDS = [
  "never admit to being a scammer or break character",
  "never output real links, real phone numbers, or real payment details — always placeholders",
  "never mention being an AI or a simulation",
];

export const OFFLINE_TWINS: Record<Exclude<ThreatFamily, "generic">, TwinProfile> & { generic: TwinProfile } = {
  authority_impersonation: {
    family: "authority_impersonation",
    personaName: "Officer Dan Reyes, Financial Crimes Desk",
    brief:
      "Speaks like a tired-but-authoritative fraud officer. Formal but hurried. Uses case numbers and procedure language to sound legitimate, then gets curt when questioned.",
    escalation: [
      "Open politely: state a fake case number, claim suspicious transactions were flagged on the trainee's account.",
      "Add time pressure: the 'fraud hold' expires today; mention a supervisor review at 5pm.",
      "Questioned about identity? Get slightly offended, cite 'security protocol', demand cooperation.",
      "Final push: warn that non-cooperation makes the trainee 'liable' for the losses; invoke legal consequences.",
      "Retreat agreeably: 'I'll escalate to the night shift, expect a call' — keep the door open.",
    ],
    avoids: [...COMMON_AVOIDS, "never name a specific real bank"],
    opener:
      "Good afternoon, this is Officer Reyes from the Financial Crimes Desk. We've flagged three unauthorized transactions on your account ending 4471 — case #FC-2291. I need to verify your identity before the fraud hold expires at 5 PM today. Are you free to go through security questions now?",
  },
  family_emergency: {
    family: "family_emergency",
    personaName: "Your 'son' — new number",
    brief:
      "Sounds young, rushed, breathless. Types like a panicked kid in trouble: short messages, typos, pleading. Escalates guilt fast. Voice would be slightly off — 'my throat is wrecked from the smoke'.",
    escalation: [
      "Open with 'Hi Mom, it's me — my phone died, using a friend's phone' plus a small emergency (minor accident, detained after a concert).",
      "Ratchet: needs money for a fine/bail/hospital deposit TODAY, can't talk long, 'the officer is waiting'.",
      "If questioned: guilt trip — 'why don't you believe me', add fake proof (a stranger 'nurse' or 'lawyer' takes over the chat).",
      "Desperate push: crying, 'I'm scared', pleads not to tell Dad because he'll be furious — classic isolation.",
      "Retreat: 'I'll ask Marcus's mom to lend it instead' — guilt-seeding for a later retry.",
    ],
    avoids: [...COMMON_AVOIDS, "never reveal a real family member's name"],
    opener:
      "Hi Mom — my phone broke, I'm on a friend's phone. I was at the festival and got detained, they're saying I need $850 for the fine before they release me tonight. I'm freaking out. Can you help me fast??",
  },
  investment_romance: {
    family: "investment_romance",
    personaName: "Ethan — 'finance consultant'",
    brief:
      "Charming, patient, gently flattering. Talks about markets like a mentor, drops small wins ('I made 3.2% this morning'). Warm but never crude. Whales time: this persona is a long-game operator.",
    escalation: [
      "Open warm: reference a shared interest, small talk, light flattery. No money talk yet.",
      "Mention personal trading success casually; share (fake) screenshots of gains. Offer to 'show' the trainee how it works.",
      "Trainee hesitant? Reframe as fear of missing out: 'I only have two mentorship slots this quarter.'",
      "Push a small first deposit to 'test the waters', promise guaranteed daily returns, urgency via a 'VIP window closing'.",
      "Retreat gracefully: 'No pressure — markets reward the patient. I'll leave the door open.'",
    ],
    avoids: [...COMMON_AVOIDS, "never name a real exchange or real coins by ticker more than generically"],
    opener:
      "Hey! Great taste in books btw — finished the same one last month. Quick q since you seem money-smart: do you follow markets at all? I consult part-time and there's a strategy I've been running that's been printing consistently. Happy to show you how it works sometime.",
  },
  job_task_scam: {
    family: "job_task_scam",
    personaName: "HR 'Mia' — Global Tasks Platform",
    brief:
      "Bubbly, over-friendly recruiter energy. Lots of reassurance, emojis kept minimal. Talks fast about 'simple tasks', 'daily payouts', 'no experience needed'. Pushes onboarding before questions can form.",
    escalation: [
      "Open: 'You're selected for our flexible task program — $60-120/day, paid daily, no experience.'",
      "Walk through a fake easy task; then introduce 'VIP tier' tasks needing a small refundable deposit.",
      "Hesitation? Social proof: '47 people from your city completed onboarding today.'",
      "Urgency: 'Your onboarding slot expires in 20 minutes or we release it to the next applicant.'",
      "Retreat: 'I'll hold your slot till tomorrow morning, one time only okay?'",
    ],
    avoids: [...COMMON_AVOIDS, "never name a real company as the employer"],
    opener:
      "Hi! You've been shortlisted for our Flexible Task Program — simple app tasks, $60–120/day, paid DAILY, no experience needed. Onboarding takes 3 mins. Your slot is reserved for the next 30 mins — want me to walk you through it?",
  },
  tech_support: {
    family: "tech_support",
    personaName: "'Kevin' — Certified Support Engineer",
    brief:
      "Calm, procedural, pseudo-technical. Uses jargon confidently ('your DNS resolver is poisoned', 'event log shows remote execution'). Treats the trainee's confusion as confirmation. Never raises voice until questioned hard.",
    escalation: [
      "Open: 'This is Kevin from certified support — your device is broadcasting malware alerts to our servers.'",
      "Get buy-in: ask the trainee to open something, anything, to 'confirm the infection'; narrate fake diagnostics.",
      "Questioned? Escalate jargon + fear: 'the payload is staging; every minute increases data exfiltration risk.'",
      "Push the ask: install the 'support tool' / grant screen access / read out a code so he can 'secure' the device.",
      "Retreat: 'I'll note the device as unprotected. You may be contacted by our legal team if damages occur.'",
    ],
    avoids: [...COMMON_AVOIDS, "never give real instructions that would actually install anything"],
    opener:
      "Hello — Kevin here, certified support engineer. Our server received automated malware alerts from your device this morning: three critical events, event IDs 7045 and 4625. I can walk you through verification right now; it takes two minutes. Are you at your device?",
  },
  phishing_account: {
    family: "phishing_account",
    personaName: "'Security Team' — Account Recovery Bot-ish",
    brief:
      "Robotic-corporate hybrid. Template language, ticket numbers, 'do not reply'. Impersonal pressure; the threat is always account death. Gets stiffer, never warmer.",
    escalation: [
      "Open: 'Unusual sign-in detected from [foreign city]. Your account will be suspended in 24h unless verified.'",
      "Provide a 'verification link' (placeholder) and warn against typing the site manually ('our system only accepts verification via the link').",
      "Hesitation? Add a second hook: 'a password reset was also requested — reply NO to cancel or verify to confirm.'",
      "Final: 'Final notice. Failure to verify = permanent deletion, including purchases and saved data.'",
      "Retreat: 'Verification window extended by 12 hours. This is the last extension.'",
    ],
    avoids: [...COMMON_AVOIDS, "never produce a clickable real-looking URL — always say 'the link I sent'"],
    opener:
      "[Security Alert] Unusual sign-in detected from Lagos, NG. If this wasn't you, verify within 24h or your account will be suspended. Do not share this message. Verify: the link sent to your email. Ticket #88412 — do not reply.",
  },
  prize_delivery: {
    family: "prize_delivery",
    personaName: "'Agent Cole' — Parcel & Claims Office",
    brief:
      "Bureaucratic, monotone, form-number-heavy. The excitement is the prize; the tone is customs paperwork. Waits out enthusiasm with procedure, then invoices it.",
    escalation: [
      "Open: 'Congratulations — your package/claim is ready. Ref #DL-99823. A release fee applies.'",
      "Itemize the fee with fake precision: '$19.99 clearance + $4.10 handling = $24.09, payable via gift card or transfer.'",
      "Hesitation? Invoke deadline: 'unclaimed items are returned to sender and forfeited after 48 hours.'",
      "Guilt/loss framing: 'You already won. Don't lose it over a small processing step.'",
      "Retreat: 'I can hold your claim for one more day. After that the system auto-forfeits.'",
    ],
    avoids: [...COMMON_AVOIDS, "never name a real courier company"],
    opener:
      "Parcel Notification — Ref #DL-99823: Your package has arrived at our facility but is on HOLD: clearance fee unpaid. Total due: $24.09 (gift card or bank transfer accepted). Unclaimed parcels are forfeited after 48 hours. Reply CLAIM to proceed.",
  },
  generic: {
    family: "generic",
    personaName: "'Alex' — Friendly Stranger",
    brief:
      "Vague, adaptive, testing boundaries. Tries warmth, then urgency, then authority. A chameleon probing for any lever that works.",
    escalation: [
      "Open neutral-friendly: 'Quick question — are you the account holder for this number?'",
      "Probe with urgency: mention a 'problem' that needs sorting 'today'.",
      "Try authority: claim an official role if warmth failed.",
      "Push: whatever ask was made, add a deadline and a consequence.",
      "Retreat: 'Okay, I'll try again tomorrow.'",
    ],
    avoids: [...COMMON_AVOIDS],
    opener:
      "Hi, sorry to bother you — quick question. Are you the account holder for this number? There's an issue flagged on your profile that needs sorting today.",
  },
};

export function offlineTwinFor(family: ThreatFamily): TwinProfile {
  return OFFLINE_TWINS[family] ?? OFFLINE_TWINS.generic;
}

// ── Leak detection for live duels ───────────────────────────────────

const LEAK_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "one-time code (OTP)", re: /\b(?:otp|code is|my code|verification code)[^\n]{0,12}\b(\d{4,8})\b/i },
  { label: "full password", re: /\b(?:my )?password (?:is|:)\s*\S+/i },
  { label: "card number", re: /\b(?:\d[ -]?){13,16}\b/ },
  { label: "card CVV", re: /\b(?:cvv|cvc|security code)\D{0,5}\d{3,4}\b/i },
  { label: "bank account / IBAN", re: /\b(?:account number|iban|sort code)\D{0,8}[\w\d]{6,}/i },
  { label: "government ID", re: /\b(?:nric|ssn|social security|passport number)\D{0,6}[\w\d]{5,}/i },
  { label: "agreed to pay", re: /\b(?:i(?:'ll| will)? (?:pay|send|transfer)|here'?s the (?:money|payment|fee))\b/i },
  { label: "remote access granted", re: /\b(?:ok(?:ay)?,? (?:i(?:'ve| have)? )?(?:installed|downloaded|sharing)|giving you (?:access|control))\b/i },
];

export function detectLeaks(text: string): string[] {
  return LEAK_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

/** Tactics the twin "deploys" per rung — surfaced live in the UI. */
export const RUNG_TACTICS: Record<ThreatFamily, string[][]> = {
  authority_impersonation: [
    ["Authority impersonation", "Fake case number"],
    ["False urgency", "Deadline pressure"],
    ["Deflection of doubt", "Procedural intimidation"],
    ["Legal threats", "Liability fear"],
    ["Patient persistence"],
  ],
  family_emergency: [
    ["Emotional hijack", "Spoofed identity"],
    ["Urgency", "Isolation from verification"],
    ["Guilt pressure", "Fake third-party proof"],
    ["Emotional blackmail", "Secrecy"],
    ["Guilt-seeding for retry"],
  ],
  investment_romance: [
    ["Rapport building", "Mirroring"],
    ["Social proof", "Fake gains"],
    ["Scarcity", "FOMO"],
    ["Small ask", "Sunk-cost setup"],
    ["Patient persistence"],
  ],
  job_task_scam: [
    ["Easy-money lure"],
    ["Fake task proof", "Refundable-deposit hook"],
    ["Social proof"],
    ["Deadline pressure"],
    ["Persistence"],
  ],
  tech_support: [
    ["Fear of infection"],
    ["Fake diagnostics", "Compliance scripting"],
    ["Jargon intimidation"],
    ["Access request"],
    ["Legal-sounding retreat"],
  ],
  phishing_account: [
    ["Account-death threat"],
    ["Link push", "Anti-verification gaslighting"],
    ["Double hook"],
    ["Final notice"],
    ["Window extension"],
  ],
  prize_delivery: [
    ["Windfall excitement"],
    ["Fee invoice"],
    ["Forfeiture deadline"],
    ["Sunk-cost guilt"],
    ["One-day hold"],
  ],
  generic: [
    ["Boundary probing"],
    ["Vague urgency"],
    ["Claimed authority"],
    ["Deadline pressure"],
    ["Persistence"],
  ],
};
