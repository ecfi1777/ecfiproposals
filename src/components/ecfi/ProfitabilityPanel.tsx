import { fmtCurrency } from "@/lib/ecfi-utils";

export interface ProfitabilityData {
  foundationRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  totalYards: number;
}

export function ProfitabilityPanel({ data }: { data: ProfitabilityData }) {
  const { foundationRevenue, totalCost, grossProfit, grossMargin, totalYards } = data;

  return (
    <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border">
      <h3 className="text-sm font-extrabold text-[var(--primary-blue)] tracking-widest uppercase mb-5">Profitability</h3>
      <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
        <span className="text-muted-foreground">Foundation Revenue</span>
        <span className="font-bold">{fmtCurrency(foundationRevenue)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
        <span className="text-muted-foreground">Total Cost</span>
        <span className="text-ecfi-danger-text font-bold">({fmtCurrency(totalCost)})</span>
      </div>
      <div className="flex justify-between py-3 border-b-2 border-ecfi-panel-border">
        <span className="font-extrabold text-sm">GROSS PROFIT</span>
        <span className={`font-extrabold text-[22px] ${grossProfit >= 0 ? "text-ecfi-std-green-text" : "text-ecfi-danger-text"}`}>
          {fmtCurrency(grossProfit)}
        </span>
      </div>

      {/* Gross Margin Visual */}
      <div className="mt-5">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-wider">Gross Margin</span>
          <span className={`text-[28px] font-extrabold ${grossMargin >= 30 ? "text-ecfi-std-green-text" : grossMargin >= 15 ? "text-[var(--primary-blue)]" : "text-ecfi-danger-text"}`}>
            {grossMargin.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-ecfi-panel-border overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(grossMargin, 0), 100)}%`,
              background:
                grossMargin >= 30
                  ? "linear-gradient(90deg, hsl(var(--ecfi-std-green) / 0.6), hsl(var(--ecfi-std-green)))"
                  : grossMargin >= 15
                  ? `linear-gradient(90deg, var(--primary-blue-soft), var(--primary-blue))`
                  : "linear-gradient(90deg, hsl(var(--ecfi-danger) / 0.6), hsl(var(--ecfi-danger)))",
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-ecfi-danger-text">0%</span>
          <span className="text-[10px] text-[var(--primary-blue)]">15%</span>
          <span className="text-[10px] text-ecfi-std-green-text">30%+</span>
        </div>
      </div>

      {/* Per-Yard Metrics */}
      <div className="mt-6 p-4 bg-background border border-ecfi-panel-border">
        <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">Per-Yard Metrics</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Revenue/CY", foundationRevenue, "text-foreground"],
            ["Cost/CY", totalCost, "text-ecfi-danger-text"],
            ["Profit/CY", grossProfit, grossProfit >= 0 ? "text-ecfi-std-green-text" : "text-ecfi-danger-text"],
          ].map(([lbl, val, clr], i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-muted-foreground">{lbl as string}</div>
              <div className={`text-base font-extrabold ${clr as string}`}>
                {totalYards > 0 ? fmtCurrency((val as number) / totalYards) : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
