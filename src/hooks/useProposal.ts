import { useState, useCallback } from "react";
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
  laborPerYard: "60",
  otherCosts: "",
  otherCostsNote: "",
  concreteYardsOverride: "",
  rebarCostPerLF: "",
});

export function useProposal() {
  const { user } = useAuth();
  const [proposal, setProposal] = useState<ProposalData>(freshProposal());
  const [ftgLines, setFtgLines] = useState<LineItem[]>(makeRows(emptyLine, 8));
  const [slabLines, setSlabLines] = useState<LineItem[]>(makeRows(emptySlabLine, 8));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const newProposal = useCallback(() => {
    setProposal(freshProposal());
    setFtgLines(makeRows(emptyLine, 8));
    setSlabLines(makeRows(emptySlabLine, 8));
    setLastSaved(null);
  }, []);

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
        labor_per_yard: proposal.laborPerYard ? parseFloat(proposal.laborPerYard) : 60,
        other_costs: proposal.otherCosts ? parseFloat(proposal.otherCosts) : 0,
        other_costs_note: proposal.otherCostsNote || "",
        concrete_yards_override: proposal.concreteYardsOverride ? parseFloat(proposal.concreteYardsOverride) : null,
        standard_total: grandStd,
        optional_total: grandOpt,
        grand_total: grandStd + grandOpt,
      };

      let proposalId = proposal.id;

      if (proposalId) {
        // Update existing
        const { error } = await supabase
          .from("proposals_v2")
          .update(proposalRow)
          .eq("id", proposalId);
        if (error) throw error;

        // Delete old line items to re-insert
        await supabase.from("proposal_line_items").delete().eq("proposal_id", proposalId);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("proposals_v2")
          .insert(proposalRow)
          .select("id")
          .single();
        if (error) throw error;
        proposalId = data.id;
        setProposal((p) => ({ ...p, id: proposalId }));
      }

      // Save line items
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

      // Always delete existing price history for this proposal first
      await supabase.from("price_history").delete().eq("proposal_id", proposalId);

      // Write price history for priced items
      const pricedLines = allLines.filter((l) => l.qty && (l.unitPriceStd || l.unitPriceOpt));
      if (pricedLines.length > 0) {
        const historyRows: any[] = [];
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
      toast.success("Proposal saved successfully");
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error("Failed to save proposal: " + (err.message || "Unknown error"));
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

      setProposal({
        id: p.id,
        builder: p.builder || "",
        date: p.proposal_date || new Date().toISOString().slice(0, 10),
        location: p.job_location || "",
        county: p.county || "",
        foundType: p.foundation_type || "Custom",
        foundSize: p.foundation_size || "",
        concretePerYard: p.concrete_per_yard?.toString() || "",
        laborPerYard: p.labor_per_yard?.toString() || "60",
        otherCosts: p.other_costs?.toString() || "",
        otherCostsNote: p.other_costs_note || "",
        concreteYardsOverride: p.concrete_yards_override?.toString() || "",
        rebarCostPerLF: "",
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

      // Pad to minimum 8 rows
      while (ftg.length < 8) ftg.push(emptyLine());
      while (slab.length < 8) slab.push(emptySlabLine());

      setFtgLines(ftg);
      setSlabLines(slab);
      setLastSaved(new Date());
      toast.success("Proposal loaded");
    } catch (err: any) {
      console.error("Load failed:", err);
      toast.error("Failed to load proposal");
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    proposal,
    setProposal,
    ftgLines,
    setFtgLines,
    slabLines,
    setSlabLines,
    saving,
    lastSaved,
    saveProposal,
    newProposal,
    loadProposal,
  };
}
