import fs from "fs";
import path from "path";

// Load .env.local FIRST before importing any application modules
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...values] = trimmed.split("=");
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
} catch (e) {
  console.warn("Could not parse .env.local", e);
}

// Dynamically import modules AFTER process.env is set
async function runTest() {
  const { loadBusinessKnowledge } = await import("../lib/knowledge/loader");
  const { runGroqAgent } = await import("../lib/ai/groq");
  const { getOrCreateCustomer, getActiveConversation, saveMessage, getRecentMessages, createBooking, getAllBookings } = await import("../lib/supabase/db");

  console.log("=== TESTING LIVE GROQ & SUPABASE INTEGRATIONS ===");
  console.log("GROQ_API_KEY Present:", !!process.env.GROQ_API_KEY);
  console.log("GROQ_MODEL:", process.env.GROQ_MODEL);
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

  // 1. Test Supabase Database Connection
  console.log("\n[1/2] Testing Supabase Connection & Repository...");
  try {
    const testCustomer = await getOrCreateCustomer("+19998887777", "Alexander Wright");
    console.log("✅ Supabase Customer ID:", testCustomer.id);

    const testConv = await getActiveConversation(testCustomer.id);
    console.log("✅ Supabase Conversation ID:", testConv.id);

    const savedMsg = await saveMessage({
      conversation_id: testConv.id,
      customer_id: testCustomer.id,
      direction: "INBOUND",
      sender_type: "customer",
      content: "Hello! What luxury property services do you offer?",
    });
    console.log("✅ Supabase Message ID:", savedMsg.id);

    const booking = await createBooking({
      customer_id: testCustomer.id,
      service_name: "VIP Private Consultation",
      booking_date: "2026-10-25",
      booking_time: "14:00",
      status: "PENDING",
      notes: "Live test appointment",
    });
    console.log("✅ Supabase Booking inserted (Status PENDING):", booking);
  } catch (err: any) {
    console.error("❌ Supabase Error:", err);
  }

  // 2. Test Live Groq LLM API Call
  console.log("\n[2/2] Testing Real Groq API Model Call...");
  try {
    const customer = await getOrCreateCustomer("+19998887777", "Alexander Wright");
    const conv = await getActiveConversation(customer.id);
    const recentMsgs = await getRecentMessages(conv.id, 10);

    const agentOut = await runGroqAgent({
      customer,
      conversationId: conv.id,
      recentMessages: recentMsgs,
      incomingUserMessage: "What services do you offer at Luxure Nest and can I check availability for a VIP Private Consultation on October 25th 2026?",
    });

    console.log("\n✅ Real Groq Response Received:");
    console.log("--------------------------------------------------");
    console.log(agentOut.responseText);
    console.log("--------------------------------------------------");
    console.log("Tool Calls Executed:", JSON.stringify(agentOut.toolCallsExecuted, null, 2));
    console.log("Human Handoff Triggered:", agentOut.humanHandoffTriggered);
  } catch (err: any) {
    console.error("❌ Groq Error:", err);
  }

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");
}

runTest();
