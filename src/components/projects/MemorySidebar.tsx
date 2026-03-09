/**
 * 记忆侧边栏
 *
 * 在编辑页面显示项目的角色、世界观、风格指南（只读）
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Users,
  Globe,
  Palette,
  ChevronDown,
  ChevronRight,
  Star,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ProjectMemory,
  Character,
  WorldBuilding,
  StyleGuide,
  getProjectMemory,
} from "@/lib/api/memory";
import { buildStyleSummary, getStyleCategoryLabel, getStyleProfileFromGuide } from "@/lib/style-guide";
import { StyleGuidePanel } from "./memory/StyleGuidePanel";

interface MemorySidebarProps {
  projectId: string;
  className?: string;
}

export function MemorySidebar({ projectId, className }: MemorySidebarProps) {
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["characters", "world", "style"]),
  );
  const [styleGuideDialogOpen, setStyleGuideDialogOpen] = useState(false);

  const loadMemory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectMemory(projectId);
      setMemory(data);
    } catch (error) {
      console.error("加载记忆失败:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-40 border-l bg-muted/30",
          className,
        )}
      >
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("border-l bg-muted/30 flex flex-col", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <span className="text-sm font-medium">项目记忆</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setStyleGuideDialogOpen(true)}
          >
            风格
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadMemory}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 内容 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* 角色 */}
          <SidebarSection
            title="角色"
            icon={<Users className="h-4 w-4" />}
            count={memory?.characters.length || 0}
            expanded={expandedSections.has("characters")}
            onToggle={() => toggleSection("characters")}
          >
            {memory?.characters && memory.characters.length > 0 ? (
              <div className="space-y-2">
                {memory.characters.map((character) => (
                  <CharacterItem key={character.id} character={character} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">暂无角色</p>
            )}
          </SidebarSection>

          {/* 世界观 */}
          <SidebarSection
            title="世界观"
            icon={<Globe className="h-4 w-4" />}
            expanded={expandedSections.has("world")}
            onToggle={() => toggleSection("world")}
          >
            {memory?.world_building ? (
              <WorldBuildingItem worldBuilding={memory.world_building} />
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                暂无世界观设定
              </p>
            )}
          </SidebarSection>

          {/* 风格指南 */}
          <SidebarSection
            title="风格指南"
            icon={<Palette className="h-4 w-4" />}
            expanded={expandedSections.has("style")}
            onToggle={() => toggleSection("style")}
          >
            {memory?.style_guide ? (
              <StyleGuideItem
                styleGuide={memory.style_guide}
                onEdit={() => setStyleGuideDialogOpen(true)}
              />
            ) : (
              <div className="py-2 space-y-2">
                <p className="text-xs text-muted-foreground">暂无风格指南</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStyleGuideDialogOpen(true)}
                >
                  立即设置风格
                </Button>
              </div>
            )}
          </SidebarSection>
        </div>
      </ScrollArea>

      <Dialog open={styleGuideDialogOpen} onOpenChange={setStyleGuideDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>项目默认风格</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <StyleGuidePanel projectId={projectId} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 侧边栏分区组件
interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  icon,
  count,
  expanded,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-accent/50 text-sm">
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">{count}</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// 角色项组件
interface CharacterItemProps {
  character: Character;
}

function CharacterItem({ character }: CharacterItemProps) {
  return (
    <div className="p-2 rounded bg-background border text-xs">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{character.name}</span>
        {character.is_main && (
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        )}
      </div>
      {character.description && (
        <p className="text-muted-foreground line-clamp-2">
          {character.description}
        </p>
      )}
    </div>
  );
}

// 世界观项组件
interface WorldBuildingItemProps {
  worldBuilding: WorldBuilding;
}

function WorldBuildingItem({ worldBuilding }: WorldBuildingItemProps) {
  return (
    <div className="p-2 rounded bg-background border text-xs space-y-2">
      {worldBuilding.description && (
        <div>
          <span className="text-muted-foreground">描述：</span>
          <p className="line-clamp-3">{worldBuilding.description}</p>
        </div>
      )}
      {worldBuilding.era && (
        <div>
          <span className="text-muted-foreground">时代：</span>
          <span>{worldBuilding.era}</span>
        </div>
      )}
      {worldBuilding.locations && (
        <div>
          <span className="text-muted-foreground">地点：</span>
          <p className="line-clamp-2">{worldBuilding.locations}</p>
        </div>
      )}
    </div>
  );
}

// 风格指南项组件
interface StyleGuideItemProps {
  styleGuide: StyleGuide;
  onEdit?: () => void;
}

function StyleGuideItem({ styleGuide, onEdit }: StyleGuideItemProps) {
  const profile = getStyleProfileFromGuide(styleGuide);
  const summary = buildStyleSummary(styleGuide);

  return (
    <div className="p-2 rounded bg-background border text-xs space-y-2">
      {profile ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{profile.name}</span>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {getStyleCategoryLabel(profile.category)}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              强度 {profile.simulationStrength}
            </Badge>
          </div>

          {summary.length > 0 && (
            <div className="space-y-1">
              {summary.map((item) => (
                <p key={item} className="text-muted-foreground line-clamp-2">
                  {item}
                </p>
              ))}
            </div>
          )}

          {profile.targetPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.targetPlatforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-[10px]">
                  {platform}
                </Badge>
              ))}
            </div>
          )}

          {profile.donts.length > 0 && (
            <div>
              <span className="text-muted-foreground">避免：</span>
              <span>{profile.donts.slice(0, 3).join("、")}</span>
            </div>
          )}
          {onEdit && (
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onEdit}
              >
                编辑风格
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground">暂无风格摘要</p>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onEdit}
            >
              去设置风格
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
