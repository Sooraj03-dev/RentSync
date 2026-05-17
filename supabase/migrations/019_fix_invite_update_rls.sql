-- Fix property_invites update policy
DROP POLICY IF EXISTS "tenant_update_invite" ON public.property_invites;

-- The USING clause restricts which rows can be updated (must be pending currently).
-- The WITH CHECK clause restricts what the new row can contain (we don't restrict it, so they can set it to accepted).
CREATE POLICY "tenant_update_invite" ON public.property_invites
  FOR UPDATE USING (status = 'pending') WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
