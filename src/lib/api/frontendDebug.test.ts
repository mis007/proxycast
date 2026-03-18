import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeInvoke } from "@/lib/dev-bridge";
import { reportFrontendDebugLog } from "./frontendDebug";

vi.mock("@/lib/dev-bridge", () => ({
  safeInvoke: vi.fn(),
}));

describe("frontendDebug API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应代理前端调试日志上报命令", async () => {
    vi.mocked(safeInvoke).mockResolvedValueOnce(undefined);

    await expect(
      reportFrontendDebugLog({
        message: "AgentChatPage.loadData.start",
        category: "agent",
      }),
    ).resolves.toBeUndefined();
  });
});
