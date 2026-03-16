# Droid Provider 插件文档

> 版本: 1.0.0
> 仓库: `aiclientproxy/droid-provider`
> 类型: OAuth Provider Plugin

---

## 一、概述

### 1.1 插件简介

Droid Provider 是 Lime 的 Factory.ai (Droid) 插件，通过 **WorkOS OAuth** 集成 Factory.ai 平台，支持 Claude、OpenAI、Gemini 等多种模型的统一访问。

### 1.2 支持的认证方式

| 认证方式 | 说明 | 适用场景 |
|---------|------|---------|
| **WorkOS OAuth** | WorkOS OAuth 2.0 认证 | Factory.ai 标准账户 |
| **API Key** | 直接 API Key 模式 | 多 Key 池负载均衡 |
| **Manual** | 手动提供 Refresh Token | 离线授权 |

### 1.3 核心能力

| 能力 | 说明 |
|------|------|
| 多端点支持 | Anthropic、OpenAI、Comm 三种 API 格式 |
| 自动 Token 刷新 | 每 6 小时自动刷新，Token 有效期 8 小时 |
| API Key 池 | 支持多 API Key 随机选择和粘性会话 |
| 粘性会话调度 | 同一会话保持使用同一账户 |
| 账号分组调度 | 支持按分组选择账户 |
| 凭证加密存储 | AES-256-CBC 加密 + scrypt 密钥派生 |
| 订阅过期管理 | 支持账户订阅到期时间检查 |
| 代理支持 | 支持 SOCKS5/HTTP 代理 |

### 1.4 支持的模型

| 模型 | 端点类型 | 提供商 |
|------|---------|--------|
| `claude-opus-4-1-20250805` | anthropic | Anthropic |
| `claude-sonnet-4-5-20250929` | anthropic | Anthropic |
| `claude-sonnet-4-20250514` | anthropic | Anthropic |
| `gpt-5-2025-08-07` | openai | OpenAI |
| `gemini-*` | comm | Google |
| `glm-*` | comm | Fireworks |

### 1.5 Factory.ai 端点

| 端点类型 | API 路径 | 说明 |
|---------|---------|------|
| `anthropic` | `/a/v1/messages` | Anthropic Messages API |
| `openai` | `/o/v1/responses` | OpenAI Responses API |
| `comm` | `/o/v1/chat/completions` | OpenAI Chat Completions API |

---

## 二、插件架构

### 2.1 项目结构

```
droid-provider/
├── plugin/
│   ├── plugin.json              # 插件元数据
│   └── config.json              # 默认配置
│
├── src-tauri/src/               # 后端 Rust 代码
│   ├── lib.rs                   # 插件入口
│   ├── commands.rs              # Tauri 命令
│   ├── provider.rs              # DroidProvider 核心实现
│   ├── auth/
│   │   ├── mod.rs
│   │   ├── workos.rs            # WorkOS OAuth
│   │   └── api_key.rs           # API Key 模式
│   ├── credentials.rs           # 凭证管理
│   ├── token_refresh.rs         # Token 刷新
│   ├── scheduler.rs             # 账号调度
│   └── api/
│       ├── mod.rs
│       ├── relay.rs             # 请求转发
│       └── factory.rs           # Factory.ai API
│
├── src/                         # 前端 React UI
│   ├── index.tsx                # 插件 UI 入口
│   ├── components/
│   │   ├── CredentialList.tsx   # 凭证列表
│   │   ├── CredentialCard.tsx   # 凭证卡片
│   │   ├── AuthMethodTabs.tsx   # 认证方式选择
│   │   ├── OAuthForm.tsx        # OAuth 表单
│   │   ├── ApiKeyForm.tsx       # API Key 表单
│   │   ├── EndpointSelect.tsx   # 端点类型选择
│   │   └── SettingsPanel.tsx    # 插件设置
│   └── types/
│       └── index.ts             # 类型定义
│
└── .github/
    └── workflows/
        └── release.yml          # 自动构建发布
```

### 2.2 plugin.json

```json
{
  "name": "droid-provider",
  "version": "1.0.0",
  "description": "Droid Provider - Factory.ai 集成，支持 WorkOS OAuth 和 API Key 模式",
  "author": "Lime Team",
  "homepage": "https://github.com/aiclientproxy/droid-provider",
  "license": "MIT",

  "plugin_type": "oauth_provider",
  "entry": "droid-provider-cli",
  "min_lime_version": "1.0.0",

  "provider": {
    "id": "droid",
    "display_name": "Droid (Factory.ai)",
    "target_protocol": "anthropic",
    "supported_models": ["claude-*", "gpt-*", "gemini-*", "glm-*"],
    "auth_types": ["workos_oauth", "api_key", "manual"],
    "endpoint_types": ["anthropic", "openai", "comm"],
    "credential_schemas": {
      "workos_oauth": {
        "type": "object",
        "properties": {
          "access_token": { "type": "string" },
          "refresh_token": { "type": "string" },
          "organization_id": { "type": "string" },
          "expires_at": { "type": "string" },
          "user_id": { "type": "string" },
          "owner_email": { "type": "string" }
        },
        "required": ["access_token", "refresh_token"]
      },
      "api_key": {
        "type": "object",
        "properties": {
          "api_keys": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["api_keys"]
      },
      "manual": {
        "type": "object",
        "properties": {
          "refresh_token": { "type": "string" }
        },
        "required": ["refresh_token"]
      }
    }
  },

  "binary": {
    "binary_name": "droid-provider-cli",
    "github_owner": "aiclientproxy",
    "github_repo": "droid-provider",
    "platform_binaries": {
      "macos-arm64": "droid-provider-aarch64-apple-darwin",
      "macos-x64": "droid-provider-x86_64-apple-darwin",
      "linux-x64": "droid-provider-x86_64-unknown-linux-gnu",
      "windows-x64": "droid-provider-x86_64-pc-windows-msvc.exe"
    },
    "checksum_file": "checksums.txt"
  },

  "ui": {
    "surfaces": ["oauth_providers"],
    "icon": "Bot",
    "title": "Droid Provider",
    "entry": "dist/index.js",
    "styles": "dist/styles.css",
    "default_width": 950,
    "default_height": 750,
    "permissions": [
      "database:read",
      "database:write",
      "http:request",
      "crypto:encrypt",
      "shell:open"
    ]
  }
}
```

### 2.3 config.json

```json
{
  "enabled": true,
  "timeout_ms": 600000,
  "settings": {
    "workos": {
      "client_id": "client_01HNM792M5G5G1A2THWPXKFMXB",
      "auth_url": "https://api.workos.com/user_management/authenticate"
    },
    "factory": {
      "api_base_url": "https://api.factory.ai/api/llm",
      "app_base_url": "https://app.factory.ai",
      "endpoints": {
        "anthropic": "/a/v1/messages",
        "openai": "/o/v1/responses",
        "comm": "/o/v1/chat/completions"
      }
    },
    "token_refresh": {
      "auto_refresh": true,
      "refresh_interval_hours": 6,
      "token_valid_hours": 8,
      "max_retry": 3,
      "retry_delay_ms": 1000
    },
    "api_key": {
      "strategy": "random_sticky",
      "sticky_ttl_seconds": 3600
    },
    "encryption": {
      "algorithm": "aes-256-cbc",
      "salt": "droid-account-salt",
      "key_derivation": "scrypt"
    },
    "request": {
      "user_agent": "factory-cli/0.32.1",
      "system_prompt": "You are Droid, an AI software engineering agent built by Factory."
    }
  }
}
```

---

## 三、认证方式详解

### 3.1 WorkOS OAuth 认证

#### WorkOS OAuth 配置

```rust
const WORKOS_CLIENT_ID: &str = "client_01HNM792M5G5G1A2THWPXKFMXB";
const WORKOS_TOKEN_URL: &str = "https://api.workos.com/user_management/authenticate";
const FACTORY_ORG_API: &str = "https://app.factory.ai/api/cli/org";
```

#### Token 刷新实现

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct RefreshTokenRequest {
    grant_type: String,
    refresh_token: String,
    client_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    organization_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WorkOSTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<i64>,
    expires_at: Option<String>,
    token_type: String,
    user: Option<WorkOSUser>,
    organization_id: Option<String>,
    authentication_method: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WorkOSUser {
    id: String,
    email: String,
    first_name: Option<String>,
    last_name: Option<String>,
    #[serde(rename = "display_name")]
    display_name: Option<String>,
}

/// 使用 WorkOS Refresh Token 刷新凭证
pub async fn refresh_tokens_with_workos(
    refresh_token: &str,
    organization_id: Option<&str>,
    proxy_config: Option<&ProxyConfig>,
) -> Result<WorkOSTokenResponse> {
    let client = build_http_client(proxy_config)?;

    let form = RefreshTokenRequest {
        grant_type: "refresh_token".to_string(),
        refresh_token: refresh_token.to_string(),
        client_id: WORKOS_CLIENT_ID.to_string(),
        organization_id: organization_id.map(|s| s.to_string()),
    };

    let response = client
        .post(WORKOS_TOKEN_URL)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form)
        .timeout(Duration::from_secs(30))
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;
        return Err(Error::WorkOSAuthFailed(error_text));
    }

    let token_response: WorkOSTokenResponse = response.json().await?;

    if token_response.access_token.is_empty() {
        return Err(Error::InvalidTokenResponse);
    }

    Ok(token_response)
}

/// 获取 Factory 组织 ID 列表
pub async fn fetch_factory_org_ids(
    access_token: &str,
    proxy_config: Option<&ProxyConfig>,
) -> Result<Vec<String>> {
    let client = build_http_client(proxy_config)?;

    let response = client
        .get(FACTORY_ORG_API)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("x-factory-client", "cli")
        .timeout(Duration::from_secs(15))
        .send()
        .await?;

    if !response.status().is_success() {
        return Ok(vec![]);
    }

    #[derive(Deserialize)]
    struct OrgResponse {
        #[serde(rename = "workosOrgIds")]
        workos_org_ids: Option<Vec<String>>,
    }

    let org_response: OrgResponse = response.json().await?;

    Ok(org_response.workos_org_ids.unwrap_or_default())
}
```

### 3.2 API Key 模式

```rust
use uuid::Uuid;
use sha2::{Sha256, Digest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeyEntry {
    pub id: String,
    pub hash: String,
    pub encrypted_key: String,
    pub created_at: String,
    pub last_used_at: String,
    pub usage_count: u64,
    pub status: ApiKeyStatus,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ApiKeyStatus {
    Active,
    Error,
}

impl DroidProvider {
    /// 构建 API Key 条目列表
    pub fn build_api_key_entries(
        &self,
        api_keys: &[String],
        existing_entries: &[ApiKeyEntry],
        clear_existing: bool,
    ) -> Vec<ApiKeyEntry> {
        let now = Utc::now().to_rfc3339();

        let mut entries = if clear_existing {
            vec![]
        } else {
            existing_entries
                .iter()
                .filter(|e| !e.id.is_empty() && !e.encrypted_key.is_empty())
                .cloned()
                .collect()
        };

        let existing_hashes: HashSet<_> = entries
            .iter()
            .filter_map(|e| Some(e.hash.clone()))
            .collect();

        for raw_key in api_keys {
            let trimmed = raw_key.trim();
            if trimmed.is_empty() {
                continue;
            }

            // 计算 SHA256 哈希用于去重
            let mut hasher = Sha256::new();
            hasher.update(trimmed.as_bytes());
            let hash = format!("{:x}", hasher.finalize());

            if existing_hashes.contains(&hash) {
                continue;
            }

            entries.push(ApiKeyEntry {
                id: Uuid::new_v4().to_string(),
                hash,
                encrypted_key: self.encrypt_sensitive_data(trimmed)?,
                created_at: now.clone(),
                last_used_at: String::new(),
                usage_count: 0,
                status: ApiKeyStatus::Active,
                error_message: None,
            });
        }

        entries
    }

    /// 选择一个可用的 API Key（随机 + 粘性会话）
    pub async fn select_api_key(
        &self,
        account_id: &str,
        endpoint_type: &str,
        session_hash: Option<&str>,
    ) -> Result<ApiKeyEntry> {
        let entries = self.get_decrypted_api_key_entries(account_id).await?;

        if entries.is_empty() {
            return Err(Error::NoApiKeyConfigured);
        }

        // 过滤掉异常状态的 API Key
        let active_entries: Vec<_> = entries
            .into_iter()
            .filter(|e| matches!(e.status, ApiKeyStatus::Active))
            .collect();

        if active_entries.is_empty() {
            return Err(Error::AllApiKeysInError);
        }

        // 检查粘性会话映射
        if let Some(hash) = session_hash {
            let sticky_key = self.compose_sticky_key(account_id, endpoint_type, hash);

            if let Some(mapped_key_id) = self.get_session_mapping(&sticky_key).await? {
                if let Some(entry) = active_entries.iter().find(|e| e.id == mapped_key_id) {
                    self.extend_session_mapping_ttl(&sticky_key).await?;
                    self.touch_api_key_usage(account_id, &entry.id).await?;
                    return Ok(entry.clone());
                }
                // 映射的 Key 不可用，清除映射
                self.delete_session_mapping(&sticky_key).await?;
            }
        }

        // 随机选择一个可用的 API Key
        let selected = active_entries
            .choose(&mut rand::thread_rng())
            .ok_or(Error::NoApiKeyAvailable)?;

        // 建立粘性会话映射
        if let Some(hash) = session_hash {
            let sticky_key = self.compose_sticky_key(account_id, endpoint_type, hash);
            self.set_session_mapping(&sticky_key, &selected.id).await?;
        }

        self.touch_api_key_usage(account_id, &selected.id).await?;

        Ok(selected.clone())
    }

    /// 标记 API Key 为异常状态
    pub async fn mark_api_key_as_error(
        &self,
        account_id: &str,
        key_id: &str,
        error_message: &str,
    ) -> Result<()> {
        let mut account = self.get_account(account_id).await?;

        for entry in &mut account.api_key_entries {
            if entry.id == key_id {
                entry.status = ApiKeyStatus::Error;
                entry.error_message = Some(error_message.to_string());
                break;
            }
        }

        self.save_account(&account).await?;

        log::warn!(
            "⚠️ 已标记 Droid API Key {} 为异常状态（Account: {}）：{}",
            key_id, account_id, error_message
        );

        Ok(())
    }
}
```

### 3.3 手动模式（Manual Provision）

```rust
/// 手动提供 Refresh Token
pub async fn create_manual_account(
    name: &str,
    refresh_token: &str,
    proxy_config: Option<&ProxyConfig>,
) -> Result<DroidAccount> {
    // 使用 Refresh Token 刷新获取 Access Token
    let token_response = refresh_tokens_with_workos(
        refresh_token,
        None,
        proxy_config,
    ).await?;

    let now = Utc::now();
    let expires_at = if let Some(expires_in) = token_response.expires_in {
        now + Duration::seconds(expires_in)
    } else {
        now + Duration::hours(8) // 默认 8 小时
    };

    let mut account = DroidAccount {
        id: Uuid::new_v4().to_string(),
        name: name.to_string(),
        access_token: token_response.access_token,
        refresh_token: token_response.refresh_token
            .unwrap_or_else(|| refresh_token.to_string()),
        expires_at: Some(expires_at),
        organization_id: token_response.organization_id,
        authentication_method: "manual".to_string(),
        status: AccountStatus::Active,
        ..Default::default()
    };

    // 提取用户信息
    if let Some(user) = token_response.user {
        account.owner_email = Some(user.email.clone());
        account.owner_name = user.display_name
            .or_else(|| {
                let parts: Vec<_> = [user.first_name, user.last_name]
                    .into_iter()
                    .flatten()
                    .collect();
                if parts.is_empty() { None } else { Some(parts.join(" ")) }
            });
        account.user_id = Some(user.id);
    }

    Ok(account)
}
```

---

## 四、Token 刷新机制

### 4.1 自动刷新逻辑

```rust
impl DroidProvider {
    /// Token 刷新间隔（6 小时）
    const REFRESH_INTERVAL_HOURS: i64 = 6;

    /// Token 有效期（8 小时）
    const TOKEN_VALID_HOURS: i64 = 8;

    /// 检查 Token 是否需要刷新
    pub fn should_refresh_token(&self, account: &DroidAccount) -> bool {
        // API Key 模式不需要刷新
        if account.authentication_method == "api_key" {
            return false;
        }

        // 从未刷新过
        let last_refresh = match &account.last_refresh_at {
            Some(t) => t,
            None => return true,
        };

        let last_refresh_time = DateTime::parse_from_rfc3339(last_refresh)
            .map(|t| t.with_timezone(&Utc))
            .unwrap_or(Utc::now() - Duration::hours(Self::REFRESH_INTERVAL_HOURS + 1));

        let hours_since_refresh = (Utc::now() - last_refresh_time).num_hours();

        hours_since_refresh >= Self::REFRESH_INTERVAL_HOURS
    }

    /// 刷新 Token（带重试）
    pub async fn refresh_access_token(
        &self,
        account_id: &str,
        proxy_config: Option<&ProxyConfig>,
    ) -> Result<TokenRefreshResult> {
        let mut account = self.get_account(account_id).await?;

        let refresh_token = account.refresh_token.as_ref()
            .ok_or(Error::MissingRefreshToken)?;

        log::info!("🔄 Refreshing Droid account token: {} ({})", account.name, account_id);

        let mut last_error = None;
        const MAX_RETRIES: u32 = 3;

        for attempt in 0..MAX_RETRIES {
            match refresh_tokens_with_workos(
                refresh_token,
                account.organization_id.as_deref(),
                proxy_config,
            ).await {
                Ok(response) => {
                    // 更新账户信息
                    account.access_token = response.access_token.clone();
                    if let Some(new_refresh) = response.refresh_token {
                        account.refresh_token = Some(new_refresh);
                    }

                    let expires_at = if let Some(expires_in) = response.expires_in {
                        Utc::now() + Duration::seconds(expires_in)
                    } else {
                        Utc::now() + Duration::hours(Self::TOKEN_VALID_HOURS)
                    };
                    account.expires_at = Some(expires_at);
                    account.last_refresh_at = Some(Utc::now().to_rfc3339());
                    account.status = AccountStatus::Active;
                    account.error_message = None;

                    // 更新用户信息
                    if let Some(user) = response.user {
                        account.owner_email = Some(user.email);
                        if let Some(name) = user.display_name
                            .or_else(|| {
                                let parts: Vec<_> = [user.first_name, user.last_name]
                                    .into_iter()
                                    .flatten()
                                    .collect();
                                if parts.is_empty() { None } else { Some(parts.join(" ")) }
                            }) {
                            account.owner_name = Some(name);
                        }
                        account.user_id = Some(user.id);
                    }

                    if let Some(org_id) = response.organization_id {
                        account.organization_id = Some(org_id);
                    }

                    self.save_account(&account).await?;

                    log::info!("✅ Droid account token refreshed successfully: {}", account_id);

                    return Ok(TokenRefreshResult {
                        access_token: response.access_token,
                        refresh_token: account.refresh_token.clone(),
                        expires_at,
                    });
                }
                Err(e) => {
                    last_error = Some(e);
                    // 指数退避
                    let delay = Duration::milliseconds(1000 * 2_i64.pow(attempt));
                    tokio::time::sleep(delay.to_std().unwrap()).await;
                }
            }
        }

        // 所有重试失败，更新账户状态
        account.status = AccountStatus::Error;
        account.error_message = last_error.as_ref().map(|e| e.to_string());
        self.save_account(&account).await?;

        Err(last_error.unwrap())
    }

    /// 获取有效的 Access Token（自动刷新）
    pub async fn get_valid_access_token(&self, account_id: &str) -> Result<String> {
        let account = self.get_account(account_id).await?;

        // API Key 模式抛出错误
        if account.authentication_method == "api_key" {
            return Err(Error::ApiKeyModeNoAccessToken);
        }

        // 检查是否需要刷新
        if self.should_refresh_token(&account) {
            log::info!("🔄 Droid account token needs refresh: {}", account_id);
            let proxy_config = account.proxy.as_ref();
            self.refresh_access_token(account_id, proxy_config).await?;
        }

        let account = self.get_account(account_id).await?;

        account.access_token.ok_or(Error::NoValidAccessToken)
    }
}
```

---

## 五、账号调度机制

### 5.1 调度器实现

```rust
pub struct DroidScheduler {
    sticky_prefix: String,
}

impl DroidScheduler {
    pub fn new() -> Self {
        Self {
            sticky_prefix: "droid".to_string(),
        }
    }

    /// 检查账户是否活跃
    fn is_account_active(&self, account: &DroidAccount) -> bool {
        if !account.is_active {
            return false;
        }

        let unhealthy_statuses = ["error", "unauthorized", "blocked"];
        let status = account.status.to_string().to_lowercase();

        !unhealthy_statuses.contains(&status.as_str())
    }

    /// 检查账户是否可调度
    fn is_account_schedulable(&self, account: &DroidAccount) -> bool {
        account.schedulable.unwrap_or(true)
    }

    /// 检查订阅是否过期
    fn is_subscription_expired(&self, account: &DroidAccount) -> bool {
        match &account.subscription_expires_at {
            Some(expires_at) => {
                let expiry = DateTime::parse_from_rfc3339(expires_at)
                    .map(|t| t.with_timezone(&Utc))
                    .unwrap_or(Utc::now() + Duration::days(365));
                expiry <= Utc::now()
            }
            None => false, // 未设置视为永不过期
        }
    }

    /// 检查端点类型匹配
    fn matches_endpoint(&self, account: &DroidAccount, endpoint_type: &str) -> bool {
        let account_endpoint = account.endpoint_type.as_deref().unwrap_or("anthropic");

        if account_endpoint == endpoint_type {
            return true;
        }

        // comm 端点可以使用任何类型的账户
        if endpoint_type == "comm" {
            return true;
        }

        // anthropic 和 openai 可以互换
        let shared_endpoints = ["anthropic", "openai"];
        shared_endpoints.contains(&endpoint_type) && shared_endpoints.contains(&account_endpoint)
    }

    /// 排序候选账户
    fn sort_candidates(&self, mut candidates: Vec<DroidAccount>) -> Vec<DroidAccount> {
        candidates.sort_by(|a, b| {
            // 1. 按优先级排序（低优先级优先）
            let priority_a = a.priority.unwrap_or(50);
            let priority_b = b.priority.unwrap_or(50);

            if priority_a != priority_b {
                return priority_a.cmp(&priority_b);
            }

            // 2. 按最后使用时间排序（最久未使用优先）
            let last_used_a = a.last_used_at.as_ref()
                .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                .map(|t| t.timestamp())
                .unwrap_or(0);
            let last_used_b = b.last_used_at.as_ref()
                .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                .map(|t| t.timestamp())
                .unwrap_or(0);

            if last_used_a != last_used_b {
                return last_used_a.cmp(&last_used_b);
            }

            // 3. 按创建时间排序
            let created_a = a.created_at.as_ref()
                .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                .map(|t| t.timestamp())
                .unwrap_or(0);
            let created_b = b.created_at.as_ref()
                .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                .map(|t| t.timestamp())
                .unwrap_or(0);

            created_a.cmp(&created_b)
        });

        candidates
    }

    /// 选择一个可用账户
    pub async fn select_account(
        &self,
        api_key_data: Option<&ApiKeyData>,
        endpoint_type: &str,
        session_hash: Option<&str>,
    ) -> Result<DroidAccount> {
        let mut candidates = vec![];
        let mut is_dedicated_binding = false;

        // 检查 API Key 绑定
        if let Some(api_key) = api_key_data {
            if let Some(binding) = &api_key.droid_account_id {
                if binding.starts_with("group:") {
                    // 分组调度
                    let group_id = &binding[6..];
                    candidates = self.load_group_accounts(group_id).await?;
                } else {
                    // 专用账户绑定
                    if let Ok(account) = self.get_account(binding).await {
                        candidates = vec![account];
                        is_dedicated_binding = true;
                    }
                }
            }
        }

        // 无绑定时获取所有可调度账户
        if candidates.is_empty() {
            candidates = self.get_schedulable_accounts(endpoint_type).await?;
        }

        // 过滤有效账户
        let filtered: Vec<_> = candidates
            .into_iter()
            .filter(|a| {
                self.is_account_active(a) &&
                self.is_account_schedulable(a) &&
                !self.is_subscription_expired(a) &&
                self.matches_endpoint(a, endpoint_type)
            })
            .collect();

        if filtered.is_empty() {
            return Err(Error::NoAvailableAccount {
                endpoint_type: endpoint_type.to_string(),
            });
        }

        // 检查粘性会话
        if let Some(hash) = session_hash {
            if !is_dedicated_binding {
                let sticky_key = self.compose_sticky_key(endpoint_type, hash, api_key_data);

                if let Some(mapped_id) = self.get_session_mapping(&sticky_key).await? {
                    if let Some(account) = filtered.iter().find(|a| a.id == mapped_id) {
                        self.extend_session_mapping_ttl(&sticky_key).await?;
                        self.touch_last_used(account).await?;
                        return Ok(account.clone());
                    }
                    // 映射的账户不可用，清除映射
                    self.delete_session_mapping(&sticky_key).await?;
                }
            }
        }

        // 排序并选择
        let sorted = self.sort_candidates(filtered);
        let selected = sorted.first().ok_or(Error::NoSchedulableAccount)?;

        // 建立粘性会话映射
        if let Some(hash) = session_hash {
            if !is_dedicated_binding {
                let sticky_key = self.compose_sticky_key(endpoint_type, hash, api_key_data);
                self.set_session_mapping(&sticky_key, &selected.id).await?;
            }
        }

        self.touch_last_used(selected).await?;

        log::info!(
            "🤖 选择 Droid 账号 {}（endpoint: {}, priority: {}）",
            selected.name.as_deref().unwrap_or(&selected.id),
            endpoint_type,
            selected.priority.unwrap_or(50)
        );

        Ok(selected.clone())
    }

    /// 构建粘性会话 Key
    fn compose_sticky_key(
        &self,
        endpoint_type: &str,
        session_hash: &str,
        api_key_data: Option<&ApiKeyData>,
    ) -> String {
        let api_key_part = api_key_data
            .map(|k| k.id.as_str())
            .unwrap_or("default");

        format!("{}:{}:{}:{}", self.sticky_prefix, endpoint_type, api_key_part, session_hash)
    }
}
```

---

## 六、请求转发服务

### 6.1 RelayService 实现

```rust
const FACTORY_API_BASE_URL: &str = "https://api.factory.ai/api/llm";
const SYSTEM_PROMPT: &str = "You are Droid, an AI software engineering agent built by Factory.";

pub struct DroidRelayService {
    factory_api_base_url: String,
    user_agent: String,
    system_prompt: String,
    endpoints: HashMap<String, String>,
}

impl DroidRelayService {
    pub fn new() -> Self {
        let mut endpoints = HashMap::new();
        endpoints.insert("anthropic".to_string(), "/a/v1/messages".to_string());
        endpoints.insert("openai".to_string(), "/o/v1/responses".to_string());
        endpoints.insert("comm".to_string(), "/o/v1/chat/completions".to_string());

        Self {
            factory_api_base_url: FACTORY_API_BASE_URL.to_string(),
            user_agent: "factory-cli/0.32.1".to_string(),
            system_prompt: SYSTEM_PROMPT.to_string(),
            endpoints,
        }
    }

    /// 构建请求头
    fn build_headers(
        &self,
        access_token: &str,
        endpoint_type: &str,
        request_body: &Value,
        account: &DroidAccount,
    ) -> HeaderMap {
        let mut headers = HeaderMap::new();

        // 基础头
        headers.insert("Content-Type", "application/json".parse().unwrap());
        headers.insert("Authorization", format!("Bearer {}", access_token).parse().unwrap());
        headers.insert("User-Agent", account.user_agent.as_deref()
            .unwrap_or(&self.user_agent).parse().unwrap());
        headers.insert("x-factory-client", "cli".parse().unwrap());
        headers.insert("Connection", "keep-alive".parse().unwrap());

        // Anthropic 特定头
        if endpoint_type == "anthropic" {
            headers.insert("Accept", "application/json".parse().unwrap());
            headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
            headers.insert("x-api-key", "placeholder".parse().unwrap());
            headers.insert("x-api-provider", "anthropic".parse().unwrap());

            // 推理模式
            if self.is_thinking_requested(request_body) {
                headers.insert("anthropic-beta", "interleaved-thinking-2025-05-14".parse().unwrap());
            }
        }

        // OpenAI 特定头
        if endpoint_type == "openai" {
            let model = request_body.get("model")
                .and_then(|m| m.as_str())
                .unwrap_or("");

            // -max 模型使用 openai provider，其他使用 azure_openai
            let provider = if model.to_lowercase().contains("-max") {
                "openai"
            } else {
                "azure_openai"
            };
            headers.insert("x-api-provider", provider.parse().unwrap());
        }

        // Comm 端点根据模型动态设置 provider
        if endpoint_type == "comm" {
            let model = request_body.get("model")
                .and_then(|m| m.as_str())
                .unwrap_or("");
            let provider = self.infer_provider_from_model(model);
            headers.insert("x-api-provider", provider.parse().unwrap());
        }

        headers
    }

    /// 根据模型推断 API Provider
    fn infer_provider_from_model(&self, model: &str) -> &'static str {
        let lower_model = model.to_lowercase();

        if lower_model.starts_with("gemini-") || lower_model.contains("gemini") {
            return "google";
        }
        if lower_model.starts_with("claude-") || lower_model.contains("claude") {
            return "anthropic";
        }
        if lower_model.starts_with("gpt-") || lower_model.contains("gpt") {
            return "azure_openai";
        }
        if lower_model.starts_with("glm-") || lower_model.contains("glm") {
            return "fireworks";
        }

        "baseten"
    }

    /// 处理请求体（注入 system prompt）
    fn process_request_body(
        &self,
        mut body: Value,
        endpoint_type: &str,
        stream_requested: bool,
    ) -> Value {
        // 删除 metadata 字段
        body.as_object_mut().map(|obj| obj.remove("metadata"));

        // 设置 stream 字段
        if stream_requested {
            body["stream"] = json!(true);
        } else if body.get("stream").is_some() {
            body["stream"] = json!(false);
        }

        // Anthropic 端点：注入系统提示
        if endpoint_type == "anthropic" && !self.system_prompt.is_empty() {
            let prompt_block = json!({ "type": "text", "text": self.system_prompt });

            if let Some(system) = body.get_mut("system") {
                if let Some(arr) = system.as_array_mut() {
                    // 检查是否已存在
                    let has_prompt = arr.iter().any(|item| {
                        item.get("type").and_then(|t| t.as_str()) == Some("text") &&
                        item.get("text").and_then(|t| t.as_str()) == Some(&self.system_prompt)
                    });
                    if !has_prompt {
                        arr.insert(0, prompt_block);
                    }
                }
            } else {
                body["system"] = json!([prompt_block]);
            }
        }

        // OpenAI 端点：前置系统提示到 instructions
        if endpoint_type == "openai" && !self.system_prompt.is_empty() {
            if let Some(instructions) = body.get_mut("instructions") {
                if let Some(inst_str) = instructions.as_str() {
                    if !inst_str.starts_with(&self.system_prompt) {
                        body["instructions"] = json!(format!("{}{}", self.system_prompt, inst_str));
                    }
                }
            } else {
                body["instructions"] = json!(self.system_prompt);
            }
        }

        // Comm 端点：在 messages 前注入 system 消息
        if endpoint_type == "comm" && !self.system_prompt.is_empty() {
            if let Some(messages) = body.get_mut("messages") {
                if let Some(arr) = messages.as_array_mut() {
                    let has_system = arr.iter().any(|m| {
                        m.get("role").and_then(|r| r.as_str()) == Some("system")
                    });

                    if !has_system {
                        arr.insert(0, json!({
                            "role": "system",
                            "content": self.system_prompt
                        }));
                    }
                }
            }
        }

        // 处理 temperature 和 top_p 冲突
        if body.get("temperature").is_some() && body.get("top_p").is_some() {
            body.as_object_mut().map(|obj| obj.remove("top_p"));
        }

        body
    }

    /// 模型名称映射
    fn normalize_request_body(&self, mut body: Value, endpoint_type: &str) -> Value {
        if let Some(model) = body.get("model").and_then(|m| m.as_str()) {
            let model_lower = model.to_lowercase();

            // Anthropic 端点：haiku 映射为 sonnet
            if endpoint_type == "anthropic" && model_lower.contains("haiku") {
                body["model"] = json!("claude-sonnet-4-20250514");
                log::info!("🔄 将请求模型从 {} 映射为 claude-sonnet-4-20250514", model);
            }

            // OpenAI 端点：gpt-5 映射为具体版本
            if endpoint_type == "openai" && model_lower == "gpt-5" {
                body["model"] = json!("gpt-5-2025-08-07");
                log::info!("🔄 将请求模型从 {} 映射为 gpt-5-2025-08-07", model);
            }
        }

        body
    }

    /// 转发请求
    pub async fn relay_request(
        &self,
        request_body: Value,
        api_key_data: Option<&ApiKeyData>,
        endpoint_type: &str,
        session_hash: Option<&str>,
    ) -> Result<RelayResponse> {
        let normalized_body = self.normalize_request_body(request_body.clone(), endpoint_type);

        // 选择账户
        let scheduler = DroidScheduler::new();
        let account = scheduler.select_account(
            api_key_data,
            endpoint_type,
            session_hash,
        ).await?;

        // 获取认证凭据
        let access_token = if account.authentication_method == "api_key" {
            let api_key = self.select_api_key(&account, endpoint_type, session_hash).await?;
            api_key.key
        } else {
            self.get_valid_access_token(&account.id).await?
        };

        // 构建 API URL
        let endpoint_path = self.endpoints.get(endpoint_type)
            .ok_or(Error::InvalidEndpointType)?;
        let api_url = format!("{}{}", self.factory_api_base_url, endpoint_path);

        // 构建请求头
        let headers = self.build_headers(&access_token, endpoint_type, &normalized_body, &account);

        // 处理请求体
        let stream_requested = normalized_body.get("stream")
            .and_then(|s| s.as_bool())
            .unwrap_or(false);
        let processed_body = self.process_request_body(normalized_body, endpoint_type, stream_requested);

        // 获取代理配置
        let proxy_config = account.proxy.as_ref();

        // 发送请求
        if stream_requested {
            self.handle_stream_request(api_url, headers, processed_body, proxy_config).await
        } else {
            self.handle_non_stream_request(api_url, headers, processed_body, proxy_config).await
        }
    }
}
```

---

## 七、SSE 响应解析

### 7.1 Anthropic SSE 解析

```rust
/// 从 SSE 流中解析 Anthropic usage 数据
fn parse_anthropic_usage_from_sse(chunk: &str, current_usage: &mut UsageData) {
    for line in chunk.lines() {
        if !line.starts_with("data: ") || line.len() <= 6 {
            continue;
        }

        let json_str = &line[6..];
        if let Ok(data) = serde_json::from_str::<Value>(json_str) {
            // message_start 包含 input tokens 和 cache tokens
            if data.get("type").and_then(|t| t.as_str()) == Some("message_start") {
                if let Some(usage) = data.get("message").and_then(|m| m.get("usage")) {
                    current_usage.input_tokens = usage.get("input_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    current_usage.cache_creation_input_tokens = usage
                        .get("cache_creation_input_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    current_usage.cache_read_input_tokens = usage
                        .get("cache_read_input_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);

                    // 详细的缓存类型
                    if let Some(cache_creation) = usage.get("cache_creation") {
                        current_usage.ephemeral_5m_input_tokens = cache_creation
                            .get("ephemeral_5m_input_tokens")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(0);
                        current_usage.ephemeral_1h_input_tokens = cache_creation
                            .get("ephemeral_1h_input_tokens")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(0);
                    }
                }
            }

            // message_delta 包含 output tokens
            if data.get("type").and_then(|t| t.as_str()) == Some("message_delta") {
                if let Some(usage) = data.get("usage") {
                    current_usage.output_tokens = usage.get("output_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                }
            }
        }
    }
}
```

### 7.2 OpenAI SSE 解析

```rust
/// 从 SSE 流中解析 OpenAI usage 数据
fn parse_openai_usage_from_sse(chunk: &str, current_usage: &mut UsageData) {
    for line in chunk.lines() {
        if !line.starts_with("data: ") || line.len() <= 6 {
            continue;
        }

        let json_str = &line[6..];
        if json_str == "[DONE]" {
            continue;
        }

        if let Ok(data) = serde_json::from_str::<Value>(json_str) {
            // 传统 Chat Completions usage 字段
            if let Some(usage) = data.get("usage") {
                current_usage.input_tokens = usage.get("prompt_tokens")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);
                current_usage.output_tokens = usage.get("completion_tokens")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);
                current_usage.total_tokens = usage.get("total_tokens")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);

                // 缓存 tokens
                if let Some(details) = usage.get("input_tokens_details") {
                    current_usage.cache_read_input_tokens = details
                        .get("cached_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                }
            }

            // 新 Response API 在 response.usage 中返回统计
            if let Some(response) = data.get("response") {
                if let Some(usage) = response.get("usage") {
                    current_usage.input_tokens = usage.get("input_tokens")
                        .or_else(|| usage.get("prompt_tokens"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    current_usage.output_tokens = usage.get("output_tokens")
                        .or_else(|| usage.get("completion_tokens"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    current_usage.total_tokens = usage.get("total_tokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                }
            }
        }
    }
}

/// 检测流式响应完成标记
fn detect_stream_completion(window: &str, endpoint_type: &str) -> bool {
    let lower = window.to_lowercase();
    let compact = lower.replace(char::is_whitespace, "");

    match endpoint_type {
        "anthropic" => {
            lower.contains("event: message_stop") ||
            compact.contains("\"type\":\"message_stop\"")
        }
        "openai" | "comm" => {
            lower.contains("data: [done]") ||
            compact.contains("\"finish_reason\"") ||
            lower.contains("event: response.done") ||
            lower.contains("event: response.completed") ||
            compact.contains("\"type\":\"response.done\"") ||
            compact.contains("\"type\":\"response.completed\"")
        }
        _ => false,
    }
}
```

---

## 八、凭证加密

### 8.1 加密实现

```rust
use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use scrypt::{scrypt, Params};

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

const ENCRYPTION_ALGORITHM: &str = "aes-256-cbc";
const ENCRYPTION_SALT: &[u8] = b"droid-account-salt";

impl DroidProvider {
    /// 派生加密密钥（使用 scrypt）
    fn derive_encryption_key(&self, master_key: &str) -> [u8; 32] {
        // 缓存派生的密钥以提高性能
        if let Some(cached) = self.encryption_key_cache.get() {
            return *cached;
        }

        let params = Params::new(15, 8, 1).unwrap();
        let mut key = [0u8; 32];
        scrypt(master_key.as_bytes(), ENCRYPTION_SALT, &params, &mut key).unwrap();

        self.encryption_key_cache.set(key);
        key
    }

    /// 加密敏感数据
    pub fn encrypt_sensitive_data(&self, plaintext: &str) -> Result<String> {
        if plaintext.is_empty() {
            return Ok(String::new());
        }

        let key = self.derive_encryption_key(&self.config.encryption_key);
        let iv: [u8; 16] = rand::random();

        let cipher = Aes256Cbc::new_from_slices(&key, &iv)?;
        let ciphertext = cipher.encrypt_vec(plaintext.as_bytes());

        // 格式：iv_hex:ciphertext_hex
        Ok(format!("{}:{}", hex::encode(iv), hex::encode(ciphertext)))
    }

    /// 解密敏感数据（带 LRU 缓存）
    pub fn decrypt_sensitive_data(&self, encrypted: &str) -> Result<String> {
        if encrypted.is_empty() {
            return Ok(String::new());
        }

        // 检查缓存
        let cache_key = {
            let mut hasher = Sha256::new();
            hasher.update(encrypted.as_bytes());
            format!("{:x}", hasher.finalize())
        };

        if let Some(cached) = self.decrypt_cache.get(&cache_key) {
            return Ok(cached.clone());
        }

        let key = self.derive_encryption_key(&self.config.encryption_key);

        let parts: Vec<&str> = encrypted.split(':').collect();
        if parts.len() != 2 {
            return Err(Error::InvalidEncryptedFormat);
        }

        let iv = hex::decode(parts[0])?;
        let ciphertext = hex::decode(parts[1])?;

        let cipher = Aes256Cbc::new_from_slices(&key, &iv)?;
        let plaintext = cipher.decrypt_vec(&ciphertext)?;
        let result = String::from_utf8(plaintext)?;

        // 存入缓存（5 分钟过期）
        self.decrypt_cache.insert(cache_key, result.clone(), Duration::minutes(5));

        Ok(result)
    }
}
```

---

## 九、错误处理

### 9.1 4xx 错误处理

```rust
impl DroidRelayService {
    /// 处理上游 4xx 响应
    async fn handle_upstream_client_error(
        &self,
        status_code: u16,
        context: ErrorContext,
    ) -> Result<()> {
        if status_code < 400 || status_code >= 500 {
            return Ok(());
        }

        let account_id = context.account.as_ref()
            .map(|a| a.id.as_str())
            .ok_or(Error::MissingAccountInfo)?;

        // API Key 模式：标记 Key 为异常
        if context.account.as_ref()
            .map(|a| a.authentication_method == "api_key")
            .unwrap_or(false)
        {
            if let Some(api_key) = &context.selected_api_key {
                self.mark_api_key_as_error(
                    account_id,
                    &api_key.id,
                    &format!("{}", status_code),
                ).await?;

                // 清理粘性会话映射
                self.clear_api_key_sticky_mapping(
                    account_id,
                    &context.endpoint_type,
                    context.session_hash.as_deref(),
                ).await?;

                // 检查是否还有可用的 API Key
                let entries = self.get_decrypted_api_key_entries(account_id).await?;
                let active_entries: Vec<_> = entries
                    .into_iter()
                    .filter(|e| matches!(e.status, ApiKeyStatus::Active))
                    .collect();

                if active_entries.is_empty() {
                    self.stop_account_scheduling(
                        account_id,
                        status_code,
                        "所有 API Key 均已异常",
                    ).await?;
                }

                return Ok(());
            }
        }

        // OAuth 模式：停止账号调度
        self.stop_account_scheduling(account_id, status_code, "凭证不可用").await?;
        self.clear_account_sticky_mapping(
            &context.endpoint_type,
            context.session_hash.as_deref(),
            context.client_api_key_id.as_deref(),
        ).await?;

        Ok(())
    }

    /// 停止账号调度
    async fn stop_account_scheduling(
        &self,
        account_id: &str,
        status_code: u16,
        reason: &str,
    ) -> Result<()> {
        let mut account = self.get_account(account_id).await?;

        account.schedulable = Some(false);
        account.status = AccountStatus::Error;
        account.error_message = Some(format!("上游返回 {}：{}", status_code, reason));

        self.save_account(&account).await?;

        log::warn!(
            "🚫 已停止调度 Droid 账号 {}（状态码 {}，原因：{}）",
            account_id, status_code, reason
        );

        Ok(())
    }

    /// 网络错误状态码映射
    fn map_network_error_status(&self, error: &Error) -> u16 {
        match error {
            Error::Timeout => 408,
            Error::ConnectionReset | Error::BrokenPipe => 424,
            Error::DnsResolution => 424,
            _ => 424,
        }
    }
}
```

### 9.2 错误类型

| 错误类型 | 说明 | 处理方式 |
|---------|------|---------|
| `WorkOSAuthFailed` | WorkOS OAuth 失败 | 重新授权 |
| `TokenRefreshFailed` | Token 刷新失败 | 重试或重新授权 |
| `NoApiKeyConfigured` | 未配置 API Key | 添加 API Key |
| `AllApiKeysInError` | 所有 API Key 异常 | 检查 Key 或添加新 Key |
| `NoAvailableAccount` | 无可用账户 | 检查账户配置 |
| `SubscriptionExpired` | 订阅已过期 | 续订或使用其他账户 |
| `ConnectionReset` | 连接重置 | 自动重试 |
| `Timeout` | 请求超时 | 自动重试 |

---

## 十、前端 UI 实现

### 10.1 插件入口

```tsx
// src/index.tsx
import { LimePluginSDK } from '@lime/plugin-sdk';
import { CredentialList } from './components/CredentialList';
import { AuthMethodTabs } from './components/AuthMethodTabs';
import { SettingsPanel } from './components/SettingsPanel';

interface PluginProps {
  sdk: LimePluginSDK;
  pluginId: string;
}

export default function DroidProviderUI({ sdk, pluginId }: PluginProps) {
  const [view, setView] = useState<'list' | 'add' | 'settings'>('list');
  const [credentials, setCredentials] = useState<DroidCredential[]>([]);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const result = await sdk.database.query<DroidCredential>(
      'SELECT * FROM plugin_credentials WHERE plugin_id = ? ORDER BY created_at DESC',
      [pluginId]
    );
    setCredentials(result);
  };

  return (
    <div className="droid-provider-ui">
      <Header>
        <Title>Droid Provider</Title>
        <Subtitle>Factory.ai 集成 - 支持 Claude, OpenAI, Gemini</Subtitle>
        <Actions>
          <Button onClick={() => setView('add')}>添加凭证</Button>
          <Button onClick={() => setView('settings')}>设置</Button>
        </Actions>
      </Header>

      {view === 'list' && (
        <CredentialList
          credentials={credentials}
          onRefresh={loadCredentials}
          sdk={sdk}
        />
      )}

      {view === 'add' && (
        <AuthMethodTabs
          sdk={sdk}
          onSuccess={() => {
            loadCredentials();
            setView('list');
          }}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel
          sdk={sdk}
          pluginId={pluginId}
          onClose={() => setView('list')}
        />
      )}
    </div>
  );
}
```

### 10.2 认证方式选择

```tsx
// src/components/AuthMethodTabs.tsx

type AuthMethod = 'workos_oauth' | 'api_key' | 'manual';

interface AuthMethodTabsProps {
  sdk: LimePluginSDK;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AuthMethodTabs({ sdk, onSuccess, onCancel }: AuthMethodTabsProps) {
  const [method, setMethod] = useState<AuthMethod>('workos_oauth');

  return (
    <div className="auth-method-tabs">
      <Tabs value={method} onChange={setMethod}>
        <Tab value="workos_oauth">
          <Icon name="Key" />
          WorkOS OAuth
        </Tab>
        <Tab value="api_key">
          <Icon name="Lock" />
          API Key
        </Tab>
        <Tab value="manual">
          <Icon name="Edit" />
          手动模式
        </Tab>
      </Tabs>

      <div className="tab-content">
        {method === 'workos_oauth' && <OAuthForm sdk={sdk} onSuccess={onSuccess} />}
        {method === 'api_key' && <ApiKeyForm sdk={sdk} onSuccess={onSuccess} />}
        {method === 'manual' && <ManualForm sdk={sdk} onSuccess={onSuccess} />}
      </div>

      <FormActions>
        <Button variant="secondary" onClick={onCancel}>取消</Button>
      </FormActions>
    </div>
  );
}
```

### 10.3 API Key 表单

```tsx
// src/components/ApiKeyForm.tsx

export function ApiKeyForm({ sdk, onSuccess }: FormProps) {
  const [form, setForm] = useState({
    name: '',
    apiKeys: '',
    endpointType: 'anthropic' as EndpointType,
    proxy: '',
    subscriptionExpiresAt: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const apiKeyList = form.apiKeys
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (apiKeyList.length === 0) {
      sdk.notification.error('请输入至少一个 API Key');
      return;
    }

    setLoading(true);
    try {
      await sdk.http.request('/api/droid/account/create', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name || `Droid API Key (${apiKeyList.length} keys)`,
          apiKeys: apiKeyList,
          endpointType: form.endpointType,
          authenticationMethod: 'api_key',
          proxy: form.proxy ? JSON.parse(form.proxy) : null,
          subscriptionExpiresAt: form.subscriptionExpiresAt || null,
        }),
      });
      sdk.notification.success(`成功添加 ${apiKeyList.length} 个 API Key`);
      onSuccess();
    } catch (error) {
      sdk.notification.error(`添加失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-key-form">
      <Alert type="info">
        支持多个 API Key，每行一个。系统将使用随机 + 粘性会话策略选择 Key。
      </Alert>

      <FormField>
        <Label>凭证名称（可选）</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="我的 Droid API Keys"
        />
      </FormField>

      <FormField>
        <Label>API Keys *</Label>
        <TextArea
          rows={5}
          value={form.apiKeys}
          onChange={(e) => setForm({ ...form, apiKeys: e.target.value })}
          placeholder="每行一个 API Key&#10;sk-xxxx&#10;sk-yyyy&#10;sk-zzzz"
        />
        <HelpText>支持批量导入，每行一个 API Key</HelpText>
      </FormField>

      <FormField>
        <Label>端点类型 *</Label>
        <Select
          value={form.endpointType}
          onChange={(value) => setForm({ ...form, endpointType: value })}
        >
          <Option value="anthropic">Anthropic (Claude)</Option>
          <Option value="openai">OpenAI (GPT)</Option>
          <Option value="comm">Comm (通用)</Option>
        </Select>
        <HelpText>选择此账户支持的 API 端点类型</HelpText>
      </FormField>

      <FormField>
        <Label>订阅过期时间（可选）</Label>
        <Input
          type="datetime-local"
          value={form.subscriptionExpiresAt}
          onChange={(e) => setForm({ ...form, subscriptionExpiresAt: e.target.value })}
        />
        <HelpText>设置后，过期账户将不再被调度</HelpText>
      </FormField>

      <FormField>
        <Label>代理配置（可选）</Label>
        <TextArea
          rows={3}
          value={form.proxy}
          onChange={(e) => setForm({ ...form, proxy: e.target.value })}
          placeholder='{"type": "socks5", "host": "127.0.0.1", "port": 1080}'
        />
        <HelpText>JSON 格式的代理配置</HelpText>
      </FormField>

      <Button onClick={handleSubmit} loading={loading}>
        添加 API Key
      </Button>
    </div>
  );
}
```

### 10.4 凭证卡片

```tsx
// src/components/CredentialCard.tsx

const ENDPOINT_TYPE_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  comm: 'Comm',
};

const AUTH_METHOD_LABELS: Record<string, string> = {
  workos_oauth: 'WorkOS OAuth',
  api_key: 'API Key',
  manual: '手动模式',
};

export function CredentialCard({ credential, onRefresh, onDelete }: CredentialCardProps) {
  const data = JSON.parse(credential.credential_data);
  const authMethod = data.authentication_method || 'workos_oauth';
  const endpointType = data.endpoint_type || 'anthropic';
  const isHealthy = credential.status === 'active';
  const apiKeyCount = data.api_key_count || 0;

  return (
    <Card className={`credential-card ${isHealthy ? 'healthy' : 'unhealthy'}`}>
      <CardHeader>
        <div className="status-indicator">
          <StatusDot status={isHealthy ? 'green' : 'red'} />
          <span>{isHealthy ? '健康' : '异常'}</span>
        </div>
        <div className="badges">
          <Badge color="blue">{AUTH_METHOD_LABELS[authMethod]}</Badge>
          <Badge color="purple">{ENDPOINT_TYPE_LABELS[endpointType]}</Badge>
        </div>
      </CardHeader>

      <CardBody>
        <div className="info-row">
          <label>名称</label>
          <span>{credential.name || '未命名'}</span>
        </div>

        {data.owner_email && (
          <div className="info-row">
            <label>邮箱</label>
            <span>{data.owner_email}</span>
          </div>
        )}

        {data.organization_id && (
          <div className="info-row">
            <label>组织 ID</label>
            <span className="truncate">{data.organization_id}</span>
          </div>
        )}

        {authMethod === 'api_key' && (
          <div className="info-row">
            <label>API Key 数量</label>
            <span>{apiKeyCount} 个</span>
          </div>
        )}

        {data.subscription_expires_at && (
          <div className="info-row">
            <label>订阅过期</label>
            <span>{formatDate(data.subscription_expires_at)}</span>
          </div>
        )}

        {data.last_refresh_at && (
          <div className="info-row">
            <label>上次刷新</label>
            <span>{formatDate(data.last_refresh_at)}</span>
          </div>
        )}

        {data.error_message && (
          <div className="info-row error">
            <label>错误信息</label>
            <span>{data.error_message}</span>
          </div>
        )}
      </CardBody>

      <CardFooter>
        {authMethod !== 'api_key' && (
          <Button size="small" onClick={onRefresh}>刷新 Token</Button>
        )}
        <Button size="small" variant="danger" onClick={onDelete}>删除</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 十一、凭证文件格式

### 11.1 WorkOS OAuth 凭证

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "wrkos_rt_...",
  "expires_at": "2025-01-05T12:34:56+00:00",
  "organization_id": "org_01HXXX...",
  "user_id": "user_01HXXX...",
  "owner_email": "user@example.com",
  "owner_name": "John Doe",
  "authentication_method": "oauth",
  "type": "droid_oauth"
}
```

### 11.2 API Key 凭证

```json
{
  "api_keys": [
    {
      "id": "uuid-1",
      "hash": "sha256-hash",
      "encrypted_key": "iv:ciphertext",
      "created_at": "2025-01-05T10:00:00+00:00",
      "last_used_at": "2025-01-05T11:30:00+00:00",
      "usage_count": 42,
      "status": "active",
      "error_message": null
    }
  ],
  "endpoint_type": "anthropic",
  "authentication_method": "api_key",
  "type": "droid_api_key"
}
```

### 11.3 手动模式凭证

```json
{
  "refresh_token": "wrkos_rt_...",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-05T18:00:00+00:00",
  "authentication_method": "manual",
  "type": "droid_manual"
}
```

---

## 十二、客户端验证

### 12.1 Droid CLI 验证器

```rust
/// Droid CLI 验证器
/// 检查请求是否来自 Factory Droid CLI
pub struct DroidCliValidator;

impl DroidCliValidator {
    pub fn validate(headers: &HeaderMap) -> bool {
        let user_agent = headers
            .get("user-agent")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        let factory_client = headers
            .get("x-factory-client")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_lowercase();

        // 检查 User-Agent 格式：factory-cli/x.x.x
        let ua_match = regex::Regex::new(r"factory-cli/(\d+\.\d+\.\d+)")
            .unwrap()
            .is_match(user_agent);

        // 检查 x-factory-client header
        let has_factory_header = factory_client.contains("droid") ||
                                  factory_client.contains("factory-cli");

        ua_match || has_factory_header
    }
}
```

---

## 十三、开发指南

### 13.1 本地开发

```bash
# 克隆仓库
git clone https://github.com/aiclientproxy/droid-provider.git
cd droid-provider

# 安装依赖
pnpm install
cd src-tauri && cargo build

# 前端开发
pnpm dev

# 后端开发
cargo watch -x run
```

### 13.2 测试

```bash
# 单元测试
cargo test

# WorkOS OAuth 测试
cargo test --test workos_oauth

# API Key 选择测试
cargo test --test api_key_selection

# 调度器测试
cargo test --test scheduler

# 前端测试
pnpm test
```

### 13.3 路由端点

| 路由 | 方法 | 说明 |
|------|------|------|
| `/droid/claude/v1/messages` | POST | Anthropic Messages API |
| `/droid/openai/v1/responses` | POST | OpenAI Responses API |
| `/droid/comm/v1/chat/completions` | POST | Chat Completions API |
| `/droid/*/v1/models` | GET | 模型列表 |

---

## 附录

### A. 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DROID_ENCRYPTION_KEY` | 加密主密钥 | 必填 |
| `DROID_DEBUG` | 调试模式 | `false` |
| `DROID_TIMEOUT_MS` | 请求超时 | `600000` |
| `DROID_REFRESH_INTERVAL_HOURS` | Token 刷新间隔 | `6` |

### B. 参考链接

- [Factory.ai 官网](https://factory.ai/)
- [WorkOS 文档](https://workos.com/docs/)
- [Lime 插件开发指南](../prd/credential-provider-plugin-architecture.md)
- [claude-relay-service](https://github.com/aiclientproxy/claude-relay-service)
