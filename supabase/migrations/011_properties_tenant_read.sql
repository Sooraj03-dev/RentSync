-- Allow tenants to read their own property details
DROP POLICY IF EXISTS "properties_tenant_select" ON public.properties;
CREATE POLICY "properties_tenant_select" ON public.properties
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.property_id = properties.id
        AND t.tenant_id = auth.uid()
        AND t.status = 'active'
    )
  );

NOTIFY pgrst, 'reload schema';
