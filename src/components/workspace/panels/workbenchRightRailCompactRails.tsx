import { Bot, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  WorkbenchRightRailCapabilityItem,
  WorkbenchRightRailCapabilitySection,
} from "./workbenchRightRailTypes";

const COLLAPSED_ACTION_TONE_CLASS: Record<
  WorkbenchRightRailCapabilityItem["tone"],
  string
> = {
  violet:
    "border-violet-100 text-violet-500 hover:border-violet-200 hover:bg-violet-50/80",
  blue: "border-blue-100 text-blue-500 hover:border-blue-200 hover:bg-blue-50/80",
  pink: "border-pink-100 text-pink-500 hover:border-pink-200 hover:bg-pink-50/80",
};

export function CollapsedRail({
  onExpand,
  onExpandToAction,
  sections,
}: {
  onExpand: () => void;
  onExpandToAction: (actionKey: string) => void;
  sections: WorkbenchRightRailCapabilitySection[];
}) {
  return (
    <aside
      className="relative z-20 flex w-14 min-w-14 flex-col items-center gap-2 overflow-hidden border-l bg-background/95 py-3"
      data-testid="workbench-right-rail-collapsed"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              data-testid="workbench-right-rail-collapsed-expand"
              onClick={onExpand}
              title="展开能力面板"
            >
              <PanelRightOpen size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>展开能力面板</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 flex flex-col gap-2">
        {sections.flatMap((section) => section.items).map((item) => {
          const Icon = item.icon;
          return (
            <TooltipProvider key={item.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid={`workbench-right-rail-collapsed-action-${item.key}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border bg-white/90 transition-colors",
                      COLLAPSED_ACTION_TONE_CLASS[item.tone],
                    )}
                    title={item.label}
                    onClick={() => onExpandToAction(item.key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </aside>
  );
}

export function NonCreateRail({
  onBackToCreateView,
}: {
  onBackToCreateView: () => void;
}) {
  return (
    <aside className="flex w-14 min-w-14 flex-col items-center gap-2 border-l bg-background/95 py-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onBackToCreateView}
              title="返回创作视图"
            >
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>返回创作视图</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
}
