import React, { useRef } from "react";
import styled from "styled-components";
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  Code2,
  Globe,
  Lightbulb,
  ListChecks,
  Paperclip,
  Search,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChatModelSelector } from "./ChatModelSelector";
import { CharacterMention } from "./Inputbar/components/CharacterMention";
import { SkillBadge } from "./Inputbar/components/SkillBadge";
import { SkillSelector } from "./Inputbar/components/SkillSelector";
import { CREATION_MODE_CONFIG } from "./constants";
import type {
  CreationMode,
  EntryTaskSlotValues,
  EntryTaskTemplate,
  EntryTaskType,
} from "./types";
import type { Character } from "@/lib/api/memory";
import type { Skill } from "@/lib/api/skills";

import iconXhs from "@/assets/platforms/xhs.png";
import iconGzh from "@/assets/platforms/gzh.png";
import iconZhihu from "@/assets/platforms/zhihu.png";
import iconToutiao from "@/assets/platforms/toutiao.png";
import iconJuejin from "@/assets/platforms/juejin.png";
import iconCsdn from "@/assets/platforms/csdn.png";
import {
  EMPTY_STATE_ICON_TOOL_BUTTON_CLASSNAME,
  EMPTY_STATE_PASSIVE_BADGE_CLASSNAME,
  EMPTY_STATE_PRIMARY_ACTION_BUTTON_CLASSNAME,
  EMPTY_STATE_SELECT_TRIGGER_CLASSNAME,
  getEmptyStateIconToolButtonClassName,
} from "./emptyStateSurfaceTokens";

const InputCard = styled.div`
  width: 100%;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  border: 1px solid rgba(226, 232, 240, 0.82);
  border-radius: 24px;
  box-shadow:
    0 18px 32px -24px rgba(15, 23, 42, 0.14),
    0 10px 18px -16px rgba(15, 23, 42, 0.08);
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(14px);

  &:hover {
    box-shadow:
      0 20px 36px -24px rgba(15, 23, 42, 0.16),
      0 12px 20px -18px rgba(15, 23, 42, 0.1);
    border-color: rgba(203, 213, 225, 0.92);
  }

  &:focus-within {
    border-color: rgba(148, 163, 184, 0.86);
    box-shadow:
      0 0 0 3px rgba(226, 232, 240, 0.78),
      0 20px 36px -24px rgba(15, 23, 42, 0.12);
  }
`;

const StyledTextarea = styled(Textarea)`
  min-height: 76px;
  padding: 14px 18px;
  border: none;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  background: transparent;
  color: #0f172a;

  &::placeholder {
    color: rgba(100, 116, 139, 0.82);
    font-weight: 300;
  }

  &:focus-visible {
    ring: 0;
    outline: none;
    box-shadow: none;
  }

  @media (min-width: 768px) {
    min-height: 88px;
    padding: 16px 20px;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 10px;
  padding: 10px 14px 12px 14px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(241, 245, 249, 0.82) 100%
  );
  border-top: 1px solid rgba(226, 232, 240, 0.82);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
`;

const ToolLoginLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  flex: 1 1 640px;
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;

const ColorDot = styled.div<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
`;

const GridSelect = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
`;

const GridItem = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid
    ${(props) =>
      props.$active ? "rgba(148, 163, 184, 0.82)" : "transparent"};
  background-color: ${(props) =>
    props.$active ? "rgba(241, 245, 249, 0.96)" : "rgba(248, 250, 252, 0.92)"};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.96);
  }
`;

const EntryTaskContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px 6px 16px;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.84) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-bottom: 1px dashed rgba(203, 213, 225, 0.9);
`;

const EntryTaskTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const EntryTaskTab = styled.button<{ $active?: boolean }>`
  height: 32px;
  padding: 0 12px;
  border-radius: 9999px;
  font-size: 12px;
  border: 1px solid
    ${(props) =>
      props.$active
        ? "rgba(203, 213, 225, 0.92)"
        : "rgba(226, 232, 240, 0.9)"};
  color: ${(props) =>
    props.$active ? "#0f172a" : "#64748b"};
  background: ${(props) =>
    props.$active ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.78)"};
  box-shadow: ${(props) =>
    props.$active ? "0 10px 22px -20px rgba(15, 23, 42, 0.24)" : "none"};
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(203, 213, 225, 0.92);
    color: #0f172a;
  }
`;

const EntryTaskPreview = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
`;

const SlotToken = styled.span`
  color: #0369a1;
  background: rgba(224, 242, 254, 0.95);
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 13px;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
`;

const PLATFORM_ICON_MAP: Record<string, string | undefined> = {
  xiaohongshu: iconXhs,
  wechat: iconGzh,
  zhihu: iconZhihu,
  toutiao: iconToutiao,
  juejin: iconJuejin,
  csdn: iconCsdn,
};

const PLATFORM_LABEL_MAP: Record<string, string> = {
  xiaohongshu: "小红书",
  wechat: "公众号",
  zhihu: "知乎",
  toutiao: "今日头条",
  juejin: "掘金",
  csdn: "CSDN",
};

interface EmptyStateComposerPanelProps {
  input: string;
  setInput: (value: string) => void;
  placeholder: string;
  onSend: () => void;
  activeTheme: string;
  providerType: string;
  setProviderType: (type: string) => void;
  model: string;
  setModel: (model: string) => void;
  executionStrategy?: "react" | "code_orchestrated" | "auto";
  executionStrategyLabel: string;
  setExecutionStrategy?: (
    strategy: "react" | "code_orchestrated" | "auto",
  ) => void;
  onManageProviders?: () => void;
  isGeneralTheme: boolean;
  isEntryTheme: boolean;
  entryTaskType: EntryTaskType;
  entryTaskTypes: EntryTaskType[];
  getEntryTaskTemplate: (type: EntryTaskType) => EntryTaskTemplate;
  entryTemplate: EntryTaskTemplate;
  entryPreview: string;
  entrySlotValues: EntryTaskSlotValues;
  onEntryTaskTypeChange: (type: EntryTaskType) => void;
  onEntrySlotChange: (key: string, value: string) => void;
  characters: Character[];
  skills: Skill[];
  activeSkill?: Skill | null;
  setActiveSkill: (skill: Skill) => void;
  clearActiveSkill: () => void;
  isSkillsLoading: boolean;
  onNavigateToSettings?: () => void;
  onImportSkill?: () => void | Promise<void>;
  onRefreshSkills?: () => void | Promise<void>;
  showCreationModeSelector: boolean;
  creationMode: CreationMode;
  onCreationModeChange?: (mode: CreationMode) => void;
  platform: string;
  setPlatform: (value: string) => void;
  depth: string;
  setDepth: (value: string) => void;
  ratio: string;
  setRatio: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  ratioPopoverOpen: boolean;
  setRatioPopoverOpen: (open: boolean) => void;
  stylePopoverOpen: boolean;
  setStylePopoverOpen: (open: boolean) => void;
  thinkingEnabled: boolean;
  onThinkingEnabledChange?: (enabled: boolean) => void;
  taskEnabled: boolean;
  onTaskEnabledChange?: (enabled: boolean) => void;
  subagentEnabled: boolean;
  onSubagentEnabledChange?: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  onWebSearchEnabledChange?: (enabled: boolean) => void;
  pendingImagesCount: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EmptyStateComposerPanel({
  input,
  setInput,
  placeholder,
  onSend,
  activeTheme,
  providerType,
  setProviderType,
  model,
  setModel,
  executionStrategy = "react",
  executionStrategyLabel,
  setExecutionStrategy,
  onManageProviders,
  isGeneralTheme,
  isEntryTheme,
  entryTaskType,
  entryTaskTypes,
  getEntryTaskTemplate,
  entryTemplate,
  entryPreview,
  entrySlotValues,
  onEntryTaskTypeChange,
  onEntrySlotChange,
  characters,
  skills,
  activeSkill,
  setActiveSkill,
  clearActiveSkill,
  isSkillsLoading,
  onNavigateToSettings,
  onImportSkill,
  onRefreshSkills,
  showCreationModeSelector,
  creationMode,
  onCreationModeChange,
  platform,
  setPlatform,
  depth,
  setDepth,
  ratio,
  setRatio,
  style,
  setStyle,
  ratioPopoverOpen,
  setRatioPopoverOpen,
  stylePopoverOpen,
  setStylePopoverOpen,
  thinkingEnabled,
  onThinkingEnabledChange,
  taskEnabled,
  onTaskEnabledChange,
  subagentEnabled,
  onSubagentEnabledChange,
  webSearchEnabled,
  onWebSearchEnabledChange,
  pendingImagesCount,
  onFileSelect,
}: EmptyStateComposerPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const getPlatformIcon = (value: string) => PLATFORM_ICON_MAP[value];
  const getPlatformLabel = (value: string) =>
    PLATFORM_LABEL_MAP[value] || value;

  return (
    <InputCard>
      {isEntryTheme && (
        <EntryTaskContainer>
          <EntryTaskTabs>
            {entryTaskTypes.map((task) => {
              const taskTemplate =
                task === entryTaskType
                  ? entryTemplate
                  : getEntryTaskTemplate(task);
              return (
                <EntryTaskTab
                  key={task}
                  $active={entryTaskType === task}
                  onClick={() => onEntryTaskTypeChange(task)}
                  title={taskTemplate?.description}
                >
                  {taskTemplate?.label || task}
                </EntryTaskTab>
              );
            })}
          </EntryTaskTabs>

          <EntryTaskPreview>
            {entryPreview.split(/(\[[^\]]+\])/g).map((chunk, index) => {
              const isToken = /^\[[^\]]+\]$/.test(chunk);
              if (!chunk) return null;
              if (!isToken) {
                return (
                  <React.Fragment key={`${chunk}-${index}`}>
                    {chunk}
                  </React.Fragment>
                );
              }

              return <SlotToken key={`${chunk}-${index}`}>{chunk}</SlotToken>;
            })}
          </EntryTaskPreview>

          <SlotGrid>
            {entryTemplate.slots.map((slot) => (
              <Input
                key={slot.key}
                value={entrySlotValues[slot.key] ?? ""}
                onChange={(event) =>
                  onEntrySlotChange(slot.key, event.target.value)
                }
                placeholder={slot.placeholder}
                className="h-9 rounded-xl border-slate-200/80 bg-white/88 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-slate-200"
              />
            ))}
          </SlotGrid>
        </EntryTaskContainer>
      )}

      {activeSkill ? (
        <SkillBadge skill={activeSkill} onClear={clearActiveSkill} />
      ) : null}

      <StyledTextarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />

      <CharacterMention
        characters={characters}
        skills={skills}
        inputRef={textareaRef}
        value={input}
        onChange={setInput}
        onSelectSkill={setActiveSkill}
        onNavigateToSettings={onNavigateToSettings}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onFileSelect}
      />

      {pendingImagesCount > 0 ? (
        <div className="px-6 pb-2 text-xs text-slate-500">
          已添加图片 {pendingImagesCount} 张
        </div>
      ) : null}

      <Toolbar>
        <ToolLoginLeft>
          {isGeneralTheme ? (
            <SkillSelector
              skills={skills}
              activeSkill={activeSkill}
              isLoading={isSkillsLoading}
              onSelectSkill={setActiveSkill}
              onClearSkill={clearActiveSkill}
              onNavigateToSettings={onNavigateToSettings}
              onImportSkill={onImportSkill}
              onRefreshSkills={onRefreshSkills}
            />
          ) : null}

          <ChatModelSelector
            providerType={providerType}
            setProviderType={setProviderType}
            model={model}
            setModel={setModel}
            activeTheme={activeTheme}
            compactTrigger
            popoverSide="top"
            onManageProviders={onManageProviders}
          />

          {activeTheme === "social-media" ? (
            <Select
              value={platform}
              onValueChange={setPlatform}
              closeOnMouseLeave
            >
              <SelectTrigger
                className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} min-w-[120px]`}
              >
                <div className="flex items-center gap-2">
                  {getPlatformIcon(platform) ? (
                    <img
                      src={getPlatformIcon(platform)}
                      className="h-4 w-4 rounded-full"
                    />
                  ) : null}
                  <span>{getPlatformLabel(platform)}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="p-1" side="top">
                <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
                  选择要创作的内容平台
                </div>
                {Object.keys(PLATFORM_LABEL_MAP).map((item) => (
                  <SelectItem key={item} value={item}>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(item) ? (
                        <img
                          src={getPlatformIcon(item)}
                          className="h-4 w-4 rounded-full"
                        />
                      ) : null}
                      {getPlatformLabel(item)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {showCreationModeSelector ? (
            <Select
              value={creationMode}
              onValueChange={(value) =>
                onCreationModeChange?.(value as CreationMode)
              }
            >
              <SelectTrigger
                className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} min-w-[120px]`}
              >
                <div className="flex items-center gap-2">
                  {CREATION_MODE_CONFIG[creationMode].icon}
                  <span>{CREATION_MODE_CONFIG[creationMode].name}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[200px] p-1" side="top">
                <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
                  选择创作模式
                </div>
                {(
                  Object.entries(CREATION_MODE_CONFIG) as [
                    CreationMode,
                    (typeof CREATION_MODE_CONFIG)[CreationMode],
                  ][]
                ).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0">{config.icon}</span>
                      <span className="font-medium">{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {activeTheme === "knowledge" ? (
            <>
              <Badge
                variant="secondary"
                className={`cursor-pointer gap-1 ${EMPTY_STATE_PASSIVE_BADGE_CLASSNAME}`}
              >
                <Search className="mr-1 h-3.5 w-3.5" />
                联网搜索
              </Badge>
              <Select value={depth} onValueChange={setDepth}>
                <SelectTrigger
                  className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} w-[110px]`}
                >
                  <BrainCircuit className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  <SelectValue placeholder="深度" />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="deep">深度解析</SelectItem>
                  <SelectItem value="quick">快速概览</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : null}

          {activeTheme === "planning" ? (
            <Badge
              variant="outline"
              className={EMPTY_STATE_PASSIVE_BADGE_CLASSNAME}
            >
              <Globe className="mr-1 h-3.5 w-3.5" />
              旅行/职业/活动
            </Badge>
          ) : null}

          {activeTheme === "poster" ? (
            <>
              <Popover
                open={ratioPopoverOpen}
                onOpenChange={(open) => {
                  setRatioPopoverOpen(open);
                  if (open) setStylePopoverOpen(false);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} text-xs font-normal`}
                  >
                    <div className="mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border border-current text-[6px]">
                      3:4
                    </div>
                    {ratio}
                    <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 rounded-[20px] border border-slate-200/80 bg-white/96 p-2 shadow-lg shadow-slate-950/10"
                  align="start"
                  side="top"
                >
                  <div className="mb-2 px-2 text-xs font-medium text-slate-500">
                    宽高比
                  </div>
                  <GridSelect>
                    {["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"].map(
                      (item) => (
                        <GridItem
                          key={item}
                          $active={ratio === item}
                          onClick={() => {
                            setRatio(item);
                            setRatioPopoverOpen(false);
                          }}
                        >
                          <div className="mb-1 h-5 w-5 rounded-sm border-2 border-current opacity-50"></div>
                          <span className="text-xs">{item}</span>
                        </GridItem>
                      ),
                    )}
                  </GridSelect>
                </PopoverContent>
              </Popover>

              <Popover
                open={stylePopoverOpen}
                onOpenChange={(open) => {
                  setStylePopoverOpen(open);
                  if (open) setRatioPopoverOpen(false);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} text-xs font-normal`}
                  >
                    <ColorDot $color="#3b82f6" className="mr-2" />
                    {style === "minimal"
                      ? "极简风格"
                      : style === "tech"
                        ? "科技质感"
                        : "温暖治愈"}
                    <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 rounded-[18px] border border-slate-200/80 bg-white/96 p-1 shadow-lg shadow-slate-950/10"
                  align="start"
                  side="top"
                >
                  <div className="p-1">
                    {[
                      ["minimal", "#e2e8f0", "极简风格"],
                      ["tech", "#3b82f6", "科技质感"],
                      ["warm", "#f59e0b", "温暖治愈"],
                    ].map(([value, color, label]) => (
                      <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-start"
                        onClick={() => {
                          setStyle(value);
                          setStylePopoverOpen(false);
                        }}
                      >
                        <ColorDot $color={color} className="mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : null}

          {isGeneralTheme ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className={EMPTY_STATE_ICON_TOOL_BUTTON_CLASSNAME}
                onClick={() => imageInputRef.current?.click()}
                title="上传文件"
              >
                <Paperclip className="h-4 w-4 opacity-70" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={getEmptyStateIconToolButtonClassName(
                  thinkingEnabled,
                  "amber",
                )}
                onClick={() => onThinkingEnabledChange?.(!thinkingEnabled)}
                aria-pressed={thinkingEnabled}
                title={thinkingEnabled ? "关闭深度思考" : "开启深度思考"}
              >
                <Lightbulb className="h-4 w-4 opacity-70" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={getEmptyStateIconToolButtonClassName(
                  taskEnabled,
                  "emerald",
                )}
                onClick={() => onTaskEnabledChange?.(!taskEnabled)}
                aria-pressed={taskEnabled}
                title={taskEnabled ? "关闭后台任务偏好" : "开启后台任务偏好"}
              >
                <ListChecks className="h-4 w-4 opacity-70" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={getEmptyStateIconToolButtonClassName(
                  subagentEnabled,
                  "slate",
                )}
                onClick={() => onSubagentEnabledChange?.(!subagentEnabled)}
                aria-pressed={subagentEnabled}
                title={subagentEnabled ? "关闭多代理偏好" : "开启多代理偏好"}
              >
                <Workflow className="h-4 w-4 opacity-70" />
              </Button>
            </>
          ) : null}

          <Button
            variant="outline"
            size="icon"
            className={getEmptyStateIconToolButtonClassName(
              webSearchEnabled,
              "sky",
            )}
            onClick={() => onWebSearchEnabledChange?.(!webSearchEnabled)}
            aria-pressed={webSearchEnabled}
            title={webSearchEnabled ? "关闭联网搜索" : "开启联网搜索"}
          >
            <Globe className="h-4 w-4 opacity-70" />
          </Button>

          {setExecutionStrategy ? (
            <Select
              value={executionStrategy}
              onValueChange={(value) =>
                setExecutionStrategy(
                  value as "react" | "code_orchestrated" | "auto",
                )
              }
            >
              <SelectTrigger
                className={`${EMPTY_STATE_SELECT_TRIGGER_CLASSNAME} min-w-[124px]`}
              >
                <div className="flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="whitespace-nowrap">
                    {executionStrategyLabel}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent side="top" className="w-[176px] p-1">
                <SelectItem value="react">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Code2 className="h-3.5 w-3.5" />
                    ReAct
                  </div>
                </SelectItem>
                <SelectItem value="code_orchestrated">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Code2 className="h-3.5 w-3.5" />
                    Plan
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Code2 className="h-3.5 w-3.5" />
                    Auto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </ToolLoginLeft>

        <ToolbarRight>
          <Button
            size="sm"
            onClick={onSend}
            disabled={
              !input.trim() && !isEntryTheme && pendingImagesCount === 0
            }
            className={EMPTY_STATE_PRIMARY_ACTION_BUTTON_CLASSNAME}
          >
            开始生成
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </ToolbarRight>
      </Toolbar>
    </InputCard>
  );
}

export default EmptyStateComposerPanel;
