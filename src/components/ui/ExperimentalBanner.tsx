import { AlertTriangle, ExternalLink } from "lucide-react";

export function ExperimentalBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>
        实验功能，不影响核心使用。问题反馈：
        <a
          href="https://github.com/aiclientproxy/lime/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-yellow-700 hover:text-yellow-900 underline ml-1"
        >
          GitHub Issue
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </span>
    </div>
  );
}
