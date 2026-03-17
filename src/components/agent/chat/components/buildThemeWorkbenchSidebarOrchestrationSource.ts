import type {
  ThemeWorkbenchSidebarContextContract,
  ThemeWorkbenchSidebarExecLogContract,
  ThemeWorkbenchSidebarWorkflowContract,
} from "./themeWorkbenchSidebarContract";
import type { ThemeWorkbenchSidebarOrchestrationSource } from "./themeWorkbenchSidebarOrchestrationContract";

type ThemeWorkbenchSidebarOrchestrationSourceProps =
  ThemeWorkbenchSidebarContextContract &
    ThemeWorkbenchSidebarWorkflowContract &
    ThemeWorkbenchSidebarExecLogContract;

interface BuildThemeWorkbenchSidebarOrchestrationSourceParams {
  isVersionMode: boolean;
  props: ThemeWorkbenchSidebarOrchestrationSourceProps;
}

export function buildThemeWorkbenchSidebarOrchestrationSource({
  isVersionMode,
  props,
}: BuildThemeWorkbenchSidebarOrchestrationSourceParams): ThemeWorkbenchSidebarOrchestrationSource {
  return {
    isVersionMode,
    context: {
      contextBudget: props.contextBudget,
      contextItems: props.contextItems,
      contextSearchBlockedReason: props.contextSearchBlockedReason,
      contextSearchError: props.contextSearchError,
      contextSearchLoading: props.contextSearchLoading,
      contextSearchMode: props.contextSearchMode,
      contextSearchQuery: props.contextSearchQuery,
      onAddFileContext: props.onAddFileContext,
      onAddLinkContext: props.onAddLinkContext,
      onAddTextContext: props.onAddTextContext,
      onContextSearchModeChange: props.onContextSearchModeChange,
      onContextSearchQueryChange: props.onContextSearchQueryChange,
      onSubmitContextSearch: props.onSubmitContextSearch,
      onToggleContextActive: props.onToggleContextActive,
      onViewContextDetail: props.onViewContextDetail,
    },
    workflow: {
      activeRunDetail: props.activeRunDetail,
      activeRunDetailLoading: props.activeRunDetailLoading,
      activityLogs: props.activityLogs,
      branchItems: props.branchItems,
      creationTaskEvents: props.creationTaskEvents,
      onAddImage: props.onAddImage,
      onDeleteTopic: props.onDeleteTopic,
      onImportDocument: props.onImportDocument,
      onNewTopic: props.onNewTopic,
      onSetBranchStatus: props.onSetBranchStatus,
      onSwitchTopic: props.onSwitchTopic,
      onViewRunDetail: props.onViewRunDetail,
      workflowSteps: props.workflowSteps,
    },
    execLog: {
      historyHasMore: props.historyHasMore,
      historyLoading: props.historyLoading,
      messages: props.messages,
      onLoadMoreHistory: props.onLoadMoreHistory,
      skillDetailMap: props.skillDetailMap,
    },
  };
}
