-- Rename landlord_id to owner_id in properties table
ALTER TABLE public.properties RENAME COLUMN landlord_id TO owner_id;

-- Update RLS policies for properties
DROP POLICY IF EXISTS "properties_landlord_all" ON public.properties;
CREATE POLICY "properties_owner_all" ON public.properties FOR ALL USING (auth.uid() = owner_id);

-- Rename landlord_id to owner_id in notices table
ALTER TABLE public.notices RENAME COLUMN landlord_id TO owner_id;

-- Update RLS policies for notices
DROP POLICY IF EXISTS "notices_landlord_write" ON public.notices;
CREATE POLICY "notices_owner_write" ON public.notices FOR ALL USING (auth.uid() = owner_id);

-- Update RLS for tenancies (uses property ownership)
DROP POLICY IF EXISTS "tenancies_landlord_all" ON public.tenancies;
CREATE POLICY "tenancies_owner_all" ON public.tenancies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = tenancies.property_id AND p.owner_id = auth.uid()
  )
);

-- Update RLS for rent_payments
DROP POLICY IF EXISTS "rent_payments_landlord_select" ON public.rent_payments;
CREATE POLICY "rent_payments_owner_select" ON public.rent_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = rent_payments.tenancy_id AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "rent_payments_both_insert" ON public.rent_payments;
CREATE POLICY "rent_payments_both_insert" ON public.rent_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = rent_payments.tenancy_id
      AND (t.tenant_id = auth.uid() OR p.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "rent_payments_landlord_update" ON public.rent_payments;
CREATE POLICY "rent_payments_owner_update" ON public.rent_payments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = rent_payments.tenancy_id AND p.owner_id = auth.uid()
  )
);

-- Update RLS for maintenance_requests
DROP POLICY IF EXISTS "maintenance_landlord_select_update" ON public.maintenance_requests;
CREATE POLICY "maintenance_owner_select_update" ON public.maintenance_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = maintenance_requests.tenancy_id AND p.owner_id = auth.uid()
  )
);

-- Update RLS for documents
DROP POLICY IF EXISTS "documents_both_select" ON public.documents;
CREATE POLICY "documents_both_select" ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = documents.tenancy_id
      AND (t.tenant_id = auth.uid() OR p.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "documents_both_insert" ON public.documents;
CREATE POLICY "documents_both_insert" ON public.documents FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = documents.tenancy_id
      AND (t.tenant_id = auth.uid() OR p.owner_id = auth.uid())
  )
);

-- Update RLS for expenses
DROP POLICY IF EXISTS "expenses_landlord_all" ON public.expenses;
CREATE POLICY "expenses_owner_all" ON public.expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = expenses.property_id AND p.owner_id = auth.uid()
  )
);

-- Update RLS for listings
DROP POLICY IF EXISTS "listings_landlord_write" ON public.listings;
CREATE POLICY "listings_owner_write" ON public.listings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = listings.property_id AND p.owner_id = auth.uid()
  )
);
