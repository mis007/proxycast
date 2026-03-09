import type { WorkbenchRightRailProps } from "./workbenchRightRailContracts";
import { WorkbenchRightRailActionSections } from "./workbenchRightRailActionSections";
import {
  WorkbenchRightRailCollapseBar,
  WorkbenchRightRailHeadingCard,
  WorkbenchRightRailStyleGuideCard,
  WorkbenchRightRailStyleGuideDialog,
} from "./workbenchRightRailExpandedChrome";
import { useWorkbenchRightRailCapabilityController } from "./useWorkbenchRightRailCapabilityController";
import type { WorkbenchRightRailCapabilitySection } from "./workbenchRightRailTypes";

export function WorkbenchRightRailExpandedPanel({
  onCollapse,
  projectId,
  onCreateContentFromPrompt,
  initialExpandedActionKey,
  onInitialExpandedActionConsumed,
  initialStyleGuideDialogOpen,
  onInitialStyleGuideDialogConsumed,
  initialStyleGuideSourceEntryId,
  onInitialStyleGuideSourceEntryConsumed,
  sections,
  heading,
  subheading,
}: {
  onCollapse: () => void;
  projectId?: string | null;
  onCreateContentFromPrompt?: WorkbenchRightRailProps["onCreateContentFromPrompt"];
  initialExpandedActionKey?: string | null;
  onInitialExpandedActionConsumed?: () => void;
  initialStyleGuideDialogOpen?: boolean;
  onInitialStyleGuideDialogConsumed?: () => void;
  initialStyleGuideSourceEntryId?: string | null;
  onInitialStyleGuideSourceEntryConsumed?: () => void;
  sections: WorkbenchRightRailCapabilitySection[];
  heading?: string | null;
  subheading?: string | null;
}) {
  const controller = useWorkbenchRightRailCapabilityController({
    projectId,
    initialExpandedActionKey,
    onInitialExpandedActionConsumed,
    initialStyleGuideDialogOpen,
    onInitialStyleGuideDialogConsumed,
    initialStyleGuideSourceEntryId,
    onInitialStyleGuideSourceEntryConsumed,
    onCreateContentFromPrompt,
  });

  return (
    <aside
      className="flex w-[320px] min-w-[320px] flex-col border-l bg-background/95"
      data-testid="workbench-right-rail-expanded"
    >
      <WorkbenchRightRailCollapseBar onCollapse={onCollapse} />

      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-3 py-3">
        <WorkbenchRightRailHeadingCard
          heading={heading}
          subheading={subheading}
        />
        <WorkbenchRightRailStyleGuideCard
          projectId={projectId}
          onOpen={() => {
            controller.setStyleGuideSourceEntryId(null);
            controller.handleStyleGuideDialogOpenChange(true);
          }}
        />
        <WorkbenchRightRailActionSections
          sections={sections}
          controller={controller}
        />
      </div>

      <WorkbenchRightRailStyleGuideDialog
        open={controller.styleGuideDialogOpen}
        projectId={projectId}
        sourceEntryId={controller.styleGuideSourceEntryId}
        onOpenChange={controller.handleStyleGuideDialogOpenChange}
      />
    </aside>
  );
}
