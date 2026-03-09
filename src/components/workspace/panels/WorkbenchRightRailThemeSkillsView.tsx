import { ThemeWorkbenchSkillsPanel } from "@/components/agent/chat/components/ThemeWorkbenchSkillsPanel";
import type { WorkbenchThemeSkillsRailState } from "@/stores/useWorkbenchStore";

export function WorkbenchRightRailThemeSkillsView({
  themeSkillsRailState,
  onTriggerSkill,
  onRequestCollapse,
}: {
  themeSkillsRailState: WorkbenchThemeSkillsRailState;
  onTriggerSkill: (skillKey: string) => void;
  onRequestCollapse: () => void;
}) {
  return (
    <ThemeWorkbenchSkillsPanel
      skills={themeSkillsRailState.skills}
      currentGate={{
        key: "idle",
        title: "就绪",
        status: themeSkillsRailState.isAutoRunning ? "running" : "idle",
        description: themeSkillsRailState.isAutoRunning
          ? "AI 正在执行任务..."
          : "选择技能开始创作",
      }}
      disabled={themeSkillsRailState.isAutoRunning}
      onTriggerSkill={(skill) => onTriggerSkill(skill.key)}
      onRequestCollapse={onRequestCollapse}
    />
  );
}
