import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CatalogItem {
  id: string;
  description: string;
  category: string;
  section: string;
  default_unit: string;
}

export function useCatalog() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCatalog = async () => {
      const { data, error } = await supabase
        .from("catalog_items")
        .select("id, description, category, section, default_unit")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("sort_order")
        .order("description");
      if (!error && data) {
        setCatalog(data);
      }
      setLoading(false);
    };
    fetchCatalog();
  }, [user]);

  const addItem = useCallback(async (description: string, section: string, unit: string) => {
    if (!user) return;
    if (catalog.some((c) => c.description.toLowerCase() === description.toLowerCase())) return;
    const { data, error } = await supabase
      .from("catalog_items")
      .insert({
        user_id: user.id,
        description,
        section,
        default_unit: unit,
        category: "custom",
      })
      .select("id, description, category, section, default_unit")
      .single();
    if (!error && data) {
      setCatalog((prev) => [...prev, data].sort((a, b) => a.description.localeCompare(b.description)));
    }
  }, [user, catalog]);

  return { catalog, loading, addItem };
}
