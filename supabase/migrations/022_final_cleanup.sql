-- 022 Final Cleanup (Master Fix)

-- 1. Fix documents RLS (revert to owner_id, but split logic safely)
DROP POLICY IF EXISTS "documents_landlord_select" ON public.documents;
CREATE POLICY "documents_landlord_select" ON public.documents FOR SELECT USING (
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_landlord_insert" ON public.documents;
CREATE POLICY "documents_landlord_insert" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- 2. Fix Landlord Maintenance RLS to avoid EXISTS join crashes
DROP POLICY IF EXISTS "maintenance_owner_select_update" ON public.maintenance_requests;
CREATE POLICY "maintenance_owner_select_update" ON public.maintenance_requests FOR ALL USING (
  tenancy_id IN (
    SELECT t.id FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- 3. Fix Invite Acceptance Policy
DROP POLICY IF EXISTS "tenant_update_invite" ON public.property_invites;
CREATE POLICY "tenant_update_invite" ON public.property_invites
  FOR UPDATE USING (status = 'pending') WITH CHECK (true);

-- 4. Self-Heal stuck pending invites
UPDATE public.property_invites pi
SET status = 'accepted', accepted_at = now()
FROM public.tenancies t
WHERE t.invite_id = pi.id AND pi.status = 'pending';

NOTIFY pgrst, 'reload schema';
