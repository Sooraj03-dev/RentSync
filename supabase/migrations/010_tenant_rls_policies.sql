-- 010_tenant_rls_policies.sql
-- Add RLS policies so tenants can accept invites, create tenancies, and start conversations

-- Allow tenants to update property_invites (to mark as accepted)
DROP POLICY IF EXISTS "tenant_update_invite" ON public.property_invites;
CREATE POLICY "tenant_update_invite" ON public.property_invites
  FOR UPDATE USING (status = 'pending');

-- Allow tenants to insert their own tenancy row
DROP POLICY IF EXISTS "tenant_insert_tenancy" ON public.tenancies;
CREATE POLICY "tenant_insert_tenancy" ON public.tenancies
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Allow tenants to update their own tenancy row (if needed later)
DROP POLICY IF EXISTS "tenant_update_tenancy" ON public.tenancies;
CREATE POLICY "tenant_update_tenancy" ON public.tenancies
  FOR UPDATE USING (auth.uid() = tenant_id);

-- Allow tenants to insert conversations
DROP POLICY IF EXISTS "tenant_insert_conv" ON public.conversations;
CREATE POLICY "tenant_insert_conv" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Ensure tenants can read profiles to see landlord names
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT USING (true);
