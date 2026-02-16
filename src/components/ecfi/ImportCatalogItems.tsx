import { useState, useRef } from "react";
import { Upload, Download, X, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

type Step = "upload" | "preview" | "done";

interface ParsedItem {
  description: string;
  category: string;
  section: string;
  defaultUnit: string;
}

export function ImportCatalogItems({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [newItems, setNewItems] = useState<ParsedItem[]>([]);
  const [dupeCount, setDupeCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("upload");
    setNewItems([]);
    setDupeCount(0);
    setImporting(false);
    setProgress(0);
    setResult(null);
    setError("");
  };

  const downloadTemplate = () => {
    const csv = "description,category,section,default_unit\n9' x 8\" Wall,walls_with_footings,ftg_wall,LF\nBasement Slab 4\",slabs,slabs,SF\nPier Pad 36x36x12,extras,ftg_wall,EA\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog_items_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setError("");
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = (results.meta.fields || []).map((h) => h.toLowerCase().trim());
        if (!headers.includes("description")) {
          setError('File must have a "description" column');
          return;
        }

        const fieldMap: Record<string, string> = {};
        (results.meta.fields || []).forEach((f) => {
          fieldMap[f.toLowerCase().trim()] = f;
        });

        // Get existing catalog
        const { data: existing } = await supabase
          .from("catalog_items")
          .select("description")
          .eq("user_id", user.id);
        const existingSet = new Set((existing || []).map((c) => c.description.toLowerCase()));

        const items: ParsedItem[] = [];
        let dupes = 0;
        const seen = new Set<string>();

        (results.data as Record<string, string>[]).forEach((raw) => {
          const desc = (raw[fieldMap["description"]] || "").trim();
          if (!desc) return;
          const key = desc.toLowerCase();
          if (existingSet.has(key) || seen.has(key)) { dupes++; return; }
          seen.add(key);
          items.push({
            description: desc,
            category: (raw[fieldMap["category"]] || "extras").trim() || "extras",
            section: (raw[fieldMap["section"]] || "ftg_wall").trim() || "ftg_wall",
            defaultUnit: (raw[fieldMap["default_unit"]] || "EA").trim().toUpperCase() || "EA",
          });
        });

        setNewItems(items);
        setDupeCount(dupes);
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
    let inserted = 0;
    for (let i = 0; i < newItems.length; i += BATCH) {
      const batch = newItems.slice(i, i + BATCH).map((item) => ({
        user_id: user.id,
        description: item.description,
        category: item.category,
        section: item.section,
        default_unit: item.defaultUnit,
        is_active: true,
        sort_order: 0,
      }));
      const { data, error } = await supabase.from("catalog_items").insert(batch).select("id");
      if (data) inserted += data.length;
      if (error) console.error("Catalog batch error:", error);
      setProgress(Math.min(((i + BATCH) / newItems.length) * 100, 100));
    }

    setResult(inserted);
    setImporting(false);
    setStep("done");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl w-full max-w-[600px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div>
            <div className="text-sm font-bold tracking-wider text-[var(--text-main)]">Import Catalog Items</div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
              {step === "upload" ? "Step 1: Upload CSV" : step === "preview" ? "Step 2: Preview" : "Complete"}
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
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Required column: description. Optional: category, section, default_unit</div>
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
              <div className="flex items-center gap-3 text-[12px]">
                <span className="font-semibold text-[var(--text-main)]">{newItems.length} new items to add</span>
                {dupeCount > 0 && <span className="text-[var(--text-muted)]">{dupeCount} duplicates skipped</span>}
              </div>

              <div className="border border-[var(--card-border)] rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-[11px] font-mono">
                    <thead className="bg-[var(--section-bg)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold tracking-wider">Description</th>
                        <th className="px-3 py-2 text-center text-[var(--text-muted)] font-semibold tracking-wider">Unit</th>
                        <th className="px-3 py-2 text-center text-[var(--text-muted)] font-semibold tracking-wider">Section</th>
                        <th className="px-3 py-2 text-center text-[var(--text-muted)] font-semibold tracking-wider">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newItems.slice(0, 50).map((item, i) => (
                        <tr key={i} className="border-t border-[var(--card-border)]">
                          <td className="px-3 py-1.5 text-[var(--text-main)]">{item.description}</td>
                          <td className="px-3 py-1.5 text-center text-[var(--text-muted)]">{item.defaultUnit}</td>
                          <td className="px-3 py-1.5 text-center text-[var(--text-muted)]">{item.section}</td>
                          <td className="px-3 py-1.5 text-center text-[var(--text-muted)]">{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {newItems.length > 50 && (
                  <div className="text-[10px] text-[var(--text-muted)] text-center py-2 border-t border-[var(--card-border)]">
                    Showing first 50 of {newItems.length} items
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "done" && result !== null && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto" />
              <div className="text-sm font-bold text-[var(--text-main)]">{result} catalog items imported</div>
            </div>
          )}

          {importing && (
            <div className="mt-4">
              <div className="text-[10px] text-[var(--text-muted)] mb-1 tracking-wider">IMPORTING...</div>
              <div className="w-full bg-[var(--section-bg)] rounded-full h-2">
                <div className="bg-[var(--primary-blue)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-[var(--card-border)]">
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setNewItems([]); setDupeCount(0); setError(""); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-bold tracking-wider"
              >
                ← BACK
              </button>
              <button
                onClick={handleImport}
                disabled={importing || newItems.length === 0}
                className="bg-[var(--primary-blue)] text-white px-5 py-2 text-[11px] font-bold tracking-wider rounded-lg hover:bg-[var(--primary-blue-hover)] disabled:opacity-40 transition-colors"
              >
                IMPORT {newItems.length} ITEMS
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
