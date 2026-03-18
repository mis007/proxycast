use chrono::Utc;
use lime_agent::TauriAgentEvent;
use lime_core::database::dao::agent_timeline::{
    AgentThreadItem, AgentThreadItemPayload, AgentThreadItemStatus, AgentThreadTurn,
    AgentThreadTurnStatus, AgentTimelineDao,
};
use lime_core::database::{lock_db, DbConnection};
use serde_json::{json, Value};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};

const PROPOSED_PLAN_OPEN: &str = "<proposed_plan>";
const PROPOSED_PLAN_CLOSE: &str = "</proposed_plan>";

fn format_runtime_status_text(title: &str, detail: &str, checkpoints: &[String]) -> String {
    let mut lines = Vec::new();
    let trimmed_title = title.trim();
    if !trimmed_title.is_empty() {
        lines.push(trimmed_title.to_string());
    }
    let trimmed_detail = detail.trim();
    if !trimmed_detail.is_empty() {
        lines.push(trimmed_detail.to_string());
    }
    for checkpoint in checkpoints {
        let trimmed = checkpoint.trim();
        if !trimmed.is_empty() {
            lines.push(format!("• {trimmed}"));
        }
    }
    lines.join("\n")
}

fn emit_event(app: &AppHandle, event_name: &str, event: &TauriAgentEvent) {
    if let Err(error) = app.emit(event_name, event) {
        tracing::error!("[AgentTimeline] 发送事件失败: {}", error);
    }
}

fn as_object(value: &Value) -> Option<&serde_json::Map<String, Value>> {
    value.as_object()
}

#[derive(Debug, Clone)]
struct ExtractedFileArtifact {
    path: String,
    artifact_id: Option<String>,
}

fn push_unique_file_path(target: &mut Vec<String>, raw: &str) {
    let trimmed = raw.trim();
    if trimmed.is_empty() || target.iter().any(|item| item == trimmed) {
        return;
    }
    target.push(trimmed.to_string());
}

fn collect_string_values(value: &Value) -> Vec<String> {
    match value {
        Value::String(text) => {
            let trimmed = text.trim();
            if trimmed.is_empty() {
                Vec::new()
            } else {
                vec![trimmed.to_string()]
            }
        }
        Value::Array(items) => items
            .iter()
            .filter_map(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
            .collect(),
        _ => Vec::new(),
    }
}

fn extract_file_artifacts(
    arguments: Option<&Value>,
    metadata: Option<&Value>,
) -> Vec<ExtractedFileArtifact> {
    let mut paths = Vec::new();
    for source in [arguments, metadata] {
        let Some(object) = source.and_then(as_object) else {
            continue;
        };
        for key in [
            "path",
            "file_path",
            "filePath",
            "output_file",
            "output_path",
            "outputPath",
            "artifact_path",
            "artifact_paths",
            "absolute_path",
            "absolutePath",
        ] {
            let Some(value) = object.get(key) else {
                continue;
            };
            for path in collect_string_values(value) {
                push_unique_file_path(&mut paths, path.as_str());
            }
        }
    }

    let metadata_object = metadata.and_then(as_object);
    let artifact_ids = metadata_object
        .and_then(|object| object.get("artifact_ids"))
        .map(collect_string_values)
        .unwrap_or_default();
    let single_artifact_id = metadata_object
        .and_then(|object| {
            object
                .get("artifact_id")
                .or_else(|| object.get("artifactId"))
        })
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    paths
        .into_iter()
        .enumerate()
        .map(|(index, path)| ExtractedFileArtifact {
            path,
            artifact_id: artifact_ids.get(index).cloned().or_else(|| {
                if index == 0 {
                    single_artifact_id.clone()
                } else {
                    None
                }
            }),
        })
        .collect()
}

fn resolve_artifact_item_status(metadata: Option<&Value>) -> AgentThreadItemStatus {
    let write_phase = metadata
        .and_then(|value| value.get("writePhase"))
        .and_then(Value::as_str);
    if matches!(write_phase, Some("failed")) {
        return AgentThreadItemStatus::Failed;
    }

    match metadata
        .and_then(|value| value.get("complete"))
        .and_then(Value::as_bool)
    {
        Some(false) => AgentThreadItemStatus::InProgress,
        _ => AgentThreadItemStatus::Completed,
    }
}

fn resolve_artifact_item_source(metadata: Option<&Value>) -> String {
    metadata
        .and_then(|value| value.get("lastUpdateSource"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| "artifact_snapshot".to_string())
}

fn extract_proposed_plan_block(text: &str) -> Option<String> {
    let start = text.find(PROPOSED_PLAN_OPEN)?;
    let remainder = &text[start + PROPOSED_PLAN_OPEN.len()..];
    let end = remainder.find(PROPOSED_PLAN_CLOSE)?;
    let content = remainder[..end].trim();
    if content.is_empty() {
        None
    } else {
        Some(content.to_string())
    }
}

#[derive(Debug)]
pub struct AgentTimelineRecorder {
    db: DbConnection,
    thread_id: String,
    turn_id: String,
    turn: AgentThreadTurn,
    sequence_counter: i64,
    item_sequences: HashMap<String, i64>,
    item_statuses: HashMap<String, AgentThreadItemStatus>,
    plan_text: Option<String>,
    turn_summary_text: Option<String>,
}

impl AgentTimelineRecorder {
    pub fn create(
        db: DbConnection,
        thread_id: impl Into<String>,
        turn_id: impl Into<String>,
        prompt_text: impl Into<String>,
    ) -> Result<Self, String> {
        let thread_id = thread_id.into();
        let turn_id = turn_id.into();
        let prompt_text = prompt_text.into();
        let now = Utc::now().to_rfc3339();
        let turn = AgentThreadTurn {
            id: turn_id.clone(),
            thread_id: thread_id.clone(),
            prompt_text,
            status: AgentThreadTurnStatus::Running,
            started_at: now.clone(),
            completed_at: None,
            error_message: None,
            created_at: now.clone(),
            updated_at: now,
        };

        {
            let conn = lock_db(&db)?;
            AgentTimelineDao::create_turn(&conn, &turn)
                .map_err(|e| format!("创建 turn 失败: {e}"))?;
        }

        Ok(Self {
            db,
            thread_id,
            turn_id,
            turn,
            sequence_counter: 0,
            item_sequences: HashMap::new(),
            item_statuses: HashMap::new(),
            plan_text: None,
            turn_summary_text: None,
        })
    }

    pub fn thread_id(&self) -> &str {
        &self.thread_id
    }

    pub fn turn_id(&self) -> &str {
        &self.turn_id
    }

    pub fn record_runtime_event(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        event: &TauriAgentEvent,
        _workspace_root: &str,
    ) -> Result<(), String> {
        match event {
            TauriAgentEvent::ThreadStarted { .. } => {}
            TauriAgentEvent::TurnStarted { turn } => {
                self.thread_id = turn.thread_id.clone();
                self.turn_id = turn.id.clone();
                self.turn = turn.clone();

                let conn = lock_db(&self.db)?;
                AgentTimelineDao::upsert_turn(&conn, &self.turn)
                    .map_err(|e| format!("同步 turn 启动态失败: {e}"))?;
            }
            TauriAgentEvent::ItemStarted { item } => {
                self.persist_runtime_item(
                    app,
                    event_name,
                    item.clone(),
                    TauriAgentEvent::ItemStarted { item: item.clone() },
                )?;
                self.maybe_project_plan_item(app, event_name, item)?;
            }
            TauriAgentEvent::ItemUpdated { item } => {
                self.persist_runtime_item(
                    app,
                    event_name,
                    item.clone(),
                    TauriAgentEvent::ItemUpdated { item: item.clone() },
                )?;
                self.maybe_project_plan_item(app, event_name, item)?;
            }
            TauriAgentEvent::ItemCompleted { item } => {
                self.persist_runtime_item(
                    app,
                    event_name,
                    item.clone(),
                    TauriAgentEvent::ItemCompleted { item: item.clone() },
                )?;
                self.maybe_project_plan_item(app, event_name, item)?;
            }
            TauriAgentEvent::RuntimeStatus { status } => {
                let text =
                    format_runtime_status_text(&status.title, &status.detail, &status.checkpoints);
                if !text.is_empty() {
                    self.turn_summary_text = Some(text.clone());
                    let item = self.build_item(
                        format!("turn_summary:{}", self.turn_id),
                        AgentThreadItemStatus::InProgress,
                        None,
                        AgentThreadItemPayload::TurnSummary { text },
                    );
                    self.persist_and_emit_item(app, event_name, item)?;
                }
            }
            TauriAgentEvent::ToolEnd { tool_id, result } => {
                let metadata_value = result
                    .metadata
                    .as_ref()
                    .and_then(|metadata| serde_json::to_value(metadata).ok());

                for artifact in extract_file_artifacts(None, metadata_value.as_ref()) {
                    let artifact_path = artifact.path.clone();
                    let status = resolve_artifact_item_status(metadata_value.as_ref());
                    let file_item = self.build_item(
                        artifact
                            .artifact_id
                            .clone()
                            .unwrap_or_else(|| format!("artifact:{}:{}", tool_id, artifact_path)),
                        status.clone(),
                        if matches!(status, AgentThreadItemStatus::InProgress) {
                            None
                        } else {
                            Some(Utc::now().to_rfc3339())
                        },
                        AgentThreadItemPayload::FileArtifact {
                            path: artifact_path,
                            source: "tool_result".to_string(),
                            content: None,
                            metadata: metadata_value.clone(),
                        },
                    );
                    self.persist_and_emit_item(app, event_name, file_item)?;
                }
            }
            TauriAgentEvent::ArtifactSnapshot { artifact } => {
                let metadata_value = artifact
                    .metadata
                    .as_ref()
                    .and_then(|metadata| serde_json::to_value(metadata).ok());
                let status = resolve_artifact_item_status(metadata_value.as_ref());
                let item = self.build_item(
                    artifact.artifact_id.clone(),
                    status.clone(),
                    if matches!(status, AgentThreadItemStatus::InProgress) {
                        None
                    } else {
                        Some(Utc::now().to_rfc3339())
                    },
                    AgentThreadItemPayload::FileArtifact {
                        path: artifact.file_path.clone(),
                        source: resolve_artifact_item_source(metadata_value.as_ref()),
                        content: artifact.content.clone(),
                        metadata: metadata_value,
                    },
                );
                self.persist_and_emit_item(app, event_name, item)?;
            }
            TauriAgentEvent::ActionRequired {
                request_id: _,
                action_type: _,
                data: _,
            } => {}
            TauriAgentEvent::Warning { code, message } => {
                let item = self.build_item(
                    format!("warning:{}:{}", self.turn_id, self.sequence_counter + 1),
                    AgentThreadItemStatus::Completed,
                    Some(Utc::now().to_rfc3339()),
                    AgentThreadItemPayload::Warning {
                        message: message.clone(),
                        code: code.clone(),
                    },
                );
                self.persist_and_emit_item(app, event_name, item)?;
            }
            TauriAgentEvent::Error { message } => {
                let item = self.build_item(
                    format!("error:{}", self.turn_id),
                    AgentThreadItemStatus::Failed,
                    Some(Utc::now().to_rfc3339()),
                    AgentThreadItemPayload::Error {
                        message: message.clone(),
                    },
                );
                self.persist_and_emit_item(app, event_name, item)?;
            }
            _ => {}
        }

        Ok(())
    }

    pub fn complete_turn_success(
        &mut self,
        app: &AppHandle,
        event_name: &str,
    ) -> Result<(), String> {
        self.complete_projection_items(app, event_name, AgentThreadItemStatus::Completed)?;
        let now = Utc::now().to_rfc3339();
        self.turn.status = AgentThreadTurnStatus::Completed;
        self.turn.completed_at = Some(now.clone());
        self.turn.updated_at = now.clone();

        let conn = lock_db(&self.db)?;
        AgentTimelineDao::update_turn_status(
            &conn,
            &self.turn_id,
            AgentThreadTurnStatus::Completed,
            Some(&now),
            None,
            &now,
        )
        .map_err(|e| format!("更新 turn 完成状态失败: {e}"))?;
        drop(conn);

        emit_event(
            app,
            event_name,
            &TauriAgentEvent::TurnCompleted {
                turn: self.turn.clone(),
            },
        );
        Ok(())
    }

    pub fn fail_turn(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        message: &str,
    ) -> Result<(), String> {
        self.complete_projection_items(app, event_name, AgentThreadItemStatus::Completed)?;
        let error_item = self.build_item(
            format!("error:{}", self.turn_id),
            AgentThreadItemStatus::Failed,
            Some(Utc::now().to_rfc3339()),
            AgentThreadItemPayload::Error {
                message: message.to_string(),
            },
        );
        self.persist_and_emit_item(app, event_name, error_item)?;

        let now = Utc::now().to_rfc3339();
        self.turn.status = AgentThreadTurnStatus::Failed;
        self.turn.completed_at = Some(now.clone());
        self.turn.error_message = Some(message.to_string());
        self.turn.updated_at = now.clone();

        let conn = lock_db(&self.db)?;
        AgentTimelineDao::update_turn_status(
            &conn,
            &self.turn_id,
            AgentThreadTurnStatus::Failed,
            Some(&now),
            Some(message),
            &now,
        )
        .map_err(|e| format!("更新 turn 失败状态失败: {e}"))?;
        drop(conn);

        emit_event(
            app,
            event_name,
            &TauriAgentEvent::TurnFailed {
                turn: self.turn.clone(),
            },
        );
        Ok(())
    }

    fn complete_projection_items(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        status: AgentThreadItemStatus,
    ) -> Result<(), String> {
        if let Some(plan_text) = self.plan_text.clone() {
            let item = self.build_item(
                format!("plan:{}", self.turn_id),
                status.clone(),
                Some(Utc::now().to_rfc3339()),
                AgentThreadItemPayload::Plan { text: plan_text },
            );
            self.persist_and_emit_item(app, event_name, item)?;
        }

        if let Some(turn_summary_text) = self.turn_summary_text.clone() {
            let item = self.build_item(
                format!("turn_summary:{}", self.turn_id),
                status,
                Some(Utc::now().to_rfc3339()),
                AgentThreadItemPayload::TurnSummary {
                    text: turn_summary_text,
                },
            );
            self.persist_and_emit_item(app, event_name, item)?;
        }

        Ok(())
    }

    fn build_item(
        &mut self,
        id: String,
        status: AgentThreadItemStatus,
        completed_at: Option<String>,
        payload: AgentThreadItemPayload,
    ) -> AgentThreadItem {
        let now = Utc::now().to_rfc3339();
        let started_at = self
            .item_statuses
            .get(&id)
            .map(|_| {
                let conn = lock_db(&self.db).ok()?;
                AgentTimelineDao::get_item(&conn, &id)
                    .ok()
                    .flatten()
                    .map(|item| item.started_at)
            })
            .flatten()
            .unwrap_or_else(|| now.clone());

        let sequence = if let Some(existing) = self.item_sequences.get(&id) {
            *existing
        } else {
            self.sequence_counter += 1;
            self.item_sequences
                .insert(id.clone(), self.sequence_counter);
            self.sequence_counter
        };

        AgentThreadItem {
            id,
            thread_id: self.thread_id.clone(),
            turn_id: self.turn_id.clone(),
            sequence,
            status,
            started_at,
            completed_at,
            updated_at: now,
            payload,
        }
    }

    fn persist_and_emit_item(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        item: AgentThreadItem,
    ) -> Result<(), String> {
        {
            let conn = lock_db(&self.db)?;
            AgentTimelineDao::upsert_item(&conn, &item)
                .map_err(|e| format!("保存 item 失败: {e}"))?;
        }

        let previous_status = self
            .item_statuses
            .insert(item.id.clone(), item.status.clone());
        let event = match (&previous_status, &item.status) {
            (None, AgentThreadItemStatus::InProgress) => {
                TauriAgentEvent::ItemStarted { item: item.clone() }
            }
            (None, _) => TauriAgentEvent::ItemCompleted { item: item.clone() },
            (_, AgentThreadItemStatus::Completed | AgentThreadItemStatus::Failed) => {
                TauriAgentEvent::ItemCompleted { item: item.clone() }
            }
            _ => TauriAgentEvent::ItemUpdated { item: item.clone() },
        };
        emit_event(app, event_name, &event);
        Ok(())
    }

    fn persist_runtime_item(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        item: AgentThreadItem,
        event: TauriAgentEvent,
    ) -> Result<(), String> {
        self.sync_runtime_item_state(&item);
        {
            let conn = lock_db(&self.db)?;
            AgentTimelineDao::upsert_item(&conn, &item)
                .map_err(|e| format!("保存 runtime item 失败: {e}"))?;
        }
        emit_event(app, event_name, &event);
        Ok(())
    }

    fn sync_runtime_item_state(&mut self, item: &AgentThreadItem) {
        self.thread_id = item.thread_id.clone();
        self.turn_id = item.turn_id.clone();
        self.sequence_counter = self.sequence_counter.max(item.sequence);
        self.item_sequences.insert(item.id.clone(), item.sequence);
        self.item_statuses
            .insert(item.id.clone(), item.status.clone());

        if let AgentThreadItemPayload::AgentMessage { text, .. } = &item.payload {
            self.plan_text = extract_proposed_plan_block(text);
        }
    }

    fn maybe_project_plan_item(
        &mut self,
        app: &AppHandle,
        event_name: &str,
        item: &AgentThreadItem,
    ) -> Result<(), String> {
        let AgentThreadItemPayload::AgentMessage { text, .. } = &item.payload else {
            return Ok(());
        };
        let Some(plan_text) = extract_proposed_plan_block(text) else {
            return Ok(());
        };
        self.plan_text = Some(plan_text.clone());
        let plan_item = self.build_item(
            format!("plan:{}", self.turn_id),
            item.status.clone(),
            item.completed_at.clone(),
            AgentThreadItemPayload::Plan { text: plan_text },
        );
        self.persist_and_emit_item(app, event_name, plan_item)?;
        Ok(())
    }
}

pub fn complete_action_item(
    db: &DbConnection,
    request_id: &str,
    response: Option<Value>,
) -> Result<(), String> {
    let conn = lock_db(db)?;
    let Some(mut item) = AgentTimelineDao::get_item(&conn, request_id)
        .map_err(|e| format!("读取 action item 失败: {e}"))?
    else {
        return Ok(());
    };

    let payload = match item.payload {
        AgentThreadItemPayload::ApprovalRequest {
            request_id,
            action_type,
            prompt,
            tool_name,
            arguments,
            ..
        } => AgentThreadItemPayload::ApprovalRequest {
            request_id,
            action_type,
            prompt,
            tool_name,
            arguments,
            response,
        },
        AgentThreadItemPayload::RequestUserInput {
            request_id,
            action_type,
            prompt,
            questions,
            ..
        } => AgentThreadItemPayload::RequestUserInput {
            request_id,
            action_type,
            prompt,
            questions,
            response,
        },
        other => other,
    };

    let now = Utc::now().to_rfc3339();
    item.status = AgentThreadItemStatus::Completed;
    item.completed_at = Some(now.clone());
    item.updated_at = now;
    item.payload = payload;

    AgentTimelineDao::upsert_item(&conn, &item).map_err(|e| format!("更新 action item 失败: {e}"))
}

pub fn build_action_response_value(
    confirmed: bool,
    response: Option<&str>,
    user_data: Option<&Value>,
) -> Option<Value> {
    if let Some(value) = user_data {
        return Some(value.clone());
    }
    if !confirmed {
        return Some(json!({ "confirmed": false }));
    }
    response.map(|value| Value::String(value.to_string()))
}
