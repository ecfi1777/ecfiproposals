import { LogOut, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavProps {
  saving: boolean;
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

export function TopNav({ saving, lastSaved }: TopNavProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-black text-white font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
        <div>
          <div className="text-base font-bold tracking-wider text-[var(--text-main)]">Proposal Builder</div>
          <div className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">Eastern Concrete Foundation, Inc.</div>
        </div>
      </div>
      <div className="flex gap-3 items-center text-[11px]">
        {lastSaved && !saving && (
          <span className="flex items-center gap-1 text-[var(--text-muted)] text-[10px]">
            <Clock className="w-3 h-3" />
            Saved {timeAgo(lastSaved)}
          </span>
        )}
        {saving && <span className="text-[var(--primary-blue)] text-[10px] animate-pulse">Saving...</span>}

        {profile?.full_name && (
          <span className="text-[var(--text-muted)] text-[10px] font-bold tracking-wider uppercase">
            {profile.full_name}
          </span>
        )}
        <button
          onClick={signOut}
          className="p-2 border border-[var(--card-border)] hover:bg-[var(--section-bg)] transition-colors text-[var(--danger)] rounded-lg"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
