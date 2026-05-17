-- Create missing storage buckets for documents and chat attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for Documents
DROP POLICY IF EXISTS "Public access to documents" ON storage.objects;
CREATE POLICY "Public access to documents" ON storage.objects 
  FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Auth upload documents" ON storage.objects;
CREATE POLICY "Auth upload documents" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Policies for Chat Attachments
DROP POLICY IF EXISTS "Public access to chat attachments" ON storage.objects;
CREATE POLICY "Public access to chat attachments" ON storage.objects 
  FOR SELECT USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Auth upload chat attachments" ON storage.objects;
CREATE POLICY "Auth upload chat attachments" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
