import { useState } from "react";
import { LineItem, ProposalData, calcSection, calcTotalYards, fmtCurrency, isRebarEligible, calcRebarForLine, calcTotalRebarLF, parseWallHeight } from "@/lib/ecfi-utils";
import { VolumeDetailRow } from "./VolumeDetailRow";
import { RevenueSummaryPanel } from "./RevenueSummaryPanel";
import { CostBreakdownPanel } from "./CostBreakdownPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { openCostAnalysisReport } from "./CostAnalysisReport";
import { ChevronRight, ChevronDown, Printer } from "lucide-react";

interface CostAnalysisTabProps {
  proposal: {
    builder: string;
    date: string;
    location: string;
    concretePerYard: string;
    laborPerYard: string;
    otherCosts: string;
    otherCostsNote: string;
    concreteYardsOverride: string;
    rebarCostPerStick: string;
    rebarWastePercent: string;
    otherCostsMode: "$" | "%";
  };
  setProposal: (fn: (prev: ProposalData) => ProposalData) => void;
  ftgLines: LineItem[];
  slabLines: LineItem[];
}

const isPassThrough = (desc: string): boolean =>
  /concrete\s*pump/i.test(desc) || /winter\s*concrete/i.test(desc);

export function CostAnalysisTab({ proposal, setProposal, ftgLines, slabLines }: CostAnalysisTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const proposalTotal = grandStd + grandOpt;

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

  // Calculator Rebar (from wall icon popups)
  const calculatorRebarLF = calcTotalRebarLF(ftgLines);
  const rebarLines = ftgLines.filter(
    (l) => l.rebar && isRebarEligible(l.description, l.customData) && (l.rebar.horizFtgBars > 0 || l.rebar.horizWallBars > 0 || l.rebar.vertSpacingInches > 0)
  );

  // Line Item Rebar (proposal lines starting with "Rebar")
  const lineItemRebarLines = allLines.filter(
    (l) => l.description && /^rebar/i.test(l.description.trim()) && l.qty
  );
  const lineItemRebarLF = lineItemRebarLines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0), 0);

  // Combined total
  const totalRebarLF = calculatorRebarLF + lineItemRebarLF;

  // Stick-based pricing
  const costPerStick = parseFloat(proposal.rebarCostPerStick) || 0;
  const wastePercent = parseFloat(proposal.rebarWastePercent) || 0;
  const rawSticks = Math.ceil(totalRebarLF / 20);
  const adjustedSticks = Math.ceil(rawSticks * (1 + wastePercent / 100));
  const rebarTotalCost = adjustedSticks * costPerStick;

  const concretePerYard = parseFloat(proposal.concretePerYard) || 0;
  const laborPerYard = parseFloat(proposal.laborPerYard) || 0;
  const orderYards = Math.ceil(totalYards * 2) / 2;
  const concreteCost = concretePerYard * orderYards;
  const laborCost = laborPerYard * orderYards;
  const otherCostsRaw = parseFloat(proposal.otherCosts) || 0;
  const baseCost = concreteCost + laborCost + rebarTotalCost;
  const otherCostVal = proposal.otherCostsMode === "%" ? (baseCost * otherCostsRaw / 100) : otherCostsRaw;
  const totalCost = concreteCost + laborCost + otherCostVal + rebarTotalCost;
  const grossProfit = foundationRevenue - totalCost;
  const grossMargin = foundationRevenue > 0 ? (grossProfit / foundationRevenue) * 100 : 0;

  const inputClass = "w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg";
  const labelClass = "text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block";

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasAnyRebar = rebarLines.length > 0 || lineItemRebarLines.length > 0;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => openCostAnalysisReport(proposal, ftgLines, slabLines)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-[12px] font-semibold uppercase tracking-wider rounded-lg hover:bg-[var(--section-bg)] transition-colors shadow-sm"
        >
          <Printer size={14} />
          Print Report
        </button>
      </div>
      <div className="grid grid-cols-2 gap-7">
      {/* Left column — Inputs */}
      <div className="space-y-6">
        <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-semibold text-[var(--text-main)] tracking-widest uppercase mb-5">Job Cost Inputs</h3>

          {/* Concrete Yards — auto with override */}
          <div className="mb-5 p-4 bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg">
            <label className="text-[10px] text-ecfi-vol-blue-text font-semibold uppercase tracking-widest mb-1 block">
              Total Concrete Yards
            </label>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className={`text-[28px] font-extrabold py-1 ${hasYardsOverride ? "text-ecfi-override-orange-text" : "text-ecfi-vol-blue-text"}`}>
                  {totalYards.toFixed(2)} CY
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Auto: {autoTotalYards.toFixed(2)} CY &nbsp;(Ftg/Walls: {ftgYards.toFixed(2)} + Slabs: {slabYards.toFixed(2)})
                </div>
              </div>
              <div className="w-32">
                <label className="text-[9px] text-ecfi-override-orange-text font-semibold uppercase tracking-wider mb-1 block">
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

          <div className="h-px bg-[var(--card-border)] my-4" />

          <div className="mb-4">
            <label className={labelClass}>Concrete Cost ($ per Yard)</label>
            <input value={proposal.concretePerYard} onChange={(e) => setProposal((p: ProposalData) => ({ ...p, concretePerYard: e.target.value }))} className={inputClass} placeholder="e.g. 185" />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Labor ($ per Yard)</label>
            <input value={proposal.laborPerYard} onChange={(e) => setProposal((p: ProposalData) => ({ ...p, laborPerYard: e.target.value }))} className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>
              Other Job Costs
              <span className="inline-flex ml-2 border border-[var(--card-border)] rounded-md overflow-hidden text-[9px]">
                <button
                  type="button"
                  onClick={() => setProposal((p: ProposalData) => ({ ...p, otherCostsMode: "$" }))}
                  className={`px-2 py-0.5 transition-colors ${proposal.otherCostsMode === "$" ? "bg-[var(--primary-blue)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--section-bg)]"}`}
                >$</button>
                <button
                  type="button"
                  onClick={() => setProposal((p: ProposalData) => ({ ...p, otherCostsMode: "%" }))}
                  className={`px-2 py-0.5 transition-colors ${proposal.otherCostsMode === "%" ? "bg-[var(--primary-blue)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--section-bg)]"}`}
                >%</button>
              </span>
            </label>
            <div className="flex gap-3">
              <input
                value={proposal.otherCosts}
                onChange={(e) => setProposal((p: ProposalData) => ({ ...p, otherCosts: e.target.value }))}
                className={`${inputClass} w-32 flex-shrink-0`}
                placeholder={proposal.otherCostsMode === "%" ? "e.g. 10" : "0"}
              />
              <input
                value={proposal.otherCostsNote}
                onChange={(e) => setProposal((p: ProposalData) => ({ ...p, otherCostsNote: e.target.value }))}
                className={`${inputClass} flex-1`}
                placeholder="pump rental, winterization, etc."
              />
            </div>
            {proposal.otherCostsMode === "%" && otherCostsRaw > 0 && (
              <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                {otherCostsRaw}% of {fmtCurrency(baseCost)} = {fmtCurrency(otherCostVal)}
              </div>
            )}
          </div>
        </div>

        {/* Rebar Section */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[12px] font-semibold text-[var(--text-main)] tracking-widest uppercase mb-3">Rebar</h3>

          {hasAnyRebar ? (
            <>
              {/* Sub-section A: Calculator Rebar */}
              {rebarLines.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider mb-1.5 uppercase">
                    Calculator Rebar <span className="font-normal text-[var(--text-muted)]">(from wall icons)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
                          <th className="w-5"></th>
                          <th className="text-left py-1.5 font-semibold uppercase tracking-wider">Description</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-12">Qty</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-10">H.Ftg</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-10">H.Wall</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-12">V.Spc"</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-16">Ftg LF</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-16">Wall LF</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-14">Vert LF</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-16">Total LF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rebarLines.map((l) => {
                          const r = calcRebarForLine(l);
                          const isExpanded = expandedRows.has(l.id);
                          const qty = parseFloat(l.qty) || 0;
                          const wallHt = parseWallHeight(l.description, l.customData);
                          const vertSpacing = l.rebar!.vertSpacingInches;
                          return (
                            <>
                              <tr
                                key={l.id}
                                className="border-b border-[var(--card-border)] cursor-pointer hover:bg-[var(--section-bg)] transition-colors"
                                onClick={() => toggleRow(l.id)}
                              >
                                <td className="py-1.5 text-[var(--text-muted)]">
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </td>
                                <td className="py-1.5 text-[var(--text-secondary)] truncate max-w-[160px]">{l.description}</td>
                                <td className="text-right py-1.5">{l.qty}</td>
                                <td className="text-right py-1.5">{l.rebar!.horizFtgBars}</td>
                                <td className="text-right py-1.5">{l.rebar!.horizWallBars}</td>
                                <td className="text-right py-1.5">{l.rebar!.vertSpacingInches || "-"}</td>
                                <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.horizFtgLF.toFixed(0)}</td>
                                <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.horizWallLF.toFixed(0)}</td>
                                <td className="text-right py-1.5 text-ecfi-vol-blue-text">{r.vertLF.toFixed(0)}</td>
                                <td className="text-right py-1.5 font-semibold">{r.totalLF.toFixed(0)}</td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${l.id}-detail`}>
                                  <td colSpan={10} className="py-2 px-6 bg-[var(--section-bg)]">
                                    <div className="text-[10px] text-[var(--text-muted)] space-y-1 font-mono">
                                      <div>Horizontal in Footings: {l.rebar!.horizFtgBars} bars × {qty.toFixed(0)} LF = {r.horizFtgLF.toFixed(0)} LF</div>
                                      <div>Horizontal in Walls: {l.rebar!.horizWallBars} bars × {qty.toFixed(0)} LF = {r.horizWallLF.toFixed(0)} LF</div>
                                      {vertSpacing > 0 && wallHt > 0 && (() => {
                                        const numVert = Math.ceil(qty / (vertSpacing / 12));
                                        const barLen = wallHt - 0.25;
                                        return (
                                          <>
                                            <div>Vertical in Walls: {qty.toFixed(0)} LF ÷ ({vertSpacing}"/12) = {numVert} bars</div>
                                            <div className="pl-3">Each bar: {wallHt}′ − 3" = {barLen.toFixed(2)}′</div>
                                            <div className="pl-3">{numVert} bars × {barLen.toFixed(2)}′ = {(numVert * barLen).toFixed(2)} LF → rounds to {r.vertLF.toFixed(0)} LF</div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                        <tr className="border-t-2 border-[var(--card-border)]">
                          <td></td>
                          <td colSpan={8} className="text-right py-2 font-semibold uppercase tracking-wider text-[10px]">Calculator Rebar</td>
                          <td className="text-right py-2 font-semibold text-[12px]">{calculatorRebarLF.toFixed(0)} LF</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-section B: Line Item Rebar */}
              {lineItemRebarLines.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider mb-1.5 uppercase">
                    Line Item Rebar <span className="font-normal text-[var(--text-muted)]">(from proposal)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
                          <th className="text-left py-1.5 font-semibold uppercase tracking-wider">Description</th>
                          <th className="text-right py-1.5 font-semibold uppercase tracking-wider w-20">Qty (LF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItemRebarLines.map((l) => (
                          <tr key={l.id} className="border-b border-[var(--card-border)]">
                            <td className="py-1.5 text-[var(--text-secondary)]">{l.description}</td>
                            <td className="text-right py-1.5 font-semibold">{(parseFloat(l.qty) || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-[var(--card-border)]">
                          <td className="text-right py-2 font-semibold uppercase tracking-wider text-[10px]">Line Item Rebar</td>
                          <td className="text-right py-2 font-semibold text-[12px]">{lineItemRebarLF.toLocaleString()} LF</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Combined Total */}
              <div className="flex justify-between py-2.5 border-t-2 border-b border-[var(--card-border)] mb-4">
                <span className="font-semibold text-[12px] text-[var(--text-main)] uppercase tracking-wider">Total Rebar</span>
                <span className="font-semibold text-[14px] text-[var(--text-main)]">{totalRebarLF.toLocaleString()} LF</span>
              </div>

              {/* Stick conversion display */}
              <div className="text-[11px] text-[var(--text-secondary)] font-mono mb-4 p-3 bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg space-y-1">
                {wastePercent > 0 ? (
                  <div>
                    {totalRebarLF.toLocaleString()} LF → {rawSticks.toLocaleString()} sticks + {wastePercent}% waste = <span className="font-semibold text-[var(--text-main)]">{adjustedSticks.toLocaleString()} sticks</span>
                    {costPerStick > 0 && <span> × {fmtCurrency(costPerStick)} = <span className="font-semibold text-[var(--text-main)]">{fmtCurrency(rebarTotalCost)}</span></span>}
                  </div>
                ) : (
                  <div>
                    {totalRebarLF.toLocaleString()} LF ÷ 20 = <span className="font-semibold text-[var(--text-main)]">{rawSticks.toLocaleString()} sticks</span>
                    {costPerStick > 0 && <span> × {fmtCurrency(costPerStick)} = <span className="font-semibold text-[var(--text-main)]">{fmtCurrency(rebarTotalCost)}</span></span>}
                  </div>
                )}
              </div>

              {/* Stick pricing inputs */}
              <div className="flex items-end gap-3 p-3 bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg">
                <div className="flex-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1 block">
                    Cost per Stick ($)
                  </label>
                  <input
                    value={proposal.rebarCostPerStick}
                    onChange={(e) => setProposal((p: ProposalData) => ({ ...p, rebarCostPerStick: e.target.value }))}
                    className={`${inputClass} w-28`}
                    placeholder="e.g. 12.50"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1 block">
                    Waste (%)
                  </label>
                  <input
                    value={proposal.rebarWastePercent}
                    onChange={(e) => setProposal((p: ProposalData) => ({ ...p, rebarWastePercent: e.target.value }))}
                    className={`${inputClass} w-20`}
                    placeholder="0"
                  />
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">Rebar Total</div>
                  <div className="text-lg font-semibold">{fmtCurrency(rebarTotalCost)}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-[12px] text-[var(--text-muted)] italic py-3">
              No rebar configured — click the grid icon on eligible wall+footing line items in the Proposal tab, or add "Rebar" line items.
            </div>
          )}
        </div>

        {/* Volume Breakdown by Line */}
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[12px] font-semibold text-[var(--text-main)] tracking-widest uppercase mb-3">Volume Breakdown by Line</h3>
          <div className="text-[10px] text-[var(--text-muted)] mb-3">
            <span className="text-ecfi-vol-blue-text">● Volume</span> = auto-calc &nbsp;
            <span className="text-ecfi-override-orange-text">● Override</span> = manual override
          </div>
          {ftgLines.filter((l) => l.description).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider mb-1.5 uppercase">Footings & Walls</div>
              {ftgLines.filter((l) => l.description).map((l, i) => <VolumeDetailRow key={i} line={l} />)}
              <div className="text-right text-[12px] font-semibold text-ecfi-vol-blue-text py-1.5 border-t border-[var(--card-border)]">
                Subtotal: {ftgYards.toFixed(2)} CY
              </div>
            </div>
          )}
          {slabLines.filter((l) => l.description).length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider mb-1.5 uppercase">Slabs</div>
              {slabLines.filter((l) => l.description).map((l, i) => <VolumeDetailRow key={i} line={l} />)}
              <div className="text-right text-[12px] font-semibold text-ecfi-vol-blue-text py-1.5 border-t border-[var(--card-border)]">
                Subtotal: {slabYards.toFixed(2)} CY
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column — Revenue, Costs, Profitability */}
      <div className="space-y-6">
        <RevenueSummaryPanel
          data={{ grandStd, grandOpt, proposalTotal, foundationRevenue, passThroughTotal }}
        />
        <CostBreakdownPanel
          data={{
            totalYards, concreteCost, laborCost, rebarTotalCost, adjustedSticks,
            costPerStick, wastePercent, otherCostVal, otherCostsNote: proposal.otherCostsNote,
            concretePerYard, laborPerYard, totalCost,
          }}
        />
        <ProfitabilityPanel
          data={{ foundationRevenue, totalCost, grossProfit, grossMargin, totalYards }}
        />
      </div>
    </div>
    </div>
  );
}
