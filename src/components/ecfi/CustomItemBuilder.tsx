import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench } from "lucide-react";
import { fmt, type CustomItemData, type CustomItemDimensions } from "@/lib/ecfi-utils";

/* ── Types ── */
type ItemCategory = "wall" | "slab" | "footing" | "pier" | "other";

export interface CustomItemResult {
  description: string;
  unit: string;
  qty: string;
  unitPrice: string;
  pricingColumn: "std" | "opt";
  saveToCatalog: boolean;
  customData: CustomItemData;
}

interface CustomItemBuilderProps {
  open: boolean;
  onClose: () => void;
  onAdd: (result: CustomItemResult) => void;
  section?: "ftg" | "slab";
  /** "proposal" shows qty/pricing fields; "catalog" hides them */
  mode?: "proposal" | "catalog";
}

/* ── Chip options ── */
const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "wall", label: "Wall" },
  { value: "slab", label: "Slab / Flatwork" },
  { value: "footing", label: "Footing Only" },
  { value: "pier", label: "Pier Pad" },
  { value: "other", label: "Other / Misc" },
];

const WALL_HEIGHTS = ["4'", "8'", "9'", "10'", "12'"];
const WALL_THICKNESSES = ['6"', '8"', '10"', '12"'];
const FTG_WIDTHS = ['8"', '10"', '12"', '16"', '20"', '24"'];
const FTG_DEPTHS = ['8"', '10"', '12"', '16"', '20"'];
const SLAB_THICKNESSES = ['4"', '5"', '6"', '8"'];
const PIER_SIZES = ['24"x24"', '30"x30"', '36"x36"', '42"x42"', '48"x48"'];
const PIER_DEPTHS = ['10"', '12"', '16"', '20"', '24"'];

const WALL_TAGS = ["Garage", "Porch", "Rear Extension", "Garage Over Dig", "Crawl Space"];
const SLAB_TAGS = ["Structural", "Garage", "Porch", "Patio", "Basement"];
const FTG_TAGS = ["Frost Footing", "Grade Beam", "Continuous", "Stepped"];

/* ── Chip button ── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-[12px] font-mono font-semibold border rounded-lg transition-colors cursor-pointer select-none ${
        selected
          ? "bg-[var(--primary-blue)] text-white border-[var(--primary-blue)]"
          : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]"
      }`}
    >
      {label}
    </button>
  );
}

function TagPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-mono font-semibold border rounded-full transition-colors cursor-pointer select-none ${
        selected
          ? "bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] border-[var(--primary-blue)]/40"
          : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--card-border)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1.5 block">
      {children}
    </label>
  );
}

/* ── Helpers ── */
const parseIn = (s: string): number => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
const parseFt = (s: string): number => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
const parsePierSize = (s: string): { a: number; b: number } => {
  const parts = s.split("x");
  return { a: parseIn(parts[0] || "0"), b: parseIn(parts[1] || "0") };
};

/* ── Main component ── */
export function CustomItemBuilder({ open, onClose, onAdd, mode = "proposal" }: CustomItemBuilderProps) {
  const [category, setCategory] = useState<ItemCategory>("wall");

  // Wall
  const [wallHeight, setWallHeight] = useState("4'");
  const [wallThickness, setWallThickness] = useState('8"');
  const [wallFtgWidth, setWallFtgWidth] = useState('8"');
  const [wallFtgDepth, setWallFtgDepth] = useState('16"');

  // Slab
  const [slabLabel, setSlabLabel] = useState("Basement Slab");
  const [slabThickness, setSlabThickness] = useState('4"');

  // Footing
  const [ftgLabel, setFtgLabel] = useState("Footings");
  const [ftgWidth, setFtgWidth] = useState('8"');
  const [ftgDepth, setFtgDepth] = useState('16"');

  // Pier
  const [pierSize, setPierSize] = useState('24"x24"');
  const [pierDepth, setPierDepth] = useState('12"');

  // Other
  const [miscDesc, setMiscDesc] = useState("");

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Pricing fields
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [pricingCol, setPricingCol] = useState<"std" | "opt">("std");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  // Reset tags when category changes
  const handleCategoryChange = (cat: ItemCategory) => {
    setCategory(cat);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  /* ── Derived values ── */
  const defaultUnit = useMemo(() => {
    switch (category) {
      case "wall": return "LF";
      case "slab": return "SF";
      case "footing": return "LF";
      case "pier": return "EA";
      case "other": return "EA";
    }
  }, [category]);

  const tagsStr = selectedTags.length > 0 ? `, ${selectedTags.join(", ")}` : "";

  const description = useMemo(() => {
    switch (category) {
      case "wall":
        return `${wallHeight.replace("'", "'")} x ${wallThickness} Wall - with ${wallFtgWidth} x ${wallFtgDepth} Footings${tagsStr}`;
      case "slab":
        return `${slabLabel} - ${slabThickness}${tagsStr}`;
      case "footing":
        return `${ftgLabel}: ${ftgWidth} x ${ftgDepth}${tagsStr}`;
      case "pier": {
        const ps = parsePierSize(pierSize);
        return `Pier Pad: ${ps.a}" x ${ps.b}" x ${parseIn(pierDepth)}"`;
      }
      case "other":
        return miscDesc;
    }
  }, [category, wallHeight, wallThickness, wallFtgWidth, wallFtgDepth, slabLabel, slabThickness, ftgLabel, ftgWidth, ftgDepth, pierSize, pierDepth, miscDesc, tagsStr]);

  // CY calculation from structured dims (not regex)
  const totalCY = useMemo(() => {
    const q = parseFloat(qty) || 0;
    if (q === 0) return 0;
    switch (category) {
      case "wall": {
        const htFt = parseFt(wallHeight);
        const thkFt = parseIn(wallThickness) / 12;
        const fwFt = parseIn(wallFtgWidth) / 12;
        const fdFt = parseIn(wallFtgDepth) / 12;
        return (q * ((htFt * thkFt) + (fwFt * fdFt))) / 27;
      }
      case "slab": {
        const thkFt = parseIn(slabThickness) / 12;
        return (q * thkFt) / 27;
      }
      case "footing": {
        const wFt = parseIn(ftgWidth) / 12;
        const dFt = parseIn(ftgDepth) / 12;
        return (q * wFt * dFt) / 27;
      }
      case "pier": {
        const ps = parsePierSize(pierSize);
        const aFt = ps.a / 12;
        const bFt = ps.b / 12;
        const dpFt = parseIn(pierDepth) / 12;
        return (q * aFt * bFt * dpFt) / 27;
      }
      default:
        return 0;
    }
  }, [category, qty, wallHeight, wallThickness, wallFtgWidth, wallFtgDepth, slabThickness, ftgWidth, ftgDepth, pierSize, pierDepth]);

  const cyPerUnit = useMemo(() => {
    if (category === "other") return 0;
    // Calculate for qty=1
    switch (category) {
      case "wall": {
        const htFt = parseFt(wallHeight);
        const thkFt = parseIn(wallThickness) / 12;
        const fwFt = parseIn(wallFtgWidth) / 12;
        const fdFt = parseIn(wallFtgDepth) / 12;
        return ((htFt * thkFt) + (fwFt * fdFt)) / 27;
      }
      case "slab":
        return (parseIn(slabThickness) / 12) / 27;
      case "footing":
        return (parseIn(ftgWidth) / 12 * parseIn(ftgDepth) / 12) / 27;
      case "pier": {
        const ps = parsePierSize(pierSize);
        return (ps.a / 12 * ps.b / 12 * parseIn(pierDepth) / 12) / 27;
      }
      default:
        return 0;
    }
  }, [category, wallHeight, wallThickness, wallFtgWidth, wallFtgDepth, slabThickness, ftgWidth, ftgDepth, pierSize, pierDepth]);

  const totalPrice = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);

  const buildDimensions = (): CustomItemDimensions => {
    switch (category) {
      case "wall":
        return { wallHeight, wallThickness, footingWidth: wallFtgWidth, footingDepth: wallFtgDepth };
      case "slab":
        return { slabThickness, customLabel: slabLabel };
      case "footing":
        return { footingWidth: ftgWidth, footingDepth: ftgDepth, customLabel: ftgLabel };
      case "pier":
        return { pierSize, pierDepth };
      case "other":
        return { customLabel: miscDesc };
    }
  };

  const handleAdd = () => {
    if (!description.trim()) return;
    onAdd({
      description,
      unit: defaultUnit,
      qty,
      unitPrice,
      pricingColumn: pricingCol,
      saveToCatalog,
      customData: {
        category,
        dimensions: buildDimensions(),
        tags: [...selectedTags],
        isCustom: true,
      },
    });
    onClose();
  };

  const inputClass = "w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg";

  const availableTags = category === "wall" ? WALL_TAGS : category === "slab" ? SLAB_TAGS : category === "footing" ? FTG_TAGS : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] border-[var(--card-border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-main)]">
            <Wrench className="w-4 h-4 text-[var(--primary-blue)]" />
            Custom Item Builder
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-xs">
            {mode === "catalog"
              ? "Build a catalog item from structured dimensions."
              : "Build a line item from structured dimensions. Volume is auto-calculated."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* A. Category Selector */}
          <div>
            <SectionLabel>Item Type</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip key={c.value} label={c.label} selected={category === c.value} onClick={() => handleCategoryChange(c.value)} />
              ))}
            </div>
          </div>

          {/* B. Dimension Fields */}
          {category === "wall" && (
            <div className="space-y-3">
              <div>
                <SectionLabel>Wall Height</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {WALL_HEIGHTS.map((h) => <Chip key={h} label={h} selected={wallHeight === h} onClick={() => setWallHeight(h)} />)}
                </div>
              </div>
              <div>
                <SectionLabel>Wall Thickness</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {WALL_THICKNESSES.map((t) => <Chip key={t} label={t} selected={wallThickness === t} onClick={() => setWallThickness(t)} />)}
                </div>
              </div>
              <div>
                <SectionLabel>Footing Width</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {FTG_WIDTHS.map((w) => <Chip key={w} label={w} selected={wallFtgWidth === w} onClick={() => setWallFtgWidth(w)} />)}
                </div>
              </div>
              <div>
                <SectionLabel>Footing Depth</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {FTG_DEPTHS.map((d) => <Chip key={d} label={d} selected={wallFtgDepth === d} onClick={() => setWallFtgDepth(d)} />)}
                </div>
              </div>
            </div>
          )}

          {category === "slab" && (
            <div className="space-y-3">
              <div>
                <SectionLabel>Label</SectionLabel>
                <input value={slabLabel} onChange={(e) => setSlabLabel(e.target.value)} className={inputClass} placeholder='e.g. Basement Slab, Patio, Garage Slab' />
              </div>
              <div>
                <SectionLabel>Slab Thickness</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SLAB_THICKNESSES.map((t) => <Chip key={t} label={t} selected={slabThickness === t} onClick={() => setSlabThickness(t)} />)}
                </div>
              </div>
            </div>
          )}

          {category === "footing" && (
            <div className="space-y-3">
              <div>
                <SectionLabel>Label</SectionLabel>
                <input value={ftgLabel} onChange={(e) => setFtgLabel(e.target.value)} className={inputClass} placeholder='e.g. Grade Beam, Frost Footing' />
              </div>
              <div>
                <SectionLabel>Footing Width</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {FTG_WIDTHS.map((w) => <Chip key={w} label={w} selected={ftgWidth === w} onClick={() => setFtgWidth(w)} />)}
                </div>
              </div>
              <div>
                <SectionLabel>Footing Depth</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {FTG_DEPTHS.map((d) => <Chip key={d} label={d} selected={ftgDepth === d} onClick={() => setFtgDepth(d)} />)}
                </div>
              </div>
            </div>
          )}

          {category === "pier" && (
            <div className="space-y-3">
              <div>
                <SectionLabel>Pier Size</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {PIER_SIZES.map((s) => <Chip key={s} label={s} selected={pierSize === s} onClick={() => setPierSize(s)} />)}
                </div>
              </div>
              <div>
                <SectionLabel>Pier Depth</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {PIER_DEPTHS.map((d) => <Chip key={d} label={d} selected={pierDepth === d} onClick={() => setPierDepth(d)} />)}
                </div>
              </div>
            </div>
          )}

          {category === "other" && (
            <div>
              <SectionLabel>Description</SectionLabel>
              <input value={miscDesc} onChange={(e) => setMiscDesc(e.target.value)} className={inputClass} placeholder='e.g. Complete Escape Window' />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 italic">No auto-calculation for miscellaneous items.</p>
            </div>
          )}

          {/* C. Tags / Modifiers */}
          {availableTags.length > 0 && (
            <div>
              <SectionLabel>Tags / Modifiers (optional)</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <TagPill key={tag} label={tag} selected={selectedTags.includes(tag)} onClick={() => toggleTag(tag)} />
                ))}
              </div>
            </div>
          )}

          {/* D. Quantity, Unit Price, Pricing Column — only in proposal mode */}
          {mode === "proposal" && (
          <div>
            <SectionLabel>Pricing</SectionLabel>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block font-mono">QTY ({defaultUnit})</label>
                <input value={qty} onChange={(e) => setQty(e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block font-mono">Unit Price $</label>
                <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputClass} placeholder="0.00" />
              </div>
              <div className="flex-shrink-0">
                <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block font-mono">Column</label>
                <div className="flex border border-[var(--card-border)] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPricingCol("std")}
                    className={`px-3 py-2 text-[12px] font-mono font-semibold transition-colors cursor-pointer ${
                      pricingCol === "std"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Std
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingCol("opt")}
                    className={`px-3 py-2 text-[12px] font-mono font-semibold transition-colors cursor-pointer ${
                      pricingCol === "opt"
                        ? "bg-[var(--primary-blue)] text-white"
                        : "bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Opt
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* E. Auto-Generated Description */}
          <div className="bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg p-3 space-y-2">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Auto-Generated Description</span>
              <div className="text-sm font-mono text-[var(--text-main)] font-semibold mt-0.5">
                {description || <span className="text-[var(--text-muted)] italic">Enter details above…</span>}
              </div>
            </div>

            {/* F. Concrete Volume */}
            {category !== "other" && mode === "proposal" && (
              <div className="flex gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-ecfi-vol-blue-text uppercase tracking-widest">CY / Unit</span>
                  <div className="text-sm font-mono text-ecfi-vol-blue-text font-semibold">{cyPerUnit.toFixed(4)}</div>
                </div>
                {parseFloat(qty) > 0 && (
                  <div>
                    <span className="text-[10px] text-ecfi-vol-blue-text uppercase tracking-widest">Total CY</span>
                    <div className="text-sm font-mono text-ecfi-vol-blue-text font-semibold">{totalCY.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* G. Mini Table Preview — only in proposal mode */}
          {mode === "proposal" && description && (
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1 block">Line Item Preview</span>
              <div className="border border-[var(--card-border)] rounded-lg overflow-hidden text-[12px] font-mono">
                <div className="flex bg-[var(--section-bg)] text-[var(--text-muted)] text-[9px] uppercase tracking-wider font-semibold">
                  <div className="w-[55px] px-2 py-1 text-right">QTY</div>
                  <div className="w-[40px] px-1 py-1">UNIT</div>
                  <div className="flex-1 px-2 py-1">DESCRIPTION</div>
                  <div className="w-[72px] px-2 py-1 text-right">UNIT $</div>
                  <div className="w-[82px] px-2 py-1 text-right">TOTAL</div>
                </div>
                <div className="flex text-[var(--text-main)] border-t border-[var(--card-border)]">
                  <div className="w-[55px] px-2 py-1.5 text-right">{qty || "—"}</div>
                  <div className="w-[40px] px-1 py-1.5">{defaultUnit}</div>
                  <div className="flex-1 px-2 py-1.5 truncate">{description}</div>
                  <div className="w-[72px] px-2 py-1.5 text-right">{unitPrice ? `$${unitPrice}` : "—"}</div>
                  <div className="w-[82px] px-2 py-1.5 text-right font-semibold">{totalPrice > 0 ? `$${fmt(totalPrice)}` : "—"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Save to catalog — only in proposal mode (catalog mode always saves) */}
          {mode === "proposal" && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-catalog"
              checked={saveToCatalog}
              onCheckedChange={(v) => setSaveToCatalog(!!v)}
            />
            <label htmlFor="save-catalog" className="text-sm text-[var(--text-secondary)] cursor-pointer select-none">
              Save to catalog for future use
            </label>
          </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--card-border)] text-[var(--text-secondary)]">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!description.trim()}
            className="bg-[var(--primary-blue)] text-white hover:bg-[var(--primary-blue-hover)] disabled:opacity-50"
          >
            {mode === "catalog" ? "Save to Catalog" : "Add to Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
