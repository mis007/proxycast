# Lime 集成测试指南

> 测试模块间的协作和数据流

## 概述

集成测试验证多个模块协同工作的正确性，主要覆盖：
- API 服务器端点
- 凭证池管理
- Provider 与服务层交互
- 数据库操作

## 测试场景

### 1. API 服务器集成

```rust
#[cfg(test)]
mod api_integration_tests {
    use super::*;
    use axum::http::StatusCode;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_chat_completion_endpoint() {
        let app = create_test_app().await;
        
        let request = Request::builder()
            .method("POST")
            .uri("/v1/chat/completions")
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer test-key")
            .body(Body::from(r#"{
                "model": "gpt-4",
                "messages": [{"role": "user", "content": "Hello"}]
            }"#))
            .unwrap();
        
        let response = app.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_streaming_response() {
        let app = create_test_app().await;
        
        let request = Request::builder()
            .method("POST")
            .uri("/v1/chat/completions")
            .header("Content-Type", "application/json")
            .body(Body::from(r#"{
                "model": "gpt-4",
                "messages": [{"role": "user", "content": "Hello"}],
                "stream": true
            }"#))
            .unwrap();
        
        let response = app.oneshot(request).await.unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get("content-type").unwrap(),
            "text/event-stream"
        );
    }
}
```

### 2. 凭证池集成

```rust
#[cfg(test)]
mod credential_pool_tests {
    use super::*;

    #[tokio::test]
    async fn test_credential_rotation() {
        let pool = CredentialPool::new();
        
        // 添加多个凭证
        pool.add_credential(create_test_credential("cred1")).await;
        pool.add_credential(create_test_credential("cred2")).await;
        pool.add_credential(create_test_credential("cred3")).await;
        
        // 验证轮询
        let first = pool.get_next().await.unwrap();
        let second = pool.get_next().await.unwrap();
        let third = pool.get_next().await.unwrap();
        let fourth = pool.get_next().await.unwrap();
        
        // 第四次应该回到第一个
        assert_eq!(first.id, fourth.id);
    }

    #[tokio::test]
    async fn test_unhealthy_credential_skipped() {
        let pool = CredentialPool::new();
        
        let healthy = create_test_credential("healthy");
        let unhealthy = create_test_credential("unhealthy");
        
        pool.add_credential(healthy.clone()).await;
        pool.add_credential(unhealthy.clone()).await;
        
        // 标记为不健康
        pool.mark_unhealthy(&unhealthy.id).await;
        
        // 应该只返回健康的凭证
        for _ in 0..10 {
            let cred = pool.get_next().await.unwrap();
            assert_eq!(cred.id, healthy.id);
        }
    }
}
```

### 3. Provider 与数据库集成

```rust
#[cfg(test)]
mod provider_db_tests {
    use super::*;

    #[tokio::test]
    async fn test_token_persistence() {
        let db = create_test_db().await;
        let provider = KiroProvider::new(db.clone());
        
        // 刷新 Token
        let token = provider.refresh_token("test-refresh-token").await.unwrap();
        
        // 验证 Token 被保存到数据库
        let saved = db.get_token("kiro", "test-id").await.unwrap();
        assert_eq!(saved.access_token, token.access_token);
    }

    #[tokio::test]
    async fn test_credential_state_sync() {
        let db = create_test_db().await;
        let service = ProviderPoolService::new(db.clone());
        
        // 添加凭证
        service.add_credential(create_test_credential()).await.unwrap();
        
        // 验证数据库状态
        let credentials = db.list_credentials("kiro").await.unwrap();
        assert_eq!(credentials.len(), 1);
        assert_eq!(credentials[0].status, "active");
    }
}
```

## 测试环境设置

### 测试数据库

```rust
async fn create_test_db() -> Database {
    let db = Database::new(":memory:").await.unwrap();
    db.run_migrations().await.unwrap();
    db
}
```

### Mock HTTP 服务

```rust
use wiremock::{MockServer, Mock, ResponseTemplate};
use wiremock::matchers::{method, path};

async fn setup_mock_oauth_server() -> MockServer {
    let mock_server = MockServer::start().await;
    
    Mock::given(method("POST"))
        .and(path("/oauth/token"))
        .respond_with(ResponseTemplate::new(200)
            .set_body_json(json!({
                "access_token": "test-token",
                "expires_in": 3600
            })))
        .mount(&mock_server)
        .await;
    
    mock_server
}
```

## 测试数据管理

### Fixtures

```rust
fn create_test_credential(id: &str) -> Credential {
    Credential {
        id: id.to_string(),
        provider: "kiro".to_string(),
        email: "test@example.com".to_string(),
        access_token: Some("test-access-token".to_string()),
        refresh_token: Some("test-refresh-token".to_string()),
        expires_at: Some(Utc::now() + Duration::hours(1)),
        status: "active".to_string(),
    }
}

fn create_expired_credential(id: &str) -> Credential {
    let mut cred = create_test_credential(id);
    cred.expires_at = Some(Utc::now() - Duration::hours(1));
    cred
}
```

## 运行集成测试

```bash
# 运行所有集成测试
cd src-tauri && cargo test --test integration

# 运行特定测试
cargo test --test integration test_credential_rotation

# 并行运行（注意数据库隔离）
cargo test --test integration -- --test-threads=1
```

## 下一步

- [E2E 测试指南](e2e-tests.md)
- [Agent 评估指南](agent-evaluation.md)
