import { useState, useRef, useEffect, useCallback } from "react";
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
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchTerm = (filter || value || "").toLowerCase();
  const filtered = items
    .filter((it) => it.description.toLowerCase().includes(searchTerm))
    .slice(0, 30);

  const isNew = value && value.trim() && !items.some((i) => i.description.toLowerCase() === value.trim().toLowerCase());

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchTerm]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectItem = useCallback((item: CatalogItem) => {
    onChange(item.description);
    onSelectItem?.(item);
    setOpen(false);
    setHighlightIndex(-1);
  }, [onChange, onSelectItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        setHighlightIndex(filtered.length > 0 ? 0 : -1);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectItem(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

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
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Search or type..."}
          className="w-full px-2 py-1.5 border border-[var(--card-border)] bg-[var(--bg-main)] text-foreground text-[13px] font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)]"
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
        <div ref={listRef} className="absolute top-full left-0 right-0 z-[999] bg-ecfi-dropdown-bg border border-ecfi-dropdown-border max-h-[220px] overflow-y-auto shadow-xl">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-2.5 py-[7px] cursor-pointer text-[12px] border-b border-ecfi-panel-border font-mono transition-colors ${
                idx === highlightIndex
                  ? "bg-[var(--primary-blue-soft)] text-[var(--primary-blue)]"
                  : "text-muted-foreground hover:bg-[var(--primary-blue-soft)] hover:text-[var(--primary-blue)]"
              }`}
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
