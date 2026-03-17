import type { SkillDetailInfo } from "@/lib/api/skill-execution";
import type { SidebarActivityLog } from "../hooks/useThemeContextWorkspace";
import type { Message } from "../types";
import type { BuildThemeWorkbenchContextPanelPropsParams } from "./buildThemeWorkbenchContextPanelProps";
import type { BuildThemeWorkbenchExecLogPropsParams } from "./buildThemeWorkbenchExecLogProps";
import type { BuildThemeWorkbenchWorkflowPanelPropsParams } from "./buildThemeWorkbenchWorkflowPanelProps";
import type { ThemeWorkbenchCreationTaskEvent } from "./themeWorkbenchWorkflowData";
import type {
  ThemeWorkbenchAddFileContextAction,
  ThemeWorkbenchAddLinkContextAction,
  ThemeWorkbenchAddTextContextAction,
} from "./useThemeWorkbenchContextPanelState";

export interface ThemeWorkbenchSidebarContextOrchestrationInput
  extends Omit<BuildThemeWorkbenchContextPanelPropsParams, "contextPanelState"> {
  onAddTextContext?: ThemeWorkbenchAddTextContextAction;
  onAddLinkContext?: ThemeWorkbenchAddLinkContextAction;
  onAddFileContext?: ThemeWorkbenchAddFileContextAction;
}

export interface ThemeWorkbenchSidebarWorkflowOrchestrationInput
  extends Omit<
    BuildThemeWorkbenchWorkflowPanelPropsParams,
    | "creationTaskEventsCount"
    | "isVersionMode"
    | "onOpenArtifactWithDefaultApp"
    | "onRevealArtifactInFinder"
    | "workflowPanelState"
  > {
  activityLogs: SidebarActivityLog[];
  creationTaskEvents: ThemeWorkbenchCreationTaskEvent[];
}

export interface ThemeWorkbenchSidebarExecLogOrchestrationInput
  extends Omit<BuildThemeWorkbenchExecLogPropsParams, "execLogState"> {
  messages: Message[];
  skillDetailMap: Record<string, SkillDetailInfo | null>;
}

export interface ThemeWorkbenchSidebarOrchestrationInput {
  isVersionMode: boolean;
  context: ThemeWorkbenchSidebarContextOrchestrationInput;
  workflow: ThemeWorkbenchSidebarWorkflowOrchestrationInput;
  execLog: ThemeWorkbenchSidebarExecLogOrchestrationInput;
}

export type ThemeWorkbenchSidebarContextOrchestrationSource =
  ThemeWorkbenchSidebarContextOrchestrationInput;

export interface ThemeWorkbenchSidebarWorkflowOrchestrationSource
  extends Omit<
    ThemeWorkbenchSidebarWorkflowOrchestrationInput,
    "creationTaskEvents"
  > {
  creationTaskEvents?: ThemeWorkbenchCreationTaskEvent[];
}

export interface ThemeWorkbenchSidebarExecLogOrchestrationSource
  extends Omit<
    ThemeWorkbenchSidebarExecLogOrchestrationInput,
    "messages" | "skillDetailMap"
  > {
  messages?: Message[];
  skillDetailMap?: Record<string, SkillDetailInfo | null>;
}

export interface ThemeWorkbenchSidebarOrchestrationSource {
  isVersionMode: boolean;
  context: ThemeWorkbenchSidebarContextOrchestrationSource;
  workflow: ThemeWorkbenchSidebarWorkflowOrchestrationSource;
  execLog: ThemeWorkbenchSidebarExecLogOrchestrationSource;
}

export function createThemeWorkbenchSidebarOrchestrationInput(
  source: ThemeWorkbenchSidebarOrchestrationSource,
): ThemeWorkbenchSidebarOrchestrationInput {
  const { isVersionMode, context, workflow, execLog } = source;
  const { creationTaskEvents = [], activeRunDetailLoading = false } = workflow;
  const {
    historyHasMore = false,
    historyLoading = false,
    messages = [],
    skillDetailMap = {},
  } = execLog;

  return {
    isVersionMode,
    context,
    workflow: {
      ...workflow,
      activeRunDetailLoading,
      creationTaskEvents,
    },
    execLog: {
      ...execLog,
      historyHasMore,
      historyLoading,
      messages,
      skillDetailMap,
    },
  };
}
