import type { ThemeWorkbenchSidebarExecLogProps } from "./themeWorkbenchSidebarContentContract";
import type { ThemeWorkbenchExecLogState } from "./useThemeWorkbenchExecLogState";

export interface BuildThemeWorkbenchExecLogPropsParams {
  execLogState: ThemeWorkbenchExecLogState;
  historyHasMore?: ThemeWorkbenchSidebarExecLogProps["historyHasMore"];
  historyLoading?: ThemeWorkbenchSidebarExecLogProps["historyLoading"];
  onLoadMoreHistory?: ThemeWorkbenchSidebarExecLogProps["onLoadMoreHistory"];
}

export function buildThemeWorkbenchExecLogProps({
  execLogState,
  historyHasMore = false,
  historyLoading = false,
  onLoadMoreHistory,
}: BuildThemeWorkbenchExecLogPropsParams): ThemeWorkbenchSidebarExecLogProps {
  return {
    entries: execLogState.visibleExecLogEntries,
    totalEntriesCount: execLogState.execLogEntries.length,
    wasCleared: execLogState.wasExecLogCleared,
    onClear: execLogState.clearExecLog,
    onLoadMoreHistory,
    historyHasMore,
    historyLoading,
  };
}
