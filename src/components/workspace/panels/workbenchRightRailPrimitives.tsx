import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WorkbenchRailTone = "violet" | "blue" | "pink";

const PANEL_TONE_CLASS: Record<WorkbenchRailTone, string> = {
  violet: "border-violet-100",
  blue: "border-blue-100",
  pink: "border-pink-100",
};

const PANEL_HEADER_TONE_CLASS: Record<WorkbenchRailTone, string> = {
  violet: "border-violet-100 bg-violet-50/70 text-violet-500",
  blue: "border-blue-100 bg-blue-50/70 text-blue-500",
  pink: "border-pink-100 bg-pink-50/70 text-pink-500",
};

const TEXTAREA_TONE_CLASS: Record<WorkbenchRailTone, string> = {
  violet: "focus-visible:ring-violet-200",
  blue: "focus-visible:ring-blue-200",
  pink: "focus-visible:ring-pink-200",
};

interface WorkbenchRailPanelShellProps {
  tone: WorkbenchRailTone;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  testId?: string;
  className?: string;
}

export function WorkbenchRailPanelShell({
  tone,
  icon: Icon,
  title,
  children,
  testId,
  className,
}: WorkbenchRailPanelShellProps) {
  return (
    <div
      className={cn(
        "col-span-2 rounded-2xl border bg-white p-4 shadow-sm",
        PANEL_TONE_CLASS[tone],
        className,
      )}
      data-testid={testId}
    >
      <div
        className={cn(
          "rounded-2xl border px-4 py-3",
          PANEL_HEADER_TONE_CLASS[tone],
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Icon className="h-3.5 w-3.5" />
          <span>{title}</span>
        </div>
      </div>

      {children}
    </div>
  );
}

export function WorkbenchRailFieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-xs font-semibold text-foreground", className)}>
      {children}
    </div>
  );
}

export function WorkbenchRailTextarea({
  tone,
  className,
  ...props
}: ComponentProps<typeof Textarea> & {
  tone: WorkbenchRailTone;
}) {
  return (
    <Textarea
      className={cn(
        "min-h-[92px] resize-none rounded-2xl border-0 bg-slate-50 text-sm shadow-none focus-visible:ring-1",
        TEXTAREA_TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  );
}

export function WorkbenchRailSelectTrigger({
  className,
  ...props
}: ComponentProps<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      className={cn(
        "h-9 rounded-xl border-0 bg-muted/60 text-muted-foreground shadow-none",
        className,
      )}
      {...props}
    />
  );
}

interface WorkbenchRailActionRowProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  isSubmitting?: boolean;
  submittingLabel?: string;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  withDivider?: boolean;
  className?: string;
}

export function WorkbenchRailActionRow({
  primaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  isSubmitting,
  submittingLabel,
  primaryDisabled,
  secondaryLabel = "取消",
  withDivider = false,
  className,
}: WorkbenchRailActionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        withDivider && "border-t border-border/70 pt-4",
        className,
      )}
    >
      <Button
        type="button"
        className="h-10 flex-1 rounded-xl bg-slate-900 hover:bg-slate-800"
        disabled={primaryDisabled}
        onClick={onPrimaryClick}
      >
        {isSubmitting && submittingLabel ? submittingLabel : primaryLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="h-10 rounded-xl bg-slate-100 px-5 text-slate-600 hover:bg-slate-200"
        onClick={onSecondaryClick}
      >
        {secondaryLabel}
      </Button>
    </div>
  );
}
