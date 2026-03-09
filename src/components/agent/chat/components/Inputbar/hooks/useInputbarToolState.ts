import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export interface InputbarToolStates {
  webSearch: boolean;
  thinking: boolean;
}

interface UseInputbarToolStateParams {
  toolStates?: Partial<InputbarToolStates>;
  onToolStatesChange?: (states: InputbarToolStates) => void;
  executionStrategy?: "react" | "code_orchestrated" | "auto";
  setExecutionStrategy?: (
    strategy: "react" | "code_orchestrated" | "auto",
  ) => void;
  setInput: (value: string) => void;
  onClearMessages?: () => void;
  onToggleCanvas?: () => void;
  clearPendingImages: () => void;
  openFileDialog: () => void;
}

const DEFAULT_INPUTBAR_TOOL_STATES: InputbarToolStates = {
  webSearch: false,
  thinking: false,
};

export function useInputbarToolState({
  toolStates,
  onToolStatesChange,
  executionStrategy,
  setExecutionStrategy,
  setInput,
  onClearMessages,
  onToggleCanvas,
  clearPendingImages,
  openFileDialog,
}: UseInputbarToolStateParams) {
  const [localActiveTools, setLocalActiveTools] = useState<
    Record<string, boolean>
  >({});
  const [localToolStates, setLocalToolStates] = useState<InputbarToolStates>(
    DEFAULT_INPUTBAR_TOOL_STATES,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const webSearchEnabled =
    toolStates?.webSearch ?? localToolStates.webSearch;
  const thinkingEnabled = toolStates?.thinking ?? localToolStates.thinking;

  const activeTools = useMemo<Record<string, boolean>>(
    () => ({
      ...localActiveTools,
      web_search: webSearchEnabled,
      thinking: thinkingEnabled,
    }),
    [localActiveTools, thinkingEnabled, webSearchEnabled],
  );

  const updateToolStates = useCallback(
    (next: InputbarToolStates) => {
      setLocalToolStates((prev) => ({
        webSearch: toolStates?.webSearch ?? next.webSearch ?? prev.webSearch,
        thinking: toolStates?.thinking ?? next.thinking ?? prev.thinking,
      }));
      onToolStatesChange?.(next);
      return next;
    },
    [onToolStatesChange, toolStates?.thinking, toolStates?.webSearch],
  );

  const handleToolClick = useCallback(
    (tool: string) => {
      switch (tool) {
        case "thinking": {
          const nextThinking = !thinkingEnabled;
          updateToolStates({
            webSearch: webSearchEnabled,
            thinking: nextThinking,
          });
          toast.info(`深度思考${nextThinking ? "已开启" : "已关闭"}`);
          break;
        }
        case "web_search": {
          const nextWebSearch = !webSearchEnabled;
          updateToolStates({
            webSearch: nextWebSearch,
            thinking: thinkingEnabled,
          });
          toast.info(`联网搜索${nextWebSearch ? "已开启" : "已关闭"}`);
          break;
        }
        case "execution_strategy":
          if (setExecutionStrategy) {
            const strategyOrder: Array<
              "react" | "code_orchestrated" | "auto"
            > = ["react", "code_orchestrated", "auto"];
            const currentIndex = strategyOrder.indexOf(
              executionStrategy || "react",
            );
            const nextStrategy =
              strategyOrder[(currentIndex + 1) % strategyOrder.length];
            setExecutionStrategy(nextStrategy);
            toast.info(
              nextStrategy === "react"
                ? "执行模式：ReAct"
                : nextStrategy === "code_orchestrated"
                  ? "执行模式：Plan"
                  : "执行模式：Auto",
            );
            break;
          }
          setLocalActiveTools((prev) => {
            const enabled = !prev["execution_strategy"];
            toast.info(`Plan 模式${enabled ? "已开启" : "已关闭"}`);
            return { ...prev, execution_strategy: enabled };
          });
          break;
        case "clear":
          setInput("");
          clearPendingImages();
          toast.success("已清除输入");
          break;
        case "new_topic":
          onClearMessages?.();
          setInput("");
          clearPendingImages();
          break;
        case "attach":
          openFileDialog();
          break;
        case "quick_action":
        case "translate":
          toast.info("翻译功能开发中...");
          break;
        case "fullscreen":
          setIsFullscreen((prev) => !prev);
          toast.info(isFullscreen ? "已退出全屏" : "已进入全屏编辑");
          break;
        case "canvas":
          onToggleCanvas?.();
          break;
        default:
          break;
      }
    },
    [
      clearPendingImages,
      executionStrategy,
      isFullscreen,
      onClearMessages,
      onToggleCanvas,
      openFileDialog,
      setExecutionStrategy,
      setInput,
      thinkingEnabled,
      updateToolStates,
      webSearchEnabled,
    ],
  );

  return {
    activeTools,
    handleToolClick,
    isFullscreen,
    thinkingEnabled,
    webSearchEnabled,
  };
}
