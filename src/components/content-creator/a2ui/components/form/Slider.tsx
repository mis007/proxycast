/**
 * @file Slider 表单组件
 * @description 滑块
 */

import type { SliderComponent, A2UIFormData } from "../../types";
import { resolveDynamicValue } from "../../parser";
import { A2UI_FORM_TOKENS } from "../../taskFormTokens";

interface SliderRendererProps {
  component: SliderComponent;
  data: Record<string, unknown>;
  formData: A2UIFormData;
  onFormChange: (id: string, value: unknown) => void;
}

export function SliderRenderer({
  component,
  data,
  formData,
  onFormChange,
}: SliderRendererProps) {
  const label = component.label
    ? String(resolveDynamicValue(component.label, data, ""))
    : "";
  const value =
    (formData[component.id] as number) ??
    (resolveDynamicValue(component.value, data, component.min) as number);

  return (
    <div className={A2UI_FORM_TOKENS.fieldStack}>
      <div className={A2UI_FORM_TOKENS.sliderRow}>
        {label && <label className={A2UI_FORM_TOKENS.fieldLabel}>{label}</label>}
        {component.showValue !== false && (
          <span className={A2UI_FORM_TOKENS.sliderValue}>{value}</span>
        )}
      </div>
      <input
        type="range"
        min={component.min}
        max={component.max}
        step={component.step || 1}
        value={value}
        onChange={(e) => onFormChange(component.id, Number(e.target.value))}
        className={A2UI_FORM_TOKENS.sliderInput}
      />
      {component.marks && (
        <div className={A2UI_FORM_TOKENS.sliderMarks}>
          {component.marks.map((mark) => (
            <span key={mark.value}>{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
