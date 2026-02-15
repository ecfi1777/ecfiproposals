import { useState } from "react";
import { RebarData } from "@/lib/ecfi-utils";
import { Grid3X3 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RebarPopupProps {
  rebar?: RebarData;
  onSave: (data: RebarData) => void;
  hasData: boolean;
}

export function RebarPopup({ rebar, onSave, hasData }: RebarPopupProps) {
  const [open, setOpen] = useState(false);
  const [horizFtgBars, setHorizFtgBars] = useState(rebar?.horizFtgBars ?? 0);
  const [horizWallBars, setHorizWallBars] = useState(rebar?.horizWallBars ?? 0);
  const [vertSpacingInches, setVertSpacingInches] = useState(rebar?.vertSpacingInches ?? 0);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setHorizFtgBars(rebar?.horizFtgBars ?? 0);
      setHorizWallBars(rebar?.horizWallBars ?? 0);
      setVertSpacingInches(rebar?.vertSpacingInches ?? 0);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    onSave({ horizFtgBars, horizWallBars, vertSpacingInches });
    setOpen(false);
  };

  const inputClass =
    "w-full px-2 py-1.5 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-[13px] font-mono text-right focus:outline-none focus:ring-1 focus:ring-ecfi-gold";
  const labelClass = "text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block";

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`p-1 transition-colors ${
            hasData
              ? "text-ecfi-gold-text hover:text-ecfi-gold-text/80"
              : "text-muted-foreground/40 hover:text-muted-foreground/70"
          }`}
          title="Rebar configuration"
        >
          <Grid3X3 size={14} strokeWidth={hasData ? 2.5 : 1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4 bg-ecfi-panel-bg border border-ecfi-panel-border font-mono"
        align="start"
        sideOffset={4}
      >
        <h4 className="text-[11px] font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-4">
          Rebar Configuration
        </h4>

        <div className="mb-3">
          <label className={labelClass}>Horizontal bars in footings</label>
          <input
            type="number"
            min={0}
            value={horizFtgBars}
            onChange={(e) => setHorizFtgBars(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        <div className="mb-3">
          <label className={labelClass}>Horizontal bars in walls</label>
          <input
            type="number"
            min={0}
            value={horizWallBars}
            onChange={(e) => setHorizWallBars(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Vertical bars — spacing (inches OC)</label>
          <input
            type="number"
            min={0}
            value={vertSpacingInches}
            onChange={(e) => setVertSpacingInches(parseInt(e.target.value) || 0)}
            className={inputClass}
            placeholder="e.g. 32"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 bg-ecfi-gold text-ecfi-gold-contrast text-[12px] font-extrabold uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </PopoverContent>
    </Popover>
  );
}
