import { useState, useMemo } from "react";
import { LineItem, ProposalData, emptyLine, emptySlabLine, calcSection, calcTotalYards, fmtCurrency } from "@/lib/ecfi-utils";
import { LineRow, SectionHeader } from "./LineRow";
import { VolumeBreakdown } from "./VolumeBreakdown";
import type { CatalogItem } from "@/hooks/useCatalog";
import { format } from "date-fns";
import { CalendarIcon, Save, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProposalTabProps {
  proposal: {
    builder: string;
    date: string;
    location: string;
    county: string;
    foundType: string;
    foundSize: string;
  };
  setProposal: (fn: (prev: ProposalData) => ProposalData) => void;
  ftgLines: LineItem[];
  setFtgLines: (fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => void;
  slabLines: LineItem[];
  setSlabLines: (fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => void;
  catalog: CatalogItem[];
  onSaveNew: (description: string, section: string, unit: string) => void;
  onSave?: () => void;
  onClear?: () => void;
  saving?: boolean;
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
  onSave,
  onClear,
  saving,
}: ProposalTabProps) {
  const [showVolBreakdown, setShowVolBreakdown] = useState(false);

  const ftgCatalog = useMemo(() => catalog.filter((c) => c.section === "ftg_wall"), [catalog]);
  const slabCatalog = useMemo(() => catalog.filter((c) => c.section === "slabs"), [catalog]);

  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);
  const totalYards = ftgYards + slabYards;

  const dateValue = proposal.date ? new Date(proposal.date + "T00:00:00") : undefined;

  const inputClass = "w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg";
  const labelClass = "text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-1 block";

  const sections = [
    {
      title: "Footings & Walls",
      lines: ftgLines,
      setLines: setFtgLines,
      totals: ftgTotals,
      yards: ftgYards,
      colorClass: "bg-[var(--primary-blue)]",
      newLine: emptyLine,
      catalogItems: ftgCatalog,
      sectionKey: "ftg_wall",
    },
    {
      title: "Slabs",
      lines: slabLines,
      setLines: setSlabLines,
      totals: slabTotals,
      yards: slabYards,
      colorClass: "bg-ecfi-vol-blue",
      newLine: emptySlabLine,
      catalogItems: slabCatalog,
      sectionKey: "slabs",
    },
  ];

  return (
    <div className="pb-20 space-y-7">
      {/* Header fields */}
      <div className="grid grid-cols-3 gap-4 p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Row 1 */}
        <div>
          <label className={labelClass}>Builder</label>
          <input
            value={proposal.builder}
            onChange={(e) => setProposal((p: ProposalData) => ({ ...p, builder: e.target.value }))}
            className={inputClass}
            placeholder="Builder Name"
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-mono text-sm border-[var(--card-border)] bg-[var(--bg-main)] hover:bg-[var(--section-bg)] h-auto px-2.5 py-2 rounded-lg",
                  !dateValue && "text-[var(--text-muted)]"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "MM/dd/yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => {
                  if (d) setProposal((p: ProposalData) => ({ ...p, date: format(d, "yyyy-MM-dd") }));
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div /> {/* empty cell to fill grid */}

        {/* Row 2 */}
        <div>
          <label className={labelClass}>Job Location</label>
          <input
            value={proposal.location}
            onChange={(e) => setProposal((p: ProposalData) => ({ ...p, location: e.target.value }))}
            className={inputClass}
            placeholder="Address, Subdivision, Owner Name"
          />
        </div>
        <div>
          <label className={labelClass}>County</label>
          <input
            value={proposal.county}
            onChange={(e) => setProposal((p: ProposalData) => ({ ...p, county: e.target.value }))}
            className={inputClass}
            placeholder="County Name"
          />
        </div>
        <div /> {/* empty cell */}

        {/* Row 3 */}
        <div>
          <label className={labelClass}>Foundation Type</label>
          <input
            value={proposal.foundType}
            onChange={(e) => setProposal((p: ProposalData) => ({ ...p, foundType: e.target.value }))}
            className={inputClass}
            placeholder="Custom"
          />
        </div>
        <div>
          <label className={labelClass}>Foundation Size</label>
          <input
            value={proposal.foundSize}
            onChange={(e) => setProposal((p: ProposalData) => ({ ...p, foundSize: e.target.value }))}
            className={inputClass}
            placeholder={`49'-4" x 32'-4"`}
          />
        </div>
        <div /> {/* empty cell */}
      </div>

      {/* Line item sections */}
      {sections.map((sec, si) => (
        <div key={si}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 rounded-sm ${sec.colorClass}`} />
              <h2 className="text-base font-semibold tracking-widest uppercase text-[var(--text-main)]">{sec.title}</h2>
              <span className="text-[12px] text-ecfi-std-green-text font-semibold">{fmtCurrency(sec.totals.std)} std</span>
              {sec.totals.opt > 0 && <span className="text-[12px] text-[var(--text-secondary)] font-semibold">+ {fmtCurrency(sec.totals.opt)} opt</span>}
              <span className="text-[11px] text-ecfi-vol-blue-text font-semibold">{sec.yards.toFixed(1)} CY</span>
            </div>
            <button
              onClick={() => sec.setLines((prev) => [...prev, sec.newLine()])}
              className="bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] border border-[var(--primary-blue)]/30 px-4 py-1.5 cursor-pointer font-bold text-[12px] font-mono tracking-wider hover:bg-[var(--primary-blue)]/10 transition-colors rounded-lg"
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
              items={sec.catalogItems}
              onSaveNew={(desc) => onSaveNew(desc, sec.sectionKey, "LF")}
            />
          ))}
        </div>
      ))}

      {/* Grand Totals Bar */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex justify-end gap-7 p-5 items-center">
          <div
            onClick={() => setShowVolBreakdown(!showVolBreakdown)}
            className={`text-right cursor-pointer px-3 py-1 border border-[var(--card-border)] rounded-lg transition-all select-none ${
              showVolBreakdown ? "bg-[var(--section-bg)]" : "hover:bg-[var(--section-bg)]/50"
            }`}
          >
            <div className="text-[10px] text-ecfi-vol-blue-text tracking-wider uppercase flex items-center gap-1.5 justify-end">
              Total Concrete
              <span className={`text-sm inline-block transition-transform ${showVolBreakdown ? "rotate-180" : ""}`}>▾</span>
            </div>
            <div className="text-xl font-semibold text-ecfi-vol-blue-text">{totalYards.toFixed(1)} CY</div>
          </div>
          <div className="w-px bg-[var(--card-border)] self-stretch" />
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">Grand Total (Std)</div>
            <div className="text-xl font-semibold text-[var(--primary-blue)]">{fmtCurrency(grandStd)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">Grand Total (Opt)</div>
            <div className="text-xl font-semibold text-[var(--text-secondary)]">{fmtCurrency(grandOpt)}</div>
          </div>
        </div>

        {showVolBreakdown && <VolumeBreakdown ftgLines={ftgLines} slabLines={slabLines} />}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)]/95 backdrop-blur-sm border-t border-[var(--card-border)] px-6 py-3 flex items-center justify-between z-50">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--danger)] text-[var(--danger)] font-bold text-[12px] font-mono tracking-wider hover:bg-[var(--danger)]/10 transition-colors rounded-lg">
              <Eraser className="w-4 h-4" />
              Clear Form
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Proposal?</AlertDialogTitle>
              <AlertDialogDescription>
                This will erase all data in the current form including header fields, all line items, and pricing. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClear}
                className="bg-[var(--danger)] text-white hover:opacity-90"
              >
                Yes, Clear Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

          <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary-blue)] text-white font-extrabold text-[13px] font-mono tracking-wider hover:bg-[var(--primary-blue-hover)] disabled:opacity-50 transition-colors rounded-lg"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Proposal"}
        </button>
      </div>
    </div>
  );
}
