import { useState } from "react";
import { Upload, Download, X, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

type Step = "upload" | "preview" | "done";

type ItemCategory = "wall" | "wall_only" | "slab" | "footing" | "pier" | "column" | "other";

interface ParsedItem {
  description: string;
  category: string;
  section: string;
  defaultUnit: string;
  customData: Record<string, any> | null;
}

interface ValidationWarning {
  row: number;
  message: string;
}

const CATEGORY_UNIT_MAP: Record<ItemCategory, string> = {
  wall: "LF",
  wall_only: "LF",
  slab: "SF",
  footing: "LF",
  pier: "EA",
  column: "EA",
  other: "EA",
};

const CATEGORY_SECTION_MAP: Record<ItemCategory, string> = {
  wall: "ftg_wall",
  wall_only: "ftg_wall",
  slab: "slabs",
  footing: "ftg_wall",
  pier: "ftg_wall",
  column: "ftg_wall",
  other: "ftg_wall",
};

const CATEGORY_DB_MAP: Record<ItemCategory, string> = {
  wall: "walls_with_footings",
  wall_only: "walls_only",
  slab: "slabs",
  footing: "footings",
  pier: "pier_pads",
  column: "columns",
  other: "extras",
};

const VALID_CATEGORIES: ItemCategory[] = ["wall", "wall_only", "slab", "footing", "pier", "column", "other"];

function validateRow(category: ItemCategory, raw: Record<string, string>, fieldMap: Record<string, string>): string | null {
  const get = (key: string) => (raw[fieldMap[key]] || "").trim();

  switch (category) {
    case "wall":
      if (!get("wall_height") || !get("wall_thickness") || !get("footing_width") || !get("footing_depth"))
        return "Wall rows require wall_height, wall_thickness, footing_width, footing_depth";
      return null;
    case "slab":
      if (!get("slab_thickness") || !get("description"))
        return "Slab rows require slab_thickness and description";
      return null;
    case "footing":
      if (!get("footing_width") || !get("footing_depth") || !get("description"))
        return "Footing rows require footing_width, footing_depth, and description";
      return null;
    case "wall_only":
      if (!get("wall_height") || !get("wall_thickness"))
        return "Wall-only rows require wall_height and wall_thickness";
      return null;
    case "pier":
      if (!get("pier_size") || !get("pier_depth"))
        return "Pier rows require pier_size and pier_depth";
      return null;
    case "column":
      if (!get("pier_size") || !get("pier_depth"))
        return "Column rows require pier_size and pier_depth";
      return null;
    case "other":
      if (!get("description"))
        return "Other rows require description";
      return null;
  }
}

function cleanDim(val: string): string {
  return val.replace(/"/g, "").replace(/'/g, "").trim();
}

function buildDescription(category: ItemCategory, raw: Record<string, string>, fieldMap: Record<string, string>): string {
  const get = (key: string) => (raw[fieldMap[key]] || "").trim();
  const tags = get("tags");
  const tagsSuffix = tags ? `, ${tags}` : "";

  switch (category) {
    case "wall": {
      const wh = cleanDim(get("wall_height"));
      const wt = cleanDim(get("wall_thickness"));
      const fw = cleanDim(get("footing_width"));
      const fd = cleanDim(get("footing_depth"));
      let desc = `${wh}' x ${wt}" Wall`;
      if (fw && fd) desc += ` - with ${fw}" x ${fd}" Footings`;
      return desc + tagsSuffix;
    }
    case "slab": {
      const st = cleanDim(get("slab_thickness"));
      const label = get("description").replace(/"/g, "").trim();
      return `${label} - ${st}"${tagsSuffix}`;
    }
    case "footing": {
      const fw = cleanDim(get("footing_width"));
      const fd = cleanDim(get("footing_depth"));
      const label = get("description").replace(/"/g, "").trim();
      return `${label}: ${fw}" x ${fd}"${tagsSuffix}`;
    }
    case "wall_only": {
      const wh = cleanDim(get("wall_height"));
      const wt = cleanDim(get("wall_thickness"));
      return `${wh}' x ${wt}" Wall${tagsSuffix}`;
    }
    case "pier": {
      const ps = cleanDim(get("pier_size"));
      const parts = ps.split(/\s*x\s*/i);
      const pd = cleanDim(get("pier_depth"));
      return `Pier Pad: ${parts[0]}" x ${parts[1] || parts[0]}" x ${pd}"`;
    }
    case "column": {
      const ps = cleanDim(get("pier_size"));
      const parts = ps.split(/\s*x\s*/i);
      const pd = cleanDim(get("pier_depth"));
      return `Column: ${parts[0]}" x ${parts[1] || parts[0]}" x ${pd}"`;
    }
    case "other":
      return get("description").replace(/"/g, "").trim();
  }
}

function buildCustomData(category: ItemCategory, raw: Record<string, string>, fieldMap: Record<string, string>): Record<string, any> | null {
  const get = (key: string) => (raw[fieldMap[key]] || "").trim();
  const tags = get("tags") ? get("tags").split(",").map((t: string) => t.trim()).filter(Boolean) : [];

  const dimensions: Record<string, string> = {};
  let hasDimensions = false;

  if (get("wall_height")) { dimensions.wallHeight = get("wall_height"); hasDimensions = true; }
  if (get("wall_thickness")) { dimensions.wallThickness = get("wall_thickness"); hasDimensions = true; }
  if (get("footing_width")) { dimensions.footingWidth = get("footing_width"); hasDimensions = true; }
  if (get("footing_depth")) { dimensions.footingDepth = get("footing_depth"); hasDimensions = true; }
  if (get("slab_thickness")) { dimensions.slabThickness = get("slab_thickness"); hasDimensions = true; }
  if (get("pier_size")) { dimensions.pierSize = get("pier_size"); hasDimensions = true; }
  if (get("pier_depth")) { dimensions.pierDepth = get("pier_depth"); hasDimensions = true; }

  // For slab/footing/other with a description used as label, store it
  if ((category === "slab" || category === "footing" || category === "other") && get("description")) {
    dimensions.customLabel = get("description");
  }

  if (!hasDimensions && tags.length === 0) return null;

  return {
    category,
    dimensions,
    tags,
    isCustom: true,
  };
}

export function ImportCatalogItems({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>("upload");
  const [newItems, setNewItems] = useState<ParsedItem[]>([]);
  const [dupeCount, setDupeCount] = useState(0);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("upload");
    setNewItems([]);
    setDupeCount(0);
    setWarnings([]);
    setImporting(false);
    setProgress(0);
    setResult(null);
    setError("");
  };

  const downloadTemplate = () => {
    const csv = [
      "category,description,unit,wall_height,wall_thickness,footing_width,footing_depth,slab_thickness,pier_size,pier_depth,tags",
      'wall,,LF,8\',8",8",16",,,,',
      'wall,,LF,8\',8",8",16",,,,Garage',
      'wall_only,,LF,8\',8",,,,,,',
      'slab,Basement Slab,SF,,,,,4",,,',
      'footing,Garage Grade Beam,LF,,,,16",,,,',
      'pier,,EA,,,,,,36" x 36",12",',
      'column,,EA,,,,,,16" x 16",96",',
      'other,Complete Escape Window - Well Window Ladder Grate,EA,,,,,,,',
    ].join("\n");
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
    setWarnings([]);
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '\0',  // disable — inch symbol " conflicts with CSV quoting
      complete: async (results) => {
        const headers = (results.meta.fields || []).map((h) => h.toLowerCase().trim());

        if (!headers.includes("category")) {
          setError('File must have a "category" column');
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
        const rowWarnings: ValidationWarning[] = [];
        let dupes = 0;
        const seen = new Set<string>();

        (results.data as Record<string, string>[]).forEach((raw, rowIdx) => {
          const categoryRaw = (raw[fieldMap["category"]] || "").trim().toLowerCase() as ItemCategory;
          if (!VALID_CATEGORIES.includes(categoryRaw)) {
            if (categoryRaw) rowWarnings.push({ row: rowIdx + 2, message: `Invalid category "${categoryRaw}"` });
            return;
          }

          // Validate required fields per category
          const validationError = validateRow(categoryRaw, raw, fieldMap);
          if (validationError) {
            rowWarnings.push({ row: rowIdx + 2, message: validationError });
            return;
          }

          // Description: use provided or auto-generate
          const providedDesc = (raw[fieldMap["description"]] || "").trim();
          let desc: string;
          if (categoryRaw === "wall" || categoryRaw === "wall_only" || categoryRaw === "pier" || categoryRaw === "column") {
            // For wall/pier, description is always auto-generated from dimensions
            desc = providedDesc || buildDescription(categoryRaw, raw, fieldMap);
          } else {
            desc = buildDescription(categoryRaw, raw, fieldMap);
          }

          if (!desc) {
            rowWarnings.push({ row: rowIdx + 2, message: "Could not generate description" });
            return;
          }

          // Unit: use provided or default from category
          const unitRaw = (raw[fieldMap["unit"]] || "").trim().toUpperCase();
          const unit = unitRaw || CATEGORY_UNIT_MAP[categoryRaw];

          // Always build custom_data from dimensions when present
          const customData = buildCustomData(categoryRaw, raw, fieldMap);

          const key = desc.toLowerCase();
          if (existingSet.has(key) || seen.has(key)) { dupes++; return; }
          seen.add(key);

          items.push({
            description: desc,
            category: CATEGORY_DB_MAP[categoryRaw],
            section: CATEGORY_SECTION_MAP[categoryRaw],
            defaultUnit: unit,
            customData,
          });
        });

        setNewItems(items);
        setDupeCount(dupes);
        setWarnings(rowWarnings);
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
        custom_data: item.customData,
      }));
      const { data, error } = await (supabase.from("catalog_items").insert(batch as any) as any).select("id");
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
              <label
                htmlFor="catalog-csv-upload"
                className="block border-2 border-dashed border-[var(--card-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.name.endsWith(".csv")) handleFile(file);
                }}
              >
                <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                <div className="text-sm text-[var(--text-secondary)] font-semibold">Click or drag & drop a CSV file</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Max 10MB • .csv files only</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-2">
                  <strong>Columns:</strong> category, description, unit, wall_height, wall_thickness, footing_width, footing_depth, slab_thickness, pier_size, pier_depth, tags
                </div>
                <input
                  id="catalog-csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
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
              <div className="flex items-center gap-3 text-[12px] flex-wrap">
                <span className="font-semibold text-[var(--text-main)]">{newItems.length} new items to add</span>
                {dupeCount > 0 && <span className="text-[var(--text-muted)]">{dupeCount} duplicates skipped</span>}
              </div>

              {warnings.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-amber-600">
                    <strong>{warnings.length} row{warnings.length !== 1 ? "s" : ""} skipped:</strong>
                    <ul className="mt-1 space-y-0.5 list-disc pl-4">
                      {warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>Row {w.row}: {w.message}</li>
                      ))}
                      {warnings.length > 5 && <li>...and {warnings.length - 5} more</li>}
                    </ul>
                  </div>
                </div>
              )}

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
                onClick={() => { setStep("upload"); setNewItems([]); setDupeCount(0); setWarnings([]); setError(""); }}
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