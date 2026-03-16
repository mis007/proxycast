import { useCallback, useMemo, useState } from "react";
import type { StepStatus } from "@/components/content-creator/types";
import type { SidebarActivityLog } from "../hooks/useThemeContextWorkspace";
import {
  buildThemeWorkbenchActivityLogGroups,
  buildThemeWorkbenchCreationTaskGroups,
  formatThemeWorkbenchStagesLabel,
  type ThemeWorkbenchCreationTaskEvent,
  type ThemeWorkbenchRunMetadataSummary,
} from "./themeWorkbenchWorkflowData";

interface UseThemeWorkbenchWorkflowPanelStateParams {
  workflowSteps: Array<{ id: string; title: string; status: StepStatus }>;
  activityLogs: SidebarActivityLog[];
  creationTaskEvents: ThemeWorkbenchCreationTaskEvent[];
  runMetadataSummary: ThemeWorkbenchRunMetadataSummary;
}

export interface ThemeWorkbenchWorkflowPanelState {
  completedSteps: number;
  progressPercent: number;
  groupedActivityLogs: ReturnType<typeof buildThemeWorkbenchActivityLogGroups>;
  groupedCreationTaskEvents: ReturnType<
    typeof buildThemeWorkbenchCreationTaskGroups
  >;
  activeRunStagesLabel: string | null;
  showActivityLogs: boolean;
  showCreationTasks: boolean;
  toggleActivityLogs: () => void;
  toggleCreationTasks: () => void;
}

export function useThemeWorkbenchWorkflowPanelState({
  workflowSteps,
  activityLogs,
  creationTaskEvents,
  runMetadataSummary,
}: UseThemeWorkbenchWorkflowPanelStateParams): ThemeWorkbenchWorkflowPanelState {
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showCreationTasks, setShowCreationTasks] = useState(true);

  const completedSteps = useMemo(
    () => workflowSteps.filter((step) => step.status === "completed").length,
    [workflowSteps],
  );

  const progressPercent =
    workflowSteps.length > 0 ? (completedSteps / workflowSteps.length) * 100 : 0;

  const groupedActivityLogs = useMemo(
    () => buildThemeWorkbenchActivityLogGroups(activityLogs),
    [activityLogs],
  );

  const groupedCreationTaskEvents = useMemo(
    () => buildThemeWorkbenchCreationTaskGroups(creationTaskEvents),
    [creationTaskEvents],
  );

  const activeRunStagesLabel = useMemo(
    () => formatThemeWorkbenchStagesLabel(runMetadataSummary.stages),
    [runMetadataSummary.stages],
  );

  const toggleActivityLogs = useCallback(() => {
    setShowActivityLogs((previous) => !previous);
  }, []);

  const toggleCreationTasks = useCallback(() => {
    setShowCreationTasks((previous) => !previous);
  }, []);

  return {
    completedSteps,
    progressPercent,
    groupedActivityLogs,
    groupedCreationTaskEvents,
    activeRunStagesLabel,
    showActivityLogs,
    showCreationTasks,
    toggleActivityLogs,
    toggleCreationTasks,
  };
}
