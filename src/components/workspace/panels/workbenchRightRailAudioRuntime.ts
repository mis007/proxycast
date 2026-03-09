import { apiKeyProviderApi } from "@/lib/api/apiKeyProvider";
import {
  findMediaProviderById,
  findTtsProviderForSelection,
  getTtsModelsForProvider,
  isTtsProvider,
  pickTtsModel,
  resolveMediaGenerationPreference,
} from "@/lib/mediaGeneration";
import {
  buildProviderEndpoint,
  convertBlobToDataUrl,
  extractAudioUrlFromResponse,
  loadWorkbenchProject,
  type TtsProviderOption,
  tryParseJsonText,
} from "./workbenchRightRailCapabilityShared";

export async function resolveTtsProviderAndModel({
  projectId,
  defaultVoicePreference,
}: {
  projectId?: string | null;
  defaultVoicePreference: Parameters<typeof resolveMediaGenerationPreference>[1];
}) {
  const [allProviders, project] = await Promise.all([
    apiKeyProviderApi.getProviders(),
    loadWorkbenchProject(projectId),
  ]);
  const ttsProviders: TtsProviderOption[] = allProviders
    .filter(
      (provider) =>
        provider.enabled &&
        provider.api_key_count > 0 &&
        isTtsProvider(provider.id, provider.type),
    )
    .map((provider) => ({
      id: provider.id,
      type: provider.type,
      apiHost: provider.api_host,
      customModels: provider.custom_models ?? [],
    }));

  const voicePreference = resolveMediaGenerationPreference(
    project?.settings?.voiceGeneration,
    defaultVoicePreference,
  );
  const preferredProviderId =
    voicePreference.preferredProviderId?.trim() || "";
  const preferredModelId = voicePreference.preferredModelId?.trim() || "";
  const allowFallback = voicePreference.allowFallback;
  const preferenceSourceLabel =
    voicePreference.source === "project" ? "项目" : "全局默认";

  if (preferredProviderId) {
    const preferredProvider = findMediaProviderById(
      ttsProviders,
      preferredProviderId,
    );

    if (!preferredProvider) {
      if (!allowFallback) {
        throw new Error(
          `${preferenceSourceLabel}已指定语音服务 ${preferredProviderId}，但当前不可用，请前往设置调整`,
        );
      }
    } else {
      const preferredModel =
        preferredModelId ||
        pickTtsModel(getTtsModelsForProvider(preferredProvider.customModels));
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
          `${preferenceSourceLabel}已指定语音服务 ${preferredProviderId}，但当前没有可用 API Key，请前往设置或凭证池调整`,
        );
      }
    }
  }

  const provider = findTtsProviderForSelection(ttsProviders);
  if (!provider) {
    throw new Error("未找到可用配音服务，请先在设置中配置 Provider");
  }

  const model = pickTtsModel(getTtsModelsForProvider(provider.customModels));
  const apiKey = await apiKeyProviderApi.getNextApiKey(provider.id);
  if (!apiKey) {
    throw new Error("该配音服务没有可用 API Key，请先在凭证池中添加");
  }

  return { provider, model, apiKey };
}

export async function requestAudioGeneration({
  provider,
  apiKey,
  model,
  prompt,
  durationSeconds,
}: {
  provider: TtsProviderOption;
  apiKey: string;
  model: string;
  prompt: string;
  durationSeconds: number;
}): Promise<string> {
  const attempts: Array<{
    endpoint: string;
    body: Record<string, unknown>;
  }> = [
    {
      endpoint: buildProviderEndpoint(provider.apiHost, "/v1/audio/generations"),
      body: {
        model,
        prompt,
        duration: durationSeconds,
        format: "mp3",
      },
    },
    {
      endpoint: buildProviderEndpoint(provider.apiHost, "/v1/audio/speech"),
      body: {
        model,
        voice: "alloy",
        input: prompt,
        speed: 1,
      },
    },
  ];

  let lastError = "";

  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(attempt.body),
      });

      if (!response.ok) {
        const rawText = await response.text();
        const payload = tryParseJsonText(rawText);
        const messageFromPayload = (
          payload?.error as { message?: string } | undefined
        )?.message;
        lastError =
          typeof messageFromPayload === "string" &&
          messageFromPayload.trim().length > 0
            ? messageFromPayload
            : rawText.slice(0, 200);
        continue;
      }

      const contentType =
        response.headers?.get?.("content-type")?.toLowerCase() ?? "";
      if (contentType.includes("application/json")) {
        const rawText = await response.text();
        const payload = tryParseJsonText(rawText);
        const audioUrl = extractAudioUrlFromResponse(payload);
        if (audioUrl) {
          return audioUrl;
        }
        lastError = "音频服务返回成功但没有可用音频地址";
        continue;
      }

      const audioBlob = await response.blob();
      if (audioBlob.size <= 0) {
        lastError = "音频服务返回成功但音频为空";
        continue;
      }

      if (
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        return URL.createObjectURL(audioBlob);
      }

      const dataUrl = await convertBlobToDataUrl(audioBlob);
      if (dataUrl) {
        return dataUrl;
      }
      lastError = "当前环境不支持音频预览";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError || "音频生成失败");
}
