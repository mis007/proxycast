import { A2UIRenderer } from "@/components/content-creator/a2ui/components";
import type {
  A2UIFormData,
  A2UIResponse,
} from "@/components/content-creator/a2ui/types";
import {
  DEFAULT_A2UI_TASK_CARD_PRESET,
  type A2UITaskCardPreset,
} from "@/components/content-creator/a2ui/taskCardPresets";
import {
  A2UITaskCardBody,
  A2UITaskCardHeader,
  A2UITaskCardLoadingBody,
  A2UITaskCardShell,
} from "@/components/content-creator/a2ui/taskCardPrimitives";

export interface A2UITaskCardProps {
  response: A2UIResponse;
  onSubmit?: (formData: A2UIFormData) => void;
  onFormStateChange?: (formData: A2UIFormData) => void;
  formId?: string;
  initialFormData?: A2UIFormData;
  onFormChange?: (formId: string, formData: A2UIFormData) => void;
  submitDisabled?: boolean;
  className?: string;
  compact?: boolean;
  preset?: A2UITaskCardPreset;
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  footerText?: string;
  preview?: boolean;
}

interface A2UITaskLoadingCardProps {
  className?: string;
  compact?: boolean;
  preset?: A2UITaskCardPreset;
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  loadingText?: string;
}

function getCardCopy(
  compact: boolean,
  preset: A2UITaskCardPreset,
  title?: string,
  subtitle?: string,
) {
  return {
    title: title || preset.title,
    subtitle:
      subtitle ||
      (compact ? preset.subtitle.replace("当前对话。", "。") : preset.subtitle),
  };
}

export function A2UITaskCard({
  response,
  onSubmit,
  onFormStateChange,
  formId,
  initialFormData,
  onFormChange,
  submitDisabled = false,
  className,
  compact = false,
  preset = DEFAULT_A2UI_TASK_CARD_PRESET,
  title,
  subtitle,
  statusLabel = preset.statusLabel,
  footerText,
  preview = false,
}: A2UITaskCardProps) {
  const copy = getCardCopy(compact, preset, title, subtitle);

  return (
    <A2UITaskCardShell
      compact={compact}
      className={className}
      preview={preview}
      testId="agent-a2ui-task-card"
    >
      <A2UITaskCardHeader
        title={copy.title}
        subtitle={copy.subtitle}
        compact={compact}
        statusLabel={statusLabel}
      />

      <A2UITaskCardBody compact={compact}>
        <A2UIRenderer
          response={response}
          onSubmit={onSubmit}
          onFormStateChange={onFormStateChange}
          formId={formId}
          initialFormData={initialFormData}
          onFormChange={onFormChange}
          submitDisabled={submitDisabled}
          submitButtonClassName="w-full"
          className={compact ? "space-y-3" : "space-y-4"}
        />
      </A2UITaskCardBody>

      {footerText ? (
        <div className="mt-3 text-xs text-slate-500">{footerText}</div>
      ) : null}
    </A2UITaskCardShell>
  );
}

export function A2UITaskLoadingCard({
  className,
  compact = false,
  preset = DEFAULT_A2UI_TASK_CARD_PRESET,
  title,
  subtitle,
  statusLabel = preset.statusLabel,
  loadingText = preset.loadingText || DEFAULT_A2UI_TASK_CARD_PRESET.loadingText,
}: A2UITaskLoadingCardProps) {
  const copy = getCardCopy(compact, preset, title, subtitle);

  return (
    <A2UITaskCardShell
      compact={compact}
      className={className}
      testId="agent-a2ui-task-loading-card"
    >
      <A2UITaskCardHeader
        title={copy.title}
        subtitle={copy.subtitle}
        compact={compact}
        statusLabel={statusLabel}
      />

      <A2UITaskCardLoadingBody
        compact={compact}
        text={loadingText || ""}
      />
    </A2UITaskCardShell>
  );
}

export default A2UITaskCard;
