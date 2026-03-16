# Playwright Login Sidecar

Lime 的 Playwright 指纹浏览器登录 Sidecar 脚本。

## 文件索引

| 文件 | 描述 |
|------|------|
| `index.js` | Sidecar 主入口，处理 stdin/stdout JSON 通信 |
| `browser-context.js` | 浏览器上下文工厂，配置反检测参数 |
| `oauth-handler.js` | OAuth 流程处理器，处理授权码提取 |
| `test/browser-config.property.test.js` | 浏览器配置属性测试 |
| `test/oauth-url.property.test.js` | OAuth URL 解析属性测试 |

## 安装

```bash
npm install
```

## 测试

```bash
# 运行所有测试
npm test

# 运行属性测试
npm run test:property
```

## 使用

此脚本通过 Tauri Sidecar 机制调用，不建议直接运行。

## 通信协议

### 请求格式

```json
{
  "action": "login" | "cancel" | "check",
  "provider": "Google" | "Github" | "BuilderId",
  "authUrl": "https://oauth.provider.com/authorize?...",
  "callbackUrl": "http://localhost:PORT/callback"
}
```

### 响应格式

```json
{
  "success": true | false,
  "action": "login" | "cancel" | "check" | "progress" | "ready",
  "data": {
    "code": "authorization_code",
    "state": "state_value",
    "error": "error_message",
    "available": true,
    "browserPath": "/path/to/chromium",
    "message": "进度消息"
  }
}
```

## 支持的操作

### check - 检查 Playwright 可用性

请求:
```json
{ "action": "check" }
```

响应:
```json
{
  "success": true,
  "action": "check",
  "data": {
    "available": true,
    "browserPath": "/Users/xxx/Library/Caches/ms-playwright/chromium-xxx/..."
  }
}
```

### login - 启动 OAuth 登录

请求:
```json
{
  "action": "login",
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "callbackUrl": "http://localhost:8080/callback"
}
```

响应:
```json
{
  "success": true,
  "action": "login",
  "data": {
    "code": "4/0AX4XfWh...",
    "state": "random_state"
  }
}
```

### cancel - 取消登录

请求:
```json
{ "action": "cancel" }
```

响应:
```json
{
  "success": true,
  "action": "cancel",
  "data": { "message": "登录已取消" }
}
```
