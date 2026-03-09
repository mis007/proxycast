import { Download, ExternalLink, Link2, Loader2, Package } from "lucide-react";
import { OpenClawMark } from "./OpenClawMark";

interface OpenClawInstallPageProps {
  binaryPath?: string | null;
  nodeStatusText: string;
  gitStatusText: string;
  installing: boolean;
  onInstall: () => void;
  onOpenDocs: () => void;
  onDownloadNode: () => void;
  onDownloadGit: () => void;
}

export function OpenClawInstallPage({
  binaryPath,
  nodeStatusText,
  gitStatusText,
  installing,
  onInstall,
  onOpenDocs,
  onDownloadNode,
  onDownloadGit,
}: OpenClawInstallPageProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <OpenClawMark size="lg" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            OpenClaw 未安装
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            先完成本地安装后，才可以继续配置模型、启动 Gateway，并进入 Dashboard。
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onInstall}
              disabled={installing}
              className="inline-flex min-w-[168px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
            >
              {installing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              安装 OpenClaw
            </button>
            <button
              type="button"
              onClick={onOpenDocs}
              className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              查看文档
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              OpenClaw
            </div>
            <p className="mt-3 break-all text-sm leading-6 text-muted-foreground">
              {binaryPath || "当前未检测到可执行文件。"}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              Node.js
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {nodeStatusText}
            </p>
            <button
              type="button"
              onClick={onDownloadNode}
              className="mt-4 text-xs text-primary hover:underline"
            >
              下载 Node.js
            </button>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4" />
              Git
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {gitStatusText}
            </p>
            <button
              type="button"
              onClick={onDownloadGit}
              className="mt-4 text-xs text-primary hover:underline"
            >
              下载 Git
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpenClawInstallPage;
