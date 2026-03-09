import { useEffect, useState } from "react";
import { useWorkbenchStore } from "@/stores/useWorkbenchStore";

export function useWorkbenchRightRailDisplayState({
  shouldRender,
  isCreateWorkspaceView,
}: {
  shouldRender: boolean;
  isCreateWorkspaceView: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingExpandedActionKey, setPendingExpandedActionKey] = useState<
    string | null
  >(null);
  const contentReviewRailState = useWorkbenchStore(
    (store) => store.contentReviewRailState,
  );
  const clearContentReviewRailState = useWorkbenchStore(
    (store) => store.clearContentReviewRailState,
  );
  const themeSkillsRailState = useWorkbenchStore(
    (store) => store.themeSkillsRailState,
  );
  const clearThemeSkillsRailState = useWorkbenchStore(
    (store) => store.clearThemeSkillsRailState,
  );
  const triggerSkill = useWorkbenchStore((store) => store.triggerSkill);

  useEffect(() => {
    if (!shouldRender || !isCreateWorkspaceView) {
      clearContentReviewRailState();
      clearThemeSkillsRailState();
    }
  }, [
    clearContentReviewRailState,
    clearThemeSkillsRailState,
    isCreateWorkspaceView,
    shouldRender,
  ]);

  useEffect(() => {
    if (contentReviewRailState) {
      setCollapsed(false);
    }
  }, [contentReviewRailState]);

  useEffect(() => {
    if (themeSkillsRailState) {
      setCollapsed(false);
    }
  }, [themeSkillsRailState]);

  const handleExpand = () => {
    setPendingExpandedActionKey(null);
    setCollapsed(false);
  };

  const handleExpandToAction = (actionKey: string) => {
    setPendingExpandedActionKey(actionKey);
    setCollapsed(false);
  };

  const handleExpandedActionConsumed = () => {
    setPendingExpandedActionKey(null);
  };

  return {
    clearThemeSkillsRailState,
    collapsed,
    contentReviewRailState,
    handleExpand,
    handleExpandToAction,
    handleExpandedActionConsumed,
    pendingExpandedActionKey,
    setCollapsed,
    themeSkillsRailState,
    triggerSkill,
  };
}
