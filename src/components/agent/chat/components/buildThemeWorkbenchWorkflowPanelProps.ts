import type { ThemeWorkbenchSidebarWorkflowPanelProps } from "./themeWorkbenchSidebarContentContract";
import { writeThemeWorkbenchClipboardText } from "./themeWorkbenchSidebarShared";
import type { ThemeWorkbenchWorkflowPanelState } from "./useThemeWorkbenchWorkflowPanelState";

export interface BuildThemeWorkbenchWorkflowPanelPropsParams {
  isVersionMode: ThemeWorkbenchSidebarWorkflowPanelProps["isVersionMode"];
  activeRunDetail: ThemeWorkbenchSidebarWorkflowPanelProps["activeRunDetail"];
  activeRunDetailLoading: ThemeWorkbenchSidebarWorkflowPanelProps["activeRunDetailLoading"];
  branchItems: ThemeWorkbenchSidebarWorkflowPanelProps["branchItems"];
  creationTaskEventsCount: ThemeWorkbenchSidebarWorkflowPanelProps["creationTaskEventsCount"];
  onAddImage?: ThemeWorkbenchSidebarWorkflowPanelProps["onAddImage"];
  onDeleteTopic: ThemeWorkbenchSidebarWorkflowPanelProps["onDeleteTopic"];
  onImportDocument?: ThemeWorkbenchSidebarWorkflowPanelProps["onImportDocument"];
  onNewTopic: ThemeWorkbenchSidebarWorkflowPanelProps["onNewTopic"];
  onOpenArtifactWithDefaultApp: (
    artifactPath: string,
    sessionId?: string | null,
  ) => Promise<void> | void;
  onRevealArtifactInFinder: (
    artifactPath: string,
    sessionId?: string | null,
  ) => Promise<void> | void;
  onSetBranchStatus: ThemeWorkbenchSidebarWorkflowPanelProps["onSetBranchStatus"];
  onSwitchTopic: ThemeWorkbenchSidebarWorkflowPanelProps["onSwitchTopic"];
  onViewRunDetail?: ThemeWorkbenchSidebarWorkflowPanelProps["onViewRunDetail"];
  workflowPanelState: ThemeWorkbenchWorkflowPanelState;
  workflowSteps: ThemeWorkbenchSidebarWorkflowPanelProps["workflowSteps"];
}

export function buildThemeWorkbenchWorkflowPanelProps({
  isVersionMode,
  branchItems,
  creationTaskEventsCount,
  onAddImage,
  onDeleteTopic,
  onImportDocument,
  onNewTopic,
  onOpenArtifactWithDefaultApp,
  onRevealArtifactInFinder,
  onSetBranchStatus,
  onSwitchTopic,
  onViewRunDetail,
  workflowPanelState,
  workflowSteps,
  activeRunDetail,
  activeRunDetailLoading,
}: BuildThemeWorkbenchWorkflowPanelPropsParams): ThemeWorkbenchSidebarWorkflowPanelProps {
  return {
    isVersionMode,
    onNewTopic,
    onSwitchTopic,
    onDeleteTopic,
    branchItems,
    onSetBranchStatus,
    workflowSteps,
    completedSteps: workflowPanelState.completedSteps,
    progressPercent: workflowPanelState.progressPercent,
    onAddImage,
    onImportDocument,
    creationTaskEventsCount,
    showCreationTasks: workflowPanelState.showCreationTasks,
    onToggleCreationTasks: workflowPanelState.toggleCreationTasks,
    groupedCreationTaskEvents: workflowPanelState.groupedCreationTaskEvents,
    showActivityLogs: workflowPanelState.showActivityLogs,
    onToggleActivityLogs: workflowPanelState.toggleActivityLogs,
    groupedActivityLogs: workflowPanelState.groupedActivityLogs,
    onViewRunDetail,
    activeRunDetail,
    activeRunDetailLoading,
    activeRunStagesLabel: workflowPanelState.activeRunStagesLabel,
    runMetadataText: workflowPanelState.runMetadataText,
    runMetadataSummary: workflowPanelState.runMetadataSummary,
    onCopyText: writeThemeWorkbenchClipboardText,
    onRevealArtifactInFinder,
    onOpenArtifactWithDefaultApp,
  };
}
