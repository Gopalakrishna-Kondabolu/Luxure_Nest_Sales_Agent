-- ============================================================
-- WHATSAPP AI SALES AGENT (LUXURE NEST) - SUPABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. CUSTOMERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on whatsapp_id for quick lookups during incoming webhooks
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_id ON public.customers(whatsapp_id);

-- ------------------------------------------------------------
-- 2. CONVERSATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'human_takeover', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- ------------------------------------------------------------
-- 3. MESSAGES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(128) UNIQUE,
    direction VARCHAR(16) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    sender_type VARCHAR(16) NOT NULL CHECK (sender_type IN ('customer', 'ai_agent', 'human_agent')),
    content TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'delivered' CHECK (status IN ('received', 'processing', 'sent', 'delivered', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer_id ON public.messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON public.messages(whatsapp_message_id);

-- ------------------------------------------------------------
-- 4. CUSTOMER_STATE TABLE (Structured Memory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_interest VARCHAR(255),
    budget VARCHAR(128),
    preferred_date VARCHAR(64),
    preferred_time VARCHAR(64),
    qualification_notes TEXT,
    lead_status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (lead_status IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'UNQUALIFIED', 'HUMAN_REVIEW', 'CONVERTED')),
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_state_customer_id ON public.customer_state(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_state_lead_status ON public.customer_state(lead_status);

-- ------------------------------------------------------------
-- 5. LEADS TABLE (CRM Records)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(64),
    service VARCHAR(255),
    budget VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'UNQUALIFIED', 'HUMAN_REVIEW', 'CONVERTED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- ------------------------------------------------------------
-- 6. BOOKINGS TABLE (Appointments)
-- Default status set to 'PENDING' per project requirement
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON public.bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- ------------------------------------------------------------
-- 7. TOOL_ACTIONS TABLE (Audit log of agent tool calls)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tool_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    tool_name VARCHAR(128) NOT NULL,
    arguments JSONB NOT NULL,
    result JSONB NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_actions_conversation_id ON public.tool_actions(conversation_id);

-- ------------------------------------------------------------
-- 8. HUMAN_HANDOFFS TABLE (Escalation Queue)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.human_handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED')),
    assigned_to VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_human_handoffs_status ON public.human_handoffs(status);

-- ------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE OR REPLACE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER set_customer_state_updated_at BEFORE UPDATE ON public.customer_state FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER set_human_handoffs_updated_at BEFORE UPDATE ON public.human_handoffs FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Service Role Key bypasses RLS for backend API operations.
-- Authenticated users (dashboard operators) can view and update.
-- ------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_handoffs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (dashboard admins) access
CREATE POLICY "Allow authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage customers" ON public.customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage conversations" ON public.conversations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage messages" ON public.messages FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read customer_state" ON public.customer_state FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage customer_state" ON public.customer_state FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage leads" ON public.leads FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage bookings" ON public.bookings FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read tool_actions" ON public.tool_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read human_handoffs" ON public.human_handoffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage human_handoffs" ON public.human_handoffs FOR ALL TO authenticated USING (true);
