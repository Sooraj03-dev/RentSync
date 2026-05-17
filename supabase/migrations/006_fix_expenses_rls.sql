-- Explicitly define both USING and WITH CHECK for the expenses table to fix RLS insert violations
DROP POLICY IF EXISTS "expenses_owner_all" ON public.expenses;

CREATE POLICY "expenses_owner_all" ON public.expenses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = expenses.property_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = expenses.property_id AND p.owner_id = auth.uid()
  )
);
