import { NextRequest, NextResponse } from "next/server";

const adminEmail = process.env.DASHBOARD_ADMIN_EMAIL || "admin@luxurenest.com";
const adminPassword = process.env.DASHBOARD_ADMIN_PASSWORD || "admin123";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (email === adminEmail && password === adminPassword) {
      const response = NextResponse.json({ success: true, message: "Authentication successful" });
      // Set secure HTTP-only auth token cookie
      response.cookies.set("luxure_session", "authenticated_admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid email or password credentials." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
