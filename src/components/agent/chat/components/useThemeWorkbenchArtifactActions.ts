import { useCallback } from "react";
import { toast } from "sonner";
import {
  openFileWithDefaultApp as openSessionFileWithDefaultApp,
  revealFileInFinder as revealSessionFileInFinder,
} from "@/lib/api/session-files";
import { formatThemeWorkbenchActionErrorMessage } from "./themeWorkbenchSidebarShared";

interface UseThemeWorkbenchArtifactActionsParams {
  runDetailSessionId: string | null;
}

export function useThemeWorkbenchArtifactActions({
  runDetailSessionId,
}: UseThemeWorkbenchArtifactActionsParams) {
  const handleRevealArtifactInFinder = useCallback(
    async (artifactPath: string, sessionId?: string | null) => {
      const resolvedSessionId = sessionId?.trim() || runDetailSessionId;
      if (!resolvedSessionId) {
        toast.error("缺少会话ID，无法定位产物文件");
        return;
      }
      try {
        await revealSessionFileInFinder(resolvedSessionId, artifactPath);
      } catch (error) {
        console.warn("[ThemeWorkbenchSidebar] 定位产物文件失败:", error);
        toast.error(
          formatThemeWorkbenchActionErrorMessage("定位产物文件失败", error),
        );
      }
    },
    [runDetailSessionId],
  );

  const handleOpenArtifactWithDefaultApp = useCallback(
    async (artifactPath: string, sessionId?: string | null) => {
      const resolvedSessionId = sessionId?.trim() || runDetailSessionId;
      if (!resolvedSessionId) {
        toast.error("缺少会话ID，无法打开产物文件");
        return;
      }
      try {
        await openSessionFileWithDefaultApp(resolvedSessionId, artifactPath);
      } catch (error) {
        console.warn("[ThemeWorkbenchSidebar] 打开产物文件失败:", error);
        toast.error(
          formatThemeWorkbenchActionErrorMessage("打开产物文件失败", error),
        );
      }
    },
    [runDetailSessionId],
  );

  return {
    handleRevealArtifactInFinder,
    handleOpenArtifactWithDefaultApp,
  };
}
