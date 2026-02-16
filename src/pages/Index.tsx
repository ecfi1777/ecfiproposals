import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProposal } from "@/hooks/useProposal";
import { useCatalog } from "@/hooks/useCatalog";
import { useDarkMode } from "@/hooks/useDarkMode";
import { calcSection, calcTotalYards } from "@/lib/ecfi-utils";
import { TopNav } from "@/components/ecfi/TopNav";
import { ProposalTab } from "@/components/ecfi/ProposalTab";
import { CostAnalysisTab } from "@/components/ecfi/CostAnalysisTab";
import { PreviewTab } from "@/components/ecfi/PreviewTab";
import { ProposalsTab } from "@/components/ecfi/ProposalsTab";
import { PriceHistoryTab } from "@/components/ecfi/PriceHistoryTab";

type TabKey = "proposal" | "costs" | "preview" | "proposals" | "price-history";

const Index = () => {
  const {
    proposal, setProposal, ftgLines, setFtgLines, slabLines, setSlabLines,
    saving, lastSaved, saveProposal, newProposal, loadProposal,
  } = useProposal();
  const { catalog, addItem } = useCatalog();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<TabKey>("proposal");
  const [searchParams, setSearchParams] = useSearchParams();

  // We only want this to run when searchParams change on mount,
  // not when the proposal state or loadProposal ref updates,
  // to avoid re-triggering the load cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && id !== proposal.id) {
      loadProposal(id).then(() => setActiveTab("proposal"));
    }
  }, [searchParams]);

  const handleNew = () => {
    newProposal();
    setSearchParams({});
    setActiveTab("proposal");
  };

  const handleLoadProposal = (id: string) => {
    setSearchParams({ id });
    setActiveTab("proposal");
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
    { key: "proposals", label: "Proposals" },
    { key: "price-history", label: "Price History" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <TopNav
        catalogCount={catalog.length}
        totalYards={totalYards}
        proposalTotal={proposalTotal}
        saving={saving}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
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
            onSave={saveProposal}
            onClear={handleNew}
            saving={saving}
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
        {activeTab === "proposals" && (
          <ProposalsTab onLoad={handleLoadProposal} />
        )}
        {activeTab === "price-history" && (
          <PriceHistoryTab onLoadProposal={handleLoadProposal} />
        )}
      </div>
    </div>
  );
};

export default Index;
