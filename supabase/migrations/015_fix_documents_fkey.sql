-- Fix documents foreign key
ALTER TABLE public.documents 
  DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
