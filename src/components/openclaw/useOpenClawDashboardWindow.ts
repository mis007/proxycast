import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { openclawApi, type OpenClawGatewayStatus } from "@/lib/api/openclaw";
import {
  closeOpenClawDashboardWindow,
  focusOpenClawDashboardWindow,
  isOpenClawDashboardWindowOpen,
  openOpenClawDashboardWindow,
  reloadOpenClawDashboardWindow,
} from "@/lib/api/openclawDashboardWindow";
import { openUrl } from "./openUrl";

interface UseOpenClawDashboardWindowOptions {
  gatewayStatus: OpenClawGatewayStatus;
}

export function useOpenClawDashboardWindow({
  gatewayStatus,
}: UseOpenClawDashboardWindowOptions) {
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardWindowOpen, setDashboardWindowOpen] = useState(false);
  const [dashboardWindowBusy, setDashboardWindowBusy] = useState(false);

  const refreshDashboardUrl = useCallback(
    async ({ silent = true, showLoading = false } = {}) => {
      if (showLoading) {
        setDashboardLoading(true);
      }

      try {
        const url = await openclawApi.getDashboardUrl();
        setDashboardUrl(url);
        return url;
      } catch (error) {
        if (!silent) {
          toast.error(error instanceof Error ? error.message : String(error));
        }
        return null;
      } finally {
        if (showLoading) {
          setDashboardLoading(false);
        }
      }
    },
    [],
  );

  const refreshDashboardWindowState = useCallback(async () => {
    try {
      const opened = await isOpenClawDashboardWindowOpen();
      setDashboardWindowOpen(opened);
      return opened;
    } catch (error) {
      console.warn("[OpenClaw] 查询 Dashboard 窗口状态失败:", error);
      setDashboardWindowOpen(false);
      return false;
    }
  }, []);

  const resolveDashboardUrl = useCallback(async () => {
    return dashboardUrl ??
      (await refreshDashboardUrl({
        silent: false,
        showLoading: true,
      }));
  }, [dashboardUrl, refreshDashboardUrl]);

  const handleOpenDashboardWindow = useCallback(async () => {
    const url = await resolveDashboardUrl();
    if (!url) {
      return false;
    }

    setDashboardWindowBusy(true);
    try {
      const result = await openOpenClawDashboardWindow(url);
      await refreshDashboardWindowState();
      toast.success(result.reused ? "Dashboard 桌面面板已聚焦。" : "Dashboard 桌面面板已打开。");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setDashboardWindowBusy(false);
    }
  }, [refreshDashboardWindowState, resolveDashboardUrl]);

  const handleFocusDashboardWindow = useCallback(async () => {
    setDashboardWindowBusy(true);
    try {
      const focused = await focusOpenClawDashboardWindow();
      if (!focused) {
        toast.error("Dashboard 桌面面板尚未打开。");
        await refreshDashboardWindowState();
        return false;
      }

      toast.success("Dashboard 桌面面板已聚焦。");
      await refreshDashboardWindowState();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setDashboardWindowBusy(false);
    }
  }, [refreshDashboardWindowState]);

  const handleReloadDashboardWindow = useCallback(async () => {
    const url = await refreshDashboardUrl({
      silent: false,
      showLoading: true,
    });
    if (!url) {
      return false;
    }

    setDashboardWindowBusy(true);
    try {
      const reloaded = await reloadOpenClawDashboardWindow(url);
      if (reloaded) {
        toast.success("Dashboard 桌面面板已重载。");
      } else {
        const result = await openOpenClawDashboardWindow(url);
        toast.success(result.reused ? "Dashboard 桌面面板已聚焦。" : "Dashboard 桌面面板已打开。");
      }
      await refreshDashboardWindowState();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setDashboardWindowBusy(false);
    }
  }, [refreshDashboardUrl, refreshDashboardWindowState]);

  const handleCloseDashboardWindow = useCallback(async () => {
    setDashboardWindowBusy(true);
    try {
      const closed = await closeOpenClawDashboardWindow();
      if (closed) {
        toast.success("Dashboard 桌面面板已关闭。");
      }
      await refreshDashboardWindowState();
      return closed;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setDashboardWindowBusy(false);
    }
  }, [refreshDashboardWindowState]);

  const closeDashboardWindowSilently = useCallback(async () => {
    setDashboardWindowOpen(false);
    try {
      await closeOpenClawDashboardWindow();
    } catch (error) {
      console.warn("[OpenClaw] 关闭 Dashboard 窗口失败:", error);
    }
  }, []);

  const handleRefreshDashboardStatus = useCallback(async () => {
    setDashboardWindowBusy(true);
    try {
      await Promise.all([
        refreshDashboardUrl({
          silent: false,
          showLoading: true,
        }),
        refreshDashboardWindowState(),
      ]);
      toast.success("Dashboard 状态已刷新。");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setDashboardWindowBusy(false);
    }
  }, [refreshDashboardUrl, refreshDashboardWindowState]);

  const handleOpenDashboardExternal = useCallback(async () => {
    const url = await resolveDashboardUrl();
    if (url) {
      await openUrl(url);
      return true;
    }
    return false;
  }, [resolveDashboardUrl]);

  useEffect(() => {
    if (gatewayStatus !== "running" && gatewayStatus !== "starting") {
      void closeDashboardWindowSilently();
      return;
    }

    void refreshDashboardWindowState();

    const syncWindowState = () => {
      void refreshDashboardWindowState();
    };

    const onFocus = () => {
      syncWindowState();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncWindowState();
      }
    };

    const timer = window.setInterval(syncWindowState, 5000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    closeDashboardWindowSilently,
    gatewayStatus,
    refreshDashboardWindowState,
  ]);

  return {
    dashboardLoading,
    dashboardUrl,
    dashboardWindowBusy,
    dashboardWindowOpen,
    refreshDashboardUrl,
    refreshDashboardWindowState,
    handleOpenDashboardWindow,
    handleFocusDashboardWindow,
    handleReloadDashboardWindow,
    handleCloseDashboardWindow,
    handleRefreshDashboardStatus,
    handleOpenDashboardExternal,
    closeDashboardWindowSilently,
  };
}

export type UseOpenClawDashboardWindowReturn = ReturnType<
  typeof useOpenClawDashboardWindow
>;
