import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface OpenClawDashboardPageProps {
  dashboardUrl: string | null;
  loading: boolean;
  running: boolean;
  windowBusy: boolean;
  windowOpen: boolean;
  onBack: () => void;
  onOpenExternal: () => void;
  onOpenWindow: () => void;
  onRefresh: () => void;
}

export function OpenClawDashboardPage({
  dashboardUrl,
  loading,
  running,
  windowBusy,
  windowOpen,
  onBack,
  onOpenExternal,
  onOpenWindow,
  onRefresh,
}: OpenClawDashboardPageProps) {
  const actionDisabled = !running || !dashboardUrl || loading || windowBusy;
  const hasDashboardToken = useMemo(() => {
    if (!dashboardUrl) {
      return false;
    }

    try {
      const url = new URL(dashboardUrl);
      return (
        url.searchParams.has("token") ||
        new URLSearchParams(url.hash.replace(/^#/, "")).has("token")
      );
    } catch {
      return /[#?&]token=/.test(dashboardUrl);
    }
  }, [dashboardUrl]);

  const maskedDashboardUrl = useMemo(() => {
    if (!dashboardUrl) {
      return "正在读取 Dashboard 地址...";
    }

    try {
      const url = new URL(dashboardUrl);
      const queryToken = url.searchParams.get("token");
      if (queryToken) {
        const visiblePrefix = queryToken.slice(0, 6);
        const visibleSuffix = queryToken.slice(-4);
        url.searchParams.set("token", `${visiblePrefix}***${visibleSuffix}`);
      }

      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const hashToken = hashParams.get("token");
      if (hashToken) {
        const visiblePrefix = hashToken.slice(0, 6);
        const visibleSuffix = hashToken.slice(-4);
        hashParams.set("token", `${visiblePrefix}***${visibleSuffix}`);
        url.hash = hashParams.toString();
      }
      return url.toString();
    } catch {
      return dashboardUrl.replace(
        /(token=)([^&#]+)/,
        (_match, prefix, value: string) => {
          const visiblePrefix = value.slice(0, 6);
          const visibleSuffix = value.slice(-4);
          return `${prefix}${visiblePrefix}***${visibleSuffix}`;
        },
      );
    }
  }, [dashboardUrl]);

  const handleCopyDashboardUrl = async () => {
    if (!dashboardUrl) {
      toast.error("当前没有可复制的 Dashboard 地址。");
      return;
    }

    try {
      await navigator.clipboard.writeText(dashboardUrl);
      toast.success("完整 Dashboard 地址已复制。");
    } catch {
      toast.error("复制 Dashboard 地址失败。");
    }
  };

  return (
    <div className="flex min-h-full flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                已移除内嵌模式。Dashboard 请通过桌面面板或系统浏览器访问，避免
                iframe 鉴权与兼容性问题。
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              返回运行页
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                <span
                  className={
                    windowOpen ? "text-emerald-600" : "text-muted-foreground"
                  }
                >
                  ●
                </span>
                {windowOpen ? "桌面面板已打开" : "桌面面板未打开"}
              </div>
              <h2 className="mt-4 text-lg font-semibold">访问方式</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                由于 OpenClaw Dashboard 无法稳定运行在内嵌 iframe
                中，这里只保留两种稳定方式：桌面面板和系统浏览器。
              </p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || windowBusy}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              {loading || windowBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              刷新状态
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={onOpenWindow}
              disabled={actionDisabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
            >
              {windowBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MonitorSmartphone className="h-4 w-4" />
              )}
              {windowOpen ? "聚焦桌面面板" : "打开桌面面板"}
            </button>

            <button
              type="button"
              onClick={onOpenExternal}
              disabled={actionDisabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm hover:bg-muted disabled:opacity-60"
            >
              <ExternalLink className="h-4 w-4" />
              在系统浏览器中打开
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">当前地址</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                页面中只显示脱敏地址；复制按钮会复制完整带 token 的访问链接。
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyDashboardUrl}
              disabled={!dashboardUrl}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              <Copy className="h-4 w-4" />
              复制完整地址
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span
                className={
                  hasDashboardToken ? "text-emerald-600" : "text-rose-500"
                }
              >
                ●
              </span>
              {hasDashboardToken ? "已携带 token" : "未检测到 token"}
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
            {maskedDashboardUrl}
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Gateway 重启后 token 可能变化；如遇 401
            或空白页，先点“刷新状态”再重新打开。
          </p>
        </section>
      </div>
    </div>
  );
}

export default OpenClawDashboardPage;
