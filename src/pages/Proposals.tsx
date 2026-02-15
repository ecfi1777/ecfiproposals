import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtCurrency } from "@/lib/ecfi-utils";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, ArrowUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUSES = ["draft", "sent", "accepted", "declined", "completed"] as const;
type Status = typeof STATUSES[number];

interface ProposalRow {
  id: string;
  proposal_date: string | null;
  builder: string | null;
  job_location: string | null;
  county: string | null;
  status: string | null;
  grand_total: number | null;
  created_at: string;
}

type SortKey = "proposal_date" | "builder" | "job_location" | "county" | "status" | "grand_total";

const Proposals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("proposal_date");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchProposals = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals_v2")
      .select("id, proposal_date, builder, job_location, county, status, grand_total, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Failed to load proposals"); }
    else setProposals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProposals(); }, [user]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("proposals_v2").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const deleteProposal = async (id: string) => {
    const { error } = await supabase.from("proposals_v2").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposal deleted");
    }
  };

  const filtered = proposals
    .filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (p.builder || "").toLowerCase().includes(q) ||
        (p.job_location || "").toLowerCase().includes(q) ||
        (p.county || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors font-mono text-[11px] tracking-wider uppercase"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      </span>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Nav */}
      <header className="bg-ecfi-nav-bg border-b border-ecfi-nav-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-ecfi-gold text-primary-foreground font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
          <div>
            <div className="text-base font-bold tracking-wider">Proposals</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Library</div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-ecfi-gold text-primary-foreground px-4 py-2 font-bold text-[12px] tracking-wider hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search builder, location, county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-ecfi-panel-bg border border-ecfi-panel-border text-sm font-mono focus:outline-none focus:border-ecfi-gold"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] font-mono text-[12px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading proposals...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            {proposals.length === 0 ? "No proposals yet. Create your first one!" : "No proposals match your filters."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Date" field="proposal_date" />
                <SortHeader label="Builder" field="builder" />
                <SortHeader label="Job Location" field="job_location" />
                <SortHeader label="County" field="county" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Grand Total" field="grand_total" />
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-ecfi-panel-bg/50"
                  onClick={() => navigate(`/?id=${p.id}`)}
                >
                  <TableCell className="font-mono text-[12px]">{p.proposal_date || "—"}</TableCell>
                  <TableCell className="font-mono text-[12px] font-bold">{p.builder || "—"}</TableCell>
                  <TableCell className="font-mono text-[12px]">{p.job_location || "—"}</TableCell>
                  <TableCell className="font-mono text-[12px]">{p.county || "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={p.status || "draft"} onValueChange={(v) => updateStatus(p.id, v)}>
                      <SelectTrigger className="h-7 w-[110px] font-mono text-[11px] capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-[12px]">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] font-bold text-ecfi-gold-text">
                    {p.grand_total ? fmtCurrency(p.grand_total) : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1 text-destructive hover:opacity-70" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Proposal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the proposal for "{p.builder || "Untitled"}" and all its line items.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProposal(p.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Proposals;
