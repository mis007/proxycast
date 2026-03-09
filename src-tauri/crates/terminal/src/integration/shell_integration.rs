//! Shell 集成处理器
//!
//! 处理 Shell 集成功能，包括：
//! - 当前工作目录跟踪
//! - 命令执行状态管理
//! - 命令时间记录
//! - OSC 序列处理
//!
//! ## 功能
//! - 处理 OSC 7 更新当前目录
//! - 处理 OSC 52 剪贴板操作
//! - 处理 OSC 133 命令提示符标记
//! - 处理 OSC 16162 Wave 命令
//!
//! ## Requirements
//! - 6.5: 支持 bash、zsh、fish、pwsh 四种 Shell 类型
//! - 6.6: Shell 集成状态变更事件通知
//! - 6.8: 命令开始和结束时间记录

use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::RwLock;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use super::osc_parser::{OSCParser, OSCSequence, PromptMarkType};
use crate::emit_helper;
use crate::emitter::TerminalEventEmit;
use crate::error::TerminalError;
use crate::events::event_names;

/// Shell 类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ShellType {
    /// Bash shell
    Bash,
    /// Zsh shell
    Zsh,
    /// Fish shell
    Fish,
    /// PowerShell
    Pwsh,
    /// 未知 Shell
    #[default]
    Unknown,
}

impl ShellType {
    /// 从 Shell 路径推断 Shell 类型
    pub fn from_path(path: &str) -> Self {
        let path_lower = path.to_lowercase();
        if path_lower.contains("bash") {
            Self::Bash
        } else if path_lower.contains("zsh") {
            Self::Zsh
        } else if path_lower.contains("fish") {
            Self::Fish
        } else if path_lower.contains("pwsh") || path_lower.contains("powershell") {
            Self::Pwsh
        } else {
            Self::Unknown
        }
    }

    /// 获取 Shell 名称
    pub fn name(&self) -> &'static str {
        match self {
            Self::Bash => "bash",
            Self::Zsh => "zsh",
            Self::Fish => "fish",
            Self::Pwsh => "pwsh",
            Self::Unknown => "unknown",
        }
    }
}

/// Shell 集成状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum ShellIntegrationStatus {
    /// 就绪状态（等待用户输入）
    Ready,
    /// 正在执行命令
    RunningCommand,
    /// 未知状态
    #[default]
    Unknown,
}

/// 命令执行信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandInfo {
    /// 命令开始时间（Unix 时间戳，毫秒）
    pub start_time: i64,
    /// 命令结束时间（Unix 时间戳，毫秒）
    pub end_time: Option<i64>,
    /// 命令持续时间（毫秒）
    pub duration_ms: Option<i64>,
}

impl CommandInfo {
    /// 创建新的命令信息
    pub fn new() -> Self {
        Self {
            start_time: current_timestamp_ms(),
            end_time: None,
            duration_ms: None,
        }
    }

    /// 标记命令结束
    pub fn finish(&mut self) {
        let end = current_timestamp_ms();
        self.end_time = Some(end);
        self.duration_ms = Some(end - self.start_time);
    }
}

impl Default for CommandInfo {
    fn default() -> Self {
        Self::new()
    }
}

/// Shell 集成状态变更事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShellIntegrationEvent {
    /// Block ID
    pub block_id: String,
    /// 新状态
    pub status: ShellIntegrationStatus,
    /// 当前目录（如果有变更）
    pub current_dir: Option<String>,
    /// 命令信息（如果有）
    pub command_info: Option<CommandInfo>,
}

/// Shell 集成处理器
///
/// 管理单个终端会话的 Shell 集成状态。
pub struct ShellIntegration {
    /// Block ID
    block_id: String,
    /// Shell 类型
    shell_type: RwLock<ShellType>,
    /// 当前工作目录
    current_dir: RwLock<Option<String>>,
    /// 集成状态
    status: RwLock<ShellIntegrationStatus>,
    /// 当前命令信息
    current_command: RwLock<Option<CommandInfo>>,
    /// 上次命令开始时间
    last_command_start: AtomicI64,
    /// 事件发射器（可选）
    app_handle: Option<std::sync::Arc<dyn TerminalEventEmit>>,
}

impl ShellIntegration {
    /// 创建新的 Shell 集成处理器
    pub fn new(block_id: String) -> Self {
        Self {
            block_id,
            shell_type: RwLock::new(ShellType::Unknown),
            current_dir: RwLock::new(None),
            status: RwLock::new(ShellIntegrationStatus::Unknown),
            current_command: RwLock::new(None),
            last_command_start: AtomicI64::new(0),
            app_handle: None,
        }
    }

    /// 创建带有事件发射器的 Shell 集成处理器
    pub fn with_app_handle(block_id: String, app_handle: impl TerminalEventEmit) -> Self {
        Self {
            block_id,
            shell_type: RwLock::new(ShellType::Unknown),
            current_dir: RwLock::new(None),
            status: RwLock::new(ShellIntegrationStatus::Unknown),
            current_command: RwLock::new(None),
            last_command_start: AtomicI64::new(0),
            app_handle: Some(std::sync::Arc::new(app_handle)),
        }
    }

    /// 设置 Shell 类型
    ///
    /// # 参数
    /// - `shell_type`: Shell 类型
    pub fn set_shell_type(&self, shell_type: ShellType) {
        let mut guard = self.shell_type.write().unwrap();
        *guard = shell_type;
    }

    /// 从 Shell 路径设置 Shell 类型
    ///
    /// # 参数
    /// - `path`: Shell 可执行文件路径
    pub fn set_shell_type_from_path(&self, path: &str) {
        self.set_shell_type(ShellType::from_path(path));
    }

    /// 获取 Shell 类型
    pub fn get_shell_type(&self) -> ShellType {
        *self.shell_type.read().unwrap()
    }

    /// 获取当前工作目录
    pub fn get_current_dir(&self) -> Option<String> {
        self.current_dir.read().unwrap().clone()
    }

    /// 获取集成状态
    pub fn get_status(&self) -> ShellIntegrationStatus {
        *self.status.read().unwrap()
    }

    /// 获取当前命令信息
    pub fn get_current_command(&self) -> Option<CommandInfo> {
        self.current_command.read().unwrap().clone()
    }

    /// 处理 PTY 输出数据
    ///
    /// 解析数据中的 OSC 序列并更新状态。
    ///
    /// # 参数
    /// - `data`: PTY 输出数据
    ///
    /// # 返回
    /// 处理的 OSC 序列数量
    pub fn process_output(&self, data: &[u8]) -> usize {
        let parsed = OSCParser::parse(data);
        let count = parsed.len();

        for osc in parsed {
            if let Err(e) = self.process_osc(&osc.sequence) {
                tracing::warn!(
                    "[ShellIntegration] 处理 OSC 序列失败: block_id={}, error={}",
                    self.block_id,
                    e
                );
            }
        }

        count
    }

    /// 处理单个 OSC 序列
    ///
    /// # 参数
    /// - `sequence`: OSC 序列
    ///
    /// _Requirements: 6.1, 6.2, 6.3, 6.4_
    pub fn process_osc(&self, sequence: &OSCSequence) -> Result<(), TerminalError> {
        match sequence {
            OSCSequence::CurrentDirectory { hostname: _, path } => {
                self.update_current_dir(path.clone());
            }
            OSCSequence::Clipboard { selection, data } => {
                self.handle_clipboard(selection, data)?;
            }
            OSCSequence::PromptMark { mark_type } => {
                self.handle_prompt_mark(*mark_type);
            }
            OSCSequence::WaveCommand { command } => {
                self.handle_wave_command(command)?;
            }
            OSCSequence::Unknown { code, params } => {
                tracing::debug!(
                    "[ShellIntegration] 未知 OSC 序列: block_id={}, code={}, params={}",
                    self.block_id,
                    code,
                    params
                );
            }
        }
        Ok(())
    }

    /// 更新当前工作目录
    ///
    /// _Requirements: 6.1_
    fn update_current_dir(&self, path: String) {
        let old_dir = {
            let mut guard = self.current_dir.write().unwrap();
            let old = guard.clone();
            *guard = Some(path.clone());
            old
        };

        if old_dir.as_ref() != Some(&path) {
            tracing::debug!(
                "[ShellIntegration] 目录变更: block_id={}, old={:?}, new={}",
                self.block_id,
                old_dir,
                path
            );

            // 发送状态变更事件
            self.send_status_event(Some(path), None);
        }
    }

    /// 处理剪贴板操作
    ///
    /// _Requirements: 6.2_
    fn handle_clipboard(&self, selection: &str, data: &str) -> Result<(), TerminalError> {
        if data == "?" {
            // 查询请求，暂不支持
            tracing::debug!(
                "[ShellIntegration] 剪贴板查询请求: block_id={}, selection={}",
                self.block_id,
                selection
            );
            return Ok(());
        }

        // 解码剪贴板数据
        if let Some(content) = OSCParser::decode_clipboard_data(data) {
            tracing::debug!(
                "[ShellIntegration] 剪贴板写入: block_id={}, selection={}, len={}",
                self.block_id,
                selection,
                content.len()
            );

            // 发送剪贴板事件到前端
            if let Some(ref app_handle) = self.app_handle {
                let _ = emit_helper::emit(
                    app_handle.as_ref(),
                    event_names::CLIPBOARD_WRITE,
                    &serde_json::json!({
                        "block_id": self.block_id,
                        "selection": selection,
                        "content": content,
                    }),
                );
            }
        }

        Ok(())
    }

    /// 处理命令提示符标记
    ///
    /// _Requirements: 6.3, 6.6, 6.8_
    fn handle_prompt_mark(&self, mark_type: PromptMarkType) {
        match mark_type {
            PromptMarkType::PromptStart => {
                // 提示符开始，命令已结束
                self.finish_command();
                self.set_status(ShellIntegrationStatus::Ready);
            }
            PromptMarkType::CommandStart => {
                // 用户开始输入命令
                // 状态保持 Ready
            }
            PromptMarkType::CommandExecuted => {
                // 命令开始执行
                self.start_command();
                self.set_status(ShellIntegrationStatus::RunningCommand);
            }
            PromptMarkType::CommandFinished => {
                // 命令执行完成
                self.finish_command();
                self.set_status(ShellIntegrationStatus::Ready);
            }
            PromptMarkType::Unknown(c) => {
                tracing::debug!(
                    "[ShellIntegration] 未知提示符标记: block_id={}, mark={}",
                    self.block_id,
                    c
                );
            }
        }
    }

    /// 处理 Wave 命令
    ///
    /// _Requirements: 6.4_
    fn handle_wave_command(&self, command: &str) -> Result<(), TerminalError> {
        tracing::debug!(
            "[ShellIntegration] Wave 命令: block_id={}, command={}",
            self.block_id,
            command
        );

        // 解析命令
        let parts: Vec<&str> = command.splitn(2, ' ').collect();
        let cmd = parts.first().unwrap_or(&"");
        let args = parts.get(1).unwrap_or(&"");

        match *cmd {
            "setcwd" => {
                // 设置当前目录
                if !args.is_empty() {
                    self.update_current_dir(args.to_string());
                }
            }
            "setshell" => {
                // 设置 Shell 类型
                if !args.is_empty() {
                    self.set_shell_type_from_path(args);
                }
            }
            _ => {
                tracing::debug!(
                    "[ShellIntegration] 未知 Wave 命令: block_id={}, cmd={}",
                    self.block_id,
                    cmd
                );
            }
        }

        Ok(())
    }

    /// 设置状态
    fn set_status(&self, new_status: ShellIntegrationStatus) {
        let old_status = {
            let mut guard = self.status.write().unwrap();
            let old = *guard;
            *guard = new_status;
            old
        };

        if old_status != new_status {
            tracing::debug!(
                "[ShellIntegration] 状态变更: block_id={}, old={:?}, new={:?}",
                self.block_id,
                old_status,
                new_status
            );

            // 发送状态变更事件
            self.send_status_event(None, self.get_current_command());
        }
    }

    /// 开始命令
    ///
    /// _Requirements: 6.8_
    fn start_command(&self) {
        let now = current_timestamp_ms();
        self.last_command_start.store(now, Ordering::SeqCst);

        let mut guard = self.current_command.write().unwrap();
        *guard = Some(CommandInfo::new());

        tracing::debug!(
            "[ShellIntegration] 命令开始: block_id={}, time={}",
            self.block_id,
            now
        );
    }

    /// 结束命令
    ///
    /// _Requirements: 6.8_
    fn finish_command(&self) {
        let mut guard = self.current_command.write().unwrap();
        if let Some(ref mut cmd) = *guard {
            cmd.finish();
            tracing::debug!(
                "[ShellIntegration] 命令结束: block_id={}, duration_ms={:?}",
                self.block_id,
                cmd.duration_ms
            );
        }
    }

    /// 发送状态变更事件
    ///
    /// _Requirements: 6.6_
    fn send_status_event(&self, current_dir: Option<String>, command_info: Option<CommandInfo>) {
        if let Some(ref app_handle) = self.app_handle {
            let event = ShellIntegrationEvent {
                block_id: self.block_id.clone(),
                status: self.get_status(),
                current_dir: current_dir.or_else(|| self.get_current_dir()),
                command_info,
            };

            if let Err(e) = emit_helper::emit(
                app_handle.as_ref(),
                event_names::SHELL_INTEGRATION_STATUS,
                &event,
            ) {
                tracing::warn!(
                    "[ShellIntegration] 发送状态事件失败: block_id={}, error={}",
                    self.block_id,
                    e
                );
            }
        }
    }

    /// 重置状态
    pub fn reset(&self) {
        {
            let mut guard = self.current_dir.write().unwrap();
            *guard = None;
        }
        {
            let mut guard = self.status.write().unwrap();
            *guard = ShellIntegrationStatus::Unknown;
        }
        {
            let mut guard = self.current_command.write().unwrap();
            *guard = None;
        }
        self.last_command_start.store(0, Ordering::SeqCst);

        tracing::debug!("[ShellIntegration] 状态重置: block_id={}", self.block_id);
    }
}

/// 获取当前时间戳（毫秒）
fn current_timestamp_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shell_type_from_path() {
        assert_eq!(ShellType::from_path("/bin/bash"), ShellType::Bash);
        assert_eq!(ShellType::from_path("/usr/bin/zsh"), ShellType::Zsh);
        assert_eq!(ShellType::from_path("/usr/local/bin/fish"), ShellType::Fish);
        assert_eq!(ShellType::from_path("/usr/bin/pwsh"), ShellType::Pwsh);
        assert_eq!(
            ShellType::from_path("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"),
            ShellType::Pwsh
        );
        assert_eq!(ShellType::from_path("/bin/sh"), ShellType::Unknown);
    }

    #[test]
    fn test_shell_integration_status_default() {
        let integration = ShellIntegration::new("test-block".to_string());
        assert_eq!(integration.get_status(), ShellIntegrationStatus::Unknown);
        assert!(integration.get_current_dir().is_none());
    }

    #[test]
    fn test_process_osc_7() {
        let integration = ShellIntegration::new("test-block".to_string());

        let osc = OSCSequence::CurrentDirectory {
            hostname: Some("localhost".to_string()),
            path: "/home/user".to_string(),
        };

        integration.process_osc(&osc).unwrap();
        assert_eq!(
            integration.get_current_dir(),
            Some("/home/user".to_string())
        );
    }

    #[test]
    fn test_process_osc_133_prompt_start() {
        let integration = ShellIntegration::new("test-block".to_string());

        // 先设置为 RunningCommand
        let osc_exec = OSCSequence::PromptMark {
            mark_type: PromptMarkType::CommandExecuted,
        };
        integration.process_osc(&osc_exec).unwrap();
        assert_eq!(
            integration.get_status(),
            ShellIntegrationStatus::RunningCommand
        );

        // 然后 PromptStart 应该切换到 Ready
        let osc_prompt = OSCSequence::PromptMark {
            mark_type: PromptMarkType::PromptStart,
        };
        integration.process_osc(&osc_prompt).unwrap();
        assert_eq!(integration.get_status(), ShellIntegrationStatus::Ready);
    }

    #[test]
    fn test_process_osc_133_command_executed() {
        let integration = ShellIntegration::new("test-block".to_string());

        let osc = OSCSequence::PromptMark {
            mark_type: PromptMarkType::CommandExecuted,
        };

        integration.process_osc(&osc).unwrap();
        assert_eq!(
            integration.get_status(),
            ShellIntegrationStatus::RunningCommand
        );
        assert!(integration.get_current_command().is_some());
    }

    #[test]
    fn test_process_osc_133_command_finished() {
        let integration = ShellIntegration::new("test-block".to_string());

        // 先执行命令
        let osc_exec = OSCSequence::PromptMark {
            mark_type: PromptMarkType::CommandExecuted,
        };
        integration.process_osc(&osc_exec).unwrap();

        // 等待一小段时间
        std::thread::sleep(std::time::Duration::from_millis(10));

        // 命令结束
        let osc_finish = OSCSequence::PromptMark {
            mark_type: PromptMarkType::CommandFinished,
        };
        integration.process_osc(&osc_finish).unwrap();

        assert_eq!(integration.get_status(), ShellIntegrationStatus::Ready);

        let cmd_info = integration.get_current_command().unwrap();
        assert!(cmd_info.end_time.is_some());
        assert!(cmd_info.duration_ms.is_some());
        assert!(cmd_info.duration_ms.unwrap() >= 10);
    }

    #[test]
    fn test_process_wave_command_setcwd() {
        let integration = ShellIntegration::new("test-block".to_string());

        let osc = OSCSequence::WaveCommand {
            command: "setcwd /home/user/projects".to_string(),
        };

        integration.process_osc(&osc).unwrap();
        assert_eq!(
            integration.get_current_dir(),
            Some("/home/user/projects".to_string())
        );
    }

    #[test]
    fn test_process_wave_command_setshell() {
        let integration = ShellIntegration::new("test-block".to_string());

        let osc = OSCSequence::WaveCommand {
            command: "setshell /usr/bin/zsh".to_string(),
        };

        integration.process_osc(&osc).unwrap();
        assert_eq!(integration.get_shell_type(), ShellType::Zsh);
    }

    #[test]
    fn test_process_output() {
        let integration = ShellIntegration::new("test-block".to_string());

        // 包含多个 OSC 序列的数据
        let data = b"Hello\x1b]7;file:///home/user\x07World\x1b]133;A\x07End";
        let count = integration.process_output(data);

        assert_eq!(count, 2);
        assert_eq!(
            integration.get_current_dir(),
            Some("/home/user".to_string())
        );
        assert_eq!(integration.get_status(), ShellIntegrationStatus::Ready);
    }

    #[test]
    fn test_reset() {
        let integration = ShellIntegration::new("test-block".to_string());

        // 设置一些状态
        let osc_dir = OSCSequence::CurrentDirectory {
            hostname: None,
            path: "/home/user".to_string(),
        };
        integration.process_osc(&osc_dir).unwrap();

        let osc_exec = OSCSequence::PromptMark {
            mark_type: PromptMarkType::CommandExecuted,
        };
        integration.process_osc(&osc_exec).unwrap();

        // 重置
        integration.reset();

        assert!(integration.get_current_dir().is_none());
        assert_eq!(integration.get_status(), ShellIntegrationStatus::Unknown);
        assert!(integration.get_current_command().is_none());
    }

    #[test]
    fn test_command_info() {
        let mut cmd = CommandInfo::new();
        assert!(cmd.start_time > 0);
        assert!(cmd.end_time.is_none());
        assert!(cmd.duration_ms.is_none());

        std::thread::sleep(std::time::Duration::from_millis(5));
        cmd.finish();

        assert!(cmd.end_time.is_some());
        assert!(cmd.duration_ms.is_some());
        assert!(cmd.duration_ms.unwrap() >= 5);
    }
}
