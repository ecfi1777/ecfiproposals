import { useState } from "react";
import { LineItem, calcSection, calcTotalYards, fmtCurrency, isRebarEligible, calcRebarForLine, calcTotalRebarLF } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";

interface CostAnalysisTabProps {
  proposal: {
    concretePerYard: string;
    laborPerYard: string;
    otherCosts: string;
    otherCostsNote: string;
    concreteYardsOverride: string;
    rebarCostPerLF: string;
  };
  setProposal: (fn: (prev: any) => any) => void;
  ftgLines: LineItem[];
  slabLines: LineItem[];
}

function VolumeDetailRow({ line }: { line: LineItem }) {
  const volCalc = calcCYPerUnit(line.description);
  const autoYards = line.qty ? parseFloat(line.qty) * volCalc.cy : 0;
  const displayYards = line.cyOverride !== "" ? parseFloat(line.cyOverride) || 0 : autoYards;
  const isOverridden = line.cyOverride !== "";
  if (displayYards <= 0 && !line.description) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-ecfi-panel-border text-[12px]">
      <div className="text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {line.qty} {line.unit} — {line.description || "(empty)"}
      </div>
      <div className="flex gap-3 items-center">
        {volCalc.method && <span className="text-muted-foreground/50 text-[10px]">{volCalc.method}</span>}
        <span className={`font-semibold min-w-[60px] text-right ${isOverridden ? "text-ecfi-override-orange-text" : "text-ecfi-vol-blue-text"}`}>
          {displayYards > 0 ? displayYards.toFixed(2) + " CY" : "-"}
          {isOverridden && <span className="text-[9px] text-ecfi-override-orange-text ml-1">(manual)</span>}
        </span>
      </div>
    </div>
  );
}

export function CostAnalysisTab({ proposal, setProposal, ftgLines, slabLines }: CostAnalysisTabProps) {
  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const proposalTotal = grandStd + grandOpt;
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

  const concreteCost = (parseFloat(proposal.concretePerYard) || 0) * totalYards;
  const laborCost = (parseFloat(proposal.laborPerYard) || 0) * totalYards;
  const otherCostVal = parseFloat(proposal.otherCosts) || 0;
  const totalCost = concreteCost + laborCost + otherCostVal + rebarTotalCost;
  const grossProfit = proposalTotal - totalCost;
  const grossMargin = proposalTotal > 0 ? (grossProfit / proposalTotal) * 100 : 0;

  const inputClass = "w-full px-2.5 py-2 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold";
  const labelClass = "text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block";

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column — Inputs */}
      <div>
        <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
          <h3 className="text-sm font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-5">Job Cost Inputs</h3>

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
                  onChange={(e) => setProposal((p: any) => ({ ...p, concreteYardsOverride: e.target.value }))}
                  className={`${inputClass} ${hasYardsOverride ? "!border-ecfi-override-orange-text" : ""}`}
                  placeholder="—"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-ecfi-panel-border my-4" />

          <div className="mb-4">
            <label className={labelClass}>Concrete Cost ($ per Yard)</label>
            <input value={proposal.concretePerYard} onChange={(e) => setProposal((p: any) => ({ ...p, concretePerYard: e.target.value }))} className={inputClass} placeholder="e.g. 185" />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Labor ($ per Yard) — default $60</label>
            <input value={proposal.laborPerYard} onChange={(e) => setProposal((p: any) => ({ ...p, laborPerYard: e.target.value }))} className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Other Job Costs ($)</label>
            <div className="flex gap-3">
              <input
                value={proposal.otherCosts}
                onChange={(e) => setProposal((p: any) => ({ ...p, otherCosts: e.target.value }))}
                className={`${inputClass} w-32 flex-shrink-0`}
                placeholder="0"
              />
              <input
                value={proposal.otherCostsNote}
                onChange={(e) => setProposal((p: any) => ({ ...p, otherCostsNote: e.target.value }))}
                className={`${inputClass} flex-1`}
                placeholder="pump rental, winterization, etc."
              />
            </div>
          </div>
        </div>

        {/* Rebar Summary */}
        <div className="p-5 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
          <h3 className="text-[12px] font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-3">Rebar</h3>
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
                    onChange={(e) => setProposal((p: any) => ({ ...p, rebarCostPerLF: e.target.value }))}
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
              <div className="text-[10px] font-bold text-ecfi-gold-text tracking-wider mb-1.5 uppercase">Footings & Walls</div>
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
        {/* Revenue */}
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
          <div className="flex justify-between py-3 border-b-2 border-ecfi-panel-border">
            <span className="font-extrabold text-sm">GRAND TOTAL</span>
            <span className="font-extrabold text-lg">{fmtCurrency(proposalTotal)}</span>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border mb-5">
          <h3 className="text-sm font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-5">Cost Breakdown</h3>
          {[
            [`Concrete (${totalYards.toFixed(1)} yd × ${fmtCurrency(parseFloat(proposal.concretePerYard) || 0)}/yd)`, concreteCost],
            [`Labor (${totalYards.toFixed(1)} yd × ${fmtCurrency(parseFloat(proposal.laborPerYard) || 0)}/yd)`, laborCost],
            [`Rebar (${totalRebarLF.toFixed(0)} LF × ${fmtCurrency(rebarCostPerLF)}/LF)`, rebarTotalCost],
            [`Other Costs${proposal.otherCostsNote ? ` — ${proposal.otherCostsNote}` : ""}`, otherCostVal],
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

        {/* Profitability */}
        <div className="p-6 bg-ecfi-panel-bg border border-ecfi-panel-border">
          <h3 className="text-sm font-extrabold text-ecfi-gold-text tracking-widest uppercase mb-5">Profitability</h3>
          <div className="flex justify-between py-2.5 border-b border-ecfi-panel-border">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-bold">{fmtCurrency(proposalTotal)}</span>
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
              <span className={`text-[28px] font-extrabold ${grossMargin >= 30 ? "text-ecfi-std-green-text" : grossMargin >= 15 ? "text-ecfi-gold-text" : "text-ecfi-danger-text"}`}>
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
                      ? "linear-gradient(90deg, hsl(var(--ecfi-gold) / 0.6), hsl(var(--ecfi-gold)))"
                      : "linear-gradient(90deg, hsl(var(--ecfi-danger) / 0.6), hsl(var(--ecfi-danger)))",
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-ecfi-danger-text">0%</span>
              <span className="text-[10px] text-ecfi-gold-text">15%</span>
              <span className="text-[10px] text-ecfi-std-green-text">30%+</span>
            </div>
          </div>

          {/* Per-Yard Metrics */}
          <div className="mt-6 p-4 bg-background border border-ecfi-panel-border">
            <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">Per-Yard Metrics</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["Revenue/CY", proposalTotal, "text-foreground"],
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
      </div>
    </div>
  );
}
