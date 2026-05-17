-- Add unit_details JSONB column to store individual flat breakdowns for multi-unit properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS unit_details jsonb DEFAULT '[]'::jsonb;
