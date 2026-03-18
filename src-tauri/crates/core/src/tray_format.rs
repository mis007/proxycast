//! 菜单文本格式化模块
//!
//! 提供托盘菜单文本的格式化函数

/// 格式化服务器状态文本
///
/// # 示例输出
/// - "● Lime 网关：运行中 (127.0.0.1:8080)"
/// - "○ Lime 网关：未启动"
pub fn format_server_status(running: bool, host: &str, port: u16) -> String {
    if running {
        format!("● Lime 网关：运行中 ({host}:{port})")
    } else {
        "○ Lime 网关：未启动".to_string()
    }
}

/// 格式化凭证状态文本
///
/// # 示例输出
/// - "◐ 可用账号：3/5"
pub fn format_credential_status(available: usize, total: usize) -> String {
    format!("◐ 可用账号：{available}/{total}")
}

/// 格式化请求统计文本
///
/// # 示例输出
/// - "◌ 今日调用：128 次"
pub fn format_request_count(count: u64) -> String {
    format!("◌ 今日调用：{count} 次")
}

/// 格式化当前模型文本
///
/// # 示例输出
/// - "◉ Claw 模型：Claude / claude-sonnet-4-5"
/// - "◉ Claw 模型：Claude / claude-sonnet-4-5 · 社媒内容"
/// - "◉ Claw 模型：未同步"
pub fn format_current_model_status(
    provider_label: &str,
    model: &str,
    theme_label: Option<&str>,
) -> String {
    let normalized_provider = provider_label.trim();
    let normalized_model = model.trim();
    let normalized_theme = theme_label.unwrap_or("").trim();

    if normalized_provider.is_empty() || normalized_model.is_empty() {
        return "◉ Claw 模型：未同步".to_string();
    }

    if normalized_theme.is_empty() {
        return format!("◉ Claw 模型：{normalized_provider} / {normalized_model}");
    }

    format!("◉ Claw 模型：{normalized_provider} / {normalized_model} · {normalized_theme}")
}

/// 格式化 API 地址
///
/// # 示例输出
/// - "http://127.0.0.1:8080"
pub fn format_api_address(host: &str, port: u16) -> String {
    format!("http://{host}:{port}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        /// **Feature: system-tray, Property 2: 菜单内容格式化正确性**
        /// **Validates: Requirements 2.2, 2.3, 2.4**
        #[test]
        fn prop_menu_content_formatting(
            host in "[a-z0-9.]{1,50}",
            port in 1024u16..65535,
            available in 0usize..100,
            total in 0usize..100,
            requests in 0u64..1000000
        ) {
            let running_status = format_server_status(true, &host, port);
            prop_assert!(running_status.contains(&host), "运行状态应包含 host");
            prop_assert!(running_status.contains(&port.to_string()), "运行状态应包含 port");
            prop_assert!(running_status.contains("运行中"), "运行状态应包含'运行中'");

            let stopped_status = format_server_status(false, &host, port);
            prop_assert!(stopped_status.contains("已停止"), "停止状态应包含'已停止'");

            let cred_status = format_credential_status(available, total);
            prop_assert!(cred_status.contains(&available.to_string()), "凭证状态应包含可用数");
            prop_assert!(cred_status.contains(&total.to_string()), "凭证状态应包含总数");

            let req_status = format_request_count(requests);
            prop_assert!(req_status.contains(&requests.to_string()), "请求统计应包含请求次数");
        }

        /// **Feature: system-tray, Property 4: API 地址格式化正确性**
        /// **Validates: Requirements 4.2**
        #[test]
        fn prop_api_address_formatting(
            host in "[a-z0-9.]{1,50}",
            port in 1024u16..65535
        ) {
            let address = format_api_address(&host, port);
            let expected = format!("http://{host}:{port}");
            prop_assert_eq!(address, expected, "API 地址格式应为 http://{{host}}:{{port}}");
        }
    }

    #[test]
    fn test_format_server_status_running() {
        let status = format_server_status(true, "127.0.0.1", 8080);
        assert_eq!(status, "● Lime 网关：运行中 (127.0.0.1:8080)");
    }

    #[test]
    fn test_format_server_status_stopped() {
        let status = format_server_status(false, "127.0.0.1", 8080);
        assert_eq!(status, "○ Lime 网关：未启动");
    }

    #[test]
    fn test_format_credential_status() {
        let status = format_credential_status(3, 5);
        assert_eq!(status, "◐ 可用账号：3/5");
    }

    #[test]
    fn test_format_request_count() {
        let status = format_request_count(128);
        assert_eq!(status, "◌ 今日调用：128 次");
    }

    #[test]
    fn test_format_current_model_status_basic() {
        let status = format_current_model_status("Claude", "claude-sonnet-4-5", None);
        assert_eq!(status, "◉ Claw 模型：Claude / claude-sonnet-4-5");
    }

    #[test]
    fn test_format_current_model_status_with_theme() {
        let status = format_current_model_status("Claude", "claude-sonnet-4-5", Some("社媒内容"));
        assert_eq!(status, "◉ Claw 模型：Claude / claude-sonnet-4-5 · 社媒内容");
    }

    #[test]
    fn test_format_current_model_status_empty() {
        let status = format_current_model_status("", "", None);
        assert_eq!(status, "◉ Claw 模型：未同步");
    }

    #[test]
    fn test_format_api_address() {
        let address = format_api_address("127.0.0.1", 8080);
        assert_eq!(address, "http://127.0.0.1:8080");
    }
}
