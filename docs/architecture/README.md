# Worker 架构文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        AE 扩展                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 扫描模块      │  │ 数据管理      │  │ 邮件管理      │      │
│  │ (jsx/*)      │  │ (dataManager)│  │ (emailManager)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ API 处理      │  │ 数据存储      │  │ 邮件发送      │      │
│  │ (index.js)   │  │ (D1 + KV)    │  │ (Resend)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      前端仪表板                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 工作日志      │  │ 统计图表      │  │ 用户配置      │      │
│  │ (logs-table) │  │ (chart-view) │  │ (settings)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. AE 扩展

#### 扫描模块 (jsx/*)

负责扫描 After Effects 项目数据：

- **composition_scanner.jsx**: 扫描合成
- **layer_scanner.jsx**: 扫描图层
- **keyframe_scanner.jsx**: 扫描关键帧
- **effect_scanner.jsx**: 扫描效果

#### 数据管理 (js/dataManager.js)

负责数据持久化和项目管理：

- 保存扫描结果到 JSON 文件
- 加载历史项目数据
- 计算统计数据

#### 邮件管理 (js/emailManager.js)

负责数据上传和邮件配置：

- 上传工作数据到 Worker
- 管理邮件配置
- 处理认证

### 2. Cloudflare Worker

#### API 处理 (src/index.js)

处理所有 HTTP 请求：

- 认证中间件
- 路由分发
- 数据验证
- 错误处理

#### 数据存储

- **D1 数据库**: 存储用户数据、工作日志、配置
- **KV 存储**: 存储前端代码、缓存数据

#### 邮件发送 (Resend)

- 定时检查并发送邮件
- 支持紧急联系人通知
- 支持测试邮件

### 3. 前端仪表板

#### 工作日志 (src/components/logs-table.js)

显示工作历史记录：

- 分页显示
- 排序功能
- 详情查看
- 数据导出

#### 统计图表 (src/components/chart-view.js)

可视化统计数据：

- 工作时长趋势
- 项目分布
- 效果统计

#### 用户配置 (src/user-dashboard/)

管理用户设置：

- 邮件配置
- 通知时间
- 阈值设置

## 数据流

### 1. 扫描流程

```
用户操作 → AE 扩展 → 扫描模块 → 生成 JSON → 数据管理 → 保存文件
```

### 2. 上传流程

```
定时触发 → 邮件管理 → 转换数据 → API 请求 → Worker → 保存到数据库
```

### 3. 邮件流程

```
Cron 触发 → Worker → 检查时间 → 读取数据 → 生成邮件 → Resend → 发送
```

### 4. 查看流程

```
用户访问 → 前端仪表板 → API 请求 → Worker → 查询数据库 → 返回数据 → 显示
```

## 数据库设计

### 表结构

#### users 表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### work_logs 表
```sql
CREATE TABLE work_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  work_date TEXT NOT NULL,
  work_hours REAL DEFAULT 0,
  keyframe_count INTEGER DEFAULT 0,
  json_size INTEGER DEFAULT 0,
  project_count INTEGER DEFAULT 0,
  composition_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  effect_count INTEGER DEFAULT 0,
  compositions_json TEXT,
  effects_json TEXT,
  layers_json TEXT,
  keyframes_json TEXT,
  projects_json TEXT,
  work_hours_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, work_date)
);
```

#### user_configs 表
```sql
CREATE TABLE user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  reminder_time TEXT DEFAULT '18:00',
  min_keyframes INTEGER DEFAULT 100,
  min_effects INTEGER DEFAULT 10,
  min_hours REAL DEFAULT 1.0,
  enabled INTEGER DEFAULT 1,
  emergency_contact TEXT,
  emergency_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 认证机制

### JWT Token

- **算法**: HS256
- **有效期**: 7 天
- **存储位置**: localStorage
- **刷新机制**: 自动刷新

### 认证流程

```
用户登录 → 验证用户名密码 → 生成 Token → 返回 Token → 存储到 localStorage
```

### 权限控制

- **普通用户**: 只能访问自己的数据
- **管理员**: 可以访问所有数据和仪表板

## 性能优化

### 1. 缓存策略

- **前端缓存**: 详细数据缓存 5 分钟
- **KV 缓存**: 前端代码缓存
- **数据库索引**: 优化查询性能

### 2. 批量操作

- 批量插入数据
- 批量更新配置
- 减少数据库查询次数

### 3. 压缩传输

- JSON 数据压缩
- Gzip 压缩
- 减少网络传输

## 安全措施

### 1. 认证与授权

- JWT Token 认证
- 密码加密存储（bcrypt）
- 权限分级控制

### 2. 数据加密

- HTTPS 传输
- 密码加密
- 敏感数据脱敏

### 3. 访问控制

- 请求频率限制
- IP 白名单（可选）
- CORS 配置

## 部署架构

### Cloudflare Workers

- **全球分布**: 自动部署到全球边缘节点
- **自动扩展**: 根据流量自动扩展
- **零运维**: 无需服务器管理

### 数据存储

- **D1 数据库**: 全球分布式数据库
- **KV 存储**: 全球分布式键值存储
- **自动备份**: 自动备份和恢复

## 监控与日志

### 日志记录

- **Worker 日志**: 实时日志查看
- **错误日志**: 错误追踪
- **访问日志**: 访问统计

### 监控指标

- **请求量**: API 请求统计
- **响应时间**: 性能监控
- **错误率**: 错误统计

## 扩展性

### 水平扩展

- Worker 自动扩展
- 数据库读写分离
- CDN 加速

### 功能扩展

- 插件系统
- Webhook 支持
- API 扩展

## 技术栈

### 后端

- **运行时**: Cloudflare Workers
- **语言**: JavaScript (ES6+)
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare KV
- **邮件**: Resend API

### 前端

- **框架**: 原生 JavaScript
- **样式**: CSS3
- **图表**: 原生 Canvas
- **构建**: 简单脚本

### 工具

- **部署**: Wrangler CLI
- **测试**: PowerShell 脚本
- **文档**: Markdown

## 最佳实践

### 代码组织

- 模块化设计
- 单一职责原则
- 清晰的命名规范

### 错误处理

- 统一错误格式
- 详细的错误日志
- 友好的错误提示

### 性能优化

- 减少数据库查询
- 使用缓存
- 优化数据传输

### 安全防护

- 输入验证
- SQL 注入防护
- XSS 防护

## 未来规划

### 短期

- 添加更多统计图表
- 优化移动端体验
- 支持多语言

### 中期

- 支持团队协作
- 添加项目管理功能
- 集成更多 AE 功能

### 长期

- 支持其他 Adobe 产品
- 开发移动应用
- 提供企业版功能

## 相关文档

- [API 文档](../api/README.md)
- [数据流程说明](../data-flow-explanation.html)
- [项目结构说明](../PROJECT_STRUCTURE.md)
- [快速开始指南](../QUICK_START.md)