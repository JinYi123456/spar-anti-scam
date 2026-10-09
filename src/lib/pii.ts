// ── PII redaction — runs BEFORE any text reaches an external LLM ────────
// Borrowed strength: TRUST//INTERCEPT's pii_redact tool. Regex-first,
// deliberately biased toward over-redaction: a false positive costs nothing,
// a missed card number costs privacy. The deterministic forensics engine and
// the evidence quotes still run on the user's original text — redaction only
// guards the copy that leaves for hosted inference.

export interface PiiFinding {
  type: "IC_NRIC" | "SSN" | "CREDIT_CARD" | "OTP" | "EMAIL" | "PHONE_NUMBER";
  placeholder: string;
}

interface RedactResult {
  text: string;
  findings: PiiFinding[];
}

const NRIC_RE = /\b[STFG]\s?\d{7}\s?[A-Z]\b/gi;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
// 13–19 digits, optionally separated by single spaces/dashes; Luhn-validated
// so order numbers like "Ref #DL-99823" are untouched.
const CARD_RE = /\b(?:\d[ -]?){12,18}\d\b/g;
// OTP codes are anchored to a keyword and only the DIGITS are replaced, so
// downstream cue detection still sees the word "OTP" / "verification code".
const OTP_FORWARD_RE =
  /(\b(?:otp|one[- ]time (?:password|pin|passcode)|passcode|password|pin|verification code|security code)\b\D{0,12}?)(\d{4,8})(?!\d)/gi;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
// 8+ digit runs with optional separators — also catches dates; over-redaction
// is the safe failure mode.
const PHONE_RE = /(?<!\d)(?:\+?\d[\d\s\-()]{6,16}\d)(?!\d)/g;

function luhnOk(digits: string): boolean {
  let total = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let v = digits.charCodeAt(i) - 48;
    if (alt) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    total += v;
    alt = !alt;
  }
  return total % 10 === 0;
}

function isCard(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19 && luhnOk(digits);
}

export function redactPii(text: string): RedactResult {
  const findings: PiiFinding[] = [];
  const counters: Record<string, number> = {};
  const placeholder = (type: PiiFinding["type"]) => {
    counters[type] = (counters[type] ?? 0) + 1;
    return `[REDACTED_${type}_${counters[type]}]`;
  };
  const record = (type: PiiFinding["type"], ph: string) =>
    findings.push({ type, placeholder: ph });

  let out = text;

  out = out.replace(NRIC_RE, () => {
    const ph = placeholder("IC_NRIC");
    record("IC_NRIC", ph);
    return ph;
  });
  out = out.replace(SSN_RE, () => {
    const ph = placeholder("SSN");
    record("SSN", ph);
    return ph;
  });
  out = out.replace(CARD_RE, (m) => {
    if (!isCard(m)) return m;
    const ph = placeholder("CREDIT_CARD");
    record("CREDIT_CARD", ph);
    return ph;
  });
  out = out.replace(OTP_FORWARD_RE, (_m, head: string) => {
    const ph = placeholder("OTP");
    record("OTP", ph);
    return head + ph;
  });
  out = out.replace(EMAIL_RE, () => {
    const ph = placeholder("EMAIL");
    record("EMAIL", ph);
    return ph;
  });
  out = out.replace(PHONE_RE, () => {
    const ph = placeholder("PHONE_NUMBER");
    record("PHONE_NUMBER", ph);
    return ph;
  });

  return { text: out, findings };
}
