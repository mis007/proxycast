/**
 * @file Text 展示组件
 * @description 文本显示
 */

import type { TextComponent } from "../../types";
import { resolveDynamicValue } from "../../parser";
import { A2UI_RENDERER_TOKENS } from "../../rendererTokens";

interface TextRendererProps {
  component: TextComponent;
  data: Record<string, unknown>;
}

export function TextRenderer({ component, data }: TextRendererProps) {
  const text = resolveDynamicValue(component.text, data, "");

  return (
    <div
      className={
        A2UI_RENDERER_TOKENS.textVariants[component.variant || "body"]
      }
    >
      {String(text)}
    </div>
  );
}
