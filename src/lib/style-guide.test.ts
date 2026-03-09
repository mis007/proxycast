import { describe, expect, it } from "vitest";
import {
  buildTextStylizePrompt,
  buildRuntimeStyleOverridePrompt,
  buildStylePromptFromGuide,
  createStyleGuideExtra,
  getStyleProfileFromGuide,
  hasStyleGuideContent,
  resolveTextStylizeSourceLabel,
} from "./style-guide";
import type { StyleGuide } from "@/lib/api/memory";

describe("style-guide", () => {
  it("应从旧版风格指南字段恢复风格画像", () => {
    const styleGuide: StyleGuide = {
      project_id: "project-1",
      style: "克制、清晰、有判断力",
      tone: "专业但不刻板",
      forbidden_words: ["颠覆", "闭眼冲"],
      preferred_words: ["判断", "依据"],
      examples: "先结论后展开\n\n多用案例",
      updated_at: "2026-03-09T00:00:00Z",
    };

    const profile = getStyleProfileFromGuide(styleGuide);
    expect(profile).not.toBeNull();
    expect(profile?.description).toContain("克制");
    expect(profile?.donts).toContain("颠覆");
    expect(profile?.dos).toContain("判断");
  });

  it("仅有结构化 extra 时也应识别为有效风格", () => {
    const styleGuide: StyleGuide = {
      project_id: "project-2",
      style: "",
      forbidden_words: [],
      preferred_words: [],
      updated_at: "2026-03-09T00:00:00Z",
      extra: createStyleGuideExtra({
        version: 1,
        name: "项目默认风格",
        description: "适合知识型创作者的理性表达",
        category: "persona",
        applicableThemes: ["document", "social-media"],
        targetPlatforms: ["公众号", "知乎"],
        targetAudience: "产品经理",
        toneKeywords: ["理性", "克制"],
        toneMetrics: {
          formality: 80,
          warmth: 48,
          humor: 8,
          emotion: 20,
          assertiveness: 72,
          creativity: 40,
        },
        structureRules: ["先结论后细节"],
        languageFeatures: ["句子中等偏短"],
        rhetoricDevices: ["案例说明"],
        dos: ["多给判断依据"],
        donts: ["不要喊口号"],
        simulationStrength: 78,
        referenceExamples: ["标题直接给观点"],
        customInstruction: "不要营销腔",
      }),
    };

    expect(hasStyleGuideContent(styleGuide)).toBe(true);

    const prompt = buildStylePromptFromGuide(styleGuide);
    expect(prompt).toContain("风格类别：人格风格");
    expect(prompt).toContain("公众号");
    expect(prompt).toContain("不要营销腔");
  });

  it("仅填写结构化语气和平台字段时也应识别为有效风格", () => {
    const styleGuide: StyleGuide = {
      project_id: "project-2b",
      style: "",
      forbidden_words: [],
      preferred_words: [],
      updated_at: "2026-03-09T00:00:00Z",
      extra: createStyleGuideExtra({
        version: 1,
        name: "平台表达风格",
        description: "",
        category: "platform",
        applicableThemes: ["social-media"],
        targetPlatforms: ["小红书"],
        targetAudience: "年轻创作者",
        toneKeywords: ["轻松", "真诚"],
        toneMetrics: {
          formality: 35,
          warmth: 82,
          humor: 32,
          emotion: 56,
          assertiveness: 48,
          creativity: 66,
        },
        structureRules: [],
        languageFeatures: [],
        rhetoricDevices: [],
        dos: [],
        donts: [],
        simulationStrength: 74,
        referenceExamples: [],
        customInstruction: "保持真实分享感",
      }),
    };

    const profile = getStyleProfileFromGuide(styleGuide);
    expect(profile).not.toBeNull();
    expect(hasStyleGuideContent(styleGuide)).toBe(true);
    expect(profile?.targetPlatforms).toContain("小红书");
    expect(profile?.customInstruction).toContain("真实分享感");
  });

  it("应构造带临时说明的任务风格覆盖 prompt", () => {
    const prompt = buildRuntimeStyleOverridePrompt({
      selection: {
        presetId: "wechat-depth",
        strength: 88,
        customNotes: "更像成熟创作者的长期观察，不要营销感",
      },
      activeTheme: "social-media",
    });

    expect(prompt).toContain("本次任务风格覆盖");
    expect(prompt).toContain("公众号深度长文");
    expect(prompt).toContain("88/100");
    expect(prompt).toContain("不要营销感");
  });

  it("文本风格化应优先使用项目默认风格", () => {
    const styleGuide: StyleGuide = {
      project_id: "project-style",
      style: "",
      forbidden_words: [],
      preferred_words: [],
      updated_at: "2026-03-09T00:00:00Z",
      extra: createStyleGuideExtra({
        version: 1,
        name: "项目默认风格",
        description: "理性、克制、结论先行",
        category: "persona",
        applicableThemes: ["document"],
        targetPlatforms: ["知乎"],
        targetAudience: "技术管理者",
        toneKeywords: ["理性", "完整"],
        toneMetrics: {
          formality: 78,
          warmth: 42,
          humor: 6,
          emotion: 18,
          assertiveness: 70,
          creativity: 38,
        },
        structureRules: ["先结论后展开"],
        languageFeatures: ["句子中等偏短"],
        rhetoricDevices: ["案例说明"],
        dos: ["补充判断依据"],
        donts: ["不要营销腔"],
        simulationStrength: 76,
        referenceExamples: [],
        customInstruction: "避免空泛抒情",
      }),
    };

    const prompt = buildTextStylizePrompt({
      content: "这是一段待优化的文本。",
      platform: "zhihu",
      projectStyleGuide: styleGuide,
    });

    expect(prompt).toContain("当前项目默认风格");
    expect(prompt).toContain("风格定位：理性、克制、结论先行");
    expect(prompt).toContain("不要营销腔");
    expect(
      resolveTextStylizeSourceLabel({
        projectId: "project-style",
        projectStyleGuide: styleGuide,
      }),
    ).toBe("项目默认风格");
  });

  it("未配置项目风格时应回退为通用润色", () => {
    const prompt = buildTextStylizePrompt({
      content: "这是一段待优化的文本。",
      platform: "markdown",
      projectStyleGuide: null,
    });

    expect(prompt).toContain("更加生动、有吸引力");
    expect(resolveTextStylizeSourceLabel({ projectId: "project-plain" })).toBe(
      "未设置项目风格",
    );
    expect(resolveTextStylizeSourceLabel({ projectId: null })).toBe("通用润色");
  });
});
