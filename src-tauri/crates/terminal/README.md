# lime-terminal

<!-- 一旦我所属的文件夹有所变化，请更新我 -->

## 架构说明

终端核心模块独立 crate，采用**后端预创建 PTY**架构（参考 WaveTerm）。
通过 `TerminalEventEmit` trait 抽象事件发射，不直接依赖 Tauri。

**核心原则：**
- 后端是会话的唯一真相来源
- PTY 使用默认大小 (24x80) 预创建
- 前端连接后通过 resize 同步实际大小
- 统一的 BlockController 抽象层支持多种连接类型
- 通过 trait 抽象与 Tauri 解耦

## Trait 设计（两层抽象）

- `TerminalEventEmit`：基础 trait（dyn 兼容，不要求 Clone）
- `TerminalEventEmitter`：扩展 trait = `TerminalEventEmit + Clone`（blanket impl）
- `DynEmitter`：`Arc<dyn TerminalEventEmit>` newtype，自动获得 `TerminalEventEmitter`
- `NoOpEmitter`：空实现，用于测试

## 文件索引

- `src/lib.rs` - 模块声明和类型重导出
- `src/emitter.rs` - 事件发射器 trait 定义
- `src/emit_helper.rs` - 事件发射辅助函数
- `src/error.rs` - 错误类型定义
- `src/events.rs` - 事件定义
- `src/pty_session.rs` - PTY 会话封装
- `src/session_manager.rs` - 会话管理器
- `src/tests.rs` - 单元测试（187 个）
- `src/block_controller/` - 块控制器模块
- `src/connections/` - 连接模块（本地 PTY、SSH、WSL）
- `src/integration/` - 集成模块（OSC 解析、Shell 集成、状态重同步）
- `src/persistence/` - 持久化存储模块

## 更新提醒

任何文件变更后，请更新此文档和相关的上级文档。
