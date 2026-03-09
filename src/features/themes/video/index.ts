import type { ThemeModule } from "@/features/themes/types";
import { VideoThemeWorkspace } from "@/features/themes/video/VideoThemeWorkspace";
import {
  DefaultMaterialPanel,
  DefaultPublishPanel,
  DefaultSettingsPanel,
  DefaultStylePanel,
  DefaultTemplatePanel,
} from "@/features/themes/shared/panelRenderers";

export const videoThemeModule: ThemeModule = {
  theme: "video",
  capabilities: {
    workspaceKind: "video-canvas",
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
  primaryWorkspaceRenderer: VideoThemeWorkspace,
  workspaceRenderer: VideoThemeWorkspace,
  panelRenderers: {
    material: DefaultMaterialPanel,
    template: DefaultTemplatePanel,
    style: DefaultStylePanel,
    publish: DefaultPublishPanel,
    settings: DefaultSettingsPanel,
  },
};
