import { fmtCurrency } from "@/lib/ecfi-utils";
import { Sun, Moon } from "lucide-react";

interface TopNavProps {
  catalogCount: number;
  totalYards: number;
  proposalTotal: number;
  saving: boolean;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export function TopNav({ catalogCount, totalYards, proposalTotal, saving, darkMode, setDarkMode }: TopNavProps) {
  return (
    <header className="bg-ecfi-nav-bg border-b border-ecfi-nav-border px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-ecfi-gold text-primary-foreground font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
        <div>
          <div className="text-base font-bold tracking-wider">Proposal Builder</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Eastern Concrete Foundation, Inc.</div>
        </div>
      </div>
      <div className="flex gap-5 items-center text-[11px]">
        {saving && <span className="text-ecfi-gold-text text-[10px] animate-pulse">Saving...</span>}
        <span className="text-muted-foreground">{catalogCount} items</span>
        <span className="text-ecfi-vol-blue-text">
          <span className="font-extrabold text-sm">{totalYards.toFixed(1)}</span> CY
        </span>
        <span className="text-ecfi-gold-text">
          <span className="font-extrabold text-sm">{fmtCurrency(proposalTotal)}</span>
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 border border-ecfi-panel-border hover:bg-ecfi-panel-bg transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
