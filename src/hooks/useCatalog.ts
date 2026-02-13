import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCatalog() {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      const { data, error } = await supabase
        .from("item_catalog")
        .select("name")
        .order("name");
      if (!error && data) {
        setCatalog(data.map((d) => d.name));
      }
      setLoading(false);
    };
    fetchCatalog();
  }, []);

  const addItem = useCallback(async (name: string) => {
    if (catalog.includes(name)) return;
    const { error } = await supabase.from("item_catalog").insert({ name });
    if (!error) {
      setCatalog((prev) => [...prev, name].sort());
    }
  }, [catalog]);

  return { catalog, loading, addItem };
}
