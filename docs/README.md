# RuAlive Email Worker - 文档索引

## 文档导航

### 项目总览
- [项目总览](overview.md) - 项目简介、核心功能和技术栈
- [架构设计](architecture.md) - 整体架构、模块依赖和数据流

### 模块文档
- [模块总览](modules/README.md) - 所有模块的索引和快速导航

### 后端模块
- [后端模块总览](modules/backend/README.md)
  - [主入口](modules/backend/index.md) - Worker 主入口和路由处理
  - [认证模块](modules/backend/auth.md) - 用户认证和授权
  - [API 处理器](modules/backend/api-handlers.md) - 所有 API 端点处理
  - [邮件服务](modules/backend/email-service.md) - 邮件发送服务

### 前端模块
- [前端模块总览](modules/frontend/README.md)
  - [用户仪表板](modules/frontend/user-dashboard.md) - 用户数据面板
  - [管理后台](modules/frontend/admin-dashboard.md) - 管理员面板
  - [前端组件](modules/frontend/components.md) - React 组件库

### 数据库模块
- [数据库模块总览](modules/database/README.md)
  - [数据库架构](modules/database/schema.md) - 完整的数据库表结构
  - [数据库迁移](modules/database/migrations.md) - 数据库迁移历史
  - [索引设计](modules/database/indexes.md) - 数据库索引说明

### API 文档
- [API 总览](modules/api/README.md)
  - [认证 API](modules/api/auth-api.md) - 用户认证相关 API
  - [配置 API](modules/api/config-api.md) - 用户配置 API
  - [工作数据 API](modules/api/work-data-api.md) - 工作数据上传 API
  - [管理 API](modules/api/admin-api.md) - 管理员功能 API
  - [项目 API](modules/api/project-api.md) - 项目数据 API

### 功能模块
- [功能模块总览](modules/features/README.md)
  - [邮件通知](modules/features/email-notification.md) - 邮件通知功能
  - [项目累积](modules/features/project-accumulation.md) - 项目数据累积
  - [用户管理](modules/features/user-management.md) - 用户管理功能

### 开发指南
- [指南总览](guides/README.md)
  - [快速开始](guides/quick-start.md) - 快速开始指南
  - [部署指南](guides/deployment.md) - 完整的部署流程
  - [数据库迁移](guides/database-migration.md) - 数据库迁移指南
  - [故障排除](guides/troubleshooting.md) - 常见问题和解决方案

### 分析文档
- [项目结构分析](PHASE1_PROJECT_STRUCTURE.md) - 项目结构和技术栈分析
- [后端架构分析](PHASE2_BACKEND_ARCHITECTURE.md) - 后端架构和 API 端点分析
- [数据库结构分析](PHASE3_DATABASE_STRUCTURE.md) - 数据库结构和数据流分析
- [前端架构分析](PHASE4_FRONTEND_ARCHITECTURE.md) - 前端架构和构建流程分析
- [前端功能分析](PHASE5_FRONTEND_FEATURES.md) - 前端面板功能和数据获取分析
- [部署流程分析](PHASE6_DEPLOYMENT_FLOW.md) - 部署流程和配置分析

---

## 快速链接

### 常用操作
- [部署 Worker](guides/deployment.md)
- [执行数据库迁移](guides/database-migration.md)
- [API 接口文档](modules/api/README.md)

### 核心功能
- [邮件通知功能](modules/features/email-notification.md)
- [项目数据累积](modules/features/project-accumulation.md)
- [用户管理系统](modules/features/user-management.md)

### 技术细节
- [数据库架构](modules/database/schema.md)
- [API 端点列表](modules/api/README.md)
- [前端组件](modules/frontend/components.md)

---

## 文档状态

| 文档 | 状态 | 优先级 |
|------|------|--------|
| PHASE1_PROJECT_STRUCTURE.md | ✅ 已完成 | 高 |
| PHASE2_BACKEND_ARCHITECTURE.md | 🔄 进行中 | 高 |
| PHASE3_DATABASE_STRUCTURE.md | ⏳ 待开始 | 高 |
| PHASE4_FRONTEND_ARCHITECTURE.md | ⏳ 待开始 | 高 |
| PHASE5_FRONTEND_FEATURES.md | ⏳ 待开始 | 高 |
| PHASE6_DEPLOYMENT_FLOW.md | ⏳ 待开始 | 中 |

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI