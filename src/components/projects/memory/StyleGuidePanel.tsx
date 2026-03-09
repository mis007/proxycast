/**
 * 风格指南面板
 *
 * 升级后的项目风格编辑器，支持结构化风格配置、预设风格与 Prompt 预览。
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
import {
  FileEdit,
  Gauge,
  LibraryBig,
  Layers3,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Type,
  Wand2,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StyleLibraryPickerDialog } from "@/components/style-library/StyleLibraryPickerDialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStyleLibrary } from "@/hooks/useStyleLibrary";
import {
  type StyleGuide,
  getStyleGuide,
  updateStyleGuide,
} from "@/lib/api/memory";
import {
  STYLE_PRESETS,
  buildStylePromptFromProfile,
  buildStyleGuideUpdateFromProfile,
  cloneStyleProfile,
  getStyleCategoryLabel,
  getStyleProfileFromGuide,
  mergeStyleProfiles,
  type StyleCategory,
  type StyleProfile,
  type StyleToneMetrics,
} from "@/lib/style-guide";
import type { ThemeType } from "@/components/content-creator/types";

interface StyleGuidePanelProps {
  projectId: string;
  highlightSourceEntryId?: string | null;
}

interface FormData {
  style: string;
  tone: string;
  forbidden_words: string[];
  preferred_words: string[];
  examples: string;
  profileName: string;
  category: StyleCategory;
  applicableThemes: ThemeType[];
  targetPlatforms: string[];
  targetAudience: string;
  toneKeywords: string[];
  structureRules: string[];
  languageFeatures: string[];
  rhetoricDevices: string[];
  dos: string[];
  donts: string[];
  simulationStrength: number;
  toneMetrics: StyleToneMetrics;
  customInstruction: string;
}

const THEME_OPTIONS: Array<{ value: ThemeType; label: string }> = [
  { value: "social-media", label: "社媒内容" },
  { value: "document", label: "办公文档" },
  { value: "knowledge", label: "知识探索" },
  { value: "planning", label: "计划规划" },
  { value: "novel", label: "小说创作" },
  { value: "video", label: "视频脚本" },
  { value: "poster", label: "海报文案" },
  { value: "music", label: "歌词曲谱" },
  { value: "general", label: "通用创作" },
];

const PLATFORM_OPTIONS = [
  "公众号",
  "小红书",
  "知乎",
  "视频口播",
  "播客",
  "品牌官网",
  "产品公告",
  "邮件/PRD",
];

const CATEGORY_OPTIONS: Array<{ value: StyleCategory; label: string }> = [
  { value: "platform", label: "平台风格" },
  { value: "genre", label: "文体风格" },
  { value: "persona", label: "人格风格" },
  { value: "brand", label: "品牌风格" },
  { value: "personal", label: "个人风格" },
  { value: "hybrid", label: "混合风格" },
];

const DEFAULT_FORM_DATA: FormData = {
  style: "",
  tone: "",
  forbidden_words: [],
  preferred_words: [],
  examples: "",
  profileName: "项目默认风格",
  category: "hybrid",
  applicableThemes: ["social-media", "document"],
  targetPlatforms: [],
  targetAudience: "",
  toneKeywords: [],
  structureRules: [],
  languageFeatures: [],
  rhetoricDevices: [],
  dos: [],
  donts: [],
  simulationStrength: 70,
  toneMetrics: {
    formality: 60,
    warmth: 50,
    humor: 20,
    emotion: 45,
    assertiveness: 55,
    creativity: 55,
  },
  customInstruction: "",
};

function buildProfileFromForm(formData: FormData): StyleProfile {
  return cloneStyleProfile({
    name: formData.profileName || "项目默认风格",
    description: formData.style,
    category: formData.category,
    applicableThemes: formData.applicableThemes,
    targetPlatforms: formData.targetPlatforms,
    targetAudience: formData.targetAudience,
    toneKeywords: formData.toneKeywords,
    toneMetrics: formData.toneMetrics,
    structureRules: formData.structureRules,
    languageFeatures: formData.languageFeatures,
    rhetoricDevices: formData.rhetoricDevices,
    dos: formData.dos,
    donts: formData.donts,
    simulationStrength: formData.simulationStrength,
    referenceExamples: formData.examples
      .split(/\n{2,}|\n/g)
      .map((item) => item.trim())
      .filter(Boolean),
    customInstruction: formData.customInstruction || formData.tone,
  });
}

function buildFormFromStyleGuide(styleGuide: StyleGuide | null): FormData {
  const profile = getStyleProfileFromGuide(styleGuide);

  if (!styleGuide && !profile) {
    return DEFAULT_FORM_DATA;
  }

  const normalizedProfile = profile || buildProfileFromForm(DEFAULT_FORM_DATA);

  return {
    style: styleGuide?.style || normalizedProfile.description || "",
    tone:
      styleGuide?.tone ||
      normalizedProfile.customInstruction ||
      normalizedProfile.toneKeywords.join("、"),
    forbidden_words: styleGuide?.forbidden_words || [],
    preferred_words: styleGuide?.preferred_words || [],
    examples:
      styleGuide?.examples || normalizedProfile.referenceExamples.join("\n\n"),
    profileName: normalizedProfile.name || "项目默认风格",
    category: normalizedProfile.category,
    applicableThemes:
      normalizedProfile.applicableThemes.length > 0
        ? normalizedProfile.applicableThemes
        : DEFAULT_FORM_DATA.applicableThemes,
    targetPlatforms: normalizedProfile.targetPlatforms,
    targetAudience: normalizedProfile.targetAudience,
    toneKeywords: normalizedProfile.toneKeywords,
    structureRules: normalizedProfile.structureRules,
    languageFeatures: normalizedProfile.languageFeatures,
    rhetoricDevices: normalizedProfile.rhetoricDevices,
    dos: normalizedProfile.dos,
    donts: normalizedProfile.donts,
    simulationStrength: normalizedProfile.simulationStrength,
    toneMetrics: normalizedProfile.toneMetrics,
    customInstruction: normalizedProfile.customInstruction,
  };
}

function buildFormFromProfile(profile: StyleProfile): FormData {
  const normalizedProfile = cloneStyleProfile(profile);

  return {
    ...DEFAULT_FORM_DATA,
    style: normalizedProfile.description,
    tone:
      normalizedProfile.customInstruction ||
      normalizedProfile.toneKeywords.join("、"),
    forbidden_words: normalizedProfile.donts,
    preferred_words: normalizedProfile.dos,
    examples: normalizedProfile.referenceExamples.join("\n\n"),
    profileName: normalizedProfile.name,
    category: normalizedProfile.category,
    applicableThemes:
      normalizedProfile.applicableThemes.length > 0
        ? normalizedProfile.applicableThemes
        : DEFAULT_FORM_DATA.applicableThemes,
    targetPlatforms: normalizedProfile.targetPlatforms,
    targetAudience: normalizedProfile.targetAudience,
    toneKeywords: normalizedProfile.toneKeywords,
    structureRules: normalizedProfile.structureRules,
    languageFeatures: normalizedProfile.languageFeatures,
    rhetoricDevices: normalizedProfile.rhetoricDevices,
    dos: normalizedProfile.dos,
    donts: normalizedProfile.donts,
    simulationStrength: normalizedProfile.simulationStrength,
    toneMetrics: normalizedProfile.toneMetrics,
    customInstruction: normalizedProfile.customInstruction,
  };
}

function MetricSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={0}
        max={100}
        step={1}
      />
    </div>
  );
}

function ToggleChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T[];
  onChange: (value: T[]) => void;
}) {
  const handleToggle = (nextValue: T) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }
    onChange([...value, nextValue]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted/60",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function StyleGuidePanel({
  projectId,
  highlightSourceEntryId,
}: StyleGuidePanelProps) {
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [styleLibraryDialogOpen, setStyleLibraryDialogOpen] = useState(false);
  const { entries: styleLibraryEntries } = useStyleLibrary();

  const highlightedSourceEntry = useMemo(
    () =>
      highlightSourceEntryId
        ? styleLibraryEntries.find(
            (entry) => entry.id === highlightSourceEntryId,
          ) || null
        : null,
    [highlightSourceEntryId, styleLibraryEntries],
  );

  const previewProfile = useMemo(
    () => buildProfileFromForm(formData),
    [formData],
  );
  const previewPrompt = useMemo(
    () =>
      buildStylePromptFromProfile(previewProfile, {
        title: "### 写作风格",
        includeExamples: true,
      }),
    [previewProfile],
  );

  const loadStyleGuide = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStyleGuide(projectId);
      setStyleGuide(data);
      setFormData(buildFormFromStyleGuide(data));
      setHasChanges(false);
    } catch (error) {
      console.error("加载风格指南失败:", error);
      toast.error("加载风格指南失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStyleGuide();
  }, [loadStyleGuide]);

  const handleChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
      setHasChanges(true);
    },
    [],
  );

  const handleToneMetricChange = useCallback(
    (field: keyof StyleToneMetrics, value: number) => {
      setFormData((previous) => ({
        ...previous,
        toneMetrics: {
          ...previous.toneMetrics,
          [field]: value,
        },
      }));
      setHasChanges(true);
    },
    [],
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = STYLE_PRESETS.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }

      const mergedProfile = mergeStyleProfiles(previewProfile, preset.profile);
      const nextForm: FormData = {
        ...formData,
        profileName: mergedProfile.name,
        category: mergedProfile.category,
        style: mergedProfile.description,
        tone:
          mergedProfile.customInstruction ||
          mergedProfile.toneKeywords.join("、"),
        applicableThemes:
          mergedProfile.applicableThemes.length > 0
            ? mergedProfile.applicableThemes
            : formData.applicableThemes,
        targetPlatforms: mergedProfile.targetPlatforms,
        targetAudience: mergedProfile.targetAudience,
        toneKeywords: mergedProfile.toneKeywords,
        structureRules: mergedProfile.structureRules,
        languageFeatures: mergedProfile.languageFeatures,
        rhetoricDevices: mergedProfile.rhetoricDevices,
        dos: mergedProfile.dos,
        donts: mergedProfile.donts,
        simulationStrength: mergedProfile.simulationStrength,
        toneMetrics: mergedProfile.toneMetrics,
        customInstruction: mergedProfile.customInstruction,
        examples:
          mergedProfile.referenceExamples.length > 0
            ? mergedProfile.referenceExamples.join("\n\n")
            : formData.examples,
      };

      setFormData(nextForm);
      setHasChanges(true);
      toast.success(`已应用预设风格：${preset.name}`);
    },
    [formData, previewProfile],
  );

  const handleImportStyleLibrary = useCallback((profile: StyleProfile) => {
    setFormData(buildFormFromProfile(profile));
    setHasChanges(true);
    toast.success(`已从我的风格库导入：${profile.name}`);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const profile = buildProfileFromForm(formData);
      const request = buildStyleGuideUpdateFromProfile(profile, {
        previousExtra: styleGuide?.extra as Record<string, unknown> | undefined,
      });

      const updated = await updateStyleGuide(projectId, request);
      setStyleGuide(updated);
      setFormData(buildFormFromStyleGuide(updated));
      setHasChanges(false);
      toast.success("风格指南已保存");
    } catch (error) {
      console.error("保存风格指南失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }, [formData, projectId, styleGuide?.extra]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
        <Card className="border bg-card">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileEdit className="h-4 w-4" />
                <span className="text-sm">项目风格系统</span>
              </div>
              <div>
                <div className="text-lg font-semibold">统一项目表达方式</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  先选预设或导入风格资产，再按项目需要微调，避免整页信息同时抢注意力。
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                variant="outline"
                onClick={() => setStyleLibraryDialogOpen(true)}
              >
                <LibraryBig className="mr-2 h-4 w-4" />
                从我的风格库导入
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadStyleGuide}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {highlightSourceEntryId ? (
          <Card className="border border-violet-200 bg-violet-50/60 dark:border-violet-900/60 dark:bg-violet-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">来源风格资产</CardTitle>
              <CardDescription>
                你是从“最近应用项目”回到这里的，可直接对来源资产重新导入或对照当前项目策略。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlightedSourceEntry ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {highlightedSourceEntry.profile.name}
                    </Badge>
                    <Badge variant="outline">
                      {highlightedSourceEntry.sourceLabel}
                    </Badge>
                    {highlightedSourceEntry.profile.toneKeywords
                      .slice(0, 3)
                      .map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {highlightedSourceEntry.profile.description ||
                      "该来源资产尚未填写整体风格定位。"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleImportStyleLibrary(highlightedSourceEntry.profile)
                      }
                    >
                      重新导入这条资产
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setStyleLibraryDialogOpen(true)}
                    >
                      从风格库重新选择
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  该来源风格资产当前不可用，可能已被删除；你仍可以继续编辑当前项目风格策略。
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              风格预设与模拟
            </CardTitle>
            <CardDescription>
              先用预设打底，再按项目需要微调。预设不会覆盖你的事实内容，只会帮助统一表达方式。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="flex min-h-[92px] flex-col rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="text-sm font-medium">{preset.name}</div>
                  <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1 md:grid-cols-5">
            <TabsTrigger value="overview" className="gap-1 rounded-lg py-2">
              <Palette className="h-3.5 w-3.5" />
              概览
            </TabsTrigger>
            <TabsTrigger value="tone" className="gap-1 rounded-lg py-2">
              <Gauge className="h-3.5 w-3.5" />
              语气
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-1 rounded-lg py-2">
              <Layers3 className="h-3.5 w-3.5" />
              结构
            </TabsTrigger>
            <TabsTrigger value="lexicon" className="gap-1 rounded-lg py-2">
              <Type className="h-3.5 w-3.5" />
              词汇
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1 rounded-lg py-2">
              <Wand2 className="h-3.5 w-3.5" />
              预览
            </TabsTrigger>
          </TabsList>

          <Card className="border bg-card">
            <CardContent className="p-5">
              <TabsContent value="overview" className="mt-0 space-y-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">风格名称</Label>
                    <Input
                      id="profile-name"
                      value={formData.profileName}
                      onChange={(event) =>
                        handleChange("profileName", event.target.value)
                      }
                      placeholder="例如：轻松但有判断力的技术号"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>风格类别</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleChange("category", value as StyleCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">整体风格定位</Label>
                  <Textarea
                    id="style"
                    value={formData.style}
                    onChange={(event) =>
                      handleChange("style", event.target.value)
                    }
                    placeholder="描述这套风格的整体感觉、创作目标与适用场景..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">语气总说明</Label>
                  <Textarea
                    id="tone"
                    value={formData.tone}
                    onChange={(event) =>
                      handleChange("tone", event.target.value)
                    }
                    placeholder="例如：专业但不刻板，温和但有判断力，避免过度营销感"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">目标受众</Label>
                  <Textarea
                    id="audience"
                    value={formData.targetAudience}
                    onChange={(event) =>
                      handleChange("targetAudience", event.target.value)
                    }
                    placeholder="这套风格主要面对谁？例如：有一定技术背景的产品经理、创业者、运营负责人..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>适用主题</Label>
                  <ToggleChipGroup
                    options={THEME_OPTIONS}
                    value={formData.applicableThemes}
                    onChange={(value) =>
                      handleChange("applicableThemes", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>目标平台</Label>
                  <ToggleChipGroup
                    options={PLATFORM_OPTIONS.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                    value={formData.targetPlatforms}
                    onChange={(value) => handleChange("targetPlatforms", value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-instruction">补充说明</Label>
                  <Textarea
                    id="custom-instruction"
                    value={formData.customInstruction}
                    onChange={(event) =>
                      handleChange("customInstruction", event.target.value)
                    }
                    placeholder="写一些这套风格的额外约束，例如：不要像广告文案，不要把简单观点写得太满。"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tone" className="mt-0 space-y-5">
                <Card className="border bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">风格模拟强度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricSlider
                      label="模拟强度"
                      value={formData.simulationStrength}
                      onChange={(value) =>
                        handleChange("simulationStrength", value)
                      }
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <MetricSlider
                    label="正式度"
                    value={formData.toneMetrics.formality}
                    onChange={(value) =>
                      handleToneMetricChange("formality", value)
                    }
                  />
                  <MetricSlider
                    label="温度"
                    value={formData.toneMetrics.warmth}
                    onChange={(value) =>
                      handleToneMetricChange("warmth", value)
                    }
                  />
                  <MetricSlider
                    label="幽默度"
                    value={formData.toneMetrics.humor}
                    onChange={(value) => handleToneMetricChange("humor", value)}
                  />
                  <MetricSlider
                    label="情绪浓度"
                    value={formData.toneMetrics.emotion}
                    onChange={(value) =>
                      handleToneMetricChange("emotion", value)
                    }
                  />
                  <MetricSlider
                    label="判断力度"
                    value={formData.toneMetrics.assertiveness}
                    onChange={(value) =>
                      handleToneMetricChange("assertiveness", value)
                    }
                  />
                  <MetricSlider
                    label="创造性"
                    value={formData.toneMetrics.creativity}
                    onChange={(value) =>
                      handleToneMetricChange("creativity", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>语气关键词</Label>
                  <TagInput
                    value={formData.toneKeywords}
                    onChange={(value) => handleChange("toneKeywords", value)}
                    placeholder="例如：克制、清晰、温和、有判断力"
                  />
                </div>
              </TabsContent>

              <TabsContent value="structure" className="mt-0 space-y-5">
                <div className="space-y-2">
                  <Label>结构规则</Label>
                  <TagInput
                    value={formData.structureRules}
                    onChange={(value) => handleChange("structureRules", value)}
                    placeholder="例如：先结论后细节、段落控制在 120 字内、多用分点"
                  />
                </div>

                <div className="space-y-2">
                  <Label>语言特征</Label>
                  <TagInput
                    value={formData.languageFeatures}
                    onChange={(value) =>
                      handleChange("languageFeatures", value)
                    }
                    placeholder="例如：短句、少长从句、术语适度、口语化"
                  />
                </div>

                <div className="space-y-2">
                  <Label>修辞倾向</Label>
                  <TagInput
                    value={formData.rhetoricDevices}
                    onChange={(value) => handleChange("rhetoricDevices", value)}
                    placeholder="例如：类比、案例、故事切入、反差开头"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>推荐做法</Label>
                    <TagInput
                      value={formData.dos}
                      onChange={(value) => handleChange("dos", value)}
                      placeholder="例如：多给依据、多给案例、减少抽象空话"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>避免事项</Label>
                    <TagInput
                      value={formData.donts}
                      onChange={(value) => handleChange("donts", value)}
                      placeholder="例如：不要鸡汤化、不要过度营销、不要绝对化结论"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lexicon" className="mt-0 space-y-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>禁用词汇</Label>
                    <TagInput
                      value={formData.forbidden_words}
                      onChange={(value) =>
                        handleChange("forbidden_words", value)
                      }
                      placeholder="输入后按回车添加"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>偏好词汇</Label>
                    <TagInput
                      value={formData.preferred_words}
                      onChange={(value) =>
                        handleChange("preferred_words", value)
                      }
                      placeholder="输入后按回车添加"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examples">示例文本 / 样本特征</Label>
                  <Textarea
                    id="examples"
                    value={formData.examples}
                    onChange={(event) =>
                      handleChange("examples", event.target.value)
                    }
                    placeholder="粘贴 2-5 段代表性文本，或写下这套风格的典型句式、标题和段落示例。"
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    这里既可以放真实样本，也可以放你期望 AI 模仿的表达特征。
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0 space-y-5">
                <Card className="border bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">风格摘要</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {getStyleCategoryLabel(previewProfile.category)}
                      </Badge>
                      <Badge variant="outline">
                        强度 {previewProfile.simulationStrength}
                      </Badge>
                      {previewProfile.targetPlatforms.map((platform) => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      {previewProfile.description || "尚未填写整体风格定位。"}
                    </p>
                    {previewProfile.toneKeywords.length > 0 && (
                      <p>
                        语气关键词：{previewProfile.toneKeywords.join("、")}
                      </p>
                    )}
                    {previewProfile.structureRules.length > 0 && (
                      <p>
                        结构规则：{previewProfile.structureRules.join("；")}
                      </p>
                    )}
                    {previewProfile.donts.length > 0 && (
                      <p>避免事项：{previewProfile.donts.join("；")}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Prompt 预览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-background p-4 text-xs leading-6 text-muted-foreground">
                      {previewPrompt}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {hasChanges && (
          <div className="flex items-center justify-end">
            <div className="rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
              有未保存的风格变更
            </div>
          </div>
        )}
      </div>

      <StyleLibraryPickerDialog
        open={styleLibraryDialogOpen}
        onOpenChange={setStyleLibraryDialogOpen}
        onSelect={(entry) => handleImportStyleLibrary(entry.profile)}
        title="导入我的风格到项目默认风格"
        description="选择一条全局风格资产，导入到当前项目后可继续微调。"
      />
    </>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

function TagInput({
  value,
  onChange,
  placeholder = "输入后按回车添加",
  maxTags = 24,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) {
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    } else if (event.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex min-h-[44px] flex-wrap gap-2 rounded-md border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-sm text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-primary/80"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={value.length >= maxTags}
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none"
      />
      {inputValue && (
        <button
          type="button"
          onClick={addTag}
          className="rounded p-1 hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export default StyleGuidePanel;
