import { NextResponse } from "next/server";
import { getAllLeads } from "@/lib/supabase/db";

export async function GET() {
  try {
    const leads = await getAllLeads();
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch leads" }, { status: 500 });
  }
}
