import { LineItem, calcVolumeSplit, calcTotalYards } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";

interface VolumeBreakdownProps {
  ftgLines: LineItem[];
  slabLines: LineItem[];
}

export function VolumeBreakdown({ ftgLines, slabLines }: VolumeBreakdownProps) {
  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);
  const totalYards = ftgYards + slabYards;
  const ftgVolSplit = calcVolumeSplit(ftgLines);
  const slabVolSplit = calcVolumeSplit(slabLines);
  const totalWallCY = ftgVolSplit.wall + slabVolSplit.wall;
  const totalFtgCY = ftgVolSplit.ftg + slabVolSplit.ftg;
  const totalSlabCY = ftgVolSplit.slab + slabVolSplit.slab;

  const renderLines = (lines: LineItem[]) =>
    lines
      .filter((l) => l.description && l.qty)
      .map((l, i) => {
        const vc = calcCYPerUnit(l.description);
        const qty = parseFloat(l.qty);
        const auto = qty * vc.cy;
        const cy = l.cyOverride !== "" ? parseFloat(l.cyOverride) || 0 : auto;
        const isOvr = l.cyOverride !== "";
        const wCY = isOvr ? 0 : qty * vc.wallCY;
        const fCY = isOvr ? 0 : qty * vc.ftgCY;
        const hasWF = wCY > 0 || fCY > 0;
        return (
          <div key={i} className="py-1.5 border-b border-ecfi-vol-breakdown-border">
            <div className="flex justify-between items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-foreground/80 overflow-hidden text-ellipsis whitespace-nowrap">{l.description}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {l.qty} {l.unit} {vc.method ? `• ${vc.method}` : ""}
                </div>
              </div>
              <div className={`text-[13px] font-bold whitespace-nowrap ${isOvr ? "text-ecfi-override-orange-text" : "text-ecfi-vol-blue-text"}`}>
                {cy > 0 ? cy.toFixed(2) : "0.00"} CY
                {isOvr && <span className="text-[9px] text-ecfi-override-orange-text ml-1">✎</span>}
              </div>
            </div>
            {hasWF && (
              <div className="flex gap-3 mt-1 pl-2">
                {wCY > 0 && <span className="text-[10px] text-ecfi-wall-purple-text">Wall: {wCY.toFixed(2)}</span>}
                {fCY > 0 && <span className="text-[10px] text-ecfi-ftg-orange-text">Ftg: {fCY.toFixed(2)}</span>}
              </div>
            )}
          </div>
        );
      });

  return (
    <div className="border-t border-ecfi-vol-breakdown-border p-4 bg-ecfi-vol-breakdown-bg">
      {/* Summary bar */}
      <div className="flex gap-4 mb-4 p-3 bg-background/50 border border-ecfi-vol-breakdown-border">
        {[
          { label: "Walls", value: totalWallCY, colorClass: "text-ecfi-wall-purple-text" },
          { label: "Footings", value: totalFtgCY, colorClass: "text-ecfi-ftg-orange-text" },
          { label: "Slabs", value: totalSlabCY, colorClass: "text-ecfi-slab-green-text" },
          { label: "Total", value: totalYards, colorClass: "text-ecfi-vol-blue-text" },
        ].map((item, i) => (
          <div key={i} className={`flex-1 text-center ${i < 3 ? "border-r border-ecfi-vol-breakdown-border pr-4" : ""}`}>
            <div className={`text-[9px] ${item.colorClass} tracking-widest uppercase font-bold mb-1`}>{item.label}</div>
            <div className={`text-xl font-extrabold ${item.colorClass}`}>{item.value.toFixed(2)}</div>
            <div className={`text-[10px] ${item.colorClass} opacity-60`}>CY</div>
          </div>
        ))}
      </div>

      {/* Line-by-line detail */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-bold text-[var(--primary-blue)] tracking-widest uppercase">Footings & Walls Section</span>
            <span className="text-sm font-extrabold text-ecfi-vol-blue-text">{ftgYards.toFixed(2)} CY</span>
          </div>
          {ftgLines.filter((l) => l.description && l.qty).length === 0 && (
            <div className="text-[11px] text-muted-foreground italic py-2">No items entered</div>
          )}
          {renderLines(ftgLines)}
          {ftgLines.filter((l) => l.description && l.qty).length > 0 && (
            <div className="flex justify-end gap-3 text-[11px] font-bold py-2 border-t border-ecfi-vol-breakdown-border mt-1">
              <span className="text-ecfi-wall-purple-text">Walls: {ftgVolSplit.wall.toFixed(2)}</span>
              <span className="text-ecfi-ftg-orange-text">Ftgs: {ftgVolSplit.ftg.toFixed(2)}</span>
              {ftgVolSplit.slab > 0.001 && <span className="text-ecfi-slab-green-text">Slabs: {ftgVolSplit.slab.toFixed(2)}</span>}
              {ftgVolSplit.other > 0.001 && <span className="text-ecfi-override-orange-text">Other: {ftgVolSplit.other.toFixed(2)}</span>}
            </div>
          )}
        </div>
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-bold text-ecfi-vol-blue-text tracking-widest uppercase">Slabs Section</span>
            <span className="text-sm font-extrabold text-ecfi-vol-blue-text">{slabYards.toFixed(2)} CY</span>
          </div>
          {slabLines.filter((l) => l.description && l.qty).length === 0 && (
            <div className="text-[11px] text-muted-foreground italic py-2">No items entered</div>
          )}
          {renderLines(slabLines)}
          {slabLines.filter((l) => l.description && l.qty).length > 0 && (
            <div className="flex justify-end gap-3 text-[11px] font-bold py-2 border-t border-ecfi-vol-breakdown-border mt-1">
              {slabVolSplit.wall > 0.001 && <span className="text-ecfi-wall-purple-text">Walls: {slabVolSplit.wall.toFixed(2)}</span>}
              {slabVolSplit.ftg > 0.001 && <span className="text-ecfi-ftg-orange-text">Ftgs: {slabVolSplit.ftg.toFixed(2)}</span>}
              <span className="text-ecfi-slab-green-text">Slabs: {slabVolSplit.slab.toFixed(2)}</span>
              {slabVolSplit.other > 0.001 && <span className="text-ecfi-override-orange-text">Other: {slabVolSplit.other.toFixed(2)}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
