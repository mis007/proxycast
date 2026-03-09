/**
 * @file Row 布局组件
 * @description 水平布局容器
 */

import type {
  RowComponent,
  A2UIComponent,
  A2UIFormData,
  A2UIEvent,
} from "../../types";
import { getComponentById } from "../../parser";
import { getA2UILayoutClasses } from "../../layoutTokens";
import { ComponentRenderer } from "../ComponentRenderer";

interface RowRendererProps {
  component: RowComponent;
  components: A2UIComponent[];
  data: Record<string, unknown>;
  formData: A2UIFormData;
  onFormChange: (id: string, value: unknown) => void;
  onAction: (event: A2UIEvent) => void;
}

export function RowRenderer({
  component,
  components,
  data,
  formData,
  onFormChange,
  onAction,
}: RowRendererProps) {
  const childIds = Array.isArray(component.children) ? component.children : [];

  return (
    <div
      className={getA2UILayoutClasses({
        direction: "row",
        justify: component.justify,
        align: component.align,
        defaultAlign: "start",
      })}
      style={{ gap: component.gap || 8 }}
    >
      {childIds.map((childId: string) => {
        const child = getComponentById(components, childId);
        if (!child) return null;
        return (
          <ComponentRenderer
            key={childId}
            component={child}
            components={components}
            data={data}
            formData={formData}
            onFormChange={onFormChange}
            onAction={onAction}
          />
        );
      })}
    </div>
  );
}
