import { useMemo, useState } from "react";
import { LibraryBig, Search } from "lucide-react";
import type { ThemeType } from "@/components/content-creator/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStyleLibrary } from "@/hooks/useStyleLibrary";
import {
  themeMatchesStyleLibraryEntry,
  type StyleLibraryEntry,
} from "@/lib/style-library";

export interface StyleLibraryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (entry: StyleLibraryEntry) => void;
  title?: string;
  description?: string;
  theme?: ThemeType;
  onlyEnabled?: boolean;
  selectedEntryId?: string | null;
}

export function StyleLibraryPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "从我的风格库选择",
  description,
  theme,
  onlyEnabled = false,
  selectedEntryId,
}: StyleLibraryPickerDialogProps) {
  const [keyword, setKeyword] = useState("");
  const { entries, enabled } = useStyleLibrary();

  const filteredEntries = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return entries.filter((entry) => {
      if (onlyEnabled && !enabled) {
        return false;
      }

      if (!themeMatchesStyleLibraryEntry(entry, theme)) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const haystack = [
        entry.profile.name,
        entry.profile.description,
        entry.profile.toneKeywords.join(" "),
        entry.sourceLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  }, [enabled, entries, keyword, onlyEnabled, theme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <LibraryBig className="h-4 w-4" />
            {title}
          </DialogTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索风格名称、说明或语气关键词"
              className="pl-9"
            />
          </div>

          {!enabled && onlyEnabled ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              你已关闭“启用我的风格”。请先在“我的风格库”页面打开后，再用于任务创作。
            </div>
          ) : null}

          <ScrollArea className="max-h-[60vh] pr-3">
            {filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                还没有可用的风格条目，先去“我的风格库”上传样本或创建自定义风格。
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium">{entry.profile.name}</div>
                          {selectedEntryId === entry.id ? (
                            <Badge variant="secondary">当前选择</Badge>
                          ) : null}
                          <Badge variant="outline">{entry.sourceLabel}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {entry.profile.description || "暂无风格说明"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {entry.profile.toneKeywords.slice(0, 4).map((keywordItem) => (
                            <span
                              key={`${entry.id}-${keywordItem}`}
                              className="rounded-full bg-muted px-2 py-1"
                            >
                              {keywordItem}
                            </span>
                          ))}
                          {entry.profile.applicableThemes.slice(0, 3).map((themeItem) => (
                            <span
                              key={`${entry.id}-theme-${themeItem}`}
                              className="rounded-full border px-2 py-1"
                            >
                              {themeItem}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          onSelect(entry);
                          onOpenChange(false);
                        }}
                      >
                        选择此风格
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StyleLibraryPickerDialog;
