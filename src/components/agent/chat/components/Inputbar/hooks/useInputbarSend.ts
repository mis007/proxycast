import { useCallback } from "react";
import type { Skill } from "@/lib/api/skills";
import type { MessageImage } from "../../../types";

const SOCIAL_ARTICLE_SKILL_KEY = "social_post_with_cover";

interface UseInputbarSendParams {
  input: string;
  pendingImages: MessageImage[];
  webSearchEnabled: boolean;
  thinkingEnabled: boolean;
  executionStrategy?: "react" | "code_orchestrated" | "auto";
  activeTools: Record<string, boolean>;
  activeSkill: Skill | null;
  activeTheme?: string;
  onSend: (
    images?: MessageImage[],
    webSearch?: boolean,
    thinking?: boolean,
    textOverride?: string,
    executionStrategy?: "react" | "code_orchestrated" | "auto",
  ) => void;
  clearPendingImages: () => void;
  clearActiveSkill: () => void;
}

export function useInputbarSend({
  input,
  pendingImages,
  webSearchEnabled,
  thinkingEnabled,
  executionStrategy,
  activeTools,
  activeSkill,
  activeTheme,
  onSend,
  clearPendingImages,
  clearActiveSkill,
}: UseInputbarSendParams) {
  return useCallback(() => {
    if (!input.trim() && pendingImages.length === 0) {
      return;
    }

    const webSearch = webSearchEnabled;
    const thinking = thinkingEnabled;
    let strategy =
      executionStrategy ||
      (activeTools["execution_strategy"] ? "code_orchestrated" : "react");

    if (webSearch && strategy !== "react") {
      strategy = "react";
    }

    let textOverride: string | undefined;
    if (activeSkill) {
      textOverride = `/${activeSkill.key} ${input}`.trim();
    } else if (
      activeTheme === "social-media" &&
      input.trim() &&
      !input.trimStart().startsWith("/")
    ) {
      textOverride = `/${SOCIAL_ARTICLE_SKILL_KEY} ${input}`.trim();
    }

    onSend(
      pendingImages.length > 0 ? pendingImages : undefined,
      webSearch,
      thinking,
      textOverride,
      strategy,
    );
    clearPendingImages();
    clearActiveSkill();
  }, [
    activeSkill,
    activeTheme,
    activeTools,
    clearActiveSkill,
    clearPendingImages,
    executionStrategy,
    input,
    onSend,
    pendingImages,
    thinkingEnabled,
    webSearchEnabled,
  ]);
}
