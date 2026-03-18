import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getOverview,
  getProviders,
  getModelRegistry,
  getAllAliasConfigs,
  syncTrayModelShortcuts,
} = vi.hoisted(() => ({
  getOverview: vi.fn(),
  getProviders: vi.fn(),
  getModelRegistry: vi.fn(),
  getAllAliasConfigs: vi.fn(),
  syncTrayModelShortcuts: vi.fn(),
}));

vi.mock("@/lib/api/providerPool", () => ({
  providerPoolApi: {
    getOverview,
  },
}));

vi.mock("@/lib/api/apiKeyProvider", () => ({
  apiKeyProviderApi: {
    getProviders,
  },
}));

vi.mock("@/lib/api/modelRegistry", () => ({
  modelRegistryApi: {
    getModelRegistry,
    getAllAliasConfigs,
  },
}));

vi.mock("@/lib/api/tray", () => ({
  TRAY_MODEL_SELECTED_EVENT: "tray-model-selected",
  trayApi: {
    syncTrayModelShortcuts,
  },
}));

vi.mock("@/lib/constants/providerMappings", () => ({
  getAliasConfigKey: (provider: string) => provider,
  getProviderLabel: (provider: string) => `label:${provider}`,
  getRegistryIdFromType: (provider: string) => provider,
  isAliasProvider: () => false,
}));

vi.mock("../utils/modelThemePolicy", () => ({
  filterModelsByTheme: (_theme: string | undefined, models: unknown[]) => ({
    models,
  }),
}));

vi.mock("../utils/providerModelCompatibility", () => ({
  getProviderModelCompatibilityIssue: () => null,
}));

import {
  buildTrayPayload,
  invalidateTrayPayloadCache,
  syncTrayModelShortcutsState,
} from "./useTrayModelShortcuts";

describe("buildTrayPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateTrayPayloadCache();

    getOverview.mockResolvedValue([
      {
        provider_type: "deepseek",
        credentials: [{ credential_type: "deepseek" }],
      },
    ]);
    getProviders.mockResolvedValue([
      {
        id: "deepseek",
        name: "DeepSeek",
        type: "deepseek",
        enabled: true,
        api_key_count: 1,
        custom_models: [],
      },
    ]);
    getModelRegistry.mockResolvedValue([
      {
        id: "deepseek-chat",
        display_name: "DeepSeek Chat",
        provider_id: "deepseek",
        provider_name: "DeepSeek",
        is_latest: true,
        release_date: "2026-01-01",
      },
    ]);
    getAllAliasConfigs.mockResolvedValue({});
    syncTrayModelShortcuts.mockResolvedValue(undefined);
  });

  it("相同签名的 payload 会复用缓存，避免重复拉取数据", async () => {
    const first = await buildTrayPayload("deepseek", "deepseek-chat", "general");
    const second = await buildTrayPayload(
      "deepseek",
      "deepseek-chat",
      "general",
    );

    expect(second).toEqual(first);
    expect(getOverview).toHaveBeenCalledTimes(1);
    expect(getProviders).toHaveBeenCalledTimes(1);
    expect(getModelRegistry).toHaveBeenCalledTimes(1);
    expect(getAllAliasConfigs).toHaveBeenCalledTimes(1);
  });

  it("强制刷新会绕过缓存重新拉取数据", async () => {
    await buildTrayPayload("deepseek", "deepseek-chat", "general");
    await buildTrayPayload("deepseek", "deepseek-chat", "general", {
      forceRefresh: true,
    });

    expect(getOverview).toHaveBeenCalledTimes(2);
    expect(getProviders).toHaveBeenCalledTimes(2);
    expect(getModelRegistry).toHaveBeenCalledTimes(2);
    expect(getAllAliasConfigs).toHaveBeenCalledTimes(2);
  });

  it("相同 payload 重复同步时应跳过重复托盘写入", async () => {
    await syncTrayModelShortcutsState("deepseek", "deepseek-chat", "general");
    await syncTrayModelShortcutsState("deepseek", "deepseek-chat", "general");

    expect(syncTrayModelShortcuts).toHaveBeenCalledTimes(1);
  });

  it("首次同步失败时不应缓存成功指纹，后续重试仍应继续同步", async () => {
    syncTrayModelShortcuts
      .mockRejectedValueOnce(new Error("tray unavailable"))
      .mockResolvedValueOnce(undefined);

    await expect(
      syncTrayModelShortcutsState("deepseek", "deepseek-chat", "general"),
    ).rejects.toThrow("tray unavailable");
    await expect(
      syncTrayModelShortcutsState("deepseek", "deepseek-chat", "general"),
    ).resolves.toBeUndefined();

    expect(syncTrayModelShortcuts).toHaveBeenCalledTimes(2);
  });
});
