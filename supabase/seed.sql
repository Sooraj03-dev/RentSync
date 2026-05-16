-- ============================================================
-- RentSync Seed Data
-- Run AFTER schema migration
-- NOTE: Replace UUIDs with real auth.users IDs after sign-up
-- ============================================================

-- Seed profiles (assumes these users exist in auth.users)
-- In development, sign up both users first, then run:
-- UPDATE public.profiles SET role='landlord', name='Ramesh Kumar', phone='+91 9876543210' WHERE email='ramesh@example.com';
-- UPDATE public.profiles SET role='tenant',   name='Priya Sharma',  phone='+91 9876543211' WHERE email='priya@example.com';

-- For demo with known UUIDs (replace as needed):
DO $$
DECLARE
  landlord_id uuid;
  tenant_id   uuid;
  prop1_id    uuid := gen_random_uuid();
  prop2_id    uuid := gen_random_uuid();
  ten1_id     uuid := gen_random_uuid();
  ten2_id     uuid := gen_random_uuid();
  ten3_id     uuid := gen_random_uuid();
BEGIN
  -- Get landlord and tenant IDs from profiles
  SELECT id INTO landlord_id FROM public.profiles WHERE role = 'landlord' ORDER BY created_at LIMIT 1;
  SELECT id INTO tenant_id   FROM public.profiles WHERE role = 'tenant'   ORDER BY created_at LIMIT 1;

  IF landlord_id IS NULL OR tenant_id IS NULL THEN
    RAISE NOTICE 'Seed skipped: no landlord or tenant profile found. Sign up both users first.';
    RETURN;
  END IF;

  -- Properties
  INSERT INTO public.properties (id, landlord_id, name, address, total_units, property_type)
  VALUES
    (prop1_id, landlord_id, 'Skyview Towers', '42, MG Road, Bengaluru – 560001', 8, 'apartment'),
    (prop2_id, landlord_id, 'Green Villa PG', '17, HSR Layout, Bengaluru – 560102', 4, 'pg')
  ON CONFLICT (id) DO NOTHING;

  -- Tenancies
  INSERT INTO public.tenancies (id, property_id, tenant_id, unit_number, rent_amount, due_day, status, invite_code)
  VALUES
    (ten1_id, prop1_id, tenant_id, 'Apt 4B', 18000, 5, 'active', 'PRIYA001'),
    (ten2_id, prop1_id, NULL,      'Apt 2A', 15000, 1, 'active', 'VACANT01'),
    (ten3_id, prop2_id, NULL,      'Room 3',  8000, 1, 'active', 'VACANT02')
  ON CONFLICT (id) DO NOTHING;

  -- Rent Payments
  INSERT INTO public.rent_payments (tenancy_id, amount_paid, payment_date, month_year, status)
  VALUES
    (ten1_id, 18000, '2026-05-05', '2026-05', 'paid'),
    (ten1_id, 18000, '2026-04-05', '2026-04', 'paid'),
    (ten1_id, 18000, '2026-03-07', '2026-03', 'late')
  ON CONFLICT DO NOTHING;

  -- Maintenance Requests
  INSERT INTO public.maintenance_requests (tenancy_id, title, category, status, landlord_note)
  VALUES
    (ten1_id, 'Leaking tap in bathroom', 'plumbing', 'open', NULL),
    (ten1_id, 'AC not cooling', 'electrical', 'in_progress', 'Technician scheduled for Friday'),
    (ten1_id, 'Window latch broken', 'other', 'resolved', 'Fixed on 12-May')
  ON CONFLICT DO NOTHING;

  -- Notices
  INSERT INTO public.notices (property_id, landlord_id, title, body, pinned)
  VALUES
    (prop1_id, landlord_id, 'Society Maintenance – May', 'Dear tenants, society maintenance of ₹500 will be collected with June rent.', true),
    (prop1_id, landlord_id, 'Water Supply Disruption', 'Water supply will be off on 20-May between 10am–2pm for pipeline work.', false)
  ON CONFLICT DO NOTHING;

  -- Expenses
  INSERT INTO public.expenses (property_id, category, amount, description, expense_date)
  VALUES
    (prop1_id, 'utilities',    4500, 'Common area electricity – May', '2026-05-01'),
    (prop1_id, 'repairs',     12000, 'Terrace waterproofing',         '2026-04-15'),
    (prop1_id, 'maintenance',  3000, 'Lift servicing',                '2026-04-20'),
    (prop1_id, 'staff',        8000, 'Security guard salary – May',   '2026-05-01'),
    (prop2_id, 'utilities',    2200, 'Electricity bill – May',        '2026-05-02')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed completed successfully.';
END;
$$;
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own push subscription"
ON public.push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own push subscription"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscription"
ON public.push_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add Seed Data for Listings (Bengaluru Map)
-- Assuming Landlord 'Ramesh' has an ID or we just pick the first landlord
DO $$
DECLARE
    landlord_user_id uuid;
    prop_id uuid;
BEGIN
    SELECT id INTO landlord_user_id FROM public.profiles WHERE role = 'landlord' LIMIT 1;
    
    IF landlord_user_id IS NOT NULL THEN
        -- Create a dummy property for these seed listings
        INSERT INTO public.properties (landlord_id, name, address, property_type)
        VALUES (landlord_user_id, 'Bengaluru Seed Properties', 'Bengaluru, Karnataka', 'apartment')
        RETURNING id INTO prop_id;

        -- Insert the 5 seed listings
        INSERT INTO public.listings (property_id, unit_number, rent_amount, lat, lng, amenities, contact_wa, is_available)
        VALUES 
            (prop_id, 'Koramangala 5th Block PG', 12000, 12.9352, 77.6245, ARRAY['wifi', 'meals'], '919876543210', true),
            (prop_id, 'Indiranagar 12th Main Flat', 25000, 12.9784, 77.6408, ARRAY['wifi', 'ac', 'parking'], '919876543210', true),
            (prop_id, 'HSR Layout Sector 2 PG', 10500, 12.9116, 77.6389, ARRAY['wifi', 'laundry'], '919876543210', true),
            (prop_id, 'Whitefield ITPL Road Flat', 22000, 12.9698, 77.7499, ARRAY['wifi', 'ac', 'parking'], '919876543210', true),
            (prop_id, 'Jayanagar 4th Block PG', 9000, 12.9299, 77.5826, ARRAY['meals', 'laundry'], '919876543210', true);
    END IF;
END $$;

