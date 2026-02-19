import { useState, useMemo } from "react";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench } from "lucide-react";

type ItemType = "wall_with_footings" | "wall_only" | "pier_pad" | "column" | "footings_only";

interface CustomItemBuilderProps {
  open: boolean;
  onClose: () => void;
  onAdd: (description: string, unit: string, saveToCatalog: boolean) => void;
  section: "ftg" | "slab";
}

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "wall_with_footings", label: "Wall with Footings" },
  { value: "wall_only", label: "Wall Only" },
  { value: "pier_pad", label: "Pier Pad" },
  { value: "column", label: "Column" },
  { value: "footings_only", label: "Footings Only" },
];

const WALL_HEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const WALL_THICKNESSES = [8, 10, 12];
const FTG_WIDTHS = [8, 10, 12];
const FTG_DEPTHS = [16, 18, 20, 24];

export function CustomItemBuilder({ open, onClose, onAdd, section }: CustomItemBuilderProps) {
  const [itemType, setItemType] = useState<ItemType>("wall_with_footings");
  const [wallHeight, setWallHeight] = useState(4);
  const [wallThickness, setWallThickness] = useState(8);
  const [ftgWidth, setFtgWidth] = useState(8);
  const [ftgDepth, setFtgDepth] = useState(16);
  // Pier/Column dims
  const [dimA, setDimA] = useState("24");
  const [dimB, setDimB] = useState("24");
  const [dimC, setDimC] = useState("12");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  const description = useMemo(() => {
    switch (itemType) {
      case "wall_with_footings":
        return `${wallHeight}' x ${wallThickness}" Wall - with ${ftgWidth}" x ${ftgDepth}" Footings`;
      case "wall_only":
        return `Walls: ${wallHeight}' x ${wallThickness}"`;
      case "pier_pad":
        return `Pier Pad: ${dimA}" x ${dimB}" x ${dimC}"`;
      case "column":
        return `Column: ${dimA}" x ${dimB}" x ${dimC}"`;
      case "footings_only":
        return `Footings: ${ftgWidth}" x ${ftgDepth}"`;
    }
  }, [itemType, wallHeight, wallThickness, ftgWidth, ftgDepth, dimA, dimB, dimC]);

  const volCalc = useMemo(() => calcCYPerUnit(description), [description]);

  const defaultUnit = useMemo(() => {
    if (itemType === "pier_pad" || itemType === "column") return "EA";
    return "LF";
  }, [itemType]);

  const handleAdd = () => {
    onAdd(description, defaultUnit, saveToCatalog);
    onClose();
  };

  const selectClass = "w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg";
  const inputClass = selectClass;

  const showWallFields = itemType === "wall_with_footings" || itemType === "wall_only";
  const showFtgFields = itemType === "wall_with_footings" || itemType === "footings_only";
  const showDimFields = itemType === "pier_pad" || itemType === "column";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-[var(--card-bg)] border-[var(--card-border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-main)]">
            <Wrench className="w-4 h-4 text-[var(--primary-blue)]" />
            Custom Item Builder
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-xs">
            Build a line item from structured dimensions. Volume is auto-calculated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Item Type */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
              Item Type
            </label>
            <select value={itemType} onChange={(e) => setItemType(e.target.value as ItemType)} className={selectClass}>
              {ITEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Wall dimensions */}
          {showWallFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  Wall Height (ft)
                </label>
                <select value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className={selectClass}>
                  {WALL_HEIGHTS.map((h) => <option key={h} value={h}>{h}'</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  Wall Thickness (in)
                </label>
                <select value={wallThickness} onChange={(e) => setWallThickness(Number(e.target.value))} className={selectClass}>
                  {WALL_THICKNESSES.map((t) => <option key={t} value={t}>{t}"</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Footing dimensions */}
          {showFtgFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  Footing Width (in)
                </label>
                <select value={ftgWidth} onChange={(e) => setFtgWidth(Number(e.target.value))} className={selectClass}>
                  {FTG_WIDTHS.map((w) => <option key={w} value={w}>{w}"</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  Footing Depth (in)
                </label>
                <select value={ftgDepth} onChange={(e) => setFtgDepth(Number(e.target.value))} className={selectClass}>
                  {FTG_DEPTHS.map((d) => <option key={d} value={d}>{d}"</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Pier/Column dimensions */}
          {showDimFields && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  {itemType === "pier_pad" ? "Length" : "Width"} (in)
                </label>
                <input value={dimA} onChange={(e) => setDimA(e.target.value)} className={inputClass} placeholder='24"' />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  {itemType === "pier_pad" ? "Width" : "Depth"} (in)
                </label>
                <input value={dimB} onChange={(e) => setDimB(e.target.value)} className={inputClass} placeholder='24"' />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block">
                  Height (in)
                </label>
                <input value={dimC} onChange={(e) => setDimC(e.target.value)} className={inputClass} placeholder='12"' />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg p-3 space-y-2">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Description</span>
              <div className="text-sm font-mono text-[var(--text-main)] font-semibold">{description}</div>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Unit</span>
                <div className="text-sm font-mono text-[var(--text-main)]">{defaultUnit}</div>
              </div>
              <div>
                <span className="text-[10px] text-ecfi-vol-blue-text uppercase tracking-widest">CY / Unit</span>
                <div className="text-sm font-mono text-ecfi-vol-blue-text font-semibold">
                  {volCalc.cy > 0 ? volCalc.cy.toFixed(4) : "—"}
                </div>
              </div>
              {volCalc.method && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Method</span>
                  <div className="text-xs font-mono text-[var(--text-secondary)]">{volCalc.method}</div>
                </div>
              )}
            </div>
          </div>

          {/* Save to catalog option */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--card-border)] text-[var(--text-secondary)]">
            Cancel
          </Button>
          <Button onClick={handleAdd} className="bg-[var(--primary-blue)] text-white hover:bg-[var(--primary-blue-hover)]">
            Add to Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
