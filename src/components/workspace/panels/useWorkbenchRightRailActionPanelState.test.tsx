import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanupMountedRoots,
  flushEffects,
  mountHarness,
  setupReactActEnvironment,
  type MountedRoot,
} from "../hooks/testUtils";
import { useWorkbenchRightRailActionPanelState } from "./useWorkbenchRightRailActionPanelState";

setupReactActEnvironment();

const mountedRoots: MountedRoot[] = [];

function HookHarness(props: {
  initialStyleGuideDialogOpen?: boolean;
  onInitialStyleGuideDialogConsumed?: () => void;
  initialStyleGuideSourceEntryId?: string | null;
  onInitialStyleGuideSourceEntryConsumed?: () => void;
}) {
  const state = useWorkbenchRightRailActionPanelState({
    initialStyleGuideDialogOpen: props.initialStyleGuideDialogOpen,
    onInitialStyleGuideDialogConsumed: props.onInitialStyleGuideDialogConsumed,
    initialStyleGuideSourceEntryId: props.initialStyleGuideSourceEntryId,
    onInitialStyleGuideSourceEntryConsumed:
      props.onInitialStyleGuideSourceEntryConsumed,
  });

  useEffect(() => {
    document.body.setAttribute(
      "data-style-guide-open",
      state.styleGuideDialogOpen ? "true" : "false",
    );
    document.body.setAttribute(
      "data-style-guide-source-entry-id",
      state.styleGuideSourceEntryId || "",
    );
  }, [state.styleGuideDialogOpen, state.styleGuideSourceEntryId]);

  return null;
}

describe("useWorkbenchRightRailActionPanelState", () => {
  afterEach(() => {
    cleanupMountedRoots(mountedRoots);
    document.body.removeAttribute("data-style-guide-open");
    document.body.removeAttribute("data-style-guide-source-entry-id");
  });

  it("应按初始参数自动打开项目风格策略并消费一次", async () => {
    const consumedSpy = vi.fn();
    const { rerender } = mountHarness(
      HookHarness,
      {
        initialStyleGuideDialogOpen: true,
        onInitialStyleGuideDialogConsumed: consumedSpy,
      },
      mountedRoots,
    );

    await flushEffects();

    expect(document.body.getAttribute("data-style-guide-open")).toBe("true");
    expect(consumedSpy).toHaveBeenCalledTimes(1);

    rerender({
      initialStyleGuideDialogOpen: false,
      onInitialStyleGuideDialogConsumed: consumedSpy,
    });

    await flushEffects();

    expect(document.body.getAttribute("data-style-guide-open")).toBe("true");
    expect(consumedSpy).toHaveBeenCalledTimes(1);
  });

  it("应按初始参数注入来源风格资产 ID 并消费一次", async () => {
    const consumedSpy = vi.fn();

    mountHarness(
      HookHarness,
      {
        initialStyleGuideSourceEntryId: "entry-42",
        onInitialStyleGuideSourceEntryConsumed: consumedSpy,
      },
      mountedRoots,
    );

    await flushEffects();

    expect(document.body.getAttribute("data-style-guide-source-entry-id")).toBe(
      "entry-42",
    );
    expect(consumedSpy).toHaveBeenCalledTimes(1);
  });
});
