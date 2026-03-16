export function formatThemeWorkbenchRunMetadata(raw: string | null): string {
  if (!raw || !raw.trim()) {
    return "-";
  }
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export function formatThemeWorkbenchActionErrorMessage(
  prefix: string,
  error: unknown,
): string {
  const candidates: string[] = [];
  if (typeof error === "string") {
    candidates.push(error);
  }
  if (error instanceof Error && error.message.trim()) {
    candidates.push(error.message);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      candidates.push(message);
    }
  }

  const detail = candidates
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  if (!detail) {
    return prefix;
  }
  if (detail === prefix || detail.startsWith(`${prefix}：`)) {
    return detail;
  }
  return `${prefix}：${detail}`;
}

export async function writeThemeWorkbenchClipboardText(text: string): Promise<void> {
  const value = text.trim();
  if (!value) {
    return;
  }
  const clipboard = navigator?.clipboard;
  if (!clipboard?.writeText) {
    return;
  }
  await clipboard.writeText(value);
}

export function resolveThemeWorkbenchFileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || "上下文文件";
}
