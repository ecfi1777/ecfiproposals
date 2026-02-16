import { LineItem, ProposalData, calcSection, calcTotalYards, fmtCurrency, isRebarEligible, calcRebarForLine, calcTotalRebarLF } from "@/lib/ecfi-utils";
import { VolumeDetailRow } from "./VolumeDetailRow";
import { RevenueSummaryPanel } from "./RevenueSummaryPanel";
import { CostBreakdownPanel } from "./CostBreakdownPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";

interface CostAnalysisTabProps {
  proposal: {
    concretePerYard: string;
    laborPerYard: string;
    otherCosts: string;
    otherCostsNote: string;
    concreteYardsOverride: string;
    rebarCostPerLF: string;
  };
  setProposal: (fn: (prev: ProposalData) => ProposalData) => void;
  ftgLines: LineItem[];
  slabLines: LineItem[];
}

/** Check if a line is a pass-through item (pump, winterization) */
const isPassThrough = (desc: string): boolean =>
  /concrete\s*pump/i.test(desc) || /winter\s*concrete/i.test(desc);

export function CostAnalysisTab({ proposal, setProposal, ftgLines, slabLines }: CostAnalysisTabProps) {
  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const proposalTotal = grandStd + grandOpt;

  // Foundation Revenue excludes pass-through items (pumps, winterization)
  const allLines = [...ftgLines, ...slabLines];
  const foundationLines = allLines.filter((l) => !isPassThrough(l.description));
  const foundationTotals = calcSection(foundationLines);
  const foundationRevenue = foundationTotals.std + foundationTotals.opt;
  const passThroughTotal = proposalTotal - foundationRevenue;

  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);
  const autoTotalYards = ftgYards + slabYards;

  const hasYardsOverride = proposal.concreteYardsOverride !== "";
  const totalYards = hasYardsOverride
    ? parseFloat(proposal.concreteYardsOverride) || 0
    : autoTotalYards;

  // Rebar calculations
  const totalRebarLF = calcTotalRebarLF(ftgLines);
  const rebarCostPerLF = parseFloat(proposal.rebarCostPerLF) || 0;
  const rebarTotalCost = totalRebarLF * rebarCostPerLF;
  const rebarLines = ftgLines.filter(
    (l) => l.rebar && isRebarEligible(l.description) && (l.rebar.horizFtgBars > 0 || l.rebar.horizWallBars > 0 || l.rebar.vertSpacingInches > 0)
  );

  const concretePerYard = parseFloat(proposal.concretePerYard) || 0;
  const laborPerYard = parseFloat(proposal.laborPerYard) || 0;
  const concreteCost = concretePerYard * totalYards;
  const laborCost = laborPerYard * totalYards;
  const otherCostVal = parseFloat(proposal.otherCosts) || 0;
  const totalCost = concreteCost + laborCost + otherCostVal + rebarTotalCost;
  const grossProfit = foundationRevenue - totalCost;
  const grossMargin = foundationRevenue > 0 ? (grossProfit / foundationRevenue) * 100 : 0;

  const inputClass = "w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-foreground text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg";
  const labelClass = "text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1 block";

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column — Inputs */}
      <div>
        <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
          <h3 className="text-sm font-extrabold text-[var(--primary-blue)] tracking-widest uppercase mb-5">Job Cost Inputs</h3>

          {/* Concrete Yards — auto with override */}
          <div className="mb-5 p-4 bg-ecfi-vol-breakdown-bg border border-ecfi-vol-breakdown-border">
            <label className="text-[10px] text-ecfi-vol-blue-text font-bold uppercase tracking-widest mb-1 block">
              Total Concrete Yards
            </label>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className={`text-[28px] font-extrabold py-1 ${hasYardsOverride ? "text-ecfi-override-orange-text" : "text-ecfi-vol-blue-text"}`}>
                  {totalYards.toFixed(2)} CY
                </div>
                <div className="text-[11px] text-ecfi-vol-blue-text/60">
                  Auto: {autoTotalYards.toFixed(2)} CY &nbsp;(Ftg/Walls: {ftgYards.toFixed(2)} + Slabs: {slabYards.toFixed(2)})
                </div>
              </div>
              <div className="w-32">
                <label className="text-[9px] text-ecfi-override-orange-text font-bold uppercase tracking-wider mb-1 block">
                  Override CY
                </label>
                <input
                  value={proposal.concreteYardsOverride}
                  onChange={(e) => setProposal((p: ProposalData) => ({ ...p, concreteYardsOverride: e.target.value }))}
                  className={`${inputClass} ${hasYardsOverride ? "!border-ecfi-override-orange-text" : ""}`}
                  placeholder="—"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-ecfi-panel-border my-4" />

          <div className="mb-4">
            <label className={labelClass}>Concrete Cost ($ per Yard)</label>
            <input value={proposal.concretePerYard} onChange={(e) => setProposal((p: ProposalData) => ({ ...p, concretePerYard: e.target.value }))} className={inputClass} placeholder="e.g. 185" />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Labor ($ per Yard) — default $60</label>
            <input value={proposal.laborPerYard} onChange={(e) => setProposal((p: ProposalData) => ({ ...p, laborPerYard: e.target.value }))} className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Other Job Costs ($)</label>
            <div className="flex gap-3">
              <input
                value={proposal.otherCosts}
                onChange={(e) => setProposal((p: ProposalData) => ({ ...p, otherCosts: e.target.value }))}
                className={`${inputClass} w-32 flex-shrink-0`}
                placeholder="0"
              />
              <input
                value={proposal.otherCostsNote}
                onChange={(e) => setProposal((p: ProposalData) => ({ ...p, otherCostsNote: e.target.value }))}
                className={`${inputClass} flex-1`}
                placeholder="pump rental, winterization, etc."
              />
            </div>
          </div>
        </div>

        {/* Rebar Summary */}
        <div className="p-5 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
          <h3 className="text-[12px] font-extrabold text-[var(--primary-blue)] tracking-widest uppercase mb-3">Rebar</h3>
          {rebarLines.length > 0 ? (
            <>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-ecfi-panel-border text-muted-foreground">
                      <th className="text-left py-1.5 font-bold uppercase tracking-wider">Description</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-12">Qty</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-10">H.Ftg</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-10">H.Wall</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-12">V.Spc"</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-16">Ftg LF</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-16">Wall LF</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-14">Vert LF</th>
                      <th className="text-right py-1.5 font-bold uppercase tracking-wider w-16">Total LF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebarLines.map((l) => {
                      const r = calcRebarForLine(l);
                      return (
                        <tr key={l.id} className="border-b border-ecfi-panel-border/50">
                          <td className="py-1.5 text-muted-foreground truncate max-w-[160px]">{l.description}</td>
                          <td className="text-right py-1.5">{l.qty}</td>
                          <td className="text-right py-1.5">{l.rebar!.horizFtgBars}</td>
                          <td className="text-right py-1.5">{l.rebar!.horizWallBars}</td>
                          <td className="text-right py-1.5">{l.rebar!.vertSpacingInches || "-"}</td>
                          <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.horizFtgLF.toFixed(0)}</td>
                          <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.horizWallLF.toFixed(0)}</td>
                          <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.vertLF.toFixed(0)}</td>
                          <td className="text-right py-1.5 font-bold">{r.totalLF.toFixed(0)}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-ecfi-panel-border">
                      <td colSpan={8} className="text-right py-2 font-extrabold uppercase tracking-wider text-[10px]">Total Rebar</td>
                      <td className="text-right py-2 font-extrabold text-[13px]">{totalRebarLF.toFixed(0)} LF</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 mt-3 p-3 bg-background border border-ecfi-panel-border">
                <div className="flex-1">
                  <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">
                    Rebar Cost ($ per LF)
                  </label>
                  <input
                    value={proposal.rebarCostPerLF}
                    onChange={(e) => setProposal((p: ProposalData) => ({ ...p, rebarCostPerLF: e.target.value }))}
                    className={`${inputClass} w-28`}
                    placeholder="e.g. 0.75"
                  />
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Rebar Total</div>
                  <div className="text-lg font-extrabold">{fmtCurrency(rebarTotalCost)}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-[12px] text-muted-foreground/50 italic py-3">
              No rebar configured — click the grid icon on eligible wall+footing line items in the Proposal tab.
            </div>
          )}
        </div>

        {/* Volume Breakdown by Line */}
        <div className="p-5 bg-ecfi-panel-bg border border-ecfi-panel-border">
          <h3 className="text-[12px] font-extrabold text-ecfi-vol-blue-text tracking-widest uppercase mb-3">Volume Breakdown by Line</h3>
          <div className="text-[10px] text-muted-foreground mb-3">
            <span className="text-ecfi-vol-blue-text">● Blue</span> = auto-calc &nbsp;
            <span className="text-ecfi-override-orange-text">● Orange</span> = manual override
          </div>
          {ftgLines.filter((l) => l.description).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-bold text-[var(--primary-blue)] tracking-wider mb-1.5 uppercase">Footings & Walls</div>
              {ftgLines.filter((l) => l.description).map((l, i) => <VolumeDetailRow key={i} line={l} />)}
              <div className="text-right text-[12px] font-bold text-ecfi-vol-blue-text py-1.5 border-t border-ecfi-panel-border">
                Subtotal: {ftgYards.toFixed(2)} CY
              </div>
            </div>
          )}
          {slabLines.filter((l) => l.description).length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-ecfi-vol-blue-text tracking-wider mb-1.5 uppercase">Slabs</div>
              {slabLines.filter((l) => l.description).map((l, i) => <VolumeDetailRow key={i} line={l} />)}
              <div className="text-right text-[12px] font-bold text-ecfi-vol-blue-text py-1.5 border-t border-ecfi-panel-border">
                Subtotal: {slabYards.toFixed(2)} CY
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column — Revenue, Costs, Profitability */}
      <div>
        <RevenueSummaryPanel
          data={{ grandStd, grandOpt, proposalTotal, foundationRevenue, passThroughTotal }}
        />
        <CostBreakdownPanel
          data={{
            totalYards, concreteCost, laborCost, rebarTotalCost, totalRebarLF,
            rebarCostPerLF, otherCostVal, otherCostsNote: proposal.otherCostsNote,
            concretePerYard, laborPerYard, totalCost,
          }}
        />
        <ProfitabilityPanel
          data={{ foundationRevenue, totalCost, grossProfit, grossMargin, totalYards }}
        />
      </div>
    </div>
  );
}
