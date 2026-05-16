-- ============================================================
-- RentSync Phase 1 — Full Schema + RLS
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. profiles (mirrors auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  role        text CHECK (role IN ('landlord','tenant')),
  name        text,
  phone       text,
  avatar_url  text,
  onboarded   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. properties ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  address      text,
  total_units  int DEFAULT 1,
  property_type text CHECK (property_type IN ('apartment','pg','independent','commercial')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_landlord_all" ON public.properties;
CREATE POLICY "properties_landlord_all"
  ON public.properties FOR ALL USING (auth.uid() = landlord_id);

-- ── 3. tenancies ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenancies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id    uuid REFERENCES public.profiles(id),
  unit_number  text,
  rent_amount  numeric NOT NULL DEFAULT 0,
  due_day      int CHECK (due_day BETWEEN 1 AND 28) DEFAULT 1,
  status       text CHECK (status IN ('active','ended')) DEFAULT 'active',
  invite_code  text UNIQUE,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenancies_landlord_all"   ON public.tenancies;
DROP POLICY IF EXISTS "tenancies_tenant_select"  ON public.tenancies;
CREATE POLICY "tenancies_landlord_all"
  ON public.tenancies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = tenancies.property_id AND p.landlord_id = auth.uid()
    )
  );
CREATE POLICY "tenancies_tenant_select"
  ON public.tenancies FOR SELECT
  USING (auth.uid() = tenant_id);

-- ── 4. rent_payments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id    uuid NOT NULL REFERENCES public.tenancies(id) ON DELETE CASCADE,
  amount_paid   numeric NOT NULL DEFAULT 0,
  payment_date  date DEFAULT CURRENT_DATE,
  month_year    text NOT NULL, -- YYYY-MM
  status        text CHECK (status IN ('paid','pending','late')) DEFAULT 'pending',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rent_payments_tenant_select"  ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_landlord_select" ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_both_insert"     ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_landlord_update" ON public.rent_payments;

CREATE POLICY "rent_payments_tenant_select"
  ON public.rent_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.id = rent_payments.tenancy_id AND t.tenant_id = auth.uid()
    )
  );
CREATE POLICY "rent_payments_landlord_select"
  ON public.rent_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = rent_payments.tenancy_id AND p.landlord_id = auth.uid()
    )
  );
CREATE POLICY "rent_payments_both_insert"
  ON public.rent_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = rent_payments.tenancy_id
        AND (t.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
  );
CREATE POLICY "rent_payments_landlord_update"
  ON public.rent_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = rent_payments.tenancy_id AND p.landlord_id = auth.uid()
    )
  );

-- ── 5. maintenance_requests ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id     uuid NOT NULL REFERENCES public.tenancies(id) ON DELETE CASCADE,
  title          text NOT NULL,
  category       text CHECK (category IN ('plumbing','electrical','cleaning','other')) DEFAULT 'other',
  status         text CHECK (status IN ('open','in_progress','resolved')) DEFAULT 'open',
  landlord_note  text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maintenance_tenant_insert_select" ON public.maintenance_requests;
DROP POLICY IF EXISTS "maintenance_landlord_select_update" ON public.maintenance_requests;

CREATE POLICY "maintenance_tenant_insert_select"
  ON public.maintenance_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.id = maintenance_requests.tenancy_id AND t.tenant_id = auth.uid()
    )
  );
CREATE POLICY "maintenance_landlord_select_update"
  ON public.maintenance_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = maintenance_requests.tenancy_id AND p.landlord_id = auth.uid()
    )
  );

-- ── 6. documents ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id    uuid NOT NULL REFERENCES public.tenancies(id) ON DELETE CASCADE,
  uploaded_by   uuid NOT NULL REFERENCES public.profiles(id),
  doc_type      text CHECK (doc_type IN ('agreement','aadhaar','receipt','other')) DEFAULT 'other',
  file_url      text NOT NULL,
  file_name     text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_both_select" ON public.documents;
DROP POLICY IF EXISTS "documents_both_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_uploader_delete" ON public.documents;

CREATE POLICY "documents_both_select"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = documents.tenancy_id
        AND (t.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
  );
CREATE POLICY "documents_both_insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.tenancies t
      JOIN public.properties p ON p.id = t.property_id
      WHERE t.id = documents.tenancy_id
        AND (t.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
  );
CREATE POLICY "documents_uploader_delete"
  ON public.documents FOR DELETE
  USING (auth.uid() = uploaded_by);

-- ── 7. notices ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id  uuid NOT NULL REFERENCES public.profiles(id),
  title        text NOT NULL,
  body         text,
  pinned       boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notices_landlord_write"  ON public.notices;
DROP POLICY IF EXISTS "notices_tenant_select"   ON public.notices;

CREATE POLICY "notices_landlord_write"
  ON public.notices FOR ALL
  USING (auth.uid() = landlord_id);
CREATE POLICY "notices_tenant_select"
  ON public.notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenancies t
      WHERE t.property_id = notices.property_id AND t.tenant_id = auth.uid()
    )
  );

-- ── 8. expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category     text CHECK (category IN ('repairs','utilities','maintenance','staff','other')) DEFAULT 'other',
  amount       numeric NOT NULL DEFAULT 0,
  description  text,
  expense_date date DEFAULT CURRENT_DATE,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_landlord_all" ON public.expenses;
CREATE POLICY "expenses_landlord_all"
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = expenses.property_id AND p.landlord_id = auth.uid()
    )
  );

-- ── 9. listings (stub for Phase 1) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number  text,
  rent_amount  numeric,
  lat          float8,
  lng          float8,
  is_available bool DEFAULT false,
  amenities    jsonb,
  photos       text[],
  contact_wa   text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings_public_select"   ON public.listings;
DROP POLICY IF EXISTS "listings_landlord_write"  ON public.listings;
CREATE POLICY "listings_public_select"
  ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_landlord_write"
  ON public.listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = listings.property_id AND p.landlord_id = auth.uid()
    )
  );

-- ── Storage buckets (run manually in dashboard if CLI unavailable) ──
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
