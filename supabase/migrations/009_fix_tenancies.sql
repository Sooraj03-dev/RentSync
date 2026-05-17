-- Fix tenancies table by adding missing columns
ALTER TABLE public.tenancies 
  ADD COLUMN IF NOT EXISTS unit_number text,
  ADD COLUMN IF NOT EXISTS rent_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_day int CHECK (due_day BETWEEN 1 AND 28) DEFAULT 1;

-- Reload schema cache so API can see the new columns
NOTIFY pgrst, 'reload schema';
