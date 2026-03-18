import {
  emit as realEmit,
  emitTo as realEmitTo,
  listen as realListen,
  once as realOnce,
  TauriEvent,
} from "../../node_modules/@tauri-apps/api/event.js";
import type {
  Event,
  EventCallback,
  EventName,
  EventTarget,
  Options,
  UnlistenFn,
} from "../../node_modules/@tauri-apps/api/event.js";
import {
  hasTauriEventListenerCapability,
  hasTauriRuntimeMarkers,
  waitForTauriCapability,
  waitForTauriEventListenerCapability,
} from "@/lib/tauri-runtime";

const NOOP_UNLISTEN: UnlistenFn = () => {};

export type {
  Event,
  EventCallback,
  EventName,
  EventTarget,
  Options,
  UnlistenFn,
};

export { TauriEvent };

export async function listen<T>(
  event: EventName,
  handler: EventCallback<T>,
  options?: Options,
): Promise<UnlistenFn> {
  const nativeListenReady = hasTauriEventListenerCapability()
    ? true
    : await waitForTauriEventListenerCapability();

  if (nativeListenReady) {
    try {
      return await realListen(event, handler, options);
    } catch (error) {
      if (hasTauriRuntimeMarkers()) {
        console.warn(`[tauri-event] 原生事件监听失败，跳过监听: ${event}`, error);
        return NOOP_UNLISTEN;
      }
      throw error;
    }
  }

  if (hasTauriRuntimeMarkers()) {
    console.warn(`[tauri-event] Tauri 事件桥未就绪，跳过监听: ${event}`);
    return NOOP_UNLISTEN;
  }

  try {
    return await realListen(event, handler, options);
  } catch (error) {
    console.warn(`[tauri-event] 事件监听不可用，跳过监听: ${event}`, error);
    return NOOP_UNLISTEN;
  }
}

export async function once<T>(
  event: EventName,
  handler: EventCallback<T>,
  options?: Options,
): Promise<UnlistenFn> {
  if (!hasTauriRuntimeMarkers()) {
    return realOnce(event, handler, options);
  }

  let resolvedUnlisten: UnlistenFn = NOOP_UNLISTEN;
  const unlisten = await listen<T>(
    event,
    (eventData) => {
      resolvedUnlisten();
      handler(eventData);
    },
    options,
  );
  resolvedUnlisten = unlisten;
  return unlisten;
}

export async function emit<T>(event: string, payload?: T): Promise<void> {
  if (await waitForTauriCapability("event")) {
    return realEmit(event, payload);
  }

  if (hasTauriRuntimeMarkers()) {
    console.warn(`[tauri-event] Tauri 事件桥未就绪，跳过发送: ${event}`);
    return;
  }

  try {
    return await realEmit(event, payload);
  } catch (error) {
    console.warn(`[tauri-event] 事件发送不可用，跳过发送: ${event}`, error);
  }
}

export async function emitTo<T>(
  target: EventTarget | string,
  event: string,
  payload?: T,
): Promise<void> {
  if (await waitForTauriCapability("event")) {
    return realEmitTo(target, event, payload);
  }

  if (hasTauriRuntimeMarkers()) {
    console.warn(`[tauri-event] Tauri 事件桥未就绪，跳过定向发送: ${event}`);
    return;
  }

  try {
    return await realEmitTo(target, event, payload);
  } catch (error) {
    console.warn(`[tauri-event] 定向事件发送不可用，跳过发送: ${event}`, error);
  }
}
