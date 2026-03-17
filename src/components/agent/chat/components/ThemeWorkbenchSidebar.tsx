import React, { memo, useState } from "react";
import {
  ThemeWorkbenchSidebarShell,
  type ThemeWorkbenchSidebarTab,
} from "./ThemeWorkbenchSidebarShell";
import { ThemeWorkbenchSidebarPanels } from "./ThemeWorkbenchSidebarPanels";
import { buildThemeWorkbenchSidebarOrchestrationSource } from "./buildThemeWorkbenchSidebarOrchestrationSource";
import { createThemeWorkbenchSidebarOrchestrationInput } from "./themeWorkbenchSidebarOrchestrationContract";
import { type ThemeWorkbenchSidebarProps } from "./themeWorkbenchSidebarContract";
import { areThemeWorkbenchSidebarPropsEqual } from "./themeWorkbenchSidebarComparator";
import { useThemeWorkbenchSidebarOrchestration } from "./useThemeWorkbenchSidebarOrchestration";

function ThemeWorkbenchSidebarComponent({
  branchMode = "version",
  onRequestCollapse,
  headerActionSlot,
  topSlot,
  ...props
}: ThemeWorkbenchSidebarProps) {
  const [activeTab, setActiveTab] = useState<ThemeWorkbenchSidebarTab>("context");
  const isVersionMode = branchMode === "version";
  const orchestrationInput = createThemeWorkbenchSidebarOrchestrationInput(
    buildThemeWorkbenchSidebarOrchestrationSource({
      isVersionMode,
      props,
    }),
  );
  const {
    branchCount,
    activeContextCount,
    visibleExecLogCount,
    contextPanelProps,
    workflowPanelProps,
    execLogProps,
  } = useThemeWorkbenchSidebarOrchestration({
    activeTab,
    input: orchestrationInput,
  });

  return (
    <ThemeWorkbenchSidebarShell
      activeTab={activeTab}
      isVersionMode={isVersionMode}
      activeContextCount={activeContextCount}
      branchCount={branchCount}
      visibleExecLogCount={visibleExecLogCount}
      onTabChange={setActiveTab}
      onRequestCollapse={onRequestCollapse}
      headerActionSlot={headerActionSlot}
      topSlot={topSlot}
    >
      <ThemeWorkbenchSidebarPanels
        activeTab={activeTab}
        contextPanelProps={contextPanelProps}
        workflowPanelProps={workflowPanelProps}
        execLogProps={execLogProps}
      />
    </ThemeWorkbenchSidebarShell>
  );
}

export const ThemeWorkbenchSidebar = memo(
  ThemeWorkbenchSidebarComponent,
  areThemeWorkbenchSidebarPropsEqual,
);
