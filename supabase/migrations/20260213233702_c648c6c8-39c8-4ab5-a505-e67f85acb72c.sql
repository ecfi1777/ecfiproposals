
-- Allow anyone to update catalog items
CREATE POLICY "Anyone can update catalog items"
ON public.item_catalog
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete catalog items
CREATE POLICY "Anyone can delete catalog items"
ON public.item_catalog
FOR DELETE
USING (true);
