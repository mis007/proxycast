/**
 * 内容列表页面
 *
 * 显示项目下的所有内容，支持表格和卡片视图
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  List,
  RefreshCw,
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Users,
  Globe,
  FileEdit,
  Settings,
  Palette,
  Film,
  MapPin,
  LayoutGrid,
  MessageSquare,
  Image,
  Copy,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Project,
  ContentListItem,
  ContentStatus,
  listContents,
  createContent,
  updateContent,
  deleteContent,
  getContentStats,
  getProjectTypeLabel,
  getContentTypeLabel,
  getContentStatusLabel,
  getDefaultContentTypeForProject,
  formatWordCount,
  formatRelativeTime,
} from "@/lib/api/project";
import { toast } from "sonner";
import {
  CharacterPanel,
  WorldBuildingPanel,
  StyleGuidePanel,
  OutlinePanel,
} from "./memory";
import { ProjectType } from "@/lib/api/project";

// Tab 配置类型
interface TabConfig {
  value: string;
  label: string;
  icon: LucideIcon;
}

// 不同项目类型的 Tab 配置
const PROJECT_TAB_CONFIG: Record<ProjectType, TabConfig[]> = {
  // 系统类型
  persistent: [{ value: "contents", label: "内容", icon: FileEdit }],
  temporary: [{ value: "contents", label: "内容", icon: FileEdit }],
  // 用户类型
  general: [
    { value: "contents", label: "内容", icon: FileEdit },
    { value: "characters", label: "角色", icon: Users },
    { value: "world", label: "世界观", icon: Globe },
    { value: "style", label: "风格", icon: Palette },
    { value: "outline", label: "大纲", icon: List },
  ],
  "social-media": [
    { value: "contents", label: "帖子", icon: MessageSquare },
    { value: "assets", label: "素材", icon: Image },
    { value: "style", label: "风格", icon: Palette },
  ],
  poster: [
    { value: "contents", label: "设计", icon: Image },
    { value: "assets", label: "素材", icon: Image },
    { value: "style", label: "风格", icon: Palette },
  ],
  music: [
    { value: "contents", label: "歌曲", icon: FileEdit },
    { value: "style", label: "风格", icon: Palette },
  ],
  knowledge: [
    { value: "contents", label: "笔记", icon: FileText },
    { value: "style", label: "风格", icon: Palette },
  ],
  planning: [
    { value: "contents", label: "计划", icon: FileEdit },
    { value: "style", label: "风格", icon: Palette },
    { value: "outline", label: "大纲", icon: List },
  ],
  document: [
    { value: "contents", label: "文档", icon: FileText },
    { value: "style", label: "风格", icon: Palette },
    { value: "templates", label: "模板", icon: Copy },
  ],
  video: [
    { value: "contents", label: "剧集", icon: Film },
    { value: "characters", label: "角色", icon: Users },
    { value: "style", label: "风格", icon: Palette },
    { value: "scenes", label: "场景", icon: MapPin },
    { value: "storyboard", label: "分镜", icon: LayoutGrid },
    { value: "outline", label: "大纲", icon: List },
  ],
  novel: [
    { value: "contents", label: "章节", icon: FileEdit },
    { value: "characters", label: "角色", icon: Users },
    { value: "world", label: "世界观", icon: Globe },
    { value: "style", label: "风格", icon: Palette },
    { value: "outline", label: "大纲", icon: List },
  ],
};

interface ContentListPageProps {
  project: Project;
  onBack: () => void;
  onSelectContent?: (content: ContentListItem) => void;
}

type ContentFilter = "all" | "completed" | "draft" | "published";
type ContentTab =
  | "contents"
  | "characters"
  | "world"
  | "style"
  | "outline"
  | "scenes"
  | "storyboard"
  | "assets"
  | "templates";

export function ContentListPage({
  project,
  onBack,
  onSelectContent,
}: ContentListPageProps) {
  const [contents, setContents] = useState<ContentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<ContentFilter>("all");
  const [currentTab, setCurrentTab] = useState<ContentTab>("contents");
  const [_viewMode, _setViewMode] = useState<"table" | "grid">("table");
  const [stats, setStats] = useState<{
    count: number;
    words: number;
    completed: number;
  } | null>(null);

  // 加载内容列表
  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const [contentList, [count, words, completed]] = await Promise.all([
        listContents(project.id),
        getContentStats(project.id),
      ]);
      setContents(contentList);
      setStats({ count, words, completed });
    } catch (error) {
      console.error("加载内容失败:", error);
      toast.error("加载内容失败");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // 过滤内容
  const filteredContents = useMemo(() => {
    let result = contents;

    // 按状态过滤
    if (currentFilter !== "all") {
      result = result.filter((c) => c.status === currentFilter);
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(query));
    }

    return result;
  }, [contents, currentFilter, searchQuery]);

  // 创建新内容
  const handleCreateContent = async () => {
    try {
      const defaultType = getDefaultContentTypeForProject(
        project.workspaceType,
      );
      const newContent = await createContent({
        project_id: project.id,
        title: `新${getContentTypeLabel(defaultType)}`,
        content_type: defaultType,
      });
      toast.success("创建成功");
      loadContents();
      onSelectContent?.(newContent);
    } catch (error) {
      console.error("创建内容失败:", error);
      toast.error("创建失败");
    }
  };

  // 获取默认内容类型
  // 更新内容状态
  const handleUpdateStatus = async (
    content: ContentListItem,
    status: ContentStatus,
  ) => {
    try {
      await updateContent(content.id, { status });
      toast.success("状态已更新");
      loadContents();
    } catch (error) {
      console.error("更新状态失败:", error);
      toast.error("更新失败");
    }
  };

  // 删除内容
  const handleDeleteContent = async (content: ContentListItem) => {
    if (!confirm(`确定要删除 "${content.title}" 吗？`)) {
      return;
    }

    try {
      await deleteContent(content.id);
      toast.success("已删除");
      loadContents();
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  // 计算进度
  const progress = stats
    ? stats.count > 0
      ? (stats.completed / stats.count) * 100
      : 0
    : 0;

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "published":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>{project.icon || "📁"}</span>
            <span>{project.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {getProjectTypeLabel(project.workspaceType)}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          设置
        </Button>
      </div>

      {/* 项目信息卡片 */}
      <div className="bg-card rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            进度: {stats?.completed || 0}/{stats?.count || 0} (
            {progress.toFixed(0)}%)
          </span>
          <span className="text-sm text-muted-foreground">
            总字数: {formatWordCount(stats?.words || 0)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 标签页 */}
      <Tabs
        value={currentTab}
        onValueChange={(v) => setCurrentTab(v as ContentTab)}
        className="mb-4"
      >
        <TabsList>
          {(
            PROJECT_TAB_CONFIG[project.workspaceType] ||
            PROJECT_TAB_CONFIG.general
          ).map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 内容列表区域 */}
      {currentTab === "contents" && (
        <>
          {/* 工具栏 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              {(["all", "completed", "draft"] as ContentFilter[]).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={currentFilter === filter ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentFilter(filter)}
                  >
                    {filter === "all"
                      ? "全部"
                      : filter === "completed"
                        ? "已完成"
                        : "草稿"}
                  </Button>
                ),
              )}
            </div>
            <div className="flex-1" />
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button onClick={handleCreateContent}>
              <Plus className="h-4 w-4 mr-2" />
              新建
            </Button>
          </div>

          {/* 内容表格 */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p className="mb-4">还没有内容</p>
                <Button onClick={handleCreateContent}>创建第一个内容</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-24">状态</TableHead>
                    <TableHead className="w-24">字数</TableHead>
                    <TableHead className="w-32">更新时间</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContents.map((content) => (
                    <TableRow
                      key={content.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => onSelectContent?.(content)}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {content.order + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {content.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(content.status)}
                          <span className="text-sm">
                            {getContentStatusLabel(
                              content.status as ContentStatus,
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatWordCount(content.word_count)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRelativeTime(content.updated_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                onSelectContent?.(content);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            {content.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleUpdateStatus(content, "completed");
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                标记完成
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                handleDeleteContent(content);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* 角色标签页 */}
      {currentTab === "characters" && (
        <div className="flex-1 overflow-hidden">
          <CharacterPanel projectId={project.id} />
        </div>
      )}

      {/* 世界观标签页 */}
      {currentTab === "world" && (
        <div className="flex-1 overflow-hidden">
          <WorldBuildingPanel projectId={project.id} />
        </div>
      )}

      {/* 风格指南标签页 */}
      {currentTab === "style" && (
        <div className="flex-1 overflow-hidden">
          <StyleGuidePanel projectId={project.id} />
        </div>
      )}

      {/* 大纲标签页 */}
      {currentTab === "outline" && (
        <div className="flex-1 overflow-hidden">
          <OutlinePanel projectId={project.id} />
        </div>
      )}

      {/* 场景标签页（短剧） */}
      {currentTab === "scenes" && (
        <div className="flex-1 overflow-hidden flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>场景管理功能开发中...</p>
          </div>
        </div>
      )}

      {/* 分镜标签页（短剧） */}
      {currentTab === "storyboard" && (
        <div className="flex-1 overflow-hidden flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>分镜管理功能开发中...</p>
          </div>
        </div>
      )}

      {/* 素材标签页（社媒） */}
      {currentTab === "assets" && (
        <div className="flex-1 overflow-hidden flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>素材管理功能开发中...</p>
          </div>
        </div>
      )}

      {/* 模板标签页（文档） */}
      {currentTab === "templates" && (
        <div className="flex-1 overflow-hidden flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>模板管理功能开发中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
