import { fmtCurrency } from "@/lib/ecfi-utils";
import { Sun, Moon, LogOut, FilePlus, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavProps {
  catalogCount: number;
  totalYards: number;
  proposalTotal: number;
  saving: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNew?: () => void;
  lastSaved?: Date | null;
}

function timeAgo(d: Date): string {
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export function TopNav({ catalogCount, totalYards, proposalTotal, saving, darkMode, onToggleDarkMode, onNew, lastSaved }: TopNavProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-ecfi-nav-bg border-b border-ecfi-nav-border px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-black text-white font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
        <div>
          <div className="text-base font-bold tracking-wider">Proposal Builder</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Eastern Concrete Foundation, Inc.</div>
        </div>
      </div>
      <div className="flex gap-3 items-center text-[11px]">
        {lastSaved && !saving && (
          <span className="flex items-center gap-1 text-muted-foreground text-[10px]">
            <Clock className="w-3 h-3" />
            Saved {timeAgo(lastSaved)}
          </span>
        )}
        {saving && <span className="text-ecfi-gold-text text-[10px] animate-pulse">Saving...</span>}

        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-ecfi-panel-border hover:bg-ecfi-panel-bg text-muted-foreground hover:text-foreground transition-colors text-[11px] font-bold tracking-wider"
            title="New Proposal"
          >
            <FilePlus className="w-3.5 h-3.5" />
            New
          </button>
        )}

        <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors" title="Manage catalog">
          <span>{catalogCount} items</span>
        </Link>
        <span className="text-ecfi-vol-blue-text">
          <span className="font-extrabold text-sm">{totalYards.toFixed(1)}</span> CY
        </span>
        <span className="text-ecfi-gold-text">
          <span className="font-extrabold text-sm">{fmtCurrency(proposalTotal)}</span>
        </span>
        {profile?.full_name && (
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            {profile.full_name}
          </span>
        )}
        <button
          onClick={onToggleDarkMode}
          className="p-2 border border-ecfi-panel-border hover:bg-ecfi-panel-bg transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={signOut}
          className="p-2 border border-ecfi-panel-border hover:bg-ecfi-panel-bg transition-colors text-destructive"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
