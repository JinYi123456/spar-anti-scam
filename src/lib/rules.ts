// ── Deterministic forensic engine (works with ZERO api keys) ────────
// Every tactic has a machine key, regex evidence detectors, a weight,
// and a plain-language explanation. The LLM layer (analyze route) uses
// these findings as ground truth and layers narrative on top.

import type {
  Channel,
  ForensicReport,
  TacticHit,
  ThreatFamily,
  Verdict,
} from "./types";

interface TacticDef {
  key: string;
  label: string;
  weight: number; // 0–1 severity multiplier
  patterns: RegExp[];
  why: string;
  pressure?: Partial<ForensicReport["pressure"]>;
}

export const TACTICS: TacticDef[] = [
  {
    key: "urgency",
    label: "False urgency",
    weight: 0.85,
    patterns: [
      /\b(within (?:the next )?\d{1,2}\s*(?:minutes?|hours?|mins?))\b/i,
      /\b(act now|immediately|right now|asap|urgent(?:ly)?|last (?:chance|warning)|final (?:notice|reminder)|before it'?s too late|time[- ]sensitive)\b/i,
      /\b(\d{1,2}\s*(?:minutes|hours) (?:or|before))\b/i,
    ],
    why: "Real institutions never give you minutes to act. Countdown pressure is designed to stop you from thinking or checking.",
    pressure: { urgency: 85 },
  },
  {
    key: "threat_consequence",
    label: "Fear & consequences",
    weight: 0.9,
    patterns: [
      /\b(account (?:will be|has been|is been) (?:suspended|locked|blocked|frozen|closed|terminated)|deactivate|permanent(?:ly)? (?:ban|block|close)|legal action|lawsuit|arrest warrant|warrant (?:for|of) arrest|police|fined|penalt(?:y|ies)|criminal charges?\b)/i,
      /\b(your (?:funds|money|benefits|packages?|parcel|accounts?) (?:will be|has been) (?:seized|frozen|confiscated|held|blocked))\b/i,
      /\b(unauthori[sz]ed (?:login|access|transaction|device|activity)|suspicious (?:login|activity|transaction)|unusual (?:activity|sign[- ]?in))\b/i,
    ],
    why: "Scaring you about your money, freedom, or safety short-circuits rational checking. Real agencies correspond by letter, not countdown texts.",
    pressure: { fear: 90, urgency: 40 },
  },
  {
    key: "authority_claim",
    label: "Authority impersonation",
    weight: 0.9,
    patterns: [
      /\b(bank of [a-z ]+|[a-z]+ bank|hsbc|citi(?:bank)?|chase|wells fargo|revolut|maybank|cimb|ocbc|dbs|posb|bca|bri|gcash|paytm|phonepe|paypal(?: support)?|amazon(?: support)?|microsoft(?: support)?|apple(?: support)?|netflix|dhl|fedex|ups|usps|customs|lapd|fbi|cia|interpol|irs|hmrc|IRS|police (?:department|officer)|government|immigration|lHDN|LHDN)\b/,
      /\b(official|officer|agent|inspector|detective|supervisor|head of (?:security|fraud)|fraud (?:department|team)|security (?:department|team)|compliance (?:team|officer))\b/i,
      /\b(dear (?:customer|user|valued customer|account holder|sir\/madam))\b/i,
    ],
    why: "Borrowed authority makes you obey first and verify later. Institutions you can name can be verified by calling the number on their official site — never the one in the message.",
    pressure: { obedience: 85 },
  },
  {
    key: "payment_request",
    label: "Money movement request",
    weight: 1.0,
    patterns: [
      /\b(gift cards?|itunes|steam wallet|google play (?:card|code)|crypto(?:currency)?|bitcoin|btc|usdt|ethereum|eth\b|wire transfer|bank transfer|revolut|wise(?:\.com)?|zelle|venmo|cashapp|cash app|western union|moneygram|remitly)\b/i,
      /\b(pay (?:a|the|your) (?:fee|fine|deposit|tax|customs|clearance|release|processing)|processing fee|clearance fee|release fee|verification (?:fee|deposit)|refundable deposit|security deposit)\b/i,
      /\b(send|transfer|top ?up|deposit)\s+(?:\$|usd|rm|rp|₹|php|€|£)?\s?\d/i,
      /\b((?:bank|investment) account (?:number|details)|iban|swift (?:code)?|routing number|sort code)\b/i,
    ],
    why: "Any message that eventually asks you to move money — especially via gift cards or crypto — is a scam. Gift cards and crypto are untraceable by design.",
    pressure: { greed: 20, urgency: 30 },
  },
  {
    key: "credential_harvest",
    label: "Credential & OTP fishing",
    weight: 1.0,
    patterns: [
      /\b(verify your (?:account|identity|details)|confirm your (?:identity|account|details|login)|update your (?:payment|billing|password|credentials)|re[- ]?verify|click (?:the link|here) to (?:verify|confirm|unlock|restore|avoid))\b/i,
      /\b(otp|one[- ]time (?:password|code)|verification code|security code|pin\b).{0,40}(send|share|provide|tell|read)/i,
      /\b(login\.?[a-z0-9-]*\.(?:com|net|org)|[a-z0-9-]+-(?:secure|verify|login|support|account)\.[a-z]{2,}|bit\.ly|tinyurl|t\.co\/|shorturl|is\.gd)/i,
      /\bhttps?:\/\/(?:[^\s\/]+\.)*(?:xyz|top|click|link|shop|icu|buzz|monster|rest|sbs)\b/i,
      /\b(memorized?|remember) (?:your )?(?:password|passphrase|security word)/i,
    ],
    why: "Links to 'verify' your account and requests for your OTP or password are the payload of the scam. No real service will ever ask you to read out a one-time code.",
    pressure: { obedience: 60, urgency: 30 },
  },
  {
    key: "secrecy",
    label: "Secrecy & isolation",
    weight: 0.95,
    patterns: [
      /\b(don'?t tell|do not tell|don'?t inform|keep (?:this|it) (?:secret|confidential|between us)|confidential(?:ity)? (?:matter|case)|not (?:allowed|supposed) to (?:tell|disclose)|only (?:you|between) (?:and|us)|stay on the (?:line|phone|call))\b/i,
      /\b(your (?:family|relatives|parents|spouse|wife|husband|children) (?:must not|should not|cannot) (?:know|be informed|find out))\b/i,
    ],
    why: "Isolating you from the people who would spot the scam is the single strongest red flag. Legitimate matters survive a second opinion; scams don't.",
    pressure: { fear: 40, obedience: 50 },
  },
  {
    key: "remote_access",
    label: "Remote access demand",
    weight: 0.95,
    patterns: [
      /\b(anydesk|teamviewer|ultraviewer|remote (?:desktop|access|support|session)|screen (?:shar|mirr)or(?:ing)?|control (?:of|your) (?:device|computer|phone)|install this (?:app|software|program))\b/i,
      /\b(download|install)\s+[\"']?[A-Z][a-zA-Z]+ (?:app|application|viewer|support)/,
    ],
    why: "Handing over screen control gives the scammer your banking session, saved passwords, and email. Support teams you didn't call never need this.",
    pressure: { obedience: 70, urgency: 30 },
  },
  {
    key: "windfall",
    label: "Too-good windfall",
    weight: 0.8,
    patterns: [
      /\b(congratulations|you(?:'ve)? (?:been )?(?:selected|chosen|won)|winner|prize|lottery|sweepstake|inheritance|unclaimed (?:funds|money)|beneficiary|compensation)\b/i,
      /\b(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?)\s?(?:usd|usdt|\$|million|billion|btc|eth)\s*(?:prize|reward|won|inheritance|transfer)/i,
    ],
    why: "Money you never entered to win is bait. The 'small fee' to release it is the actual product being sold.",
    pressure: { greed: 90 },
  },
  {
    key: "guaranteed_returns",
    label: "Guaranteed investment returns",
    weight: 0.9,
    patterns: [
      /\b(guaranteed (?:profit|return|roi|income|daily)|risk[- ]free|fixed (?:return|income|daily)|passive income|\d+%\s*(?:daily|weekly|monthly|per day|per week|roi|return)|double your (?:money|investment|btc|crypto))\b/i,
      /\b(trading (?:signals?|group|channel|bot)|forex|binary option|pump|insider|vip (?:group|channel)|signal (?:group|provider))\b/i,
    ],
    why: "Guaranteed high returns do not exist. 'Risk-free' plus a deadline is the classic pig-butchering investment scam opening.",
    pressure: { greed: 85 },
  },
  {
    key: "relationship_rush",
    label: "Artificial intimacy",
    weight: 0.7,
    patterns: [
      /\b(my (?:dear|love|darling|sweetheart|honey)|dear friend|i (?:really )?(?:trust|feel|believe) you|you'?re (?:the only one|special)|we'?re (?:friends|family) (?:now|right)|trust me)\b/i,
      /\b(god bless|bless you|jesus|allah|buddha).{0,30}(bless|trust|love)/i,
    ],
    why: "Manufactured warmth, especially from a stranger with a financial opportunity attached, is the romance-scam intimacy ladder.",
    pressure: { greed: 30, obedience: 30 },
  },
  {
    key: "job_easy_money",
    label: "Easy-money job lure",
    weight: 0.8,
    patterns: [
      /\b(work from home|earn (?:\d+|\$)?\s*(?:daily|per day|weekly)|easy (?:money|job|income)|no experience|part[- ]?time.{0,30}(?:income|earn)|get paid (?:daily|instantly)|task(?:s)? (?:platform|app)|like[- ]?and[- ]?(?:earn|subscribe)|pre[- ]?paid task)\b/i,
      /\b(recruitment|hr manager|hiring now|offer letter|onboarding fee|training (?:fee|deposit))\b/i,
    ],
    why: "'Earn daily, no experience' jobs that ask for a training deposit or prepaid tasks are laundering operations wearing a job costume.",
    pressure: { greed: 80 },
  },
  {
    key: "family_emergency_play",
    label: "Family emergency pressure",
    weight: 0.9,
    patterns: [
      /\b(hi (?:mom|dad|mum|mother|father|ma|pa|grandma|grandpa|aunt|uncle)|it'?s (?:me,? )?(?:your (?:son|daughter|child)|[A-Z][a-z]+(?: your (?:son|daughter))))\b/,
      /\b(i(?:'m| am) (?:in )?(?:jail|arrested|hospital|hospitalized|the ER|an accident|detained|stuck abroad|trapped)|lost my (?:phone|wallet)|my phone (?:broke|is broken|died))\b/i,
      /\b(bail|bail money|lawyer fee|hospital bill|emergency (?:fund|money)|send money (?:now|quickly)|i need .{0,20}(?:urgent|right now|asap))\b/i,
    ],
    why: "'Hi Mom, I lost my phone' exploits parental reflex. The voice may be cloned from a 30-second social media video. Hang up and call your child's known number.",
    pressure: { fear: 80, urgency: 60 },
  },
  {
    key: "callback_bait",
    label: "Callback & reply bait",
    weight: 0.5,
    patterns: [
      /\b(call (?:us|me|this number) (?:back )?(?:now|immediately|at once)|reply (?:now|yes|stop|to confirm)|text (?:us|me) (?:back|at))\b/i,
      /\b(\+?\d[\d\s-]{7,})\s*(?:now|immediately)/,
    ],
    why: "A number to call that isn't the official one on the institution's website is a switchboard to the scam itself.",
  },
  {
    key: "spoofed_sender",
    label: "Sender impersonation artifacts",
    weight: 0.75,
    patterns: [
      /\b(this (?:is|is an) (?:automated|official) (?:message|email|notice)|do not reply to this (?:message|email)|noreply|no-?reply@)/i,
      /@(?!gmail\.com|yahoo\.com|hotmail\.com|outlook\.com)[a-z0-9.-]+\.(?:com|net|org)\b.*\b(official|support|security|team)\b/i,
      /\b(from the (?:desk|office) of|confidential to you alone|att:|attention:)\b/i,
    ],
    why: "Official-looking templates with reply-to addresses that don't match the claimed organization are costume, not identity.",
  },
];

const FAMILY_HINTS: { family: ThreatFamily; keys: string[] }[] = [
  { family: "family_emergency", keys: ["family_emergency_play"] },
  { family: "investment_romance", keys: ["guaranteed_returns", "relationship_rush", "windfall"] },
  { family: "job_task_scam", keys: ["job_easy_money"] },
  { family: "tech_support", keys: ["remote_access"] },
  { family: "phishing_account", keys: ["credential_harvest"] },
  { family: "prize_delivery", keys: ["windfall", "callback_bait"] },
  { family: "authority_impersonation", keys: ["authority_claim", "threat_consequence", "spoofed_sender"] },
];

export function detectChannel(text: string): Channel {
  if (/^call (?:transcript|recording)|\[[0-9]{2}:[0-9]{2}\]|^caller:/im.test(text)) return "call_transcript";
  if (/whatsapp|wa\.me/i.test(text)) return "whatsapp";
  if (/subject:|dear (?:sir|madam|customer)|@[\w.-]+\.(?:com|org|net)|unsubscribe/i.test(text)) return "email";
  if (text.length <= 180 && /https?:\/\//.test(text)) return "sms";
  return "chat";
}

export function detectFamily(text: string, hits: TacticHit[]): ThreatFamily {
  const keys = new Set(hits.map((h) => h.key));
  let best: ThreatFamily = "generic";
  let bestScore = 0;
  for (const { family, keys: famKeys } of FAMILY_HINTS) {
    const score = famKeys.filter((k) => keys.has(k)).reduce((acc, k) => {
      const t = hits.find((h) => h.key === k);
      return acc + (t?.weight ?? 0.5);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = family;
    }
  }
  if (best === "generic" && /bank|account (?:locked|suspended)/i.test(text)) return "authority_impersonation";
  return best;
}

const FAMILY_HEADLINES: Record<ThreatFamily, string> = {
  authority_impersonation: "Authority costume: someone's wearing a badge they don't own",
  family_emergency: "Family-emergency play: exploiting love at panic speed",
  investment_romance: "Honey-trap finance: warmth first, wallet later",
  job_task_scam: "Fake job: a laundering queue dressed as employment",
  tech_support: "Tech-support trap: they need 'access', you need to hang up",
  phishing_account: "Credential harvest: the link IS the payload",
  prize_delivery: "Windfall bait: congratulations, now pay the 'fee'",
  generic: "Manipulation patterns detected",
};

export function runForensics(text: string): ForensicReport {
  const trimmed = text.trim();
  const channel = detectChannel(trimmed);
  const tactics: TacticHit[] = [];
  const pressure = { urgency: 0, fear: 0, greed: 0, obedience: 0 };

  for (const def of TACTICS) {
    for (const re of def.patterns) {
      const m = trimmed.match(re);
      if (m) {
        tactics.push({
          key: def.key,
          label: def.label,
          evidence: (m[0] ?? "").slice(0, 90),
          weight: def.weight,
          why: def.why,
        });
        if (def.pressure) {
          pressure.urgency = Math.max(pressure.urgency, def.pressure.urgency ?? 0);
          pressure.fear = Math.max(pressure.fear, def.pressure.fear ?? 0);
          pressure.greed = Math.max(pressure.greed, def.pressure.greed ?? 0);
          pressure.obedience = Math.max(pressure.obedience, def.pressure.obedience ?? 0);
        }
        break; // one hit per tactic is enough
      }
    }
  }

  const rawScore = tactics.reduce((acc, t) => acc + t.weight * 22, 0);
  const distinct = new Set(tactics.map((t) => t.key)).size;
  const riskScore = Math.min(98, Math.round(rawScore + distinct * 3));

  const verdict: Verdict = riskScore >= 60 ? "scam" : riskScore >= 30 ? "suspicious" : "likely_safe";
  const family = detectFamily(trimmed, tactics);

  const hooks: string[] = [];
  if (/otp|one[- ]time|verification code|password|pin\b/i.test(trimmed)) hooks.push("Your one-time codes / passwords");
  if (/click|link|http|bit\.ly|verify/i.test(trimmed)) hooks.push("A click on their link");
  if (/gift card|crypto|transfer|wire|deposit|fee|pay/i.test(trimmed)) hooks.push("A payment or transfer");
  if (/anydesk|teamviewer|remote|install/i.test(trimmed)) hooks.push("Remote control of your device");
  if (/id|ic |passport|nric|ssn|date of birth/i.test(trimmed)) hooks.push("Identity documents / personal data");
  if (hooks.length === 0) hooks.push("Your trust and a reply");

  return {
    verdict,
    riskScore,
    headline: FAMILY_HEADLINES[family],
    family,
    channel,
    tactics,
    pressure,
    goal:
      verdict === "likely_safe"
        ? "No manipulation playbook detected in this text."
        : "Push you into acting before you verify — through the channel they control.",
    hooks,
    advice: buildAdvice(family, tactics),
    signature: buildSignature(trimmed, tactics, family),
  };
}

function buildAdvice(family: ThreatFamily, tactics: TacticHit[]): string[] {
  const base: string[] = [];
  const keys = new Set(tactics.map((t) => t.key));
  if (keys.has("authority_claim"))
    base.push("Hang up. Call the organization back on the number printed on their official website or your card — never a number from the message.");
  if (keys.has("family_emergency_play"))
    base.push("Call your relative on their usual number. Agree on a family safe-word today so 'Hi Mom' emergencies can be verified in five seconds.");
  if (keys.has("credential_harvest"))
    base.push("Never tap the link. Open the app or type the site yourself. A one-time code is a door key: anyone who asks for it is already inside.");
  if (keys.has("payment_request"))
    base.push("Gift cards, crypto and wire transfers to 'release' money are always the scam itself. No legitimate fee works this way.");
  if (keys.has("guaranteed_returns") || keys.has("windfall"))
    base.push("Guaranteed returns and unexpected prizes are mathematical impossibilities. Whatever they show you 'growing' in an app is a drawing, not money.");
  if (keys.has("remote_access"))
    base.push("Never install apps or share screens for someone who contacted you. Real support doesn't need to watch your banking.");
  if (keys.has("secrecy"))
    base.push("Anyone who asks you to keep a secret from your family is telling you who to call. Break the secrecy immediately.");
  if (base.length === 0)
    base.push("Slow down: no real institution imposes deadlines by text. Verify through an official channel before you reply.");
  base.push("Report and block: most platforms can report the number in two taps — every report protects the next target.");
  return base;
}

function buildSignature(text: string, tactics: TacticHit[], family: ThreatFamily): string {
  const tacticKeys = [...new Set(tactics.map((t) => t.key))].sort().join("+");
  const nums = (text.match(/\d+/g) ?? []).slice(0, 3).join("-");
  return `${family}|${tacticKeys}|${nums}|${text.length}`;
}
