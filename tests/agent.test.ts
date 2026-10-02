import { describe, it, expect } from "vitest";
import { loadBusinessKnowledge } from "../lib/knowledge/loader";
import { executeToolCall } from "../lib/tools";
import { runGroqAgent } from "../lib/ai/groq";
import { getOrCreateCustomer, getActiveConversation, saveMessage, getRecentMessages, createBooking } from "../lib/supabase/db";

describe("Phase 3: Business Knowledge System Tests", () => {
  it("should load knowledge base markdown files successfully", () => {
    const kb = loadBusinessKnowledge();
    expect(kb.fullContext).toContain("LUXURE NEST VERIFIED BUSINESS KNOWLEDGE");
    expect(kb.fullContext).toContain("VIP Private Consultation");
  });
});

describe("Phase 8 & 10: Server-Side Tool Execution Tests", () => {
  it("should check availability for open slots", async () => {
    const res = await executeToolCall("check_availability", {
      service_name: "VIP Private Consultation",
      date: "2026-10-15",
    });
    expect(res.success).toBe(true);
    expect(res.data.available_slots).toBeDefined();
  });

  it("should create booking with default status PENDING", async () => {
    const res = await executeToolCall("create_booking", {
      customer_id: "test-cust-1",
      service_name: "VIP Private Consultation",
      date: "2026-10-15",
      time: "14:00",
      notes: "Test appointment",
    });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe("PENDING");
  });

  it("should create lead record successfully", async () => {
    const res = await executeToolCall("save_lead", {
      customer_id: "test-cust-1",
      name: "Victoria Sterling",
      phone: "+15550199",
      service: "Interior Staging",
      budget: "$10,000,000+",
      status: "QUALIFIED",
    });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe("QUALIFIED");
  });

  it("should process request_human_handoff tool", async () => {
    const res = await executeToolCall("request_human_handoff", {
      customer_id: "test-cust-1",
      conversation_id: "test-conv-1",
      reason: "Client asked for senior human manager",
    });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe("PENDING");
  });
});

describe("Phase 4 & 7: AI Agent Pipeline & Conversation Memory Tests", () => {
  it("should process customer input through agent and produce grounded response", async () => {
    const customer = await getOrCreateCustomer("15550199", "Alexander Wright");
    const conv = await getActiveConversation(customer.id);
    await saveMessage({
      conversation_id: conv.id,
      customer_id: customer.id,
      direction: "INBOUND",
      sender_type: "customer",
      content: "Do you offer private property matchmaking?",
    });

    const recent = await getRecentMessages(conv.id, 10);
    const agentOut = await runGroqAgent({
      customer,
      conversationId: conv.id,
      recentMessages: recent,
      incomingUserMessage: "Do you offer private property matchmaking?",
    });

    expect(agentOut.responseText).toBeDefined();
    expect(agentOut.responseText.length).toBeGreaterThan(10);
  });
});
