import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings as SettingsIcon, Plus, Pencil, Trash2, Search, X, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CatalogItemWithTimestamp } from "@/types/catalog";

const TABS = [
  { key: "catalog", label: "Item Catalog" },
  { key: "formulas", label: "Formulas" },
  { key: "pricing", label: "Default Pricing" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FORMULAS = [
  {
    name: "Wall Volume",
    formula: "(Height_ft × (Thickness_in ÷ 12) × Length_LF) ÷ 27",
    explanation: "Converts wall dimensions to cubic yards. Height in feet, thickness in inches converted to feet by dividing by 12, length in linear feet. Divide by 27 to convert cubic feet to cubic yards.",
    example: {
      label: "1 LF of 8' × 8\" wall",
      steps: "8 × 0.667 × 1 = 5.333 CF ÷ 27",
      result: "0.198 CY/LF",
    },
  },
  {
    name: "Footing Volume",
    formula: "((Depth_in ÷ 12) × (Width_in ÷ 12) × Length_LF) ÷ 27",
    explanation: "Both footing dimensions are in inches, converted to feet. Length in linear feet. Divide by 27 to convert cubic feet to cubic yards.",
    example: {
      label: "1 LF of 8\" × 16\" footing",
      steps: "0.667 × 1.333 × 1 = 0.889 CF ÷ 27",
      result: "0.033 CY/LF",
    },
  },
  {
    name: "Combined Wall + Footing Volume",
    formula: "(Wall CY/LF + Footing CY/LF) × Total LF",
    explanation: "For wall-with-footing items, both volumes are calculated separately then summed per linear foot, then multiplied by quantity.",
    example: {
      label: "150 LF of 8' × 8\" wall with 8\" × 16\" footing",
      steps: "(0.198 + 0.033) × 150",
      result: "34.57 CY",
    },
  },
  {
    name: "Slab Volume",
    formula: "(Area_SF × (Thickness_in ÷ 12)) ÷ 27",
    explanation: "Area in square feet, thickness in inches converted to feet. Divide by 27 to convert cubic feet to cubic yards.",
    example: {
      label: "860 SF basement slab at 4\" thick",
      steps: "860 × 0.333 = 286.67 CF ÷ 27",
      result: "10.62 CY",
    },
  },
  {
    name: "Pier Pad Volume",
    formula: "((L_in ÷ 12) × (W_in ÷ 12) × (D_in ÷ 12)) ÷ 27",
    explanation: "All three dimensions in inches, each converted to feet. Multiply by quantity of pads.",
    example: {
      label: "5 pier pads at 36\" × 36\" × 12\"",
      steps: "3 × 3 × 1 = 9 CF per pad ÷ 27 = 0.333 CY × 5",
      result: "1.67 CY",
    },
  },
  {
    name: "Grade Beam Volume",
    formula: "((Width_in ÷ 12) × (Depth_in ÷ 12) × Length_LF) ÷ 27",
    explanation: "Width and depth in inches, length in linear feet. Divide by 27 to convert cubic feet to cubic yards.",
    example: {
      label: "40 LF of 16\" × 16\" grade beam",
      steps: "1.333 × 1.333 × 40 = 71.11 CF ÷ 27",
      result: "2.63 CY",
    },
  },
];

function FormulasTab() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      <div>
        <h2 className="text-base font-bold tracking-wider text-[var(--text-main)]">Concrete Volume Calculations</h2>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">Formulas used to estimate cubic yards from item dimensions.</p>
      </div>

      <div className="space-y-3">
        {FORMULAS.map((f, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={i}
              className="border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--section-bg)] transition-colors"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[13px] font-semibold text-[var(--text-main)]">{f.name}</span>
                  <code className="text-[11px] font-mono bg-ecfi-vol-tint text-ecfi-vol-blue-text px-2.5 py-1 rounded-md border border-ecfi-vol-blue/20">
                    {f.formula}
                  </code>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] transition-transform flex-shrink-0 ml-3 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-[var(--card-border)]">
                  <div className="mt-4 space-y-4">
                    {/* Explanation */}
                    <div>
                      <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest mb-1">Explanation</div>
                      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{f.explanation}</p>
                    </div>

                    {/* Worked example */}
                    <div className="p-4 bg-[var(--section-bg)] border border-[var(--card-border)] rounded-lg">
                      <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest mb-2">Worked Example</div>
                      <div className="text-[12px] text-[var(--text-main)] font-semibold mb-1.5">{f.example.label}</div>
                      <div className="font-mono text-[12px] text-[var(--text-secondary)] mb-2">{f.example.steps}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">Result</span>
                        <span className="font-mono text-[13px] font-bold text-ecfi-vol-blue-text">{f.example.result}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DefaultPricingPlaceholder() {
  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="text-[var(--text-secondary)] text-sm font-semibold mb-1">Default Pricing</div>
        <div className="text-[var(--text-muted)] text-xs">Coming soon — default unit prices for catalog items.</div>
      </div>
    </div>
  );
}

function CatalogTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItemWithTimestamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, description, category, section, default_unit, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order")
      .order("description");
    if (!error && data) setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user, fetchItems]);

  const filtered = items.filter((it) =>
    it.description.toLowerCase().includes(search.toLowerCase()) ||
    it.category.toLowerCase().includes(search.toLowerCase()) ||
    it.section.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!user) return;
    const description = newItem.trim();
    if (!description) return;
    if (items.some((it) => it.description.toLowerCase() === description.toLowerCase())) {
      toast.error("Item already exists");
      return;
    }
    const { error } = await supabase.from("catalog_items").insert({
      user_id: user.id,
      description,
      category: "custom",
      section: "ftg_wall",
      default_unit: "EA",
    });
    if (error) {
      toast.error("Failed to add item");
    } else {
      toast.success("Item added");
      setNewItem("");
      fetchItems();
    }
  };

  const handleUpdate = async (id: string) => {
    const description = editValue.trim();
    if (!description) return;
    if (items.some((it) => it.id !== id && it.description.toLowerCase() === description.toLowerCase())) {
      toast.error("Item name already exists");
      return;
    }
    const { error } = await supabase.from("catalog_items").update({ description }).eq("id", id);
    if (error) {
      toast.error("Failed to update item");
    } else {
      toast.success("Item updated");
      setEditingId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (!window.confirm(`Delete "${description}" from catalog?`)) return;
    const { error } = await supabase.from("catalog_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted");
      fetchItems();
    }
  };

  const sectionLabel = (s: string) => {
    if (s === "ftg_wall") return "Ftg/Wall";
    if (s === "slabs") return "Slabs";
    return s;
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add new catalog item..."
          className="flex-1 px-3 py-2.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono rounded-lg focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)]"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="flex items-center gap-2 bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] border border-[var(--primary-blue)]/40 px-4 py-2.5 font-bold text-[12px] font-mono tracking-wider hover:bg-[var(--primary-blue)]/10 transition-colors disabled:opacity-40 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          ADD
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by description, category, or section..."
          className="w-full pl-9 pr-8 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono rounded-lg focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)]"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""} {search ? "matching" : "total"}
      </div>

      {loading ? (
        <div className="text-[var(--text-muted)] text-sm py-8 text-center">Loading catalog...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl">
          <div className="text-[var(--text-secondary)] text-sm mb-2">Your catalog is empty</div>
          <div className="text-[11px] text-[var(--text-muted)]">Add items above or use "+ Save" in the proposal builder to build your catalog as you work.</div>
        </div>
      ) : (
        <div className="border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Column headers */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--section-bg)] border-b border-[var(--card-border)]">
            <span className="flex-1 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Description</span>
            <span className="w-[60px] text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-center">Unit</span>
            <span className="w-[70px] text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-center">Section</span>
            <span className="w-[70px] text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-center">Category</span>
            <span className="w-[56px]" />
          </div>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-[var(--card-border)]" : ""} hover:bg-[var(--section-bg)] transition-colors`}
            >
              {editingId === item.id ? (
                <>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-[var(--primary-blue)] bg-[var(--bg-main)] text-[var(--text-main)] text-[13px] font-mono rounded-lg focus:outline-none focus:ring-[3px] focus:ring-[var(--primary-blue-soft)]"
                  />
                  <button onClick={() => handleUpdate(item.id)} className="text-[var(--primary-blue)] hover:opacity-80 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[13px] font-mono text-[var(--text-main)]">{item.description}</span>
                  <span className="w-[60px] text-[10px] text-[var(--text-muted)] text-center">{item.default_unit}</span>
                  <span className="w-[70px] text-[10px] text-[var(--text-secondary)] text-center">{sectionLabel(item.section)}</span>
                  <span className="w-[70px] text-[10px] text-[var(--text-muted)] text-center capitalize">{item.category}</span>
                  <div className="w-[56px] flex justify-end gap-0.5">
                    <button
                      onClick={() => { setEditingId(item.id); setEditValue(item.description); }}
                      className="text-[var(--text-muted)] hover:text-[var(--primary-blue)] p-1 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.description)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-[var(--text-muted)] text-sm py-6 text-center">No items found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("catalog");

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] font-mono">
      <header className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors text-[12px] tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Link>
          <div className="bg-black text-white font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
          <div>
            <div className="text-base font-bold tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[var(--text-secondary)]" />
              Settings
            </div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
              Application configuration
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-[12px] font-bold tracking-wider transition-colors border-b-2 ${
              activeTab === tab.key
                ? "text-[var(--primary-blue)] border-[var(--primary-blue)]"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--primary-blue)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "catalog" && <CatalogTab />}
      {activeTab === "formulas" && <FormulasTab />}
      {activeTab === "pricing" && <DefaultPricingPlaceholder />}
    </div>
  );
}
