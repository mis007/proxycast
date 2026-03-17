import type { ComponentProps } from "react";
import { ThemeWorkbenchContextPanel } from "./ThemeWorkbenchContextPanel";
import { ThemeWorkbenchExecLog } from "./ThemeWorkbenchExecLog";
import { ThemeWorkbenchWorkflowPanel } from "./ThemeWorkbenchWorkflowPanel";

export type ThemeWorkbenchSidebarContextPanelProps = ComponentProps<
  typeof ThemeWorkbenchContextPanel
>;

export type ThemeWorkbenchSidebarWorkflowPanelProps = ComponentProps<
  typeof ThemeWorkbenchWorkflowPanel
>;

export type ThemeWorkbenchSidebarExecLogProps = ComponentProps<
  typeof ThemeWorkbenchExecLog
>;

export interface ThemeWorkbenchSidebarContentProps {
  contextPanelProps: ThemeWorkbenchSidebarContextPanelProps;
  workflowPanelProps: ThemeWorkbenchSidebarWorkflowPanelProps;
  execLogProps: ThemeWorkbenchSidebarExecLogProps;
}
