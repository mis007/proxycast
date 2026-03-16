//! 事件发射器抽象
//!
//! 定义事件发射器 trait 层次，用于将 Tauri 事件发射功能抽象化，
//! 使终端模块不直接依赖 Tauri。
//!
//! ## 设计
//! - `TerminalEventEmit`：基础 trait（dyn 兼容，不要求 Clone）
//! - `TerminalEventEmitter`：扩展 trait（要求 Clone，用于泛型参数）
//! - `DynEmitter`：`Arc<dyn TerminalEventEmit>` 的 newtype，实现 `TerminalEventEmitter`

use std::path::PathBuf;
use std::sync::Arc;

/// 基础事件发射 trait（dyn 兼容）
///
/// 不要求 `Clone`，可以用作 `dyn TerminalEventEmit`。
/// 主 crate 中为 `tauri::AppHandle` 实现此 trait。
pub trait TerminalEventEmit: Send + Sync + 'static {
    /// 发射事件到前端
    fn emit_event(&self, event: &str, payload: &serde_json::Value) -> Result<(), String>;

    /// 获取应用数据目录
    fn app_data_dir(&self) -> Result<PathBuf, String>;
}

/// 扩展事件发射器 trait（要求 Clone）
///
/// 用于泛型参数场景（如 `ShellController<E>`、`ShellProc<E>`）。
/// 所有实现了 `TerminalEventEmit + Clone` 的类型自动实现此 trait。
pub trait TerminalEventEmitter: TerminalEventEmit + Clone {}

/// 自动实现：任何 `TerminalEventEmit + Clone` 的类型都是 `TerminalEventEmitter`
impl<T: TerminalEventEmit + Clone> TerminalEventEmitter for T {}

/// 动态事件发射器包装
///
/// 使用 `Arc<dyn TerminalEventEmit>` 包装，实现 `Clone` + `TerminalEventEmit`，
/// 从而自动获得 `TerminalEventEmitter`。
///
/// 用于需要存储和传递发射器但不想泛型化的场景（如 `TerminalSessionManager`）。
#[derive(Clone)]
pub struct DynEmitter(pub Arc<dyn TerminalEventEmit>);

impl DynEmitter {
    /// 从实现了 TerminalEventEmit 的类型创建
    pub fn new(emitter: impl TerminalEventEmit) -> Self {
        Self(Arc::new(emitter))
    }
}

impl TerminalEventEmit for DynEmitter {
    fn emit_event(&self, event: &str, payload: &serde_json::Value) -> Result<(), String> {
        self.0.emit_event(event, payload)
    }

    fn app_data_dir(&self) -> Result<PathBuf, String> {
        self.0.app_data_dir()
    }
}

/// 空事件发射器（用于测试）
#[derive(Debug, Clone)]
pub struct NoOpEmitter;

impl TerminalEventEmit for NoOpEmitter {
    fn emit_event(&self, _event: &str, _payload: &serde_json::Value) -> Result<(), String> {
        Ok(())
    }

    fn app_data_dir(&self) -> Result<PathBuf, String> {
        Ok(PathBuf::from(".lime"))
    }
}
