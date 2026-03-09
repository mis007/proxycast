import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGlobalMediaGenerationDefaults } from "@/hooks/useGlobalMediaGenerationDefaults";
import { mapToneToTtsVoice, parseVoiceSpeed } from "./workbenchRightRailAudioConfig";
import type {
  VoiceoverSpeedType,
  VoiceoverToneId,
  VoiceoverToneTabType,
} from "./workbenchRightRailAudioConfig";
import { buildProviderEndpoint, revokeObjectUrlIfNeeded, tryParseJsonText } from "./workbenchRightRailCapabilityShared";
import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import { resolveTtsProviderAndModel } from "./workbenchRightRailAudioRuntime";

interface UseWorkbenchRightRailVoiceoverTasksParams {
  projectId?: string | null;
  appendGeneratedOutput: (item: GeneratedOutputItem) => void;
}

export function useWorkbenchRightRailVoiceoverTasks({
  projectId,
  appendGeneratedOutput,
}: UseWorkbenchRightRailVoiceoverTasksParams) {
  const [voiceoverSpeed, setVoiceoverSpeed] =
    useState<VoiceoverSpeedType>("1.0x");
  const [voiceoverToneId, setVoiceoverToneId] =
    useState<VoiceoverToneId>("gaolengyujie");
  const [voiceoverPrompt, setVoiceoverPrompt] = useState("");
  const [voiceoverSubmitting, setVoiceoverSubmitting] = useState(false);
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState("");
  const [voiceToneDialogOpen, setVoiceToneDialogOpen] = useState(false);
  const [voiceToneDialogTab, setVoiceToneDialogTab] =
    useState<VoiceoverToneTabType>("library");
  const [voiceToneDialogSearchKeyword, setVoiceToneDialogSearchKeyword] =
    useState("");
  const { mediaDefaults } = useGlobalMediaGenerationDefaults();

  useEffect(() => {
    return () => {
      revokeObjectUrlIfNeeded(voiceoverAudioUrl);
    };
  }, [voiceoverAudioUrl]);

  const handleSubmitVoiceoverTask = async () => {
    const normalizedPrompt = voiceoverPrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    setVoiceoverSubmitting(true);
    try {
      const { provider, model, apiKey } = await resolveTtsProviderAndModel({
        projectId,
        defaultVoicePreference: mediaDefaults.voice,
      });
      const endpoint = buildProviderEndpoint(
        provider.apiHost,
        "/v1/audio/speech",
      );
      const voice = mapToneToTtsVoice(voiceoverToneId);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          voice,
          input: normalizedPrompt,
          speed: parseVoiceSpeed(voiceoverSpeed),
        }),
      });

      if (!response.ok) {
        const rawText = await response.text();
        const payload = tryParseJsonText(rawText);
        const messageFromPayload = (
          payload?.error as { message?: string } | undefined
        )?.message;
        const message =
          typeof messageFromPayload === "string" &&
          messageFromPayload.trim().length > 0
            ? messageFromPayload
            : rawText.slice(0, 200);
        throw new Error(message || `请求失败: ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (audioBlob.size <= 0) {
        throw new Error("配音服务返回成功但音频为空");
      }

      revokeObjectUrlIfNeeded(voiceoverAudioUrl);
      if (
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoiceoverAudioUrl(audioUrl);
      } else {
        setVoiceoverAudioUrl("");
      }

      appendGeneratedOutput({
        id: `voiceover-${Date.now()}`,
        title: "配音生成成功",
        detail: `${provider.id} · ${model} · 语速 ${voiceoverSpeed}`,
      });
      toast.success(`配音已生成（${provider.id} · ${model}）`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`配音生成失败：${message}`);
    } finally {
      setVoiceoverSubmitting(false);
    }
  };

  const closeVoiceoverPanel = () => {
    setVoiceToneDialogOpen(false);
  };

  return {
    closeVoiceoverPanel,
    handleSubmitVoiceoverTask,
    setVoiceoverPrompt,
    setVoiceoverSpeed,
    setVoiceoverToneId,
    setVoiceToneDialogOpen,
    setVoiceToneDialogSearchKeyword,
    setVoiceToneDialogTab,
    voiceoverAudioUrl,
    voiceoverPrompt,
    voiceoverSpeed,
    voiceoverSubmitting,
    voiceoverToneId,
    voiceToneDialogOpen,
    voiceToneDialogSearchKeyword,
    voiceToneDialogTab,
  };
}
