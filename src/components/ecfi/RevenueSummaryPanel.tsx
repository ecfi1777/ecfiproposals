import { fmtCurrency } from "@/lib/ecfi-utils";

export interface RevenueSummaryData {
  grandStd: number;
  grandOpt: number;
  proposalTotal: number;
  foundationRevenue: number;
  passThroughTotal: number;
}

export function RevenueSummaryPanel({ data }: { data: RevenueSummaryData }) {
  const { grandStd, grandOpt, proposalTotal, foundationRevenue, passThroughTotal } = data;

  return (
    <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-[var(--text-main)] tracking-widest uppercase mb-5">Revenue (from Proposal)</h3>
      <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
        <span className="text-[var(--text-secondary)]">Standard Total</span>
        <span className="font-semibold text-[var(--text-main)]">{fmtCurrency(grandStd)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
        <span className="text-[var(--text-secondary)]">Optional Total</span>
        <span className="font-semibold text-[var(--text-secondary)]">{fmtCurrency(grandOpt)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
        <span className="font-semibold text-sm text-[var(--text-main)]">Proposal Total</span>
        <span className="font-semibold text-lg text-[var(--primary-blue)]">{fmtCurrency(proposalTotal)}</span>
      </div>
      {passThroughTotal > 0 && (
        <div className="flex justify-between py-2.5 border-b border-[var(--card-border)]">
          <span className="text-[var(--text-secondary)] text-[12px]">Less: Pass-Through (Pump / Winter)</span>
          <span className="font-semibold text-[var(--text-secondary)]">({fmtCurrency(passThroughTotal)})</span>
        </div>
      )}
      <div className="flex justify-between py-3 border-b-2 border-[var(--card-border)]">
        <span className="font-semibold text-sm text-[var(--primary-blue)]">FOUNDATION REVENUE</span>
        <span className="font-semibold text-lg text-[var(--primary-blue)]">{fmtCurrency(foundationRevenue)}</span>
      </div>
      {passThroughTotal > 0 && (
        <div className="text-[10px] text-[var(--text-muted)] mt-2 italic">
          Concrete Pump and Winter Concrete are pass-through items excluded from margin calc.
        </div>
      )}
    </div>
  );
}
