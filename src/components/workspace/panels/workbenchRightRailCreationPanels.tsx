import { Clapperboard, Film, Image, LayoutTemplate, Search, Type, Video } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  COVER_COUNT_OPTIONS,
  COVER_PLATFORM_OPTIONS,
  IMAGE_MODEL_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  SEARCH_RESOURCE_OPTIONS,
  VIDEO_ASSET_DURATION_OPTIONS,
  VIDEO_ASSET_MODEL_OPTIONS,
  VIDEO_ASSET_RATIO_OPTIONS,
  VIDEO_ASSET_VERSION_OPTIONS,
  type CoverCountType,
  type CoverPlatformType,
  type ImageModelType,
  type ImageSizeType,
  type SearchResourceType,
  type VideoAssetDurationType,
  type VideoAssetModelType,
  type VideoAssetRatioType,
  type VideoAssetVersionType,
} from "./workbenchRightRailCreationConfig";
import {
  WorkbenchRailActionRow,
  WorkbenchRailFieldLabel,
  WorkbenchRailPanelShell,
  WorkbenchRailSelectTrigger,
  WorkbenchRailTextarea,
} from "./workbenchRightRailPrimitives";

export function SearchMaterialPanel({
  resourceType,
  searchQuery,
  isSubmitting,
  resultSummary,
  onResourceTypeChange,
  onSearchQueryChange,
  onSubmit,
  onCancel,
}: {
  resourceType: SearchResourceType;
  searchQuery: string;
  isSubmitting?: boolean;
  resultSummary?: string;
  onResourceTypeChange: (value: SearchResourceType) => void;
  onSearchQueryChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="violet"
      icon={Search}
      title="搜索素材"
      testId="workbench-search-material-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <WorkbenchRailFieldLabel>资源类型</WorkbenchRailFieldLabel>
          <Select
            value={resourceType}
            onValueChange={(value) =>
              onResourceTypeChange(value as SearchResourceType)
            }
          >
            <WorkbenchRailSelectTrigger className="w-[88px]">
              <SelectValue />
            </WorkbenchRailSelectTrigger>
            <SelectContent side="bottom" className="min-w-[120px]">
              {SEARCH_RESOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>搜索词</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="violet"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="请输入搜索词"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="提交"
          submittingLabel="搜索中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!searchQuery.trim() || isSubmitting}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />

        {resultSummary ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-[12px] text-violet-700">
            {resultSummary}
          </div>
        ) : null}
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateTitlePanel({
  requirement,
  onRequirementChange,
  onSubmit,
  onCancel,
}: {
  requirement: string;
  onRequirementChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="violet"
      icon={Type}
      title="生成标题"
      testId="workbench-generate-title-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <WorkbenchRailFieldLabel>要求</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="violet"
            value={requirement}
            onChange={(event) => onRequirementChange(event.target.value)}
            placeholder="请输入要求"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          primaryDisabled={!requirement.trim()}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateImagePanel({
  model,
  size,
  prompt,
  isSubmitting,
  onModelChange,
  onSizeChange,
  onPromptChange,
  onSubmit,
  onCancel,
}: {
  model: ImageModelType;
  size: ImageSizeType;
  prompt: string;
  isSubmitting?: boolean;
  onModelChange: (value: ImageModelType) => void;
  onSizeChange: (value: ImageSizeType) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="blue"
      icon={Image}
      title="生成图片"
      testId="workbench-generate-image-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <WorkbenchRailFieldLabel>模型</WorkbenchRailFieldLabel>
            <Select
              value={model}
              onValueChange={(value) => onModelChange(value as ImageModelType)}
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {IMAGE_MODEL_OPTIONS.filter((option) => !option.disabled).map(
                  (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>尺寸</WorkbenchRailFieldLabel>
            <Select
              value={size}
              onValueChange={(value) => onSizeChange(value as ImageSizeType)}
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {IMAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>提示词</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="blue"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="请输入提示词"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="提交中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!prompt.trim() || isSubmitting}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateCoverPanel({
  platform,
  count,
  description,
  isSubmitting,
  onPlatformChange,
  onCountChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: {
  platform: CoverPlatformType;
  count: CoverCountType;
  description: string;
  isSubmitting?: boolean;
  onPlatformChange: (value: CoverPlatformType) => void;
  onCountChange: (value: CoverCountType) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="blue"
      icon={LayoutTemplate}
      title="生成封面"
      testId="workbench-generate-cover-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <WorkbenchRailFieldLabel>投放平台</WorkbenchRailFieldLabel>
            <Select
              value={platform}
              onValueChange={(value) =>
                onPlatformChange(value as CoverPlatformType)
              }
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {COVER_PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>生成数量</WorkbenchRailFieldLabel>
            <Select
              value={count}
              onValueChange={(value) => onCountChange(value as CoverCountType)}
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {COVER_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>封面描述</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="blue"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="请输入封面描述"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="提交中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!description.trim() || isSubmitting}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateStoryboardPanel({
  onSubmit,
  onCancel,
}: {
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="violet"
      icon={Film}
      title="生成分镜"
      testId="workbench-generate-storyboard-panel"
    >
      <div className="mt-4 min-h-[112px]" />

      <WorkbenchRailActionRow
        primaryLabel="一键生成"
        withDivider={true}
        className="mt-4"
        onPrimaryClick={onSubmit}
        onSecondaryClick={onCancel}
      />
    </WorkbenchRailPanelShell>
  );
}

export function GenerateVideoAssetsPanel({
  model,
  version,
  ratio,
  duration,
  prompt,
  isSubmitting,
  onModelChange,
  onVersionChange,
  onRatioChange,
  onDurationChange,
  onPromptChange,
  onSubmit,
  onCancel,
}: {
  model: VideoAssetModelType;
  version: VideoAssetVersionType;
  ratio: VideoAssetRatioType;
  duration: VideoAssetDurationType;
  prompt: string;
  isSubmitting?: boolean;
  onModelChange: (value: VideoAssetModelType) => void;
  onVersionChange: (value: VideoAssetVersionType) => void;
  onRatioChange: (value: VideoAssetRatioType) => void;
  onDurationChange: (value: VideoAssetDurationType) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="blue"
      icon={Clapperboard}
      title="生成视频素材"
      testId="workbench-generate-video-assets-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <WorkbenchRailFieldLabel>模型</WorkbenchRailFieldLabel>
            <Select
              value={model}
              onValueChange={(value) =>
                onModelChange(value as VideoAssetModelType)
              }
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {VIDEO_ASSET_MODEL_OPTIONS.filter(
                  (option) => !option.disabled,
                ).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>版本</WorkbenchRailFieldLabel>
            <Select
              value={version}
              onValueChange={(value) =>
                onVersionChange(value as VideoAssetVersionType)
              }
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {VIDEO_ASSET_VERSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>比例</WorkbenchRailFieldLabel>
            <Select
              value={ratio}
              onValueChange={(value) =>
                onRatioChange(value as VideoAssetRatioType)
              }
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {VIDEO_ASSET_RATIO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-[88px] space-y-2">
          <WorkbenchRailFieldLabel>时长 (秒)</WorkbenchRailFieldLabel>
          <Select
            value={duration}
            onValueChange={(value) =>
              onDurationChange(value as VideoAssetDurationType)
            }
          >
            <WorkbenchRailSelectTrigger>
              <SelectValue />
            </WorkbenchRailSelectTrigger>
            <SelectContent side="bottom">
              {VIDEO_ASSET_DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>提示词</WorkbenchRailFieldLabel>
          <div className="flex items-start gap-3">
            <div className="flex h-[84px] w-[60px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
              <Image className="h-5 w-5" />
            </div>
            <WorkbenchRailTextarea
              tone="blue"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="请输入提示词"
              className="min-h-[84px] flex-1"
            />
          </div>
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="提交中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!prompt.trim() || isSubmitting}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateAIVideoPanel({
  scriptContent,
  isSubmitting,
  onScriptContentChange,
  onSubmit,
  onCancel,
}: {
  scriptContent: string;
  isSubmitting?: boolean;
  onScriptContentChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="blue"
      icon={Video}
      title="生成视频(非AI画面)"
      testId="workbench-generate-ai-video-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <WorkbenchRailFieldLabel>脚本内容</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="blue"
            value={scriptContent}
            onChange={(event) => onScriptContentChange(event.target.value)}
            placeholder="请输入脚本内容"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="提交中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!scriptContent.trim() || isSubmitting}
          withDivider={true}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}
