import { safeInvoke } from "@/lib/dev-bridge";

export interface FrontendDebugLogReport {
  message: string;
  level?: "debug" | "info" | "warn" | "error";
  category?: string;
  context?: unknown;
}

export async function reportFrontendDebugLog(
  report: FrontendDebugLogReport,
): Promise<void> {
  await safeInvoke("report_frontend_debug_log", { report });
}
