

# Catalog Item Edit Flow + Data Fetch Fix

## Overview

Two changes: (1) Fix the catalog fetch query to include `custom_data`, and (2) replace the inline text-edit with the shared CustomItemBuilder in edit mode.

---

## Step 1: Update CatalogItem type

**File: `src/types/catalog.ts`**

Add `custom_data` and `is_active` to the interfaces so we can stop using `(item as any)` casts throughout Settings.tsx.

```text
export interface CatalogItem {
  id: string;
  description: string;
  category: string;
  section: string;
  default_unit: string;
  custom_data?: Record<string, any> | null;
  is_active?: boolean;
}
```

---

## Step 2: Fix fetchItems query

**File: `src/pages/Settings.tsx` (line ~169)**

Add `custom_data` to the select string and remove the `as any` cast on the result.

---

## Step 3: Add initialData prop to CustomItemBuilder

**File: `src/components/ecfi/CustomItemBuilder.tsx`**

- Add optional `initialData` prop to `CustomItemBuilderProps`
- Add a `useEffect` that fires when `open` becomes true and `initialData` is present, pre-populating all internal state (category, wallHeight, wallThickness, etc.) from the initialData values
- When `initialData` is provided: change dialog title to "Edit Catalog Item" and button text to "Update Item"
- When `initialData` is null/undefined: behave exactly as today

---

## Step 4: Replace inline edit in Settings.tsx

**File: `src/pages/Settings.tsx`**

- Remove `editingId`, `editValue` state and the `handleUpdate` function
- Remove inline edit UI (the text input + check/X buttons, lines ~374-391)
- Add `editingItem` state (`CatalogItemWithTimestamp | null`)
- Pencil button sets `setEditingItem(item)` instead of toggling inline edit
- Add second `CustomItemBuilder` for editing with `initialData` derived from `editingItem.custom_data`
- Add `handleBuilderEdit` function that updates ALL fields (description, category, section, unit, custom_data) via Supabase update
- Legacy items without `custom_data` open as "other" category with description pre-filled
- Remove all `(item as any).is_active` casts since the type now includes `is_active`

---

## Files Modified

| File | Changes |
|------|---------|
| `src/types/catalog.ts` | Add `custom_data` and `is_active` to CatalogItem interface |
| `src/pages/Settings.tsx` | Fix fetchItems select, replace inline edit with builder-based edit, remove `as any` casts |
| `src/components/ecfi/CustomItemBuilder.tsx` | Add `initialData` prop, useEffect for pre-population, conditional title/button text |

## What stays the same

- CustomItemBuilder behavior in proposal mode (unchanged)
- All volume calculations (unchanged)
- CSV import logic (unchanged)
- Database schema and RLS policies (no migration needed)

