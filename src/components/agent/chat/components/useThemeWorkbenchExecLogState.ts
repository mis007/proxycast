import { useCallback, useMemo, useState } from "react";
import type { SkillDetailInfo } from "@/lib/api/skill-execution";
import type { Message } from "../types";
import type {
  ThemeWorkbenchActivityLogGroup,
  ThemeWorkbenchCreationTaskGroup,
} from "./themeWorkbenchWorkflowData";
import {
  buildThemeWorkbenchExecLogEntries,
  filterThemeWorkbenchExecLogEntries,
} from "./themeWorkbenchExecLogData";

interface UseThemeWorkbenchExecLogStateParams {
  messages: Message[];
  groupedActivityLogs: ThemeWorkbenchActivityLogGroup[];
  groupedCreationTaskEvents: ThemeWorkbenchCreationTaskGroup[];
  skillDetailMap: Record<string, SkillDetailInfo | null>;
}

export interface ThemeWorkbenchExecLogState {
  execLogEntries: ReturnType<typeof buildThemeWorkbenchExecLogEntries>;
  visibleExecLogEntries: ReturnType<typeof buildThemeWorkbenchExecLogEntries>;
  wasExecLogCleared: boolean;
  clearExecLog: () => void;
}

export function useThemeWorkbenchExecLogState({
  messages,
  groupedActivityLogs,
  groupedCreationTaskEvents,
  skillDetailMap,
}: UseThemeWorkbenchExecLogStateParams): ThemeWorkbenchExecLogState {
  const [execLogClearedAt, setExecLogClearedAt] = useState<number | null>(null);

  const execLogEntries = useMemo(
    () =>
      buildThemeWorkbenchExecLogEntries({
        messages,
        groupedActivityLogs,
        groupedCreationTaskEvents,
        skillDetailMap,
      }),
    [messages, groupedActivityLogs, groupedCreationTaskEvents, skillDetailMap],
  );

  const visibleExecLogEntries = useMemo(
    () => filterThemeWorkbenchExecLogEntries(execLogEntries, execLogClearedAt),
    [execLogClearedAt, execLogEntries],
  );

  const clearExecLog = useCallback(() => {
    setExecLogClearedAt(Date.now());
  }, []);

  return {
    execLogEntries,
    visibleExecLogEntries,
    wasExecLogCleared: execLogClearedAt !== null,
    clearExecLog,
  };
}
