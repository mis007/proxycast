import React from "react";
import { ChatModelSelector } from "../../ChatModelSelector";

interface InputbarModelExtraProps {
  isFullscreen?: boolean;
  isThemeWorkbenchVariant?: boolean;
  providerType?: string;
  setProviderType?: (type: string) => void;
  model?: string;
  setModel?: (model: string) => void;
  activeTheme?: string;
  onManageProviders?: () => void;
}

const NOOP_SET_PROVIDER_TYPE = (_type: string) => {};
const NOOP_SET_MODEL = (_model: string) => {};

export const InputbarModelExtra: React.FC<InputbarModelExtraProps> = ({
  isFullscreen = false,
  isThemeWorkbenchVariant = false,
  providerType,
  setProviderType,
  model,
  setModel,
  activeTheme,
  onManageProviders,
}) => {
  if (isFullscreen || isThemeWorkbenchVariant || !providerType || !model) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <ChatModelSelector
        providerType={providerType}
        setProviderType={setProviderType || NOOP_SET_PROVIDER_TYPE}
        model={model}
        setModel={setModel || NOOP_SET_MODEL}
        activeTheme={activeTheme}
        compactTrigger
        popoverSide="top"
        onManageProviders={onManageProviders}
      />
    </div>
  );
};
