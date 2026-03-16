# Lime 测试体系

> 基于 Anthropic AI Agent 评估指南与 Orchids Bridge 项目实践

## 概述

Lime 作为 AI API 代理和 Agent 集成平台，需要一套完整的测试体系来确保：
- API 代理的正确性和稳定性
- 凭证池管理的可靠性
- Aster Agent 集成的功能完整性
- 协议转换的准确性

## 测试分层

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lime 测试金字塔                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌─────────┐                              │
│                        │  E2E    │  端到端测试                   │
│                        │  测试   │  (Tauri + 前端)               │
│                       ─┴─────────┴─                             │
│                      ┌─────────────┐                            │
│                      │   集成测试   │  API 服务器、凭证池         │
│                     ─┴─────────────┴─                           │
│                    ┌─────────────────┐                          │
│                    │     单元测试     │  转换器、Provider、工具   │
│                   ─┴─────────────────┴─                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
docs/test/
├── README.md                    # 本文件 - 测试体系概览
├── unit-tests.md               # 单元测试指南
├── integration-tests.md        # 集成测试指南
├── e2e-tests.md               # 端到端测试指南
├── agent-evaluation.md        # Agent 评估指南（核心文档）
└── test-cases/                # 测试用例模板
    ├── converter-tests.md     # 协议转换器测试用例
    ├── provider-tests.md      # Provider 测试用例
    └── agent-tests.md         # Agent 测试用例
```

## 文档索引

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [unit-tests.md](unit-tests.md) | 单元测试指南 | 独立模块测试 |
| [integration-tests.md](integration-tests.md) | 集成测试指南 | 模块间协作测试 |
| [e2e-tests.md](e2e-tests.md) | E2E 测试指南 | 完整用户流程测试 |
| [agent-evaluation.md](agent-evaluation.md) | Agent 评估指南 | AI Agent 行为评估 |
| [test-cases/converter-tests.md](test-cases/converter-tests.md) | 转换器测试用例 | OpenAI ↔ Claude 转换 |
| [test-cases/provider-tests.md](test-cases/provider-tests.md) | Provider 测试用例 | OAuth 和 API 调用 |
| [test-cases/agent-tests.md](test-cases/agent-tests.md) | Agent 测试用例 | Aster Agent 集成 |

## 快速开始

### 运行 Rust 测试

```bash
cd src-tauri && cargo test
```

### 运行前端测试

```bash
npm test
```

### 运行代码检查

```bash
# Rust
cd src-tauri && cargo clippy

# 前端
npm run lint
```

## 核心测试模块

| 模块 | 测试重点 | 文档 |
|------|----------|------|
| 协议转换 | OpenAI ↔ Claude 转换正确性 | [converter-tests.md](test-cases/converter-tests.md) |
| Provider 系统 | OAuth 刷新、API 调用 | [provider-tests.md](test-cases/provider-tests.md) |
| 凭证池 | 轮询、健康检查、负载均衡 | [integration-tests.md](integration-tests.md) |
| Aster Agent | 流式响应、工具调用 | [agent-tests.md](test-cases/agent-tests.md) |

## 测试原则

基于 [Anthropic AI Agent 评估指南](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 和 Orchids Bridge 项目实践：

1. **评估结果，而非路径** - Agent 可能找到更好的方法，不要过度约束执行路径
2. **平衡问题集** - 测试"应该做"和"不应该做"两种情况
3. **隔离测试环境** - 每个测试独立状态，避免测试间污染
4. **从 Bug 到测试** - 每个修复的 Bug 都应该有对应测试用例
5. **处理非确定性** - 使用 pass@k 和 pass^k 指标评估 Agent 行为
6. **多层防护** - 结合自动评估、监控、人工审查

## 评分器类型

| 类型 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **代码评分器** | 确定性验证 | 快速、可复现 | 对有效变体脆弱 |
| **模型评分器** | 语义评估 | 灵活、可扩展 | 非确定性、需校准 |
| **人工评分器** | 复杂判断 | 金标准质量 | 昂贵、慢 |

## 评估指标

```
pass@k = P(至少 1 次成功 | k 次尝试) = 1 - (1 - p)^k
pass^k = P(全部成功 | k 次尝试) = p^k
```

- **pass@k**：适用于"找到一个解决方案就行"的场景
- **pass^k**：适用于"每次都必须成功"的场景
