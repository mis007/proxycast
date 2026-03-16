# 插件系统

## 概述

插件系统支持扩展 Lime 功能，包含声明式 UI 系统。

## 目录结构

```
src-tauri/src/plugin/
├── mod.rs              # 模块入口
├── loader.rs           # 插件加载器
├── runtime.rs          # 插件运行时
└── ui/                 # 声明式 UI
    ├── types.rs
    └── renderer.rs

plugins/                # 插件目录
└── example/
    ├── manifest.json
    └── main.js
```

## 插件清单

```json
{
    "name": "example-plugin",
    "version": "1.0.0",
    "description": "示例插件",
    "main": "main.js",
    "permissions": ["network", "storage"],
    "ui": {
        "settings": "settings.json"
    }
}
```

## 声明式 UI

```json
{
    "type": "form",
    "fields": [
        {
            "name": "apiKey",
            "type": "password",
            "label": "API Key",
            "required": true
        },
        {
            "name": "enabled",
            "type": "switch",
            "label": "启用",
            "default": true
        }
    ]
}
```

## 插件 API

```typescript
// 插件可用的 API
interface PluginAPI {
    // 存储
    storage: {
        get(key: string): Promise<any>;
        set(key: string, value: any): Promise<void>;
    };
    
    // 网络
    http: {
        fetch(url: string, options?: RequestInit): Promise<Response>;
    };
    
    // UI
    ui: {
        showNotification(message: string): void;
        showDialog(options: DialogOptions): Promise<any>;
    };
}
```

## 相关文档

- [components.md](components.md) - 组件系统
- [services.md](services.md) - 业务服务
