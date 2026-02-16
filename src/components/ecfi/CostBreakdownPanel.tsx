import { fmtCurrency } from "@/lib/ecfi-utils";

export interface CostBreakdownData {
  totalYards: number;
  concreteCost: number;
  laborCost: number;
  rebarTotalCost: number;
  totalRebarLF: number;
  rebarCostPerLF: number;
  otherCostVal: number;
  otherCostsNote: string;
  concretePerYard: number;
  laborPerYard: number;
  totalCost: number;
}

export function CostBreakdownPanel({ data }: { data: CostBreakdownData }) {
  const {
    totalYards, concreteCost, laborCost, rebarTotalCost, totalRebarLF,
    rebarCostPerLF, otherCostVal, otherCostsNote, concretePerYard, laborPerYard, totalCost,
  } = data;

  // Rounded-up volume for display in cost lines
  const orderYards = Math.ceil(totalYards * 2) / 2;

  return (
    <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-[var(--text-main)] tracking-widest uppercase mb-1">Cost Breakdown</h3>
      <p className="text-[10px] text-[var(--text-muted)] mb-5">Concrete volume rounded up to nearest ½ yard for ordering.</p>
      {[
        [`Concrete (${orderYards.toFixed(1)} yd × ${fmtCurrency(concretePerYard)}/yd)`, concreteCost],
        [`Labor (${orderYards.toFixed(1)} yd × ${fmtCurrency(laborPerYard)}/yd)`, laborCost],
        [`Rebar (${totalRebarLF.toFixed(0)} LF × ${fmtCurrency(rebarCostPerLF)}/LF)`, rebarTotalCost],
        [`Other Costs${otherCostsNote ? ` — ${otherCostsNote}` : ""}`, otherCostVal],
      ].map(([lbl, val], i) => (
        <div key={i} className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
          <span className="text-[var(--text-secondary)]">{lbl as string}</span>
          <span className="font-semibold text-[var(--text-main)]">{fmtCurrency(val as number)}</span>
        </div>
      ))}
      <div className="flex justify-between py-3 border-b-2 border-[var(--card-border)]">
        <span className="font-semibold text-sm text-[var(--text-main)]">TOTAL COST</span>
        <span className="text-[var(--danger)] font-semibold text-lg">{fmtCurrency(totalCost)}</span>
      </div>
    </div>
  );
}
