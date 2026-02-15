import { useState } from "react";
import { ProposalData, LineItem, emptyLine, emptySlabLine } from "@/lib/ecfi-utils";

const makeRows = (factory: () => LineItem, count: number) =>
  Array.from({ length: count }, factory);

export function useProposal() {
  const [proposal, setProposal] = useState<ProposalData>({
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
  const [ftgLines, setFtgLines] = useState<LineItem[]>(makeRows(emptyLine, 8));
  const [slabLines, setSlabLines] = useState<LineItem[]>(makeRows(emptySlabLine, 8));
  const saving = false;

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
