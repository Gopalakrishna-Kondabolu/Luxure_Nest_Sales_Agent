import { NextRequest, NextResponse } from "next/server";
import {
  getConversationMessages,
  saveMessage,
  updateConversationStatus,
  getCustomerState
} from "@/lib/supabase/db";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const messages = await getConversationMessages(conversationId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const { action, text, customer_id, whatsapp_id } = await req.json();

    if (action === "toggle_mode") {
      const { status } = await req.json().catch(() => ({ status: "human_takeover" }));
      const newStatus = status || "human_takeover";
      await updateConversationStatus(conversationId, newStatus);
      return NextResponse.json({ success: true, new_status: newStatus });
    }

    if (action === "send_human_message") {
      if (!text || !customer_id || !whatsapp_id) {
        return NextResponse.json({ error: "Missing required fields (text, customer_id, whatsapp_id)" }, { status: 400 });
      }

      // 1. Ensure mode is set to human_takeover
      await updateConversationStatus(conversationId, "human_takeover");

      // 2. Send outbound message via WhatsApp client
      const sendRes = await sendWhatsAppTextMessage({ to: whatsapp_id, text });

      // 3. Save message record with sender_type = human_agent
      const msg = await saveMessage({
        conversation_id: conversationId,
        customer_id: customer_id,
        direction: "OUTBOUND",
        sender_type: "human_agent",
        content: text,
        metadata: {
          whatsapp_send_status: sendRes.success ? "sent" : "failed",
          operator: "Dashboard Admin",
        },
      });

      return NextResponse.json({ success: true, message: msg, sendResult: sendRes });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to process operator request" }, { status: 500 });
  }
}
