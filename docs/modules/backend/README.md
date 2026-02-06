# 后端模块总览

## 模块概述

后端模块是 RuAlive Email Worker 的核心部分，负责处理所有服务器端逻辑、API 请求、数据存储和邮件发送等功能。

## 模块列表

### 1. 主入口
**文件**: `src/index.js` (5950 行)

**职责**:
- Worker 主入口和请求路由
- 静态资源处理
- CORS 处理
- 错误处理和日志记录

**关键功能**:
- 请求路由分发
- 静态文件服务
- Assets 绑定集成
- 认证中间件

**文档**: [index.md](index.md)

### 2. 认证模块
**文件**: `src/auth.js`

**职责**:
- 用户认证和授权
- Token 生成和验证
- 密码哈希和验证
- 会话管理

**关键功能**:
- 用户注册
- 用户登录
- Token 管理
- 权限验证

**文档**: [auth.md](auth.md)

### 3. API 处理器
**文件**: `src/index.js` (handle* 函数)

**职责**:
- 所有 API 端点的处理逻辑
- 请求参数验证
- 响应数据格式化
- 错误处理

**API 分类**:
- 认证 API (8 个端点)
- 配置 API (2 个端点)
- 工作数据 API (4 个端点)
- 管理 API (11 个端点)
- 项目 API (2 个端点)

**文档**: [api-handlers.md](api-handlers.md)

### 4. 邮件服务
**集成**: Resend API

**职责**:
- 邮件发送
- 邮件模板渲染
- 邮件日志记录
- 发送状态跟踪

**邮件类型**:
- 每日工作总结邮件
- 紧急联系人通知
- 测试邮件
- 密码重置邮件

**文档**: [email-service.md](email-service.md)

---

## 核心依赖

### Cloudflare Workers
```javascript
export default {
  async fetch(request, env) {
    // Worker 入口
  }
}
```

### D1 Database
```javascript
const DB = env.DB || env.rualive;
const result = await DB.prepare(sql).bind(params).run();
```

### KV Storage
```javascript
const KV = env.KV;
await KV.put(key, value);
const value = await KV.get(key);
```

### Resend API
```javascript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(emailData)
});
```

---

## 数据流

### 请求处理流程
```
HTTP Request
  ↓
Worker 主入口 (fetch)
  ↓
路由分发
  ↓
认证中间件 (可选)
  ↓
API 处理器
  ↓
数据库操作 (D1)
  ↓
响应返回
```

### 邮件发送流程
```
Cron 触发器
  ↓
handleCronTrigger()
  ↓
查询待发送邮件
  ↓
Resend API 发送
  ↓
记录发送日志
  ↓
更新发送状态
```

---

## API 端点概览

### 认证 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/me` | PUT | 更新当前用户 |
| `/api/auth/change-password` | POST | 修改密码 |
| `/api/auth/init` | POST | 初始化管理员 |
| `/api/auth/reset-admin-password` | POST | 重置管理员密码 |

### 配置 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/config` | GET | 获取用户配置 |
| `/api/config` | POST | 更新用户配置 |

### 工作数据 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/work-data` | POST | 上传工作数据 |
| `/api/heartbeat` | POST | 心跳检测 |
| `/api/ae-status` | GET | 获取 AE 状态 |
| `/api/ae-status` | POST | 更新 AE 状态 |

### 管理 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/dashboard` | GET | 管理员仪表板 |
| `/api/admin/invite-codes` | GET | 获取邀请码列表 |
| `/api/admin/invite-codes` | POST | 创建邀请码 |
| `/api/admin/invite-codes` | DELETE | 删除邀请码 |
| `/api/admin/users` | GET | 获取用户列表 |
| `/api/admin/users/:id` | DELETE | 删除用户 |
| `/api/admin/users/:id/reset-password` | POST | 重置用户密码 |
| `/api/admin/users/:id/email-stats` | GET | 获取用户邮件统计 |
| `/api/admin/users/:id/email-limit` | POST | 设置用户邮件限制 |
| `/api/admin/users/:id/email-limit-status` | GET | 获取用户邮件限制状态 |
| `/api/admin/api-key` | GET | 获取 API 密钥 |
| `/api/admin/api-key` | POST | 设置 API 密钥 |
| `/api/admin/api-key` | DELETE | 删除 API 密钥 |
| `/api/admin/api-key/test` | POST | 测试 API 密钥 |

### 项目 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/projects/summary` | GET | 获取项目总时长列表 |
| `/api/projects/history` | GET | 获取项目历史 |

---

## 安全机制

### 认证
- JWT Token 认证
- Token 过期时间：30 天
- 密码哈希：SHA-256 + 盐值

### 授权
- 基于角色的访问控制 (RBAC)
- 角色：admin, user
- 权限验证中间件

### 数据验证
- 输入参数验证
- SQL 注入防护（参数化查询）
- XSS 防护（输入转义）

---

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 常见错误码
| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权 |
| `FORBIDDEN` | 权限不足 |
| `NOT_FOUND` | 资源不存在 |
| `INVALID_INPUT` | 输入参数无效 |
| `INTERNAL_ERROR` | 服务器内部错误 |

---

## 性能优化

### 缓存策略
- KV 缓存用户配置
- 数据库查询结果缓存（1 分钟）
- 静态资源 CDN 缓存

### 数据库优化
- 使用索引加速查询
- 批量操作减少请求次数
- 连接池管理（Cloudflare 自动）

---

## 调试和监控

### 日志记录
```javascript
console.log('[日志级别] 日志内容');
```

### 实时日志查看
```bash
npx wrangler tail
```

### 数据库查询
```bash
wrangler d1 execute rualive --remote --command "SELECT * FROM users"
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI