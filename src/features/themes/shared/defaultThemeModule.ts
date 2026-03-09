import type { WorkspaceTheme } from "@/types/page";
import type { ThemeModule } from "@/features/themes/types";
import {
  DefaultMaterialPanel,
  DefaultPublishPanel,
  DefaultSettingsPanel,
  DefaultStylePanel,
  DefaultTemplatePanel,
} from "@/features/themes/shared/panelRenderers";

export function createDefaultThemeModule(theme: WorkspaceTheme): ThemeModule {
  return {
    theme,
    capabilities: {
      workspaceKind: "agent-chat",
    },
    navigation: {
      defaultView: "create",
      items: [
        { key: "create", label: "创作" },
        { key: "material", label: "素材" },
        { key: "template", label: "排版" },
        { key: "style", label: "风格" },
        { key: "publish", label: "发布" },
        { key: "settings", label: "设置" },
      ],
    },
    panelRenderers: {
      material: DefaultMaterialPanel,
      template: DefaultTemplatePanel,
      style: DefaultStylePanel,
      publish: DefaultPublishPanel,
      settings: DefaultSettingsPanel,
    },
  };
}
