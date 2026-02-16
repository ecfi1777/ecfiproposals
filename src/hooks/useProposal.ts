import { useState, useCallback, useEffect, useRef } from "react";
import { ProposalData, LineItem, emptyLine, emptySlabLine, calcSection, calcTotalYards } from "@/lib/ecfi-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const makeRows = (factory: () => LineItem, count: number) =>
  Array.from({ length: count }, factory);

const freshProposal = (): ProposalData => ({
  builder: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  county: "",
  foundType: "Custom",
  foundSize: "",
  concretePerYard: "",
  laborPerYard: "",
  otherCosts: "",
  otherCostsMode: "$" as const,
  otherCostsNote: "",
  concreteYardsOverride: "",
  rebarCostPerStick: "",
  rebarWastePercent: "0",
});

export function useProposal() {
  const { user } = useAuth();
  const [proposal, setProposal] = useState<ProposalData>(freshProposal());
  const [ftgLines, setFtgLines] = useState<LineItem[]>(makeRows(emptyLine, 3));
  const [slabLines, setSlabLines] = useState<LineItem[]>(makeRows(emptySlabLine, 3));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const skipDirtyRef = useRef(false);

  // Wrap setProposal to auto-mark dirty
  const setProposalTracked = useCallback((fn: (prev: ProposalData) => ProposalData) => {
    setProposal((prev) => {
      const next = fn(prev);
      if (!skipDirtyRef.current) setIsDirty(true);
      return next;
    });
  }, []);

  // Wrap setFtgLines to auto-mark dirty
  const setFtgLinesTracked = useCallback((fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => {
    setFtgLines((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (!skipDirtyRef.current) setIsDirty(true);
      return next;
    });
  }, []);

  // Wrap setSlabLines to auto-mark dirty
  const setSlabLinesTracked = useCallback((fn: LineItem[] | ((prev: LineItem[]) => LineItem[])) => {
    setSlabLines((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (!skipDirtyRef.current) setIsDirty(true);
      return next;
    });
  }, []);

  const markClean = useCallback(() => setIsDirty(false), []);

  // Load default costs into initial fresh proposal on first mount
  useEffect(() => {
    if (!user || defaultsLoaded) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("setting_value")
          .eq("user_id", user.id)
          .eq("setting_key", "default_costs")
          .maybeSingle();
        if (data?.setting_value && typeof data.setting_value === "object") {
          const dc = data.setting_value as Record<string, number | null>;
          skipDirtyRef.current = true;
          setProposal((p) => {
            if (p.id) return p;
            return {
              ...p,
              concretePerYard: dc.concrete_per_yard != null ? String(dc.concrete_per_yard) : p.concretePerYard,
              laborPerYard: dc.labor_per_yard != null ? String(dc.labor_per_yard) : p.laborPerYard,
            };
          });
          skipDirtyRef.current = false;
        }
      } catch {
        // fall back silently
      } finally {
        setDefaultsLoaded(true);
      }
    })();
  }, [user]);

  const newProposal = useCallback(async () => {
    const fresh = freshProposal();

    if (user) {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("setting_value")
          .eq("user_id", user.id)
          .eq("setting_key", "default_costs")
          .maybeSingle();
        if (data?.setting_value && typeof data.setting_value === "object") {
          const dc = data.setting_value as Record<string, number | null>;
          if (dc.concrete_per_yard != null) fresh.concretePerYard = String(dc.concrete_per_yard);
          if (dc.labor_per_yard != null) fresh.laborPerYard = String(dc.labor_per_yard);
        }
      } catch {
        // silently fall back
      }
    }

    skipDirtyRef.current = true;
    setProposal(fresh);
    setFtgLines(makeRows(emptyLine, 3));
    setSlabLines(makeRows(emptySlabLine, 3));
    setLastSaved(null);
    setIsDirty(false);
    skipDirtyRef.current = false;
  }, [user]);

  const saveProposal = useCallback(async () => {
    if (!user) { toast.error("You must be logged in to save."); return; }
    setSaving(true);

    try {
      const ftgTotals = calcSection(ftgLines);
      const slabTotals = calcSection(slabLines);
      const grandStd = ftgTotals.std + slabTotals.std;
      const grandOpt = ftgTotals.opt + slabTotals.opt;

      const proposalRow = {
        user_id: user.id,
        builder: proposal.builder || "",
        proposal_date: proposal.date || new Date().toISOString().slice(0, 10),
        job_location: proposal.location || "",
        county: proposal.county || "",
        foundation_type: proposal.foundType || "Custom",
        foundation_size: proposal.foundSize || "",
        concrete_per_yard: proposal.concretePerYard ? parseFloat(proposal.concretePerYard) : null,
        labor_per_yard: proposal.laborPerYard ? parseFloat(proposal.laborPerYard) : null,
        other_costs: proposal.otherCosts ? parseFloat(proposal.otherCosts) : 0,
        other_costs_note: proposal.otherCostsNote || "",
        concrete_yards_override: proposal.concreteYardsOverride ? parseFloat(proposal.concreteYardsOverride) : null,
        standard_total: grandStd,
        optional_total: grandOpt,
        grand_total: grandStd + grandOpt,
      };

      let proposalId = proposal.id;

      if (proposalId) {
        const { error } = await supabase
          .from("proposals_v2")
          .update(proposalRow)
          .eq("id", proposalId);
        if (error) throw error;
        await supabase.from("proposal_line_items").delete().eq("proposal_id", proposalId);
      } else {
        const { data, error } = await supabase
          .from("proposals_v2")
          .insert(proposalRow)
          .select("id")
          .single();
        if (error) throw error;
        proposalId = data.id;
        skipDirtyRef.current = true;
        setProposal((p) => ({ ...p, id: proposalId }));
        skipDirtyRef.current = false;
      }

      const allLines = [
        ...ftgLines.map((l, i) => ({ ...l, sortOrder: i, sectionLabel: "ftg_wall" })),
        ...slabLines.map((l, i) => ({ ...l, sortOrder: i + 100, sectionLabel: "slabs" })),
      ].filter((l) => l.description);

      if (allLines.length > 0) {
        const lineRows = allLines.map((l) => ({
          proposal_id: proposalId!,
          description: l.description,
          qty: l.qty ? parseFloat(l.qty) : 0,
          unit: l.unit,
          section: l.sectionLabel,
          sort_order: l.sortOrder,
          standard_unit_price: l.unitPriceStd ? parseFloat(l.unitPriceStd) : null,
          standard_total: l.qty && l.unitPriceStd ? parseFloat(l.qty) * parseFloat(l.unitPriceStd) : null,
          optional_unit_price: l.unitPriceOpt ? parseFloat(l.unitPriceOpt) : null,
          optional_total: l.qty && l.unitPriceOpt ? parseFloat(l.qty) * parseFloat(l.unitPriceOpt) : null,
          cy_override: l.cyOverride ? parseFloat(l.cyOverride) : null,
        }));
        const { error } = await supabase.from("proposal_line_items").insert(lineRows);
        if (error) throw error;
      }

      await supabase.from("price_history").delete().eq("proposal_id", proposalId);

      const pricedLines = allLines.filter((l) => l.qty && (l.unitPriceStd || l.unitPriceOpt));
      if (pricedLines.length > 0) {
        const historyRows: {
          user_id: string;
          proposal_id: string | undefined;
          description: string;
          unit: string;
          qty: number;
          unit_price: number;
          pricing_type: string;
          builder: string | null;
          job_location: string | null;
          county: string | null;
        }[] = [];
        for (const l of pricedLines) {
          if (l.unitPriceStd) {
            historyRows.push({
              user_id: user.id,
              proposal_id: proposalId,
              description: l.description,
              unit: l.unit,
              qty: parseFloat(l.qty),
              unit_price: parseFloat(l.unitPriceStd),
              pricing_type: "standard",
              builder: proposal.builder || null,
              job_location: proposal.location || null,
              county: proposal.county || null,
            });
          }
          if (l.unitPriceOpt) {
            historyRows.push({
              user_id: user.id,
              proposal_id: proposalId,
              description: l.description,
              unit: l.unit,
              qty: parseFloat(l.qty),
              unit_price: parseFloat(l.unitPriceOpt),
              pricing_type: "optional",
              builder: proposal.builder || null,
              job_location: proposal.location || null,
              county: proposal.county || null,
            });
          }
        }
        await supabase.from("price_history").insert(historyRows);
      }

      setLastSaved(new Date());
      setIsDirty(false);
      toast.success("Proposal saved successfully");
    } catch (err: unknown) {
      console.error("Save failed:", err);
      toast.error("Failed to save proposal: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, [user, proposal, ftgLines, slabLines]);

  const loadProposal = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { data: p, error } = await supabase
        .from("proposals_v2")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      skipDirtyRef.current = true;
      setProposal({
        id: p.id,
        builder: p.builder || "",
        date: p.proposal_date || new Date().toISOString().slice(0, 10),
        location: p.job_location || "",
        county: p.county || "",
        foundType: p.foundation_type || "Custom",
        foundSize: p.foundation_size || "",
        concretePerYard: p.concrete_per_yard?.toString() || "",
        laborPerYard: p.labor_per_yard?.toString() || "",
        otherCosts: p.other_costs?.toString() || "",
        otherCostsMode: "$" as const,
        otherCostsNote: p.other_costs_note || "",
        concreteYardsOverride: p.concrete_yards_override?.toString() || "",
        rebarCostPerStick: "",
        rebarWastePercent: "0",
      });

      const { data: lines, error: lErr } = await supabase
        .from("proposal_line_items")
        .select("*")
        .eq("proposal_id", id)
        .order("sort_order");
      if (lErr) throw lErr;

      const ftg: LineItem[] = [];
      const slab: LineItem[] = [];
      for (const l of lines || []) {
        const item: LineItem = {
          id: l.id,
          qty: l.qty?.toString() || "",
          unit: l.unit || "LF",
          description: l.description || "",
          unitPriceStd: l.standard_unit_price?.toString() || "",
          unitPriceOpt: l.optional_unit_price?.toString() || "",
          section: l.section === "slabs" ? "slab" : "ftg",
          cyOverride: l.cy_override?.toString() || "",
        };
        if (l.section === "slabs") slab.push(item);
        else ftg.push(item);
      }

      while (ftg.length < 3) ftg.push(emptyLine());
      while (slab.length < 3) slab.push(emptySlabLine());

      setFtgLines(ftg);
      setSlabLines(slab);
      setLastSaved(new Date());
      setIsDirty(false);
      skipDirtyRef.current = false;
      toast.success("Proposal loaded");
    } catch (err: unknown) {
      skipDirtyRef.current = false;
      console.error("Load failed:", err);
      toast.error("Failed to load proposal: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    proposal,
    setProposal: setProposalTracked,
    ftgLines,
    setFtgLines: setFtgLinesTracked,
    slabLines,
    setSlabLines: setSlabLinesTracked,
    saving,
    lastSaved,
    saveProposal,
    newProposal,
    loadProposal,
    isDirty,
    markClean,
  };
}
