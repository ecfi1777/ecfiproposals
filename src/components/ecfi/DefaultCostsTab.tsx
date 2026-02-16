import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RotateCcw, Check } from "lucide-react";

// ── Config-driven field definitions ──────────────────────────────────
// To add a new cost field: add an entry here + add the key to DefaultCosts type.

interface FieldDef {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
}

interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Material Costs",
    fields: [
      { key: "concrete_per_yard", label: "Concrete", unit: "$/Yard", placeholder: "e.g. 350" },
      { key: "extra_concrete_per_yard", label: "Extra Concrete", unit: "$/Yard", placeholder: "e.g. 350" },
      { key: "winter_hot_water_per_yard", label: "Winter Concrete - Hot Water", unit: "$/Yard", placeholder: "e.g. 4.25" },
      { key: "winter_high_early_per_yard", label: "Winter Concrete - 1% High Early", unit: "$/Yard", placeholder: "e.g. 5.75" },
    ],
  },
  {
    title: "Labor Costs",
    fields: [
      { key: "labor_per_yard", label: "Labor Rate", unit: "$/Yard", placeholder: "e.g. 60" },
      { key: "extra_labor_per_hour", label: "Extra Labor Rate", unit: "$/Hour", placeholder: "e.g. 185" },
    ],
  },
  {
    title: "Equipment Costs",
    fields: [
      { key: "concrete_pump_each", label: "Concrete Pump", unit: "$/Each", placeholder: "e.g. 850" },
    ],
  },
];

export type DefaultCosts = Record<string, number | null>;

const emptyDefaults = (): DefaultCosts => {
  const obj: DefaultCosts = {};
  for (const g of FIELD_GROUPS) {
    for (const f of g.fields) {
      obj[f.key] = null;
    }
  }
  return obj;
};

export function DefaultCostsTab() {
  const { user } = useAuth();
  const [values, setValues] = useState<DefaultCosts>(emptyDefaults());
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_settings")
        .select("setting_value")
        .eq("user_id", user.id)
        .eq("setting_key", "default_costs")
        .maybeSingle();
      if (data?.setting_value && typeof data.setting_value === "object") {
        setValues((prev) => ({ ...prev, ...(data.setting_value as Record<string, number | null>) }));
      }
      setLoading(false);
    })();
  }, [user]);

  const persist = useCallback(
    async (updated: DefaultCosts) => {
      if (!user) return;
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, setting_key: "default_costs", setting_value: updated as any },
          { onConflict: "user_id,setting_key" }
        );
      if (error) {
        toast.error("Failed to save default costs");
      }
    },
    [user]
  );

  const handleChange = (key: string, raw: string) => {
    const numVal = raw === "" ? null : parseFloat(raw);
    if (raw !== "" && isNaN(numVal as number)) return;

    setValues((prev) => {
      const next = { ...prev, [key]: numVal };
      // Debounce save per field
      if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
      debounceRef.current[key] = setTimeout(() => {
        persist(next);
        setSavedKey(key);
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
      }, 600);
      return next;
    });
  };

  const handleBlur = (key: string) => {
    // Immediate save on blur
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    persist(values);
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all default costs to empty? This won't affect existing proposals.")) return;
    const empty = emptyDefaults();
    setValues(empty);
    await persist(empty);
    toast.success("Default costs reset");
  };

  if (loading) {
    return <div className="p-6 text-center text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      <div>
        <h2 className="text-base font-bold tracking-wider text-[var(--text-main)]">Default Costs</h2>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          Set your current rates. These will auto-fill on new proposals.
        </p>
      </div>

      <div className="border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {FIELD_GROUPS.map((group, gi) => (
          <div key={group.title}>
            {gi > 0 && <div className="h-px bg-[var(--card-border)]" />}
            <div className="px-5 pt-4 pb-1">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
                {group.title}
              </div>
            </div>
            <div className="px-5 pb-4 space-y-3">
              {group.fields.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className="text-[13px] text-[var(--text-secondary)] font-mono w-[260px] flex-shrink-0">
                    {field.label}
                  </label>
                  <div className="relative flex-1 max-w-[200px]">
                    <input
                      value={values[field.key] === null ? "" : String(values[field.key])}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      onBlur={() => handleBlur(field.key)}
                      placeholder={field.placeholder}
                      className="w-full px-2.5 py-2 border border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-mono focus:outline-none focus:border-[var(--primary-blue)] focus:ring-[3px] focus:ring-[var(--primary-blue-soft)] rounded-lg pr-16"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-mono pointer-events-none">
                      {field.unit}
                    </span>
                  </div>
                  {savedKey === field.key && (
                    <span className="text-[10px] text-green-600 flex items-center gap-1 font-semibold tracking-wider animate-in fade-in duration-200">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] font-mono tracking-wider transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset All
      </button>
    </div>
  );
}
