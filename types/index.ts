export type MessageDirection = "INBOUND" | "OUTBOUND";
export type SenderType = "customer" | "ai_agent" | "human_agent";
export type MessageStatus = "received" | "processing" | "sent" | "delivered" | "failed";
export type ConversationStatus = "active" | "human_takeover" | "closed";
export type LeadStatus = "NEW" | "QUALIFYING" | "QUALIFIED" | "UNQUALIFIED" | "HUMAN_REVIEW" | "CONVERTED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type HandoffStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface Customer {
  id: string;
  whatsapp_id: string;
  name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  customer_id: string;
  whatsapp_message_id?: string | null;
  direction: MessageDirection;
  sender_type: SenderType;
  content: string;
  status: MessageStatus;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CustomerState {
  id: string;
  customer_id: string;
  service_interest?: string | null;
  budget?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  qualification_notes?: string | null;
  lead_status: LeadStatus;
  custom_attributes?: Record<string, any>;
  updated_at: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  name?: string | null;
  phone?: string | null;
  service?: string | null;
  budget?: string | null;
  status: LeadStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolAction {
  id: string;
  conversation_id?: string | null;
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  status: "SUCCESS" | "FAILED" | "REJECTED";
  created_at: string;
}

export interface HumanHandoff {
  id: string;
  conversation_id: string;
  customer_id: string;
  reason: string;
  status: HandoffStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AgentDecision {
  type: "message" | "tool_call" | "human_handoff";
  message?: string;
  tool_call?: AgentToolCall;
  reason?: string;
}
