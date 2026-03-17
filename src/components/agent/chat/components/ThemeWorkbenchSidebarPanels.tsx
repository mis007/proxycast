import { ThemeWorkbenchContextPanel } from "./ThemeWorkbenchContextPanel";
import { ThemeWorkbenchExecLog } from "./ThemeWorkbenchExecLog";
import { ThemeWorkbenchWorkflowPanel } from "./ThemeWorkbenchWorkflowPanel";
import type { ThemeWorkbenchSidebarTab } from "./ThemeWorkbenchSidebarShell";
import type { ThemeWorkbenchSidebarContentProps } from "./themeWorkbenchSidebarContentContract";

export interface ThemeWorkbenchSidebarPanelsProps
  extends ThemeWorkbenchSidebarContentProps {
  activeTab: ThemeWorkbenchSidebarTab;
}

export function ThemeWorkbenchSidebarPanels({
  activeTab,
  contextPanelProps,
  workflowPanelProps,
  execLogProps,
}: ThemeWorkbenchSidebarPanelsProps) {
  if (activeTab === "context") {
    return <ThemeWorkbenchContextPanel {...contextPanelProps} />;
  }
  if (activeTab === "workflow") {
    return <ThemeWorkbenchWorkflowPanel {...workflowPanelProps} />;
  }
  if (activeTab === "log") {
    return <ThemeWorkbenchExecLog {...execLogProps} />;
  }
  return null;
}
