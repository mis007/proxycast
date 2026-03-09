import type { ThemeType } from "@/components/content-creator/types";
import type { StyleGuide } from "@/lib/api/memory";
import {
  DEFAULT_STYLE_PROFILE,
  STYLE_PRESETS,
  buildStylePromptFromProfile,
  cloneStyleProfile,
  getStyleProfileFromGuide,
  mergeStyleProfiles,
  type StylePresetDefinition,
  type StyleProfile,
} from "@/lib/style-guide";

export type StyleLibrarySourceType = "upload" | "manual" | "preset";

export interface StyleLibrarySourceFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface StyleLibraryEntry {
  id: string;
  sourceType: StyleLibrarySourceType;
  sourceLabel: string;
  sampleText: string;
  sourceFiles: StyleLibrarySourceFile[];
  profile: StyleProfile;
  previewPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StyleLibraryState {
  version: 1;
  enabled: boolean;
  activeEntryId: string | null;
  entries: StyleLibraryEntry[];
}

export interface StyleLibraryProjectApplication {
  projectId: string;
  entryId: string;
  entryName: string;
  appliedAt: string;
}

export const STYLE_LIBRARY_STORAGE_KEY = "proxycast:style-library:v1";
export const STYLE_LIBRARY_APPLICATION_HISTORY_KEY =
  "proxycast:style-library:applications:v1";
export const STYLE_LIBRARY_CHANGED_EVENT = "style-library-changed";
const MAX_SAMPLE_TEXT_LENGTH = 12_000;
const MAX_APPLICATION_HISTORY = 12;

const DEFAULT_STATE: StyleLibraryState = {
  version: 1,
  enabled: true,
  activeEntryId: null,
  entries: [],
};

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function emitChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(STYLE_LIBRARY_CHANGED_EVENT));
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("解析风格库存储失败:", error);
    return null;
  }
}

function clampArray<T>(value: T[], limit: number): T[] {
  return value.slice(0, limit);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProjectId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown): string {
  return normalizeString(value).slice(0, MAX_SAMPLE_TEXT_LENGTH);
}

function normalizeSourceFiles(value: unknown): StyleLibrarySourceFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : null;
      if (!raw) {
        return null;
      }

      return {
        name: normalizeString(raw.name) || "未命名样本",
        size:
          typeof raw.size === "number" && Number.isFinite(raw.size)
            ? raw.size
            : 0,
        type: normalizeString(raw.type),
        uploadedAt: normalizeString(raw.uploadedAt) || new Date().toISOString(),
      } satisfies StyleLibrarySourceFile;
    })
    .filter((item): item is StyleLibrarySourceFile => Boolean(item));
}

function buildPreviewPrompt(profile: StyleProfile): string {
  return buildStylePromptFromProfile(profile, {
    title: "### 我的风格预览",
    includeExamples: true,
  });
}

function generateStyleLibraryId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `style_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEntry(raw: unknown): StyleLibraryEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const profile = cloneStyleProfile(
    source.profile as Partial<StyleProfile> | null,
  );
  const createdAt =
    normalizeString(source.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(source.updatedAt) || createdAt;

  return {
    id: normalizeString(source.id) || generateStyleLibraryId(),
    sourceType:
      source.sourceType === "upload" ||
      source.sourceType === "manual" ||
      source.sourceType === "preset"
        ? source.sourceType
        : "manual",
    sourceLabel: normalizeString(source.sourceLabel) || "手动创建",
    sampleText: normalizeText(source.sampleText),
    sourceFiles: normalizeSourceFiles(source.sourceFiles),
    profile,
    previewPrompt:
      normalizeString(source.previewPrompt) || buildPreviewPrompt(profile),
    createdAt,
    updatedAt,
  };
}

function normalizeState(raw: unknown): StyleLibraryState {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STATE;
  }

  const source = raw as Record<string, unknown>;
  const entries = Array.isArray(source.entries)
    ? source.entries
        .map((item) => normalizeEntry(item))
        .filter((item): item is StyleLibraryEntry => Boolean(item))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    : [];
  const activeEntryId = normalizeString(source.activeEntryId);

  return {
    version: 1,
    enabled: source.enabled !== false,
    activeEntryId:
      activeEntryId && entries.some((entry) => entry.id === activeEntryId)
        ? activeEntryId
        : entries[0]?.id || null,
    entries,
  };
}

function readState(): StyleLibraryState {
  const storage = getStorage();
  if (!storage) {
    return DEFAULT_STATE;
  }

  return normalizeState(
    safeParseJson<StyleLibraryState>(
      storage.getItem(STYLE_LIBRARY_STORAGE_KEY),
    ),
  );
}

function writeState(nextState: StyleLibraryState): StyleLibraryState {
  const normalized = normalizeState(nextState);
  const storage = getStorage();
  if (storage) {
    storage.setItem(STYLE_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
  }
  emitChange();
  return normalized;
}

function normalizeApplicationHistoryEntry(
  raw: unknown,
): StyleLibraryProjectApplication | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const projectId = normalizeProjectId(source.projectId);
  const entryId = normalizeString(source.entryId);

  if (!projectId || !entryId) {
    return null;
  }

  return {
    projectId,
    entryId,
    entryName: normalizeString(source.entryName) || "未命名风格",
    appliedAt: normalizeString(source.appliedAt) || new Date().toISOString(),
  };
}

function readApplicationHistory(): StyleLibraryProjectApplication[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const parsed = safeParseJson<StyleLibraryProjectApplication[]>(
    storage.getItem(STYLE_LIBRARY_APPLICATION_HISTORY_KEY),
  );
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => normalizeApplicationHistoryEntry(item))
    .filter((item): item is StyleLibraryProjectApplication => Boolean(item))
    .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))
    .slice(0, MAX_APPLICATION_HISTORY);
}

function writeApplicationHistory(
  entries: StyleLibraryProjectApplication[],
): StyleLibraryProjectApplication[] {
  const normalized = entries
    .map((item) => normalizeApplicationHistoryEntry(item))
    .filter((item): item is StyleLibraryProjectApplication => Boolean(item))
    .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))
    .slice(0, MAX_APPLICATION_HISTORY);

  const storage = getStorage();
  if (storage) {
    storage.setItem(
      STYLE_LIBRARY_APPLICATION_HISTORY_KEY,
      JSON.stringify(normalized),
    );
  }
  emitChange();
  return normalized;
}

function countOccurrences(text: string, patterns: string[]): number {
  return patterns.reduce((count, pattern) => {
    if (!pattern) {
      return count;
    }
    const matches = text.match(
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    );
    return count + (matches?.length || 0);
  }, 0);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?；;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferApplicableThemes(
  text: string,
  metrics: StyleProfile["toneMetrics"],
): ThemeType[] {
  const themes = new Set<ThemeType>();
  const lowerText = text.toLowerCase();

  if (/脚本|分镜|镜头|口播|转场|开场/.test(text)) {
    themes.add("video");
  }
  if (/章节|人物|情节|场景|对白|叙事/.test(text)) {
    themes.add("novel");
  }
  if (/步骤|清单|方案|复盘|计划|待办/.test(text)) {
    themes.add("planning");
    themes.add("document");
  }
  if (/知识|教程|方法|原理|拆解|分析/.test(text)) {
    themes.add("knowledge");
    themes.add("document");
  }
  if (
    /小红书|微博|朋友圈|评论区|标题党|转发/.test(text) ||
    metrics.warmth >= 70
  ) {
    themes.add("social-media");
  }
  if (/海报|卖点|视觉|主视觉/.test(text)) {
    themes.add("poster");
  }
  if (/歌词|副歌|旋律|主歌/.test(text)) {
    themes.add("music");
  }
  if (themes.size === 0 || lowerText.includes("通用")) {
    themes.add("general");
  }

  return Array.from(themes).slice(0, 4);
}

function inferCategory(text: string): StyleProfile["category"] {
  if (/品牌|官方|公告|发布/.test(text)) {
    return "brand";
  }
  if (/像|仿佛|叙事|场景|故事/.test(text)) {
    return "genre";
  }
  if (/我|我们|自己的表达|长期写作/.test(text)) {
    return "personal";
  }
  return "hybrid";
}

function truncateLine(value: string, maxLength = 64): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}…`;
}

export function analyzeStyleSample(
  sampleText: string,
  options?: {
    name?: string;
    fallbackDescription?: string;
    existingProfile?: Partial<StyleProfile> | null;
  },
): StyleProfile {
  const normalizedText = normalizeText(sampleText);
  const sentences = splitSentences(normalizedText);
  const paragraphs = splitParagraphs(normalizedText);
  const compactText = normalizedText.replace(/\s+/g, "");
  const averageSentenceLength =
    compactText.length / Math.max(sentences.length, 1);

  const formalWords = [
    "因此",
    "此外",
    "首先",
    "其次",
    "最后",
    "综上",
    "建议",
    "方案",
    "结论",
    "分析",
    "逻辑",
    "目标",
  ];
  const colloquialWords = [
    "其实",
    "就是",
    "真的",
    "大家",
    "咱们",
    "哈哈",
    "吧",
    "啦",
    "哇",
    "家人们",
    "有点",
  ];
  const warmWords = [
    "我们",
    "一起",
    "希望",
    "感谢",
    "理解",
    "陪你",
    "欢迎",
    "不妨",
    "可以",
  ];
  const humorWords = ["哈哈", "离谱", "梗", "笑", "有点意思", "轻松", "好玩"];
  const emotionWords = [
    "喜欢",
    "热爱",
    "焦虑",
    "激动",
    "难过",
    "惊喜",
    "遗憾",
    "期待",
    "担心",
  ];
  const assertiveWords = [
    "必须",
    "一定",
    "直接",
    "核心",
    "关键",
    "本质",
    "不要",
    "务必",
    "结论",
    "判断",
  ];
  const creativeWords = [
    "像",
    "仿佛",
    "画面",
    "故事",
    "场景",
    "镜头",
    "节奏",
    "留白",
    "隐喻",
    "比喻",
  ];
  const listWords = [
    "首先",
    "其次",
    "最后",
    "一是",
    "二是",
    "三是",
    "步骤",
    "清单",
    "总结",
  ];
  const narrativeWords = [
    "后来",
    "当时",
    "那天",
    "然后",
    "忽然",
    "结果",
    "人物",
    "情节",
    "故事",
  ];

  const questionCount = (normalizedText.match(/[?？]/g) || []).length;
  const exclamationCount = (normalizedText.match(/[!！]/g) || []).length;
  const formalHits = countOccurrences(normalizedText, formalWords);
  const colloquialHits = countOccurrences(normalizedText, colloquialWords);
  const warmHits = countOccurrences(normalizedText, warmWords);
  const humorHits = countOccurrences(normalizedText, humorWords);
  const emotionHits = countOccurrences(normalizedText, emotionWords);
  const assertiveHits = countOccurrences(normalizedText, assertiveWords);
  const creativeHits = countOccurrences(normalizedText, creativeWords);
  const listHits = countOccurrences(normalizedText, listWords);
  const narrativeHits = countOccurrences(normalizedText, narrativeWords);
  const hasListMarkers = /(^|\n)\s*(?:[-*•]|\d+[.)、])\s+/m.test(
    normalizedText,
  );
  const hasNumbers = /\d/.test(normalizedText);
  const hasContrast = /但是|然而|不过|相反/.test(normalizedText);

  const toneMetrics = {
    formality: clampMetric(
      54 +
        formalHits * 6 -
        colloquialHits * 8 +
        (averageSentenceLength > 22 ? 6 : 0),
    ),
    warmth: clampMetric(
      42 + warmHits * 8 + exclamationCount * 3 - formalHits * 2,
    ),
    humor: clampMetric(
      10 + humorHits * 16 + exclamationCount * 4 - formalHits * 1,
    ),
    emotion: clampMetric(
      26 + emotionHits * 10 + exclamationCount * 5 + questionCount * 2,
    ),
    assertiveness: clampMetric(
      46 + assertiveHits * 8 + (formalHits > 2 ? 4 : 0),
    ),
    creativity: clampMetric(
      42 + creativeHits * 7 + narrativeHits * 6 + questionCount * 2,
    ),
  } satisfies StyleProfile["toneMetrics"];

  const toneKeywords = [
    toneMetrics.formality >= 72
      ? "正式"
      : toneMetrics.formality <= 40
        ? "口语化"
        : "自然",
    toneMetrics.warmth >= 70
      ? "温和"
      : toneMetrics.warmth <= 35
        ? "克制"
        : "亲和",
    toneMetrics.assertiveness >= 68
      ? "有判断力"
      : toneMetrics.assertiveness <= 38
        ? "留白"
        : "稳健",
    toneMetrics.creativity >= 68 ? "有画面感" : "结构清晰",
    toneMetrics.humor >= 55 ? "轻松" : "不过度玩笑",
  ].filter((item, index, array) => array.indexOf(item) === index);

  const structureRules = clampArray(
    [
      listHits > 0 || hasListMarkers ? "多用分点与顺序结构" : null,
      averageSentenceLength <= 16
        ? "句子偏短，适合快速阅读"
        : "段落信息密度较高，注意层次推进",
      narrativeHits > 1 ? "先场景后观点" : null,
      toneMetrics.formality >= 70 ? "先结论后展开" : null,
      questionCount > 1 ? "适度用设问引导" : null,
    ].filter((item): item is string => Boolean(item)),
    4,
  );

  const languageFeatures = clampArray(
    [
      formalHits >= 2 ? "偏书面表达" : null,
      colloquialHits >= 2 ? "口语化表达" : null,
      averageSentenceLength <= 14 ? "短句推进" : "句长中等偏长",
      hasNumbers ? "数字/结论驱动" : null,
      questionCount > 0 ? "常用提问引导" : null,
    ].filter((item): item is string => Boolean(item)),
    4,
  );

  const rhetoricDevices = clampArray(
    [
      creativeHits >= 2 ? "类比/比喻" : null,
      hasContrast ? "对比" : null,
      questionCount > 0 ? "设问" : null,
      narrativeHits > 1 ? "场景化叙述" : null,
    ].filter((item): item is string => Boolean(item)),
    4,
  );

  const dos = clampArray(
    [
      toneMetrics.formality >= 70 ? "优先给出清晰判断" : null,
      toneMetrics.warmth >= 65 ? "保留交流感与陪伴感" : null,
      toneMetrics.assertiveness >= 65 ? "关键结论表达明确" : null,
      toneMetrics.creativity >= 68 ? "保留画面感与节奏变化" : null,
      hasNumbers ? "适合补充数据或事实依据" : null,
    ].filter((item): item is string => Boolean(item)),
    4,
  );

  const donts = clampArray(
    [
      toneMetrics.formality >= 70 ? "避免口水话和空泛抒情" : null,
      toneMetrics.humor >= 55 ? "不要过度段子化" : null,
      toneMetrics.assertiveness >= 65 ? "不要模糊摇摆" : null,
      toneMetrics.warmth <= 35 ? "不要生硬命令式表达" : null,
    ].filter((item): item is string => Boolean(item)),
    4,
  );

  const referenceExamples = clampArray(
    (paragraphs.length > 0 ? paragraphs : sentences)
      .map((item) => truncateLine(item))
      .filter(Boolean),
    3,
  );

  const description =
    options?.fallbackDescription ||
    [
      toneMetrics.formality >= 72
        ? "整体偏正式"
        : toneMetrics.formality <= 40
          ? "整体偏口语"
          : "正式度适中",
      toneMetrics.warmth >= 68 ? "有明显亲和力" : "表达较克制",
      toneMetrics.assertiveness >= 68 ? "判断表达明确" : "判断力度中等",
      toneMetrics.creativity >= 68 ? "有画面感与节奏变化" : "结构更偏清晰稳定",
    ].join("，") + "。";

  const baseProfile = cloneStyleProfile({
    ...options?.existingProfile,
    name: normalizeString(options?.name) || "我的风格",
    description,
    category: inferCategory(normalizedText),
    applicableThemes: inferApplicableThemes(normalizedText, toneMetrics),
    targetPlatforms: [],
    targetAudience: "",
    toneKeywords,
    toneMetrics,
    structureRules,
    languageFeatures,
    rhetoricDevices,
    dos,
    donts,
    simulationStrength: clampMetric(
      72 + Math.max(creativeHits, assertiveHits, warmHits),
    ),
    referenceExamples,
    customInstruction: "",
  });

  return mergeStyleProfiles(baseProfile, options?.existingProfile || {});
}

export function getStyleLibraryState(): StyleLibraryState {
  return readState();
}

export function getStyleLibraryApplicationHistory(): StyleLibraryProjectApplication[] {
  return readApplicationHistory();
}

export function listStyleLibraryEntries(): StyleLibraryEntry[] {
  return readState().entries;
}

export function isStyleLibraryEnabled(): boolean {
  return readState().enabled;
}

export function getStyleLibraryEntry(id: string): StyleLibraryEntry | null {
  return listStyleLibraryEntries().find((entry) => entry.id === id) || null;
}

export function setStyleLibraryEnabled(enabled: boolean): StyleLibraryState {
  const state = readState();
  return writeState({
    ...state,
    enabled,
  });
}

export function setActiveStyleLibraryEntry(
  entryId: string | null,
): StyleLibraryState {
  const state = readState();
  const nextId =
    entryId && state.entries.some((entry) => entry.id === entryId)
      ? entryId
      : state.entries[0]?.id || null;

  return writeState({
    ...state,
    activeEntryId: nextId,
  });
}

export function saveStyleLibraryEntry(
  entry: StyleLibraryEntry,
): StyleLibraryEntry {
  const state = readState();
  const normalizedEntry = normalizeEntry(entry);
  if (!normalizedEntry) {
    throw new Error("无效的风格条目");
  }

  const withoutCurrent = state.entries.filter(
    (item) => item.id !== normalizedEntry.id,
  );
  const nextEntries = [normalizedEntry, ...withoutCurrent].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );

  writeState({
    ...state,
    activeEntryId: normalizedEntry.id,
    entries: nextEntries,
  });

  return normalizedEntry;
}

export function updateStyleLibraryEntry(
  entryId: string,
  updates: Partial<Omit<StyleLibraryEntry, "id" | "createdAt">>,
): StyleLibraryEntry | null {
  const current = getStyleLibraryEntry(entryId);
  if (!current) {
    return null;
  }

  const nextProfile = updates.profile
    ? cloneStyleProfile(updates.profile)
    : current.profile;
  const nextEntry: StyleLibraryEntry = {
    ...current,
    ...updates,
    sampleText:
      updates.sampleText !== undefined
        ? normalizeText(updates.sampleText)
        : current.sampleText,
    sourceLabel:
      updates.sourceLabel !== undefined
        ? normalizeString(updates.sourceLabel) || current.sourceLabel
        : current.sourceLabel,
    sourceFiles:
      updates.sourceFiles !== undefined
        ? normalizeSourceFiles(updates.sourceFiles)
        : current.sourceFiles,
    profile: nextProfile,
    previewPrompt: buildPreviewPrompt(nextProfile),
    updatedAt: new Date().toISOString(),
  };

  return saveStyleLibraryEntry(nextEntry);
}

export function recordStyleLibraryApplication(input: {
  projectId: string;
  entryId: string;
  entryName: string;
}): StyleLibraryProjectApplication[] {
  const projectId = normalizeProjectId(input.projectId);
  const entryId = normalizeString(input.entryId);

  if (!projectId || !entryId) {
    return readApplicationHistory();
  }

  const nextEntry: StyleLibraryProjectApplication = {
    projectId,
    entryId,
    entryName: normalizeString(input.entryName) || "未命名风格",
    appliedAt: new Date().toISOString(),
  };

  const previous = readApplicationHistory().filter(
    (item) => !(item.projectId === projectId && item.entryId === entryId),
  );

  return writeApplicationHistory([nextEntry, ...previous]);
}

export function deleteStyleLibraryEntry(entryId: string): StyleLibraryState {
  const state = readState();
  const nextEntries = state.entries.filter((entry) => entry.id !== entryId);

  return writeState({
    ...state,
    activeEntryId:
      state.activeEntryId === entryId
        ? nextEntries[0]?.id || null
        : state.activeEntryId,
    entries: nextEntries,
  });
}

export function createEmptyStyleLibraryEntry(name?: string): StyleLibraryEntry {
  const now = new Date().toISOString();
  const profile = cloneStyleProfile({
    ...DEFAULT_STYLE_PROFILE,
    name:
      normalizeString(name) ||
      `自定义风格 ${listStyleLibraryEntries().length + 1}`,
    category: "personal",
  });

  return {
    id: generateStyleLibraryId(),
    sourceType: "manual",
    sourceLabel: "手动创建",
    sampleText: "",
    sourceFiles: [],
    profile,
    previewPrompt: buildPreviewPrompt(profile),
    createdAt: now,
    updatedAt: now,
  };
}

export function createStyleLibraryEntryFromPreset(
  preset: StylePresetDefinition,
): StyleLibraryEntry {
  const now = new Date().toISOString();
  const profile = cloneStyleProfile({
    ...preset.profile,
    name: preset.name,
    description: preset.description,
    category: preset.category,
    applicableThemes: preset.applicableThemes,
  });

  return {
    id: generateStyleLibraryId(),
    sourceType: "preset",
    sourceLabel: "系统预设",
    sampleText: "",
    sourceFiles: [],
    profile,
    previewPrompt: buildPreviewPrompt(profile),
    createdAt: now,
    updatedAt: now,
  };
}

export function createStyleLibraryEntryFromSample(options: {
  name?: string;
  sampleText: string;
  sourceType?: StyleLibrarySourceType;
  sourceLabel?: string;
  sourceFiles?: StyleLibrarySourceFile[];
}): StyleLibraryEntry {
  const now = new Date().toISOString();
  const profile = analyzeStyleSample(options.sampleText, {
    name: options.name,
  });

  return {
    id: generateStyleLibraryId(),
    sourceType: options.sourceType || "upload",
    sourceLabel: normalizeString(options.sourceLabel) || "上传样本",
    sampleText: normalizeText(options.sampleText),
    sourceFiles: normalizeSourceFiles(options.sourceFiles),
    profile,
    previewPrompt: buildPreviewPrompt(profile),
    createdAt: now,
    updatedAt: now,
  };
}

export function hydrateStyleLibraryPresets(): StyleLibraryEntry[] {
  return STYLE_PRESETS.map((preset) =>
    createStyleLibraryEntryFromPreset(preset),
  );
}

export function themeMatchesStyleLibraryEntry(
  entry: StyleLibraryEntry,
  theme?: ThemeType,
): boolean {
  if (!theme) {
    return true;
  }

  return (
    entry.profile.applicableThemes.length === 0 ||
    entry.profile.applicableThemes.includes(theme)
  );
}

export function getStyleLibraryEntriesForTheme(
  theme?: ThemeType,
): StyleLibraryEntry[] {
  return listStyleLibraryEntries().filter((entry) =>
    themeMatchesStyleLibraryEntry(entry, theme),
  );
}

export function buildStyleLibraryEntryFromGuide(
  styleGuide: StyleGuide,
  sourceLabel = "项目默认风格",
): StyleLibraryEntry | null {
  const profile = getStyleProfileFromGuide(styleGuide);
  if (!profile) {
    return null;
  }

  const now = new Date().toISOString();
  const normalizedProfile = cloneStyleProfile(profile);

  return {
    id: generateStyleLibraryId(),
    sourceType: "manual",
    sourceLabel,
    sampleText: "",
    sourceFiles: [],
    profile: normalizedProfile,
    previewPrompt: buildPreviewPrompt(normalizedProfile),
    createdAt: now,
    updatedAt: now,
  };
}
