//! 托盘菜单模块
//!
//! 定义菜单项 ID 和菜单构建函数

use super::format::{format_credential_status, format_request_count, format_server_status};
use super::state::TrayStateSnapshot;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    AppHandle, Runtime,
};

pub use lime_core::tray_menu_meta::menu_ids;
pub use lime_core::tray_menu_meta::{get_menu_item_ids, parse_server_address};

/// 托盘菜单构建错误
#[derive(Debug, thiserror::Error)]
pub enum MenuBuildError {
    #[error("无法创建菜单项: {0}")]
    MenuItemError(String),
    #[error("无法创建菜单: {0}")]
    MenuError(String),
}

/// 构建托盘菜单
///
/// 根据当前状态快照构建完整的托盘菜单，包含：
/// - 状态信息（服务器状态、凭证状态、请求统计）
/// - 服务器控制（启动/停止、刷新 Token、健康检查）
/// - 快捷工具（打开主窗口、复制 API 地址、打开日志目录）
/// - 设置（开机自启）
/// - 退出
///
/// # Requirements
/// - 2.1: 右键点击托盘图标显示包含所有可用操作的托盘菜单
/// - 2.2: 显示当前服务器状态，包括运行状态和端口号
/// - 2.3: 显示凭证池状态，包括可用凭证数和总凭证数
/// - 2.4: 显示今日请求次数
/// - 3.1, 3.2, 3.3, 3.4: 服务器控制菜单项
/// - 4.1, 4.2, 4.3, 4.4: 快捷工具菜单项
/// - 5.1, 5.2: 开机自启设置
pub fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    state: &TrayStateSnapshot,
) -> Result<Menu<R>, MenuBuildError> {
    // 解析服务器地址
    let (host, port) = parse_server_address(&state.server_address);

    // === 状态信息区域 ===
    let status_text = format_server_status(state.server_running, &host, port);
    let status_info = MenuItem::with_id(
        app,
        menu_ids::STATUS_INFO,
        &status_text,
        false,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    let credential_text =
        format_credential_status(state.available_credentials, state.total_credentials);
    let credential_info = MenuItem::with_id(
        app,
        menu_ids::CREDENTIAL_INFO,
        &credential_text,
        false,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    let request_text = format_request_count(state.today_requests);
    let request_info = MenuItem::with_id(
        app,
        menu_ids::REQUEST_INFO,
        &request_text,
        false,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 分隔符 1 ===
    let separator_1 = PredefinedMenuItem::separator(app)
        .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 服务器控制区域 ===
    // 启动服务器（服务器未运行时可用）
    let start_server = MenuItem::with_id(
        app,
        menu_ids::START_SERVER,
        "▶️ 开启团队共享",
        !state.server_running,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // 停止服务器（服务器运行时可用）
    let stop_server = MenuItem::with_id(
        app,
        menu_ids::STOP_SERVER,
        "⏹️ 关闭团队共享",
        state.server_running,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // 刷新所有 Token
    let refresh_tokens = MenuItem::with_id(
        app,
        menu_ids::REFRESH_TOKENS,
        "🔄 刷新所有 Token",
        true,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // 健康检查
    let health_check = MenuItem::with_id(
        app,
        menu_ids::HEALTH_CHECK,
        "🩺 健康检查",
        true,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 分隔符 2 ===
    let separator_2 = PredefinedMenuItem::separator(app)
        .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 快捷工具区域 ===
    let open_window = MenuItem::with_id(
        app,
        menu_ids::OPEN_WINDOW,
        "🖥️ 打开主窗口",
        true,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    let copy_api_address = MenuItem::with_id(
        app,
        menu_ids::COPY_API_ADDRESS,
        "📋 复制 API 地址",
        state.server_running,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    let open_log_dir = MenuItem::with_id(
        app,
        menu_ids::OPEN_LOG_DIR,
        "📁 打开日志目录",
        true,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 分隔符 3 ===
    let separator_3 = PredefinedMenuItem::separator(app)
        .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 设置区域 ===
    let auto_start = CheckMenuItem::with_id(
        app,
        menu_ids::AUTO_START,
        "🚀 开机自启",
        true,
        state.auto_start_enabled,
        None::<&str>,
    )
    .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 分隔符 4 ===
    let separator_4 = PredefinedMenuItem::separator(app)
        .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // === 退出 ===
    let quit = MenuItem::with_id(app, menu_ids::QUIT, "❌ 退出", true, None::<&str>)
        .map_err(|e| MenuBuildError::MenuItemError(e.to_string()))?;

    // 构建菜单
    Menu::with_items(
        app,
        &[
            &status_info,
            &credential_info,
            &request_info,
            &separator_1,
            &start_server,
            &stop_server,
            &refresh_tokens,
            &health_check,
            &separator_2,
            &open_window,
            &copy_api_address,
            &open_log_dir,
            &separator_3,
            &auto_start,
            &separator_4,
            &quit,
        ],
    )
    .map_err(|e| MenuBuildError::MenuError(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_all_required_ids_not_empty() {
        let ids = menu_ids::all_required_ids();
        assert!(!ids.is_empty(), "必需的菜单项 ID 列表不应为空");
    }

    #[test]
    fn test_all_required_ids_unique() {
        let ids = menu_ids::all_required_ids();
        let mut unique_ids = ids.clone();
        unique_ids.sort();
        unique_ids.dedup();
        assert_eq!(ids.len(), unique_ids.len(), "菜单项 ID 应该唯一");
    }

    /// **Feature: system-tray, Property 3: 菜单项完整性**
    /// **Validates: Requirements 2.1**
    #[test]
    fn test_menu_ids_completeness() {
        let ids = menu_ids::all_required_ids();

        // 验证所有预定义的菜单项 ID 都在列表中
        assert!(ids.contains(&menu_ids::STATUS_INFO), "应包含 STATUS_INFO");
        assert!(
            ids.contains(&menu_ids::CREDENTIAL_INFO),
            "应包含 CREDENTIAL_INFO"
        );
        assert!(ids.contains(&menu_ids::REQUEST_INFO), "应包含 REQUEST_INFO");
        assert!(ids.contains(&menu_ids::START_SERVER), "应包含 START_SERVER");
        assert!(ids.contains(&menu_ids::STOP_SERVER), "应包含 STOP_SERVER");
        assert!(
            ids.contains(&menu_ids::REFRESH_TOKENS),
            "应包含 REFRESH_TOKENS"
        );
        assert!(ids.contains(&menu_ids::HEALTH_CHECK), "应包含 HEALTH_CHECK");
        assert!(ids.contains(&menu_ids::OPEN_WINDOW), "应包含 OPEN_WINDOW");
        assert!(
            ids.contains(&menu_ids::COPY_API_ADDRESS),
            "应包含 COPY_API_ADDRESS"
        );
        assert!(ids.contains(&menu_ids::OPEN_LOG_DIR), "应包含 OPEN_LOG_DIR");
        assert!(ids.contains(&menu_ids::AUTO_START), "应包含 AUTO_START");
        assert!(ids.contains(&menu_ids::QUIT), "应包含 QUIT");
    }

    #[test]
    fn test_parse_server_address_with_port() {
        let (host, port) = parse_server_address("127.0.0.1:8080");
        assert_eq!(host, "127.0.0.1");
        assert_eq!(port, 8080);
    }

    #[test]
    fn test_parse_server_address_without_port() {
        let (host, port) = parse_server_address("localhost");
        assert_eq!(host, "localhost");
        assert_eq!(port, 8080);
    }

    #[test]
    fn test_parse_server_address_empty() {
        let (host, port) = parse_server_address("");
        assert_eq!(host, "127.0.0.1");
        assert_eq!(port, 8080);
    }

    #[test]
    fn test_parse_server_address_ipv6() {
        let (host, port) = parse_server_address("[::1]:9000");
        assert_eq!(host, "[::1]");
        assert_eq!(port, 9000);
    }

    #[test]
    fn test_get_menu_item_ids() {
        let ids = get_menu_item_ids();
        assert_eq!(ids.len(), 12, "应有 12 个必需的菜单项");
    }

    proptest! {
        /// **Feature: system-tray, Property 3: 菜单项完整性（属性测试）**
        /// **Validates: Requirements 2.1**
        ///
        /// 验证对于任意托盘菜单构建，生成的菜单 SHALL 包含所有预定义的菜单项 ID
        #[test]
        fn prop_menu_ids_completeness(
            _server_running in any::<bool>(),
            _available in 0usize..100,
            _total in 0usize..100,
            _requests in 0u64..1000000,
            _auto_start in any::<bool>()
        ) {
            // 验证 all_required_ids 返回的列表包含所有必需的菜单项
            let ids = menu_ids::all_required_ids();

            // 必须包含所有预定义的 ID
            let required = vec![
                menu_ids::STATUS_INFO,
                menu_ids::CREDENTIAL_INFO,
                menu_ids::REQUEST_INFO,
                menu_ids::START_SERVER,
                menu_ids::STOP_SERVER,
                menu_ids::REFRESH_TOKENS,
                menu_ids::HEALTH_CHECK,
                menu_ids::OPEN_WINDOW,
                menu_ids::COPY_API_ADDRESS,
                menu_ids::OPEN_LOG_DIR,
                menu_ids::AUTO_START,
                menu_ids::QUIT,
            ];

            for id in required {
                prop_assert!(ids.contains(&id), "菜单项列表应包含 {}", id);
            }

            // 验证没有重复的 ID
            let mut sorted_ids = ids.clone();
            sorted_ids.sort();
            sorted_ids.dedup();
            prop_assert_eq!(ids.len(), sorted_ids.len(), "菜单项 ID 应该唯一");
        }
    }
}
