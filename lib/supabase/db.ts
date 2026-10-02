import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Customer,
  Conversation,
  Message,
  CustomerState,
  Lead,
  Booking,
  ToolAction,
  HumanHandoff,
  BookingStatus,
  LeadStatus,
  ConversationStatus
} from "@/types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// In-Memory Dev Database Store (Used when Supabase credentials are not yet configured)
class DevDatabaseStore {
  customers: Customer[] = [];
  conversations: Conversation[] = [];
  messages: Message[] = [];
  customerStates: CustomerState[] = [];
  leads: Lead[] = [];
  bookings: Booking[] = [];
  toolActions: ToolAction[] = [];
  humanHandoffs: HumanHandoff[] = [];

  constructor() {
    // Seed initial mock data for local testing
    const seedCustomer: Customer = {
      id: "cust-demo-1",
      whatsapp_id: "15550199",
      name: "Alexander Wright",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const seedConv: Conversation = {
      id: "conv-demo-1",
      customer_id: seedCustomer.id,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const seedMsg1: Message = {
      id: "msg-demo-1",
      conversation_id: seedConv.id,
      customer_id: seedCustomer.id,
      whatsapp_message_id: "wa_msg_1001",
      direction: "INBOUND",
      sender_type: "customer",
      content: "Hello! I am looking for a private luxury villa consultation.",
      status: "delivered",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    };
    const seedMsg2: Message = {
      id: "msg-demo-2",
      conversation_id: seedConv.id,
      customer_id: seedCustomer.id,
      direction: "OUTBOUND",
      sender_type: "ai_agent",
      content: "Welcome to Luxure Nest! It is an absolute pleasure to assist you. We offer VIP Private Consultations for luxury estate matchmaking and interior advisory. May I ask your preferred date and requirements?",
      status: "delivered",
      created_at: new Date(Date.now() - 3500000).toISOString(),
    };
    const seedState: CustomerState = {
      id: "state-demo-1",
      customer_id: seedCustomer.id,
      service_interest: "VIP Private Consultation",
      budget: "$5,000,000+",
      lead_status: "QUALIFYING",
      updated_at: new Date().toISOString(),
    };
    const seedLead: Lead = {
      id: "lead-demo-1",
      customer_id: seedCustomer.id,
      name: seedCustomer.name,
      phone: "+15550199",
      service: "VIP Private Consultation",
      budget: "$5,000,000+",
      status: "QUALIFYING",
      notes: "Interested in coastal estate matchmaking.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const seedBooking: Booking = {
      id: "book-demo-1",
      customer_id: seedCustomer.id,
      service_name: "VIP Private Consultation",
      booking_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      booking_time: "14:00",
      status: "PENDING",
      notes: "Initial consultation call.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customers.push(seedCustomer);
    this.conversations.push(seedConv);
    this.messages.push(seedMsg1, seedMsg2);
    this.customerStates.push(seedState);
    this.leads.push(seedLead);
    this.bookings.push(seedBooking);
  }
}

const devDb = new DevDatabaseStore();

// ============================================================
// DATABASE REPOSITORY FUNCTIONS
// ============================================================

export async function getOrCreateCustomer(whatsappId: string, name?: string): Promise<Customer> {
  if (supabase) {
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("whatsapp_id", whatsappId)
      .single();

    if (existing) {
      if (name && existing.name !== name) {
        const { data: updated } = await supabase
          .from("customers")
          .update({ name, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        return updated || existing;
      }
      return existing;
    }

    const { data: created, error } = await supabase
      .from("customers")
      .insert({ whatsapp_id: whatsappId, name: name || null })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  // Dev Store Fallback
  let cust = devDb.customers.find((c) => c.whatsapp_id === whatsappId);
  if (!cust) {
    cust = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      whatsapp_id: whatsappId,
      name: name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devDb.customers.push(cust);
  } else if (name && cust.name !== name) {
    cust.name = name;
    cust.updated_at = new Date().toISOString();
  }
  return cust;
}

export async function getActiveConversation(customerId: string): Promise<Conversation> {
  if (supabase) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) return existing;

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ customer_id: customerId, status: "active" })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  // Dev Store Fallback
  let conv = devDb.conversations.find((c) => c.customer_id === customerId && c.status === "active");
  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customer_id: customerId,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devDb.conversations.push(conv);
  }
  return conv;
}

export async function updateConversationStatus(conversationId: string, status: ConversationStatus): Promise<void> {
  if (supabase) {
    await supabase.from("conversations").update({ status, updated_at: new Date().toISOString() }).eq("id", conversationId);
    return;
  }

  const conv = devDb.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.status = status;
    conv.updated_at = new Date().toISOString();
  }
}

export async function checkMessageExists(whatsappMessageId: string): Promise<boolean> {
  if (!whatsappMessageId) return false;
  if (supabase) {
    const { data } = await supabase.from("messages").select("id").eq("whatsapp_message_id", whatsappMessageId).single();
    return !!data;
  }
  return devDb.messages.some((m) => m.whatsapp_message_id === whatsappMessageId);
}

export async function saveMessage(params: {
  conversation_id: string;
  customer_id: string;
  direction: "INBOUND" | "OUTBOUND";
  sender_type: "customer" | "ai_agent" | "human_agent";
  content: string;
  whatsapp_message_id?: string;
  metadata?: Record<string, any>;
}): Promise<Message> {
  if (supabase) {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: params.conversation_id,
        customer_id: params.customer_id,
        direction: params.direction,
        sender_type: params.sender_type,
        content: params.content,
        whatsapp_message_id: params.whatsapp_message_id || null,
        metadata: params.metadata || {},
        status: "delivered",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: params.conversation_id,
    customer_id: params.customer_id,
    whatsapp_message_id: params.whatsapp_message_id || null,
    direction: params.direction,
    sender_type: params.sender_type,
    content: params.content,
    status: "delivered",
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };
  devDb.messages.push(msg);
  return msg;
}

export async function getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
  if (supabase) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).reverse();
  }

  const msgs = devDb.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return msgs.slice(-limit);
}

export async function getCustomerState(customerId: string): Promise<CustomerState | null> {
  if (supabase) {
    const { data } = await supabase.from("customer_state").select("*").eq("customer_id", customerId).single();
    return data || null;
  }
  return devDb.customerStates.find((s) => s.customer_id === customerId) || null;
}

export async function updateCustomerState(
  customerId: string,
  updates: Partial<Omit<CustomerState, "id" | "customer_id">>
): Promise<CustomerState> {
  if (supabase) {
    const existing = await getCustomerState(customerId);
    if (existing) {
      const { data, error } = await supabase
        .from("customer_state")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("customer_id", customerId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("customer_state")
        .insert({ customer_id: customerId, ...updates, lead_status: updates.lead_status || "NEW" })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  let state = devDb.customerStates.find((s) => s.customer_id === customerId);
  if (!state) {
    state = {
      id: `state-${Date.now()}`,
      customer_id: customerId,
      lead_status: updates.lead_status || "NEW",
      ...updates,
      updated_at: new Date().toISOString(),
    };
    devDb.customerStates.push(state);
  } else {
    Object.assign(state, updates, { updated_at: new Date().toISOString() });
  }
  return state;
}

export async function createLead(params: {
  customer_id: string;
  name?: string;
  phone?: string;
  service?: string;
  budget?: string;
  status?: LeadStatus;
  notes?: string;
}): Promise<Lead> {
  const status = params.status || "NEW";
  if (supabase) {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        customer_id: params.customer_id,
        name: params.name || null,
        phone: params.phone || null,
        service: params.service || null,
        budget: params.budget || null,
        status,
        notes: params.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const lead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    customer_id: params.customer_id,
    name: params.name || null,
    phone: params.phone || null,
    service: params.service || null,
    budget: params.budget || null,
    status,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  devDb.leads.push(lead);
  return lead;
}

export async function createBooking(params: {
  customer_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status?: BookingStatus; // Defaults to PENDING
  notes?: string;
}): Promise<Booking> {
  const status: BookingStatus = params.status || "PENDING";
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: params.customer_id,
        service_name: params.service_name,
        booking_date: params.booking_date,
        booking_time: params.booking_time,
        status,
        notes: params.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const booking: Booking = {
    id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    customer_id: params.customer_id,
    service_name: params.service_name,
    booking_date: params.booking_date,
    booking_time: params.booking_time,
    status,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  devDb.bookings.push(booking);
  return booking;
}

export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  if (supabase) {
    const { data } = await supabase.from("bookings").select("*").eq("customer_id", customerId).order("booking_date", { ascending: true });
    return data || [];
  }
  return devDb.bookings.filter((b) => b.customer_id === customerId);
}

export async function cancelBooking(bookingId: string, customerId: string): Promise<Booking | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("customer_id", customerId)
      .select()
      .single();
    if (error) return null;
    return data;
  }

  const booking = devDb.bookings.find((b) => b.id === bookingId && b.customer_id === customerId);
  if (booking) {
    booking.status = "CANCELLED";
    booking.updated_at = new Date().toISOString();
    return booking;
  }
  return null;
}

export async function logToolAction(params: {
  conversation_id?: string;
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  status: "SUCCESS" | "FAILED" | "REJECTED";
}): Promise<ToolAction> {
  if (supabase) {
    const { data } = await supabase
      .from("tool_actions")
      .insert({
        conversation_id: params.conversation_id || null,
        tool_name: params.tool_name,
        arguments: params.arguments,
        result: params.result,
        status: params.status,
      })
      .select()
      .single();
    if (data) return data;
  }

  const action: ToolAction = {
    id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: params.conversation_id || null,
    tool_name: params.tool_name,
    arguments: params.arguments,
    result: params.result,
    status: params.status,
    created_at: new Date().toISOString(),
  };
  devDb.toolActions.push(action);
  return action;
}

export async function createHumanHandoff(params: {
  conversation_id: string;
  customer_id: string;
  reason: string;
}): Promise<HumanHandoff> {
  await updateConversationStatus(params.conversation_id, "human_takeover");

  if (supabase) {
    const { data, error } = await supabase
      .from("human_handoffs")
      .insert({
        conversation_id: params.conversation_id,
        customer_id: params.customer_id,
        reason: params.reason,
        status: "PENDING",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const handoff: HumanHandoff = {
    id: `handoff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: params.conversation_id,
    customer_id: params.customer_id,
    reason: params.reason,
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  devDb.humanHandoffs.push(handoff);
  return handoff;
}

// ============================================================
// DASHBOARD QUERY HELPERS
// ============================================================

export async function getAllConversationsWithDetails() {
  if (supabase) {
    const { data: convs } = await supabase.from("conversations").select("*, customers(*)").order("updated_at", { ascending: false });
    return convs || [];
  }
  return devDb.conversations.map((c) => {
    const cust = devDb.customers.find((cust) => cust.id === c.customer_id);
    const msgs = devDb.messages.filter((m) => m.conversation_id === c.id);
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    return {
      ...c,
      customers: cust,
      last_message: lastMsg,
    };
  });
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  if (supabase) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    return data || [];
  }
  return devDb.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function getAllLeads(): Promise<Lead[]> {
  if (supabase) {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  return devDb.leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAllBookings(): Promise<Booking[]> {
  if (supabase) {
    const { data } = await supabase.from("bookings").select("*").order("booking_date", { ascending: true });
    return data || [];
  }
  return devDb.bookings.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
}

export async function getAllHumanHandoffs(): Promise<HumanHandoff[]> {
  if (supabase) {
    const { data } = await supabase.from("human_handoffs").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  return devDb.humanHandoffs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
