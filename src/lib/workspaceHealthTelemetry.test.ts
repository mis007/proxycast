import { afterEach, describe, expect, it } from "vitest";
import {
  clearWorkspaceRepairHistory,
  getWorkspaceRepairHistory,
  recordWorkspaceRepair,
} from "./workspaceHealthTelemetry";

describe("workspaceHealthTelemetry", () => {
  afterEach(() => {
    clearWorkspaceRepairHistory();
  });

  it("应记录并读取修复历史（新记录优先）", () => {
    recordWorkspaceRepair({
      workspaceId: "ws-1",
      rootPath: "/tmp/ws-1",
      source: "app_startup",
    });
    recordWorkspaceRepair({
      workspaceId: "ws-2",
      rootPath: "/tmp/ws-2",
      source: "workspace_set_default",
    });

    const history = getWorkspaceRepairHistory();
    expect(history.length).toBe(2);
    expect(history[0].workspace_id).toBe("ws-2");
    expect(history[1].workspace_id).toBe("ws-1");
  });

  it("应限制最大记录条数为 50", () => {
    for (let i = 1; i <= 55; i += 1) {
      recordWorkspaceRepair({
        workspaceId: `ws-${i}`,
        rootPath: `/tmp/ws-${i}`,
        source: "workspace_refresh",
      });
    }

    const history = getWorkspaceRepairHistory();
    expect(history.length).toBe(50);
    expect(history[0].workspace_id).toBe("ws-55");
    expect(history[49].workspace_id).toBe("ws-6");
  });
});
