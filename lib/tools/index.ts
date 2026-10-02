import { z } from "zod";
import {
  createBooking,
  getCustomerBookings,
  cancelBooking,
  createLead,
  updateCustomerState as updateCustStateDb,
  createHumanHandoff,
  logToolAction
} from "@/lib/supabase/db";

// ============================================================
// TOOL DEFINITIONS & SCHEMAS FOR GROQ FUNCTION CALLING
// ============================================================

export const AGENT_TOOLS_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available consultation time slots for a specific Luxure Nest service and date.",
      parameters: {
        type: "object",
        properties: {
          service_name: { type: "string", description: "Name of the service (e.g., VIP Private Consultation, Luxury Estate Staging)" },
          date: { type: "string", description: "Target date in YYYY-MM-DD format" },
        },
        required: ["service_name", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a new appointment booking for a customer. The initial status will be registered as PENDING.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "ID of the customer" },
          service_name: { type: "string", description: "Service to book" },
          date: { type: "string", description: "Appointment date in YYYY-MM-DD format" },
          time: { type: "string", description: "Appointment time (e.g., 10:00, 11:00, 14:00, 16:00)" },
          notes: { type: "string", description: "Additional notes or specific property requirements" },
        },
        required: ["customer_id", "service_name", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_booking",
      description: "Retrieve existing active or pending bookings for a client.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Customer ID" },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancel an existing appointment booking.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "Booking UUID" },
          customer_id: { type: "string", description: "Customer ID" },
        },
        required: ["booking_id", "customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_lead",
      description: "Save or update qualified client lead information in the CRM database.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          service: { type: "string" },
          budget: { type: "string" },
          status: { type: "string", enum: ["NEW", "QUALIFYING", "QUALIFIED", "UNQUALIFIED", "HUMAN_REVIEW", "CONVERTED"] },
          notes: { type: "string" },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_customer_state",
      description: "Update client preferences, budget, or target dates in the memory store.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          service_interest: { type: "string" },
          budget: { type: "string" },
          preferred_date: { type: "string" },
          preferred_time: { type: "string" },
          lead_status: { type: "string", enum: ["NEW", "QUALIFYING", "QUALIFIED", "UNQUALIFIED", "HUMAN_REVIEW", "CONVERTED"] },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_human_handoff",
      description: "Escalate the conversation to a human specialist when requested by the client or outside AI scope.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          conversation_id: { type: "string" },
          reason: { type: "string", description: "Reason for human escalation" },
        },
        required: ["customer_id", "conversation_id", "reason"],
      },
    },
  },
];

// ============================================================
// TOOL EXECUTION HANDLERS (CONTROLLED SERVER-SIDE LOGIC)
// ============================================================

export async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  conversationId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let resultData: any = null;

    switch (toolName) {
      case "check_availability": {
        const schema = z.object({
          service_name: z.string(),
          date: z.string(),
        });
        const parsed = schema.parse(args);

        // Real availability backend calculation (Mon-Fri 09:00-19:00, Sat 10:00-17:00)
        const dateObj = new Date(parsed.date);
        const day = dateObj.getUTCDay();

        if (day === 0) {
          resultData = {
            available: false,
            message: "Our Luxure Nest gallery is closed on Sundays for scheduled appointments. Available Monday through Saturday.",
            available_slots: [],
          };
        } else {
          // Standard open slots for demo/dev backend
          resultData = {
            available: true,
            date: parsed.date,
            service_name: parsed.service_name,
            available_slots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM EST"],
          };
        }
        break;
      }

      case "create_booking": {
        const schema = z.object({
          customer_id: z.string(),
          service_name: z.string(),
          date: z.string(),
          time: z.string(),
          notes: z.string().optional(),
        });
        const parsed = schema.parse(args);

        // Execute createBooking with PENDING default status
        const booking = await createBooking({
          customer_id: parsed.customer_id,
          service_name: parsed.service_name,
          booking_date: parsed.date,
          booking_time: parsed.time,
          status: "PENDING",
          notes: parsed.notes,
        });

        resultData = {
          booking_id: booking.id,
          service_name: booking.service_name,
          date: booking.booking_date,
          time: booking.booking_time,
          status: booking.status, // "PENDING"
          confirmation_message: `Your appointment request for ${booking.service_name} on ${booking.booking_date} at ${booking.booking_time} has been registered with status: PENDING. Our concierge desk will confirm details shortly.`,
        };
        break;
      }

      case "lookup_booking": {
        const schema = z.object({ customer_id: z.string() });
        const parsed = schema.parse(args);
        const bookings = await getCustomerBookings(parsed.customer_id);
        resultData = { bookings };
        break;
      }

      case "cancel_booking": {
        const schema = z.object({
          booking_id: z.string(),
          customer_id: z.string(),
        });
        const parsed = schema.parse(args);
        const cancelled = await cancelBooking(parsed.booking_id, parsed.customer_id);
        if (!cancelled) {
          throw new Error("Booking not found or already cancelled.");
        }
        resultData = {
          success: true,
          booking_id: cancelled.id,
          status: "CANCELLED",
          message: "The appointment has been successfully cancelled.",
        };
        break;
      }

      case "save_lead": {
        const schema = z.object({
          customer_id: z.string(),
          name: z.string().optional(),
          phone: z.string().optional(),
          service: z.string().optional(),
          budget: z.string().optional(),
          status: z.enum(["NEW", "QUALIFYING", "QUALIFIED", "UNQUALIFIED", "HUMAN_REVIEW", "CONVERTED"]).optional(),
          notes: z.string().optional(),
        });
        const parsed = schema.parse(args);
        const lead = await createLead(parsed);
        resultData = { lead_id: lead.id, status: lead.status };
        break;
      }

      case "update_customer_state": {
        const schema = z.object({
          customer_id: z.string(),
          service_interest: z.string().optional(),
          budget: z.string().optional(),
          preferred_date: z.string().optional(),
          preferred_time: z.string().optional(),
          lead_status: z.enum(["NEW", "QUALIFYING", "QUALIFIED", "UNQUALIFIED", "HUMAN_REVIEW", "CONVERTED"]).optional(),
        });
        const parsed = schema.parse(args);
        const { customer_id, ...updates } = parsed;
        const updatedState = await updateCustStateDb(customer_id, updates);
        resultData = { state: updatedState };
        break;
      }

      case "request_human_handoff": {
        const schema = z.object({
          customer_id: z.string(),
          conversation_id: z.string(),
          reason: z.string(),
        });
        const parsed = schema.parse(args);
        const handoff = await createHumanHandoff(parsed);
        resultData = {
          handoff_id: handoff.id,
          status: "PENDING",
          message: "Conversation escalated to human concierge desk.",
        };
        break;
      }

      default:
        throw new Error(`Tool '${toolName}' is not recognized or authorized.`);
    }

    // Log successful tool execution in database audit log
    await logToolAction({
      conversation_id: conversationId,
      tool_name: toolName,
      arguments: args,
      result: resultData,
      status: "SUCCESS",
    });

    return { success: true, data: resultData };
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown error executing tool";
    console.error(`[ToolExecutor] Error executing tool ${toolName}:`, errorMsg);

    await logToolAction({
      conversation_id: conversationId,
      tool_name: toolName,
      arguments: args,
      result: { error: errorMsg },
      status: "FAILED",
    });

    return { success: false, error: errorMsg };
  }
}
