# AGENTS.md — SPAR

## What this is
SPAR (Sparring Partner Against Real Scammers) — a ForgeHacks 2026 AI + Cybersecurity entry.
A Next.js 16 app: paste a scam message → forensic autopsy → LLM-forged digital twin of the scammer → live sparring duel → graded debrief.

## Commands
- `npm run dev` — dev server (port 3000, or next free port)
- `npm run build` — production build (must pass with zero errors)
- `npx tsc --noEmit` — typecheck
- `npm run lint` — eslint
- `node scripts/smoke.mjs <port>` — end-to-end pipeline smoke test against a running dev server

## Architecture
- `src/lib/rules.ts` — deterministic forensics engine (14 tactic regex signatures, pressure scoring). Ground truth for the LLM layer. Works with zero API keys.
- `src/lib/llm.ts` — Featherless AI client (OpenAI-compatible). Model fallback chain. Server-side only; key never leaves the server.
- `src/lib/prompts.ts` — all LLM prompt engineering. Personas stay in-character; outputs are safety-scrubbed.
- `src/lib/drills.ts` — handcrafted offline twins per scam family + leak detection for duels.
- `src/app/api/{analyze,forge,duel,debrief}/route.ts` — the four pipeline stages. Every route degrades gracefully to offline mode.
- `src/components/spar-app.tsx` — client state machine across the five screens.
- `src/components/gauges.tsx` — dial, pressure bars, sparkline, typewriter atoms.

## Conventions
- TypeScript strict; no `any` in new code.
- Dark forensic-lab design system lives in `globals.css` (panels, stamps, scanlines, bubbles). Use it; don't inline hex codes except for data-driven colors.
- LLM JSON is parsed defensively (`parseJsonLoose`); never trust shape, always clamp lengths.
- Safety: twin outputs must never contain working URLs or real phone numbers — the scrub layer exists for a reason.

## Verify before finishing
1. `npx tsc --noEmit` clean
2. `npm run build` green
3. `node scripts/smoke.mjs <port>` passes all four stages
