

## Fix: Only Guard Actions That Clear the Proposal

**Problem**: The current unsaved changes warning triggers when switching to the Proposals tab, Price History tab, or Settings tab. But those tabs don't clear the proposal data — the user can freely browse them and come back to find their work intact. The warning should only fire for actions that would actually replace/clear the current proposal.

**Solution**: Remove the tab-switching guard entirely. Only guard actions that destroy current proposal data:

1. **Loading a different proposal** (from Proposals tab or Price History) -- already guarded via `handleLoadProposal`
2. **Clicking "New Proposal"** -- already guarded via `handleNewClick`
3. **Browser close/refresh** -- already guarded via `beforeunload`

**Change**: In `src/pages/Index.tsx`, simplify `handleTabClick` to always call `setActiveTab(tab)` directly, removing the dirty-state check for tab switching (lines 142-152).

### Technical Detail

```
// BEFORE (lines 142-152):
const handleTabClick = (tab: TabKey) => {
  if (tab === activeTab) return;
  const editTabs: TabKey[] = ["proposal", "costs", "preview"];
  const isLeavingEdit = editTabs.includes(activeTab) && !editTabs.includes(tab);
  if (isLeavingEdit && isDirty) {
    guardAction(() => setActiveTab(tab));
  } else {
    setActiveTab(tab);
  }
};

// AFTER:
const handleTabClick = (tab: TabKey) => {
  if (tab === activeTab) return;
  setActiveTab(tab);
};
```

This is a single change in one file. The `beforeunload`, `handleLoadProposal`, and `handleNewClick` guards remain fully intact -- those are the real data-loss scenarios.

