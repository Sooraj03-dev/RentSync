-- Fix messages RLS policy for insert

-- Drop old combined policy
DROP POLICY IF EXISTS "msg_parties" ON public.messages;

-- Create split policies for SELECT and INSERT to ensure it works correctly
CREATE POLICY "msg_parties_select" ON public.messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE landlord_id = auth.uid() OR tenant_id = auth.uid()
  )
);

CREATE POLICY "msg_parties_insert" ON public.messages FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE landlord_id = auth.uid() OR tenant_id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';
