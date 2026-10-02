import crypto from "crypto";

const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "luxure_nest_verify_token_dev";
const whatsappAppSecret = process.env.WHATSAPP_APP_SECRET;

export interface SendWhatsAppMessageParams {
  to: string; // E.164 phone number / WhatsApp ID
  text: string;
}

export interface SendWhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isDevMock?: boolean;
}

/**
 * Sends a text message to a WhatsApp user via Meta Cloud API.
 * Uses dev mock transport if WHATSAPP_ACCESS_TOKEN is not configured.
 */
export async function sendWhatsAppTextMessage(params: SendWhatsAppMessageParams): Promise<SendWhatsAppMessageResult> {
  if (!whatsappAccessToken || !whatsappPhoneNumberId) {
    console.log(`[WhatsAppClient MOCK] Sending WhatsApp message to ${params.to}: "${params.text}"`);
    return {
      success: true,
      messageId: `wamid.dev_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isDevMock: true,
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${whatsappPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "text",
        text: {
          preview_url: false,
          body: params.text,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsAppClient] Meta API error response:", data);
      return {
        success: false,
        error: data?.error?.message || `HTTP status ${response.status}`,
      };
    }

    const messageId = data?.messages?.[0]?.id;
    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error("[WhatsAppClient] Exception during sendWhatsAppTextMessage:", error);
    return {
      success: false,
      error: error?.message || "Failed to reach Meta WhatsApp API",
    };
  }
}

/**
 * Verifies Meta WhatsApp Webhook Verification Request (GET)
 */
export function verifyWebhookToken(mode: string | null, token: string | null, challenge: string | null): string | null {
  if (mode === "subscribe" && token === whatsappVerifyToken && challenge) {
    return challenge;
  }
  return null;
}

/**
 * Validates Meta x-hub-signature-256 HMAC header
 */
export function validateMetaSignature(payloadRawBody: string, signatureHeader: string | null): boolean {
  if (!whatsappAppSecret || !signatureHeader) {
    return true; // Skip signature check if app secret not configured in dev
  }

  try {
    const signatureParts = signatureHeader.split("=");
    if (signatureParts.length !== 2 || signatureParts[0] !== "sha256") {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", whatsappAppSecret)
      .update(payloadRawBody, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signatureParts[1]), Buffer.from(expectedSignature));
  } catch (err) {
    console.error("[WhatsAppClient] Error verifying Meta signature:", err);
    return false;
  }
}
