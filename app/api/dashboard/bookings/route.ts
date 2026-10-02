import { NextResponse } from "next/server";
import { getAllBookings } from "@/lib/supabase/db";

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch bookings" }, { status: 500 });
  }
}
