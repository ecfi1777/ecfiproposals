import { useState, useRef, useEffect } from "react";
import type { CatalogItem } from "@/hooks/useCatalog";

interface ComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem?: (item: CatalogItem) => void;
  items: CatalogItem[];
  onSaveNew?: (description: string) => void;
  placeholder?: string;
}

export function ComboBox({ value, onChange, onSelectItem, items, onSaveNew, placeholder }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const searchTerm = (filter || value || "").toLowerCase();
  const filtered = items
    .filter((it) => it.description.toLowerCase().includes(searchTerm))
    .slice(0, 30);

  const isNew = value && value.trim() && !items.some((i) => i.description.toLowerCase() === value.trim().toLowerCase());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <div className="flex gap-1 items-center">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilter(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setFilter("");
          }}
          placeholder={placeholder || "Search or type..."}
          className="w-full px-2 py-1.5 border border-ecfi-input-border bg-ecfi-input-bg text-foreground text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-ecfi-gold"
        />
        {isNew && onSaveNew && (
          <button
            onClick={() => onSaveNew(value.trim())}
            title="Save to catalog"
            className="bg-ecfi-std-green/20 text-ecfi-std-green-text border border-ecfi-std-green/40 px-2 py-1 cursor-pointer text-[11px] whitespace-nowrap font-semibold hover:bg-ecfi-std-green/30 transition-colors"
          >
            + Save
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[999] bg-ecfi-dropdown-bg border border-ecfi-dropdown-border max-h-[220px] overflow-y-auto shadow-xl">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onChange(item.description);
                onSelectItem?.(item);
                setOpen(false);
              }}
              className="px-2.5 py-[7px] cursor-pointer text-[12px] text-muted-foreground border-b border-ecfi-panel-border font-mono hover:bg-ecfi-dropdown-hover hover:text-ecfi-gold-text transition-colors"
            >
              {item.description}
              <span className="ml-2 text-[10px] text-ecfi-subtle">{item.default_unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
