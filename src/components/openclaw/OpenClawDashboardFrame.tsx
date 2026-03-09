import { useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  SquareTerminal,
} from "lucide-react";

interface OpenClawDashboardFrameProps {
  dashboardUrl: string | null;
  loading: boolean;
  reloadToken: number;
  running: boolean;
  windowBusy?: boolean;
  onOpenExternal: () => void;
  onOpenWindow?: () => void;
  onReload: () => void;
}

export function OpenClawDashboardFrame({
  dashboardUrl,
  loading,
  reloadToken,
  running,
  windowBusy = false,
  onOpenExternal,
  onOpenWindow,
  onReload,
}: OpenClawDashboardFrameProps) {
  const [frameLoading, setFrameLoading] = useState(false);
  const [frameBlocked, setFrameBlocked] = useState(false);

  useEffect(() => {
    setFrameLoading(running && Boolean(dashboardUrl));
    setFrameBlocked(false);
  }, [dashboardUrl, reloadToken, running]);

  useEffect(() => {
    if (!frameLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFrameBlocked(true);
      setFrameLoading(false);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [frameLoading]);

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            默认在当前页面内嵌显示，同时支持单独打开。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={!running || loading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            刷新内嵌页
          </button>
          <button
            type="button"
            onClick={onOpenExternal}
            disabled={!running || !dashboardUrl}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            <ExternalLink className="h-4 w-4" />
            单独打开
          </button>
        </div>
      </div>

      {!running ? (
        <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed bg-background/50 px-6 py-10 text-center">
          <SquareTerminal className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-medium">Dashboard 暂不可用</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            请先完成配置同步并启动 Gateway，启动成功后会在这里直接显示 Dashboard
            页面。
          </p>
        </div>
      ) : !dashboardUrl ? (
        <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed bg-background/50 text-sm text-muted-foreground">
          正在准备 Dashboard 地址...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            <span>当前地址</span>
            <span className="max-w-[70%] truncate">{dashboardUrl}</span>
          </div>
          <div className="relative h-[720px] bg-white">
            {(loading || frameLoading) && !frameBlocked && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dashboard 加载中...
                </div>
              </div>
            )}
            {frameBlocked && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 px-6">
                <div className="max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm">
                  <h3 className="text-base font-semibold">内嵌模式加载失败</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Dashboard 很可能被目标页的鉴权、Cookie 或 iframe
                    策略拦截，因此在当前页面内无法稳定显示。
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {onOpenWindow ? (
                      <button
                        type="button"
                        onClick={onOpenWindow}
                        disabled={windowBusy}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                      >
                        {windowBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MonitorSmartphone className="h-4 w-4" />
                        )}
                        打开桌面面板
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={onOpenExternal}
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                    >
                      <ExternalLink className="h-4 w-4" />
                      系统浏览器打开
                    </button>
                    <button
                      type="button"
                      onClick={onReload}
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                    >
                      <RefreshCw className="h-4 w-4" />
                      再试一次
                    </button>
                  </div>
                </div>
              </div>
            )}
            <iframe
              key={`${dashboardUrl}-${reloadToken}`}
              title="OpenClaw Dashboard"
              src={dashboardUrl}
              className="h-full w-full"
              allow="clipboard-read; clipboard-write"
              onLoad={() => {
                setFrameBlocked(false);
                setFrameLoading(false);
              }}
              onError={() => {
                setFrameBlocked(true);
                setFrameLoading(false);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default OpenClawDashboardFrame;
