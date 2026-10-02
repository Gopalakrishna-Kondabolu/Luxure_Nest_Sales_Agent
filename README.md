# Production-Ready WhatsApp AI Sales Agent (Luxure Nest)

A complete, production-ready **WhatsApp AI Sales Agent & Concierge System** built with **Next.js 15 (App Router)**, **TypeScript**, **Groq LLM**, **Meta WhatsApp Cloud API**, and **Supabase PostgreSQL**.

---

## 🌟 Key Features & Capabilities
1. **Official WhatsApp Webhook Handler**: Receives incoming customer messages, verifies Meta webhook tokens, validates HMAC signatures, and enforces message idempotency.
2. **Knowledge-Grounded AI Brain (Groq API)**: AI answers are strictly grounded in `/knowledge/*.md` files (business overview, services, pricing constraints, booking rules, FAQ, company policies).
3. **Controlled Server-Side Tools**:
   - `check_availability({ service_name, date })`: Checks calendar/database for open slots.
   - `create_booking({ customer_id, service_name, date, time, notes })`: Creates appointment with default initial status **`PENDING`**.
   - `lookup_booking({ customer_id })`: Retrieves client appointments.
   - `cancel_booking({ booking_id, customer_id })`: Cancels an existing appointment.
   - `save_lead({ customer_id, name, phone, service, budget, status })`: Saves qualified CRM leads.
   - `update_customer_state({ customer_id, updates })`: Updates customer memory and preferences.
   - `request_human_handoff({ customer_id, conversation_id, reason })`: Escalates conversation to human desk.
4. **Stateful Conversation Memory**: Tracks client lead status, service interest, budget range, and recent 10-message context window across chat turns.
5. **SaaS Business Dashboard**:
   - Live Chat Timeline & Tool Execution Badges.
   - **One-Click Human Takeover Toggle** (`AI Active` vs `Human Takeover`).
   - Direct manual WhatsApp message dispatch from dashboard operator UI.
   - CRM Leads board & Appointment Bookings manager.
   - Built-in **Interactive WhatsApp Simulator UI**.
6. **Dual Mode Architecture**: Complete zero-dependency development mock adapters for offline local testing alongside production adapters for Groq, Meta WhatsApp, and Supabase.

---

## 📁 Project Structure
```
/app
  /api
    /auth/login
    /dashboard/stats
    /dashboard/conversations
    /dashboard/conversations/[id]/messages
    /dashboard/leads
    /dashboard/bookings
    /dashboard/handoffs
    /health
    /simulator/chat
    /whatsapp/webhook
  /dashboard
    page.tsx (Overview)
    /conversations/page.tsx (Live Chats & Human Takeover)
    /leads/page.tsx (CRM Leads)
    /bookings/page.tsx (Appointments - Status PENDING)
    /handoffs/page.tsx (Human Escalations)
    /simulator/page.tsx (Interactive WhatsApp Simulator)
  /login/page.tsx
  globals.css
  layout.tsx
  page.tsx

/components
/knowledge
  business.md
  services.md
  pricing.md
  faq.md
  policies.md
  opening-hours.md
  booking-rules.md
  tone-of-voice.md

/lib
  /ai/groq.ts (Groq AI Service & Dev Mock Fallback)
  /whatsapp/client.ts (Meta WhatsApp Outbound API & Webhook Auth)
  /supabase/db.ts (Supabase PostgreSQL Repository & Dev Memory Store)
  /knowledge/loader.ts (Knowledge Base Loader)
  /tools/index.ts (Controlled Server Tools & Schemas)

/supabase
  schema.sql (Complete Supabase PostgreSQL SQL Schema & RLS Policies)

/tests
  agent.test.ts (Automated Vitest Test Suite)

/types
  index.ts (TypeScript Interfaces)

.env.example
.env.local
next.config.mjs
tailwind.config.ts
vitest.config.ts
package.json
README.md
```

---

## 🔑 Environment Variables Setup

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Server-Side Variables:
- `GROQ_API_KEY`: Groq API key from [Groq Console](https://console.groq.com/).
- `GROQ_MODEL`: Selected Groq model (e.g., `llama-3.3-70b-versatile`).
- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID`: Meta WhatsApp Phone Number ID.
- `WHATSAPP_VERIFY_TOKEN`: Shared secret token for webhook verification.
- `WHATSAPP_APP_SECRET`: Meta App Secret for signature verification.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for backend database access.
- `DASHBOARD_ADMIN_EMAIL`: Dashboard login email (`admin@luxurenest.com`).
- `DASHBOARD_ADMIN_PASSWORD`: Dashboard login password (`admin123`).

---

## ⚡ Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Test via Interactive WhatsApp Simulator
Navigate to `http://localhost:3000/dashboard/simulator` to test conversations, tool calls, and human takeover live in your browser!

---

## 🗄️ Database Setup (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com).
2. Navigate to **SQL Editor**.
3. Copy contents of `supabase/schema.sql` and run the script.
4. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

---

## 🌐 Meta WhatsApp Cloud API Setup
1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com/).
2. Add **WhatsApp Product** to your application.
3. Configure Webhook URL: `https://your-domain.vercel.app/api/whatsapp/webhook`.
4. Enter your `WHATSAPP_VERIFY_TOKEN`.
5. Subscribe to `messages` webhook events.

---

## 🛡️ Security & Hardening Highlights
- Secrets (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`) are strictly kept server-side.
- All customer inputs are treated as untrusted text.
- Tool calls require JSON Schema validation via Zod; LLM cannot execute arbitrary code.
- Idempotency check prevents double processing of WhatsApp messages.
- Row Level Security (RLS) policies guard Supabase PostgreSQL tables.
