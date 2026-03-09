import { useState } from "react";
import { toast } from "sonner";
import { useGlobalMediaGenerationDefaults } from "@/hooks/useGlobalMediaGenerationDefaults";
import {
  BGM_DURATION_OPTIONS,
  PODCAST_MODE_OPTIONS,
  PODCAST_QUICK_IMPORT_PROMPT,
  SFX_DURATION_OPTIONS,
} from "./workbenchRightRailAudioConfig";
import type {
  BgmDurationType,
  PodcastModeType,
  PodcastSpeakerModeType,
  SfxDurationType,
} from "./workbenchRightRailAudioConfig";
import { getOptionLabel, parseSimpleDuration } from "./workbenchRightRailCapabilityShared";
import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import {
  requestAudioGeneration,
  resolveTtsProviderAndModel,
} from "./workbenchRightRailAudioRuntime";

interface UseWorkbenchRightRailAudioContentTasksParams {
  projectId?: string | null;
  appendGeneratedOutput: (item: GeneratedOutputItem) => void;
  handleSubmitPrompt: (prompt: string) => Promise<boolean>;
}

export function useWorkbenchRightRailAudioContentTasks({
  projectId,
  appendGeneratedOutput,
  handleSubmitPrompt,
}: UseWorkbenchRightRailAudioContentTasksParams) {
  const [bgmDuration, setBgmDuration] = useState<BgmDurationType>("30s");
  const [bgmPrompt, setBgmPrompt] = useState("");
  const [bgmSubmitting, setBgmSubmitting] = useState(false);
  const [sfxDuration, setSfxDuration] = useState<SfxDurationType>("10s");
  const [sfxPrompt, setSfxPrompt] = useState("");
  const [sfxSubmitting, setSfxSubmitting] = useState(false);
  const [podcastMode, setPodcastMode] = useState<PodcastModeType>("deep");
  const [podcastPrompt, setPodcastPrompt] = useState("");
  const [podcastSubmitting, setPodcastSubmitting] = useState(false);
  const [podcastVoiceDialogOpen, setPodcastVoiceDialogOpen] = useState(false);
  const [podcastSpeakerMode, setPodcastSpeakerMode] =
    useState<PodcastSpeakerModeType>("dual");
  const [podcastVoiceSearchKeyword, setPodcastVoiceSearchKeyword] =
    useState("");
  const { mediaDefaults } = useGlobalMediaGenerationDefaults();

  const buildBgmPrompt = () => {
    const durationLabel = getOptionLabel(BGM_DURATION_OPTIONS, bgmDuration);
    return `请生成纯背景音乐（不要人声）：
- 时长：${durationLabel}
- 提示词：${bgmPrompt.trim()}
请输出可直接用于视频配乐的音频。`;
  };

  const buildSfxPrompt = () => {
    const durationLabel = getOptionLabel(SFX_DURATION_OPTIONS, sfxDuration);
    return `请生成可直接使用的短音效（无需人声旁白）：
- 时长：${durationLabel}
- 提示词：${sfxPrompt.trim()}
请输出单段音效音频。`;
  };

  const buildPodcastPrompt = () => {
    const modeLabel = getOptionLabel(PODCAST_MODE_OPTIONS, podcastMode);
    const speakerModeLabel = podcastSpeakerMode === "dual" ? "双人" : "单人";
    return `请根据以下参数生成播客脚本：
- 模式：${modeLabel}
- 播音模式：${speakerModeLabel}
- 补充提示词：${podcastPrompt.trim()}

请输出分章节播客大纲与可直接录制的主持人台词。`;
  };

  const handleSubmitBgmTask = async () => {
    const normalizedPrompt = bgmPrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    setBgmSubmitting(true);
    try {
      const { provider, model, apiKey } = await resolveTtsProviderAndModel({
        projectId,
        defaultVoicePreference: mediaDefaults.voice,
      });
      const audioUrl = await requestAudioGeneration({
        provider,
        apiKey,
        model,
        prompt: buildBgmPrompt(),
        durationSeconds: parseSimpleDuration(bgmDuration, 30),
      });
      appendGeneratedOutput({
        id: `bgm-${Date.now()}`,
        title: "BGM 生成成功",
        detail: `${provider.id} · ${model} · ${getOptionLabel(BGM_DURATION_OPTIONS, bgmDuration)}`,
        assetType: "audio",
        assetUrl: audioUrl,
      });
      toast.success(`BGM 已生成（${provider.id} · ${model}）`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`BGM 生成失败：${message}`);
    } finally {
      setBgmSubmitting(false);
    }
  };

  const handleSubmitSfxTask = async () => {
    const normalizedPrompt = sfxPrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    setSfxSubmitting(true);
    try {
      const { provider, model, apiKey } = await resolveTtsProviderAndModel({
        projectId,
        defaultVoicePreference: mediaDefaults.voice,
      });
      const audioUrl = await requestAudioGeneration({
        provider,
        apiKey,
        model,
        prompt: buildSfxPrompt(),
        durationSeconds: parseSimpleDuration(sfxDuration, 10),
      });
      appendGeneratedOutput({
        id: `sfx-${Date.now()}`,
        title: "音效生成成功",
        detail: `${provider.id} · ${model} · ${getOptionLabel(SFX_DURATION_OPTIONS, sfxDuration)}`,
        assetType: "audio",
        assetUrl: audioUrl,
      });
      toast.success(`音效已生成（${provider.id} · ${model}）`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`音效生成失败：${message}`);
    } finally {
      setSfxSubmitting(false);
    }
  };

  const handleSubmitPodcastTask = async () => {
    setPodcastSubmitting(true);
    try {
      const submitted = await handleSubmitPrompt(buildPodcastPrompt());
      if (!submitted) {
        return;
      }
      appendGeneratedOutput({
        id: `podcast-${Date.now()}`,
        title: "播客脚本任务已提交",
        detail: `${getOptionLabel(PODCAST_MODE_OPTIONS, podcastMode)} · ${
          podcastSpeakerMode === "dual" ? "双人播音" : "单人播音"
        }`,
      });
    } finally {
      setPodcastSubmitting(false);
    }
  };

  const closePodcastPanel = () => {
    setPodcastVoiceDialogOpen(false);
  };

  const handleImportPodcastPrompt = () => {
    setPodcastPrompt(PODCAST_QUICK_IMPORT_PROMPT);
  };

  return {
    bgmDuration,
    bgmPrompt,
    bgmSubmitting,
    closePodcastPanel,
    handleImportPodcastPrompt,
    handleSubmitBgmTask,
    handleSubmitPodcastTask,
    handleSubmitSfxTask,
    podcastMode,
    podcastPrompt,
    podcastSpeakerMode,
    podcastSubmitting,
    podcastVoiceDialogOpen,
    podcastVoiceSearchKeyword,
    setBgmDuration,
    setBgmPrompt,
    setPodcastMode,
    setPodcastPrompt,
    setPodcastSpeakerMode,
    setPodcastVoiceDialogOpen,
    setPodcastVoiceSearchKeyword,
    setSfxDuration,
    setSfxPrompt,
    sfxDuration,
    sfxPrompt,
    sfxSubmitting,
  };
}
