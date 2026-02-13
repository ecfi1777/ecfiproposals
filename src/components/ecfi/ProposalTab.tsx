import { useState } from "react";
import { LineItem, emptyLine, emptySlabLine, calcSection, calcTotalYards, fmtCurrency, fmt } from "@/lib/ecfi-utils";
import { LineRow, SectionHeader } from "./LineRow";
import { VolumeBreakdown } from "./VolumeBreakdown";

interface ProposalTabProps {
  proposal: {
    builder: string;
    date: string;
    location: string;
    county: string;
    foundType: string;
    foundSize: string;
  };
  setProposal: (fn: (prev: any) => any) => void;
  ftgLines: LineItem[];
  setFtgLines: (fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => void;
  slabLines: LineItem[];
  setSlabLines: (fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => void;
  catalog: string[];
  onSaveNew: (item: string) => void;
}

export function ProposalTab({
  proposal,
  setProposal,
  ftgLines,
  setFtgLines,
  slabLines,
  setSlabLines,
  catalog,
  onSaveNew,
}: ProposalTabProps) {
  const [showVolBreakdown, setShowVolBreakdown] = useState(false);

  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);
  const totalYards = ftgYards + slabYards;

  const fields: [string, string, (v: string) => void, string, string?][] = [
    ["Builder", proposal.builder, (v) => setProposal((p: any) => ({ ...p, builder: v })), "Builder Name"],
    ["Date", proposal.date, (v) => setProposal((p: any) => ({ ...p, date: v })), "", "date"],
    ["County", proposal.county, (v) => setProposal((p: any) => ({ ...p, county: v })), "County Name"],
    ["Job Location", proposal.location, (v) => setProposal((p: any) => ({ ...p, location: v })), "Address, Subdivision, Owner Name"],
    ["Foundation Type", proposal.foundType, (v) => setProposal((p: any) => ({ ...p, foundType: v })), "Custom"],
    ["Foundation Size", proposal.foundSize, (v) => setProposal((p: any) => ({ ...p, foundSize: v })), "Overall Measurement"],
  ];

  const sections = [
    { title: "Footings & Walls", lines: ftgLines, setLines: setFtgLines, totals: ftgTotals, yards: ftgYards, colorClass: "bg-ecfi-gold", newLine: emptyLine },
    { title: "Slabs", lines: slabLines, setLines: setSlabLines, totals: slabTotals, yards: slabYards, colorClass: "bg-ecfi-vol-blue", newLine: emptySlabLine },
  ];

  return (
    <div>
      {/* Header fields */}
      <div className="grid grid-cols-3 gap-4 mb-7 p-5 bg-ecfi-panel-bg border border-ecfi-panel-border">
        {fields.map(([lbl, val, set, ph, type], i) => (
          <div key={i}>
            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">{lbl}</label>
            <input
              type={type || "text"}
              value={val}
              onChange={(e) => set(e.target.value)}
              className="w-full px-2.5 py-2 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
              placeholder={ph}
            />
          </div>
        ))}
      </div>

      {/* Line item sections */}
      {sections.map((sec, si) => (
        <div key={si} className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 ${sec.colorClass}`} />
              <h2 className="text-base font-extrabold tracking-widest uppercase">{sec.title}</h2>
              <span className="text-[12px] text-ecfi-std-green-text font-semibold">{fmtCurrency(sec.totals.std)} std</span>
              {sec.totals.opt > 0 && <span className="text-[12px] text-ecfi-gold-text font-semibold">+ {fmtCurrency(sec.totals.opt)} opt</span>}
              <span className="text-[11px] text-ecfi-vol-blue-text font-semibold">{sec.yards.toFixed(1)} CY</span>
            </div>
            <button
              onClick={() => sec.setLines((prev) => [...prev, sec.newLine()])}
              className="bg-ecfi-std-green/10 text-ecfi-std-green-text border border-ecfi-std-green/30 px-4 py-1.5 cursor-pointer font-bold text-[12px] font-mono tracking-wider hover:bg-ecfi-std-green/20 transition-colors"
            >
              + ADD LINE
            </button>
          </div>
          <SectionHeader />
          {sec.lines.map((line, idx) => (
            <LineRow
              key={line.id}
              line={line}
              idx={idx}
              onChange={(updated) => {
                sec.setLines((prev) => {
                  const next = [...prev];
                  next[idx] = updated;
                  return next;
                });
              }}
              onDelete={() => sec.setLines((prev) => prev.filter((_, i) => i !== idx))}
              items={catalog}
              onSaveNew={onSaveNew}
            />
          ))}
        </div>
      ))}

      {/* Grand Totals Bar */}
      <div className="bg-card border border-ecfi-panel-border overflow-hidden">
        <div className="flex justify-end gap-7 p-5 items-center">
          <div
            onClick={() => setShowVolBreakdown(!showVolBreakdown)}
            className={`text-right cursor-pointer px-3 py-1 border border-ecfi-vol-breakdown-border transition-all select-none ${
              showVolBreakdown ? "bg-ecfi-vol-breakdown-bg" : "hover:bg-ecfi-vol-breakdown-bg/50"
            }`}
          >
            <div className="text-[10px] text-ecfi-vol-blue-text tracking-wider uppercase flex items-center gap-1.5 justify-end">
              Total Concrete
              <span className={`text-sm inline-block transition-transform ${showVolBreakdown ? "rotate-180" : ""}`}>▾</span>
            </div>
            <div className="text-xl font-extrabold text-ecfi-vol-blue-text">{totalYards.toFixed(1)} CY</div>
          </div>
          <div className="w-px bg-ecfi-panel-border self-stretch" />
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Grand Total (Std)</div>
            <div className="text-xl font-extrabold text-ecfi-std-green-text">{fmtCurrency(grandStd)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Grand Total (Opt)</div>
            <div className="text-xl font-extrabold text-ecfi-gold-text">{fmtCurrency(grandOpt)}</div>
          </div>
        </div>

        {showVolBreakdown && <VolumeBreakdown ftgLines={ftgLines} slabLines={slabLines} />}
      </div>
    </div>
  );
}
