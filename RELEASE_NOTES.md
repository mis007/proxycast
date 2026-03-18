## Lime v0.90.0

### ✨ 主要更新

- **Aster Agent 聊天链路完成收口**：前端统一走 `useAgentChatUnified -> useAsterAgentChat`，移除旧 `useAgentChat` / `agentStore` compat 路径；会话恢复、流式消息、工具状态与 topic snapshot 改为模块化协作
- **Agent 会话与时间线持久化增强**：Aster session store、agent timeline DAO、数据库 schema 与迁移链路继续补强，聊天历史、统计与项目上下文构建更稳定
- **托盘模型快捷切换上线**：新增全局托盘模型同步、主题感知的快捷模型组与模型选择联动，聊天页、侧边栏和模型选择器体验同步更新
- **调试与性能诊断能力补齐**：新增前端 debug 上报 API、Tauri profiling 启动脚本、Perfetto / Tokio Console 支持与配套文档，运行时排障更直接
- **OpenClaw 与运行时集成继续完善**：Browser Runtime、OpenClaw 页面与后端服务、Dev Bridge 查询和技能服务继续收口，提升桌面侧运行时协同
- **品牌图标与托盘资产刷新**：应用图标、托盘状态图与启动页、侧边栏视觉资源同步更新

### ⚠️ 兼容性说明

- Agent 聊天现役事实源已统一到 Aster 后端；旧 `useAgentChat` / `agentStore` 已移除，后续新功能不再沿 compat 路径扩展
- Profiling 诊断能力仅在显式开发启动流程下启用；release / 生产构建默认忽略这些调试开关

### 🧪 测试

- 发布前执行：`cargo test`、`cargo fmt --all`、`cargo clippy`、`npm run lint`

### 📝 文档

- 更新 Agent / Aster 集成、治理与 profiling 相关文档，补充前端诊断与发布说明

### 📦 Windows 下载说明

- `Lime_*_x64-offline-setup.exe`：推荐优先使用，内置 WebView2 离线安装器，安装更完整
- `Lime_*_x64-online-setup.exe`：体积更小，适合网络稳定且可访问微软下载源的环境
- 如果在线安装失败，请改用离线安装包

---

**完整变更**: v0.89.1...v0.90.0
