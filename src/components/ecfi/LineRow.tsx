import { useState } from "react";
import { LineItem, UNIT_OPTIONS, fmt, isRebarEligible, RebarData } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";
import { ComboBox } from "./ComboBox";
import { RebarPopup } from "./RebarPopup";
import { PriceHistoryPopup } from "./PriceHistoryPopup";
import type { CatalogItem } from "@/hooks/useCatalog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LineRowProps {
  line: LineItem;
  onChange: (updated: LineItem) => void;
  onDelete: () => void;
  items: CatalogItem[];
  onSaveNew: (description: string) => void;
  idx: number;
  sectionPrefix: string;
  openHistoryKey: string | null;
  onHistoryOpenChange: (key: string | null) => void;
}

export function LineRow({ line, onChange, onDelete, items, onSaveNew, idx, sectionPrefix, openHistoryKey, onHistoryOpenChange }: LineRowProps) {
  const totalStd = line.qty && line.unitPriceStd ? parseFloat(line.qty) * parseFloat(line.unitPriceStd) : 0;
  const totalOpt = line.qty && line.unitPriceOpt ? parseFloat(line.qty) * parseFloat(line.unitPriceOpt) : 0;
  const volCalc = calcCYPerUnit(line.description);
  const autoYards = line.qty ? parseFloat(line.qty) * volCalc.cy : 0;
  const isOverridden = line.cyOverride !== "";
  const showRebar = line.section === "ftg" && isRebarEligible(line.description);
  const hasRebarData = !!(line.rebar && (line.rebar.horizFtgBars > 0 || line.rebar.horizWallBars > 0 || line.rebar.vertSpacingInches > 0));

  const hasData = !!(line.description || line.qty || line.unitPriceStd || line.unitPriceOpt);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRebarSave = (data: RebarData) => {
    onChange({ ...line, rebar: data });
  };

  const handleDeleteClick = () => {
    if (hasData) {
      setShowDeleteConfirm(true);
    } else {
      onDelete();
    }
  };

  return (
    <div className="flex gap-1.5 items-center mb-1">
      <span className="text-[var(--text-muted)] text-[11px] w-5 text-right">{idx + 1}</span>
      <input
        value={line.qty}
        onChange={(e) => onChange({ ...line, qty: e.target.value })}
        placeholder="QTY"
        className="w-[55px] px-2 py-1.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-[13px] font-mono text-right focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg"
      />
      <select
        value={line.unit}
        onChange={(e) => onChange({ ...line, unit: e.target.value })}
        className="w-[52px] px-1 py-1.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-[13px] font-mono cursor-pointer focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg"
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <div className="flex-1 flex items-center gap-0.5">
        <ComboBox
          value={line.description}
          onChange={(v) => onChange({ ...line, description: v })}
          onSelectItem={(item) => onChange({ ...line, description: item.description, unit: item.default_unit })}
          items={items}
          onSaveNew={onSaveNew}
          placeholder="Description..."
        />
        {showRebar && (
          <RebarPopup rebar={line.rebar} onSave={handleRebarSave} hasData={hasRebarData} />
        )}
        <PriceHistoryPopup
          description={line.description}
          popoverKey={`${sectionPrefix}-${idx}`}
          openKey={openHistoryKey}
          onOpenChange={onHistoryOpenChange}
        />
      </div>
      <input
        value={line.unitPriceStd}
        onChange={(e) => onChange({ ...line, unitPriceStd: e.target.value })}
        placeholder="Std $"
        className="w-[72px] px-2 py-1.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-[13px] font-mono text-right focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg"
      />
      <div className={`w-[82px] text-right text-[13px] font-mono ${totalStd ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>
        {totalStd ? fmt(totalStd) : "-"}
      </div>
      <input
        value={line.unitPriceOpt}
        onChange={(e) => onChange({ ...line, unitPriceOpt: e.target.value })}
        placeholder="Opt $"
        className="w-[72px] px-2 py-1.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-[13px] font-mono text-right focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg"
      />
      <div className={`w-[82px] text-right text-[13px] font-mono ${totalOpt ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}>
        {totalOpt ? fmt(totalOpt) : "-"}
      </div>
      <div className="w-[72px] relative" title={volCalc.method ? `Auto: ${volCalc.method}\n${autoYards.toFixed(2)} CY` : "No auto-calc — type to override"}>
        <input
          value={line.cyOverride !== "" ? line.cyOverride : autoYards > 0 ? autoYards.toFixed(2) : ""}
          onChange={(e) => onChange({ ...line, cyOverride: e.target.value })}
          onBlur={() => {
            if (line.cyOverride === "" || line.cyOverride === autoYards.toFixed(2)) onChange({ ...line, cyOverride: "" });
          }}
          placeholder="-"
          className={`w-full px-2 py-1.5 border text-[13px] font-mono text-right focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg ${
            isOverridden
              ? "text-ecfi-override-orange-text bg-ecfi-override-orange/10 border-ecfi-override-orange/30"
              : autoYards > 0
              ? "text-ecfi-vol-blue-text bg-[var(--bg-main)] border-[var(--card-border)]"
              : "text-[var(--text-muted)] bg-[var(--bg-main)] border-[var(--card-border)]"
          }`}
        />
        {volCalc.method && (
          <div className="absolute -top-0.5 right-0.5 text-[8px] text-ecfi-vol-blue-text/60 pointer-events-none">●</div>
        )}
      </div>
      <button
        onClick={handleDeleteClick}
        className="bg-transparent border border-[var(--danger)]/30 text-[var(--danger)] cursor-pointer px-[7px] py-1 text-[13px] hover:bg-[var(--danger)]/10 transition-colors rounded-lg"
      >
        ×
      </button>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove line item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-semibold text-[var(--text-main)]">{line.description || `line ${idx + 1}`}</span> from the proposal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function SectionHeader() {
  return (
    <div className="flex gap-1.5 items-center mb-1.5 py-1">
      <span className="w-5" />
      <span className="w-[55px] text-[9px] text-[var(--text-muted)] font-semibold text-center uppercase tracking-wider">QTY</span>
      <span className="w-[52px] text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">UNIT</span>
      <span className="flex-1 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">DESCRIPTION</span>
      <span className="w-[72px] text-[9px] text-[var(--text-muted)] font-semibold text-right uppercase tracking-wider">STD $/U</span>
      <span className="w-[82px] text-[9px] text-[var(--text-secondary)] font-semibold text-right uppercase tracking-wider">STD TOT</span>
      <span className="w-[72px] text-[9px] text-[var(--text-muted)] font-semibold text-right uppercase tracking-wider">OPT $/U</span>
      <span className="w-[82px] text-[9px] text-[var(--text-secondary)] font-semibold text-right uppercase tracking-wider">OPT TOT</span>
      <span className="w-[72px] text-[9px] text-ecfi-vol-blue-text font-semibold text-right uppercase tracking-wider">CY</span>
      <span className="w-[30px]" />
    </div>
  );
}
