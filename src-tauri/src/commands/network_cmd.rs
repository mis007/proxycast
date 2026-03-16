//! 网络相关命令
//!
//! 核心逻辑已迁移到 lime-core::network，本文件保留 Tauri 命令包装。

// 重新导出核心类型
pub use lime_core::network::{get_accessible_url, NetworkInfo};

/// 获取本地网络信息（Tauri 命令包装）
#[tauri::command]
pub fn get_network_info() -> Result<NetworkInfo, String> {
    lime_core::network::get_network_info()
}
