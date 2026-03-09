import type { LucideIcon } from "lucide-react";

export type WorkbenchRightRailTone = "violet" | "blue" | "pink";

export interface WorkbenchRightRailCapabilityItem {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: WorkbenchRightRailTone;
}

export interface WorkbenchRightRailCapabilitySection {
  key: string;
  title: string;
  tone: WorkbenchRightRailTone;
  items: WorkbenchRightRailCapabilityItem[];
}
