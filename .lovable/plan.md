
# Fix: CSV File Upload Not Opening File Picker

## Problem
The hidden `<input type="file">` is inside a `<div>` with an `onClick` handler that calls `fileRef.current?.click()`. When the programmatic click fires, the event bubbles back to the parent div, which can cause browsers to suppress the file dialog (the second click is no longer considered a trusted user gesture).

## Solution
Replace the `<div onClick={...}>` + `useRef` + programmatic `.click()` pattern with a `<label htmlFor="...">` wrapping the file input. This is the standard HTML pattern for custom file inputs and works reliably across all browsers without needing refs or programmatic clicks.

## Changes

**File: `src/components/ecfi/ImportCatalogItems.tsx`**

1. Remove the `fileRef` (useRef) since it's no longer needed
2. Give the hidden input an `id` (e.g., `id="catalog-csv-upload"`)
3. Change the clickable `<div>` to a `<label htmlFor="catalog-csv-upload">` with `cursor-pointer`
4. Add `e.stopPropagation()` to the input's onChange for safety
5. Reset the input value after each file selection so the same file can be re-uploaded

All other logic (Papa.parse, validation, preview, import) stays exactly the same.

## Technical Detail

```text
Before:
  const fileRef = useRef<HTMLInputElement>(null);
  <div onClick={() => fileRef.current?.click()}>
    <input ref={fileRef} type="file" className="hidden" ... />
  </div>

After:
  <label htmlFor="catalog-csv-upload" className="cursor-pointer ...">
    <input id="catalog-csv-upload" type="file" className="hidden" ... />
  </label>
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/ecfi/ImportCatalogItems.tsx` | Replace ref-based click with label/htmlFor pattern, remove useRef |
