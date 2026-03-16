import type { ComponentProps } from "react";
import type { AgentRun } from "@/lib/api/executionRun";
import { ThemeWorkbenchContextPanel } from "./ThemeWorkbenchContextPanel";
import { ThemeWorkbenchExecLog } from "./ThemeWorkbenchExecLog";
import { ThemeWorkbenchWorkflowPanel } from "./ThemeWorkbenchWorkflowPanel";
import type { ThemeWorkbenchSidebarTab } from "./ThemeWorkbenchSidebarShell";
import type {
  ThemeWorkbenchContextBudget,
  ThemeWorkbenchContextItem,
} from "./themeWorkbenchContextData";
import type { ThemeWorkbenchRunMetadataSummary } from "./themeWorkbenchWorkflowData";
import type { ThemeWorkbenchContextPanelState } from "./useThemeWorkbenchContextPanelState";
import type { ThemeWorkbenchExecLogState } from "./useThemeWorkbenchExecLogState";
import type { ThemeWorkbenchWorkflowPanelState } from "./useThemeWorkbenchWorkflowPanelState";

interface ThemeWorkbenchSidebarPanelsProps {
  activeTab: ThemeWorkbenchSidebarTab;
  contextState: ThemeWorkbenchContextPanelState;
  contextConfig: {
    contextItems: ThemeWorkbenchContextItem[];
    contextBudget: ThemeWorkbenchContextBudget;
    contextSearchQuery: string;
    contextSearchMode: "web" | "social";
    contextSearchLoading: boolean;
    contextSearchError?: string | null;
    contextSearchBlockedReason?: string | null;
    onContextSearchQueryChange: (value: string) => void;
    onContextSearchModeChange: (value: "web" | "social") => void;
    onSubmitContextSearch: () => Promise<void> | void;
    onToggleContextActive: (contextId: string) => void;
    onViewContextDetail?: (contextId: string) => void;
  };
  workflowState: ThemeWorkbenchWorkflowPanelState;
  workflowConfig: {
    isVersionMode: boolean;
    onNewTopic: () => void;
    onSwitchTopic: (topicId: string) => void;
    onDeleteTopic: (topicId: string) => void;
    branchItems: ComponentProps<typeof ThemeWorkbenchWorkflowPanel>["branchItems"];
    onSetBranchStatus: ComponentProps<
      typeof ThemeWorkbenchWorkflowPanel
    >["onSetBranchStatus"];
    workflowSteps: ComponentProps<typeof ThemeWorkbenchWorkflowPanel>["workflowSteps"];
    onAddImage?: () => Promise<void> | void;
    onImportDocument?: () => Promise<void> | void;
    creationTaskEventsCount: number;
    onViewRunDetail?: (runId: string) => void;
    activeRunDetail?: AgentRun | null;
    activeRunDetailLoading?: boolean;
    runMetadataText: string;
    runMetadataSummary: ThemeWorkbenchRunMetadataSummary;
    onCopyText: (text: string) => Promise<void> | void;
    onRevealArtifactInFinder: (
      artifactPath: string,
      sessionId?: string | null,
    ) => Promise<void> | void;
    onOpenArtifactWithDefaultApp: (
      artifactPath: string,
      sessionId?: string | null,
    ) => Promise<void> | void;
  };
  execLogState: ThemeWorkbenchExecLogState;
  execLogConfig: {
    onLoadMoreHistory?: () => void;
    historyHasMore: boolean;
    historyLoading: boolean;
  };
}

export function ThemeWorkbenchSidebarPanels({
  activeTab,
  contextState,
  contextConfig,
  workflowState,
  workflowConfig,
  execLogState,
  execLogConfig,
}: ThemeWorkbenchSidebarPanelsProps) {
  if (activeTab === "context") {
    return (
      <ThemeWorkbenchContextPanel
        contextItems={contextConfig.contextItems}
        searchContextItems={contextState.searchContextItems}
        orderedContextItems={contextState.orderedContextItems}
        selectedSearchResult={contextState.selectedSearchResult}
        latestSearchLabel={contextState.latestSearchLabel}
        contextBudget={contextConfig.contextBudget}
        contextSearchQuery={contextConfig.contextSearchQuery}
        contextSearchMode={contextConfig.contextSearchMode}
        contextSearchLoading={contextConfig.contextSearchLoading}
        contextSearchError={contextConfig.contextSearchError}
        contextSearchBlockedReason={contextConfig.contextSearchBlockedReason}
        isSearchActionDisabled={contextState.isSearchActionDisabled}
        searchInputRef={contextState.searchInputRef}
        onContextSearchQueryChange={contextConfig.onContextSearchQueryChange}
        onContextSearchModeChange={contextConfig.onContextSearchModeChange}
        onSubmitContextSearch={contextConfig.onSubmitContextSearch}
        onOpenAddContextDialog={contextState.openAddContextDialog}
        onSelectSearchResult={contextState.handleSelectSearchResult}
        onToggleContextActive={contextConfig.onToggleContextActive}
        onViewContextDetail={contextConfig.onViewContextDetail}
        addContextDialogOpen={contextState.addContextDialogOpen}
        addTextDialogOpen={contextState.addTextDialogOpen}
        addLinkDialogOpen={contextState.addLinkDialogOpen}
        contextDraftText={contextState.contextDraftText}
        contextDraftLink={contextState.contextDraftLink}
        contextCreateLoading={contextState.contextCreateLoading}
        contextCreateError={contextState.contextCreateError}
        contextDropActive={contextState.contextDropActive}
        onCloseAllContextDialogs={contextState.closeAllContextDialogs}
        onChooseContextFile={contextState.handleChooseContextFile}
        onDropContextFile={contextState.handleDropContextFile}
        onOpenTextContextDialog={contextState.openTextContextDialog}
        onOpenLinkContextDialog={contextState.openLinkContextDialog}
        onContextDraftTextChange={contextState.handleContextDraftTextChange}
        onContextDraftLinkChange={contextState.handleContextDraftLinkChange}
        onContextDropActiveChange={contextState.handleContextDropActiveChange}
        onSubmitTextContext={contextState.handleSubmitTextContext}
        onSubmitLinkContext={contextState.handleSubmitLinkContext}
      />
    );
  }
  if (activeTab === "workflow") {
    return (
      <ThemeWorkbenchWorkflowPanel
        isVersionMode={workflowConfig.isVersionMode}
        onNewTopic={workflowConfig.onNewTopic}
        onSwitchTopic={workflowConfig.onSwitchTopic}
        onDeleteTopic={workflowConfig.onDeleteTopic}
        branchItems={workflowConfig.branchItems}
        onSetBranchStatus={workflowConfig.onSetBranchStatus}
        workflowSteps={workflowConfig.workflowSteps}
        completedSteps={workflowState.completedSteps}
        progressPercent={workflowState.progressPercent}
        onAddImage={workflowConfig.onAddImage}
        onImportDocument={workflowConfig.onImportDocument}
        creationTaskEventsCount={workflowConfig.creationTaskEventsCount}
        showCreationTasks={workflowState.showCreationTasks}
        onToggleCreationTasks={workflowState.toggleCreationTasks}
        groupedCreationTaskEvents={workflowState.groupedCreationTaskEvents}
        showActivityLogs={workflowState.showActivityLogs}
        onToggleActivityLogs={workflowState.toggleActivityLogs}
        groupedActivityLogs={workflowState.groupedActivityLogs}
        onViewRunDetail={workflowConfig.onViewRunDetail}
        activeRunDetail={workflowConfig.activeRunDetail}
        activeRunDetailLoading={workflowConfig.activeRunDetailLoading}
        activeRunStagesLabel={workflowState.activeRunStagesLabel}
        runMetadataText={workflowConfig.runMetadataText}
        runMetadataSummary={workflowConfig.runMetadataSummary}
        onCopyText={workflowConfig.onCopyText}
        onRevealArtifactInFinder={workflowConfig.onRevealArtifactInFinder}
        onOpenArtifactWithDefaultApp={workflowConfig.onOpenArtifactWithDefaultApp}
      />
    );
  }
  if (activeTab === "log") {
    return (
      <ThemeWorkbenchExecLog
        entries={execLogState.visibleExecLogEntries}
        totalEntriesCount={execLogState.execLogEntries.length}
        wasCleared={execLogState.wasExecLogCleared}
        onClear={execLogState.clearExecLog}
        onLoadMoreHistory={execLogConfig.onLoadMoreHistory}
        historyHasMore={execLogConfig.historyHasMore}
        historyLoading={execLogConfig.historyLoading}
      />
    );
  }
  return null;
}
