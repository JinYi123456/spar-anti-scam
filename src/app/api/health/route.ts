import { NextResponse } from "next/server";
import { llmAvailable, MODEL_CHAIN, PRIMARY_MODEL, getDriftLog } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    llm: llmAvailable(),
    primaryModel: PRIMARY_MODEL,
    models: MODEL_CHAIN,
    drift: getDriftLog(),
  });
}
