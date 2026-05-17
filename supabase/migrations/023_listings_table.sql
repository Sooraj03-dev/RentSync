-- 023: Create listings table for the Find a Home page
CREATE TABLE IF NOT EXISTS public.listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number  text NOT NULL,
  rent_amount  int NOT NULL,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  amenities    jsonb DEFAULT '{}',
  photos       text[] DEFAULT '{}',
  contact_wa   text,
  description  text,
  property_type text CHECK (property_type IN ('pg','flat','villa','studio')),
  locality     text,
  is_available boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view available listings (public discovery)
DROP POLICY IF EXISTS "listings_public_select" ON public.listings;
CREATE POLICY "listings_public_select" ON public.listings
  FOR SELECT USING (is_available = true);

-- Landlords can manage their own listings
DROP POLICY IF EXISTS "listings_owner_all" ON public.listings;
CREATE POLICY "listings_owner_all" ON public.listings
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Seed some real Bengaluru listings
INSERT INTO public.listings (unit_number, rent_amount, lat, lng, amenities, photos, contact_wa, description, property_type, locality, is_available)
VALUES
  ('Koramangala PG Room', 9500, 12.9352, 77.6245, '{"wifi":true,"meals":true,"laundry":true}', '{}', '919876543210', 'Spacious PG room with home-cooked meals in the heart of Koramangala', 'pg', 'Koramangala', true),
  ('Indiranagar 1BHK Flat', 24000, 12.9784, 77.6408, '{"wifi":true,"ac":true,"parking":true}', '{}', '919876543211', 'Modern 1BHK with AC and covered parking near 100 Feet Road', 'flat', 'Indiranagar', true),
  ('HSR Layout PG', 10500, 12.9116, 77.6389, '{"wifi":true,"laundry":true}', '{}', '919876543212', 'Clean PG room in HSR Layout Sector 2 near tech parks', 'pg', 'HSR Layout', true),
  ('Whitefield Studio Flat', 18000, 12.9698, 77.7499, '{"wifi":true,"ac":true,"parking":true}', '{}', '919876543213', 'Studio apartment near ITPL, fully furnished with AC', 'studio', 'Whitefield', true),
  ('Jayanagar 2BHK Flat', 28000, 12.9299, 77.5826, '{"wifi":true,"ac":true,"meals":false,"parking":true}', '{}', '919876543214', 'Spacious 2BHK in premium Jayanagar 4th Block', 'flat', 'Jayanagar', true),
  ('BTM Layout PG Room', 8500, 12.9166, 77.6101, '{"wifi":true,"meals":true}', '{}', '919876543215', 'Affordable PG with meals near BTM Layout 2nd Stage', 'pg', 'BTM Layout', true),
  ('Marathahalli 1BHK', 20000, 12.9591, 77.6972, '{"wifi":true,"ac":true}', '{}', '919876543216', '1BHK flat close to Marathahalli bridge and tech parks', 'flat', 'Marathahalli', true),
  ('Electronic City PG', 7500, 12.8394, 77.6786, '{"wifi":true,"meals":true,"laundry":true}', '{}', '919876543217', 'Budget PG with all meals near Electronic City Phase 1', 'pg', 'Electronic City', true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
