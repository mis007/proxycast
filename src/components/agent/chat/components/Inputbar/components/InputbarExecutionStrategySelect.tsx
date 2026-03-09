import React from "react";
import { Code2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface InputbarExecutionStrategySelectProps {
  isFullscreen?: boolean;
  isThemeWorkbenchVariant?: boolean;
  executionStrategy?: "react" | "code_orchestrated" | "auto";
  setExecutionStrategy?: (
    strategy: "react" | "code_orchestrated" | "auto",
  ) => void;
}

export const InputbarExecutionStrategySelect: React.FC<
  InputbarExecutionStrategySelectProps
> = ({
  isFullscreen = false,
  isThemeWorkbenchVariant = false,
  executionStrategy,
  setExecutionStrategy,
}) => {
  if (isFullscreen || isThemeWorkbenchVariant || !setExecutionStrategy) {
    return null;
  }

  const resolvedExecutionStrategy = executionStrategy || "react";
  const executionStrategyLabel =
    resolvedExecutionStrategy === "auto"
      ? "Auto"
      : resolvedExecutionStrategy === "code_orchestrated"
        ? "Plan"
        : "ReAct";

  return (
    <Select
      value={resolvedExecutionStrategy}
      onValueChange={(value) =>
        setExecutionStrategy(value as "react" | "code_orchestrated" | "auto")
      }
    >
      <SelectTrigger className="h-8 text-xs bg-background border shadow-sm min-w-[116px] px-2">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="whitespace-nowrap">{executionStrategyLabel}</span>
        </div>
      </SelectTrigger>
      <SelectContent side="top" className="p-1 w-[176px]">
        <SelectItem value="react">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Code2 className="w-3.5 h-3.5" />
            ReAct
          </div>
        </SelectItem>
        <SelectItem value="code_orchestrated">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Code2 className="w-3.5 h-3.5" />
            Plan
          </div>
        </SelectItem>
        <SelectItem value="auto">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Code2 className="w-3.5 h-3.5" />
            Auto
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
