import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { CatalogItemWithTimestamp } from "@/types/catalog";

export default function CatalogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItemWithTimestamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchItems = async () => {
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
  };

  useEffect(() => { if (user) fetchItems(); }, [user]);

  const filtered = items.filter((it) =>
    it.description.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] font-mono">
      <header className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors text-[12px] tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Link>
          <div className="bg-black text-white font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
          <div>
            <div className="text-base font-bold tracking-wider text-[var(--text-main)]">Item Catalog</div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">{items.length} items</div>
          </div>
        </div>
      </header>

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
            placeholder="Search catalog..."
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
                    <span className="text-[10px] text-[var(--text-muted)] mr-2">{item.default_unit}</span>
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
    </div>
  );
}
