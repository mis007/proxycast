import {
  closeWebviewPanel,
  createWebviewPanel,
  focusWebviewPanel,
  getWebviewPanels,
  navigateWebviewPanel,
} from "@/lib/webview-api";

const OPENCLAW_DASHBOARD_PANEL_ID = "openclaw-dashboard";
const OPENCLAW_DASHBOARD_TITLE = "OpenClaw Dashboard";
const OPENCLAW_DASHBOARD_WIDTH = 1280;
const OPENCLAW_DASHBOARD_HEIGHT = 860;

export interface OpenClawDashboardWindowOpenResult {
  reused: boolean;
}

export async function isOpenClawDashboardWindowOpen(): Promise<boolean> {
  const panels = await getWebviewPanels();
  return panels.some((panel) => panel.id === OPENCLAW_DASHBOARD_PANEL_ID);
}

export async function openOpenClawDashboardWindow(
  url: string,
): Promise<OpenClawDashboardWindowOpenResult> {
  const exists = await isOpenClawDashboardWindowOpen();

  if (exists) {
    await navigateWebviewPanel(OPENCLAW_DASHBOARD_PANEL_ID, url);
    await focusWebviewPanel(OPENCLAW_DASHBOARD_PANEL_ID);
    return { reused: true };
  }

  const result = await createWebviewPanel({
    panel_id: OPENCLAW_DASHBOARD_PANEL_ID,
    url,
    title: OPENCLAW_DASHBOARD_TITLE,
    x: 0,
    y: 0,
    width: OPENCLAW_DASHBOARD_WIDTH,
    height: OPENCLAW_DASHBOARD_HEIGHT,
    profile_key: OPENCLAW_DASHBOARD_PANEL_ID,
    persistent_profile: true,
  });

  if (!result.success) {
    throw new Error(result.error ?? "打开 Dashboard 桌面面板失败");
  }

  return { reused: false };
}

export async function focusOpenClawDashboardWindow(): Promise<boolean> {
  return focusWebviewPanel(OPENCLAW_DASHBOARD_PANEL_ID);
}

export async function reloadOpenClawDashboardWindow(url: string): Promise<boolean> {
  const exists = await isOpenClawDashboardWindowOpen();
  if (!exists) {
    return false;
  }

  return navigateWebviewPanel(OPENCLAW_DASHBOARD_PANEL_ID, url);
}

export async function closeOpenClawDashboardWindow(): Promise<boolean> {
  return closeWebviewPanel(OPENCLAW_DASHBOARD_PANEL_ID);
}
