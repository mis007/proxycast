import { afterEach, describe, expect, it, vi } from "vitest";
import { RowRenderer } from "./Row";
import { ColumnRenderer } from "./Column";
import { CardRenderer } from "./Card";
import { DividerRenderer } from "./Divider";
import { A2UI_LAYOUT_TOKENS } from "../../layoutTokens";
import {
  cleanupMountedRoots,
  mountHarness,
  setupReactActEnvironment,
  type MountedRoot,
} from "@/components/workspace/hooks/testUtils";

setupReactActEnvironment();

describe("A2UI 布局组件", () => {
  const mountedRoots: MountedRoot[] = [];

  afterEach(() => {
    cleanupMountedRoots(mountedRoots);
    vi.clearAllMocks();
  });

  const baseRendererProps = {
    data: {},
    formData: {},
    onFormChange: vi.fn(),
    onAction: vi.fn(),
  };

  it("Row 应使用统一布局类并渲染子组件", () => {
    const { container } = mountHarness(
      RowRenderer,
      {
        component: {
          id: "row",
          component: "Row",
          children: ["text"],
          justify: "center",
          align: "start",
          gap: 8,
        },
        components: [
          {
            id: "text",
            component: "Text",
            text: "行布局内容",
            variant: "body",
          },
        ],
        ...baseRendererProps,
      },
      mountedRoots,
    );

    const row = container.querySelector("div");
    expect(row?.className).toContain(A2UI_LAYOUT_TOKENS.flexBase);
    expect(row?.className).toContain(A2UI_LAYOUT_TOKENS.rowDirection);
    expect(container.textContent).toContain("行布局内容");
  });

  it("Column 应使用统一布局类并渲染子组件", () => {
    const { container } = mountHarness(
      ColumnRenderer,
      {
        component: {
          id: "column",
          component: "Column",
          children: ["text"],
          justify: "start",
          align: "stretch",
          gap: 12,
        },
        components: [
          {
            id: "text",
            component: "Text",
            text: "列布局内容",
            variant: "body",
          },
        ],
        ...baseRendererProps,
      },
      mountedRoots,
    );

    const column = container.querySelector("div");
    expect(column?.className).toContain(A2UI_LAYOUT_TOKENS.flexBase);
    expect(column?.className).toContain(A2UI_LAYOUT_TOKENS.columnDirection);
    expect(container.textContent).toContain("列布局内容");
  });

  it("Card 应使用统一卡片样式包裹子组件", () => {
    const { container } = mountHarness(
      CardRenderer,
      {
        component: {
          id: "card",
          component: "Card",
          child: "text",
        },
        components: [
          {
            id: "text",
            component: "Text",
            text: "卡片内容",
            variant: "body",
          },
        ],
        ...baseRendererProps,
      },
      mountedRoots,
    );

    const card = container.querySelector("div");
    expect(card?.className).toBe(A2UI_LAYOUT_TOKENS.cardShell);
    expect(container.textContent).toContain("卡片内容");
  });

  it("Divider 应使用统一分隔线样式", () => {
    const { container } = mountHarness(
      DividerRenderer,
      {
        component: {
          id: "divider",
          component: "Divider",
          axis: "vertical",
        },
      },
      mountedRoots,
    );

    const divider = container.querySelector("div");
    expect(divider?.className).toContain(A2UI_LAYOUT_TOKENS.dividerBase);
    expect(divider?.className).toContain(A2UI_LAYOUT_TOKENS.dividerVertical);
  });
});
