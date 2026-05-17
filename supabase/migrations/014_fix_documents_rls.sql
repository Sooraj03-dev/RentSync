-- Fix documents RLS policy for insert and select

-- Drop old policies
DROP POLICY IF EXISTS "documents_both_select" ON public.documents;
DROP POLICY IF EXISTS "documents_both_insert" ON public.documents;

-- 1. Tenants can SELECT documents for their active tenancy
CREATE POLICY "documents_tenant_select" ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = tenancy_id AND t.tenant_id = auth.uid()
  )
);

-- 2. Landlords can SELECT documents for their properties
CREATE POLICY "documents_landlord_select" ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = tenancy_id AND p.owner_id = auth.uid()
  )
);

-- 3. Tenants can INSERT documents for their active tenancy
CREATE POLICY "documents_tenant_insert" ON public.documents FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tenancies t
    WHERE t.id = tenancy_id AND t.tenant_id = auth.uid()
  )
);

-- 4. Landlords can INSERT documents for their properties
CREATE POLICY "documents_landlord_insert" ON public.documents FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = tenancy_id AND p.owner_id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';
