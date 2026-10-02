import { NextResponse } from "next/server";
import { getAllConversationsWithDetails } from "@/lib/supabase/db";

export async function GET() {
  try {
    const conversations = await getAllConversationsWithDetails();
    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
