
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT DEFAULT 'Eastern Concrete Foundation, Inc.',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create catalog_items table
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'extras',
  section TEXT NOT NULL DEFAULT 'ftg_wall',
  default_unit TEXT NOT NULL DEFAULT 'EA',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalog" ON public.catalog_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own catalog" ON public.catalog_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalog" ON public.catalog_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own catalog" ON public.catalog_items FOR DELETE USING (auth.uid() = user_id);

-- 3. Create new proposals table (proposals_v2 to avoid conflict with existing)
CREATE TABLE public.proposals_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builder TEXT DEFAULT '',
  job_location TEXT DEFAULT '',
  county TEXT DEFAULT '',
  foundation_type TEXT DEFAULT 'Custom',
  foundation_size TEXT DEFAULT '',
  proposal_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft',
  concrete_yards_override NUMERIC,
  concrete_per_yard NUMERIC,
  labor_per_yard NUMERIC DEFAULT 60,
  other_costs NUMERIC DEFAULT 0,
  other_costs_note TEXT DEFAULT '',
  standard_total NUMERIC DEFAULT 0,
  optional_total NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proposals_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals" ON public.proposals_v2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proposals" ON public.proposals_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals_v2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals_v2 FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_proposals_v2_builder ON public.proposals_v2(user_id, builder);
CREATE INDEX idx_proposals_v2_county ON public.proposals_v2(user_id, county);
CREATE INDEX idx_proposals_v2_date ON public.proposals_v2(user_id, proposal_date DESC);
CREATE INDEX idx_proposals_v2_status ON public.proposals_v2(user_id, status);

-- 4. Create proposal_line_items table
CREATE TABLE public.proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals_v2(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  section TEXT DEFAULT 'ftg_wall',
  sort_order INTEGER DEFAULT 0,
  qty NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'LF',
  description TEXT NOT NULL DEFAULT '',
  standard_unit_price NUMERIC,
  standard_total NUMERIC,
  optional_unit_price NUMERIC,
  optional_total NUMERIC,
  auto_cy NUMERIC,
  cy_override NUMERIC,
  wall_cy NUMERIC,
  ftg_cy NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own line items" ON public.proposal_line_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals_v2 WHERE id = proposal_line_items.proposal_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own line items" ON public.proposal_line_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals_v2 WHERE id = proposal_line_items.proposal_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own line items" ON public.proposal_line_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.proposals_v2 WHERE id = proposal_line_items.proposal_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own line items" ON public.proposal_line_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.proposals_v2 WHERE id = proposal_line_items.proposal_id AND user_id = auth.uid()));

-- 5. Create price_history table
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals_v2(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  qty NUMERIC,
  pricing_type TEXT NOT NULL,
  builder TEXT,
  job_location TEXT,
  county TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price history" ON public.price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own price history" ON public.price_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own price history" ON public.price_history FOR DELETE USING (auth.uid() = user_id);

-- 6. Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- 7. Create updated_at trigger function (if not exists, extend existing)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_catalog_items_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_v2_updated_at BEFORE UPDATE ON public.proposals_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'Eastern Concrete Foundation, Inc.'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
