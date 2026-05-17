-- Fix for tenant document uploads

-- 1. Ensure tenant can select their own documents
DROP POLICY IF EXISTS "documents_tenant_select" ON public.documents;
CREATE POLICY "documents_tenant_select" ON public.documents FOR SELECT USING (
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

-- 2. Ensure tenant can insert their own documents
DROP POLICY IF EXISTS "documents_tenant_insert" ON public.documents;
CREATE POLICY "documents_tenant_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);

-- 3. Just to be completely safe, ensure they can delete their own docs if needed
DROP POLICY IF EXISTS "documents_tenant_delete" ON public.documents;
CREATE POLICY "documents_tenant_delete" ON public.documents FOR DELETE USING (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT id FROM public.tenancies WHERE tenant_id = auth.uid()
  )
);
