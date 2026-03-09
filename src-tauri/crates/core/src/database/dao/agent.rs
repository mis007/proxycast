//! Agent 会话和消息的数据访问层
//!
//! 提供 Agent 会话和消息的持久化存储功能

use crate::agent::types::{
    AgentMessage, AgentSession, ContentPart, FunctionCall, MessageContent, ToolCall,
};
use rusqlite::{params, Connection};

const JSON_RECURSION_LIMIT: usize = 50;

/// 解析消息内容 JSON，支持多种格式
///
/// 支持的格式：
/// 1. Aster 格式: `[{"Text":"..."}, {"ToolRequest":...}]`
/// 2. ProxyCast 纯文本: `"string"`
/// 3. ProxyCast Parts: `[{"type":"text","text":"..."}]`
fn parse_message_content(content_json: &str) -> MessageContent {
    // 尝试解析为纯文本字符串
    if let Ok(text) = serde_json::from_str::<String>(content_json) {
        return MessageContent::Text(text);
    }

    // 尝试按 JSON 值解析并提取可展示内容
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(content_json) {
        let parts = parse_content_parts_from_json(&value);
        if !parts.is_empty() {
            return MessageContent::Parts(parts);
        }

        // 兼容历史 toolResponse 协议，将工具输出提取为文本用于后续 tool_response 恢复。
        if let Some(tool_output) = extract_tool_response_text(&value) {
            return MessageContent::Text(tool_output);
        }

        // 历史数据中常见工具协议 JSON（无可展示文本），避免将整段 JSON 暴露到 UI
        if value.is_array() || value.is_object() {
            return MessageContent::Text(String::new());
        }
    }

    // 尝试直接解析为 ProxyCast MessageContent
    if let Ok(content) = serde_json::from_str::<MessageContent>(content_json) {
        return content;
    }

    // 兜底：返回原始 JSON 作为文本
    MessageContent::Text(content_json.to_string())
}

fn normalize_json_type_token(value: &str) -> String {
    value
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric())
        .map(|ch| ch.to_ascii_lowercase())
        .collect()
}

fn push_non_empty(target: &mut Vec<String>, value: Option<&str>) {
    let Some(raw) = value else {
        return;
    };
    let trimmed = raw.trim();
    if !trimmed.is_empty() {
        target.push(trimmed.to_string());
    }
}

fn dedupe_preserve_order(items: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    let mut deduped = Vec::new();
    for item in items {
        if seen.insert(item.clone()) {
            deduped.push(item);
        }
    }
    deduped
}

fn collect_text_candidates_with_depth(
    value: &serde_json::Value,
    target: &mut Vec<String>,
    depth: usize,
) {
    if depth >= JSON_RECURSION_LIMIT {
        return;
    }

    match value {
        serde_json::Value::String(text) => push_non_empty(target, Some(text)),
        serde_json::Value::Array(items) => {
            for item in items {
                collect_text_candidates_with_depth(item, target, depth + 1);
            }
        }
        serde_json::Value::Object(obj) => {
            if let Some(content) = obj.get("content") {
                collect_text_candidates_with_depth(content, target, depth + 1);
            }

            for key in ["text", "output", "stdout", "stderr", "message"] {
                push_non_empty(target, obj.get(key).and_then(|v| v.as_str()));
            }

            if let Some(value) = obj.get("value") {
                collect_text_candidates_with_depth(value, target, depth + 1);
            }

            push_non_empty(target, obj.get("error").and_then(|v| v.as_str()));
        }
        _ => {}
    }
}

fn extract_tool_response_text(value: &serde_json::Value) -> Option<String> {
    extract_tool_response_text_with_depth(value, 0)
}

fn extract_tool_response_text_with_depth(
    value: &serde_json::Value,
    depth: usize,
) -> Option<String> {
    if depth >= JSON_RECURSION_LIMIT {
        return None;
    }

    match value {
        serde_json::Value::Array(items) => {
            let mut segments = Vec::new();
            for item in items {
                if let Some(text) = extract_tool_response_text_with_depth(item, depth + 1) {
                    push_non_empty(&mut segments, Some(&text));
                }
            }
            let deduped = dedupe_preserve_order(segments);
            if deduped.is_empty() {
                None
            } else {
                Some(deduped.join("\n"))
            }
        }
        serde_json::Value::Object(obj) => {
            let type_token = obj
                .get("type")
                .and_then(|v| v.as_str())
                .map(normalize_json_type_token);
            let is_tool_response = matches!(type_token.as_deref(), Some("toolresponse"))
                || obj.contains_key("toolResult")
                || obj.contains_key("tool_result")
                || obj.contains_key("ToolResponse")
                || obj.contains_key("toolResponse")
                || obj.contains_key("tool_response");

            if !is_tool_response {
                return None;
            }

            let mut segments = Vec::new();

            if let Some(inner) = obj
                .get("ToolResponse")
                .or_else(|| obj.get("toolResponse"))
                .or_else(|| obj.get("tool_response"))
            {
                collect_text_candidates_with_depth(inner, &mut segments, depth + 1);
            }

            if let Some(tool_result) = obj.get("toolResult").or_else(|| obj.get("tool_result")) {
                collect_text_candidates_with_depth(tool_result, &mut segments, depth + 1);
            }

            push_non_empty(&mut segments, obj.get("output").and_then(|v| v.as_str()));
            push_non_empty(&mut segments, obj.get("error").and_then(|v| v.as_str()));

            let deduped = dedupe_preserve_order(segments);
            if deduped.is_empty() {
                None
            } else {
                Some(deduped.join("\n"))
            }
        }
        _ => None,
    }
}

fn parse_content_parts_from_json(value: &serde_json::Value) -> Vec<ContentPart> {
    parse_content_parts_from_json_with_depth(value, 0)
}

fn parse_content_parts_from_json_with_depth(
    value: &serde_json::Value,
    depth: usize,
) -> Vec<ContentPart> {
    if depth >= JSON_RECURSION_LIMIT {
        return Vec::new();
    }

    match value {
        serde_json::Value::Array(items) => items
            .iter()
            .filter_map(parse_content_part_item)
            .collect::<Vec<_>>(),
        serde_json::Value::Object(_) => parse_content_part_item(value).into_iter().collect(),
        _ => Vec::new(),
    }
}

fn parse_content_part_item(value: &serde_json::Value) -> Option<ContentPart> {
    let obj = value.as_object()?;

    // Aster 格式: {"Text":"..."} 或 {"Text":{"text":"..."}}
    if let Some(text) = obj.get("Text").and_then(|v| v.as_str()) {
        return Some(ContentPart::Text {
            text: text.to_string(),
        });
    }
    if let Some(text_obj) = obj.get("Text").and_then(|v| v.as_object()) {
        if let Some(text) = text_obj
            .get("text")
            .and_then(|v| v.as_str())
            .or_else(|| text_obj.get("content").and_then(|v| v.as_str()))
        {
            return Some(ContentPart::Text {
                text: text.to_string(),
            });
        }
    }

    // 常见文本格式:
    // - {"text":"..."}
    // - {"type":"text","text":"..."}
    // - {"type":"text","content":"..."}
    // - {"type":"input_text","text":"..."}
    // - {"type":"output_text","text":"..."}
    if let Some(text) = obj.get("text").and_then(|v| v.as_str()) {
        return Some(ContentPart::Text {
            text: text.to_string(),
        });
    }

    let part_type = obj.get("type").and_then(|v| v.as_str());

    if matches!(part_type, Some("text" | "input_text" | "output_text")) {
        if let Some(text) = obj.get("content").and_then(|v| v.as_str()) {
            return Some(ContentPart::Text {
                text: text.to_string(),
            });
        }
    }

    // 图片格式:
    // - {"type":"image_url","image_url":{"url":"..."}}
    // - {"type":"input_image","image_url":"..."}
    // - {"type":"image","mime_type":"image/png","data":"base64..."}
    // - {"type":"image","source":{"media_type":"image/png","data":"base64..."}}
    if matches!(part_type, Some("image_url" | "input_image")) {
        let image_url_value = obj.get("image_url").or_else(|| obj.get("url"))?;
        let (url, detail) = if let Some(url) = image_url_value.as_str() {
            (url.to_string(), None)
        } else {
            let image_url_obj = image_url_value.as_object()?;
            let url = image_url_obj.get("url")?.as_str()?.to_string();
            let detail = image_url_obj
                .get("detail")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            (url, detail)
        };
        return Some(ContentPart::ImageUrl {
            image_url: crate::agent::types::ImageUrl { url, detail },
        });
    }

    if part_type == Some("image") {
        if let Some(url) = obj
            .get("url")
            .and_then(|v| v.as_str())
            .or_else(|| obj.get("image_url").and_then(|v| v.as_str()))
        {
            return Some(ContentPart::ImageUrl {
                image_url: crate::agent::types::ImageUrl {
                    url: url.to_string(),
                    detail: None,
                },
            });
        }

        let source_obj = obj.get("source").and_then(|v| v.as_object());
        let mime_type = obj
            .get("mime_type")
            .or_else(|| obj.get("media_type"))
            .and_then(|v| v.as_str())
            .or_else(|| {
                source_obj
                    .and_then(|source| source.get("mime_type").or_else(|| source.get("media_type")))
                    .and_then(|v| v.as_str())
            });
        let data = obj
            .get("data")
            .or_else(|| obj.get("image_base64"))
            .and_then(|v| v.as_str())
            .or_else(|| {
                source_obj
                    .and_then(|source| source.get("data"))
                    .and_then(|v| v.as_str())
            });

        if let (Some(mime), Some(data)) = (mime_type, data) {
            let url = format!("data:{mime};base64,{data}");
            return Some(ContentPart::ImageUrl {
                image_url: crate::agent::types::ImageUrl { url, detail: None },
            });
        }
    }

    // 兼容 {"image_url":{"url":"..."}}（无 type）
    if let Some(image_url_obj) = obj.get("image_url").and_then(|v| v.as_object()) {
        if let Some(url) = image_url_obj.get("url").and_then(|v| v.as_str()) {
            let detail = image_url_obj
                .get("detail")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            return Some(ContentPart::ImageUrl {
                image_url: crate::agent::types::ImageUrl {
                    url: url.to_string(),
                    detail,
                },
            });
        }
    }

    // 兼容 {"image_url":"..."}（无 type）
    if let Some(url) = obj.get("image_url").and_then(|v| v.as_str()) {
        return Some(ContentPart::ImageUrl {
            image_url: crate::agent::types::ImageUrl {
                url: url.to_string(),
                detail: None,
            },
        });
    }

    None
}

/// 解析工具调用 JSON，兼容历史数据缺少 `type` 字段的情况
fn parse_tool_calls(tool_calls_json: Option<&str>) -> Option<Vec<ToolCall>> {
    let json = tool_calls_json?;
    if json.trim().is_empty() {
        return None;
    }

    // 新格式：直接反序列化
    if let Ok(tool_calls) = serde_json::from_str::<Vec<ToolCall>>(json) {
        return Some(tool_calls);
    }

    // 兼容旧格式：手动解析并补默认值
    let raw_items = match serde_json::from_str::<Vec<serde_json::Value>>(json) {
        Ok(items) => items,
        Err(e) => {
            tracing::warn!("[AgentDao] 解析 tool_calls_json 失败，已降级忽略: {}", e);
            return None;
        }
    };

    let mut parsed = Vec::new();

    for (idx, item) in raw_items.iter().enumerate() {
        let Some(obj) = item.as_object() else {
            continue;
        };

        let id = obj
            .get("id")
            .and_then(|v| v.as_str())
            .filter(|v| !v.is_empty())
            .map(ToString::to_string)
            .unwrap_or_else(|| format!("legacy_tool_call_{idx}"));

        // 历史数据可能没有 `type`，默认按 function 处理
        let call_type = obj
            .get("type")
            .or_else(|| obj.get("call_type"))
            .and_then(|v| v.as_str())
            .unwrap_or("function")
            .to_string();

        let tool_call_value = obj
            .get("toolCall")
            .and_then(|v| v.get("value"))
            .or_else(|| obj.get("tool_call").and_then(|v| v.get("value")));

        let function_name = obj
            .get("function")
            .and_then(|v| v.get("name"))
            .and_then(|v| v.as_str())
            .or_else(|| {
                tool_call_value
                    .and_then(|v| v.get("name"))
                    .and_then(|v| v.as_str())
            })
            .or_else(|| obj.get("tool_name").and_then(|v| v.as_str()))
            .or_else(|| obj.get("name").and_then(|v| v.as_str()));

        let Some(function_name) = function_name else {
            continue;
        };

        let function_arguments = obj
            .get("function")
            .and_then(|v| v.get("arguments"))
            .or_else(|| tool_call_value.and_then(|v| v.get("arguments")))
            .or_else(|| obj.get("arguments"))
            .map(|v| {
                if let Some(s) = v.as_str() {
                    s.to_string()
                } else {
                    v.to_string()
                }
            })
            .unwrap_or_else(|| "{}".to_string());

        parsed.push(ToolCall {
            id,
            call_type,
            function: FunctionCall {
                name: function_name.to_string(),
                arguments: function_arguments,
            },
        });
    }

    if parsed.is_empty() {
        None
    } else {
        Some(parsed)
    }
}

pub struct AgentDao;

impl AgentDao {
    /// 创建新会话
    pub fn create_session(
        conn: &Connection,
        session: &AgentSession,
    ) -> Result<(), rusqlite::Error> {
        conn.execute(
            "INSERT INTO agent_sessions (id, model, system_prompt, title, created_at, updated_at, working_dir, execution_strategy)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                session.id,
                session.model,
                session.system_prompt,
                session.title,
                session.created_at,
                session.updated_at,
                session.working_dir,
                session.execution_strategy,
            ],
        )?;
        Ok(())
    }

    /// 获取会话（不包含消息）
    pub fn get_session(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Option<AgentSession>, rusqlite::Error> {
        let mut stmt = conn.prepare(
            "SELECT id, model, system_prompt, title, created_at, updated_at, working_dir, execution_strategy
             FROM agent_sessions WHERE id = ?",
        )?;

        let mut rows = stmt.query([session_id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(AgentSession {
                id: row.get(0)?,
                model: row.get(1)?,
                messages: Vec::new(), // 消息需要单独加载
                system_prompt: row.get(2)?,
                title: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                working_dir: row.get(6)?,
                execution_strategy: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// 获取会话（包含消息）
    pub fn get_session_with_messages(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Option<AgentSession>, rusqlite::Error> {
        let mut session = match Self::get_session(conn, session_id)? {
            Some(s) => s,
            None => return Ok(None),
        };

        session.messages = Self::get_messages(conn, session_id)?;
        Ok(Some(session))
    }

    /// 获取所有会话（不包含消息）
    pub fn list_sessions(conn: &Connection) -> Result<Vec<AgentSession>, rusqlite::Error> {
        let mut stmt = conn.prepare(
            "SELECT id, model, system_prompt, title, created_at, updated_at, working_dir, execution_strategy
             FROM agent_sessions ORDER BY updated_at DESC",
        )?;

        let sessions = stmt.query_map([], |row| {
            Ok(AgentSession {
                id: row.get(0)?,
                model: row.get(1)?,
                messages: Vec::new(),
                system_prompt: row.get(2)?,
                title: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                working_dir: row.get(6)?,
                execution_strategy: row.get(7)?,
            })
        })?;

        sessions.collect()
    }

    /// 获取会话的消息数量
    pub fn get_message_count(
        conn: &Connection,
        session_id: &str,
    ) -> Result<usize, rusqlite::Error> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM agent_messages WHERE session_id = ?",
            [session_id],
            |row| row.get(0),
        )?;
        Ok(count as usize)
    }

    /// 更新会话的 updated_at 时间
    pub fn update_session_time(
        conn: &Connection,
        session_id: &str,
        updated_at: &str,
    ) -> Result<(), rusqlite::Error> {
        conn.execute(
            "UPDATE agent_sessions SET updated_at = ? WHERE id = ?",
            params![updated_at, session_id],
        )?;
        Ok(())
    }

    /// 删除会话（消息会级联删除）
    pub fn delete_session(conn: &Connection, session_id: &str) -> Result<bool, rusqlite::Error> {
        let rows = conn.execute("DELETE FROM agent_sessions WHERE id = ?", [session_id])?;
        Ok(rows > 0)
    }

    /// 添加消息到会话
    pub fn add_message(
        conn: &Connection,
        session_id: &str,
        message: &AgentMessage,
    ) -> Result<(), rusqlite::Error> {
        let content_json = serde_json::to_string(&message.content)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        let tool_calls_json = message
            .tool_calls
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        conn.execute(
            "INSERT INTO agent_messages (session_id, role, content_json, timestamp, tool_calls_json, tool_call_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session_id,
                message.role,
                content_json,
                message.timestamp,
                tool_calls_json,
                message.tool_call_id,
            ],
        )?;

        // 更新会话的 updated_at
        conn.execute(
            "UPDATE agent_sessions SET updated_at = ? WHERE id = ?",
            params![message.timestamp, session_id],
        )?;

        Ok(())
    }

    /// 获取会话的所有消息
    pub fn get_messages(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Vec<AgentMessage>, rusqlite::Error> {
        let mut stmt = conn.prepare(
            "SELECT role, content_json, timestamp, tool_calls_json, tool_call_id
             FROM agent_messages WHERE session_id = ? ORDER BY id ASC",
        )?;

        let messages = stmt.query_map([session_id], |row| {
            let role: String = row.get(0)?;
            let content_json: String = row.get(1)?;
            let timestamp: String = row.get(2)?;
            let tool_calls_json: Option<String> = row.get(3)?;
            let tool_call_id: Option<String> = row.get(4)?;

            // 解析 JSON - 支持多种格式
            // 1. Aster 格式: [{"Text":"..."}, {"Text":"..."}]
            // 2. ProxyCast 格式: "string" 或 [{"type":"text","text":"..."}]
            let content = parse_message_content(&content_json);

            // 兼容历史数据：tool_calls 中缺失 type 字段时自动降级解析
            let tool_calls: Option<Vec<ToolCall>> = parse_tool_calls(tool_calls_json.as_deref());

            Ok(AgentMessage {
                role,
                content,
                timestamp,
                tool_calls,
                tool_call_id,
                reasoning_content: None,
            })
        })?;

        messages.collect()
    }

    /// 删除会话的所有消息
    pub fn delete_messages(conn: &Connection, session_id: &str) -> Result<(), rusqlite::Error> {
        conn.execute(
            "DELETE FROM agent_messages WHERE session_id = ?",
            [session_id],
        )?;
        Ok(())
    }

    /// 检查会话是否存在
    pub fn session_exists(conn: &Connection, session_id: &str) -> Result<bool, rusqlite::Error> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM agent_sessions WHERE id = ?",
            [session_id],
            |row| row.get(0),
        )?;
        Ok(count > 0)
    }

    /// 更新会话标题
    pub fn update_title(
        conn: &Connection,
        session_id: &str,
        title: &str,
    ) -> Result<(), rusqlite::Error> {
        conn.execute(
            "UPDATE agent_sessions SET title = ? WHERE id = ?",
            params![title, session_id],
        )?;
        Ok(())
    }

    /// 获取会话标题
    pub fn get_title(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Option<String>, rusqlite::Error> {
        let mut stmt = conn.prepare("SELECT title FROM agent_sessions WHERE id = ?")?;
        let mut rows = stmt.query([session_id])?;

        if let Some(row) = rows.next()? {
            Ok(row.get(0)?)
        } else {
            Ok(None)
        }
    }

    /// 更新会话执行策略
    pub fn update_execution_strategy(
        conn: &Connection,
        session_id: &str,
        execution_strategy: &str,
    ) -> Result<(), rusqlite::Error> {
        conn.execute(
            "UPDATE agent_sessions SET execution_strategy = ? WHERE id = ?",
            params![execution_strategy, session_id],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::agent::types::MessageContent;

    use super::{parse_message_content, parse_tool_calls, JSON_RECURSION_LIMIT};

    #[test]
    fn parse_tool_calls_should_compat_with_legacy_missing_type() {
        let legacy =
            r#"[{"id":"call_1","function":{"name":"search","arguments":"{\"q\":\"rust\"}"}}]"#;
        let result = parse_tool_calls(Some(legacy)).expect("应能解析旧格式 tool_calls");

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].id, "call_1");
        assert_eq!(result[0].call_type, "function");
        assert_eq!(result[0].function.name, "search");
    }

    #[test]
    fn parse_tool_calls_should_return_none_on_invalid_json() {
        let result = parse_tool_calls(Some("not-json"));
        assert!(result.is_none());
    }

    #[test]
    fn parse_tool_calls_should_parse_aster_tool_request_shape() {
        let legacy = r#"[{"id":"call_324","toolCall":{"status":"success","value":{"name":"Skill","arguments":{"skill":"user:canvas-design"}}}}]"#;
        let result = parse_tool_calls(Some(legacy)).expect("应能解析 aster toolRequest 结构");

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].id, "call_324");
        assert_eq!(result[0].function.name, "Skill");

        let args_value: serde_json::Value =
            serde_json::from_str(&result[0].function.arguments).expect("arguments 应为 JSON");
        assert_eq!(args_value["skill"], serde_json::json!("user:canvas-design"));
    }

    #[test]
    fn parse_message_content_should_not_expose_tool_payload_json() {
        let tool_only =
            r#"[{"type":"toolRequest","id":"call_1","toolName":"query","arguments":{"q":"rust"}}]"#;
        let parsed = parse_message_content(tool_only);
        assert_eq!(parsed.as_text(), "");
    }

    #[test]
    fn parse_message_content_should_extract_text_parts() {
        let mixed = r#"[{"type":"text","text":"hello"},{"Text":"world"}]"#;
        let parsed = parse_message_content(mixed);
        assert_eq!(parsed.as_text(), "hello\nworld");
    }

    #[test]
    fn parse_message_content_should_extract_input_image_parts() {
        let mixed = r#"[{"type":"input_text","text":"参考图"},{"type":"input_image","image_url":"data:image/png;base64,aGVsbG8="}]"#;
        let parsed = parse_message_content(mixed);

        match parsed {
            MessageContent::Parts(parts) => {
                assert_eq!(parts.len(), 2);
                assert!(parts.iter().any(|part| matches!(
                    part,
                    crate::agent::types::ContentPart::ImageUrl { image_url }
                        if image_url.url == "data:image/png;base64,aGVsbG8="
                )));
            }
            _ => panic!("应解析为 Parts"),
        }
    }

    #[test]
    fn parse_message_content_should_extract_tool_response_output() {
        let tool_response = r#"[{"type":"toolResponse","id":"call_1","toolResult":{"status":"success","value":{"content":[{"type":"text","text":"任务已完成"}],"isError":false}}}]"#;
        let parsed = parse_message_content(tool_response);
        assert_eq!(parsed.as_text(), "任务已完成");
    }

    #[test]
    fn parse_message_content_should_extract_tool_response_error() {
        let tool_response = r#"[{"type":"toolResponse","id":"call_2","toolResult":{"status":"error","error":"-32603: Tool not found"}}]"#;
        let parsed = parse_message_content(tool_response);
        assert_eq!(parsed.as_text(), "-32603: Tool not found");
    }

    #[test]
    fn parse_message_content_should_stop_on_excessive_depth() {
        let mut nested = serde_json::json!({ "text": "不会到达" });
        for _ in 0..(JSON_RECURSION_LIMIT + 10) {
            nested = serde_json::json!({ "value": nested });
        }

        let payload = serde_json::json!([
            {
                "type": "toolResponse",
                "toolResult": nested
            }
        ]);

        let parsed = parse_message_content(&payload.to_string());
        assert_eq!(parsed.as_text(), "");
    }
}
