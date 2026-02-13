import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProposalData, LineItem, emptyLine, emptySlabLine } from "@/lib/ecfi-utils";

export function useProposal() {
  const [proposal, setProposal] = useState<ProposalData>({
    builder: "",
    date: new Date().toISOString().slice(0, 10),
    location: "",
    county: "",
    foundType: "",
    foundSize: "",
    concretePerYard: "",
    laborPerYard: "60",
    otherCosts: "",
  });
  const [ftgLines, setFtgLines] = useState<LineItem[]>([emptyLine(), emptyLine(), emptyLine()]);
  const [slabLines, setSlabLines] = useState<LineItem[]>([emptySlabLine(), emptySlabLine(), emptySlabLine()]);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proposalIdRef = useRef<string | null>(null);

  // Load existing proposal or create new one
  useEffect(() => {
    const load = async () => {
      // Get most recent proposal
      const { data: proposals } = await supabase
        .from("proposals")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (proposals && proposals.length > 0) {
        const p = proposals[0];
        proposalIdRef.current = p.id;
        setProposal({
          id: p.id,
          builder: p.builder || "",
          date: p.date || new Date().toISOString().slice(0, 10),
          location: p.job_location || "",
          county: p.county || "",
          foundType: p.foundation_type || "",
          foundSize: p.foundation_size || "",
          concretePerYard: p.concrete_per_yard?.toString() || "",
          laborPerYard: p.labor_per_yard?.toString() || "60",
          otherCosts: p.other_costs?.toString() || "",
        });

        // Load line items
        const { data: items } = await supabase
          .from("line_items")
          .select("*")
          .eq("proposal_id", p.id)
          .order("sort_order");

        if (items && items.length > 0) {
          const ftg = items
            .filter((i) => i.section === "ftg")
            .map((i) => ({
              id: i.id,
              qty: i.qty?.toString() || "",
              unit: i.unit || "LF",
              description: i.description || "",
              unitPriceStd: i.unit_price_std?.toString() || "",
              unitPriceOpt: i.unit_price_opt?.toString() || "",
              section: "ftg" as const,
              cyOverride: i.cy_override?.toString() || "",
            }));
          const slb = items
            .filter((i) => i.section === "slab")
            .map((i) => ({
              id: i.id,
              qty: i.qty?.toString() || "",
              unit: i.unit || "SF",
              description: i.description || "",
              unitPriceStd: i.unit_price_std?.toString() || "",
              unitPriceOpt: i.unit_price_opt?.toString() || "",
              section: "slab" as const,
              cyOverride: i.cy_override?.toString() || "",
            }));
          if (ftg.length > 0) setFtgLines(ftg);
          if (slb.length > 0) setSlabLines(slb);
        }
      } else {
        // Create a new proposal
        const { data } = await supabase
          .from("proposals")
          .insert({
            builder: "",
            date: new Date().toISOString().slice(0, 10),
            job_location: "",
            county: "",
            foundation_type: "",
            foundation_size: "",
            concrete_per_yard: 0,
            labor_per_yard: 60,
            other_costs: 0,
          })
          .select()
          .single();
        if (data) {
          proposalIdRef.current = data.id;
          setProposal((prev) => ({ ...prev, id: data.id }));
        }
      }
    };
    load();
  }, []);

  // Auto-save with debounce
  const save = useCallback(async () => {
    if (!proposalIdRef.current) return;
    setSaving(true);
    try {
      await supabase
        .from("proposals")
        .update({
          builder: proposal.builder,
          date: proposal.date || null,
          job_location: proposal.location,
          county: proposal.county,
          foundation_type: proposal.foundType,
          foundation_size: proposal.foundSize,
          concrete_per_yard: parseFloat(proposal.concretePerYard) || 0,
          labor_per_yard: parseFloat(proposal.laborPerYard) || 60,
          other_costs: parseFloat(proposal.otherCosts) || 0,
        })
        .eq("id", proposalIdRef.current);

      // Delete existing line items and re-insert
      await supabase
        .from("line_items")
        .delete()
        .eq("proposal_id", proposalIdRef.current);

      const allLines = [
        ...ftgLines.map((l, i) => ({
          proposal_id: proposalIdRef.current!,
          section: "ftg" as const,
          sort_order: i,
          qty: l.qty ? parseFloat(l.qty) : null,
          unit: l.unit,
          description: l.description,
          unit_price_std: l.unitPriceStd ? parseFloat(l.unitPriceStd) : null,
          unit_price_opt: l.unitPriceOpt ? parseFloat(l.unitPriceOpt) : null,
          cy_override: l.cyOverride ? parseFloat(l.cyOverride) : null,
        })),
        ...slabLines.map((l, i) => ({
          proposal_id: proposalIdRef.current!,
          section: "slab" as const,
          sort_order: i,
          qty: l.qty ? parseFloat(l.qty) : null,
          unit: l.unit,
          description: l.description,
          unit_price_std: l.unitPriceStd ? parseFloat(l.unitPriceStd) : null,
          unit_price_opt: l.unitPriceOpt ? parseFloat(l.unitPriceOpt) : null,
          cy_override: l.cyOverride ? parseFloat(l.cyOverride) : null,
        })),
      ];

      if (allLines.length > 0) {
        await supabase.from("line_items").insert(allLines);
      }
    } finally {
      setSaving(false);
    }
  }, [proposal, ftgLines, slabLines]);

  // Debounced save trigger
  const triggerSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 1500);
  }, [save]);

  // Auto-save on changes
  useEffect(() => {
    if (proposalIdRef.current) {
      triggerSave();
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [proposal, ftgLines, slabLines, triggerSave]);

  return {
    proposal,
    setProposal,
    ftgLines,
    setFtgLines,
    slabLines,
    setSlabLines,
    saving,
  };
}
