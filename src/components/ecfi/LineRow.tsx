import { LineItem, UNIT_OPTIONS, fmt } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";
import { ComboBox } from "./ComboBox";

interface LineRowProps {
  line: LineItem;
  onChange: (updated: LineItem) => void;
  onDelete: () => void;
  items: string[];
  onSaveNew: (item: string) => void;
  idx: number;
}

export function LineRow({ line, onChange, onDelete, items, onSaveNew, idx }: LineRowProps) {
  const totalStd = line.qty && line.unitPriceStd ? parseFloat(line.qty) * parseFloat(line.unitPriceStd) : 0;
  const totalOpt = line.qty && line.unitPriceOpt ? parseFloat(line.qty) * parseFloat(line.unitPriceOpt) : 0;
  const volCalc = calcCYPerUnit(line.description);
  const autoYards = line.qty ? parseFloat(line.qty) * volCalc.cy : 0;
  const isOverridden = line.cyOverride !== "";

  return (
    <div className="flex gap-1.5 items-center mb-1">
      <span className="text-ecfi-row-number text-[11px] w-5 text-right">{idx + 1}</span>
      <input
        value={line.qty}
        onChange={(e) => onChange({ ...line, qty: e.target.value })}
        placeholder="QTY"
        className="w-[55px] px-2 py-1.5 border border-ecfi-input-border rounded bg-ecfi-input-bg text-foreground text-[13px] font-mono text-right focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
      />
      <select
        value={line.unit}
        onChange={(e) => onChange({ ...line, unit: e.target.value })}
        className="w-[52px] px-1 py-1.5 border border-ecfi-input-border rounded bg-ecfi-input-bg text-foreground text-[13px] font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <ComboBox
        value={line.description}
        onChange={(v) => onChange({ ...line, description: v })}
        items={items}
        onSaveNew={onSaveNew}
        placeholder="Description..."
      />
      <input
        value={line.unitPriceStd}
        onChange={(e) => onChange({ ...line, unitPriceStd: e.target.value })}
        placeholder="Std $"
        className="w-[72px] px-2 py-1.5 border border-ecfi-input-border rounded bg-ecfi-input-bg text-foreground text-[13px] font-mono text-right focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
      />
      <div className={`w-[82px] text-right text-[13px] font-mono ${totalStd ? "text-ecfi-std-green-text" : "text-ecfi-subtle"}`}>
        {totalStd ? fmt(totalStd) : "-"}
      </div>
      <input
        value={line.unitPriceOpt}
        onChange={(e) => onChange({ ...line, unitPriceOpt: e.target.value })}
        placeholder="Opt $"
        className="w-[72px] px-2 py-1.5 border border-ecfi-input-border rounded bg-ecfi-input-bg text-foreground text-[13px] font-mono text-right focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
      />
      <div className={`w-[82px] text-right text-[13px] font-mono ${totalOpt ? "text-ecfi-gold-text" : "text-ecfi-subtle"}`}>
        {totalOpt ? fmt(totalOpt) : "-"}
      </div>
      <div className="w-[72px] relative" title={volCalc.method ? `Auto: ${volCalc.method}\n${autoYards.toFixed(2)} CY` : "No auto-calc — type to override"}>
        <input
          value={line.cyOverride !== "" ? line.cyOverride : autoYards > 0 ? autoYards.toFixed(2) : ""}
          onChange={(e) => onChange({ ...line, cyOverride: e.target.value })}
          onBlur={() => {
            if (line.cyOverride === "" || line.cyOverride === autoYards.toFixed(2)) onChange({ ...line, cyOverride: "" });
          }}
          placeholder="-"
          className={`w-full px-2 py-1.5 border rounded text-[13px] font-mono text-right focus:outline-none focus:ring-1 focus:ring-ecfi-gold ${
            isOverridden
              ? "text-ecfi-override-orange-text bg-ecfi-override-orange/10 border-ecfi-override-orange/30"
              : autoYards > 0
              ? "text-ecfi-vol-blue-text bg-ecfi-input-bg border-ecfi-input-border"
              : "text-ecfi-subtle bg-ecfi-input-bg border-ecfi-input-border"
          }`}
        />
        {volCalc.method && (
          <div className="absolute -top-0.5 right-0.5 text-[8px] text-ecfi-vol-blue-text/60 pointer-events-none">●</div>
        )}
      </div>
      <button
        onClick={onDelete}
        className="bg-transparent border border-destructive/30 text-destructive/70 rounded cursor-pointer px-[7px] py-1 text-[13px] hover:bg-destructive/10 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

export function SectionHeader() {
  return (
    <div className="flex gap-1.5 items-center mb-1.5 py-1">
      <span className="w-5" />
      <span className="w-[55px] text-[9px] text-muted-foreground font-bold text-center uppercase tracking-wider">QTY</span>
      <span className="w-[52px] text-[9px] text-muted-foreground font-bold uppercase tracking-wider">UNIT</span>
      <span className="flex-1 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">DESCRIPTION</span>
      <span className="w-[72px] text-[9px] text-muted-foreground font-bold text-right uppercase tracking-wider">STD $/U</span>
      <span className="w-[82px] text-[9px] text-ecfi-std-green-text font-bold text-right uppercase tracking-wider">STD TOT</span>
      <span className="w-[72px] text-[9px] text-muted-foreground font-bold text-right uppercase tracking-wider">OPT $/U</span>
      <span className="w-[82px] text-[9px] text-ecfi-gold-text font-bold text-right uppercase tracking-wider">OPT TOT</span>
      <span className="w-[72px] text-[9px] text-ecfi-vol-blue-text font-bold text-right uppercase tracking-wider">CY</span>
      <span className="w-[30px]" />
    </div>
  );
}
