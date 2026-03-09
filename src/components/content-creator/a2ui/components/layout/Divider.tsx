/**
 * @file Divider 布局组件
 * @description 分隔线
 */

import type { DividerComponent } from "../../types";
import { cn } from "@/lib/utils";
import { A2UI_LAYOUT_TOKENS } from "../../layoutTokens";

interface DividerRendererProps {
  component: DividerComponent;
}

export function DividerRenderer({ component }: DividerRendererProps) {
  const isVertical = component.axis === "vertical";
  return (
    <div
      className={cn(
        A2UI_LAYOUT_TOKENS.dividerBase,
        isVertical
          ? A2UI_LAYOUT_TOKENS.dividerVertical
          : A2UI_LAYOUT_TOKENS.dividerHorizontal,
      )}
    />
  );
}
