import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { apiKeyProviderApi } from "@/lib/api/apiKeyProvider";
import {
  findImageProviderById,
  findImageProviderForSelection,
  getImageModelIdsForProvider,
  isImageProvider,
  pickImageModelBySelection,
} from "@/lib/imageGeneration";
import { resolveMediaGenerationPreference } from "@/lib/mediaGeneration";
import { useGlobalMediaGenerationDefaults } from "@/hooks/useGlobalMediaGenerationDefaults";
import type { GeneratedOutputItem } from "./workbenchRightRailGeneratedOutputs";
import type {
  CoverCountType,
  CoverPlatformType,
  ImageModelType,
  ImageSizeType,
  SearchResourceType,
} from "./workbenchRightRailCreationConfig";
import {
  COVER_PLATFORM_OPTIONS,
  mapCoverPlatformToResolution,
  mapImageSizeTypeToResolution,
  SEARCH_RESOURCE_OPTIONS,
} from "./workbenchRightRailCreationConfig";
import {
  buildProviderEndpoint,
  extractImageUrlsFromResponse,
  getOptionLabel,
  ImageProviderOption,
  loadWorkbenchProject,
  tryParseJsonText,
  type WebImageSearchResponseForRail,
} from "./workbenchRightRailCapabilityShared";

interface UseWorkbenchRightRailImageTasksParams {
  projectId?: string | null;
  appendGeneratedOutput: (item: GeneratedOutputItem) => void;
  handleSubmitPrompt: (prompt: string) => Promise<boolean>;
}

export function useWorkbenchRightRailImageTasks({
  projectId,
  appendGeneratedOutput,
  handleSubmitPrompt,
}: UseWorkbenchRightRailImageTasksParams) {
  const [searchResourceType, setSearchResourceType] =
    useState<SearchResourceType>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMaterialSubmitting, setSearchMaterialSubmitting] =
    useState(false);
  const [searchMaterialResultSummary, setSearchMaterialResultSummary] =
    useState("");
  const [titleRequirement, setTitleRequirement] = useState("");
  const [imageModel, setImageModel] = useState<ImageModelType>("basic");
  const [imageSize, setImageSize] = useState<ImageSizeType>("16-9");
  const [imagePrompt, setImagePrompt] = useState("");
  const [coverPlatform, setCoverPlatform] =
    useState<CoverPlatformType>("bilibili");
  const [coverCount, setCoverCount] = useState<CoverCountType>("1");
  const [coverDescription, setCoverDescription] = useState("");
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [coverSubmitting, setCoverSubmitting] = useState(false);
  const { mediaDefaults } = useGlobalMediaGenerationDefaults();

  const resolveImageProviderAndModel = async (modelType: ImageModelType) => {
    const [allProviders, project] = await Promise.all([
      apiKeyProviderApi.getProviders(),
      loadWorkbenchProject(projectId),
    ]);
    const imageProviders: ImageProviderOption[] = allProviders
      .filter(
        (provider) =>
          provider.enabled &&
          provider.api_key_count > 0 &&
          isImageProvider(provider.id, provider.type),
      )
      .map((provider) => ({
        id: provider.id,
        type: provider.type,
        apiHost: provider.api_host,
        customModels: provider.custom_models ?? [],
      }));

    const imagePreference = resolveMediaGenerationPreference(
      project?.settings?.imageGeneration,
      mediaDefaults.image,
    );
    const preferredProviderId =
      imagePreference.preferredProviderId?.trim() || "";
    const preferredModelId = imagePreference.preferredModelId?.trim() || "";
    const allowFallback = imagePreference.allowFallback;
    const preferenceSourceLabel =
      imagePreference.source === "project" ? "项目" : "全局默认";

    if (preferredProviderId) {
      const preferredProvider = findImageProviderById(
        imageProviders,
        preferredProviderId,
      );

      if (!preferredProvider) {
        if (!allowFallback) {
          throw new Error(
            `${preferenceSourceLabel}已指定图片服务 ${preferredProviderId}，但当前不可用，请前往设置调整`,
          );
        }
      } else {
        const preferredProviderModels = getImageModelIdsForProvider(
          preferredProvider.id,
          preferredProvider.type,
          preferredProvider.customModels,
        );
        const preferredModel =
          preferredModelId ||
          pickImageModelBySelection(preferredProviderModels, modelType);
        const preferredApiKey = await apiKeyProviderApi.getNextApiKey(
          preferredProvider.id,
        );

        if (preferredApiKey) {
          return {
            provider: preferredProvider,
            model: preferredModel,
            apiKey: preferredApiKey,
          };
        }

        if (!allowFallback) {
          throw new Error(
            `${preferenceSourceLabel}已指定图片服务 ${preferredProviderId}，但当前没有可用 API Key，请前往设置或凭证池调整`,
          );
        }
      }
    }

    const provider = findImageProviderForSelection(imageProviders, modelType);
    if (!provider) {
      throw new Error("未找到可用图片服务，请先在设置中配置 Provider");
    }

    const model = pickImageModelBySelection(
      getImageModelIdsForProvider(
        provider.id,
        provider.type,
        provider.customModels,
      ),
      modelType,
    );
    if (!model) {
      throw new Error("未能解析图片模型，请检查 Provider 模型配置");
    }

    const apiKey = await apiKeyProviderApi.getNextApiKey(provider.id);
    if (!apiKey) {
      throw new Error("该图片服务没有可用 API Key，请先在凭证池中添加");
    }

    return { provider, model, apiKey };
  };

  const requestImageGeneration = async ({
    provider,
    apiKey,
    model,
    prompt,
    size,
    count,
  }: {
    provider: ImageProviderOption;
    apiKey: string;
    model: string;
    prompt: string;
    size: string;
    count: number;
  }): Promise<string[]> => {
    const endpoint = buildProviderEndpoint(
      provider.apiHost,
      "/v1/images/generations",
    );
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: Math.max(1, Math.min(count, 4)),
        size,
      }),
    });
    const rawText = await response.text();
    const payload = tryParseJsonText(rawText);

    if (!response.ok) {
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

    const imageUrls = extractImageUrlsFromResponse(payload);
    if (imageUrls.length === 0) {
      throw new Error("图片服务返回成功但没有可用图片");
    }
    return imageUrls;
  };

  const handleSubmitSearchMaterial = async () => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    if (searchResourceType !== "image") {
      const resourceTypeLabel = getOptionLabel(
        SEARCH_RESOURCE_OPTIONS,
        searchResourceType,
      );
      const submitted =
        await handleSubmitPrompt(`请帮我检索${resourceTypeLabel}素材，关键词：${normalizedQuery}。
请输出可直接使用的素材建议与来源。`);
      if (submitted) {
        appendGeneratedOutput({
          id: `search-${Date.now()}`,
          title: `${resourceTypeLabel}检索任务已提交`,
          detail: `关键词：${normalizedQuery}`,
        });
      }
      return;
    }

    setSearchMaterialSubmitting(true);
    try {
      const response = await invoke<WebImageSearchResponseForRail>(
        "search_web_images",
        {
          req: {
            query: normalizedQuery,
            page: 1,
            perPage: 10,
          },
        },
      );
      const count = response.hits?.length ?? 0;
      const total = response.total ?? count;
      const provider = response.provider || "web";
      const previewName = response.hits?.[0]?.name?.trim() || "无标题素材";
      const summary = `已检索到 ${total} 条结果（当前返回 ${count} 条，来源：${provider}，示例：${previewName}）。`;
      setSearchMaterialResultSummary(summary);
      appendGeneratedOutput({
        id: `search-${Date.now()}`,
        title: "素材检索完成",
        detail: summary,
      });
      toast.success("素材搜索完成");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSearchMaterialResultSummary("");
      toast.error(`素材搜索失败：${message}`);
    } finally {
      setSearchMaterialSubmitting(false);
    }
  };

  const handleSubmitTitleTask = async () => {
    await handleSubmitPrompt(`请根据以下要求生成 10 个标题候选，标题需风格多样且避免重复：
${titleRequirement.trim()}`);
  };

  const handleSubmitImageTask = async () => {
    const normalizedPrompt = imagePrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    setImageSubmitting(true);
    try {
      const { provider, model, apiKey } =
        await resolveImageProviderAndModel(imageModel);
      const size = mapImageSizeTypeToResolution(imageSize);
      const images = await requestImageGeneration({
        provider,
        apiKey,
        model,
        prompt: normalizedPrompt,
        size,
        count: 1,
      });
      appendGeneratedOutput({
        id: `image-${Date.now()}`,
        title: "图片生成成功",
        detail: `${provider.id} · ${model} · ${size}`,
        assetType: "image",
        assetUrl: images[0],
      });
      toast.success(`图片已生成（${provider.id} · ${model}）`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`图片生成失败：${message}`);
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleSubmitCoverTask = async () => {
    const normalizedPrompt = coverDescription.trim();
    if (!normalizedPrompt) {
      return;
    }

    setCoverSubmitting(true);
    try {
      const { provider, model, apiKey } =
        await resolveImageProviderAndModel(imageModel);
      const size = mapCoverPlatformToResolution(coverPlatform);
      const imageCount = Number.parseInt(coverCount, 10);
      const coverPrompt = `请生成${getOptionLabel(
        COVER_PLATFORM_OPTIONS,
        coverPlatform,
      )}平台封面图。要求：${normalizedPrompt}`;
      const images = await requestImageGeneration({
        provider,
        apiKey,
        model,
        prompt: coverPrompt,
        size,
        count: Number.isFinite(imageCount) ? imageCount : 1,
      });
      appendGeneratedOutput({
        id: `cover-${Date.now()}`,
        title: "封面生成成功",
        detail: `${provider.id} · ${model} · ${size} · ${images.length} 张`,
        assetType: "image",
        assetUrl: images[0],
      });
      toast.success(
        `封面已生成 ${images.length} 张（${provider.id} · ${model}）`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`封面生成失败：${message}`);
    } finally {
      setCoverSubmitting(false);
    }
  };

  const closeSearchMaterialPanel = () => {
    setSearchMaterialResultSummary("");
  };

  return {
    closeSearchMaterialPanel,
    coverCount,
    coverDescription,
    coverPlatform,
    coverSubmitting,
    handleSubmitCoverTask,
    handleSubmitImageTask,
    handleSubmitSearchMaterial,
    handleSubmitTitleTask,
    imageModel,
    imagePrompt,
    imageSize,
    imageSubmitting,
    searchMaterialResultSummary,
    searchMaterialSubmitting,
    searchQuery,
    searchResourceType,
    setCoverCount,
    setCoverDescription,
    setCoverPlatform,
    setImageModel,
    setImagePrompt,
    setImageSize,
    setSearchQuery,
    setSearchResourceType,
    setTitleRequirement,
    titleRequirement,
  };
}
