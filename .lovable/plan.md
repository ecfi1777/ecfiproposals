

## Fix: Text Too Close to Bottom Border in PDF Export

**Problem**: In the exported/printed PDF, text in table cells appears cramped against the bottom cell border. The on-screen preview looks fine, but the PDF rendering (via html2canvas) doesn't match.

**Root Cause**: Table cells use `py-[3px]` (3px top and bottom padding), which is too tight for PDF output. The rendering engine compresses the space differently than the browser preview.

**Solution**: Increase vertical padding from `py-[3px]` to `py-[5px]` across all table cells in the preview document. This adds just 2px more breathing room on each side, which will make the PDF output match the visual feel of the on-screen preview without significantly changing the overall layout.

### Changes in `src/components/ecfi/PreviewTab.tsx`

All instances of `py-[3px]` will be updated to `py-[5px]` in the following areas:

1. **Line item rows** (lines 96-103) - QTY, UNIT, DESCRIPTION, UNIT $, TOTAL cells
2. **Subtotal rows** (lines 109-113) - section subtotal cells
3. **Header info table** (lines 159-174) - Builder, Date, Job Location, County, Found Type
4. **Found Size + column headers row** (lines 181-185)
5. **Column header row** (lines 193-199) - QTY, UNIT, DESCRIPTION, etc. headers

The Extra Charges section uses `py-[2px]` which will be bumped to `py-[3px]` for consistency.

The Grand Total row already uses `py-1` (4px) which is fine.

This is a single-file change affecting only cell padding values.

