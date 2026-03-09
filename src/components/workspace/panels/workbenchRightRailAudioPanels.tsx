import { AudioLines, Check, ChevronDown, Mic, Music4, Search, User, Users, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  WorkbenchRailActionRow,
  WorkbenchRailFieldLabel,
  WorkbenchRailPanelShell,
  WorkbenchRailSelectTrigger,
  WorkbenchRailTextarea,
} from "./workbenchRightRailPrimitives";
import {
  BGM_DURATION_OPTIONS,
  PODCAST_MODE_OPTIONS,
  SFX_DURATION_OPTIONS,
  VOICEOVER_SPEED_OPTIONS,
  VOICEOVER_TONE_OPTIONS,
  type BgmDurationType,
  type PodcastModeType,
  type PodcastSpeakerModeType,
  type SfxDurationType,
  type VoiceoverSpeedType,
  type VoiceoverToneId,
  type VoiceoverToneTabType,
} from "./workbenchRightRailAudioConfig";

function VoiceTonePickerDialog({
  open,
  activeTab,
  searchKeyword,
  selectedToneId,
  onOpenChange,
  onActiveTabChange,
  onSearchKeywordChange,
  onSelectTone,
}: {
  open: boolean;
  activeTab: VoiceoverToneTabType;
  searchKeyword: string;
  selectedToneId: VoiceoverToneId;
  onOpenChange: (open: boolean) => void;
  onActiveTabChange: (tab: VoiceoverToneTabType) => void;
  onSearchKeywordChange: (value: string) => void;
  onSelectTone: (toneId: VoiceoverToneId) => void;
}) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredTones = VOICEOVER_TONE_OPTIONS.filter((tone) => {
    if (!normalizedKeyword) {
      return true;
    }
    return tone.label.toLowerCase().includes(normalizedKeyword);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-[860px]">
        <div className="space-y-4" data-testid="workbench-voice-tone-dialog">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              placeholder="搜索音色"
              className="h-6 flex-1 border-0 bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "h-9 rounded-lg px-4 text-sm transition-colors",
                activeTab === "mine"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onActiveTabChange("mine")}
            >
              我的音色
            </button>
            <button
              type="button"
              className={cn(
                "h-9 rounded-lg px-4 text-sm transition-colors",
                activeTab === "library"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onActiveTabChange("library")}
            >
              素材库
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pb-1">
            {filteredTones.map((tone) => {
              const selected = tone.id === selectedToneId;
              return (
                <button
                  key={tone.id}
                  type="button"
                  className={cn(
                    "h-20 rounded-xl border px-4 text-left transition-colors",
                    selected
                      ? "border-blue-400 bg-blue-50/60"
                      : "border-slate-200 bg-white hover:border-blue-200",
                  )}
                  onClick={() => {
                    onSelectTone(tone.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-200" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {tone.label}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {tone.gender}
                      </div>
                    </div>
                    {selected ? (
                      <Check className="h-4 w-4 text-blue-500" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateVoiceoverPanel({
  speed,
  toneId,
  prompt,
  isSubmitting,
  generatedAudioUrl,
  toneDialogOpen,
  toneDialogTab,
  toneDialogSearchKeyword,
  onSpeedChange,
  onPromptChange,
  onToneDialogOpenChange,
  onToneDialogTabChange,
  onToneDialogSearchKeywordChange,
  onToneSelect,
  onSubmit,
  onCancel,
}: {
  speed: VoiceoverSpeedType;
  toneId: VoiceoverToneId;
  prompt: string;
  isSubmitting?: boolean;
  generatedAudioUrl?: string;
  toneDialogOpen: boolean;
  toneDialogTab: VoiceoverToneTabType;
  toneDialogSearchKeyword: string;
  onSpeedChange: (value: VoiceoverSpeedType) => void;
  onPromptChange: (value: string) => void;
  onToneDialogOpenChange: (open: boolean) => void;
  onToneDialogTabChange: (tab: VoiceoverToneTabType) => void;
  onToneDialogSearchKeywordChange: (value: string) => void;
  onToneSelect: (toneId: VoiceoverToneId) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const selectedToneLabel =
    VOICEOVER_TONE_OPTIONS.find((tone) => tone.id === toneId)?.label ??
    "请选择音色";

  return (
    <WorkbenchRailPanelShell
      tone="pink"
      icon={Mic}
      title="生成配音"
      testId="workbench-generate-voiceover-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <WorkbenchRailFieldLabel>语速</WorkbenchRailFieldLabel>
            <Select
              value={speed}
              onValueChange={(value) =>
                onSpeedChange(value as VoiceoverSpeedType)
              }
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {VOICEOVER_SPEED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>选择音色</WorkbenchRailFieldLabel>
            <Button
              type="button"
              variant="secondary"
              data-testid="workbench-voice-tone-trigger"
              className="h-9 w-[72px] justify-between rounded-xl bg-muted/60 px-3 text-muted-foreground hover:bg-muted"
              onClick={() => onToneDialogOpenChange(true)}
            >
              <span className="max-w-[34px] truncate">{selectedToneLabel}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>提示词</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="pink"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="请输入提示词"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="生成中..."
          isSubmitting={isSubmitting}
          primaryDisabled={!prompt.trim() || isSubmitting}
          withDivider={true}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />

        {generatedAudioUrl ? (
          <div className="rounded-xl border border-pink-100 bg-pink-50/40 px-3 py-2">
            <audio
              controls
              src={generatedAudioUrl}
              data-testid="workbench-voiceover-audio-preview"
              className="w-full"
            />
          </div>
        ) : null}
      </div>

      <VoiceTonePickerDialog
        open={toneDialogOpen}
        activeTab={toneDialogTab}
        searchKeyword={toneDialogSearchKeyword}
        selectedToneId={toneId}
        onOpenChange={onToneDialogOpenChange}
        onActiveTabChange={onToneDialogTabChange}
        onSearchKeywordChange={onToneDialogSearchKeywordChange}
        onSelectTone={onToneSelect}
      />
    </WorkbenchRailPanelShell>
  );
}

export function GenerateBgmPanel({
  duration,
  prompt,
  isSubmitting,
  onDurationChange,
  onPromptChange,
  onSubmit,
  onCancel,
}: {
  duration: BgmDurationType;
  prompt: string;
  isSubmitting?: boolean;
  onDurationChange: (value: BgmDurationType) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="pink"
      icon={Music4}
      title="生成BGM"
      testId="workbench-generate-bgm-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="w-[88px] space-y-2">
          <WorkbenchRailFieldLabel>时长 (秒)</WorkbenchRailFieldLabel>
          <Select
            value={duration}
            onValueChange={(value) =>
              onDurationChange(value as BgmDurationType)
            }
          >
            <WorkbenchRailSelectTrigger>
              <SelectValue />
            </WorkbenchRailSelectTrigger>
            <SelectContent side="bottom">
              {BGM_DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>提示词</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="pink"
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
          withDivider={true}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

export function GenerateSfxPanel({
  duration,
  prompt,
  isSubmitting,
  onDurationChange,
  onPromptChange,
  onSubmit,
  onCancel,
}: {
  duration: SfxDurationType;
  prompt: string;
  isSubmitting?: boolean;
  onDurationChange: (value: SfxDurationType) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="pink"
      icon={AudioLines}
      title="生成音效"
      testId="workbench-generate-sfx-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="w-[88px] space-y-2">
          <WorkbenchRailFieldLabel>时长 (秒)</WorkbenchRailFieldLabel>
          <Select
            value={duration}
            onValueChange={(value) =>
              onDurationChange(value as SfxDurationType)
            }
          >
            <WorkbenchRailSelectTrigger>
              <SelectValue />
            </WorkbenchRailSelectTrigger>
            <SelectContent side="bottom">
              {SFX_DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <WorkbenchRailFieldLabel>提示词</WorkbenchRailFieldLabel>
          <WorkbenchRailTextarea
            tone="pink"
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
          withDivider={true}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>
    </WorkbenchRailPanelShell>
  );
}

function PodcastVoicePickerDialog({
  open,
  speakerMode,
  searchKeyword,
  onOpenChange,
  onSpeakerModeChange,
  onSearchKeywordChange,
}: {
  open: boolean;
  speakerMode: PodcastSpeakerModeType;
  searchKeyword: string;
  onOpenChange: (open: boolean) => void;
  onSpeakerModeChange: (mode: PodcastSpeakerModeType) => void;
  onSearchKeywordChange: (value: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-[860px]">
        <div className="space-y-4" data-testid="workbench-podcast-voice-dialog">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              placeholder="搜索音色"
              className="h-6 flex-1 border-0 bg-transparent text-sm outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="text-xl font-semibold text-foreground">选择模式</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={cn(
                  "h-[80px] rounded-xl border px-4 text-base font-semibold transition-colors",
                  speakerMode === "dual"
                    ? "border-black text-foreground"
                    : "border-slate-200 text-muted-foreground",
                )}
                onClick={() => onSpeakerModeChange("dual")}
              >
                <span className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>双人</span>
                </span>
              </button>

              <button
                type="button"
                className={cn(
                  "h-[80px] rounded-xl border px-4 text-base font-semibold transition-colors",
                  speakerMode === "single"
                    ? "border-black text-foreground"
                    : "border-slate-200 text-muted-foreground",
                )}
                onClick={() => onSpeakerModeChange("single")}
              >
                <span className="flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  <span>单人</span>
                </span>
              </button>
            </div>
          </div>

          <div className="text-2xl font-semibold text-muted-foreground">
            {speakerMode === "dual" ? "选择 2 种音色" : "选择 1 种音色"}
          </div>

          <div className="min-h-[300px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GeneratePodcastPanel({
  mode,
  prompt,
  isSubmitting,
  podcastVoiceDialogOpen,
  podcastSpeakerMode,
  podcastVoiceSearchKeyword,
  onModeChange,
  onPromptChange,
  onPodcastVoiceDialogOpenChange,
  onPodcastSpeakerModeChange,
  onPodcastVoiceSearchKeywordChange,
  onImportPrompt,
  onSubmit,
  onCancel,
}: {
  mode: PodcastModeType;
  prompt: string;
  isSubmitting?: boolean;
  podcastVoiceDialogOpen: boolean;
  podcastSpeakerMode: PodcastSpeakerModeType;
  podcastVoiceSearchKeyword: string;
  onModeChange: (value: PodcastModeType) => void;
  onPromptChange: (value: string) => void;
  onPodcastVoiceDialogOpenChange: (open: boolean) => void;
  onPodcastSpeakerModeChange: (mode: PodcastSpeakerModeType) => void;
  onPodcastVoiceSearchKeywordChange: (value: string) => void;
  onImportPrompt: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkbenchRailPanelShell
      tone="pink"
      icon={WandSparkles}
      title="生成播客"
      testId="workbench-generate-podcast-panel"
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <WorkbenchRailFieldLabel>播音音色</WorkbenchRailFieldLabel>
            <Button
              type="button"
              variant="secondary"
              data-testid="workbench-podcast-voice-trigger"
              className="h-9 w-[72px] justify-between rounded-xl bg-muted/60 px-3 text-muted-foreground hover:bg-muted"
              onClick={() => onPodcastVoiceDialogOpenChange(true)}
            >
              <span className="max-w-[34px] truncate">选…</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <WorkbenchRailFieldLabel>模式</WorkbenchRailFieldLabel>
            <Select
              value={mode}
              onValueChange={(value) => onModeChange(value as PodcastModeType)}
            >
              <WorkbenchRailSelectTrigger>
                <SelectValue />
              </WorkbenchRailSelectTrigger>
              <SelectContent side="bottom">
                {PODCAST_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <WorkbenchRailFieldLabel>补充提示词</WorkbenchRailFieldLabel>
            <button
              type="button"
              className="text-xs font-semibold text-blue-500 hover:text-blue-600"
              onClick={onImportPrompt}
            >
              一键导入
            </button>
          </div>
          <WorkbenchRailTextarea
            tone="pink"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="你可以输入对播客主题的更多要求"
          />
        </div>

        <WorkbenchRailActionRow
          primaryLabel="一键生成"
          submittingLabel="提交中..."
          isSubmitting={isSubmitting}
          withDivider={true}
          onPrimaryClick={onSubmit}
          onSecondaryClick={onCancel}
        />
      </div>

      <PodcastVoicePickerDialog
        open={podcastVoiceDialogOpen}
        speakerMode={podcastSpeakerMode}
        searchKeyword={podcastVoiceSearchKeyword}
        onOpenChange={onPodcastVoiceDialogOpenChange}
        onSpeakerModeChange={onPodcastSpeakerModeChange}
        onSearchKeywordChange={onPodcastVoiceSearchKeywordChange}
      />
    </WorkbenchRailPanelShell>
  );
}
