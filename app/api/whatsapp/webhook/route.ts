import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookToken, validateMetaSignature, sendWhatsAppTextMessage } from "@/lib/whatsapp/client";
import {
  getOrCreateCustomer,
  getActiveConversation,
  checkMessageExists,
  saveMessage,
  getRecentMessages,
  getCustomerState
} from "@/lib/supabase/db";
import { runGroqAgent } from "@/lib/ai/groq";

/**
 * GET Handler - Webhook Verification for Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const challengeResponse = verifyWebhookToken(mode, token, challenge);
  if (challengeResponse) {
    return new NextResponse(challengeResponse, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden - Webhook verification failed" }, { status: 403 });
}

/**
 * POST Handler - Process Incoming Webhook Events from WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Verify signature if APP_SECRET configured
    if (!validateMetaSignature(rawBody, signature)) {
      console.warn("[Webhook] Invalid x-hub-signature-256 header");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Extract WhatsApp messaging value payload
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // If payload is not a text message event (e.g. status updates), acknowledge 200 OK immediately
    if (!message || message.type !== "text") {
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    const whatsappMessageId = message.id;
    const fromPhoneNumber = message.from; // Sender's phone number
    const senderName = value?.contacts?.[0]?.profile?.name || null;
    const incomingText = message.text?.body;

    if (!incomingText) {
      return NextResponse.json({ status: "IGNORED_EMPTY" }, { status: 200 });
    }

    // Idempotency Check - prevent processing duplicate webhook deliveries
    const isDuplicate = await checkMessageExists(whatsappMessageId);
    if (isDuplicate) {
      console.log(`[Webhook] Duplicate message ID ${whatsappMessageId} ignored.`);
      return NextResponse.json({ status: "DUPLICATE_SKIPPED" }, { status: 200 });
    }

    // 1. Identify or Create Customer
    const customer = await getOrCreateCustomer(fromPhoneNumber, senderName);

    // 2. Identify or Create Active Conversation
    const conversation = await getActiveConversation(customer.id);

    // If conversation is in human_takeover mode, store incoming message and skip AI agent reply
    if (conversation.status === "human_takeover") {
      await saveMessage({
        conversation_id: conversation.id,
        customer_id: customer.id,
        direction: "INBOUND",
        sender_type: "customer",
        content: incomingText,
        whatsapp_message_id: whatsappMessageId,
      });
      console.log(`[Webhook] Conversation ${conversation.id} is in human_takeover mode. AI reply skipped.`);
      return NextResponse.json({ status: "HUMAN_TAKEOVER_ACTIVE" }, { status: 200 });
    }

    // 3. Save Incoming Customer Message
    await saveMessage({
      conversation_id: conversation.id,
      customer_id: customer.id,
      direction: "INBOUND",
      sender_type: "customer",
      content: incomingText,
      whatsapp_message_id: whatsappMessageId,
    });

    // 4. Load Context Memory (Recent History & Customer State)
    const recentMessages = await getRecentMessages(conversation.id, 10);
    const customerState = await getCustomerState(customer.id);

    // 5. Run Groq AI Agent Pipeline
    const agentOutput = await runGroqAgent({
      customer,
      conversationId: conversation.id,
      recentMessages,
      customerState,
      incomingUserMessage: incomingText,
    });

    // 6. Send Response to WhatsApp Client
    const sendResult = await sendWhatsAppTextMessage({
      to: fromPhoneNumber,
      text: agentOutput.responseText,
    });

    // 7. Save Outgoing Message in Database
    await saveMessage({
      conversation_id: conversation.id,
      customer_id: customer.id,
      direction: "OUTBOUND",
      sender_type: "ai_agent",
      content: agentOutput.responseText,
      metadata: {
        whatsapp_send_status: sendResult.success ? "sent" : "failed",
        tool_calls: agentOutput.toolCallsExecuted,
        human_handoff: agentOutput.humanHandoffTriggered,
      },
    });

    return NextResponse.json(
      {
        status: "SUCCESS",
        customer_id: customer.id,
        conversation_id: conversation.id,
        reply_sent: sendResult.success,
        response_text: agentOutput.responseText,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Webhook] Critical error during WhatsApp webhook processing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
