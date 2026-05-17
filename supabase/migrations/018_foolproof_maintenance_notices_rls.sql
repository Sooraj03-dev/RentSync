-- Foolproof RLS policies for maintenance and notices
-- Replace brittle EXISTS clauses with reliable IN clauses

-- 1. Maintenance Requests
DROP POLICY IF EXISTS "maintenance_tenant_all" ON public.maintenance_requests;

-- Split FOR ALL into SELECT, INSERT, UPDATE for safety
CREATE POLICY "maintenance_tenant_select" ON public.maintenance_requests FOR SELECT USING (
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

CREATE POLICY "maintenance_tenant_insert" ON public.maintenance_requests FOR INSERT WITH CHECK (
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

CREATE POLICY "maintenance_tenant_update" ON public.maintenance_requests FOR UPDATE USING (
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

-- 2. Notices
DROP POLICY IF EXISTS "notices_tenant_select" ON public.notices;

CREATE POLICY "notices_tenant_select" ON public.notices FOR SELECT USING (
  property_id IN (
    SELECT property_id FROM public.tenancies 
    WHERE tenant_id = auth.uid() AND status = 'active'
  )
);

NOTIFY pgrst, 'reload schema';
