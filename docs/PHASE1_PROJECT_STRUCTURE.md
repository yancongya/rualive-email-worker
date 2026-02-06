# Worker 项目结构和技术栈分析

## 文档信息
- **创建日期**: 2026-02-06
- **分析阶段**: 阶段1 - 项目结构和技术栈
- **分析范围**: RuAlive Email Worker 项目整体架构

---

## 1. 项目概述

### 1.1 项目定位
RuAlive Email Worker 是一个基于 Cloudflare Workers 的无服务器应用，为 RuAlive AE 扩展提供后端服务支持。主要功能包括：

- **用户认证和授权**：用户注册、登录、会话管理
- **工作数据接收和存储**：接收 AE 扩展上传的工作数据
- **数据统计和分析**：项目累积数据统计、每日工作时长跟踪
- **邮件通知服务**：每日工作总结邮件、紧急联系人通知
- **Web 界面**：用户仪表板和管理后台

### 1.2 技术特点
- **无服务器架构**：基于 Cloudflare Workers，无需管理服务器
- **边缘计算**：全球部署，低延迟访问
- **静态资源绑定**：使用 Assets 绑定部署 React 应用
- **持久化存储**：D1 数据库（SQLite 兼容）+ KV 存储
- **定时任务**：通过 Cron 触发器每小时检查邮件发送

---

## 2. 项目目录结构

```
rualive-email-worker/
├── src/                          # 后端源代码（JavaScript）
│   ├── index.js                  # Worker 主入口（5950行）
│   ├── auth.js                   # 认证模块
│   └── components/               # UI 组件（React）
│       ├── chart-view.js         # 图表组件
│       ├── logs-table.js         # 日志表格组件
│       ├── stats-grid.js         # 统计网格组件
│       ├── tab-manager.js        # Tab 管理器
│       └── time-selector.js      # 时间选择器
├── public/                       # 前端源代码（HTML/React）
│   ├── index.html                # 首页
│   ├── auth.html                 # 认证页面
│   ├── admin.html                # 管理后台
│   ├── user-v6.html              # 用户仪表板（v6）
│   └── src/                      # React 前端源码
│       ├── user-v6.tsx           # 用户仪表板组件
│       ├── dataTransform.ts      # 数据转换工具
│       └── components/           # React 组件
├── dist/                         # 构建输出目录
│   ├── assets/                   # 构建后的静态资源
│   └── *.html                    # 构建后的 HTML 文件
├── docs/                         # 文档目录
├── migrations/                   # 数据库迁移文件
├── tests/                        # 测试脚本（PowerShell）
├── tools/                        # 工具脚本
├── .git/                         # Git 仓库
├── .wrangler/                    # Wrangler 配置缓存
├── .gitignore                    # Git 忽略规则
├── admin-dashboard.html          # 旧版管理后台（已废弃）
├── deploy.ps1                    # PowerShell 部署脚本
├── DEPLOYMENT_GUIDE.md           # 部署指南
├── email-preview.html            # 邮件预览页面
├── migration_add_project_id.sql  # 数据库迁移（添加 project_id）
├── package.json                  # Node.js 依赖配置
├── QUICK_START.md                # 快速开始指南
├── README.md                     # 项目说明
├── recreate-table.sql            # 重建表 SQL
├── runtime-tracking-implementation.txt  # 运行时间跟踪实现说明
├── schema.sql                    # 数据库架构（完整）
├── test-user-dashboard.js        # 用户仪表板测试脚本
├── vite.config.ts                # Vite 构建配置
└── wrangler.toml                 # Cloudflare Workers 配置
```

---

## 3. 技术栈

### 3.1 后端技术栈

#### 核心技术
- **Cloudflare Workers**：无服务器计算平台
- **JavaScript (ES6+)**：主要开发语言
- **Wrangler CLI**：Cloudflare Workers 命令行工具

#### 存储技术
- **D1 Database**：Cloudflare 提供的 SQLite 兼容数据库
  - 绑定名称：`DB`
  - 数据库 ID：`59a95578-9781-4592-a711-d961765766c5`
  - 数据库名：`rualive`

- **KV Storage**：Cloudflare 提供的键值存储
  - 绑定名称：`KV`
  - KV ID：`2ab9c0f8a4be4e56a30097fcd349befb`
  - Preview ID：`192c3912542a49b99fa06c1419d2fd7a`

#### 邮件服务
- **Resend**：邮件发送服务
  - API Key 存储在 Cloudflare Secrets（`RESEND_API_KEY`）

#### 定时任务
- **Cron Triggers**：定时触发器
  - 表达式：`0 * * * *`（每小时执行一次）

### 3.2 前端技术栈

#### 核心技术
- **React 19**：UI 框架
- **Vite 5**：构建工具
- **TypeScript 5.3**：类型安全的 JavaScript
- **HTML5 + CSS3**：页面结构和样式

#### 构建工具
- **Vite**：前端构建工具
- **@vitejs/plugin-react**：React 插件
- **Rollup**：打包工具（Vite 内置）

#### UI 组件
- **Chart.js**（通过 chart-view.js）：数据可视化
- **自定义组件**：日志表格、统计网格、Tab 管理器等

### 3.3 开发工具

#### 依赖管理
- **npm**：Node.js 包管理器
- **package.json**：依赖配置文件

#### 开发依赖
```json
{
  "wrangler": "^3.114.17",
  "vite": "^5.0.0",
  "@vitejs/plugin-react": "^4.2.0",
  "typescript": "^5.3.0"
}
```

#### 生产依赖
```json
{
  "bcryptjs": "^2.4.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

---

## 4. 部署架构

### 4.1 部署平台
- **Cloudflare Workers**：主应用部署平台
- **Cloudflare D1**：数据库托管
- **Cloudflare KV**：键值存储
- **Cloudflare Assets**：静态资源托管

### 4.2 绑定配置（wrangler.toml）

```toml
name = "rualive-email-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Assets 绑定 - 静态文件
[assets]
directory = "dist"
binding = "ASSETS"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "KV"
id = "2ab9c0f8a4be4e56a30097fcd349befb"
preview_id = "192c3912542a49b99fa06c1419d2fd7a"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "59a95578-9781-4592-a711-d961765766c5"

# Cron 触发器
[triggers]
crons = ["0 * * * *"]

# 环境变量
[vars]
ENVIRONMENT = "production"
FROM_EMAIL = "RuAlive@itycon.cn"
DEPLOY_TIMESTAMP = "2026-02-02-10-20"
```

### 4.3 环境变量

| 变量名 | 说明 | 存储位置 |
|-------|------|---------|
| `ENVIRONMENT` | 运行环境（production/preview） | wrangler.toml |
| `FROM_EMAIL` | 发件人邮箱地址 | wrangler.toml |
| `DEPLOY_TIMESTAMP` | 部署时间戳 | wrangler.toml |
| `RESEND_API_KEY` | Resend API 密钥 | Cloudflare Secrets |
| `JWT_SECRET` | JWT 签名密钥 | 代码中默认值（可配置） |

---

## 5. 路由配置

### 5.1 前端路由（Vite 构建）

| 路由 | 源文件 | 说明 | 构建产物 |
|------|--------|------|---------|
| `/` | `public/index.html` | 首页 | `dist/index.html` |
| `/login` | `public/auth.html` | 登录页 | `dist/auth.html` |
| `/user` | `public/user-v6.html` | 用户仪表板（v6） | `dist/user-v6.html` |
| `/admin` | `public/admin.html` | 管理后台 | `dist/admin.html` |

### 5.2 后端 API 路由

| 路由 | 方法 | 功能 | 处理函数 |
|------|------|------|---------|
| `/api/config` | GET/POST | 用户配置管理 | handleConfig |
| `/api/work-data` | POST | 上传工作数据 | handleWorkData |
| `/api/send-now` | POST | 立即发送邮件 | handleSendNow |
| `/api/logs` | GET | 获取发送日志 | handleGetLogs |
| `/api/auth/login` | POST | 用户登录 | handleLogin |
| `/api/auth/logout` | POST | 用户登出 | handleLogout |
| `/api/auth/user` | GET | 获取当前用户 | handleGetUser |
| `/api/auth/change-password` | POST | 修改密码 | handleChangePassword |
| `/api/auth/register` | POST | 用户注册 | handleRegister |
| `/api/admin/dashboard` | GET | 管理员仪表板 | handleAdminDashboard |
| `/api/admin/test-email` | POST | 发送测试邮件 | handleAdminTestEmail |
| `/api/admin/users/:id` | DELETE | 删除用户 | handleAdminDeleteUser |
| `/api/admin/users/:id/reset-password` | POST | 重置用户密码 | handleAdminResetPassword |
| `/api/admin/users/:id/email-stats` | GET | 获取用户邮件统计 | handleAdminGetUserEmailStats |
| `/api/admin/users/:id/email-limit` | POST | 设置用户邮件限制 | handleAdminSetUserEmailLimit |
| `/api/admin/users/:id/email-limit-status` | GET | 获取用户邮件限制状态 | handleAdminGetUserEmailLimitStatus |
| `/api/projects/summary` | GET | 获取项目总时长列表 | handleGetProjectsSummary |
| `/api/projects/history` | GET | 获取项目历史 | handleGetProjectHistory |
| `/api/ae-status` | GET/POST | AE 状态管理 | handleAEStatus |
| `/api/heartbeat` | POST | 心跳检测 | handleHeartbeat |

---

## 6. 数据库架构概述

### 6.1 核心表结构

| 表名 | 用途 | 主要字段 |
|------|------|---------|
| `users` | 用户信息 | id, email, username, password_hash, role |
| `sessions` | 会话管理 | id, user_id, token, expires_at |
| `invite_codes` | 邀请码管理 | id, code, created_by, max_uses, used_count |
| `user_configs` | 用户配置 | user_id, email_address, daily_report_time, timezone |
| `work_logs` | 每日工作日志 | user_id, work_date, work_hours, keyframe_count |
| `projects` | 项目主表 | user_id, project_id, project_name, total_work_hours |
| `project_daily_stats` | 项目每日统计 | project_id, work_date, work_hours, composition_count |
| `ae_status` | AE 状态 | user_id, ae_version, os_name, project_id |
| `email_logs` | 邮件发送日志 | user_id, email_address, subject, status |

### 6.2 索引设计

| 索引名 | 表名 | 字段 | 用途 |
|--------|------|------|------|
| `idx_sessions_user_id` | sessions | user_id | 加速用户会话查询 |
| `idx_sessions_token` | sessions | token | 加速 token 查询 |
| `idx_sessions_expires_at` | sessions | expires_at | 加速过期会话清理 |
| `idx_invite_codes_code` | invite_codes | code | 加速邀请码查询 |
| `idx_work_data_user_id` | work_data | user_id | 加速用户工作数据查询 |
| `idx_work_data_date` | work_data | date | 加速日期范围查询 |
| `idx_email_logs_user_id` | email_logs | user_id | 加速用户邮件日志查询 |
| `idx_email_logs_status` | email_logs | status | 加速邮件状态查询 |
| `idx_api_keys_user_id` | api_keys | user_id | 加速 API 密钥查询 |
| `idx_ae_status_project_id` | ae_status | project_id | 加速项目 AE 状态查询 |

---

## 7. 开发和部署流程

### 7.1 开发流程

```bash
# 1. 克隆项目
git clone <repo-url>
cd rualive-email-worker

# 2. 安装依赖
npm install

# 3. 本地开发（Cloudflare Workers）
npm run dev

# 4. 前端开发（React）
npm run dev:frontend
```

### 7.2 构建流程

```bash
# 自动化构建和部署（推荐）
.\deploy.ps1  # Windows PowerShell

# 手动构建流程
# 1. 清理旧的构建文件
Remove-Item dist -Recurse -Force

# 2. 构建前端
cd public
npm run build
cd ..

# 3. 复制构建文件
Copy-Item public\dist -Destination dist -Recurse -Force

# 4. 部署到 Cloudflare
npm run deploy

# 5. 清理临时文件
Remove-Item public\dist -Recurse -Force
```

### 7.3 数据库迁移

```bash
# 创建 D1 数据库
npm run db:create

# 执行迁移
npm run db:migrate

# 或者手动执行 SQL 文件
wrangler d1 execute rualive --file=./schema.sql
wrangler d1 execute rualive --file=./migration_add_project_id.sql
```

### 7.4 KV 存储

```bash
# 创建生产环境 KV
npm run kv:create

# 创建预览环境 KV
npm run kv:create-preview
```

### 7.5 密钥配置

```bash
# 设置 Resend API 密钥
wrangler secret put RESEND_API_KEY
```

---

## 8. 项目特点

### 8.1 技术优势
- **无服务器**：无需管理服务器基础设施
- **全球部署**：Cloudflare 全球边缘网络
- **高性能**：边缘计算，低延迟
- **低成本**：按使用量计费
- **高可用**：Cloudflare 保障服务可用性

### 8.2 架构特点
- **前后端分离**：React 前端 + Cloudflare Workers 后端
- **静态资源绑定**：使用 Assets 绑定部署前端
- **API 驱动**：RESTful API 设计
- **JWT 认证**：无状态认证机制
- **数据持久化**：D1 + KV 双存储

### 8.3 功能特点
- **多用户支持**：用户注册、登录、角色管理
- **项目管理**：项目累积数据跟踪
- **工作统计**：每日工作时长、关键帧数量等
- **邮件通知**：每日总结、紧急联系人通知
- **Web 界面**：用户仪表板、管理后台
- **实时日志**：支持日志查看和调试

---

## 9. 与 AE 扩展的集成

### 9.1 数据流向

```
AE 扩展 (After Effects)
  ↓
POST /api/work-data
  ↓
Worker 后端 (Cloudflare)
  ↓
D1 数据库存储
  ↓
前端查询显示
```

### 9.2 API 交互

| AE 扩展请求 | Worker 端点 | 返回数据 |
|------------|------------|---------|
| 上传工作数据 | `/api/work-data` | 上传成功/失败状态 |
| 查询配置 | `/api/config` | 用户配置信息 |
| 发送邮件 | `/api/send-now` | 邮件发送状态 |
| 系统信息 | `/api/ae-status` | AE 版本和系统信息 |

### 9.3 数据格式

```javascript
// AE 扩展上传的工作数据格式
{
  "userId": "user_123",
  "workDate": "2026-02-07",
  "workData": {
    "work_hours": 0.00056,              // 当天运行时间（小时）
    "accumulated_work_hours": 54.68,   // 累积运行时间（小时）
    "keyframe_count": 699,
    "json_size": 0,
    "composition_count": 38,
    "layer_count": 8,
    "effect_count": 273,
    "projects": [...]
  },
  "systemInfo": {
    "ae": { "version": "23.5x52" },
    "system": { "os": "Windows" }
  }
}
```

---

## 10. 安全机制

### 10.1 认证机制
- **JWT Token**：基于 JWT 的无状态认证
- **密码哈希**：SHA-256 哈希 + 盐值
- **会话管理**：token 过期机制（30天）
- **角色权限**：admin/user 角色分离

### 10.2 数据安全
- **SQL 注入防护**：使用参数化查询
- **XSS 防护**：输入验证和转义
- **CSRF 防护**：SameSite Cookie
- **密钥管理**：使用 Cloudflare Secrets

---

## 11. 性能优化

### 11.1 缓存策略
- **KV 缓存**：使用 KV 存储缓存静态资源
- **数据库索引**：关键字段建立索引
- **Assets 绑定**：静态资源通过 CDN 分发

### 11.2 代码优化
- **动态导入**：按需加载模块
- **代码分割**：Rollup 自动分割代码
- **Tree Shaking**：移除未使用代码

---

## 12. 监控和调试

### 12.1 日志系统
- **Worker 日志**：`console.log` 输出
- **实时日志**：`npx wrangler tail`
- **邮件日志**：email_logs 表记录

### 12.2 调试工具
- **Cloudflare Dashboard**：查看 Worker 状态
- **D1 数据库控制台**：执行 SQL 查询
- **KV 存储查看器**：查看键值数据

---

## 13. 下一步分析

本阶段已完成项目结构和技术栈分析，下一阶段将分析：
- 后端架构和 API 端点
- 数据库结构和数据流
- 前端架构和构建流程
- 前端面板功能和数据获取

---

**文档版本**: 1.0
**最后更新**: 2026-02-06
**作者**: iFlow CLI
**状态**: ✅ 阶段1 完成