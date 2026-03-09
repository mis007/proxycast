/**
 * 内容编辑页面
 *
 * 集成 TipTap 编辑器和记忆侧边栏
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  PanelRightClose,
  PanelRight,
  Check,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ContentListItem,
  ContentDetail,
  Project,
  getContent,
  updateContent,
  formatRelativeTime,
} from "@/lib/api/project";
import { EditorToolbar } from "./editor/EditorToolbar";
import { MemorySidebar } from "./MemorySidebar";
import { StyleGuidePanel } from "./memory/StyleGuidePanel";
import { toast } from "sonner";

interface ContentEditorPageProps {
  project: Project;
  content: ContentListItem;
  onBack: () => void;
}

type SaveStatus = "saved" | "saving" | "unsaved";

export function ContentEditorPage({
  project,
  content,
  onBack,
}: ContentEditorPageProps) {
  const [contentDetail, setContentDetail] = useState<ContentDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(content.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showSidebar, setShowSidebar] = useState(true);
  const [styleGuideDialogOpen, setStyleGuideDialogOpen] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TipTap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "开始写作...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: "",
    onUpdate: () => {
      setSaveStatus("unsaved");
      scheduleAutoSave();
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[calc(100vh-200px)]",
          "prose-headings:font-bold prose-headings:text-foreground",
          "prose-p:text-foreground prose-p:leading-relaxed",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground",
          "prose-ul:text-foreground prose-ol:text-foreground",
          "prose-li:text-foreground",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary",
          "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-muted prose-pre:text-foreground",
        ),
      },
    },
  });

  // 加载内容详情
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getContent(content.id);
      if (detail) {
        setContentDetail(detail);
        setTitle(detail.title);
        editor?.commands.setContent(detail.body || "");
      }
    } catch (error) {
      console.error("加载内容失败:", error);
      toast.error("加载内容失败");
    } finally {
      setLoading(false);
    }
  }, [content.id, editor]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // 保存内容的 ref（用于避免循环依赖）
  const handleSaveRef = useRef<() => Promise<void>>();

  // 自动保存调度
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveRef.current?.();
    }, 3000);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // 保存内容
  const handleSave = async () => {
    if (!editor || saveStatus === "saving") return;

    setSaveStatus("saving");
    try {
      const body = editor.getHTML();
      await updateContent(content.id, {
        title,
        body,
      });
      setSaveStatus("saved");
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
      setSaveStatus("unsaved");
    }
  };

  // 更新 ref
  handleSaveRef.current = handleSave;

  // 标题变化时标记为未保存
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("unsaved");
    scheduleAutoSave();
  };

  // 手动保存
  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    handleSave();
  };

  // 返回时检查是否有未保存的更改
  const handleBack = () => {
    if (saveStatus === "unsaved") {
      if (confirm("有未保存的更改，确定要离开吗？")) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* 标题输入 */}
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 text-lg font-medium border-none shadow-none focus-visible:ring-0"
          placeholder="输入标题..."
        />

        {/* 保存状态 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>保存中...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>已保存</span>
            </>
          )}
          {saveStatus === "unsaved" && <span>未保存</span>}
        </div>

        {/* 操作按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStyleGuideDialogOpen(true)}
        >
          <Palette className="h-4 w-4 mr-2" />
          风格
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSave}
          disabled={saveStatus === "saving" || saveStatus === "saved"}
        >
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
        >
          {showSidebar ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 编辑器区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 工具栏 */}
          <EditorToolbar editor={editor} />

          {/* 编辑器 */}
          <div className="flex-1 overflow-auto">
            <div
              className={cn(
                "max-w-4xl mx-auto p-6",
                "[&_.is-editor-empty:first-child::before]:text-muted-foreground",
                "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                "[&_.is-editor-empty:first-child::before]:float-left",
                "[&_.is-editor-empty:first-child::before]:h-0",
                "[&_.is-editor-empty:first-child::before]:pointer-events-none",
              )}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* 底部状态栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
            <span>
              字数: {editor?.storage.characterCount?.characters?.() || 0}
            </span>
            <span>
              最后更新: {formatRelativeTime(contentDetail?.updated_at || 0)}
            </span>
          </div>
        </div>

        {/* 记忆侧边栏 */}
        {showSidebar && (
          <MemorySidebar projectId={project.id} className="w-72" />
        )}
      </div>
      <Dialog open={styleGuideDialogOpen} onOpenChange={setStyleGuideDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              项目默认风格
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <StyleGuidePanel projectId={project.id} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
