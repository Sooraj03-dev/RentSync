-- ============================================================
-- RentSync 003 — Invite Codes + In-App Chat
-- ============================================================

-- ── 1. property_invites ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number    text NOT NULL,
  code           text NOT NULL UNIQUE,
  landlord_id    uuid NOT NULL REFERENCES auth.users(id),
  assigned_email text,
  rent_amount    numeric NOT NULL DEFAULT 0,
  due_day        int NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at    timestamptz,
  tenant_id      uuid REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.property_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "landlord_own_invites" ON public.property_invites;
CREATE POLICY "landlord_own_invites" ON public.property_invites
  FOR ALL USING (landlord_id = auth.uid());

-- Allow tenants to read invites by code (for onboarding)
DROP POLICY IF EXISTS "tenant_read_by_code" ON public.property_invites;
CREATE POLICY "tenant_read_by_code" ON public.property_invites
  FOR SELECT USING (true);

-- Add invite_id to tenancies if not already there
ALTER TABLE public.tenancies ADD COLUMN IF NOT EXISTS
  invite_id uuid REFERENCES public.property_invites(id);

-- ── 2. conversations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id      uuid NOT NULL UNIQUE REFERENCES public.tenancies(id) ON DELETE CASCADE,
  landlord_id     uuid NOT NULL REFERENCES auth.users(id),
  tenant_id       uuid NOT NULL REFERENCES auth.users(id),
  last_message    text,
  last_message_at timestamptz,
  landlord_unread int DEFAULT 0,
  tenant_unread   int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conv_parties" ON public.conversations;
CREATE POLICY "conv_parties" ON public.conversations
  FOR ALL USING (landlord_id = auth.uid() OR tenant_id = auth.uid());

-- ── 3. messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  sender_role     text NOT NULL CHECK (sender_role IN ('landlord','tenant')),
  body            text NOT NULL CHECK (char_length(body) <= 2000),
  msg_type        text NOT NULL DEFAULT 'text'
                  CHECK (msg_type IN ('text','image','document','system')),
  file_url        text,
  file_name       text,
  is_read         bool DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msg_parties" ON public.messages;
CREATE POLICY "msg_parties" ON public.messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE landlord_id = auth.uid() OR tenant_id = auth.uid()
  )
);

-- Enable realtime for messages and property_invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

NOTIFY pgrst, 'reload schema';
