
-- Drop all existing restrictive policies on catalog_items
DROP POLICY IF EXISTS "Users can delete own catalog" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can insert own catalog" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update own catalog" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view own catalog" ON public.catalog_items;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view own catalog"
  ON public.catalog_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own catalog"
  ON public.catalog_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catalog"
  ON public.catalog_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own catalog"
  ON public.catalog_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
