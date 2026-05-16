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
