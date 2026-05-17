-- ================================================================
-- 012_fix_all_tenant_rls.sql
-- Fix ALL tenant RLS policies to avoid recursion and enable
-- seamless access to: messages, documents, maintenance, notices
-- ================================================================

-- ── 1. Drop the broken properties_tenant_select policy (causes recursion) ──
DROP POLICY IF EXISTS "properties_tenant_select" ON public.properties;

-- ── 2. Tenancies: ensure tenant can SELECT their own row ─────────────────────
DROP POLICY IF EXISTS "tenancies_tenant_select" ON public.tenancies;
CREATE POLICY "tenancies_tenant_select" ON public.tenancies
  FOR SELECT USING (auth.uid() = tenant_id);

-- ── 3. Tenancies: ensure tenant can INSERT their own row ─────────────────────
DROP POLICY IF EXISTS "tenant_insert_tenancy" ON public.tenancies;
CREATE POLICY "tenant_insert_tenancy" ON public.tenancies
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- ── 4. Tenancies: ensure tenant can UPDATE their own row ─────────────────────
DROP POLICY IF EXISTS "tenant_update_tenancy" ON public.tenancies;
CREATE POLICY "tenant_update_tenancy" ON public.tenancies
  FOR UPDATE USING (auth.uid() = tenant_id);

-- ── 5. property_invites: tenants can read any invite (needed for landlord lookup) ──
DROP POLICY IF EXISTS "tenant_read_by_code" ON public.property_invites;
CREATE POLICY "tenant_read_by_code" ON public.property_invites
  FOR SELECT USING (true);

-- ── 6. property_invites: tenants can update (accept) their invite ──────────────
DROP POLICY IF EXISTS "tenant_update_invite" ON public.property_invites;
CREATE POLICY "tenant_update_invite" ON public.property_invites
  FOR UPDATE USING (status = 'pending');

-- ── 7. conversations: both parties can read/write ─────────────────────────────
DROP POLICY IF EXISTS "conv_parties" ON public.conversations;
CREATE POLICY "conv_parties" ON public.conversations
  FOR ALL USING (landlord_id = auth.uid() OR tenant_id = auth.uid());

-- Tenant can create conversations
DROP POLICY IF EXISTS "tenant_insert_conv" ON public.conversations;
CREATE POLICY "tenant_insert_conv" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- ── 8. messages: both parties can read/write ──────────────────────────────────
DROP POLICY IF EXISTS "msg_parties" ON public.messages;
CREATE POLICY "msg_parties" ON public.messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE landlord_id = auth.uid() OR tenant_id = auth.uid()
  )
);

-- ── 9. documents: both tenant and landlord can read & upload ──────────────────
DROP POLICY IF EXISTS "documents_both_select" ON public.documents;
CREATE POLICY "documents_both_select" ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = documents.tenancy_id
      AND (t.tenant_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = t.property_id AND p.owner_id = auth.uid()
      ))
  )
);

DROP POLICY IF EXISTS "documents_both_insert" ON public.documents;
CREATE POLICY "documents_both_insert" ON public.documents FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = documents.tenancy_id
      AND (t.tenant_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = t.property_id AND p.owner_id = auth.uid()
      ))
  )
);

-- ── 10. maintenance_requests: tenant can read/insert their own ────────────────
DROP POLICY IF EXISTS "maintenance_tenant_all" ON public.maintenance_requests;
CREATE POLICY "maintenance_tenant_all" ON public.maintenance_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.id = maintenance_requests.tenancy_id
        AND t.tenant_id = auth.uid()
    )
  );

-- ── 11. notices: tenants can read notices for their property ──────────────────
DROP POLICY IF EXISTS "notices_tenant_select" ON public.notices;
CREATE POLICY "notices_tenant_select" ON public.notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.property_id = notices.property_id
        AND t.tenant_id = auth.uid()
        AND t.status = 'active'
    )
  );

-- ── 12. profiles: all authenticated users can read (needed for names) ─────────
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
