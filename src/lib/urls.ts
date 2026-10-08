// ── Link safety inspector (borrowed strength: "QR and link safety agent") ──
// Pure offline heuristics — no reputation API, no network. Every finding says
// so. This powers the "🔗 Link autopsy" section of the forensic report.

export interface UrlFlag {
  label: string;
  why: string;
}

export interface UrlFinding {
  url: string;
  host: string;
  /** 0–100 structural risk (heuristic, not a reputation score) */
  risk: number;
  flags: UrlFlag[];
  note: string;
}

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "rb.gy",
  "shorturl.at", "ow.ly", "buff.ly", "rebrand.ly", "tiny.cc", "bit.do", "lnkd.in",
]);

const RISKY_TLDS = new Set([
  "xyz", "top", "click", "link", "shop", "icu", "buzz", "monster", "rest",
  "sbs", "work", "cfd", "quest", "lol", "cyou",
]);

const BRANDS = [
  "paypal", "hsbc", "maybank", "cimb", "ocbc", "dbs", "posb", "chase",
  "wellsfargo", "wells-fargo", "amazon", "apple", "icloud", "netflix",
  "microsoft", "office365", "outlook", "dhl", "fedex", "ups", "usps",
  "revolut", "wise", "gcash", "lazada", "shopee", "singpass", "irs", "hmrc",
  "facebook", "instagram", "whatsapp", "gmail",
];

function extractUrls(text: string): string[] {
  const explicit = new Set<string>();
  // Explicit URLs
  for (const m of text.matchAll(/https?:\/\/[^\s<>"')]+/gi)) {
    explicit.add(m[0].replace(/[.,;:!?]+$/, ""));
  }
  // Bare domains, e.g. "jobs-portal-verify.com/onboard"
  const found = new Set<string>(explicit);
  for (const m of text.matchAll(/\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"')]*)?/gi)) {
    const candidate = m[0].replace(/[.,;:!?]+$/, "");
    // skip obvious file names / version numbers that sneaked through
    if (/\.(png|jpe?g|gif|pdf|docx?|xlsx?|zip|mp4)$/i.test(candidate)) continue;
    // skip candidates already covered by an explicit URL from this text
    if ([...explicit].some((u) => u.includes(candidate))) continue;
    found.add(candidate);
  }
  return [...found].slice(0, 8);
}

/** Rough registrable domain = last two labels (heuristic; not a full PSL). */
function registrable(host: string): string {
  const labels = host.split(".");
  return labels.length >= 2 ? labels.slice(-2).join(".") : host;
}

function inspectUrl(raw: string): UrlFinding {
  const hasScheme = /^https?:\/\//i.test(raw);
  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? raw : `http://${raw}`);
  } catch {
    return { url: raw, host: raw, risk: 15, flags: [{ label: "Malformed URL", why: "Doesn't parse as a valid address — a hallmark of hand-made phishing links." }], note: "Malformed link — do not open." };
  }

  const host = parsed.hostname.toLowerCase();
  const labels = host.split(".");
  const reg = registrable(host);
  let risk = 0;
  const flags: UrlFlag[] = [];

  if (!hasScheme) {
    risk += 5;
    flags.push({ label: "Bare domain", why: "Shown without https:// — common in SMS because it evades some link scanners." });
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    risk += 35;
    flags.push({ label: "Raw IP address", why: "A real institution never sends you to a bare IP. This bypasses domain reputation entirely." });
  }
  if (host.includes("xn--")) {
    risk += 30;
    flags.push({ label: "Lookalike (punycode) domain", why: "xn-- means non-ASCII characters — often used to fake letters, e.g. аpple.com with a Cyrillic 'а'." });
  }
  if (parsed.username || raw.includes("@")) {
    risk += 30;
    flags.push({ label: "Hidden redirect (@-trap)", why: "Text before the @ is ignored; you actually land on whatever follows it." });
  }
  if (SHORTENERS.has(reg)) {
    risk += 20;
    flags.push({ label: "Link shortener", why: "The real destination is hidden behind a redirect — you can't see where you're going." });
  }
  if (RISKY_TLDS.has(labels[labels.length - 1])) {
    risk += 25;
    flags.push({ label: `High-abuse .${labels[labels.length - 1]} domain`, why: "This TLD is cheap, instant, and heavily used in phishing campaigns." });
  }
  const brandHit = BRANDS.find((b) => host.replace(/-/g, "").includes(b));
  if (brandHit && !reg.replace(/-/g, "").includes(brandHit)) {
    risk += 30;
    flags.push({ label: `Brand token "${brandHit}" outside the real domain`, why: `The name appears only in a subdomain/label — the site you actually reach is ${reg}, which no real ${brandHit} uses.` });
  }
  if (labels.length >= 4) {
    risk += 10;
    flags.push({ label: "Deep subdomain chain", why: "Long prefix chains are used to make the real domain (the last two labels) hard to see on a phone." });
  }
  if ((host.match(/-/g) ?? []).length >= 3) {
    risk += 10;
    flags.push({ label: "Hyphen stuffing", why: "Multi-hyphen hosts like secure-verify-account are classic phishing-camouflage." });
  }
  if (parsed.protocol === "http:" && hasScheme) {
    risk += 25;
    flags.push({ label: "Unencrypted (http://)", why: "No TLS. Any credentials you enter travel in the clear." });
  }
  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    risk += 10;
    flags.push({ label: "Unusual port", why: "Non-standard ports almost never appear on legitimate consumer sites." });
  }
  if (raw.length > 90) {
    risk += 5;
    flags.push({ label: "Unusually long URL", why: "Length buries the real domain past the edge of a phone screen." });
  }

  risk = Math.min(100, risk);
  const note =
    risk >= 60
      ? "High-risk link — do not open it."
      : risk >= 30
      ? "Suspicious link — inspect before you even consider opening."
      : risk > 0
      ? "Minor structural flags — verify the sender through a channel you choose."
      : "No structural red flags found. This is NOT proof the site is safe — heuristics only.";

  return { url: raw, host, risk, flags, note };
}

export function inspectLinks(text: string): UrlFinding[] {
  return extractUrls(text).map(inspectUrl);
}
