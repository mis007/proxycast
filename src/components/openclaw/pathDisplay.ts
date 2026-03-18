const POSIX_HOME_PATTERN = /^\/(?:Users|home)\/[^/]+/;
const WINDOWS_HOME_PATTERN = /^[A-Za-z]:[\\/]+Users[\\/]+[^\\/]+/;

function normalizeDisplayPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (POSIX_HOME_PATTERN.test(trimmed)) {
    return trimmed.replace(POSIX_HOME_PATTERN, "~");
  }

  if (WINDOWS_HOME_PATTERN.test(trimmed)) {
    return trimmed.replace(WINDOWS_HOME_PATTERN, "~").replace(/\\/g, "/");
  }

  return trimmed;
}

export function compactPathLabel(
  path: string | null | undefined,
  maxLength = 52,
): string {
  if (!path) {
    return "未检测到";
  }

  const normalized = normalizeDisplayPath(path);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const visibleLength = Math.max(maxLength - 3, 12);
  const headLength = Math.max(10, Math.ceil(visibleLength * 0.58));
  const tailLength = Math.max(6, visibleLength - headLength);

  return `${normalized.slice(0, headLength)}...${normalized.slice(-tailLength)}`;
}
