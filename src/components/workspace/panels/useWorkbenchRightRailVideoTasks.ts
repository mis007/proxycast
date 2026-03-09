import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiKeyProviderApi } from "@/lib/api/apiKeyProvider";
import { videoGenerationApi } from "@/lib/api/videoGeneration";
import {
  findMediaProviderById,
  findVideoProviderForSelection,
  getVideoModelsForProvider,
  isVideoProvider,
  pickVideoModelByVersion,
  resolveMediaGenerationPreference,
} from "@/lib/mediaGeneration";
import { useGlobalMediaGenerationDefaults } from "@/hooks/useGlobalMediaGenerationDefaults";
import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import type {
  VideoAssetDurationType,
  VideoAssetModelType,
  VideoAssetRatioType,
  VideoAssetVersionType,
} from "./workbenchRightRailCreationConfig";
import {
  parseVideoDuration,
  VIDEO_ASSET_RATIO_OPTIONS,
} from "./workbenchRightRailCreationConfig";
import {
  getOptionLabel,
  loadWorkbenchProject,
  type VideoProviderOption,
} from "./workbenchRightRailCapabilityShared";

interface UseWorkbenchRightRailVideoTasksParams {
  projectId?: string | null;
  appendGeneratedOutput: (item: GeneratedOutputItem) => void;
}

export function useWorkbenchRightRailVideoTasks({
  projectId,
  appendGeneratedOutput,
}: UseWorkbenchRightRailVideoTasksParams) {
  const [videoAssetModel, setVideoAssetModel] =
    useState<VideoAssetModelType>("keling");
  const [videoAssetVersion, setVideoAssetVersion] =
    useState<VideoAssetVersionType>("v2-1-master");
  const [videoAssetRatio, setVideoAssetRatio] =
    useState<VideoAssetRatioType>("16-9");
  const [videoAssetDuration, setVideoAssetDuration] =
    useState<VideoAssetDurationType>("5s");
  const [videoAssetPrompt, setVideoAssetPrompt] = useState("");
  const [aiVideoScriptContent, setAiVideoScriptContent] = useState("");
  const [videoAssetSubmitting, setVideoAssetSubmitting] = useState(false);
  const [aiVideoSubmitting, setAiVideoSubmitting] = useState(false);
  const [videoProviders, setVideoProviders] = useState<VideoProviderOption[]>(
    [],
  );
  const { mediaDefaults } = useGlobalMediaGenerationDefaults();

  useEffect(() => {
    let active = true;
    const loadVideoProviders = async () => {
      try {
        const allProviders = await apiKeyProviderApi.getProviders();
        if (!active) {
          return;
        }

        const availableProviders = allProviders
          .filter(
            (provider) =>
              provider.enabled &&
              provider.api_key_count > 0 &&
              isVideoProvider(provider.id),
          )
          .map((provider) => ({
            id: provider.id,
            customModels: provider.custom_models ?? [],
          }));
        setVideoProviders(availableProviders);
      } catch (error) {
        console.error("[WorkbenchRightRail] 加载视频 Provider 失败:", error);
        if (active) {
          setVideoProviders([]);
        }
      }
    };

    void loadVideoProviders();
    return () => {
      active = false;
    };
  }, []);

  const resolveVideoProviderAndModel = async () => {
    const project = await loadWorkbenchProject(projectId);
    const videoPreference = resolveMediaGenerationPreference(
      project?.settings?.videoGeneration,
      mediaDefaults.video,
    );
    const preferredProviderId =
      videoPreference.preferredProviderId?.trim() || "";
    const preferredModelId = videoPreference.preferredModelId?.trim() || "";
    const allowFallback = videoPreference.allowFallback;
    const preferenceSourceLabel =
      videoPreference.source === "project" ? "项目" : "全局默认";

    let provider = preferredProviderId
      ? findMediaProviderById(videoProviders, preferredProviderId)
      : null;

    if (!provider && preferredProviderId && !allowFallback) {
      throw new Error(
        `${preferenceSourceLabel}已指定视频服务 ${preferredProviderId}，但当前不可用，请前往设置调整`,
      );
    }

    if (!provider) {
      provider = findVideoProviderForSelection(videoProviders, videoAssetModel);
    }

    if (!provider) {
      throw new Error("未找到可用视频服务，请先在设置中配置 Provider");
    }

    const providerModels = getVideoModelsForProvider(
      provider.id,
      provider.customModels,
    );
    if (providerModels.length === 0) {
      if (
        preferredProviderId &&
        provider.id === preferredProviderId &&
        !allowFallback
      ) {
        throw new Error(
          preferenceSourceLabel +
            "指定的视频服务没有可用模型，请前往设置或凭证池调整",
        );
      }
      throw new Error("当前视频服务没有可用模型，请先补充模型配置");
    }

    const model =
      preferredProviderId &&
      provider.id === preferredProviderId &&
      preferredModelId
        ? preferredModelId
        : pickVideoModelByVersion(providerModels, videoAssetVersion);
    if (!model) {
      throw new Error("未能解析所选模型，请检查 Provider 模型配置");
    }

    return { provider, model };
  };

  const handleSubmitVideoAssetsTask = async () => {
    const normalizedPrompt = videoAssetPrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    if (!projectId) {
      toast.error("请先选择项目后再生成视频素材");
      return;
    }

    setVideoAssetSubmitting(true);
    try {
      const { provider, model: selectedModel } =
        await resolveVideoProviderAndModel();

      const createdTask = await videoGenerationApi.createTask({
        projectId,
        providerId: provider.id,
        model: selectedModel,
        prompt: normalizedPrompt,
        aspectRatio: getOptionLabel(VIDEO_ASSET_RATIO_OPTIONS, videoAssetRatio),
        resolution: "720p",
        duration: parseVideoDuration(videoAssetDuration),
      });
      appendGeneratedOutput({
        id: `video-assets-${createdTask.id}`,
        title: "视频素材任务已提交",
        detail: `${provider.id} · ${selectedModel} · 任务 ${createdTask.id}`,
      });
      toast.success(`视频素材任务已提交（${provider.id} · ${selectedModel}）`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`视频素材任务提交失败：${message}`);
    } finally {
      setVideoAssetSubmitting(false);
    }
  };

  const handleSubmitAIVideoTask = async () => {
    const normalizedScript = aiVideoScriptContent.trim();
    if (!normalizedScript) {
      return;
    }

    if (!projectId) {
      toast.error("请先选择项目后再生成视频");
      return;
    }

    setAiVideoSubmitting(true);
    try {
      const { provider, model: selectedModel } =
        await resolveVideoProviderAndModel();

      const createdTask = await videoGenerationApi.createTask({
        projectId,
        providerId: provider.id,
        model: selectedModel,
        prompt: normalizedScript,
        aspectRatio: getOptionLabel(VIDEO_ASSET_RATIO_OPTIONS, videoAssetRatio),
        resolution: "720p",
        duration: parseVideoDuration(videoAssetDuration),
      });
      appendGeneratedOutput({
        id: `video-script-${createdTask.id}`,
        title: "非AI画面视频任务已提交",
        detail: `${provider.id} · ${selectedModel} · 任务 ${createdTask.id}`,
      });
      toast.success(
        `非 AI 画面视频任务已提交（${provider.id} · ${selectedModel}）`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`视频任务提交失败：${message}`);
    } finally {
      setAiVideoSubmitting(false);
    }
  };

  const handleSubmitStoryboardTask = async (
    handleSubmitPrompt: (prompt: string) => Promise<boolean>,
  ) => {
    await handleSubmitPrompt(
      "请根据当前项目主题生成完整分镜脚本，包含镜头序号、画面内容、台词/旁白、时长与运镜建议。",
    );
  };

  return {
    aiVideoScriptContent,
    aiVideoSubmitting,
    handleSubmitAIVideoTask,
    handleSubmitStoryboardTask,
    handleSubmitVideoAssetsTask,
    setAiVideoScriptContent,
    setVideoAssetDuration,
    setVideoAssetModel,
    setVideoAssetPrompt,
    setVideoAssetRatio,
    setVideoAssetVersion,
    videoAssetDuration,
    videoAssetModel,
    videoAssetPrompt,
    videoAssetRatio,
    videoAssetSubmitting,
    videoAssetVersion,
  };
}
