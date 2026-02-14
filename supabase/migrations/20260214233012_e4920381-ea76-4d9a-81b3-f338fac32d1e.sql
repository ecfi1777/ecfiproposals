
CREATE OR REPLACE FUNCTION public.seed_catalog_for_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.catalog_items (user_id, description, category, section, default_unit, sort_order) VALUES
  -- WALLS WITH FOOTINGS (54 items)
  (target_user_id, '1'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 1),
  (target_user_id, '1'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 2),
  (target_user_id, '1'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 3),
  (target_user_id, '1'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 4),
  (target_user_id, '1'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 5),
  (target_user_id, '1'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 6),
  (target_user_id, '2'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 7),
  (target_user_id, '2'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 8),
  (target_user_id, '2'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 9),
  (target_user_id, '2'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 10),
  (target_user_id, '2'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 11),
  (target_user_id, '2'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 12),
  (target_user_id, '3'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 13),
  (target_user_id, '3'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 14),
  (target_user_id, '3'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 15),
  (target_user_id, '3'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 16),
  (target_user_id, '3'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 17),
  (target_user_id, '3'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 18),
  (target_user_id, '4'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 19),
  (target_user_id, '4'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 20),
  (target_user_id, '4'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 21),
  (target_user_id, '4'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 22),
  (target_user_id, '4'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 23),
  (target_user_id, '4'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 24),
  (target_user_id, '5'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 25),
  (target_user_id, '5'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 26),
  (target_user_id, '5'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 27),
  (target_user_id, '5'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 28),
  (target_user_id, '5'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 29),
  (target_user_id, '5'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 30),
  (target_user_id, '6'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 31),
  (target_user_id, '6'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 32),
  (target_user_id, '6'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 33),
  (target_user_id, '6'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 34),
  (target_user_id, '6'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 35),
  (target_user_id, '6'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 36),
  (target_user_id, '7'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 37),
  (target_user_id, '7'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 38),
  (target_user_id, '7'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 39),
  (target_user_id, '7'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 40),
  (target_user_id, '7'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 41),
  (target_user_id, '7'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 42),
  (target_user_id, '8'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 43),
  (target_user_id, '8'' x 10" Wall - with 8" x 18" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 44),
  (target_user_id, '8'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 45),
  (target_user_id, '8'' x 12" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 46),
  (target_user_id, '8'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 47),
  (target_user_id, '8'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 48),
  (target_user_id, '9'' x 10" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 49),
  (target_user_id, '9'' x 10" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 50),
  (target_user_id, '9'' x 12" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 51),
  (target_user_id, '9'' x 12" Wall - with 8" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 52),
  (target_user_id, '9'' x 8" Wall - with 10" x 20" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 53),
  (target_user_id, '9'' x 8" Wall - with 8" x 16" Footings', 'walls_with_footings', 'ftg_wall', 'LF', 54),

  -- WALL UPGRADES (8 items)
  (target_user_id, '8'' x 10" Wall ILO 4'' x 10"', 'wall_upgrades', 'ftg_wall', 'LF', 55),
  (target_user_id, '8'' x 10" Wall ILO 8'' x 8" Wall', 'wall_upgrades', 'ftg_wall', 'LF', 56),
  (target_user_id, '8'' x 12" Wall ILO 4'' x 12"', 'wall_upgrades', 'ftg_wall', 'LF', 57),
  (target_user_id, '8'' x 8" Wall ILO 4'' x 8"', 'wall_upgrades', 'ftg_wall', 'LF', 58),
  (target_user_id, '9'' Walls ILO 8'' Walls', 'wall_upgrades', 'ftg_wall', 'LF', 59),
  (target_user_id, '9'' x 10" Wall ILO 4'' x 10"', 'wall_upgrades', 'ftg_wall', 'LF', 60),
  (target_user_id, '9'' x 12" Wall ILO 4'' x 12"', 'wall_upgrades', 'ftg_wall', 'LF', 61),
  (target_user_id, '9'' x 8" Wall ILO 4'' x 8"', 'wall_upgrades', 'ftg_wall', 'LF', 62),

  -- WALLS ONLY "Walls:" format (28 items)
  (target_user_id, 'Walls: 1'' x 10"', 'walls_only', 'ftg_wall', 'LF', 63),
  (target_user_id, 'Walls: 1'' x 12"', 'walls_only', 'ftg_wall', 'LF', 64),
  (target_user_id, 'Walls: 1'' x 8"', 'walls_only', 'ftg_wall', 'LF', 65),
  (target_user_id, 'Walls: 2'' x 10"', 'walls_only', 'ftg_wall', 'LF', 66),
  (target_user_id, 'Walls: 2'' x 12"', 'walls_only', 'ftg_wall', 'LF', 67),
  (target_user_id, 'Walls: 2'' x 8"', 'walls_only', 'ftg_wall', 'LF', 68),
  (target_user_id, 'Walls: 3'' x 10"', 'walls_only', 'ftg_wall', 'LF', 69),
  (target_user_id, 'Walls: 3'' x 12"', 'walls_only', 'ftg_wall', 'LF', 70),
  (target_user_id, 'Walls: 3'' x 8"', 'walls_only', 'ftg_wall', 'LF', 71),
  (target_user_id, 'Walls: 4'' x 10"', 'walls_only', 'ftg_wall', 'LF', 72),
  (target_user_id, 'Walls: 4'' x 12"', 'walls_only', 'ftg_wall', 'LF', 73),
  (target_user_id, 'Walls: 4'' x 8"', 'walls_only', 'ftg_wall', 'LF', 74),
  (target_user_id, 'Walls: 5'' x 10"', 'walls_only', 'ftg_wall', 'LF', 75),
  (target_user_id, 'Walls: 5'' x 12"', 'walls_only', 'ftg_wall', 'LF', 76),
  (target_user_id, 'Walls: 5'' x 8"', 'walls_only', 'ftg_wall', 'LF', 77),
  (target_user_id, 'Walls: 6'' x 10"', 'walls_only', 'ftg_wall', 'LF', 78),
  (target_user_id, 'Walls: 6'' x 12"', 'walls_only', 'ftg_wall', 'LF', 79),
  (target_user_id, 'Walls: 6'' x 8"', 'walls_only', 'ftg_wall', 'LF', 80),
  (target_user_id, 'Walls: 7'' x 10"', 'walls_only', 'ftg_wall', 'LF', 81),
  (target_user_id, 'Walls: 7'' x 12"', 'walls_only', 'ftg_wall', 'LF', 82),
  (target_user_id, 'Walls: 7'' x 8"', 'walls_only', 'ftg_wall', 'LF', 83),
  (target_user_id, 'Walls: 8'' x 10"', 'walls_only', 'ftg_wall', 'LF', 84),
  (target_user_id, 'Walls: 8'' x 12"', 'walls_only', 'ftg_wall', 'LF', 85),
  (target_user_id, 'Walls: 8'' x 8"', 'walls_only', 'ftg_wall', 'LF', 86),
  (target_user_id, 'Walls: 9'' x 10"', 'walls_only', 'ftg_wall', 'LF', 87),
  (target_user_id, 'Walls: 9'' x 12"', 'walls_only', 'ftg_wall', 'LF', 88),
  (target_user_id, 'Walls: 9'' x 8"', 'walls_only', 'ftg_wall', 'LF', 89),
  (target_user_id, 'Walls: Engineered Wing Wall', 'walls_only', 'ftg_wall', 'LF', 90),

  -- WALLS ONLY "X' x Y" - Walls" format (27 items)
  (target_user_id, '1'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 91),
  (target_user_id, '1'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 92),
  (target_user_id, '1'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 93),
  (target_user_id, '2'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 94),
  (target_user_id, '2'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 95),
  (target_user_id, '2'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 96),
  (target_user_id, '3'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 97),
  (target_user_id, '3'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 98),
  (target_user_id, '3'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 99),
  (target_user_id, '4'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 100),
  (target_user_id, '4'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 101),
  (target_user_id, '4'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 102),
  (target_user_id, '5'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 103),
  (target_user_id, '5'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 104),
  (target_user_id, '5'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 105),
  (target_user_id, '6'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 106),
  (target_user_id, '6'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 107),
  (target_user_id, '6'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 108),
  (target_user_id, '7'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 109),
  (target_user_id, '7'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 110),
  (target_user_id, '7'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 111),
  (target_user_id, '8'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 112),
  (target_user_id, '8'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 113),
  (target_user_id, '8'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 114),
  (target_user_id, '9'' x 10" - Walls', 'walls_only', 'ftg_wall', 'LF', 115),
  (target_user_id, '9'' x 12" - Walls', 'walls_only', 'ftg_wall', 'LF', 116),
  (target_user_id, '9'' x 8" - Walls', 'walls_only', 'ftg_wall', 'LF', 117),

  -- PIER PADS (11 items)
  (target_user_id, 'Pier Pad:', 'pier_pads', 'ftg_wall', 'EA', 118),
  (target_user_id, 'Pier Pad: 24" x 24" x 12"', 'pier_pads', 'ftg_wall', 'EA', 119),
  (target_user_id, 'Pier Pad: 28" x 28" x 40"', 'pier_pads', 'ftg_wall', 'EA', 120),
  (target_user_id, 'Pier Pad: 32" x 32" x 12"', 'pier_pads', 'ftg_wall', 'EA', 121),
  (target_user_id, 'Pier Pad: 32" x 32" x 14"', 'pier_pads', 'ftg_wall', 'EA', 122),
  (target_user_id, 'Pier Pad: 32" x 32" x 16"', 'pier_pads', 'ftg_wall', 'EA', 123),
  (target_user_id, 'Pier Pad: 36" x 36" x 12"', 'pier_pads', 'ftg_wall', 'EA', 124),
  (target_user_id, 'Pier Pad: 36" x 36" x 14"', 'pier_pads', 'ftg_wall', 'EA', 125),
  (target_user_id, 'Pier Pad: 39" x 39" x 15"', 'pier_pads', 'ftg_wall', 'EA', 126),
  (target_user_id, 'Pier Pad: 40" x 40" x 18"', 'pier_pads', 'ftg_wall', 'EA', 127),
  (target_user_id, 'Pier Pads: Per Yard', 'pier_pads', 'ftg_wall', 'EA', 128),

  -- COLUMNS (6 items)
  (target_user_id, 'Column:', 'columns', 'ftg_wall', 'EA', 129),
  (target_user_id, 'Column: 16" x 16" x 36"', 'columns', 'ftg_wall', 'EA', 130),
  (target_user_id, 'Column: 16" x 16" x 60"', 'columns', 'ftg_wall', 'EA', 131),
  (target_user_id, 'Column: 16" x 16" x 84"', 'columns', 'ftg_wall', 'EA', 132),
  (target_user_id, 'Column: 16" x 16" x 96"', 'columns', 'ftg_wall', 'EA', 133),
  (target_user_id, 'Column: Per Yard', 'columns', 'ftg_wall', 'EA', 134),

  -- SLABS (10 items)
  (target_user_id, 'Basement Slab -', 'slabs', 'slabs', 'SF', 135),
  (target_user_id, 'Basement Slab - 4"', 'slabs', 'slabs', 'SF', 136),
  (target_user_id, 'Garage Slab -', 'slabs', 'slabs', 'SF', 137),
  (target_user_id, 'Garage Slab - 4"', 'slabs', 'slabs', 'SF', 138),
  (target_user_id, 'Garage Slab - 4", Structural', 'slabs', 'slabs', 'SF', 139),
  (target_user_id, 'Garage - Keyway, Slab Ledge, Pockets', 'slabs', 'slabs', 'EA', 140),
  (target_user_id, 'Slab - 2" Thickness', 'slabs', 'slabs', 'SF', 141),
  (target_user_id, 'Slab - 4" Thickness', 'slabs', 'slabs', 'SF', 142),
  (target_user_id, 'Thickened Slab', 'slabs', 'slabs', 'SF', 143),
  (target_user_id, 'Concrete Pump for Basement Slab', 'slabs', 'slabs', 'EA', 144),

  -- FLATWORK (5 items)
  (target_user_id, 'Front Porch -', 'flatwork', 'slabs', 'SF', 145),
  (target_user_id, 'Rear Porch -', 'flatwork', 'slabs', 'SF', 146),
  (target_user_id, 'Driveway -', 'flatwork', 'slabs', 'SF', 147),
  (target_user_id, 'Apron -', 'flatwork', 'slabs', 'SF', 148),
  (target_user_id, 'Leadwalk -', 'flatwork', 'slabs', 'SF', 149),

  -- GRADE BEAMS (2 items)
  (target_user_id, 'Garage Grade Beam -', 'grade_beams', 'slabs', 'LF', 150),
  (target_user_id, 'Garage Grade Beam - 16" x 16"', 'grade_beams', 'slabs', 'LF', 151),

  -- FOOTINGS (12 items)
  (target_user_id, 'Footings Only, No Walls -', 'footings', 'ftg_wall', 'LF', 152),
  (target_user_id, 'Footings: 8" x 16"', 'footings', 'ftg_wall', 'LF', 153),
  (target_user_id, 'Footings: 8" x 18"', 'footings', 'ftg_wall', 'LF', 154),
  (target_user_id, 'Footings: 8" x 20"', 'footings', 'ftg_wall', 'LF', 155),
  (target_user_id, 'Footings: 10" x 16"', 'footings', 'ftg_wall', 'LF', 156),
  (target_user_id, 'Footings: 10" x 18"', 'footings', 'ftg_wall', 'LF', 157),
  (target_user_id, 'Footings: 10" x 20"', 'footings', 'ftg_wall', 'LF', 158),
  (target_user_id, 'Footings: 12" x 18"', 'footings', 'ftg_wall', 'LF', 159),
  (target_user_id, 'Footings: 12" x 20"', 'footings', 'ftg_wall', 'LF', 160),
  (target_user_id, 'Footings: 12" x 24"', 'footings', 'ftg_wall', 'LF', 161),
  (target_user_id, 'Footings: Frost Footing', 'footings', 'ftg_wall', 'LF', 162),
  (target_user_id, 'Footings: Frost Footing (20" x 30" - Prince Georges)', 'footings', 'ftg_wall', 'LF', 163),

  -- REBAR (5 items)
  (target_user_id, 'Rebar #4 -', 'rebar', 'ftg_wall', 'LF', 164),
  (target_user_id, 'Rebar #4 - Vertical in Walls 32" O|C', 'rebar', 'ftg_wall', 'LF', 165),
  (target_user_id, 'Rebar #5 -', 'rebar', 'ftg_wall', 'LF', 166),
  (target_user_id, 'Solid Footing Jump with Rebar', 'rebar', 'ftg_wall', 'EA', 167),
  (target_user_id, 'Solid Footing Jumps', 'rebar', 'ftg_wall', 'EA', 168),

  -- EXTRAS (24 items)
  (target_user_id, 'Bleeders in Footings', 'extras', 'ftg_wall', 'LF', 169),
  (target_user_id, 'Brick Ledge', 'extras', 'ftg_wall', 'LF', 170),
  (target_user_id, 'Brick Ledge - 4"', 'extras', 'ftg_wall', 'LF', 171),
  (target_user_id, 'Brick Returns - Front Outside Corners', 'extras', 'ftg_wall', 'EA', 172),
  (target_user_id, 'Complete Escape Window - Well, Window, Ladder, Grate', 'extras', 'ftg_wall', 'EA', 173),
  (target_user_id, 'Concrete Pump', 'extras', 'ftg_wall', 'EA', 174),
  (target_user_id, 'Concrete Pump - Footings & Walls', 'extras', 'ftg_wall', 'EA', 175),
  (target_user_id, 'Cut Outs & Sleeves', 'extras', 'ftg_wall', 'EA', 176),
  (target_user_id, 'Door Opening', 'extras', 'ftg_wall', 'EA', 177),
  (target_user_id, 'Escape Window - Opening Only', 'extras', 'ftg_wall', 'EA', 178),
  (target_user_id, 'Extra Concrete', 'extras', 'ftg_wall', 'EA', 179),
  (target_user_id, 'Extra Concrete, Due to -', 'extras', 'ftg_wall', 'EA', 180),
  (target_user_id, 'Extra Labor, Due to -', 'extras', 'ftg_wall', 'EA', 181),
  (target_user_id, 'Foundation Vent', 'extras', 'ftg_wall', 'EA', 182),
  (target_user_id, 'Garage Cut Out For Service Door', 'extras', 'ftg_wall', 'EA', 183),
  (target_user_id, 'Ground Wire - 14ga Copper Ground Wire', 'extras', 'ftg_wall', 'EA', 184),
  (target_user_id, 'Large PNP Vinyl Window (32" x 20")', 'extras', 'ftg_wall', 'EA', 185),
  (target_user_id, 'Small PNP Vinyl Basment Window (3216)', 'extras', 'ftg_wall', 'EA', 186),
  (target_user_id, 'Reverse Ledge', 'extras', 'ftg_wall', 'LF', 187),
  (target_user_id, 'Wood Frame - Door Opening', 'extras', 'ftg_wall', 'EA', 188),
  (target_user_id, 'Wood Frame - Window Opening', 'extras', 'ftg_wall', 'EA', 189),
  (target_user_id, '2" Rigid Insulation', 'extras', 'ftg_wall', 'LF', 190),
  (target_user_id, 'Winter Concrete - Hot Water (Cost/yd)', 'extras', 'ftg_wall', 'EA', 191),
  (target_user_id, 'Winter Concrete - 1% High Early (Cost/yd)', 'extras', 'ftg_wall', 'EA', 192),
  (target_user_id, 'Winter Concrete - 2% High Early (Cost/yd)', 'extras', 'ftg_wall', 'EA', 193);
END;
$$;

-- Update handle_new_user to also seed the catalog
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'Eastern Concrete Foundation, Inc.'
  );
  PERFORM public.seed_catalog_for_user(NEW.id);
  RETURN NEW;
END;
$$;
