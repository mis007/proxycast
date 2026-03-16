import { useEffect, useRef } from "react";
import { logRenderPerf } from "@/lib/perfDebug";
import type { ThemeWorkbenchSidebarTab } from "./ThemeWorkbenchSidebarShell";

interface UseThemeWorkbenchSidebarTelemetryParams {
  activeTab: ThemeWorkbenchSidebarTab;
  showActivityLogs: boolean;
  contextSearchLoading: boolean;
  branchItemsCount: number;
  workflowStepsCount: number;
  contextItemsCount: number;
  activeContextCount: number;
  activityLogsCount: number;
  creationTaskEventsCount: number;
  hasActiveRunDetail: boolean;
}

export function useThemeWorkbenchSidebarTelemetry({
  activeTab,
  showActivityLogs,
  contextSearchLoading,
  branchItemsCount,
  workflowStepsCount,
  contextItemsCount,
  activeContextCount,
  activityLogsCount,
  creationTaskEventsCount,
  hasActiveRunDetail,
}: UseThemeWorkbenchSidebarTelemetryParams) {
  const renderCountRef = useRef(0);
  const lastCommitAtRef = useRef<number | null>(null);
  renderCountRef.current += 1;

  useEffect(() => {
    const now = performance.now();
    const sinceLastCommitMs =
      lastCommitAtRef.current === null ? null : now - lastCommitAtRef.current;
    lastCommitAtRef.current = now;
    logRenderPerf(
      "ThemeWorkbenchSidebar",
      renderCountRef.current,
      sinceLastCommitMs,
      {
        activeTab,
        showActivityLogs,
        contextSearchLoading,
        branchItemsCount,
        workflowStepsCount,
        contextItemsCount,
        activeContextCount,
        activityLogsCount,
        creationTaskEventsCount,
        hasActiveRunDetail,
      },
    );
  });
}
