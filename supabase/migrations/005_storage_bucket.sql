-- Create the 'properties' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true) 
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the 'properties' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'properties' );

DROP POLICY IF EXISTS "Authenticated Users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated Users can upload photos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'properties' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
CREATE POLICY "Users can update their own photos" ON storage.objects FOR UPDATE USING ( bucket_id = 'properties' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING ( bucket_id = 'properties' AND auth.uid() = owner );
