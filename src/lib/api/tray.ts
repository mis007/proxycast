import { safeInvoke } from "@/lib/dev-bridge";

export const TRAY_MODEL_SELECTED_EVENT = "tray-model-selected";

export interface TrayQuickModelItem {
  provider_type: string;
  provider_label: string;
  model: string;
}

export interface TrayQuickModelGroup {
  provider_type: string;
  provider_label: string;
  models: TrayQuickModelItem[];
}

export interface TrayModelSelectedPayload {
  providerType: string;
  model: string;
}

export interface SyncTrayModelShortcutsPayload {
  current_model_provider_type: string;
  current_model_provider_label: string;
  current_model: string;
  current_theme_label: string;
  quick_model_groups: TrayQuickModelGroup[];
}

export async function syncTrayModelShortcuts(
  payload: SyncTrayModelShortcutsPayload,
): Promise<void> {
  await safeInvoke("sync_tray_model_shortcuts", {
    currentModelProviderType: payload.current_model_provider_type,
    currentModelProviderLabel: payload.current_model_provider_label,
    currentModel: payload.current_model,
    currentThemeLabel: payload.current_theme_label,
    quickModelGroups: payload.quick_model_groups,
  });
}

export const trayApi = {
  syncTrayModelShortcuts,
};
