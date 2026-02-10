# RuAlive Email Worker - 完整文档系统

> Cloudflare Workers + React 19 + D1 数据库的邮件通知系统

---

## 📚 文档导航

### 🚀 快速开始
- **[快速开始指南](guides/quick-start.md)** - 5分钟快速部署指南
- **[故障排查](guides/troubleshooting.md)** - 常见问题和解决方案
- **[部署场景](guides/deployment-scenarios.md)** - 各种部署场景和环境配置
- **[运维指南](guides/operations.md)** - 监控、日志、备份等运维内容

### 📖 核心文档
- **[项目结构分析](PHASE1_PROJECT_STRUCTURE.md)** - 项目结构和技术栈
- **[部署流程](PHASE6_DEPLOYMENT_FLOW.md)** - 完整的部署流程和配置
- **[部署和运维](DEPLOYMENT_AND_OPERATIONS.md)** - 部署和运维指南
- **[设计系统](design-system.md)** - 设计规范和开发规范

---

## 🏗️ 模块文档

### 后端模块 (Backend Modules)
- **[后端模块总览](modules/backend/README.md)** - 后端模块索引
  - **[主入口](modules/backend/index.md)** - Worker 主入口和路由处理（5950行代码）
  - **[认证模块](modules/backend/auth.md)** - 用户认证和授权（JWT、密码哈希）
  - **[API 处理器](modules/backend/api-handlers.md)** - 所有 API 端点处理（36个函数）
  - **[邮件服务](modules/backend/email-service.md)** - 邮件发送服务（Resend API）

### 前端模块 (Frontend Modules)
- **[前端模块总览](modules/frontend/README.md)** - 前端模块索引
  - **[前端架构](modules/frontend/architecture.md)** - React 19 + TypeScript + Vite 架构
  - **[构建流程](modules/frontend/build-process.md)** - Vite 构建流程和优化
  - **[组件文档](modules/frontend/components.md)** - 主要组件说明和使用方法
  - **[状态管理](modules/frontend/state-management.md)** - 状态管理和数据流
  - **[面板功能](modules/frontend/panels.md)** - 前端面板功能（4个面板）

### 数据库模块 (Database Modules)
- **[数据库模块总览](modules/database/README.md)** - 数据库模块索引
  - **[数据库架构](modules/database/schema.md)** - 完整的数据库表结构（8个表）
  - **[数据流分析](modules/database/data-flows.md)** - 数据流分析（10个核心数据流）

### API 模块 (API Modules)
- **[API 模块总览](modules/api/README.md)** - API 模块索引
  - **[认证 API](modules/api/auth-api.md)** - 用户认证和授权 API（注册、登录、登出、修改密码）
  - **[配置 API](modules/api/config-api.md)** - 用户配置 API（获取和更新配置）
  - **[统计 API](modules/api/stats-api.md)** - 统计数据 API（用户统计、项目统计）
  - **[工作数据 API](modules/api/work-data-api.md)** - 工作数据上传和管理 API
  - **[项目 API](modules/api/project-api.md)** - 项目数据 API（项目总时长、项目历史）
  - **[日志 API](modules/api/logs-api.md)** - 日志查询 API（发送日志、工作日志）
  - **[管理后台 API](modules/api/admin-api.md)** - 管理员功能 API（邀请码、用户、API密钥、日志）

### 功能模块 (Feature Modules)
- **[功能模块总览](modules/features/README.md)** - 功能模块索引
  - **[管理后台功能](modules/features/admin-dashboard.md)** - 管理后台功能列表

---

## 📋 按功能分类

### 邮件通知
- [邮件通知功能](modules/features/email-notification.md) - 每日邮件通知
- [邮件服务](modules/backend/email-service.md) - Resend API 集成

### 用户管理
- [用户管理功能](modules/features/user-management.md) - 用户注册、登录、权限管理
- [认证模块](modules/backend/auth.md) - JWT 认证和授权
- [管理后台功能](modules/features/admin-dashboard.md) - 管理员功能

### 数据管理
- [数据库架构](modules/database/schema.md) - 数据库表结构
- [数据流分析](modules/database/data-flows.md) - 数据流和查询优化
- [工作数据 API](modules/api/work-data-api.md) - 工作数据上传

### 项目累积
- [项目累积功能](modules/features/project-accumulation.md) - 跨天项目数据累积
- [项目 API](modules/api/project-api.md) - 项目数据 API

---

## 🔧 开发指南

### 快速链接
- [部署 Worker](PHASE6_DEPLOYMENT_FLOW.md) - 完整部署流程
- [执行数据库迁移](guides/database-migration.md) - 数据库迁移指南
- [API 接口文档](modules/api/README.md) - 所有 API 端点

### 技术栈
- **后端**: Cloudflare Workers、D1 数据库、KV 存储
- **前端**: React 19、TypeScript、Vite 5
- **样式**: Tailwind CSS
- **动画**: GSAP
- **邮件**: Resend API

---

## 📊 文档状态

| 文档类型 | 已完成 | 进行中 | 待开始 |
|---------|-------|-------|-------|
| 核心文档 | 4 | 0 | 0 |
| 后端模块 | 4 | 0 | 0 |
| 前端模块 | 5 | 0 | 0 |
| 数据库模块 | 2 | 0 | 0 |
| API 模块 | 6 | 0 | 0 |
| 功能模块 | 1 | 0 | 0 |
| 开发指南 | 4 | 0 | 0 |
| **总计** | **22** | **0** | **0** |

### 已完成的文档列表

#### 核心文档（4个）
- ✅ [项目结构分析](PHASE1_PROJECT_STRUCTURE.md)
- ✅ [部署流程](PHASE6_DEPLOYMENT_FLOW.md)
- ✅ [部署和运维](DEPLOYMENT_AND_OPERATIONS.md)
- ✅ [设计系统](design-system.md)

#### 后端模块（4个）
- ✅ [后端模块总览](modules/backend/README.md)
- ✅ [主入口](modules/backend/index.md)
- ✅ [认证模块](modules/backend/auth.md)
- ✅ [API 处理器](modules/backend/api-handlers.md)
- ✅ [邮件服务](modules/backend/email-service.md)

#### 前端模块（3个）
- ✅ [前端模块总览](modules/frontend/README.md)
- ✅ [前端架构](modules/frontend/architecture.md)
- ✅ [构建流程](modules/frontend/build-process.md)
- ✅ [面板功能](modules/frontend/panels.md)

#### 数据库模块（2个）
- ✅ [数据库模块总览](modules/database/README.md)
- ✅ [数据库架构](modules/database/schema.md)
- ✅ [数据流分析](modules/database/data-flows.md)

#### API 模块（1个）
- ✅ [API 模块总览](modules/api/README.md)
- ✅ [管理后台 API](modules/api/admin-api.md)

#### 功能模块（1个）
- ✅ [功能模块总览](modules/features/README.md)
- ✅ [管理后台功能](modules/features/admin-dashboard.md)

#### 开发指南（2个）
- ✅ [指南总览](guides/README.md)
- ✅ [快速开始](guides/quick-start.md)
- ✅ [故障排查](guides/troubleshooting.md)

---

## 🎯 按角色查看文档

### 新用户
1. [快速开始指南](guides/quick-start.md)
2. [配置用户设置](guides/quick-start.md#配置用户设置)
3. [测试邮件发送](guides/quick-start.md#测试邮件发送)

### 开发者
1. [项目结构分析](PHASE1_PROJECT_STRUCTURE.md)
2. [API 接口文档](modules/api/README.md)
3. [数据库架构](modules/database/schema.md)
4. [设计系统](design-system.md)

### 运维人员
1. [部署流程](PHASE6_DEPLOYMENT_FLOW.md)
2. [部署和运维](DEPLOYMENT_AND_OPERATIONS.md)
3. [故障排查](guides/troubleshooting.md)
4. [日志监控](DEPLOYMENT_AND_OPERATIONS.md#监控和调试)

### 管理员
1. [管理后台功能](modules/features/admin-dashboard.md)
2. [管理后台 API](modules/api/admin-api.md)
3. [用户管理](modules/features/user-management.md)

---

## 🔗 外部资源

### 官方文档
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [Resend API 文档](https://resend.com/docs)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)

### 相关项目
- [RuAlive AE 扩展](../../) - Adobe After Effects 扩展
- [项目主页](https://github.com/yancongya/RuAlive) - GitHub 主页

---

## 📝 文档更新日志

### 2026-02-10
- ✅ 新增用户统计 API (`/api/stats/users`)
- ✅ 落地页添加用户数量显示功能
- ✅ 更新路由管理文档，添加统计相关 API 端点
- ✅ 修复页面标题无法根据语言切换的问题（所有页面）
- ✅ 为所有页面添加 favicon 图标
- ✅ 新增 debug 文档：页面标题和 Favicon 问题修复

### 2026-02-07
- ✅ 完成完整的文档系统重构
- ✅ 新增 17 个详细文档
- ✅ 整合 ADMIN_API.md 到 modules/api/
- ✅ 整合 ADMIN_FEATURES.md 到 modules/features/
- ✅ 整合 DESIGN_SPEC.md 到 design-system.md
- ✅ 删除 6 个被替代的旧文档
- ✅ 创建 guides 目录下的详细指南

### 2026-01-30
- ✅ 完成项目结构分析
- ✅ 完成后端架构和 API 端点分析
- ✅ 完成数据库结构和数据流分析

---

## 🆘 获取帮助

### 常见问题
- 查看 [故障排查指南](guides/troubleshooting.md)
- 搜索 [GitHub Issues](https://github.com/yancongya/RuAlive/issues)

### 联系支持
- **邮箱**: support@example.com
- **GitHub**: https://github.com/yancongya/RuAlive/issues

---

**文档版本**: 2.1
**最后更新**: 2026-02-10
**作者**: iFlow CLI
**许可证**: ISC