import { Cpu, Package, TerminalSquare } from "lucide-react";
import type { OpenClawRuntimeCandidate } from "@/lib/api/openclaw";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { openClawSubPanelClassName } from "./openclawStyles";

const AUTO_RUNTIME_VALUE = "__auto_runtime__";

interface OpenClawExecutionEnvironmentCardProps {
  candidates: OpenClawRuntimeCandidate[];
  preferredRuntimeId: string | null;
  busy?: boolean;
  description: string;
  className?: string;
  onChange: (runtimeId: string | null) => void;
}

function formatRuntimeHeading(candidate: OpenClawRuntimeCandidate | null): string {
  if (!candidate) {
    return "自动选择";
  }

  return `${candidate.source} · Node ${candidate.nodeVersion || "未识别"}`;
}

function formatRuntimeSelectionLabel(
  candidate: OpenClawRuntimeCandidate | null,
  preferredRuntimeId: string | null,
): string {
  if (!candidate) {
    return "自动选择";
  }

  return preferredRuntimeId
    ? `固定：${formatRuntimeHeading(candidate)}`
    : `自动：${formatRuntimeHeading(candidate)}`;
}

function formatOpenClawStatus(candidate: OpenClawRuntimeCandidate | null): string {
  if (!candidate) {
    return "尚未检测到可用运行时";
  }

  if (candidate.openclawVersion) {
    return `OpenClaw ${candidate.openclawVersion}`;
  }

  if (candidate.openclawPath) {
    return "已检测到 OpenClaw 命令";
  }

  if (candidate.openclawPackagePath) {
    return "已检测到 OpenClaw 包";
  }

  return "当前运行时尚未安装 OpenClaw";
}

export function OpenClawExecutionEnvironmentCard({
  candidates,
  preferredRuntimeId,
  busy = false,
  description,
  className,
  onChange,
}: OpenClawExecutionEnvironmentCardProps) {
  const currentCandidate =
    (preferredRuntimeId
      ? candidates.find((candidate) => candidate.id === preferredRuntimeId)
      : null) ||
    candidates.find((candidate) => candidate.isPreferred) ||
    candidates.find((candidate) => candidate.isActive) ||
    candidates[0] ||
    null;
  const selectValue = preferredRuntimeId || AUTO_RUNTIME_VALUE;
  const showSelector = candidates.length > 0;

  return (
    <div className={cn(openClawSubPanelClassName, className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">执行环境</div>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {formatRuntimeSelectionLabel(currentCandidate, preferredRuntimeId)}
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
          {preferredRuntimeId ? "已固定" : "自动选择"}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>

      {showSelector ? (
        <div className="mt-4">
          <Select
            value={selectValue}
            onValueChange={(value) =>
              onChange(value === AUTO_RUNTIME_VALUE ? null : value)
            }
            disabled={busy}
          >
            <SelectTrigger className="h-auto rounded-2xl border-slate-200/80 bg-white px-4 py-3 text-left shadow-none focus:ring-slate-300">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">
                  {formatRuntimeSelectionLabel(currentCandidate, preferredRuntimeId)}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {currentCandidate?.binDir || "由 Lime 自动选择最合适的运行时"}
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/8">
              <SelectItem
                value={AUTO_RUNTIME_VALUE}
                className="rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">自动选择</div>
                  <div className="mt-1 text-xs text-slate-500">
                    自动优先使用兼容且更合适的 Node/OpenClaw 运行时。
                  </div>
                </div>
              </SelectItem>
              {candidates.map((candidate) => (
                <SelectItem
                  key={candidate.id}
                  value={candidate.id}
                  className="rounded-xl px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {formatRuntimeHeading(candidate)}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {candidate.openclawVersion
                        ? `OpenClaw ${candidate.openclawVersion}`
                        : candidate.openclawPackagePath
                          ? "已检测到 OpenClaw 包"
                          : "当前运行时未安装 OpenClaw"}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-400">
                      {candidate.binDir}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Cpu className="h-3.5 w-3.5" />
            Node.js
          </div>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {currentCandidate?.nodeVersion || "未识别"}
          </div>
          <div className="mt-1 break-all text-[11px] leading-5 text-slate-500">
            {currentCandidate?.nodePath || "未检测到"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Package className="h-3.5 w-3.5" />
            OpenClaw
          </div>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {formatOpenClawStatus(currentCandidate)}
          </div>
          <div className="mt-1 break-all text-[11px] leading-5 text-slate-500">
            {currentCandidate?.openclawPath ||
              currentCandidate?.openclawPackagePath ||
              "切换到该运行时后可直接安装 OpenClaw。"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <TerminalSquare className="h-3.5 w-3.5" />
            npm 前缀
          </div>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {currentCandidate?.source || "未识别"}
          </div>
          <div className="mt-1 break-all text-[11px] leading-5 text-slate-500">
            {currentCandidate?.npmGlobalPrefix ||
              currentCandidate?.npmPath ||
              "当前未检测到 npm 全局前缀"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpenClawExecutionEnvironmentCard;
