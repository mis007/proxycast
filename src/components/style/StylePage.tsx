import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FolderKanban,
  Lightbulb,
  Palette,
  PanelsTopLeft,
  Sparkles,
  Wand2,
} from "lucide-react";
import type {
  Page,
  PageParams,
  StylePageParams,
  StylePageSection,
} from "@/types/page";
import {
  getStoredResourceProjectId,
  onResourceProjectChange,
} from "@/lib/resourceProjectSelection";
import { getStyleGuide, type StyleGuide } from "@/lib/api/memory";
import {
  getProject,
  getProjectTypeLabel,
  listProjects,
  type Project,
} from "@/lib/api/project";
import {
  buildStyleSummary,
  hasStyleGuideContent,
  resolveTextStylizeSourceLabel,
} from "@/lib/style-guide";
import { useStyleLibrary } from "@/hooks/useStyleLibrary";
import {
  getStyleLibraryApplicationHistory,
  setActiveStyleLibraryEntry,
  setStyleLibraryEnabled,
  type StyleLibraryEntry,
  type StyleLibraryProjectApplication,
} from "@/lib/style-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StyleLibraryPanel } from "@/components/memory/StyleLibraryPanel";
import { cn } from "@/lib/utils";

interface StylePageProps {
  onNavigate?: (page: Page, params?: PageParams) => void;
  pageParams?: StylePageParams;
}

interface ResolvedApplicationHistoryItem
  extends StyleLibraryProjectApplication {
  projectName: string;
  workspaceLabel: string | null;
}

const SECTION_META: Record<
  StylePageSection,
  { eyebrow: string; title: string; description: string }
> = {
  overview: {
    eyebrow: "风格资产中心",
    title: "我的风格",
    description: "先确认状态与下一步动作，再进入具体工作台。",
  },
  library: {
    eyebrow: "风格库工作台",
    title: "管理风格资产",
    description: "左侧选择资产，中间编辑，右侧预览与应用。",
  },
};

function resolveStyleSection(
  section?: StylePageParams["section"],
): StylePageSection {
  return section === "library" ? "library" : "overview";
}

function SectionTabs({
  activeSection,
  onChange,
}: {
  activeSection: StylePageSection;
  onChange: (section: StylePageSection) => void;
}) {
  const tabs: Array<{ key: StylePageSection; label: string }> = [
    { key: "overview", label: "总览" },
    { key: "library", label: "风格库工作台" },
  ];

  return (
    <div className="inline-flex rounded-xl border bg-card p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            activeSection === tab.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function RecentEntryCard({
  entry,
  onOpen,
}: {
  entry: StyleLibraryEntry;
  onOpen: (entry: StyleLibraryEntry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="rounded-xl border bg-card px-4 py-4 text-left transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium">{entry.profile.name}</div>
            <Badge variant="outline">{entry.sourceLabel}</Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {entry.profile.description || "尚未补充风格定位"}
          </p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {entry.profile.toneKeywords.slice(0, 3).map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    </button>
  );
}

function formatAppliedAtLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function RecentApplicationCard({
  item,
  isCurrentProject,
  onOpenProject,
  onOpenEntry,
}: {
  item: ResolvedApplicationHistoryItem;
  isCurrentProject: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenEntry: (entryId: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4",
        isCurrentProject ? "border-primary bg-primary/5" : "bg-card",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium">{item.projectName}</div>
        {isCurrentProject ? <Badge variant="secondary">当前项目</Badge> : null}
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        关联风格：{item.entryName}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {item.workspaceLabel ? `${item.workspaceLabel} · ` : ""}
        应用于 {formatAppliedAtLabel(item.appliedAt)}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onOpenProject(item.projectId)}
        >
          查看项目风格
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onOpenEntry(item.entryId)}
        >
          查看资产
        </Button>
      </div>
    </div>
  );
}

function RecommendedActions({
  items,
}: {
  items: Array<{
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    disabled?: boolean;
  }>;
}) {
  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4" />
          推荐下一步
        </CardTitle>
        <CardDescription>
          根据当前状态，只展示最值得先做的动作。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border px-4 py-4">
            <div className="text-sm font-medium">{item.title}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </div>
            <Button
              className="mt-4 w-full"
              variant={item.disabled ? "outline" : "default"}
              disabled={item.disabled}
              onClick={item.onAction}
            >
              {item.actionLabel}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewSection({
  enabled,
  activeEntryName,
  entryCount,
  recentEntries,
  project,
  projectId,
  projectStyleGuide,
  recentApplications,
  onEnableChange,
  onEnterLibrary,
  onOpenProjectStyleGuide,
  onOpenAppliedProject,
  onOpenAppliedEntry,
  onOpenProjects,
  onOpenRecentEntry,
}: {
  enabled: boolean;
  activeEntryName: string;
  entryCount: number;
  recentEntries: StyleLibraryEntry[];
  project: Project | null;
  projectId: string | null;
  projectStyleGuide: StyleGuide | null;
  recentApplications: ResolvedApplicationHistoryItem[];
  onEnableChange: (checked: boolean) => void;
  onEnterLibrary: () => void;
  onOpenProjectStyleGuide: () => void;
  onOpenAppliedProject: (projectId: string, entryId: string) => void;
  onOpenAppliedEntry: (entryId: string) => void;
  onOpenProjects: () => void;
  onOpenRecentEntry: (entry: StyleLibraryEntry) => void;
}) {
  const projectStyleSummary = buildStyleSummary(projectStyleGuide);
  const textStylizeSourceLabel = resolveTextStylizeSourceLabel({
    projectId,
    projectStyleGuide,
  });

  const recommendedActions = useMemo(() => {
    if (entryCount === 0) {
      return [
        {
          title: "创建第一条风格资产",
          description:
            "先上传代表作或新建手动风格，建立一条可复用的个人风格基线。",
          actionLabel: "进入工作台开始创建",
          onAction: onEnterLibrary,
        },
      ];
    }

    if (!enabled) {
      return [
        {
          title: "启用我的风格",
          description:
            "先打开全局开关，否则风格资产不会出现在创作任务选择器中。",
          actionLabel: "立即启用",
          onAction: () => onEnableChange(true),
        },
      ];
    }

    if (!projectId) {
      return [
        {
          title: "选择一个项目",
          description:
            "选择项目后，才能把风格资产应用成项目默认风格，并被画布即时风格化消费。",
          actionLabel: "去选择项目",
          onAction: onOpenProjects,
        },
      ];
    }

    if (!hasStyleGuideContent(projectStyleGuide)) {
      return [
        {
          title: "为当前项目设置默认风格",
          description:
            "当前项目还没有默认风格。建议先在工作台选中一条资产，再应用到项目。",
          actionLabel: "进入工作台设置",
          onAction: onEnterLibrary,
        },
        {
          title: "直接打开项目风格策略",
          description: "如果你想先手动补策略，也可以直接进入项目风格编辑器。",
          actionLabel: "打开项目风格策略",
          onAction: onOpenProjectStyleGuide,
        },
      ];
    }

    return [
      {
        title: "继续完善项目风格策略",
        description: "当前项目已经有默认风格，可以继续微调规则和约束。",
        actionLabel: "打开项目风格策略",
        onAction: onOpenProjectStyleGuide,
      },
      {
        title: "继续沉淀风格资产",
        description:
          "如果项目风格已稳定，下一步适合回到工作台补充更多可复用资产。",
        actionLabel: "进入风格库工作台",
        onAction: onEnterLibrary,
      },
    ];
  }, [
    enabled,
    entryCount,
    onEnableChange,
    onEnterLibrary,
    onOpenProjectStyleGuide,
    onOpenProjects,
    projectId,
    projectStyleGuide,
  ]);

  return (
    <div className="space-y-6">
      {entryCount === 0 ? (
        <Card className="border bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">还没有风格资产</CardTitle>
            <CardDescription>
              总览页先帮你判断下一步，不需要一上来就进入复杂工作台。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={onEnterLibrary}>进入工作台开始创建</Button>
            <Button variant="outline" onClick={onOpenProjects}>
              先去选择项目
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              管理风格资产
            </CardTitle>
            <CardDescription>
              当前已沉淀 {entryCount} 条风格资产，活跃风格为 {activeEntryName}。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              在工作台中完成上传、编辑、预设导入和条目维护。
            </div>
            <Button className="w-full" onClick={onEnterLibrary}>
              进入风格库工作台
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              项目默认风格
            </CardTitle>
            <CardDescription>
              {projectId
                ? `当前项目：${project?.name || "正在加载项目..."}`
                : "当前未选择项目"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasStyleGuideContent(projectStyleGuide) ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                {projectStyleSummary.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {projectId
                  ? "当前项目还没有默认风格，建议先从风格库选择一条资产应用到项目。"
                  : "选择项目后，可以把某条风格资产设为该项目的默认风格基线。"}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={!projectId}
              onClick={onOpenProjectStyleGuide}
            >
              打开项目风格策略
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              画布即时风格化
            </CardTitle>
            <CardDescription>
              文本风格化会优先读取项目默认风格，再回退到通用润色。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="inline-flex rounded-full border px-3 py-1 text-xs text-muted-foreground">
              当前来源：{textStylizeSourceLabel}
            </div>
            <div className="text-sm text-muted-foreground">
              总览页只负责建立心智模型；真正的资产编辑和应用操作放在工作台中完成。
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              最近使用的风格
            </CardTitle>
            <CardDescription>
              从最近资产继续编辑，比直接进入完整工作台更轻量。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <RecentEntryCard
                  key={entry.id}
                  entry={entry}
                  onOpen={onOpenRecentEntry}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center">
                <div className="text-sm font-medium">还没有风格资产</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  先上传样本或新建一条手动风格，再进入工作台继续维护。
                </p>
                <Button className="mt-4" onClick={onEnterLibrary}>
                  进入工作台开始创建
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PanelsTopLeft className="h-4 w-4" />
                入口与状态
              </CardTitle>
              <CardDescription>
                总览页只保留状态感知与入口，不与编辑表单混排。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">启用我的风格</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    开启后，我的风格会出现在创作任务风格选择器中。
                  </div>
                </div>
                <Switch checked={enabled} onCheckedChange={onEnableChange} />
              </div>

              <div className="rounded-xl border px-4 py-4">
                <div className="text-sm font-medium">建议使用路径</div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div>1. 进入工作台沉淀或整理风格资产</div>
                  <div>2. 将风格资产应用到当前项目默认风格</div>
                  <div>3. 在画布上通过文本风格化消费项目风格基线</div>
                </div>
              </div>

              <Button className="w-full" onClick={onEnterLibrary}>
                进入风格库工作台
              </Button>
            </CardContent>
          </Card>

          <RecommendedActions items={recommendedActions} />
        </div>
      </div>

      <Card className="border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">最近应用到的项目</CardTitle>
          <CardDescription>
            帮你快速回忆最近哪些项目已经接入了风格资产。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentApplications.map((item) => (
                <RecentApplicationCard
                  key={`${item.projectId}:${item.entryId}:${item.appliedAt}`}
                  item={item}
                  isCurrentProject={projectId === item.projectId}
                  onOpenProject={(nextProjectId) =>
                    onOpenAppliedProject(nextProjectId, item.entryId)
                  }
                  onOpenEntry={onOpenAppliedEntry}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center">
              <div className="text-sm font-medium">还没有应用记录</div>
              <p className="mt-2 text-sm text-muted-foreground">
                当你把风格资产设为项目默认风格后，这里会显示最近接入过的项目。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StylePage({ onNavigate, pageParams }: StylePageProps) {
  const activeSection = resolveStyleSection(pageParams?.section);
  const [projectId, setProjectId] = useState<string | null>(() =>
    getStoredResourceProjectId({ includeLegacy: true }),
  );
  const [project, setProject] = useState<Project | null>(null);
  const [projectStyleGuide, setProjectStyleGuide] = useState<StyleGuide | null>(
    null,
  );
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const { entries, enabled, activeEntry } = useStyleLibrary();

  useEffect(() => {
    return onResourceProjectChange((detail) => {
      setProjectId(detail.projectId);
    });
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setProjectStyleGuide(null);
      return;
    }

    let disposed = false;

    Promise.all([
      getProject(projectId).catch((error) => {
        console.warn("加载风格页当前项目失败:", error);
        return null;
      }),
      getStyleGuide(projectId).catch((error) => {
        console.warn("加载风格页项目风格失败:", error);
        return null;
      }),
    ]).then(([nextProject, nextStyleGuide]) => {
      if (disposed) {
        return;
      }
      setProject(nextProject);
      setProjectStyleGuide(nextStyleGuide);
    });

    return () => {
      disposed = true;
    };
  }, [projectId]);

  const applicationHistory = getStyleLibraryApplicationHistory();
  const applicationHistoryKey = useMemo(
    () =>
      applicationHistory
        .map((item) => `${item.projectId}:${item.entryId}:${item.appliedAt}`)
        .join("|"),
    [applicationHistory],
  );

  useEffect(() => {
    if (!applicationHistoryKey) {
      setRecentProjects([]);
      return;
    }

    let disposed = false;

    listProjects()
      .then((projects) => {
        if (!disposed) {
          setRecentProjects(projects);
        }
      })
      .catch((error) => {
        console.warn("加载风格应用项目列表失败:", error);
        if (!disposed) {
          setRecentProjects([]);
        }
      });

    return () => {
      disposed = true;
    };
  }, [applicationHistoryKey]);

  const sectionMeta = SECTION_META[activeSection];
  const recentEntries = useMemo(() => entries.slice(0, 3), [entries]);
  const recentApplications = useMemo<ResolvedApplicationHistoryItem[]>(
    () =>
      applicationHistory.slice(0, 6).map((item) => {
        const matchedProject = recentProjects.find(
          (project) => project.id === item.projectId,
        );
        return {
          ...item,
          projectName: matchedProject?.name || item.projectId,
          workspaceLabel: matchedProject
            ? getProjectTypeLabel(matchedProject.workspaceType)
            : null,
        };
      }),
    [applicationHistory, recentProjects],
  );

  const navigateSection = useCallback(
    (section: StylePageSection) => {
      onNavigate?.("style", { section });
    },
    [onNavigate],
  );

  const handleOpenProjectStyleGuide = useCallback(() => {
    if (!projectId) {
      return;
    }

    onNavigate?.("project-detail", {
      projectId,
      openProjectStyleGuide: true,
    });
  }, [onNavigate, projectId]);

  const handleOpenSpecificProjectStyleGuide = useCallback(
    (targetProjectId: string, sourceEntryId: string) => {
      if (!targetProjectId) {
        return;
      }

      onNavigate?.("project-detail", {
        projectId: targetProjectId,
        openProjectStyleGuide: true,
        openProjectStyleGuideSourceEntryId: sourceEntryId,
      });
    },
    [onNavigate],
  );

  const handleOpenProjects = useCallback(() => {
    onNavigate?.("projects");
  }, [onNavigate]);

  const handleOpenRecentEntry = useCallback(
    (entry: StyleLibraryEntry) => {
      setActiveStyleLibraryEntry(entry.id);
      navigateSection("library");
    },
    [navigateSection],
  );

  const handleOpenAppliedEntry = useCallback(
    (entryId: string) => {
      if (!entryId) {
        return;
      }
      setActiveStyleLibraryEntry(entryId);
      navigateSection("library");
    },
    [navigateSection],
  );

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {sectionMeta.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {sectionMeta.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {sectionMeta.description}
            </p>
          </div>

          <SectionTabs
            activeSection={activeSection}
            onChange={navigateSection}
          />
        </div>

        {activeSection === "overview" ? (
          <OverviewSection
            enabled={enabled}
            activeEntryName={activeEntry?.profile.name || "暂无"}
            entryCount={entries.length}
            recentEntries={recentEntries}
            project={project}
            projectId={projectId}
            projectStyleGuide={projectStyleGuide}
            recentApplications={recentApplications}
            onEnableChange={setStyleLibraryEnabled}
            onEnterLibrary={() => navigateSection("library")}
            onOpenProjectStyleGuide={handleOpenProjectStyleGuide}
            onOpenAppliedProject={handleOpenSpecificProjectStyleGuide}
            onOpenAppliedEntry={handleOpenAppliedEntry}
            onOpenProjects={handleOpenProjects}
            onOpenRecentEntry={handleOpenRecentEntry}
          />
        ) : (
          <StyleLibraryPanel
            projectId={projectId}
            onOpenProjectStyleGuide={handleOpenProjectStyleGuide}
          />
        )}
      </div>
    </div>
  );
}

export default StylePage;
