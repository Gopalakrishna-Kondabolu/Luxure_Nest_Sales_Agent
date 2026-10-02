import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateCustomer,
  getActiveConversation,
  saveMessage,
  getRecentMessages,
  getCustomerState
} from "@/lib/supabase/db";
import { runGroqAgent } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const { phone, name, message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message string is required" }, { status: 400 });
    }

    const clientPhone = phone || "15550199";
    const clientName = name || "Simulator Test Client";

    // 1. Get or Create Customer
    const customer = await getOrCreateCustomer(clientPhone, clientName);

    // 2. Get Active Conversation
    const conversation = await getActiveConversation(customer.id);

    // 3. Save User Message
    const userMsg = await saveMessage({
      conversation_id: conversation.id,
      customer_id: customer.id,
      direction: "INBOUND",
      sender_type: "customer",
      content: message,
    });

    // 4. Load History & State
    const recentMessages = await getRecentMessages(conversation.id, 10);
    const customerState = await getCustomerState(customer.id);

    // 5. Run Groq Agent
    const agentOutput = await runGroqAgent({
      customer,
      conversationId: conversation.id,
      recentMessages,
      customerState,
      incomingUserMessage: message,
    });

    // 6. Save AI Reply Message
    const aiMsg = await saveMessage({
      conversation_id: conversation.id,
      customer_id: customer.id,
      direction: "OUTBOUND",
      sender_type: "ai_agent",
      content: agentOutput.responseText,
      metadata: {
        tool_calls: agentOutput.toolCallsExecuted,
        human_handoff: agentOutput.humanHandoffTriggered,
      },
    });

    return NextResponse.json({
      success: true,
      customer,
      conversation_id: conversation.id,
      user_message: userMsg,
      ai_message: aiMsg,
      agent_output: agentOutput,
    });
  } catch (error: any) {
    console.error("[Simulator] Error:", error);
    return NextResponse.json({ error: error?.message || "Simulator execution error" }, { status: 500 });
  }
}
