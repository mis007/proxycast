import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeInvoke } from "@/lib/dev-bridge";
import {
  invalidateProviderPoolOverviewCache,
  providerPoolApi,
} from "./providerPool";

vi.mock("@/lib/dev-bridge", () => ({
  safeInvoke: vi.fn(),
}));

describe("providerPool API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateProviderPoolOverviewCache();
  });

  it("getOverview 应缓存并复用同一轮读取结果", async () => {
    vi.mocked(safeInvoke).mockResolvedValueOnce([
      {
        provider_type: "kiro",
        stats: {
          total: 1,
          healthy: 1,
          unhealthy: 0,
          disabled: 0,
          total_usage: 0,
          total_errors: 0,
        },
        credentials: [
          {
            uuid: "cred-1",
            provider_type: "kiro",
            credential_type: "kiro_oauth",
            display_credential: "kiro",
            is_healthy: true,
            is_disabled: false,
            check_health: true,
            not_supported_models: [],
            usage_count: 0,
            error_count: 0,
            created_at: "",
            updated_at: "",
            source: "manual",
          },
        ],
      },
    ]);

    const [first, second] = await Promise.all([
      providerPoolApi.getOverview(),
      providerPoolApi.getOverview(),
    ]);

    expect(vi.mocked(safeInvoke)).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("forceRefresh 应绕过概览缓存", async () => {
    vi.mocked(safeInvoke)
      .mockResolvedValueOnce([
        {
          provider_type: "kiro",
          stats: {
            total: 1,
            healthy: 1,
            unhealthy: 0,
            disabled: 0,
            total_usage: 0,
            total_errors: 0,
          },
          credentials: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          provider_type: "gemini",
          stats: {
            total: 2,
            healthy: 2,
            unhealthy: 0,
            disabled: 0,
            total_usage: 0,
            total_errors: 0,
          },
          credentials: [],
        },
      ]);

    await expect(providerPoolApi.getOverview()).resolves.toEqual([
      expect.objectContaining({ provider_type: "kiro" }),
    ]);
    await expect(
      providerPoolApi.getOverview({ forceRefresh: true }),
    ).resolves.toEqual([expect.objectContaining({ provider_type: "gemini" })]);

    expect(vi.mocked(safeInvoke)).toHaveBeenCalledTimes(2);
  });

  it("写操作成功后应失效概览缓存", async () => {
    vi.mocked(safeInvoke)
      .mockResolvedValueOnce([
        {
          provider_type: "openai",
          stats: {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            disabled: 0,
            total_usage: 0,
            total_errors: 0,
          },
          credentials: [],
        },
      ])
      .mockResolvedValueOnce({ uuid: "cred-2" })
      .mockResolvedValueOnce([
        {
          provider_type: "openai",
          stats: {
            total: 1,
            healthy: 1,
            unhealthy: 0,
            disabled: 0,
            total_usage: 0,
            total_errors: 0,
          },
          credentials: [
            {
              uuid: "cred-2",
              provider_type: "openai",
              credential_type: "openai_key",
              display_credential: "sk-***",
              is_healthy: true,
              is_disabled: false,
              check_health: true,
              not_supported_models: [],
              usage_count: 0,
              error_count: 0,
              created_at: "",
              updated_at: "",
              source: "manual",
            },
          ],
        },
      ]);

    await providerPoolApi.getOverview();
    await providerPoolApi.addOpenAIKey("sk-test");
    await expect(providerPoolApi.getOverview()).resolves.toEqual([
      expect.objectContaining({
        stats: expect.objectContaining({ total: 1 }),
      }),
    ]);

    expect(vi.mocked(safeInvoke)).toHaveBeenCalledTimes(3);
  });
});
