import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtCurrency } from "@/lib/ecfi-utils";
import { Search, ChevronDown, ChevronRight, Calendar, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PriceRecord {
  id: string;
  description: string;
  unit: string;
  unit_price: number;
  qty: number | null;
  pricing_type: string;
  builder: string | null;
  job_location: string | null;
  county: string | null;
  proposal_id: string | null;
  recorded_at: string;
}

interface ItemSummary {
  description: string;
  records: PriceRecord[];
  lastPrice: number;
  lastDate: string;
  lastBuilder: string | null;
  lastLocation: string | null;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}

interface PriceHistoryTabProps {
  onLoadProposal: (id: string) => void;
}

export function PriceHistoryTab({ onLoadProposal }: PriceHistoryTabProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [builderFilter, setBuilderFilter] = useState("__all__");
  const [countyFilter, setCountyFilter] = useState("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("price_history")
        .select("*")
        .order("recorded_at", { ascending: false });
      setRecords((data as PriceRecord[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const uniqueBuilders = useMemo(() => [...new Set(records.map(r => r.builder).filter(Boolean) as string[])].sort(), [records]);
  const uniqueCounties = useMemo(() => [...new Set(records.map(r => r.county).filter(Boolean) as string[])].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (builderFilter !== "__all__" && r.builder !== builderFilter) return false;
      if (countyFilter !== "__all__" && r.county !== countyFilter) return false;
      if (dateFrom && r.recorded_at < dateFrom) return false;
      if (dateTo && r.recorded_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [records, search, builderFilter, countyFilter, dateFrom, dateTo]);

  const summaries = useMemo(() => {
    const map = new Map<string, PriceRecord[]>();
    for (const r of filtered) {
      const key = r.description;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const result: ItemSummary[] = [];
    for (const [desc, recs] of map) {
      const sorted = [...recs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
      const prices = recs.map(r => r.unit_price);
      result.push({
        description: desc,
        records: sorted,
        lastPrice: sorted[0].unit_price,
        lastDate: sorted[0].recorded_at,
        lastBuilder: sorted[0].builder,
        lastLocation: sorted[0].job_location,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        count: recs.length,
      });
    }
    return result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [filtered]);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-muted)] animate-pulse">Loading price history…</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📊</div>
        <div className="text-lg font-semibold text-[var(--text-secondary)]">No pricing data yet</div>
        <div className="text-sm text-[var(--text-muted)]">Save proposals to start building your price history.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs font-mono bg-[var(--bg-main)] border-[var(--card-border)]"
          />
        </div>
        <Select value={builderFilter} onValueChange={setBuilderFilter}>
          <SelectTrigger className="h-9 text-xs font-mono bg-[var(--bg-main)] border-[var(--card-border)]">
            <SelectValue placeholder="All Builders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Builders</SelectItem>
            {uniqueBuilders.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={countyFilter} onValueChange={setCountyFilter}>
          <SelectTrigger className="h-9 text-xs font-mono bg-[var(--bg-main)] border-[var(--card-border)]">
            <SelectValue placeholder="All Counties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Counties</SelectItem>
            {uniqueCounties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-8 h-9 text-xs font-mono bg-[var(--bg-main)] border-[var(--card-border)]" placeholder="From" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-8 h-9 text-xs font-mono bg-[var(--bg-main)] border-[var(--card-border)]" placeholder="To" />
        </div>
      </div>

      <div className="text-xs text-[var(--text-muted)]">{summaries.length} items · {filtered.length} records</div>

      {/* Item cards */}
      <div className="space-y-3">
        {summaries.map(item => {
          const isOpen = expandedItem === item.description;
          return (
            <div key={item.description} className="border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <button
                onClick={() => setExpandedItem(isOpen ? null : item.description)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--section-bg)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--text-main)] truncate">{item.description}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Last: {fmtCurrency(item.lastPrice)} · {new Date(item.lastDate).toLocaleDateString()}
                    {item.lastBuilder && ` · ${item.lastBuilder}`}
                    {item.lastLocation && ` · ${item.lastLocation}`}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs shrink-0 ml-4">
                  <div className="text-center">
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Avg</div>
                    <div className="font-semibold text-[var(--primary-blue)]">{fmtCurrency(item.avgPrice)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Range</div>
                    <div className="font-semibold text-[var(--text-main)]">{fmtCurrency(item.minPrice)} – {fmtCurrency(item.maxPrice)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Billed</div>
                    <div className="font-semibold text-[var(--text-main)]">{item.count}×</div>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--card-border)] overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--card-border)]">
                        <th className="text-left p-2 pl-4">Date</th>
                        <th className="text-left p-2">Builder</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">County</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-left p-2">Unit</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-left p-2">Type</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.records.map(r => (
                        <tr key={r.id} className="border-b border-[var(--card-border)] hover:bg-[var(--section-bg)] transition-colors">
                          <td className="p-2 pl-4 text-[var(--text-secondary)]">{new Date(r.recorded_at).toLocaleDateString()}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{r.builder || "—"}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{r.job_location || "—"}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{r.county || "—"}</td>
                          <td className="p-2 text-right text-[var(--text-main)]">{r.qty ?? "—"}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{r.unit}</td>
                          <td className="p-2 text-right font-semibold text-[var(--primary-blue)]">{fmtCurrency(r.unit_price)}</td>
                          <td className="p-2 capitalize text-[var(--text-secondary)]">{r.pricing_type}</td>
                          <td className="p-2">
                            {r.proposal_id && (
                              <button
                                onClick={e => { e.stopPropagation(); onLoadProposal(r.proposal_id!); }}
                                className="text-[var(--primary-blue)] hover:underline flex items-center gap-1"
                                title="Open proposal"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
