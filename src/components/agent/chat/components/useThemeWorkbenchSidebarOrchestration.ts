import type { ThemeWorkbenchSidebarTab } from "./ThemeWorkbenchSidebarShell";
import type { ThemeWorkbenchSidebarContentProps } from "./themeWorkbenchSidebarContentContract";
import type { ThemeWorkbenchSidebarOrchestrationInput } from "./themeWorkbenchSidebarOrchestrationContract";
import { buildThemeWorkbenchContextPanelProps } from "./buildThemeWorkbenchContextPanelProps";
import { buildThemeWorkbenchExecLogProps } from "./buildThemeWorkbenchExecLogProps";
import { buildThemeWorkbenchWorkflowPanelProps } from "./buildThemeWorkbenchWorkflowPanelProps";
import { useThemeWorkbenchArtifactActions } from "./useThemeWorkbenchArtifactActions";
import { useThemeWorkbenchContextPanelState } from "./useThemeWorkbenchContextPanelState";
import { useThemeWorkbenchExecLogState } from "./useThemeWorkbenchExecLogState";
import { useThemeWorkbenchSidebarTelemetry } from "./useThemeWorkbenchSidebarTelemetry";
import { useThemeWorkbenchWorkflowPanelState } from "./useThemeWorkbenchWorkflowPanelState";

interface UseThemeWorkbenchSidebarOrchestrationParams {
  activeTab: ThemeWorkbenchSidebarTab;
  input: ThemeWorkbenchSidebarOrchestrationInput;
}

export interface ThemeWorkbenchSidebarOrchestration {
  branchCount: number;
  isVersionMode: boolean;
  activeContextCount: number;
  visibleExecLogCount: number;
  contextPanelProps: ThemeWorkbenchSidebarContentProps["contextPanelProps"];
  workflowPanelProps: ThemeWorkbenchSidebarContentProps["workflowPanelProps"];
  execLogProps: ThemeWorkbenchSidebarContentProps["execLogProps"];
}

export function useThemeWorkbenchSidebarOrchestration({
  activeTab,
  input,
}: UseThemeWorkbenchSidebarOrchestrationParams): ThemeWorkbenchSidebarOrchestration {
  const { isVersionMode, context, workflow, execLog } = input;
  const branchCount = workflow.branchItems.length;
  const runDetailSessionId = workflow.activeRunDetail?.session_id?.trim() || null;
  const { handleRevealArtifactInFinder, handleOpenArtifactWithDefaultApp } =
    useThemeWorkbenchArtifactActions({
      runDetailSessionId,
    });

  const workflowPanelState = useThemeWorkbenchWorkflowPanelState({
    workflowSteps: workflow.workflowSteps,
    activityLogs: workflow.activityLogs,
    creationTaskEvents: workflow.creationTaskEvents,
    activeRunMetadata: workflow.activeRunDetail?.metadata ?? null,
  });

  const contextPanelState = useThemeWorkbenchContextPanelState({
    contextItems: context.contextItems,
    contextSearchQuery: context.contextSearchQuery,
    contextSearchLoading: context.contextSearchLoading,
    contextSearchBlockedReason: context.contextSearchBlockedReason,
    onAddTextContext: context.onAddTextContext,
    onAddLinkContext: context.onAddLinkContext,
    onAddFileContext: context.onAddFileContext,
  });

  useThemeWorkbenchSidebarTelemetry({
    activeTab,
    showActivityLogs: workflowPanelState.showActivityLogs,
    contextSearchLoading: context.contextSearchLoading,
    branchItemsCount: branchCount,
    workflowStepsCount: workflow.workflowSteps.length,
    contextItemsCount: context.contextItems.length,
    activeContextCount: contextPanelState.activeContextItems.length,
    activityLogsCount: workflow.activityLogs.length,
    creationTaskEventsCount: workflow.creationTaskEvents.length,
    hasActiveRunDetail: Boolean(workflow.activeRunDetail),
  });

  const execLogState = useThemeWorkbenchExecLogState({
    messages: execLog.messages,
    groupedActivityLogs: workflowPanelState.groupedActivityLogs,
    groupedCreationTaskEvents: workflowPanelState.groupedCreationTaskEvents,
    skillDetailMap: execLog.skillDetailMap,
  });

  return {
    branchCount,
    isVersionMode,
    activeContextCount: contextPanelState.activeContextItems.length,
    visibleExecLogCount: execLogState.visibleExecLogEntries.length,
    contextPanelProps: buildThemeWorkbenchContextPanelProps({
      contextBudget: context.contextBudget,
      contextItems: context.contextItems,
      contextPanelState,
      contextSearchBlockedReason: context.contextSearchBlockedReason,
      contextSearchError: context.contextSearchError,
      contextSearchLoading: context.contextSearchLoading,
      contextSearchMode: context.contextSearchMode,
      contextSearchQuery: context.contextSearchQuery,
      onContextSearchModeChange: context.onContextSearchModeChange,
      onContextSearchQueryChange: context.onContextSearchQueryChange,
      onSubmitContextSearch: context.onSubmitContextSearch,
      onToggleContextActive: context.onToggleContextActive,
      onViewContextDetail: context.onViewContextDetail,
    }),
    workflowPanelProps: buildThemeWorkbenchWorkflowPanelProps({
      isVersionMode,
      branchItems: workflow.branchItems,
      creationTaskEventsCount: workflow.creationTaskEvents.length,
      onAddImage: workflow.onAddImage,
      onDeleteTopic: workflow.onDeleteTopic,
      onImportDocument: workflow.onImportDocument,
      onNewTopic: workflow.onNewTopic,
      onOpenArtifactWithDefaultApp: handleOpenArtifactWithDefaultApp,
      onRevealArtifactInFinder: handleRevealArtifactInFinder,
      onSetBranchStatus: workflow.onSetBranchStatus,
      onSwitchTopic: workflow.onSwitchTopic,
      onViewRunDetail: workflow.onViewRunDetail,
      workflowPanelState,
      workflowSteps: workflow.workflowSteps,
      activeRunDetail: workflow.activeRunDetail,
      activeRunDetailLoading: workflow.activeRunDetailLoading,
    }),
    execLogProps: buildThemeWorkbenchExecLogProps({
      execLogState,
      historyHasMore: execLog.historyHasMore,
      historyLoading: execLog.historyLoading,
      onLoadMoreHistory: execLog.onLoadMoreHistory,
    }),
  };
}
