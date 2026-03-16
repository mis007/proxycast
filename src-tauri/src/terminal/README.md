# terminal（重导出层）

<!-- 一旦我所属的文件夹有所变化，请更新我 -->

## 架构说明

本目录是终端模块的**重导出层**，实际实现已迁移至独立 crate `lime-terminal`（位于 `crates/terminal/`）。

本层职责：
- 提供 `TauriEmitter` newtype，桥接 Tauri `AppHandle` 与终端 crate 的 `TerminalEventEmit` trait
- 重导出 `lime-terminal` 的所有公共模块和类型，保持 `crate::terminal::xxx` 路径兼容

## 文件索引

- `mod.rs` - TauriEmitter 定义 + lime-terminal 重导出

## 实际实现

详见 `crates/terminal/` 目录及其 README。

## 更新提醒

任何文件变更后，请更新此文档和相关的上级文档。
