import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "WhatsApp AI Sales Agent",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      groq_configured: !!process.env.GROQ_API_KEY,
      whatsapp_configured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    { status: 200 }
  );
}
