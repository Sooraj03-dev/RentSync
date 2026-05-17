-- Fix: Add missing created_at column to documents table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Reload the schema cache to immediately reflect the column addition
NOTIFY pgrst, 'reload schema';
