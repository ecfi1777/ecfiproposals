import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CatalogItem {
  id: string;
  name: string;
  created_at: string;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ecfi-theme") === "dark";
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("item_catalog")
      .select("*")
      .order("name");
    if (!error && data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    if (items.some((it) => it.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Item already exists");
      return;
    }
    const { error } = await supabase.from("item_catalog").insert({ name });
    if (error) {
      toast.error("Failed to add item");
    } else {
      toast.success("Item added");
      setNewItem("");
      fetchItems();
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editValue.trim();
    if (!name) return;
    if (items.some((it) => it.id !== id && it.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Item name already exists");
      return;
    }
    const { error } = await supabase.from("item_catalog").update({ name }).eq("id", id);
    if (error) {
      toast.error("Failed to update item");
    } else {
      toast.success("Item updated");
      setEditingId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from catalog?`)) return;
    const { error } = await supabase.from("item_catalog").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted");
      fetchItems();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Nav */}
      <header className="bg-ecfi-nav-bg border-b border-ecfi-nav-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[12px] tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Link>
          <div className="bg-ecfi-gold text-black font-extrabold text-base px-3 py-1.5 tracking-widest">ECFI</div>
          <div>
            <div className="text-base font-bold tracking-wider">Item Catalog</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">{items.length} items</div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-[900px] mx-auto">
        {/* Add new item */}
        <div className="flex gap-2 mb-5">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add new catalog item..."
            className="flex-1 px-3 py-2.5 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="flex items-center gap-2 bg-ecfi-std-green/20 text-ecfi-std-green-text border border-ecfi-std-green/40 px-4 py-2.5 font-bold text-[12px] font-mono tracking-wider hover:bg-ecfi-std-green/30 transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            ADD
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-9 pr-8 py-2 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} {search ? "matching" : "total"}
        </div>

        {/* Item list */}
        {loading ? (
          <div className="text-muted-foreground text-sm py-8 text-center">Loading catalog...</div>
        ) : (
          <div className="border border-ecfi-panel-border">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-ecfi-panel-border" : ""} hover:bg-ecfi-panel-bg transition-colors`}
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
                      className="flex-1 px-2 py-1 border border-ecfi-gold bg-ecfi-input-bg text-foreground text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
                    />
                    <button onClick={() => handleUpdate(item.id)} className="text-ecfi-std-green-text hover:opacity-80 p-1">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[13px] font-mono">{item.name}</span>
                    <button
                      onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                      className="text-muted-foreground hover:text-ecfi-gold-text p-1 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-muted-foreground text-sm py-6 text-center">No items found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
