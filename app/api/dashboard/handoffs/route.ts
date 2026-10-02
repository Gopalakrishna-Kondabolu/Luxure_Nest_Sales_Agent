import { NextResponse } from "next/server";
import { getAllHumanHandoffs } from "@/lib/supabase/db";

export async function GET() {
  try {
    const handoffs = await getAllHumanHandoffs();
    return NextResponse.json({ handoffs });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch human handoffs" }, { status: 500 });
  }
}
