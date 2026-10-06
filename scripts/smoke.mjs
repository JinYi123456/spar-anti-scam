/* Smoke-test the full SPAR pipeline against the running dev server. */
const PORT = process.argv[2] ?? "52322";
const B = `http://localhost:${PORT}`;

async function post(path, body) {
  const res = await fetch(`${B}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

const health = await fetch(`${B}/api/health`).then((r) => r.json());
console.log("health:", JSON.stringify(health).slice(0, 160));

const analysis = await post("/api/analyze", {
  text:
    "Hi Mom, it's me! My phone broke, I'm using a friend's phone. I got detained at the festival and they need $850 for the fine before they release me tonight. Please don't tell Dad, he'll freak. I'm scared, please hurry",
});
console.log(`\n[analyze] verdict=${analysis.report.verdict} risk=${analysis.report.riskScore} family=${analysis.report.family} engine=${analysis.engine}`);
console.log("  tactics:", analysis.report.tactics.map((t) => t.key).join(", "));

const forge = await post("/api/forge", { report: analysis.report, text: "sample text" });
console.log(`\n[forge] engine=${forge.engine} twin="${forge.twin.personaName}"`);
console.log("  opener:", forge.twin.opener.slice(0, 110) + "…");

let history = [{ role: "twin", text: forge.twin.opener, rung: 0 }];
let state = { pressure: 18, level: "calm" };
let ended = false;
let leakedAll = [];
const tacticsSeen = [];
for (let turn = 1; turn <= 12 && !ended; turn++) {
  const userMsg =
    turn === 1
      ? "Who is this? How do I know you are really my son? I will call your usual number right now."
      : turn === 2
      ? "No. I'm calling Dad now and the venue's official line. Don't message me again."
      : "This is a scam. I'm not sending anything. Goodbye.";
  const r = await post("/api/duel", { twin: forge.twin, history, turnCount: history.length });
  history.push({ role: "twin", text: r.reply, rung: r.rung, newTactics: r.tactics });
  history.push({ role: "user", text: userMsg });
  state = { pressure: r.pressure, level: r.level };
  tacticsSeen.push(...(r.tactics ?? []));
  if (r.leaked?.length) leakedAll.push(...r.leaked);
  ended = r.ended;
  console.log(`  [duel t${turn}] rung=${r.rung} pressure=${r.pressure} ${r.level} engine=${r.engine} ended=${r.ended}`);
  console.log(`    twin: ${r.reply.slice(0, 90)}…`);
}

// debrief
const debrief = await post("/api/debrief", {
  twin: forge.twin,
  history,
  tacticsSeen: [...new Set(tacticsSeen)],
  leaked: leakedAll,
  endReason: ended ? "max_turns" : "defused",
});
console.log(`\n[debrief] engine=${debrief.engine} grade=${debrief.score.grade} overall=${debrief.score.overall}`);
console.log("  lessons:", debrief.score.lessons.slice(0, 2).join(" | "));
console.log("\n✅ PIPELINE OK");
