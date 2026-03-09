import { beforeEach, describe, expect, it } from "vitest";
import {
  getStyleLibraryApplicationHistory,
  recordStyleLibraryApplication,
  STYLE_LIBRARY_APPLICATION_HISTORY_KEY,
} from "./style-library";

describe("style-library application history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("应记录最近应用项目，并按时间倒序返回", () => {
    recordStyleLibraryApplication({
      projectId: "project-1",
      entryId: "entry-1",
      entryName: "风格 A",
    });
    recordStyleLibraryApplication({
      projectId: "project-2",
      entryId: "entry-2",
      entryName: "风格 B",
    });

    const history = getStyleLibraryApplicationHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.projectId).toBe("project-2");
    expect(history[1]?.projectId).toBe("project-1");
  });

  it("重复应用同一项目和风格时应只保留最新一条", () => {
    recordStyleLibraryApplication({
      projectId: "project-1",
      entryId: "entry-1",
      entryName: "风格 A",
    });
    recordStyleLibraryApplication({
      projectId: "project-1",
      entryId: "entry-1",
      entryName: "风格 A",
    });

    const history = getStyleLibraryApplicationHistory();
    expect(history).toHaveLength(1);

    const stored = window.localStorage.getItem(
      STYLE_LIBRARY_APPLICATION_HISTORY_KEY,
    );
    expect(stored).not.toBeNull();
  });
});
