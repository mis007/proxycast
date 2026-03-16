//! 安全与性能配置命令

use crate::config::save_config;
use crate::AppState;
use serde::{Deserialize, Serialize};

// ========== 速率限制 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfigResponse {
    pub enabled: bool,
    pub requests_per_minute: u32,
    pub window_secs: u64,
}

#[tauri::command]
pub async fn get_rate_limit_config(
    state: tauri::State<'_, AppState>,
) -> Result<RateLimitConfigResponse, String> {
    let s = state.read().await;
    let c = &s.config.rate_limit;
    Ok(RateLimitConfigResponse {
        enabled: c.enabled,
        requests_per_minute: c.requests_per_minute,
        window_secs: c.window_secs,
    })
}

#[tauri::command]
pub async fn update_rate_limit_config(
    state: tauri::State<'_, AppState>,
    config: RateLimitConfigResponse,
) -> Result<(), String> {
    let mut s = state.write().await;
    s.config.rate_limit.enabled = config.enabled;
    s.config.rate_limit.requests_per_minute = config.requests_per_minute;
    s.config.rate_limit.window_secs = config.window_secs;
    save_config(&s.config).map_err(|e| e.to_string())
}

// ========== 对话管理 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationConfigResponse {
    pub trim_enabled: bool,
    pub max_messages: usize,
    pub summary_enabled: bool,
}

#[tauri::command]
pub async fn get_conversation_config(
    state: tauri::State<'_, AppState>,
) -> Result<ConversationConfigResponse, String> {
    let s = state.read().await;
    let c = &s.config.conversation;
    Ok(ConversationConfigResponse {
        trim_enabled: c.trim_enabled,
        max_messages: c.max_messages,
        summary_enabled: c.summary_enabled,
    })
}

#[tauri::command]
pub async fn update_conversation_config(
    state: tauri::State<'_, AppState>,
    config: ConversationConfigResponse,
) -> Result<(), String> {
    let mut s = state.write().await;
    s.config.conversation.trim_enabled = config.trim_enabled;
    s.config.conversation.max_messages = config.max_messages;
    s.config.conversation.summary_enabled = config.summary_enabled;
    save_config(&s.config).map_err(|e| e.to_string())
}

// ========== 提示路由 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HintRouteEntryResponse {
    pub hint: String,
    pub provider: String,
    pub model: String,
}

#[tauri::command]
pub async fn get_hint_routes(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<HintRouteEntryResponse>, String> {
    let s = state.read().await;
    Ok(s.config
        .hint_router
        .routes
        .iter()
        .map(|r| HintRouteEntryResponse {
            hint: r.hint.clone(),
            provider: r.provider.clone(),
            model: r.model.clone(),
        })
        .collect())
}

#[tauri::command]
pub async fn update_hint_routes(
    state: tauri::State<'_, AppState>,
    routes: Vec<HintRouteEntryResponse>,
) -> Result<(), String> {
    let mut s = state.write().await;
    s.config.hint_router.routes = routes
        .into_iter()
        .map(|r| lime_core::config::HintRouteSettingsEntry {
            hint: r.hint,
            provider: r.provider,
            model: r.model,
        })
        .collect();
    s.config.hint_router.enabled = !s.config.hint_router.routes.is_empty();
    save_config(&s.config).map_err(|e| e.to_string())
}

// ========== 配对认证 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingConfigResponse {
    pub enabled: bool,
}

#[tauri::command]
pub async fn get_pairing_config(
    state: tauri::State<'_, AppState>,
) -> Result<PairingConfigResponse, String> {
    let s = state.read().await;
    Ok(PairingConfigResponse {
        enabled: s.config.pairing.enabled,
    })
}

#[tauri::command]
pub async fn update_pairing_config(
    state: tauri::State<'_, AppState>,
    config: PairingConfigResponse,
) -> Result<(), String> {
    let mut s = state.write().await;
    s.config.pairing.enabled = config.enabled;
    save_config(&s.config).map_err(|e| e.to_string())
}
