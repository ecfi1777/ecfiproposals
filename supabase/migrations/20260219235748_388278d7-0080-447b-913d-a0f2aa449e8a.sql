UPDATE catalog_items
SET description = REPLACE(
  TRIM(BOTH '"' FROM description),
  '""',
  '"'
)
WHERE description LIKE '"%' OR description LIKE '%""%';