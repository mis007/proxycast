import type { OpenClawSubpage } from "@/types/page";

export type { OpenClawSubpage };

export type OpenClawOperationKind = "install" | "uninstall" | "restart";
export type OpenClawScene = "setup" | "sync" | "dashboard";

export interface OpenClawLastSynced {
  providerId: string;
  modelId: string;
}

export interface OpenClawOperationState {
  kind: OpenClawOperationKind | null;
  running: boolean;
  message: string | null;
  returnSubpage: OpenClawSubpage;
}

export interface OpenClawSceneDefinition {
  id: OpenClawScene;
  title: string;
  description: string;
}

export interface OpenClawSceneStatus {
  label: string;
  tone: string;
}
