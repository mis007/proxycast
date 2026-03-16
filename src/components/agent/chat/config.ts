/**
 * Agent 后端配置
 *
 * 现在只使用 Aster 后端，保留配置接口以便未来扩展
 */

export type AgentBackend = "aster";

// 默认使用 Aster 后端
const STORAGE_KEY = "lime_agent_backend";

/**
 * 获取当前 Agent 后端
 * 现在固定返回 aster
 */
export function getAgentBackend(): AgentBackend {
  return "aster";
}

/**
 * 设置 Agent 后端
 * 保留接口但不再生效
 */
export function setAgentBackend(_backend: AgentBackend): void {
  localStorage.setItem(STORAGE_KEY, "aster");
}

/**
 * 是否使用 Aster 后端
 * 现在固定返回 true
 */
export function useAsterBackend(): boolean {
  return true;
}
