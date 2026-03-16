//! 协议转换层
//!
//! 处理不同前端协议（OpenAI、Anthropic、Gemini CLI）与不同后端（Kiro、Codex、Claude）
//! 之间的请求和响应格式转换。
//!
//! # 架构设计
//!
//! ```text
//! translator/
//! ├── traits.rs              # 转换器 trait 定义
//! └── kiro/                   # Kiro/CodeWhisperer 后端
//!     ├── openai/             # OpenAI 前端协议
//!     │   ├── request.rs      # OpenAI → Kiro 请求
//!     │   └── response.rs     # StreamEvent → OpenAI SSE
//!     └── anthropic/          # Anthropic 前端协议
//!         ├── request.rs      # Anthropic → Kiro 请求
//!         └── response.rs     # StreamEvent → Anthropic SSE
//! ```
//!
//! # 使用示例
//!
//! ```ignore
//! use lime::translator::kiro::{
//!     AnthropicRequestTranslator, AnthropicResponseTranslator,
//! };
//! use lime::translator::traits::RequestTranslator;
//!
//! // 请求转换
//! let translator = AnthropicRequestTranslator::new();
//! let cw_request = translator.translate_request(anthropic_request)?;
//!
//! // 响应转换
//! let mut response_translator = AnthropicResponseTranslator::new(model);
//! for event in stream_events {
//!     let sse_events = response_translator.translate_to_sse(&event);
//!     for sse in sse_events {
//!         // 发送 SSE 到客户端
//!     }
//! }
//! ```

pub mod kiro;
pub mod traits;

// 重新导出核心类型
pub use kiro::{
    AnthropicRequestTranslator, AnthropicResponseTranslator, OpenAiRequestTranslator,
    OpenAiResponseTranslator,
};
pub use traits::{
    RequestTranslator, ResponseTranslator, SseResponseTranslator, TranslateError,
    TranslateErrorKind,
};
