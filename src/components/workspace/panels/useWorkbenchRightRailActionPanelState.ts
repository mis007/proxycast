import { useEffect, useState } from "react";

interface UseWorkbenchRightRailActionPanelStateParams {
  initialExpandedActionKey?: string | null;
  onInitialExpandedActionConsumed?: () => void;
  initialStyleGuideDialogOpen?: boolean;
  onInitialStyleGuideDialogConsumed?: () => void;
  initialStyleGuideSourceEntryId?: string | null;
  onInitialStyleGuideSourceEntryConsumed?: () => void;
}

export function useWorkbenchRightRailActionPanelState({
  initialExpandedActionKey,
  onInitialExpandedActionConsumed,
  initialStyleGuideDialogOpen,
  onInitialStyleGuideDialogConsumed,
  initialStyleGuideSourceEntryId,
  onInitialStyleGuideSourceEntryConsumed,
}: UseWorkbenchRightRailActionPanelStateParams) {
  const [expandedActionKey, setExpandedActionKey] = useState<string | null>(
    null,
  );
  const [styleGuideDialogOpen, setStyleGuideDialogOpen] = useState(false);
  const [styleGuideSourceEntryId, setStyleGuideSourceEntryId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!initialExpandedActionKey) {
      return;
    }
    setExpandedActionKey(initialExpandedActionKey);
    onInitialExpandedActionConsumed?.();
  }, [initialExpandedActionKey, onInitialExpandedActionConsumed]);

  useEffect(() => {
    if (!initialStyleGuideDialogOpen) {
      return;
    }
    setStyleGuideDialogOpen(true);
    onInitialStyleGuideDialogConsumed?.();
  }, [initialStyleGuideDialogOpen, onInitialStyleGuideDialogConsumed]);

  useEffect(() => {
    if (!initialStyleGuideSourceEntryId) {
      return;
    }
    setStyleGuideSourceEntryId(initialStyleGuideSourceEntryId);
    onInitialStyleGuideSourceEntryConsumed?.();
  }, [initialStyleGuideSourceEntryId, onInitialStyleGuideSourceEntryConsumed]);

  const handleStyleGuideDialogOpenChange = (open: boolean) => {
    setStyleGuideDialogOpen(open);
    if (!open) {
      setStyleGuideSourceEntryId(null);
    }
  };

  const closeExpandedAction = () => {
    setExpandedActionKey(null);
  };

  const handleToggleActionPanel = (
    actionKey: string,
    beforeToggle?: () => void,
  ) => {
    beforeToggle?.();
    setExpandedActionKey((previous) =>
      previous === actionKey ? null : actionKey,
    );
  };

  return {
    closeExpandedAction,
    expandedActionKey,
    handleToggleActionPanel,
    handleStyleGuideDialogOpenChange,
    setStyleGuideSourceEntryId,
    styleGuideDialogOpen,
    styleGuideSourceEntryId,
  };
}
