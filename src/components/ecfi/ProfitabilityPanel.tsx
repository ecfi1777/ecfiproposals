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
    <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-[var(--text-main)] tracking-widest uppercase mb-5">Profitability</h3>
      <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
        <span className="text-[var(--text-secondary)]">Foundation Revenue</span>
        <span className="font-semibold text-[var(--text-main)]">{fmtCurrency(foundationRevenue)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
        <span className="text-[var(--text-secondary)]">Total Cost</span>
        <span className="text-[var(--danger)] font-semibold">({fmtCurrency(totalCost)})</span>
      </div>
      <div className="flex justify-between py-3 border-b-2 border-[var(--card-border)]">
        <span className="font-semibold text-sm text-[var(--text-main)]">GROSS PROFIT</span>
        <span className={`font-extrabold text-[22px] ${grossProfit >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {fmtCurrency(grossProfit)}
        </span>
      </div>

      {/* Gross Margin Visual */}
      <div className="mt-5">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Gross Margin</span>
          <span className={`text-[28px] font-extrabold ${grossMargin >= 30 ? "text-[var(--success)]" : grossMargin >= 15 ? "text-[var(--primary-blue)]" : "text-[var(--danger)]"}`}>
            {grossMargin.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-[var(--section-bg)] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(Math.max(grossMargin, 0), 100)}%`,
              background:
                grossMargin >= 30
                  ? "linear-gradient(90deg, #15803D80, #15803D)"
                  : grossMargin >= 15
                  ? `linear-gradient(90deg, var(--primary-blue-soft), var(--primary-blue))`
                  : "linear-gradient(90deg, #B91C1C80, #B91C1C)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[var(--danger)]">0%</span>
          <span className="text-[10px] text-[var(--primary-blue)]">15%</span>
          <span className="text-[10px] text-[var(--success)]">30%+</span>
        </div>
      </div>

      {/* Per-Yard Metrics */}
      <div className="mt-6 p-4 bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase mb-3">Per-Yard Metrics</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Revenue/CY", foundationRevenue, "text-[var(--text-main)]"],
            ["Cost/CY", totalCost, "text-[var(--danger)]"],
            ["Profit/CY", grossProfit, grossProfit >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"],
          ].map(([lbl, val, clr], i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-[var(--text-muted)]">{lbl as string}</div>
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
