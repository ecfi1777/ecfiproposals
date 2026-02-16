import { useState, useRef } from "react";
import { Upload, Download, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

const REQUIRED_HEADERS = [
  "builder name",
  "builder abbreviation",
  "builder location",
  "item description",
  "unit",
  "item price",
  "date",
];

const UNIT_MAP: Record<string, string> = {
  lf: "LF", sf: "SF", ea: "EA", yd: "YD", hrs: "HR", hr: "HR",
  cy: "CY", sy: "SY", ls: "LS", each: "EA",
};

function normalizeUnit(u: string): string {
  const key = u.trim().toLowerCase();
  return UNIT_MAP[key] || u.trim().toUpperCase();
}

function parsePrice(raw: string): number | null {
  if (!raw || raw === "—" || raw.toUpperCase() === "N/A") return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  // Handle range like "81.50 - 84.75" — take higher
  if (cleaned.includes("-") && !cleaned.startsWith("-")) {
    const parts = cleaned.split("-").map((p) => parseFloat(p.trim()));
    const valid = parts.filter((n) => !isNaN(n));
    if (valid.length === 0) return null;
    return Math.max(...valid);
  }
  const num = parseFloat(cleaned);
  if (isNaN(num) || num === 0) return null;
  return num;
}

function parseDate(raw: string): string {
  if (!raw || !raw.trim()) return new Date().toISOString();
  const trimmed = raw.trim();
  // Try native parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try M/D/YY
  const parts = trimmed.split(/[/\-\.]/);
  if (parts.length === 3) {
    let [m, day, y] = parts.map(Number);
    if (y < 100) y += 2000;
    const date = new Date(y, m - 1, day);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

type Step = "upload" | "preview" | "done";

interface ParsedRow {
  builder: string;
  builderAbbr: string;
  jobLocation: string;
  description: string;
  unit: string;
  unitPrice: number;
  date: string;
}

interface SkippedRow {
  row: number;
  reason: string;
  raw: Record<string, string>;
}

export function ImportPriceHistory({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [skipped, setSkipped] = useState<SkippedRow[]>([]);
  const [showSkipped, setShowSkipped] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ prices: number; catalog: number } | null>(null);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [catalogBatchIds, setCatalogBatchIds] = useState<string[]>([]);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("upload");
    setParsed([]);
    setSkipped([]);
    setShowSkipped(false);
    setImporting(false);
    setProgress(0);
    setResult(null);
    setBatchIds([]);
    setCatalogBatchIds([]);
    setUndoAvailable(false);
    setError("");
  };

  const downloadTemplate = () => {
    const csv = "Builder Name,Builder Abbreviation,Builder Location,Item Description,Unit,Item Price,Date\nQuality Built Homes,QBH,123 Main St,9' x 8\" Wall,LF,79.80,10/16/2025\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "price_history_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = (results.meta.fields || []).map((h) => h.toLowerCase().trim());
        const missing = REQUIRED_HEADERS.filter((rh) => !headers.includes(rh));
        if (missing.length > 0) {
          setError(`File format doesn't match. Required columns: Builder Name, Builder Abbreviation, Builder Location, Item Description, Unit, Item Price, Date`);
          return;
        }
        const rows: ParsedRow[] = [];
        const skip: SkippedRow[] = [];
        const fieldMap: Record<string, string> = {};
        (results.meta.fields || []).forEach((f) => {
          fieldMap[f.toLowerCase().trim()] = f;
        });

        (results.data as Record<string, string>[]).forEach((raw, i) => {
          const desc = (raw[fieldMap["item description"]] || "").trim();
          if (!desc) { skip.push({ row: i + 2, reason: "Empty description", raw }); return; }
          const priceRaw = (raw[fieldMap["item price"]] || "").trim();
          const price = parsePrice(priceRaw);
          if (price === null) { skip.push({ row: i + 2, reason: `Invalid price: "${priceRaw}"`, raw }); return; }
          rows.push({
            builder: (raw[fieldMap["builder name"]] || "").trim(),
            builderAbbr: (raw[fieldMap["builder abbreviation"]] || "").trim(),
            jobLocation: (raw[fieldMap["builder location"]] || "").trim(),
            description: desc,
            unit: normalizeUnit(raw[fieldMap["unit"]] || "EA"),
            unitPrice: price,
            date: parseDate(raw[fieldMap["date"]] || ""),
          });
        });
        setParsed(rows);
        setSkipped(skip);
        setStep("preview");
      },
      error: () => setError("Failed to parse CSV file"),
    });
  };

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    setProgress(0);

    const BATCH = 100;
    const insertedIds: string[] = [];
    const newCatalogIds: string[] = [];

    // Get existing catalog for dedup
    const { data: existingCatalog } = await supabase
      .from("catalog_items")
      .select("description")
      .eq("user_id", user.id);
    const existingDescs = new Set((existingCatalog || []).map((c) => c.description.toLowerCase()));

    // Collect unique descriptions for auto-add
    const uniqueDescs = new Map<string, { desc: string; unit: string }>();
    parsed.forEach((r) => {
      const key = r.description.toLowerCase();
      if (!existingDescs.has(key) && !uniqueDescs.has(key)) {
        uniqueDescs.set(key, { desc: r.description, unit: r.unit });
      }
    });

    // Insert price history in batches
    for (let i = 0; i < parsed.length; i += BATCH) {
      const batch = parsed.slice(i, i + BATCH).map((r) => ({
        user_id: user.id,
        builder: r.builder,
        job_location: r.jobLocation,
        description: r.description,
        unit_price: r.unitPrice,
        unit: r.unit,
        recorded_at: r.date,
        qty: null,
        county: "",
        pricing_type: "standard" as const,
        catalog_item_id: null,
        proposal_id: null,
      }));
      const { data, error } = await supabase
        .from("price_history")
        .insert(batch)
        .select("id");
      if (data) insertedIds.push(...data.map((d) => d.id));
      if (error) console.error("Batch insert error:", error);
      setProgress(Math.min(((i + BATCH) / parsed.length) * 100, 100));
    }

    // Auto-add catalog items
    if (uniqueDescs.size > 0) {
      const catalogRows = Array.from(uniqueDescs.values()).map((item) => ({
        user_id: user.id,
        description: item.desc,
        category: "extras",
        section: "ftg_wall",
        default_unit: item.unit,
        is_active: true,
        sort_order: 0,
      }));
      for (let i = 0; i < catalogRows.length; i += BATCH) {
        const batch = catalogRows.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from("catalog_items")
          .insert(batch)
          .select("id");
        if (data) newCatalogIds.push(...data.map((d) => d.id));
        if (error) console.error("Catalog insert error:", error);
      }
    }

    setBatchIds(insertedIds);
    setCatalogBatchIds(newCatalogIds);
    setResult({ prices: insertedIds.length, catalog: newCatalogIds.length });
    setImporting(false);
    setStep("done");
    setUndoAvailable(true);
    setTimeout(() => setUndoAvailable(false), 30000);
  };

  const handleUndo = async () => {
    if (batchIds.length > 0) {
      for (let i = 0; i < batchIds.length; i += 100) {
        await supabase.from("price_history").delete().in("id", batchIds.slice(i, i + 100));
      }
    }
    if (catalogBatchIds.length > 0) {
      for (let i = 0; i < catalogBatchIds.length; i += 100) {
        await supabase.from("catalog_items").delete().in("id", catalogBatchIds.slice(i, i + 100));
      }
    }
    toast.success("Import undone — all records removed");
    reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl w-full max-w-[700px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div>
            <div className="text-sm font-bold tracking-wider text-[var(--text-main)]">Import Price History</div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
              {step === "upload" ? "Step 1: Upload CSV" : step === "preview" ? "Step 2: Preview & Validate" : "Complete"}
            </div>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-[var(--card-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                <div className="text-sm text-[var(--text-secondary)] font-semibold">Click to upload a CSV file</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Max 10MB • .csv files only</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
              <button onClick={downloadTemplate} className="flex items-center gap-2 text-[var(--primary-blue)] text-[11px] font-bold tracking-wider hover:underline">
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD TEMPLATE
              </button>
              {error && (
                <div className="flex items-start gap-2 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-[var(--danger)] mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-[var(--danger)]">{error}</div>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-[12px] font-semibold text-[var(--text-main)]">
                  {parsed.length} rows ready to import
                </div>
                {skipped.length > 0 && (
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {skipped.length} rows skipped
                  </div>
                )}
              </div>

              {/* Preview table */}
              <div className="border border-[var(--card-border)] rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead className="bg-[var(--section-bg)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold tracking-wider">Builder</th>
                        <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold tracking-wider">Location</th>
                        <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold tracking-wider">Description</th>
                        <th className="px-3 py-2 text-center text-[var(--text-muted)] font-semibold tracking-wider">Unit</th>
                        <th className="px-3 py-2 text-right text-[var(--text-muted)] font-semibold tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 20).map((r, i) => (
                        <tr key={i} className="border-t border-[var(--card-border)]">
                          <td className="px-3 py-1.5 text-[var(--text-secondary)]">{r.builder}</td>
                          <td className="px-3 py-1.5 text-[var(--text-secondary)]">{r.jobLocation}</td>
                          <td className="px-3 py-1.5 text-[var(--text-main)]">{r.description}</td>
                          <td className="px-3 py-1.5 text-center text-[var(--text-muted)]">{r.unit}</td>
                          <td className="px-3 py-1.5 text-right text-[var(--text-main)]">${r.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.length > 20 && (
                  <div className="text-[10px] text-[var(--text-muted)] text-center py-2 border-t border-[var(--card-border)]">
                    Showing first 20 of {parsed.length} rows
                  </div>
                )}
              </div>

              {/* Skipped rows */}
              {skipped.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowSkipped(!showSkipped)}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-semibold tracking-wider"
                  >
                    {showSkipped ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {skipped.length} SKIPPED ROWS
                  </button>
                  {showSkipped && (
                    <div className="mt-2 border border-[var(--card-border)] rounded-lg overflow-hidden max-h-[150px] overflow-y-auto">
                      <table className="w-full text-[10px] font-mono">
                        <thead className="bg-[var(--section-bg)] sticky top-0">
                          <tr>
                            <th className="px-3 py-1.5 text-left text-[var(--text-muted)]">Row</th>
                            <th className="px-3 py-1.5 text-left text-[var(--text-muted)]">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skipped.map((s, i) => (
                            <tr key={i} className="border-t border-[var(--card-border)]">
                              <td className="px-3 py-1 text-[var(--text-muted)]">{s.row}</td>
                              <td className="px-3 py-1 text-[var(--danger)]">{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "done" && result && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto" />
              <div>
                <div className="text-sm font-bold text-[var(--text-main)]">{result.prices} price records imported</div>
                {result.catalog > 0 && (
                  <div className="text-[12px] text-[var(--text-secondary)] mt-1">{result.catalog} new items added to your catalog</div>
                )}
              </div>
              {undoAvailable && (
                <button
                  onClick={handleUndo}
                  className="text-[var(--danger)] text-[11px] font-bold tracking-wider border border-[var(--danger)]/30 px-4 py-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                >
                  UNDO IMPORT
                </button>
              )}
            </div>
          )}

          {importing && (
            <div className="mt-4">
              <div className="text-[10px] text-[var(--text-muted)] mb-1 tracking-wider">IMPORTING...</div>
              <div className="w-full bg-[var(--section-bg)] rounded-full h-2">
                <div
                  className="bg-[var(--primary-blue)] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-[var(--card-border)]">
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setParsed([]); setSkipped([]); setError(""); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-bold tracking-wider"
              >
                ← BACK
              </button>
              <button
                onClick={handleImport}
                disabled={importing || parsed.length === 0}
                className="bg-[var(--primary-blue)] text-white px-5 py-2 text-[11px] font-bold tracking-wider rounded-lg hover:bg-[var(--primary-blue-hover)] disabled:opacity-40 transition-colors"
              >
                IMPORT {parsed.length} RECORDS
              </button>
            </>
          )}
          {step === "done" && (
            <div className="w-full flex justify-end">
              <button
                onClick={() => { reset(); onClose(); }}
                className="bg-[var(--primary-blue)] text-white px-5 py-2 text-[11px] font-bold tracking-wider rounded-lg hover:bg-[var(--primary-blue-hover)] transition-colors"
              >
                DONE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
