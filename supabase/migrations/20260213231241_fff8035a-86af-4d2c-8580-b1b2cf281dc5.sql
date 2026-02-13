
-- Item Catalog table
CREATE TABLE public.item_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catalog items"
  ON public.item_catalog FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert catalog items"
  ON public.item_catalog FOR INSERT
  WITH CHECK (true);

-- Proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  job_location TEXT DEFAULT '',
  county TEXT DEFAULT '',
  foundation_type TEXT DEFAULT '',
  foundation_size TEXT DEFAULT '',
  concrete_per_yard NUMERIC DEFAULT 0,
  labor_per_yard NUMERIC DEFAULT 60,
  other_costs NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read proposals"
  ON public.proposals FOR SELECT USING (true);

CREATE POLICY "Anyone can insert proposals"
  ON public.proposals FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update proposals"
  ON public.proposals FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete proposals"
  ON public.proposals FOR DELETE USING (true);

-- Line Items table
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('ftg', 'slab')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  qty NUMERIC,
  unit TEXT NOT NULL DEFAULT 'LF' CHECK (unit IN ('LF', 'SF', 'EA', 'CY', 'HR', 'LS')),
  description TEXT DEFAULT '',
  unit_price_std NUMERIC,
  unit_price_opt NUMERIC,
  cy_override NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read line items"
  ON public.line_items FOR SELECT USING (true);

CREATE POLICY "Anyone can insert line items"
  ON public.line_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update line items"
  ON public.line_items FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete line items"
  ON public.line_items FOR DELETE USING (true);

-- Updated_at trigger for proposals
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the item catalog with all 194 items
INSERT INTO public.item_catalog (name) VALUES
('1'' x 10" Wall - with 10" x 20" Footings'),
('1'' x 10" Wall - with 8" x 16" Footings'),
('1'' x 12" Wall - with 10" x 20" Footings'),
('1'' x 12" Wall - with 8" x 16" Footings'),
('1'' x 8" Wall - with 10" x 20" Footings'),
('1'' x 8" Wall - with 8" x 16" Footings'),
('2'' x 10" Wall - with 10" x 20" Footings'),
('2'' x 10" Wall - with 8" x 16" Footings'),
('2'' x 12" Wall - with 10" x 20" Footings'),
('2'' x 12" Wall - with 8" x 16" Footings'),
('2'' x 8" Wall - with 10" x 20" Footings'),
('2'' x 8" Wall - with 8" x 16" Footings'),
('3'' x 10" Wall - with 10" x 20" Footings'),
('3'' x 10" Wall - with 8" x 16" Footings'),
('3'' x 12" Wall - with 10" x 20" Footings'),
('3'' x 12" Wall - with 8" x 16" Footings'),
('3'' x 8" Wall - with 10" x 20" Footings'),
('3'' x 8" Wall - with 8" x 16" Footings'),
('4'' x 10" Wall - with 10" x 20" Footings'),
('4'' x 10" Wall - with 8" x 16" Footings'),
('4'' x 12" Wall - with 10" x 20" Footings'),
('4'' x 12" Wall - with 8" x 16" Footings'),
('4'' x 8" Wall - with 10" x 20" Footings'),
('4'' x 8" Wall - with 8" x 16" Footings'),
('5'' x 10" Wall - with 10" x 20" Footings'),
('5'' x 10" Wall - with 8" x 16" Footings'),
('5'' x 12" Wall - with 10" x 20" Footings'),
('5'' x 12" Wall - with 8" x 16" Footings'),
('5'' x 8" Wall - with 10" x 20" Footings'),
('5'' x 8" Wall - with 8" x 16" Footings'),
('6'' x 10" Wall - with 10" x 20" Footings'),
('6'' x 10" Wall - with 8" x 16" Footings'),
('6'' x 12" Wall - with 10" x 20" Footings'),
('6'' x 12" Wall - with 8" x 16" Footings'),
('6'' x 8" Wall - with 10" x 20" Footings'),
('6'' x 8" Wall - with 8" x 16" Footings'),
('7'' x 10" Wall - with 10" x 20" Footings'),
('7'' x 10" Wall - with 8" x 16" Footings'),
('7'' x 12" Wall - with 10" x 20" Footings'),
('7'' x 12" Wall - with 8" x 16" Footings'),
('7'' x 8" Wall - with 10" x 20" Footings'),
('7'' x 8" Wall - with 8" x 16" Footings'),
('8'' x 10" Wall - with 10" x 20" Footings'),
('8'' x 10" Wall - with 8" x 18" Footings'),
('8'' x 10" Wall ILO 4'' x 10"'),
('8'' x 10" Wall ILO 8'' x 8" Wall'),
('8'' x 12" Wall - with 10" x 20" Footings'),
('8'' x 12" Wall - with 8" x 16" Footings'),
('8'' x 12" Wall ILO 4'' x 12"'),
('8'' x 8" Wall - with 10" x 20" Footings'),
('8'' x 8" Wall - with 8" x 16" Footings'),
('8'' x 8" Wall ILO 4'' x 8"'),
('9'' Walls ILO 8'' Walls'),
('9'' x 10" Wall - with 10" x 20" Footings'),
('9'' x 10" Wall - with 8" x 16" Footings'),
('9'' x 10" Wall ILO 4'' x 10"'),
('9'' x 12" Wall - with 10" x 20" Footings'),
('9'' x 12" Wall - with 8" x 20" Footings'),
('9'' x 12" Wall ILO 4'' x 12"'),
('9'' x 8" Wall - with 10" x 20" Footings'),
('9'' x 8" Wall - with 8" x 16" Footings'),
('9'' x 8" Wall ILO 4'' x 8"'),
('Apron -'),
('Basement Slab -'),
('Basement Slab - 4"'),
('Bleeders in Footings'),
('Brick Ledge'),
('Brick Ledge - 4"'),
('Brick Returns - Front Outside Corners'),
('Column:'),
('Column: 16" x 16" x 60"'),
('Column: 16" x 16" x 84"'),
('Column: 16" x 16" x 96"'),
('Column: 16" x 16" x 36"'),
('Column: Per Yard'),
('Complete Escape Window - Well, Window, Ladder, Grate'),
('Concrete Pump'),
('Concrete Pump - Footings & Walls'),
('Concrete Pump for Basement Slab'),
('Cut Outs & Sleeves'),
('Door Opening'),
('Driveway -'),
('Escape Window - Opening Only'),
('Extra Concrete'),
('Extra Concrete, Due to -'),
('Extra Labor, Due to -'),
('Footings Only, No Walls -'),
('Footings: 10" x 16"'),
('Footings: 10" x 18"'),
('Footings: 10" x 20"'),
('Footings: 12" x 18"'),
('Footings: 12" x 20"'),
('Footings: 12" x 24"'),
('Footings: 8" x 16"'),
('Footings: 8" x 18"'),
('Footings: 8" x 20"'),
('Footings: Frost Footing'),
('Footings: Frost Footing (20" x 30" - Prince Georges)'),
('Foundation Vent'),
('Front Porch -'),
('Garage - Keyway, Slab Ledge, Pockets'),
('Garage Cut Out For Service Door'),
('Garage Grade Beam -'),
('Garage Grade Beam - 16" x 16"'),
('Garage Slab -'),
('Garage Slab - 4"'),
('Garage Slab - 4", Structural'),
('Ground Wire - 14ga Copper Ground Wire'),
('Large PNP Vinyl Window (32" x 20")'),
('Leadwalk -'),
('Pier Pad:'),
('Pier Pad: 24" x 24" x 12"'),
('Pier Pad: 28" x 28" x 40"'),
('Pier Pad: 32" x 32" x 12"'),
('Pier Pad: 32" x 32" x 14"'),
('Pier Pad: 32" x 32" x 16"'),
('Pier Pad: 36" x 36" x 12"'),
('Pier Pad: 36" x 36" x 14"'),
('Pier Pad: 39" x 39" x 15"'),
('Pier Pad: 40" x 40" x 18"'),
('Pier Pads: Per Yard'),
('Rear Porch -'),
('Rebar #4 -'),
('Rebar #4 - Vertical in Walls 32" O|C'),
('Rebar #5 -'),
('Reverse Ledge'),
('Slab - 2" Thickness'),
('Slab - 4" Thickness'),
('Small PNP Vinyl Basment Window (3216)'),
('Solid Footing Jump with Rebar'),
('Solid Footing Jumps'),
('Thickened Slab'),
('Walls: 1'' x 10"'),
('Walls: 1'' x 12"'),
('Walls: 1'' x 8"'),
('Walls: 2'' x 10"'),
('Walls: 2'' x 12"'),
('Walls: 2'' x 8"'),
('Walls: 3'' x 10"'),
('Walls: 3'' x 12"'),
('Walls: 3'' x 8"'),
('Walls: 4'' x 10"'),
('Walls: 4'' x 12"'),
('Walls: 4'' x 8"'),
('Walls: 5'' x 10"'),
('Walls: 5'' x 12"'),
('Walls: 5'' x 8"'),
('Walls: 6'' x 10"'),
('Walls: 6'' x 12"'),
('Walls: 6'' x 8"'),
('Walls: 7'' x 10"'),
('Walls: 7'' x 12"'),
('Walls: 7'' x 8"'),
('Walls: 8'' x 10"'),
('Walls: 8'' x 12"'),
('Walls: 8'' x 8"'),
('Walls: 9'' x 10"'),
('Walls: 9'' x 12"'),
('Walls: 9'' x 8"'),
('Walls: Engineered Wing Wall'),
('Winter Concrete - 1% High Early (Cost/yd)'),
('Winter Concrete - 2% High Early (Cost/yd)'),
('Winter Concrete - Hot Water (Cost/yd)'),
('Wood Frame - Door Opening'),
('Wood Frame - Window Opening'),
('2" Rigid Insulation'),
('Areaway'),
('Areaway Landing & Risers'),
('1'' x 8" - Walls'),
('2'' x 8" - Walls'),
('3'' x 8" - Walls'),
('4'' x 8" - Walls'),
('5'' x 8" - Walls'),
('6'' x 8" - Walls'),
('7'' x 8" - Walls'),
('8'' x 8" - Walls'),
('9'' x 8" - Walls'),
('1'' x 10" - Walls'),
('2'' x 10" - Walls'),
('3'' x 10" - Walls'),
('4'' x 10" - Walls'),
('5'' x 10" - Walls'),
('6'' x 10" - Walls'),
('7'' x 10" - Walls'),
('8'' x 10" - Walls'),
('9'' x 10" - Walls'),
('1'' x 12" - Walls'),
('2'' x 12" - Walls'),
('3'' x 12" - Walls'),
('4'' x 12" - Walls'),
('5'' x 12" - Walls'),
('6'' x 12" - Walls'),
('7'' x 12" - Walls'),
('8'' x 12" - Walls'),
('9'' x 12" - Walls');
