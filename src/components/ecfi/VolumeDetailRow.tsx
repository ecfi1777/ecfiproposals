import { LineItem } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";

export function VolumeDetailRow({ line }: { line: LineItem }) {
  const volCalc = calcCYPerUnit(line.description);
  const autoYards = line.qty ? parseFloat(line.qty) * volCalc.cy : 0;
  const displayYards = line.cyOverride !== "" ? parseFloat(line.cyOverride) || 0 : autoYards;
  const isOverridden = line.cyOverride !== "";
  if (displayYards <= 0 && !line.description) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--card-border)] text-[12px]">
      <div className="text-[var(--text-secondary)] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {line.qty} {line.unit} — {line.description || "(empty)"}
      </div>
      <div className="flex gap-3 items-center">
        {volCalc.method && <span className="text-[var(--text-muted)] text-[10px]">{volCalc.method}</span>}
        <span className={`font-semibold min-w-[60px] text-right ${isOverridden ? "text-ecfi-override-orange-text" : "text-ecfi-vol-blue-text"}`}>
          {displayYards > 0 ? displayYards.toFixed(2) + " CY" : "-"}
          {isOverridden && <span className="text-[9px] text-ecfi-override-orange-text ml-1">(manual)</span>}
        </span>
      </div>
    </div>
  );
}
