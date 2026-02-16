import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProposal } from "@/hooks/useProposal";
import { useCatalog } from "@/hooks/useCatalog";
import { calcSection, calcTotalYards } from "@/lib/ecfi-utils";
import { TopNav } from "@/components/ecfi/TopNav";
import { ProposalTab } from "@/components/ecfi/ProposalTab";
import { CostAnalysisTab } from "@/components/ecfi/CostAnalysisTab";
import { PreviewTab } from "@/components/ecfi/PreviewTab";
import { ProposalsTab } from "@/components/ecfi/ProposalsTab";
import { PriceHistoryTab } from "@/components/ecfi/PriceHistoryTab";
import SettingsPage from "@/pages/Settings";
import { FilePlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TabKey = "proposal" | "costs" | "preview" | "proposals" | "price-history" | "settings";
const VALID_TABS: TabKey[] = ["proposal", "costs", "preview", "proposals", "price-history", "settings"];

const Index = () => {
  const {
    proposal, setProposal, ftgLines, setFtgLines, slabLines, setSlabLines,
    saving, lastSaved, saveProposal, newProposal, loadProposal, isDirty,
  } = useProposal();
  const { catalog, addItem } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Unsaved changes dialog state
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Derive active tab from URL
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "proposal";

  const setActiveTab = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "proposal") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    if (tab !== "settings") {
      params.delete("subtab");
    }
    setSearchParams(params, { replace: true });
  };

  // Guard: check dirty state before executing an action
  const guardAction = useCallback((action: () => void) => {
    if (isDirty) {
      pendingActionRef.current = action;
      setUnsavedDialog(true);
    } else {
      action();
    }
  }, [isDirty]);

  const handleUnsavedSaveAndContinue = async () => {
    setUnsavedDialog(false);
    await saveProposal();
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  };

  const handleUnsavedDiscard = () => {
    setUnsavedDialog(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  };

  const handleUnsavedCancel = () => {
    setUnsavedDialog(false);
    pendingActionRef.current = null;
  };

  // beforeunload protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && id !== proposal.id) {
      // Loading from URL param (e.g. initial page load with ?id=...)
      loadProposal(id).then(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("tab");
        setSearchParams(params, { replace: true });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("id")]);

  const doNew = () => {
    newProposal();
    setSearchParams({});
  };

  const handleNewClick = () => {
    const hasData = proposal.builder || ftgLines.some(l => l.description) || slabLines.some(l => l.description);
    if (isDirty && hasData) {
      // Use the existing 3-button "new proposal" dialog for this specific case
      setShowNewConfirm(true);
    } else if (hasData) {
      setShowNewConfirm(true);
    } else {
      doNew();
    }
  };

  const handleSaveAndNew = async () => {
    setShowNewConfirm(false);
    await saveProposal();
    doNew();
  };

  const handleStartWithoutSaving = () => {
    setShowNewConfirm(false);
    doNew();
  };

  const handleLoadProposal = (id: string) => {
    guardAction(() => {
      setSearchParams({ id });
    });
  };

  const handleTabClick = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
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
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] font-mono">
      <TopNav saving={saving} lastSaved={lastSaved} isDirty={isDirty} proposalBuilder={proposal.builder} />

      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--card-border)] bg-[var(--card-bg)] px-6">
        {/* New Proposal button — left side of tab bar */}
        <button
          onClick={handleNewClick}
          className="flex items-center gap-1.5 px-3 py-2 mr-4 border border-[var(--card-border)] hover:bg-[var(--section-bg)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors text-[11px] font-bold tracking-wider rounded-lg"
          title="New Proposal"
        >
          <FilePlus className="w-3.5 h-3.5" />
          New Proposal
        </button>

        <div className="w-px h-6 bg-[var(--card-border)] mr-2" />

        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabClick(t.key)}
            className={`px-6 py-2.5 font-bold text-[13px] tracking-widest uppercase border-b-2 transition-all font-mono ${
              activeTab === t.key
                ? "bg-[var(--card-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--primary-blue)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={activeTab === "settings" ? "" : "p-6 max-w-[1400px] mx-auto"}>
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
            onClear={doNew}
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
        {activeTab === "settings" && (
          <SettingsPage embedded />
        )}
      </div>

      {/* New Proposal confirmation modal */}
      <AlertDialog open={showNewConfirm} onOpenChange={setShowNewConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a New Proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              If you continue without saving, your current changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartWithoutSaving}
              className="border border-[var(--card-border)] bg-transparent text-[var(--text-main)] hover:bg-[var(--section-bg)]"
            >
              Start Without Saving
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleSaveAndNew}
              className="bg-[var(--primary-blue)] text-white hover:bg-[var(--primary-blue-hover)]"
            >
              Save & Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes dialog — for loading proposals / navigating away */}
      <AlertDialog open={unsavedDialog} onOpenChange={(open) => { if (!open) handleUnsavedCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              {proposal.id
                ? "You have unsaved changes on your current proposal. If you leave now, your changes will be lost."
                : "You have an unsaved new proposal. If you leave now, it will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={handleUnsavedCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsavedDiscard}
              className="border border-[var(--card-border)] bg-transparent text-[var(--text-main)] hover:bg-[var(--section-bg)]"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleUnsavedSaveAndContinue}
              className="bg-[var(--primary-blue)] text-white hover:bg-[var(--primary-blue-hover)]"
            >
              Save & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
