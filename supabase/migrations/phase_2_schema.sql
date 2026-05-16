-- Add invite_code column to tenancies (for tenant onboarding)
ALTER TABLE tenancies ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Add name, phone, and avatar_url to profiles (as we are using profiles table instead of auth.users directly)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add property_type to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type text
  CHECK (property_type IN ('apartment','pg','independent','commercial'));

-- Generate invite codes for existing seeded tenancies (if table exists)
UPDATE tenancies SET invite_code = upper(substr(md5(random()::text), 1, 8))
WHERE invite_code IS NULL;

-- Note: Storage bucket 'avatars' with Public read access must be created manually in Supabase Dashboard.
