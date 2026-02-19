

# Shared Custom Item Builder + Structured CSV Import

## Overview

Two changes: (1) Complete the shared Custom Item Builder integration for both proposal and catalog, (2) rewrite CSV import to accept structured dimension columns. Both paths must produce identical `custom_data` records in `catalog_items`.

---

## Step 1: Database Migration

Add a `custom_data` JSONB column to the `catalog_items` table.

```text
ALTER TABLE catalog_items ADD COLUMN custom_data JSONB DEFAULT NULL;
```

No RLS policy changes needed -- the existing policies use `auth.uid() = user_id` conditions on the row level, not column-level restrictions. The new column is automatically included.

---

## Step 2: Update CustomItemBuilder.tsx

Two small fixes for catalog mode (`mode === "catalog"`):

- **Hide CY/Unit display** in the auto-generated description preview (volume depends on qty which is proposal-specific)
- **Change button text** from "Add to Catalog" to "Save to Catalog"

---

## Step 3: Update Settings.tsx -- handleBuilderAdd

Include the full `customData` object from the builder result in the database insert:

```text
await supabase.from("catalog_items").insert({
  user_id: user.id,
  description: result.description,
  category: result.customData?.category || "custom",
  section: sectionMap[result.customData?.category || "other"],
  default_unit: result.unit,
  custom_data: result.customData || null,   // <-- NEW
});
```

---

## Step 4: Rewrite CSV Import (ImportCatalogItems.tsx)

### Column names (aligned to spec)

```text
category,description,unit,wall_height,wall_thickness,footing_width,footing_depth,slab_thickness,pier_size,pier_depth,tags
```

### Processing rules

- **category** (required): wall, slab, footing, pier, or other
- **description**: If blank, auto-generate from dimensions using the same logic as the builder. If provided, use as-is.
- **unit**: If blank, default from category (wall=LF, slab=SF, footing=LF, pier=EA, other=EA)
- **Always build `custom_data`** from dimension columns when any dimensions are present, regardless of whether description is provided or blank. Never skip building `custom_data` just because a description exists.

### custom_data shape (identical to builder output)

```text
{
  "category": "wall",
  "dimensions": {
    "wallHeight": "8'",
    "wallThickness": "8\"",
    "footingWidth": "16\"",
    "footingDepth": "8\""
  },
  "tags": ["Garage"],
  "isCustom": true
}
```

### Storage

Each imported row inserts into `catalog_items` with:
- `description`, `default_unit`, `section`, `category` -- as today
- `custom_data` -- the structured object built from dimension columns

---

## Step 5: CSV Validation Rules

Per-category required fields:

| Category | Required columns |
|----------|-----------------|
| wall | wall_height, wall_thickness, footing_width, footing_depth |
| slab | slab_thickness, description |
| footing | footing_width, footing_depth, description |
| pier | pier_size, pier_depth |
| other | description |

- Flag rows that fail validation with a warning message
- Allow valid rows to import even when some rows fail
- Show validation summary in preview (e.g., "3 rows skipped: missing required dimensions")

---

## Step 6: Update CSV Template

Replace the current template with the spec's column order and example rows:

```text
category,description,unit,wall_height,wall_thickness,footing_width,footing_depth,slab_thickness,pier_size,pier_depth,tags
wall,,LF,8',8",8",16",,,,
wall,,LF,8',8",8",16",,,,Garage
slab,Basement Slab,SF,,,,,4",,,
footing,Garage Grade Beam,LF,,,,16",,,,
pier,,EA,,,,,,36" x 36",12",
other,Complete Escape Window - Well Window Ladder Grate,EA,,,,,,,
```

---

## Files Modified

| File | Changes |
|------|---------|
| Database migration | Add `custom_data JSONB` column |
| `src/components/ecfi/CustomItemBuilder.tsx` | Hide CY/Unit in catalog mode, button text to "Save to Catalog" |
| `src/pages/Settings.tsx` | Include `custom_data` in handleBuilderAdd insert |
| `src/components/ecfi/ImportCatalogItems.tsx` | Rewrite column names, validation, auto-description, custom_data storage, template |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

## What stays the same

- Builder logic for proposal mode (unchanged)
- `calcCYPerUnit` regex parsing (unchanged)
- Rebar logic reading from `customData` (unchanged)
- All existing RLS policies (no column-level restrictions)

