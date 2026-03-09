import { afterEach, describe, expect, it, vi } from "vitest";
import { A2UIRenderer } from "./index";
import { TextRenderer } from "./display/Text";
import { A2UI_RENDERER_TOKENS } from "../rendererTokens";
import {
  cleanupMountedRoots,
  clickButtonByText,
  mountHarness,
  setupReactActEnvironment,
  type MountedRoot,
} from "@/components/workspace/hooks/testUtils";

setupReactActEnvironment();

describe("A2UIRenderer", () => {
  const mountedRoots: MountedRoot[] = [];

  afterEach(() => {
    cleanupMountedRoots(mountedRoots);
    vi.clearAllMocks();
  });

  it("应使用统一容器与提交按钮样式，并支持禁用提交", () => {
    const submitSpy = vi.fn();
    const { container } = mountHarness(
      A2UIRenderer,
      {
        response: {
          id: "demo",
          root: "root",
          thinking: "这是推理提示",
          data: {},
          components: [
            {
              id: "content",
              component: "Text",
              text: "请选择开始方式",
              variant: "body",
            },
            {
              id: "root",
              component: "Column",
              children: ["content"],
              gap: 12,
              align: "stretch",
            },
          ],
          submitAction: {
            label: "开始处理",
            action: { name: "submit" },
          },
        },
        submitDisabled: true,
        onSubmit: submitSpy,
      },
      mountedRoots,
    );

    const root = container.querySelector(".a2ui-container") as HTMLDivElement | null;
    expect(root?.className).toContain("space-y-4");
    expect(container.textContent).toContain("这是推理提示");
    const submitButton = clickButtonByText(container, "开始处理");
    expect(submitButton?.className).toContain("rounded-xl");
    expect(submitButton?.disabled).toBe(true);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("找不到根组件时应显示统一错误样式", () => {
    const { container } = mountHarness(
      A2UIRenderer,
      {
        response: {
          id: "missing-root",
          root: "unknown",
          data: {},
          components: [],
        },
      },
      mountedRoots,
    );

    const errorNode = container.querySelector("div");
    expect(errorNode?.className).toBe(A2UI_RENDERER_TOKENS.errorText);
    expect(container.textContent).toContain("错误：找不到根组件 unknown");
  });
});

describe("TextRenderer", () => {
  const mountedRoots: MountedRoot[] = [];

  afterEach(() => {
    cleanupMountedRoots(mountedRoots);
  });

  it("应使用统一文本 variant token", () => {
    const { container } = mountHarness(
      TextRenderer,
      {
        component: {
          id: "caption",
          component: "Text",
          text: "辅助说明",
          variant: "caption",
        },
        data: {},
      },
      mountedRoots,
    );

    const textNode = container.querySelector("div");
    expect(textNode?.className).toBe(A2UI_RENDERER_TOKENS.textVariants.caption);
    expect(container.textContent).toContain("辅助说明");
  });
});
