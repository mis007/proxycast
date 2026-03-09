/**
 * @file CheckBox 表单组件
 * @description 复选框
 */

import type { CheckBoxComponent, A2UIFormData } from "../../types";
import { resolveDynamicValue } from "../../parser";
import { A2UI_FORM_TOKENS } from "../../taskFormTokens";

interface CheckBoxRendererProps {
  component: CheckBoxComponent;
  data: Record<string, unknown>;
  formData: A2UIFormData;
  onFormChange: (id: string, value: unknown) => void;
}

export function CheckBoxRenderer({
  component,
  data,
  formData,
  onFormChange,
}: CheckBoxRendererProps) {
  const label = String(resolveDynamicValue(component.label, data, ""));
  const checked =
    (formData[component.id] as boolean) ??
    Boolean(resolveDynamicValue(component.value, data, false));

  return (
    <label className={A2UI_FORM_TOKENS.checkboxRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onFormChange(component.id, e.target.checked)}
        className={A2UI_FORM_TOKENS.checkboxInput}
      />
      <span className={A2UI_FORM_TOKENS.checkboxText}>{label}</span>
    </label>
  );
}
