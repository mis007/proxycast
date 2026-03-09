import type { A2UISubmissionNoticeData } from "../components/A2UISubmissionNotice";
import { useA2UISubmissionNotice } from "./useA2UISubmissionNotice";
import {
  useThemeWorkbenchInputState,
  type ThemeWorkbenchGateState,
  type ThemeWorkbenchWorkflowStep,
} from "./useThemeWorkbenchInputState";

interface UseInputbarDisplayStateParams {
  isThemeWorkbenchVariant: boolean;
  themeWorkbenchGate?: ThemeWorkbenchGateState | null;
  workflowSteps?: ThemeWorkbenchWorkflowStep[];
  themeWorkbenchRunState?: "idle" | "auto_running" | "await_user_decision";
  isSending: boolean;
  pendingA2UIForm: boolean;
  a2uiSubmissionNotice?: A2UISubmissionNoticeData | null;
}

export function useInputbarDisplayState({
  isThemeWorkbenchVariant,
  themeWorkbenchGate,
  workflowSteps,
  themeWorkbenchRunState,
  isSending,
  pendingA2UIForm,
  a2uiSubmissionNotice,
}: UseInputbarDisplayStateParams) {
  const {
    themeWorkbenchQuickActions,
    themeWorkbenchQueueItems,
    renderThemeWorkbenchGeneratingPanel,
    shouldShowA2UISubmissionNotice,
  } = useThemeWorkbenchInputState({
    isThemeWorkbenchVariant,
    themeWorkbenchGate,
    workflowSteps,
    themeWorkbenchRunState,
    isSending,
    hasPendingA2UIForm: pendingA2UIForm,
    hasSubmissionNotice: Boolean(a2uiSubmissionNotice),
  });

  const {
    visibleNotice: visibleA2UISubmissionNotice,
    isVisible: isA2UISubmissionNoticeVisible,
  } = useA2UISubmissionNotice({
    notice: a2uiSubmissionNotice,
    enabled: shouldShowA2UISubmissionNotice,
  });

  return {
    themeWorkbenchQuickActions,
    themeWorkbenchQueueItems,
    renderThemeWorkbenchGeneratingPanel,
    visibleA2UISubmissionNotice,
    isA2UISubmissionNoticeVisible,
  };
}
