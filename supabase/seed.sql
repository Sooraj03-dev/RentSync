-- supabase/seed.sql

-- Clear existing data if necessary (be careful with this in real environments)
-- TRUNCATE properties CASCADE;
-- TRUNCATE users CASCADE;

-- Users (1 Landlord, 3 Tenants)
INSERT INTO auth.users (id, email) VALUES
('d1111111-1111-1111-1111-111111111111', 'ramesh.landlord@example.com'),
('d2222222-2222-2222-2222-222222222222', 'tenant1@example.com'),
('d3333333-3333-3333-3333-333333333333', 'tenant2@example.com'),
('d4444444-4444-4444-4444-444444444444', 'tenant3@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, email, name, role) VALUES
('d1111111-1111-1111-1111-111111111111', 'ramesh.landlord@example.com', 'Ramesh', 'landlord'),
('d2222222-2222-2222-2222-222222222222', 'tenant1@example.com', 'Rahul', 'tenant'),
('d3333333-3333-3333-3333-333333333333', 'tenant2@example.com', 'Priya', 'tenant'),
('d4444444-4444-4444-4444-444444444444', 'tenant3@example.com', 'Vikram', 'tenant')
ON CONFLICT (id) DO NOTHING;

-- Properties
INSERT INTO public.properties (id, landlord_id, name, address, city, state, zip) VALUES
('p1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Koramangala Heights', '123 Main St, Koramangala', 'Bengaluru', 'Karnataka', '560034'),
('p2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'Indiranagar Villas', '456 100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038')
ON CONFLICT (id) DO NOTHING;

-- Tenancies (Linking Tenants to Properties)
INSERT INTO public.tenancies (id, property_id, tenant_id, rent_amount, due_day, status, start_date) VALUES
('t1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 18000, 5, 'active', '2023-01-01'),
('t2222222-2222-2222-2222-222222222222', 'p1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', 18000, 5, 'active', '2023-06-01'),
('t3333333-3333-3333-3333-333333333333', 'p2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', 22000, 10, 'active', '2023-08-01')
ON CONFLICT (id) DO NOTHING;

-- Rent Payments (3 months mix)
INSERT INTO public.rent_payments (id, tenancy_id, amount, status, due_date, paid_date) VALUES
(gen_random_uuid(), 't1111111-1111-1111-1111-111111111111', 18000, 'paid', '2023-09-05', '2023-09-04'),
(gen_random_uuid(), 't1111111-1111-1111-1111-111111111111', 18000, 'paid', '2023-10-05', '2023-10-05'),
(gen_random_uuid(), 't1111111-1111-1111-1111-111111111111', 18000, 'pending', '2023-11-05', NULL),
(gen_random_uuid(), 't3333333-3333-3333-3333-333333333333', 22000, 'paid', '2023-09-10', '2023-09-09'),
(gen_random_uuid(), 't3333333-3333-3333-3333-333333333333', 22000, 'late', '2023-10-10', NULL)
ON CONFLICT DO NOTHING;

-- Maintenance Requests
INSERT INTO public.maintenance_requests (id, tenancy_id, property_id, title, description, status) VALUES
(gen_random_uuid(), 't1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Leaky Faucet', 'The kitchen sink is leaking.', 'open'),
(gen_random_uuid(), 't3333333-3333-3333-3333-333333333333', 'p2222222-2222-2222-2222-222222222222', 'AC not cooling', 'The master bedroom AC is blowing warm air.', 'in_progress')
ON CONFLICT DO NOTHING;

-- Notices
INSERT INTO public.notices (id, property_id, title, content, is_pinned) VALUES
(gen_random_uuid(), 'p1111111-1111-1111-1111-111111111111', 'Water Supply Cut', 'Water will be unavailable from 2PM to 5PM tomorrow.', true),
(gen_random_uuid(), 'p2222222-2222-2222-2222-222222222222', 'Pest Control', 'Scheduled for next weekend.', false)
ON CONFLICT DO NOTHING;

-- Expenses
INSERT INTO public.expenses (id, property_id, category, description, amount, date) VALUES
(gen_random_uuid(), 'p1111111-1111-1111-1111-111111111111', 'Repair', 'Plumbing fix', 1500, CURRENT_DATE),
(gen_random_uuid(), 'p1111111-1111-1111-1111-111111111111', 'Utility', 'Common area electricity', 2000, CURRENT_DATE - INTERVAL '5 days'),
(gen_random_uuid(), 'p2222222-2222-2222-2222-222222222222', 'Maintenance', 'Garden cleaning', 800, CURRENT_DATE - INTERVAL '15 days'),
(gen_random_uuid(), 'p2222222-2222-2222-2222-222222222222', 'Other', 'Legal documentation', 5000, CURRENT_DATE - INTERVAL '1 month')
ON CONFLICT DO NOTHING;

-- Listings with lat/lng in Bengaluru
INSERT INTO public.listings (id, property_id, title, description, rent_amount, lat, lng, is_available, amenities) VALUES
(gen_random_uuid(), 'p1111111-1111-1111-1111-111111111111', 'Cozy 1BHK in Koramangala', 'Great location.', 18000, 12.9352, 77.6245, true, '{"wifi": true, "ac": false}'),
(gen_random_uuid(), 'p2222222-2222-2222-2222-222222222222', 'Spacious 2BHK in Indiranagar', 'Premium area.', 22000, 12.9784, 77.6408, true, '{"wifi": true, "ac": false}'),
(gen_random_uuid(), NULL, 'Affordable 1BHK in HSR Layout', 'Quiet neighborhood.', 15000, 12.9121, 77.6446, true, '{"wifi": true, "ac": false}'),
(gen_random_uuid(), NULL, 'Studio in BTM Layout', 'Perfect for singles.', 12000, 12.9165, 77.6101, true, '{"wifi": true, "ac": false}'),
(gen_random_uuid(), NULL, 'Modern 1BHK in Whitefield', 'Near tech park.', 14000, 12.9698, 77.7500, true, '{"wifi": true, "ac": false}')
ON CONFLICT DO NOTHING;
