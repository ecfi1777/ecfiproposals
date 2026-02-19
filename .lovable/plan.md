

## Fix: Reduce Table Border Thickness by ~25%

**Problem**: The table borders in the proposal preview/PDF are visually too thick.

**Solution**: Replace `border` (1px) with `border-[0.75px]` across all table cells in the preview document. Also reduce the top HR separator from `border-t-2` (2px) to `border-t-[1.5px]`.

### Changes in `src/components/ecfi/PreviewTab.tsx`

1. **All table cells** (~76 occurrences): Change `border border-black` to `border-[0.75px] border-black`
2. **HR separator** (line 153): Change `border-t-2` to `border-t-[1.5px]`

This is a single-file, find-and-replace style change. The border color stays black; only the width decreases from 1px to 0.75px (~25% thinner).

