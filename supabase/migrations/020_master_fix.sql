-- Master Fix: Correcting column names and invite update policies

-- 1. Fix documents RLS (owner_id -> landlord_id)
DROP POLICY IF EXISTS "documents_landlord_select" ON public.documents;
CREATE POLICY "documents_landlord_select" ON public.documents FOR SELECT USING (
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.landlord_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_landlord_insert" ON public.documents;
CREATE POLICY "documents_landlord_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.landlord_id = auth.uid()
  )
);

-- 2. Fix Invite Acceptance Policy
DROP POLICY IF EXISTS "tenant_update_invite" ON public.property_invites;
CREATE POLICY "tenant_update_invite" ON public.property_invites
  FOR UPDATE USING (status = 'pending') WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
