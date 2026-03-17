import type {
  ThemeWorkbenchSidebarContextContract,
  ThemeWorkbenchSidebarExecLogContract,
  ThemeWorkbenchSidebarProps,
  ThemeWorkbenchSidebarShellContract,
  ThemeWorkbenchSidebarWorkflowContract,
} from "./themeWorkbenchSidebarContract";

function areThemeWorkbenchContextBudgetsEqual(
  previous: ThemeWorkbenchSidebarProps["contextBudget"],
  next: ThemeWorkbenchSidebarProps["contextBudget"],
): boolean {
  return (
    previous.activeCount === next.activeCount &&
    previous.activeCountLimit === next.activeCountLimit &&
    previous.estimatedTokens === next.estimatedTokens &&
    previous.tokenLimit === next.tokenLimit
  );
}

function areThemeWorkbenchSidebarShellPropsEqual(
  previous: ThemeWorkbenchSidebarShellContract,
  next: ThemeWorkbenchSidebarShellContract,
): boolean {
  return (
    previous.branchMode === next.branchMode &&
    previous.onRequestCollapse === next.onRequestCollapse &&
    previous.headerActionSlot === next.headerActionSlot &&
    previous.topSlot === next.topSlot
  );
}

function areThemeWorkbenchSidebarContextPropsEqual(
  previous: ThemeWorkbenchSidebarContextContract,
  next: ThemeWorkbenchSidebarContextContract,
): boolean {
  return (
    previous.contextSearchQuery === next.contextSearchQuery &&
    previous.onContextSearchQueryChange === next.onContextSearchQueryChange &&
    previous.contextSearchMode === next.contextSearchMode &&
    previous.onContextSearchModeChange === next.onContextSearchModeChange &&
    previous.contextSearchLoading === next.contextSearchLoading &&
    previous.contextSearchError === next.contextSearchError &&
    previous.contextSearchBlockedReason === next.contextSearchBlockedReason &&
    previous.onSubmitContextSearch === next.onSubmitContextSearch &&
    previous.onAddTextContext === next.onAddTextContext &&
    previous.onAddLinkContext === next.onAddLinkContext &&
    previous.onAddFileContext === next.onAddFileContext &&
    previous.contextItems === next.contextItems &&
    previous.onToggleContextActive === next.onToggleContextActive &&
    previous.onViewContextDetail === next.onViewContextDetail &&
    areThemeWorkbenchContextBudgetsEqual(
      previous.contextBudget,
      next.contextBudget,
    )
  );
}

function areThemeWorkbenchSidebarWorkflowPropsEqual(
  previous: ThemeWorkbenchSidebarWorkflowContract,
  next: ThemeWorkbenchSidebarWorkflowContract,
): boolean {
  return (
    previous.onNewTopic === next.onNewTopic &&
    previous.onSwitchTopic === next.onSwitchTopic &&
    previous.onDeleteTopic === next.onDeleteTopic &&
    previous.branchItems === next.branchItems &&
    previous.onSetBranchStatus === next.onSetBranchStatus &&
    previous.workflowSteps === next.workflowSteps &&
    previous.onAddImage === next.onAddImage &&
    previous.onImportDocument === next.onImportDocument &&
    previous.activityLogs === next.activityLogs &&
    previous.creationTaskEvents === next.creationTaskEvents &&
    previous.onViewRunDetail === next.onViewRunDetail &&
    previous.activeRunDetail === next.activeRunDetail &&
    previous.activeRunDetailLoading === next.activeRunDetailLoading
  );
}

function areThemeWorkbenchSidebarExecLogPropsEqual(
  previous: ThemeWorkbenchSidebarExecLogContract,
  next: ThemeWorkbenchSidebarExecLogContract,
): boolean {
  return (
    previous.historyHasMore === next.historyHasMore &&
    previous.historyLoading === next.historyLoading &&
    previous.onLoadMoreHistory === next.onLoadMoreHistory &&
    previous.skillDetailMap === next.skillDetailMap &&
    previous.messages === next.messages
  );
}

export function areThemeWorkbenchSidebarPropsEqual(
  previous: ThemeWorkbenchSidebarProps,
  next: ThemeWorkbenchSidebarProps,
): boolean {
  return (
    areThemeWorkbenchSidebarShellPropsEqual(previous, next) &&
    areThemeWorkbenchSidebarContextPropsEqual(previous, next) &&
    areThemeWorkbenchSidebarWorkflowPropsEqual(previous, next) &&
    areThemeWorkbenchSidebarExecLogPropsEqual(previous, next)
  );
}
