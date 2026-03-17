import type { ThemeWorkbenchSidebarContextPanelProps } from "./themeWorkbenchSidebarContentContract";
import type { ThemeWorkbenchContextPanelState } from "./useThemeWorkbenchContextPanelState";

export interface BuildThemeWorkbenchContextPanelPropsParams {
  contextPanelState: ThemeWorkbenchContextPanelState;
  contextBudget: ThemeWorkbenchSidebarContextPanelProps["contextBudget"];
  contextItems: ThemeWorkbenchSidebarContextPanelProps["contextItems"];
  contextSearchBlockedReason?: ThemeWorkbenchSidebarContextPanelProps["contextSearchBlockedReason"];
  contextSearchError?: ThemeWorkbenchSidebarContextPanelProps["contextSearchError"];
  contextSearchLoading: ThemeWorkbenchSidebarContextPanelProps["contextSearchLoading"];
  contextSearchMode: ThemeWorkbenchSidebarContextPanelProps["contextSearchMode"];
  contextSearchQuery: ThemeWorkbenchSidebarContextPanelProps["contextSearchQuery"];
  onContextSearchModeChange: ThemeWorkbenchSidebarContextPanelProps["onContextSearchModeChange"];
  onContextSearchQueryChange: ThemeWorkbenchSidebarContextPanelProps["onContextSearchQueryChange"];
  onSubmitContextSearch: ThemeWorkbenchSidebarContextPanelProps["onSubmitContextSearch"];
  onToggleContextActive: ThemeWorkbenchSidebarContextPanelProps["onToggleContextActive"];
  onViewContextDetail?: ThemeWorkbenchSidebarContextPanelProps["onViewContextDetail"];
}

export function buildThemeWorkbenchContextPanelProps({
  contextBudget,
  contextItems,
  contextPanelState,
  contextSearchBlockedReason,
  contextSearchError,
  contextSearchLoading,
  contextSearchMode,
  contextSearchQuery,
  onContextSearchModeChange,
  onContextSearchQueryChange,
  onSubmitContextSearch,
  onToggleContextActive,
  onViewContextDetail,
}: BuildThemeWorkbenchContextPanelPropsParams): ThemeWorkbenchSidebarContextPanelProps {
  return {
    contextItems,
    searchContextItems: contextPanelState.searchContextItems,
    orderedContextItems: contextPanelState.orderedContextItems,
    selectedSearchResult: contextPanelState.selectedSearchResult,
    latestSearchLabel: contextPanelState.latestSearchLabel,
    contextBudget,
    contextSearchQuery,
    contextSearchMode,
    contextSearchLoading,
    contextSearchError,
    contextSearchBlockedReason,
    isSearchActionDisabled: contextPanelState.isSearchActionDisabled,
    searchInputRef: contextPanelState.searchInputRef,
    onContextSearchQueryChange,
    onContextSearchModeChange,
    onSubmitContextSearch,
    onOpenAddContextDialog: contextPanelState.openAddContextDialog,
    onSelectSearchResult: contextPanelState.handleSelectSearchResult,
    onToggleContextActive,
    onViewContextDetail,
    addContextDialogOpen: contextPanelState.addContextDialogOpen,
    addTextDialogOpen: contextPanelState.addTextDialogOpen,
    addLinkDialogOpen: contextPanelState.addLinkDialogOpen,
    contextDraftText: contextPanelState.contextDraftText,
    contextDraftLink: contextPanelState.contextDraftLink,
    contextCreateLoading: contextPanelState.contextCreateLoading,
    contextCreateError: contextPanelState.contextCreateError,
    contextDropActive: contextPanelState.contextDropActive,
    onCloseAllContextDialogs: contextPanelState.closeAllContextDialogs,
    onChooseContextFile: contextPanelState.handleChooseContextFile,
    onDropContextFile: contextPanelState.handleDropContextFile,
    onOpenTextContextDialog: contextPanelState.openTextContextDialog,
    onOpenLinkContextDialog: contextPanelState.openLinkContextDialog,
    onContextDraftTextChange: contextPanelState.handleContextDraftTextChange,
    onContextDraftLinkChange: contextPanelState.handleContextDraftLinkChange,
    onContextDropActiveChange: contextPanelState.handleContextDropActiveChange,
    onSubmitTextContext: contextPanelState.handleSubmitTextContext,
    onSubmitLinkContext: contextPanelState.handleSubmitLinkContext,
  };
}
