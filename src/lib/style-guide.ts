import type { ThemeType } from "@/components/content-creator/types";
import type { StyleGuide, UpdateStyleGuideRequest } from "@/lib/api/memory";

export type StyleCategory =
  | "platform"
  | "genre"
  | "persona"
  | "brand"
  | "personal"
  | "hybrid";

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  platform: "平台风格",
  genre: "文体风格",
  persona: "人格风格",
  brand: "品牌风格",
  personal: "个人风格",
  hybrid: "混合风格",
};

export function getStyleCategoryLabel(category: StyleCategory): string {
  return STYLE_CATEGORY_LABELS[category] || category;
}

export interface StyleToneMetrics {
  formality: number;
  warmth: number;
  humor: number;
  emotion: number;
  assertiveness: number;
  creativity: number;
}

export interface StyleProfile {
  version: 1;
  name: string;
  description: string;
  category: StyleCategory;
  applicableThemes: ThemeType[];
  targetPlatforms: string[];
  targetAudience: string;
  toneKeywords: string[];
  toneMetrics: StyleToneMetrics;
  structureRules: string[];
  languageFeatures: string[];
  rhetoricDevices: string[];
  dos: string[];
  donts: string[];
  simulationStrength: number;
  referenceExamples: string[];
  customInstruction: string;
}

export interface StylePresetDefinition {
  id: string;
  name: string;
  description: string;
  category: StyleCategory;
  applicableThemes: ThemeType[];
  profile: StyleProfile;
}

const DEFAULT_TONE_METRICS: StyleToneMetrics = {
  formality: 60,
  warmth: 50,
  humor: 20,
  emotion: 45,
  assertiveness: 55,
  creativity: 55,
};

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  version: 1,
  name: "项目默认风格",
  description: "",
  category: "hybrid",
  applicableThemes: [],
  targetPlatforms: [],
  targetAudience: "",
  toneKeywords: [],
  toneMetrics: DEFAULT_TONE_METRICS,
  structureRules: [],
  languageFeatures: [],
  rhetoricDevices: [],
  dos: [],
  donts: [],
  simulationStrength: 70,
  referenceExamples: [],
  customInstruction: "",
};

const STYLE_PROFILE_EXTRA_KEY = "styleProfile";

function clampMetric(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeString(item))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function splitKeywords(value: string): string[] {
  return value
    .split(/[、,，\n/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitExampleLines(value?: string | null): string[] {
  return normalizeString(value)
    .split(/\n{2,}|\n/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeThemeArray(value: unknown): ThemeType[] {
  const themes = normalizeStringArray(value);
  return themes.filter(isThemeType) as ThemeType[];
}

function isThemeType(value: string): value is ThemeType {
  return [
    "general",
    "social-media",
    "poster",
    "music",
    "knowledge",
    "planning",
    "document",
    "video",
    "novel",
  ].includes(value);
}

function hasMeaningfulStyleProfileContent(profile: StyleProfile): boolean {
  return Boolean(
    profile.description ||
      profile.targetAudience ||
      profile.toneKeywords.length > 0 ||
      profile.targetPlatforms.length > 0 ||
      profile.structureRules.length > 0 ||
      profile.languageFeatures.length > 0 ||
      profile.rhetoricDevices.length > 0 ||
      profile.dos.length > 0 ||
      profile.donts.length > 0 ||
      profile.referenceExamples.length > 0 ||
      profile.customInstruction ||
      profile.applicableThemes.length > 0,
  );
}

export function cloneStyleProfile(
  profile?: Partial<StyleProfile> | null,
): StyleProfile {
  const next = profile || {};
  const toneMetrics = next.toneMetrics || DEFAULT_TONE_METRICS;

  return {
    version: 1,
    name: normalizeString(next.name) || DEFAULT_STYLE_PROFILE.name,
    description: normalizeString(next.description),
    category: next.category || DEFAULT_STYLE_PROFILE.category,
    applicableThemes: normalizeThemeArray(next.applicableThemes),
    targetPlatforms: normalizeStringArray(next.targetPlatforms),
    targetAudience: normalizeString(next.targetAudience),
    toneKeywords: normalizeStringArray(next.toneKeywords),
    toneMetrics: {
      formality: clampMetric(
        toneMetrics.formality,
        DEFAULT_TONE_METRICS.formality,
      ),
      warmth: clampMetric(toneMetrics.warmth, DEFAULT_TONE_METRICS.warmth),
      humor: clampMetric(toneMetrics.humor, DEFAULT_TONE_METRICS.humor),
      emotion: clampMetric(toneMetrics.emotion, DEFAULT_TONE_METRICS.emotion),
      assertiveness: clampMetric(
        toneMetrics.assertiveness,
        DEFAULT_TONE_METRICS.assertiveness,
      ),
      creativity: clampMetric(
        toneMetrics.creativity,
        DEFAULT_TONE_METRICS.creativity,
      ),
    },
    structureRules: normalizeStringArray(next.structureRules),
    languageFeatures: normalizeStringArray(next.languageFeatures),
    rhetoricDevices: normalizeStringArray(next.rhetoricDevices),
    dos: normalizeStringArray(next.dos),
    donts: normalizeStringArray(next.donts),
    simulationStrength: clampMetric(
      next.simulationStrength,
      DEFAULT_STYLE_PROFILE.simulationStrength,
    ),
    referenceExamples: normalizeStringArray(next.referenceExamples),
    customInstruction: normalizeString(next.customInstruction),
  };
}

export function getStyleProfileFromGuide(
  styleGuide?: StyleGuide | null,
): StyleProfile | null {
  if (!styleGuide) {
    return null;
  }

  const extra =
    styleGuide.extra && typeof styleGuide.extra === "object"
      ? (styleGuide.extra as Record<string, unknown>)
      : undefined;
  const rawProfile = extra?.[STYLE_PROFILE_EXTRA_KEY];

  if (rawProfile && typeof rawProfile === "object") {
    const profile = cloneStyleProfile(rawProfile as Partial<StyleProfile>);
    if (hasMeaningfulStyleProfileContent(profile)) {
      return profile;
    }
  }

  const legacyDescription = normalizeString(styleGuide.style);
  const legacyTone = normalizeString(styleGuide.tone);
  const legacyForbidden = normalizeStringArray(styleGuide.forbidden_words);
  const legacyPreferred = normalizeStringArray(styleGuide.preferred_words);
  const legacyExamples = splitExampleLines(styleGuide.examples);

  if (
    !legacyDescription &&
    !legacyTone &&
    legacyForbidden.length === 0 &&
    legacyPreferred.length === 0 &&
    legacyExamples.length === 0
  ) {
    return null;
  }

  return cloneStyleProfile({
    name: "项目默认风格",
    description: legacyDescription,
    toneKeywords: splitKeywords(legacyTone),
    dos: legacyPreferred,
    donts: legacyForbidden,
    referenceExamples: legacyExamples,
    customInstruction: legacyTone,
  });
}

export function createStyleGuideExtra(
  profile: StyleProfile,
  previousExtra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(previousExtra || {}),
    [STYLE_PROFILE_EXTRA_KEY]: cloneStyleProfile(profile),
  };
}

export function buildStyleGuideUpdateFromProfile(
  profile: StyleProfile,
  options?: {
    previousExtra?: Record<string, unknown>;
  },
): UpdateStyleGuideRequest {
  const normalizedProfile = cloneStyleProfile(profile);
  const tone =
    normalizeString(normalizedProfile.customInstruction) ||
    normalizedProfile.toneKeywords.join("、");

  return {
    style: normalizedProfile.description || undefined,
    tone: tone || undefined,
    forbidden_words:
      normalizedProfile.donts.length > 0 ? normalizedProfile.donts : undefined,
    preferred_words:
      normalizedProfile.dos.length > 0 ? normalizedProfile.dos : undefined,
    examples:
      normalizedProfile.referenceExamples.length > 0
        ? normalizedProfile.referenceExamples.join("\n\n")
        : undefined,
    extra: createStyleGuideExtra(normalizedProfile, options?.previousExtra),
  };
}

export function hasStyleGuideContent(styleGuide?: StyleGuide | null): boolean {
  if (!styleGuide) {
    return false;
  }

  return Boolean(getStyleProfileFromGuide(styleGuide));
}

function mergeStringArrays(...values: Array<string[] | undefined>): string[] {
  const merged = values.flatMap((value) => value || []);
  return merged.filter(
    (item, index) => item.trim() && merged.indexOf(item) === index,
  );
}

export function mergeStyleProfiles(
  base: StyleProfile | null,
  override: Partial<StyleProfile>,
): StyleProfile {
  const normalizedBase = cloneStyleProfile(base || DEFAULT_STYLE_PROFILE);
  const normalizedOverride = cloneStyleProfile(override);

  return {
    ...normalizedBase,
    ...normalizedOverride,
    name: normalizeString(override.name) || normalizedBase.name,
    description:
      normalizeString(override.description) || normalizedBase.description,
    category: override.category || normalizedBase.category,
    applicableThemes:
      normalizeThemeArray(override.applicableThemes).length > 0
        ? normalizeThemeArray(override.applicableThemes)
        : normalizedBase.applicableThemes,
    targetPlatforms: mergeStringArrays(
      normalizedBase.targetPlatforms,
      normalizeStringArray(override.targetPlatforms),
    ),
    targetAudience:
      normalizeString(override.targetAudience) || normalizedBase.targetAudience,
    toneKeywords: mergeStringArrays(
      normalizedBase.toneKeywords,
      normalizeStringArray(override.toneKeywords),
    ),
    toneMetrics: {
      formality: clampMetric(
        override.toneMetrics?.formality,
        normalizedBase.toneMetrics.formality,
      ),
      warmth: clampMetric(
        override.toneMetrics?.warmth,
        normalizedBase.toneMetrics.warmth,
      ),
      humor: clampMetric(
        override.toneMetrics?.humor,
        normalizedBase.toneMetrics.humor,
      ),
      emotion: clampMetric(
        override.toneMetrics?.emotion,
        normalizedBase.toneMetrics.emotion,
      ),
      assertiveness: clampMetric(
        override.toneMetrics?.assertiveness,
        normalizedBase.toneMetrics.assertiveness,
      ),
      creativity: clampMetric(
        override.toneMetrics?.creativity,
        normalizedBase.toneMetrics.creativity,
      ),
    },
    structureRules: mergeStringArrays(
      normalizedBase.structureRules,
      normalizeStringArray(override.structureRules),
    ),
    languageFeatures: mergeStringArrays(
      normalizedBase.languageFeatures,
      normalizeStringArray(override.languageFeatures),
    ),
    rhetoricDevices: mergeStringArrays(
      normalizedBase.rhetoricDevices,
      normalizeStringArray(override.rhetoricDevices),
    ),
    dos: mergeStringArrays(
      normalizedBase.dos,
      normalizeStringArray(override.dos),
    ),
    donts: mergeStringArrays(
      normalizedBase.donts,
      normalizeStringArray(override.donts),
    ),
    simulationStrength: clampMetric(
      override.simulationStrength,
      normalizedBase.simulationStrength,
    ),
    referenceExamples: mergeStringArrays(
      normalizedBase.referenceExamples,
      normalizeStringArray(override.referenceExamples),
    ),
    customInstruction:
      normalizeString(override.customInstruction) ||
      normalizedBase.customInstruction,
  };
}

function createPresetProfile(
  name: string,
  description: string,
  category: StyleCategory,
  applicableThemes: ThemeType[],
  profile: Partial<StyleProfile>,
): StyleProfile {
  return cloneStyleProfile({
    name,
    description,
    category,
    applicableThemes,
    ...profile,
  });
}

export const STYLE_PRESETS: StylePresetDefinition[] = [
  {
    id: "professional-analytical",
    name: "专业分析",
    description: "适合理性拆解、结论明确、信息密度高的内容。",
    category: "persona",
    applicableThemes: ["social-media", "document", "knowledge", "planning"],
    profile: createPresetProfile(
      "专业分析",
      "逻辑清晰、观点明确、结论先行，适合输出分析型内容。",
      "persona",
      ["social-media", "document", "knowledge", "planning"],
      {
        toneKeywords: ["专业", "克制", "清晰", "可靠"],
        toneMetrics: {
          formality: 82,
          warmth: 42,
          humor: 8,
          emotion: 28,
          assertiveness: 76,
          creativity: 46,
        },
        structureRules: ["先结论后展开", "多用分点与小标题", "避免空泛抒情"],
        languageFeatures: ["术语适度", "句子中等偏短", "避免口水话"],
        rhetoricDevices: ["类比解释", "因果拆解"],
        dos: ["优先给判断", "给出依据", "控制夸张表达"],
        donts: ["不要无结论铺垫", "不要口号式表达"],
        simulationStrength: 72,
      },
    ),
  },
  {
    id: "xiaohongshu-friendly",
    name: "小红书表达",
    description: "适合图文/经验分享，强调吸引力、共鸣和可读性。",
    category: "platform",
    applicableThemes: ["social-media", "poster", "video"],
    profile: createPresetProfile(
      "小红书表达",
      "强调开头抓人、段落轻盈、真实感和可执行建议。",
      "platform",
      ["social-media", "poster", "video"],
      {
        targetPlatforms: ["小红书"],
        toneKeywords: ["真诚", "轻松", "有共鸣", "有实感"],
        toneMetrics: {
          formality: 40,
          warmth: 78,
          humor: 28,
          emotion: 62,
          assertiveness: 52,
          creativity: 64,
        },
        structureRules: ["开头快速抛结论", "段落短", "多用场景化分点"],
        languageFeatures: ["口语化", "适度 emoji", "减少长句"],
        rhetoricDevices: ["第一人称经验", "反差开头", "场景代入"],
        dos: ["加入真实体验", "给具体建议", "标题更有抓力"],
        donts: ["不要空泛鸡汤", "不要强营销"],
        simulationStrength: 78,
      },
    ),
  },
  {
    id: "zhihu-rational",
    name: "知乎理性回答",
    description: "适合答疑、论证、分析和知识型表达。",
    category: "platform",
    applicableThemes: ["social-media", "knowledge", "document"],
    profile: createPresetProfile(
      "知乎理性回答",
      "偏理性、结构化、解释充分，适合问答和观点论证。",
      "platform",
      ["social-media", "knowledge", "document"],
      {
        targetPlatforms: ["知乎"],
        toneKeywords: ["理性", "完整", "克制", "解释充分"],
        toneMetrics: {
          formality: 74,
          warmth: 46,
          humor: 10,
          emotion: 25,
          assertiveness: 68,
          creativity: 48,
        },
        structureRules: ["定义问题", "分层论证", "适当给例子"],
        languageFeatures: ["用词准确", "句子中等长度", "可引用概念"],
        rhetoricDevices: ["反例", "对比分析", "条理化解释"],
        dos: ["补充边界条件", "说明适用范围"],
        donts: ["避免绝对化结论", "避免情绪化输出"],
        simulationStrength: 75,
      },
    ),
  },
  {
    id: "wechat-depth",
    name: "公众号深度长文",
    description: "适合深度文章、品牌洞察、案例分析。",
    category: "platform",
    applicableThemes: ["social-media", "document", "knowledge"],
    profile: createPresetProfile(
      "公众号深度长文",
      "强调完整论述、层次感和叙事节奏，适合中长文。",
      "platform",
      ["social-media", "document", "knowledge"],
      {
        targetPlatforms: ["公众号"],
        toneKeywords: ["沉稳", "深度", "有判断", "克制"],
        toneMetrics: {
          formality: 76,
          warmth: 52,
          humor: 6,
          emotion: 38,
          assertiveness: 64,
          creativity: 58,
        },
        structureRules: [
          "标题与导语先抛主题",
          "段落控制在 80-150 字",
          "结尾回扣主题",
        ],
        languageFeatures: ["句式自然", "少堆术语", "适合连续阅读"],
        rhetoricDevices: ["故事切入", "案例论证", "层层推进"],
        dos: ["多给案例", "强化转场", "保持完整叙事"],
        donts: ["不要碎片化堆信息"],
        simulationStrength: 80,
      },
    ),
  },
  {
    id: "podcast-companion",
    name: "播客口播",
    description: "适合口语表达、陪伴感和自然停顿感。",
    category: "genre",
    applicableThemes: ["video", "document", "knowledge", "social-media"],
    profile: createPresetProfile(
      "播客口播",
      "更像说出来而不是写出来，节奏自然，有陪伴感。",
      "genre",
      ["video", "document", "knowledge", "social-media"],
      {
        toneKeywords: ["自然", "陪伴感", "像在聊天", "不过度正式"],
        toneMetrics: {
          formality: 32,
          warmth: 80,
          humor: 24,
          emotion: 48,
          assertiveness: 42,
          creativity: 62,
        },
        structureRules: ["句子更短", "多口语转场", "保留呼吸感"],
        languageFeatures: ["口语化", "适合朗读", "少长从句"],
        rhetoricDevices: ["自问自答", "轻提醒", "陪伴式过渡"],
        dos: ["适合口播节奏", "多用自然转场"],
        donts: ["不要书面腔过重", "不要堆叠密集信息"],
        simulationStrength: 74,
      },
    ),
  },
  {
    id: "storyteller",
    name: "故事化叙述",
    description: "适合提升代入感、节奏感与戏剧性。",
    category: "genre",
    applicableThemes: ["novel", "video", "social-media", "document"],
    profile: createPresetProfile(
      "故事化叙述",
      "通过情境、冲突与细节提升可读性和画面感。",
      "genre",
      ["novel", "video", "social-media", "document"],
      {
        toneKeywords: ["有画面感", "有情境", "有节奏"],
        toneMetrics: {
          formality: 34,
          warmth: 62,
          humor: 18,
          emotion: 66,
          assertiveness: 46,
          creativity: 82,
        },
        structureRules: ["先场景后观点", "增加细节动作", "留出节奏转折"],
        languageFeatures: ["多动词与感官词", "句长有变化"],
        rhetoricDevices: ["场景描写", "对比", "留白"],
        dos: ["保留人物/场景细节", "用故事承载观点"],
        donts: ["不要只罗列观点"],
        simulationStrength: 77,
      },
    ),
  },
  {
    id: "brand-official",
    name: "品牌发布",
    description: "适合品牌说明、正式更新、功能发布与公告。",
    category: "brand",
    applicableThemes: ["document", "social-media", "poster", "video"],
    profile: createPresetProfile(
      "品牌发布",
      "可信、稳定、克制，强调清晰价值与一致对外表达。",
      "brand",
      ["document", "social-media", "poster", "video"],
      {
        toneKeywords: ["可信", "克制", "正式", "统一"],
        toneMetrics: {
          formality: 84,
          warmth: 38,
          humor: 4,
          emotion: 18,
          assertiveness: 70,
          creativity: 36,
        },
        structureRules: ["事实先行", "统一术语", "避免夸张形容"],
        languageFeatures: ["措辞一致", "避免口语化过度"],
        rhetoricDevices: ["少修辞", "强调事实与价值"],
        dos: ["说明更新点", "说明用户价值"],
        donts: ["不要制造焦虑", "不要夸大承诺"],
        simulationStrength: 82,
      },
    ),
  },
  {
    id: "warm-mentor",
    name: "温和陪伴",
    description: "适合解释、鼓励、辅导和更有耐心的表达。",
    category: "persona",
    applicableThemes: ["knowledge", "planning", "document", "social-media"],
    profile: createPresetProfile(
      "温和陪伴",
      "亲和、耐心、有引导感，适合解释和陪伴式表达。",
      "persona",
      ["knowledge", "planning", "document", "social-media"],
      {
        toneKeywords: ["温和", "耐心", "不评判", "循序渐进"],
        toneMetrics: {
          formality: 42,
          warmth: 88,
          humor: 16,
          emotion: 52,
          assertiveness: 36,
          creativity: 54,
        },
        structureRules: ["先共情再建议", "说明步骤", "降低压迫感"],
        languageFeatures: ["易懂", "短句", "避免攻击性表达"],
        rhetoricDevices: ["示例解释", "渐进式引导"],
        dos: ["多用可执行建议", "降低阅读负担"],
        donts: ["不要训诫式表达"],
        simulationStrength: 73,
      },
    ),
  },
];

export function getStylePresetById(
  presetId: string,
): StylePresetDefinition | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === presetId);
}

export function getAvailableStylePresets(
  theme?: ThemeType,
): StylePresetDefinition[] {
  if (!theme) {
    return STYLE_PRESETS;
  }

  return STYLE_PRESETS.filter(
    (preset) =>
      preset.applicableThemes.length === 0 ||
      preset.applicableThemes.includes(theme),
  );
}

function metricLabel(value: number): string {
  if (value >= 75) return "高";
  if (value >= 45) return "中";
  return "低";
}

export function buildStylePromptFromProfile(
  profile: StyleProfile,
  options?: {
    title?: string;
    includeExamples?: boolean;
    intensityOverride?: number;
    extraInstruction?: string;
  },
): string {
  const intensity = clampMetric(
    options?.intensityOverride,
    profile.simulationStrength,
  );
  const lines: string[] = [options?.title || "### 风格控制"];

  if (profile.name) {
    lines.push(`- 风格名称：${profile.name}`);
  }
  if (profile.description) {
    lines.push(`- 风格定位：${profile.description}`);
  }
  lines.push(`- 风格类别：${getStyleCategoryLabel(profile.category)}`);
  if (profile.applicableThemes.length > 0) {
    lines.push(`- 适用主题：${profile.applicableThemes.join("、")}`);
  }
  if (profile.targetPlatforms.length > 0) {
    lines.push(`- 目标平台：${profile.targetPlatforms.join("、")}`);
  }
  if (profile.targetAudience) {
    lines.push(`- 目标受众：${profile.targetAudience}`);
  }
  if (profile.toneKeywords.length > 0) {
    lines.push(`- 语气关键词：${profile.toneKeywords.join("、")}`);
  }

  lines.push(
    `- 风格维度：正式度 ${profile.toneMetrics.formality}/100（${metricLabel(profile.toneMetrics.formality)}），温度 ${profile.toneMetrics.warmth}/100（${metricLabel(profile.toneMetrics.warmth)}），幽默度 ${profile.toneMetrics.humor}/100（${metricLabel(profile.toneMetrics.humor)}），情绪浓度 ${profile.toneMetrics.emotion}/100（${metricLabel(profile.toneMetrics.emotion)}），判断力度 ${profile.toneMetrics.assertiveness}/100（${metricLabel(profile.toneMetrics.assertiveness)}），创造性 ${profile.toneMetrics.creativity}/100（${metricLabel(profile.toneMetrics.creativity)}）`,
  );
  lines.push(`- 模拟强度：${intensity}/100`);

  if (profile.structureRules.length > 0) {
    lines.push(`- 结构要求：${profile.structureRules.join("；")}`);
  }
  if (profile.languageFeatures.length > 0) {
    lines.push(`- 语言特征：${profile.languageFeatures.join("；")}`);
  }
  if (profile.rhetoricDevices.length > 0) {
    lines.push(`- 修辞倾向：${profile.rhetoricDevices.join("；")}`);
  }
  if (profile.dos.length > 0) {
    lines.push(`- 推荐做法：${profile.dos.join("；")}`);
  }
  if (profile.donts.length > 0) {
    lines.push(`- 避免事项：${profile.donts.join("；")}`);
  }
  if (profile.customInstruction) {
    lines.push(`- 补充要求：${profile.customInstruction}`);
  }
  if (options?.extraInstruction) {
    lines.push(`- 本次附加说明：${options.extraInstruction}`);
  }
  if (
    options?.includeExamples !== false &&
    profile.referenceExamples.length > 0
  ) {
    lines.push("- 参考样例特征：");
    profile.referenceExamples.slice(0, 3).forEach((example) => {
      lines.push(`  - ${example}`);
    });
  }

  lines.push("执行要求：");
  lines.push(
    "1. 只调整表达风格、语气、结构与词汇，不改变事实、结论、项目设定与用户硬约束。",
  );
  lines.push(
    "2. 优先保持内容真实、可读、不过度夸张；若风格要求与事实冲突，以事实为先。",
  );
  lines.push("3. 在满足当前任务目标前提下，尽可能稳定地复现上述风格特征。");

  return lines.join("\n");
}

export function buildStylePromptFromGuide(
  styleGuide?: StyleGuide | null,
): string {
  const profile = getStyleProfileFromGuide(styleGuide);
  if (!profile) {
    return "";
  }
  return buildStylePromptFromProfile(profile, {
    title: "### 写作风格",
    includeExamples: true,
  });
}

export function resolveTextStylizeSourceLabel(options?: {
  projectId?: string | null;
  projectStyleGuide?: StyleGuide | null;
}): string {
  if (hasStyleGuideContent(options?.projectStyleGuide)) {
    return "项目默认风格";
  }

  if (options?.projectId) {
    return "未设置项目风格";
  }

  return "通用润色";
}

export function buildTextStylizePrompt(options: {
  content: string;
  platform: string;
  projectStyleGuide?: StyleGuide | null;
}): string {
  const baseContent = options.content.trim();
  const stylePrompt = buildStylePromptFromGuide(options.projectStyleGuide);

  if (stylePrompt) {
    return `请基于当前项目默认风格，对以下文本进行风格化优化。\n\n${stylePrompt}\n\n优化目标：\n1. 只调整风格、语气、措辞、句式和局部结构，不改变原文事实、判断、核心信息与结论。\n2. 让表达更贴合项目默认风格，同时保持可读、自然，不过度夸张。\n3. 若原文与目标风格有冲突，优先保留原意与真实信息，再做适度风格化。\n4. 输出纯文本，不要使用 Markdown 格式。\n\n当前平台：${options.platform}\n\n原始文本：\n<<<CONTENT\n${baseContent}\nCONTENT\n\n请直接输出风格化后的文本，不要添加任何说明或注释。`;
  }

  return `请对以下文本进行风格化优化，使其更加生动、有吸引力，同时保持原意不变。\n\n优化要求：\n1. 增强文字的表现力和感染力\n2. 使用更生动的词汇和修辞手法\n3. 优化句式结构，使其更流畅\n4. 保持原文的核心观点和信息\n5. 适当添加情感色彩，但不要过度夸张\n6. 输出纯文本，不要使用 Markdown 格式\n\n当前平台：${options.platform}\n\n原始文本：\n<<<CONTENT\n${baseContent}\nCONTENT\n\n请直接输出优化后的文本，不要添加任何说明或注释。`;
}

export function buildStyleSummary(styleGuide?: StyleGuide | null): string[] {
  const profile = getStyleProfileFromGuide(styleGuide);
  if (!profile) {
    return [];
  }

  const summary: string[] = [];
  if (profile.description) {
    summary.push(profile.description);
  }
  if (profile.toneKeywords.length > 0) {
    summary.push(`语气：${profile.toneKeywords.slice(0, 4).join(" / ")}`);
  }
  if (profile.targetPlatforms.length > 0) {
    summary.push(`平台：${profile.targetPlatforms.join(" / ")}`);
  }
  if (profile.structureRules.length > 0) {
    summary.push(`结构：${profile.structureRules.slice(0, 2).join("；")}`);
  }
  return summary.slice(0, 4);
}

export interface RuntimeStyleSelection {
  presetId: string;
  strength: number;
  customNotes: string;
  source?: "project-default" | "preset" | "library";
  sourceLabel?: string;
  sourceProfile?: StyleProfile | null;
}

function resolveRuntimeStyleBaseProfile(
  projectStyleGuide: StyleGuide | null | undefined,
  selection: RuntimeStyleSelection,
): StyleProfile | null {
  if (selection.source === "library" && selection.sourceProfile) {
    return cloneStyleProfile(selection.sourceProfile);
  }

  if (
    selection.presetId === "project-default" ||
    selection.source === "project-default"
  ) {
    return getStyleProfileFromGuide(projectStyleGuide);
  }

  return getStylePresetById(selection.presetId)?.profile || null;
}

export function buildRuntimeStyleOverridePrompt(options: {
  projectStyleGuide?: StyleGuide | null;
  selection: RuntimeStyleSelection;
  activeTheme?: ThemeType;
}): string {
  const { projectStyleGuide, selection, activeTheme } = options;
  const baseProfile = resolveRuntimeStyleBaseProfile(
    projectStyleGuide,
    selection,
  );

  if (!baseProfile && !normalizeString(selection.customNotes)) {
    return "";
  }

  const profile = mergeStyleProfiles(baseProfile, {
    applicableThemes: activeTheme
      ? [activeTheme]
      : baseProfile?.applicableThemes,
    customInstruction: normalizeString(selection.customNotes),
    simulationStrength: selection.strength,
  });

  return buildStylePromptFromProfile(profile, {
    title: "【本次任务风格覆盖】",
    includeExamples: false,
    intensityOverride: selection.strength,
  });
}

export function describeRuntimeStyleSelection(options: {
  projectStyleGuide?: StyleGuide | null;
  selection: RuntimeStyleSelection;
}): string {
  const { projectStyleGuide, selection } = options;

  if (selection.source === "library" && selection.sourceProfile) {
    return `${selection.sourceLabel || selection.sourceProfile.name} · 强度 ${selection.strength}`;
  }

  if (selection.presetId === "project-default") {
    const profile = getStyleProfileFromGuide(projectStyleGuide);
    if (profile) {
      return `${profile.name} · 强度 ${selection.strength}`;
    }
    if (selection.customNotes.trim()) {
      return `临时风格说明 · 强度 ${selection.strength}`;
    }
    return "未设置风格";
  }

  const preset = getStylePresetById(selection.presetId);
  if (!preset) {
    return selection.customNotes.trim()
      ? `临时风格说明 · 强度 ${selection.strength}`
      : "未设置风格";
  }

  return `${preset.name} · 强度 ${selection.strength}`;
}

export function buildStyleRewritePrompt(options: {
  content: string;
  stylePrompt: string;
  fileName: string;
}): string {
  return `请在保持事实、结论、关键信息点与总体结构基本不变的前提下，按目标风格重写当前主稿。\n\n${options.stylePrompt}\n\n输出要求：\n1. 必须输出完整重写后的全文。\n2. 必须使用 <write_file path="${options.fileName}"> 包裹正文，以便更新右侧画布。\n3. 标签外只保留一句简短说明。\n4. 不要解释你的重写过程。\n\n当前主稿：\n<<<CONTENT\n${options.content.trim()}\nCONTENT`;
}

export function buildStyleAuditPrompt(options: {
  content: string;
  stylePrompt: string;
}): string {
  return `请根据目标风格检查以下内容是否达标，并输出结构化评估。\n\n${options.stylePrompt}\n\n请按以下格式输出：\n1. 综合评分（0-100）\n2. 语气匹配\n3. 结构匹配\n4. 词汇匹配\n5. 主要偏差点（最多 5 条）\n6. 可执行修正建议（最多 5 条）\n\n待检查内容：\n<<<CONTENT\n${options.content.trim()}\nCONTENT`;
}
