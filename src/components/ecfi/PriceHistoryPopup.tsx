import { useState, useEffect } from "react";
import { Clock, X, TrendingUp, TrendingDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PriceHistoryRow {
  recorded_at: string;
  builder: string | null;
  job_location: string | null;
  std_price: number | null;
  opt_price: number | null;
}

interface PriceHistoryPopupProps {
  description: string;
  catalogItemId?: string | null;
  popoverKey: string;
  openKey: string | null;
  onOpenChange: (key: string | null) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, '${String(d.getFullYear()).slice(2)}`;
}

function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return `$${Number(val).toFixed(2)}`;
}

export function PriceHistoryPopup({ description, catalogItemId, popoverKey, openKey, onOpenChange }: PriceHistoryPopupProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<PriceHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasHistory, setHasHistory] = useState<boolean | null>(null);

  const isOpen = openKey === popoverKey;

  // Check if history exists on mount / description change
  useEffect(() => {
    if (!user || !description) { setHasHistory(false); return; }

    const checkHistory = async () => {
      let query = supabase
        .from("price_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (catalogItemId) {
        query = query.eq("catalog_item_id", catalogItemId);
      } else {
        query = query.eq("description", description);
      }

      const { count } = await query;
      setHasHistory((count ?? 0) > 0);
    };
    checkHistory();
  }, [user, description, catalogItemId]);

  // Fetch full data when opened
  useEffect(() => {
    if (!isOpen || !user || !description) return;

    const fetchData = async () => {
      setLoading(true);
      // Build a raw RPC-style grouped query using the supabase client
      // We'll fetch raw rows and group client-side for simplicity
      let query = supabase
        .from("price_history")
        .select("recorded_at, builder, job_location, unit_price, pricing_type")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (catalogItemId) {
        query = query.eq("catalog_item_id", catalogItemId);
      } else {
        query = query.eq("description", description);
      }

      const { data, error } = await query;
      if (error) { console.error(error); setLoading(false); return; }

      // Group by recorded_at + builder + job_location
      const grouped = new Map<string, PriceHistoryRow>();
      for (const r of data || []) {
        const key = `${r.recorded_at}|${r.builder || ""}|${r.job_location || ""}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            recorded_at: r.recorded_at,
            builder: r.builder,
            job_location: r.job_location,
            std_price: null,
            opt_price: null,
          });
        }
        const row = grouped.get(key)!;
        if (r.pricing_type === "standard") row.std_price = r.unit_price;
        if (r.pricing_type === "optional") row.opt_price = r.unit_price;
      }

      const sorted = Array.from(grouped.values())
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
        .slice(0, 10);

      setRows(sorted);
      setLoading(false);
    };
    fetchData();
  }, [isOpen, user, description, catalogItemId]);

  // Trend calculation
  const trend = (() => {
    if (rows.length < 2) return null;
    const newest = rows[0].std_price ?? rows[0].opt_price;
    const oldest = rows[rows.length - 1].std_price ?? rows[rows.length - 1].opt_price;
    if (newest === null || oldest === null || oldest === 0) return null;
    const pct = ((newest - oldest) / oldest) * 100;
    return pct;
  })();

  const disabled = hasHistory === false || !description;

  return (
    <Popover open={isOpen} onOpenChange={(open) => onOpenChange(open ? popoverKey : null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`p-1 transition-colors rounded ${
            isOpen
              ? "text-[#1A56DB] bg-[#EFF6FF]"
              : disabled
              ? "text-[#9CA3AF] opacity-50 cursor-default"
              : "text-[#9CA3AF] hover:text-[#1A56DB] hover:bg-[#EFF6FF]"
          }`}
          title={disabled ? "No price history" : "View price history"}
        >
          <Clock size={14} strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border-0 rounded-xl shadow-xl overflow-hidden"
        style={{ width: 520 }}
        align="start"
        sideOffset={6}
      >
        {/* Header */}
        <div className="bg-[#1A1D23] text-white px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Price History</span>
              {trend !== null && (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    trend >= 0
                      ? "text-[#86EFAC] bg-[rgba(34,197,94,0.15)]"
                      : "text-[#FCA5A5] bg-[rgba(239,68,68,0.15)]"
                  }`}
                >
                  {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(null)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-[12px] text-white/80 truncate">{description}</div>
        </div>

        {/* Table */}
        <div className="max-h-[240px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[13px] text-[#9CA3AF]">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#9CA3AF]">No price history found for this item.</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                  <th className="text-left px-3 py-2 text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">Date</th>
                  <th className="text-left px-3 py-2 text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">Builder</th>
                  <th className="text-left px-3 py-2 text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">Location</th>
                  <th className="text-right px-3 py-2 text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">Std $/U</th>
                  <th className="text-right px-3 py-2 text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">Opt $/U</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-[#F3F4F6] ${
                      i === 0
                        ? "bg-[#F0F7FF]"
                        : "bg-white hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={i === 0 ? "font-bold text-[#1A56DB]" : "text-[#374151]"}>
                        {formatDate(row.recorded_at)}
                      </span>
                      {i === 0 && (
                        <span className="ml-1.5 text-[8px] font-bold uppercase bg-[#1A56DB] text-white px-1 py-0.5 rounded">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#374151] truncate max-w-[120px]">{row.builder || "—"}</td>
                    <td className="px-3 py-2 text-[#374151] truncate max-w-[120px]">{row.job_location || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-[#374151]">{formatPrice(row.std_price)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-[#374151]">{formatPrice(row.opt_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {rows.length > 0 && (
          <div className="bg-[#F8F9FA] border-t border-[#E5E7EB] px-4 py-2 text-[11px] text-[#6B7280]">
            {rows.length} record{rows.length !== 1 ? "s" : ""} · Showing last {rows.length} use{rows.length !== 1 ? "s" : ""}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
