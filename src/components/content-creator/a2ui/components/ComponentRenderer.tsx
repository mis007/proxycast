/**
 * @file 组件渲染器
 * @description 根据组件类型分发到对应的渲染器
 */

import type { A2UIComponent, A2UIFormData, A2UIEvent } from "../types";
import { resolveDynamicValue } from "../parser";

// 布局组件
import { RowRenderer } from "./layout/Row";
import { ColumnRenderer } from "./layout/Column";
import { CardRenderer } from "./layout/Card";
import { DividerRenderer } from "./layout/Divider";

// 展示组件
import { TextRenderer } from "./display/Text";
import { ButtonRenderer } from "./display/Button";

// 表单组件
import { TextFieldRenderer } from "./form/TextField";
import { CheckBoxRenderer } from "./form/CheckBox";
import { ChoicePickerRenderer } from "./form/ChoicePicker";
import { SliderRenderer } from "./form/Slider";

export interface ComponentRendererProps {
  component: A2UIComponent;
  components: A2UIComponent[];
  data: Record<string, unknown>;
  formData: A2UIFormData;
  onFormChange: (id: string, value: unknown) => void;
  onAction: (event: A2UIEvent) => void;
}

export function ComponentRenderer({
  component,
  components,
  data,
  formData,
  onFormChange,
  onAction,
}: ComponentRendererProps) {
  const isVisible =
    component.visible === undefined
      ? true
      : Boolean(
          resolveDynamicValue(
            component.visible as boolean | { path: string } | undefined,
            data,
            false,
          ),
        );

  if (!isVisible) {
    return null;
  }

  switch (component.component) {
    case "Row":
      return (
        <RowRenderer
          component={component}
          components={components}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
          onAction={onAction}
        />
      );
    case "Column":
      return (
        <ColumnRenderer
          component={component}
          components={components}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
          onAction={onAction}
        />
      );
    case "Card":
      return (
        <CardRenderer
          component={component}
          components={components}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
          onAction={onAction}
        />
      );
    case "Divider":
      return <DividerRenderer component={component} />;
    case "Text":
      return <TextRenderer component={component} data={data} />;
    case "Button":
      return (
        <ButtonRenderer
          component={component}
          components={components}
          data={data}
          onAction={onAction}
        />
      );
    case "TextField":
      return (
        <TextFieldRenderer
          component={component}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
        />
      );
    case "CheckBox":
      return (
        <CheckBoxRenderer
          component={component}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
        />
      );
    case "ChoicePicker":
      return (
        <ChoicePickerRenderer
          component={component}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
        />
      );
    case "Slider":
      return (
        <SliderRenderer
          component={component}
          data={data}
          formData={formData}
          onFormChange={onFormChange}
        />
      );
    default:
      return (
        <div className="text-yellow-500">
          未知组件: {(component as A2UIComponent).component}
        </div>
      );
  }
}
