-- Foolproof Tenant Documents RLS Fix
-- Paste this into Supabase SQL Editor and run it

DROP POLICY IF EXISTS "documents_tenant_select" ON public.documents;
CREATE POLICY "documents_tenant_select" ON public.documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = documents.tenancy_id AND t.tenant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_tenant_insert" ON public.documents;
CREATE POLICY "documents_tenant_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = tenancy_id AND t.tenant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_tenant_delete" ON public.documents;
CREATE POLICY "documents_tenant_delete" ON public.documents FOR DELETE USING (
  auth.uid() = uploaded_by
);

-- Force reload the schema cache so policies apply immediately
NOTIFY pgrst, 'reload schema';
