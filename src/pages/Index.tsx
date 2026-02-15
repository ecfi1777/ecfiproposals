import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProposal } from "@/hooks/useProposal";
import { useCatalog } from "@/hooks/useCatalog";
import { calcSection, calcTotalYards } from "@/lib/ecfi-utils";
import { TopNav } from "@/components/ecfi/TopNav";
import { ProposalTab } from "@/components/ecfi/ProposalTab";
import { CostAnalysisTab } from "@/components/ecfi/CostAnalysisTab";
import { PreviewTab } from "@/components/ecfi/PreviewTab";

type TabKey = "proposal" | "costs" | "preview";

const Index = () => {
  const {
    proposal, setProposal, ftgLines, setFtgLines, slabLines, setSlabLines,
    saving, lastSaved, saveProposal, newProposal, loadProposal,
  } = useProposal();
  const { catalog, addItem } = useCatalog();
  const [activeTab, setActiveTab] = useState<TabKey>("proposal");
  const [searchParams, setSearchParams] = useSearchParams();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ecfi-theme") === "dark";
    }
    return false;
  });

  // Load proposal from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && id !== proposal.id) {
      loadProposal(id);
    }
  }, [searchParams]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("ecfi-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleNew = () => {
    newProposal();
    setSearchParams({});
  };

  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const proposalTotal = grandStd + grandOpt;
  const totalYards = calcTotalYards(ftgLines) + calcTotalYards(slabLines);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "proposal", label: "Proposal" },
    { key: "costs", label: "Cost Analysis" },
    { key: "preview", label: "Preview" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <TopNav
        catalogCount={catalog.length}
        totalYards={totalYards}
        proposalTotal={proposalTotal}
        saving={saving}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSave={saveProposal}
        onNew={handleNew}
        lastSaved={lastSaved}
      />

      {/* Tabs */}
      <div className="flex border-b border-ecfi-nav-border bg-ecfi-tab-bg px-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-6 py-2.5 font-bold text-[13px] tracking-widest uppercase border-b-2 transition-all font-mono ${
              activeTab === t.key
                ? "bg-ecfi-tab-active-bg text-ecfi-gold-text border-ecfi-gold"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {activeTab === "proposal" && (
          <ProposalTab
            proposal={proposal}
            setProposal={setProposal}
            ftgLines={ftgLines}
            setFtgLines={setFtgLines}
            slabLines={slabLines}
            setSlabLines={setSlabLines}
            catalog={catalog}
            onSaveNew={addItem}
          />
        )}
        {activeTab === "costs" && (
          <CostAnalysisTab
            proposal={proposal}
            setProposal={setProposal}
            ftgLines={ftgLines}
            slabLines={slabLines}
          />
        )}
        {activeTab === "preview" && (
          <PreviewTab proposal={proposal} ftgLines={ftgLines} slabLines={slabLines} />
        )}
      </div>
    </div>
  );
};

export default Index;
