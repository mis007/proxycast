import React, {
  memo,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import type { StepStatus } from "@/components/content-creator/types";
import type { SkillDetailInfo } from "@/lib/api/skill-execution";
import type { TopicBranchItem, TopicBranchStatus } from "../hooks/useTopicBranchBoard";
import type { SidebarActivityLog } from "../hooks/useThemeContextWorkspace";
import type { Message } from "../types";
import type { AgentRun } from "@/lib/api/executionRun";
import {
  ThemeWorkbenchSidebarShell,
  type ThemeWorkbenchSidebarTab,
} from "./ThemeWorkbenchSidebarShell";
import { ThemeWorkbenchSidebarPanels } from "./ThemeWorkbenchSidebarPanels";
import type {
  ThemeWorkbenchContextBudget,
  ThemeWorkbenchContextItem,
} from "./themeWorkbenchContextData";
import {
  parseThemeWorkbenchRunMetadataSummary,
  type ThemeWorkbenchCreationTaskEvent,
} from "./themeWorkbenchWorkflowData";
import { useThemeWorkbenchContextPanelState } from "./useThemeWorkbenchContextPanelState";
import { useThemeWorkbenchArtifactActions } from "./useThemeWorkbenchArtifactActions";
import { useThemeWorkbenchExecLogState } from "./useThemeWorkbenchExecLogState";
import { useThemeWorkbenchSidebarTelemetry } from "./useThemeWorkbenchSidebarTelemetry";
import { useThemeWorkbenchWorkflowPanelState } from "./useThemeWorkbenchWorkflowPanelState";
import {
  formatThemeWorkbenchRunMetadata,
  writeThemeWorkbenchClipboardText,
} from "./themeWorkbenchSidebarShared";

type BranchMode = "topic" | "version";

interface ThemeWorkbenchSidebarProps {
  branchMode?: BranchMode;
  onNewTopic: () => void;
  onSwitchTopic: (topicId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  branchItems: TopicBranchItem[];
  onSetBranchStatus: (topicId: string, status: TopicBranchStatus) => void;
  workflowSteps: Array<{ id: string; title: string; status: StepStatus }>;
  contextSearchQuery: string;
  onContextSearchQueryChange: (value: string) => void;
  contextSearchMode: "web" | "social";
  onContextSearchModeChange: (value: "web" | "social") => void;
  contextSearchLoading: boolean;
  contextSearchError?: string | null;
  contextSearchBlockedReason?: string | null;
  onSubmitContextSearch: () => Promise<void> | void;
  onAddTextContext?: (payload: {
    content: string;
    name?: string;
  }) => Promise<void> | void;
  onAddLinkContext?: (payload: {
    url: string;
    name?: string;
  }) => Promise<void> | void;
  onAddFileContext?: (payload: {
    path: string;
    name?: string;
  }) => Promise<void> | void;
  onAddImage?: () => Promise<void> | void;
  onImportDocument?: () => Promise<void> | void;
  contextItems: ThemeWorkbenchContextItem[];
  onToggleContextActive: (contextId: string) => void;
  onViewContextDetail?: (contextId: string) => void;
  contextBudget: ThemeWorkbenchContextBudget;
  activityLogs: SidebarActivityLog[];
  creationTaskEvents?: ThemeWorkbenchCreationTaskEvent[];
  onViewRunDetail?: (runId: string) => void;
  activeRunDetail?: AgentRun | null;
  activeRunDetailLoading?: boolean;
  onRequestCollapse?: () => void;
  historyHasMore?: boolean;
  historyLoading?: boolean;
  onLoadMoreHistory?: () => void;
  skillDetailMap?: Record<string, SkillDetailInfo | null>;
  headerActionSlot?: ReactNode;
  topSlot?: ReactNode;
  /** 完整的对话消息列表，用于执行日志 tab */
  messages?: Message[];
}

function ThemeWorkbenchSidebarComponent({
  branchMode = "version",
  onNewTopic,
  onSwitchTopic,
  onDeleteTopic,
  branchItems,
  onSetBranchStatus,
  workflowSteps,
  contextSearchQuery,
  onContextSearchQueryChange,
  contextSearchMode,
  onContextSearchModeChange,
  contextSearchLoading,
  contextSearchError,
  contextSearchBlockedReason,
  onSubmitContextSearch,
  onAddTextContext,
  onAddLinkContext,
  onAddFileContext,
  onAddImage,
  onImportDocument,
  contextItems,
  onToggleContextActive,
  onViewContextDetail,
  contextBudget,
  activityLogs,
  creationTaskEvents = [],
  onViewRunDetail,
  activeRunDetail,
  activeRunDetailLoading = false,
  onRequestCollapse,
  historyHasMore = false,
  historyLoading = false,
  onLoadMoreHistory,
  skillDetailMap = {},
  headerActionSlot,
  topSlot,
  messages = [],
}: ThemeWorkbenchSidebarProps) {
  const [activeTab, setActiveTab] = useState<ThemeWorkbenchSidebarTab>("context");
  const isVersionMode = branchMode === "version";
  const runMetadataText = useMemo(
    () => formatThemeWorkbenchRunMetadata(activeRunDetail?.metadata ?? null),
    [activeRunDetail?.metadata],
  );
  const runMetadataSummary = useMemo(
    () => parseThemeWorkbenchRunMetadataSummary(activeRunDetail?.metadata ?? null),
    [activeRunDetail?.metadata],
  );
  const runDetailSessionId = activeRunDetail?.session_id?.trim() || null;
  const { handleRevealArtifactInFinder, handleOpenArtifactWithDefaultApp } =
    useThemeWorkbenchArtifactActions({
      runDetailSessionId,
    });
  const workflowPanelState = useThemeWorkbenchWorkflowPanelState({
    workflowSteps,
    activityLogs,
    creationTaskEvents,
    runMetadataSummary,
  });
  const contextPanelState = useThemeWorkbenchContextPanelState({
    contextItems,
    contextSearchQuery,
    contextSearchLoading,
    contextSearchBlockedReason,
    onAddTextContext,
    onAddLinkContext,
    onAddFileContext,
  });

  useThemeWorkbenchSidebarTelemetry({
    activeTab,
    showActivityLogs: workflowPanelState.showActivityLogs,
    contextSearchLoading,
    branchItemsCount: branchItems.length,
    workflowStepsCount: workflowSteps.length,
    contextItemsCount: contextItems.length,
    activeContextCount: contextPanelState.activeContextItems.length,
    activityLogsCount: activityLogs.length,
    creationTaskEventsCount: creationTaskEvents.length,
    hasActiveRunDetail: Boolean(activeRunDetail),
  });
  const execLogState = useThemeWorkbenchExecLogState({
    messages,
    groupedActivityLogs: workflowPanelState.groupedActivityLogs,
    groupedCreationTaskEvents: workflowPanelState.groupedCreationTaskEvents,
    skillDetailMap,
  });

  return (
    <ThemeWorkbenchSidebarShell
      activeTab={activeTab}
      isVersionMode={isVersionMode}
      activeContextCount={contextPanelState.activeContextItems.length}
      branchCount={branchItems.length}
      visibleExecLogCount={execLogState.visibleExecLogEntries.length}
      onTabChange={setActiveTab}
      onRequestCollapse={onRequestCollapse}
      headerActionSlot={headerActionSlot}
      topSlot={topSlot}
    >
      <ThemeWorkbenchSidebarPanels
        activeTab={activeTab}
        contextState={contextPanelState}
        contextConfig={{
          contextItems,
          contextBudget,
          contextSearchQuery,
          contextSearchMode,
          contextSearchLoading,
          contextSearchError,
          contextSearchBlockedReason,
          onContextSearchQueryChange,
          onContextSearchModeChange,
          onSubmitContextSearch,
          onToggleContextActive,
          onViewContextDetail,
        }}
        workflowState={workflowPanelState}
        workflowConfig={{
          isVersionMode,
          onNewTopic,
          onSwitchTopic,
          onDeleteTopic,
          branchItems,
          onSetBranchStatus,
          workflowSteps,
          onAddImage,
          onImportDocument,
          creationTaskEventsCount: creationTaskEvents.length,
          onViewRunDetail,
          activeRunDetail,
          activeRunDetailLoading,
          runMetadataText,
          runMetadataSummary,
          onCopyText: writeThemeWorkbenchClipboardText,
          onRevealArtifactInFinder: handleRevealArtifactInFinder,
          onOpenArtifactWithDefaultApp: handleOpenArtifactWithDefaultApp,
        }}
        execLogState={execLogState}
        execLogConfig={{
          onLoadMoreHistory,
          historyHasMore,
          historyLoading,
        }}
      />
    </ThemeWorkbenchSidebarShell>
  );
}

function areThemeWorkbenchSidebarPropsEqual(
  previous: ThemeWorkbenchSidebarProps,
  next: ThemeWorkbenchSidebarProps,
): boolean {
  return (
    previous.branchMode === next.branchMode &&
    previous.onNewTopic === next.onNewTopic &&
    previous.onSwitchTopic === next.onSwitchTopic &&
    previous.onDeleteTopic === next.onDeleteTopic &&
    previous.branchItems === next.branchItems &&
    previous.onSetBranchStatus === next.onSetBranchStatus &&
    previous.workflowSteps === next.workflowSteps &&
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
    previous.onAddImage === next.onAddImage &&
    previous.onImportDocument === next.onImportDocument &&
    previous.contextItems === next.contextItems &&
    previous.onToggleContextActive === next.onToggleContextActive &&
    previous.contextBudget.activeCount === next.contextBudget.activeCount &&
    previous.contextBudget.activeCountLimit === next.contextBudget.activeCountLimit &&
    previous.contextBudget.estimatedTokens === next.contextBudget.estimatedTokens &&
    previous.contextBudget.tokenLimit === next.contextBudget.tokenLimit &&
    previous.activityLogs === next.activityLogs &&
    previous.creationTaskEvents === next.creationTaskEvents &&
    previous.onViewRunDetail === next.onViewRunDetail &&
    previous.activeRunDetail === next.activeRunDetail &&
    previous.activeRunDetailLoading === next.activeRunDetailLoading &&
    previous.onRequestCollapse === next.onRequestCollapse &&
    previous.historyHasMore === next.historyHasMore &&
    previous.historyLoading === next.historyLoading &&
    previous.onLoadMoreHistory === next.onLoadMoreHistory &&
    previous.skillDetailMap === next.skillDetailMap &&
    previous.headerActionSlot === next.headerActionSlot &&
    previous.topSlot === next.topSlot &&
    previous.messages === next.messages
  );
}

export const ThemeWorkbenchSidebar = memo(
  ThemeWorkbenchSidebarComponent,
  areThemeWorkbenchSidebarPropsEqual,
);
