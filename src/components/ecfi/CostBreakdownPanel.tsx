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

  return (
    <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
      <h3 className="text-sm font-extrabold text-[var(--primary-blue)] tracking-widest uppercase mb-5">Cost Breakdown</h3>
      {[
        [`Concrete (${totalYards.toFixed(1)} yd × ${fmtCurrency(concretePerYard)}/yd)`, concreteCost],
        [`Labor (${totalYards.toFixed(1)} yd × ${fmtCurrency(laborPerYard)}/yd)`, laborCost],
        [`Rebar (${totalRebarLF.toFixed(0)} LF × ${fmtCurrency(rebarCostPerLF)}/LF)`, rebarTotalCost],
        [`Other Costs${otherCostsNote ? ` — ${otherCostsNote}` : ""}`, otherCostVal],
      ].map(([lbl, val], i) => (
        <div key={i} className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
          <span className="text-muted-foreground">{lbl as string}</span>
          <span className="font-bold">{fmtCurrency(val as number)}</span>
        </div>
      ))}
      <div className="flex justify-between py-3 border-b-2 border-ecfi-panel-border">
        <span className="font-extrabold text-sm">TOTAL COST</span>
        <span className="text-ecfi-danger-text font-extrabold text-lg">{fmtCurrency(totalCost)}</span>
      </div>
    </div>
  );
}
