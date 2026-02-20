UPDATE catalog_items
SET description = regexp_replace(
  REPLACE(description, '""', '"'),
  '"(\d+)"',
  '\1"',
  'g'
)
WHERE description LIKE '%""%' OR description ~ '"[0-9]+"';