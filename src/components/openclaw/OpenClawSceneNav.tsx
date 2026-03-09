import { CheckCircle2, ChevronRight, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  OpenClawScene,
  OpenClawSceneDefinition,
  OpenClawSceneStatus,
} from "./types";

interface OpenClawSceneNavProps {
  scenes: OpenClawSceneDefinition[];
  currentScene: OpenClawScene;
  onSelect: (scene: OpenClawScene) => void;
  resolveStatus: (scene: OpenClawScene) => OpenClawSceneStatus;
}

function statusBadgeClass(tone: string): string {
  switch (tone) {
    case "running":
    case "healthy":
    case "connected":
    case "done":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-300/50";
    case "starting":
    case "active":
      return "bg-amber-500/10 text-amber-700 border-amber-300/50";
    case "error":
    case "unhealthy":
    case "disconnected":
      return "bg-red-500/10 text-red-700 border-red-300/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function renderSceneIcon(current: boolean, tone: string) {
  if (current) {
    return <PlayCircle className="h-5 w-5 text-primary" />;
  }

  if (tone === "done") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  }

  return <Circle className="h-5 w-5 text-muted-foreground" />;
}

export function OpenClawSceneNav({
  scenes,
  currentScene,
  onSelect,
  resolveStatus,
}: OpenClawSceneNavProps) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="px-2 pb-3">
        <h2 className="text-sm font-semibold">流程导航</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          建议按顺序完成安装、同步和 Dashboard 打开。
        </p>
      </div>

      <div className="space-y-2">
        {scenes.map((scene) => {
          const current = currentScene === scene.id;
          const status = resolveStatus(scene.id);

          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelect(scene.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
                current && "border-primary bg-primary/5 ring-2 ring-primary/10",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {renderSceneIcon(current, status.tone)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{scene.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {scene.description}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusBadgeClass(status.tone)}`}
                    >
                      {status.label}
                    </div>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{current ? "当前步骤" : "切换到此步骤"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default OpenClawSceneNav;
