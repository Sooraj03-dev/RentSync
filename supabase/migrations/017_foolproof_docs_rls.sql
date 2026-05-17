-- Foolproof RLS policies for documents
DROP POLICY IF EXISTS "documents_tenant_select" ON public.documents;
DROP POLICY IF EXISTS "documents_landlord_select" ON public.documents;
DROP POLICY IF EXISTS "documents_tenant_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_landlord_insert" ON public.documents;

-- SELECT policies
CREATE POLICY "documents_tenant_select" ON public.documents FOR SELECT USING (
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

CREATE POLICY "documents_landlord_select" ON public.documents FOR SELECT USING (
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- INSERT policies
CREATE POLICY "documents_tenant_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

CREATE POLICY "documents_landlord_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.owner_id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';
