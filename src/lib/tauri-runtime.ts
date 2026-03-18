const DEV_READY_TIMEOUT_MS = 2500;
const PROD_READY_TIMEOUT_MS = 800;
const READY_POLL_INTERVAL_MS = 25;

type TauriInternals = {
  invoke?: unknown;
  transformCallback?: unknown;
};

function getWindowObject(): (Window & typeof globalThis) | null {
  return typeof window === "undefined" ? null : window;
}

export function getTauriGlobal(): Record<string, unknown> | null {
  const currentWindow = getWindowObject() as
    | ((Window & typeof globalThis) & { __TAURI__?: Record<string, unknown> })
    | null;
  return currentWindow?.__TAURI__ ?? null;
}

export function getTauriInternals(): TauriInternals | null {
  const currentWindow = getWindowObject() as
    | ((Window & typeof globalThis) & {
        __TAURI_INTERNALS__?: TauriInternals;
      })
    | null;
  return currentWindow?.__TAURI_INTERNALS__ ?? null;
}

export function hasTauriRuntimeMarkers(): boolean {
  const currentWindow = getWindowObject();
  if (!currentWindow) {
    return false;
  }

  return Boolean(getTauriGlobal()) || "__TAURI_INTERNALS__" in currentWindow;
}

export function hasTauriInvokeCapability(): boolean {
  const tauriGlobal = getTauriGlobal() as
    | {
        core?: { invoke?: unknown };
        invoke?: unknown;
      }
    | null;
  const internals = getTauriInternals();

  return (
    typeof tauriGlobal?.core?.invoke === "function" ||
    typeof tauriGlobal?.invoke === "function" ||
    typeof internals?.invoke === "function"
  );
}

export function hasTauriEventCapability(): boolean {
  const tauriGlobal = getTauriGlobal() as
    | {
        event?: {
          listen?: unknown;
          emit?: unknown;
        };
      }
    | null;
  const internals = getTauriInternals();

  return (
    typeof tauriGlobal?.event?.listen === "function" ||
    (typeof internals?.invoke === "function" &&
      typeof internals?.transformCallback === "function")
  );
}

export function hasTauriEventListenerCapability(): boolean {
  const internals = getTauriInternals();

  return (
    typeof internals?.invoke === "function" &&
    typeof internals?.transformCallback === "function"
  );
}

function getReadyTimeoutMs(): number {
  return import.meta.env.DEV ? DEV_READY_TIMEOUT_MS : PROD_READY_TIMEOUT_MS;
}

async function waitForCapability(
  hasCapability: () => boolean,
  timeoutMs = getReadyTimeoutMs(),
): Promise<boolean> {
  if (hasCapability()) {
    return true;
  }

  if (!hasTauriRuntimeMarkers()) {
    return false;
  }

  const currentWindow = getWindowObject();
  if (!currentWindow) {
    return false;
  }

  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (Date.now() < deadline) {
    await new Promise<void>((resolve) => {
      currentWindow.setTimeout(resolve, READY_POLL_INTERVAL_MS);
    });

    if (hasCapability()) {
      return true;
    }
  }

  return hasCapability();
}

export async function waitForTauriCapability(
  capability: "invoke" | "event",
  timeoutMs = getReadyTimeoutMs(),
): Promise<boolean> {
  const hasCapability =
    capability === "event"
      ? hasTauriEventCapability
      : hasTauriInvokeCapability;

  return waitForCapability(hasCapability, timeoutMs);
}

export async function waitForTauriEventListenerCapability(
  timeoutMs = getReadyTimeoutMs(),
): Promise<boolean> {
  return waitForCapability(hasTauriEventListenerCapability, timeoutMs);
}
