import fs from "fs";
import path from "path";

export interface KnowledgeBase {
  business: string;
  services: string;
  pricing: string;
  faq: string;
  policies: string;
  openingHours: string;
  bookingRules: string;
  toneOfVoice: string;
  fullContext: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

function safeReadFile(filename: string): string {
  try {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.warn(`[KnowledgeLoader] Warning: Could not read file ${filename}:`, error);
  }
  return "";
}

export function loadBusinessKnowledge(): KnowledgeBase {
  const business = safeReadFile("business.md");
  const services = safeReadFile("services.md");
  const pricing = safeReadFile("pricing.md");
  const faq = safeReadFile("faq.md");
  const policies = safeReadFile("policies.md");
  const openingHours = safeReadFile("opening-hours.md");
  const bookingRules = safeReadFile("booking-rules.md");
  const toneOfVoice = safeReadFile("tone-of-voice.md");

  const fullContext = `
=== LUXURE NEST VERIFIED BUSINESS KNOWLEDGE ===

--- BUSINESS OVERVIEW ---
${business}

--- SERVICES ---
${services}

--- PRICING & CONSTRAINTS ---
${pricing}

--- FAQ ---
${faq}

--- POLICIES ---
${policies}

--- HOURS & AVAILABILITY ---
${openingHours}

--- BOOKING RULES ---
${bookingRules}

--- BRAND TONE ---
${toneOfVoice}

=== END OF KNOWLEDGE BASE ===
`.trim();

  return {
    business,
    services,
    pricing,
    faq,
    policies,
    openingHours,
    bookingRules,
    toneOfVoice,
    fullContext,
  };
}
