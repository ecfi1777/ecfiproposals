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
    <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
      <h3 className="text-sm font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-5">Revenue (from Proposal)</h3>
      <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
        <span className="text-muted-foreground">Standard Total</span>
        <span className="font-bold text-ecfi-std-green-text">{fmtCurrency(grandStd)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
        <span className="text-muted-foreground">Optional Total</span>
        <span className="font-bold text-ecfi-gold-text">{fmtCurrency(grandOpt)}</span>
      </div>
      <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
        <span className="font-extrabold text-sm">Proposal Total</span>
        <span className="font-extrabold text-lg">{fmtCurrency(proposalTotal)}</span>
      </div>
      {passThroughTotal > 0 && (
        <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
          <span className="text-muted-foreground text-[12px]">Less: Pass-Through (Pump / Winter)</span>
          <span className="font-bold text-muted-foreground">({fmtCurrency(passThroughTotal)})</span>
        </div>
      )}
      <div className="flex justify-between py-3 border-b-2 border-ecfi-panel-border">
        <span className="font-extrabold text-sm text-ecfi-vol-blue-text">FOUNDATION REVENUE</span>
        <span className="font-extrabold text-lg text-ecfi-vol-blue-text">{fmtCurrency(foundationRevenue)}</span>
      </div>
      {passThroughTotal > 0 && (
        <div className="text-[10px] text-muted-foreground/60 mt-2 italic">
          Concrete Pump and Winter Concrete are pass-through items excluded from margin calc.
        </div>
      )}
    </div>
  );
}
