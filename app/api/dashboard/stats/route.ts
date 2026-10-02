import { NextResponse } from "next/server";
import {
  getAllConversationsWithDetails,
  getAllLeads,
  getAllBookings,
  getAllHumanHandoffs
} from "@/lib/supabase/db";

export async function GET() {
  try {
    const convs = await getAllConversationsWithDetails();
    const leads = await getAllLeads();
    const bookings = await getAllBookings();
    const handoffs = await getAllHumanHandoffs();

    const activeConvs = convs.filter((c: any) => c.status === "active").length;
    const humanTakeoverConvs = convs.filter((c: any) => c.status === "human_takeover").length;
    const pendingBookings = bookings.filter((b: any) => b.status === "PENDING").length;
    const qualifiedLeads = leads.filter((l: any) => l.status === "QUALIFIED").length;
    const pendingHandoffs = handoffs.filter((h: any) => h.status === "PENDING").length;

    return NextResponse.json({
      total_conversations: convs.length,
      active_conversations: activeConvs,
      human_takeover_conversations: humanTakeoverConvs,
      total_leads: leads.length,
      qualified_leads: qualifiedLeads,
      total_bookings: bookings.length,
      pending_bookings: pendingBookings,
      pending_handoffs: pendingHandoffs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
