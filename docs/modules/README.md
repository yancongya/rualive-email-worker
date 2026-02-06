# 模块文档总览

## 模块分类

### 后端模块
负责 Worker 的核心业务逻辑和 API 处理。

**目录**: `modules/backend/`

- [后端模块总览](backend/README.md)
- [主入口](backend/index.md) - Worker 主入口 `src/index.js`
- [认证模块](backend/auth.md) - 用户认证和授权机制
- [API 处理器](backend/api-handlers.md) - 所有 API 端点处理函数
- [邮件服务](backend/email-service.md) - 邮件发送服务集成

### 前端模块
负责 Web 界面的用户交互和数据展示。

**目录**: `modules/frontend/`

- [前端模块总览](frontend/README.md)
- [用户仪表板](frontend/user-dashboard.md) - 用户数据查看面板
- [管理后台](frontend/admin-dashboard.md) - 管理员管理面板
- [前端组件](frontend/components.md) - React 组件库

### 数据库模块
负责数据持久化和存储结构。

**目录**: `modules/database/`

- [数据库模块总览](database/README.md)
- [数据库架构](database/schema.md) - 完整的数据库表结构
- [数据库迁移](database/migrations.md) - 数据库迁移历史和版本管理
- [索引设计](database/indexes.md) - 数据库索引优化说明

### API 模块
负责所有 RESTful API 接口的定义和说明。

**目录**: `modules/api/`

- [API 总览](api/README.md)
- [认证 API](api/auth-api.md) - 用户注册、登录、登出等
- [配置 API](api/config-api.md) - 用户配置管理
- [工作数据 API](api/work-data-api.md) - 工作数据上传和查询
- [管理 API](api/admin-api.md) - 管理员功能 API
- [项目 API](api/project-api.md) - 项目数据查询和统计

### 功能模块
负责特定功能的实现说明。

**目录**: `modules/features/`

- [功能模块总览](features/README.md)
- [邮件通知](features/email-notification.md) - 每日工作总结邮件
- [项目累积](features/project-accumulation.md) - 跨天项目数据累积
- [用户管理](features/user-management.md) - 用户管理功能

---

## 模块依赖关系

```
后端模块
  ├─ 依赖: 数据库模块 (D1, KV)
  ├─ 依赖: 邮件服务 (Resend)
  └─ 提供接口: API 模块

前端模块
  ├─ 依赖: API 模块 (HTTP 请求)
  └─ 提供界面: 用户仪表板、管理后台

数据库模块
  ├─ 提供: 数据持久化
  └─ 被: 后端模块使用

API 模块
  ├─ 定义: RESTful 接口
  └─ 连接: 前端模块和后端模块

功能模块
  ├─ 依赖: 后端模块、数据库模块
  └─ 实现: 业务逻辑
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI