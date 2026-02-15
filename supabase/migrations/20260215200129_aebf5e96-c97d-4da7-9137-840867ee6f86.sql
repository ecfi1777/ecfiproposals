
-- Drop ALL existing policies on catalog_items (both old and new)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'catalog_items' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.catalog_items', pol.policyname);
  END LOOP;
END;
$$;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "catalog_select" ON public.catalog_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "catalog_insert" ON public.catalog_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalog_update" ON public.catalog_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "catalog_delete" ON public.catalog_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
