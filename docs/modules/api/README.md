# API 模块总览

## 模块概述

API 模块负责定义和说�?RuAlive Email Worker 的所�?RESTful API 接口，包括请求格式、响应格式、错误处理等�?
## API 分类

### 1. 认证 API
**路径前缀**: `/api/auth`

**文档**: [auth-api.md](auth-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | �?|
| `/api/auth/login` | POST | 用户登录 | �?|
| `/api/auth/logout` | POST | 用户登出 | �?|
| `/api/auth/me` | GET | 获取当前用户 | �?|
| `/api/auth/me` | PUT | 更新当前用户 | �?|
| `/api/auth/change-password` | POST | 修改密码 | �?|
| `/api/auth/init` | POST | 初始化管理员 | �?|
| `/api/auth/reset-admin-password` | POST | 重置管理员密�?| �?|
| `/api/auth/debug-admin` | GET | 调试管理�?| �?|

### 2. 配置 API
**路径前缀**: `/api`

**文档**: [config-api.md](config-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/config` | GET | 获取用户配置 | �?|
| `/api/config` | POST | 更新用户配置 | �?|

### 3. 统计 API
**路径前缀**: `/api/stats`

**文档**: [stats-api.md](stats-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/stats/users` | GET | 获取用户统计数量 | �?|

### 4. 工作数据 API
**路径前缀**: `/api`

**文档**: [work-data-api.md](work-data-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/work-data` | POST | 上传工作数据 | �?|
| `/api/heartbeat` | POST | 心跳检�?| �?|
| `/api/ae-status` | GET | 获取 AE 状�?| �?|
| `/api/ae-status` | POST | 更新 AE 状�?| �?|

### 5. 管理 API
**路径前缀**: `/api/admin`

**文档**: [admin-api.md](admin-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/admin/dashboard` | GET | 管理员仪表板 | 是（admin�?|
| `/api/admin/invite-codes` | GET | 获取邀请码列表 | 是（admin�?|
| `/api/admin/invite-codes` | POST | 创建邀请码 | 是（admin�?|
| `/api/admin/invite-codes` | DELETE | 删除邀请码 | 是（admin�?|
| `/api/admin/users` | GET | 获取用户列表 | 是（admin�?|
| `/api/admin/users/:id` | DELETE | 删除用户 | 是（admin�?|
| `/api/admin/users/:id/reset-password` | POST | 重置用户密码 | 是（admin�?|
| `/api/admin/users/:id/email-stats` | GET | 获取用户邮件统计 | 是（admin�?|
| `/api/admin/users/:id/email-limit` | POST | 设置用户邮件限制 | 是（admin�?|
| `/api/admin/users/:id/email-limit-status` | GET | 获取用户邮件限制状�?| 是（admin�?|
| `/api/admin/api-key` | GET | 获取 API 密钥 | 是（admin�?|
| `/api/admin/api-key` | POST | 设置 API 密钥 | 是（admin�?|
| `/api/admin/api-key` | DELETE | 删除 API 密钥 | 是（admin�?|
| `/api/admin/api-key/test` | POST | 测试 API 密钥 | 是（admin�?|

### 6. 项目 API
**路径前缀**: `/api/projects`

**文档**: [project-api.md](project-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/projects/summary` | GET | 获取项目总时长列�?| �?|
| `/api/projects/history` | GET | 获取项目历史 | �?|

### 7. 日志 API
**路径前缀**: `/api`

**文档**: [logs-api.md](logs-api.md)

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/logs` | GET | 获取发送日�?| �?|
| `/api/work-logs/range` | GET | 获取工作日志范围 | �?|
| `/api/work-logs` | GET | 获取工作日志 | �?|

---

## 通用规范

### 请求格式

#### GET 请求
```http
GET /api/config HTTP/1.1
Host: rualive.itycon.cn
Authorization: Bearer <token>
```

#### POST 请求
```http
POST /api/work-data HTTP/1.1
Host: rualive.itycon.cn
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_123",
  "workDate": "2026-02-07",
  "workData": {...}
}
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {...}
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 认证方式

#### JWT Token 认证
```http
Authorization: Bearer <token>
```

#### Token 格式
```
<base64(header).<base64(payload).<base64(signature)>
```

#### Token 有效�?- **有效�?*: 30 �?- **过期处理**: 返回 401 Unauthorized

---

## 错误码说�?
| HTTP 状态码 | 错误�?| 说明 |
|-------------|--------|------|
| 200 | - | 成功 |
| 400 | INVALID_INPUT | 输入参数无效 |
| 401 | UNAUTHORIZED | 未授权或 Token 过期 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存�?|
| 409 | CONFLICT | 资源冲突（如邮箱已存在） |
| 500 | INTERNAL_ERROR | 服务器内部错�?|

---

## API 使用示例

### 用户注册
```bash
curl -X POST https://rualive.itycon.cn/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123",
    "inviteCode": "ABCD-1234"
  }'
```

### 用户登录
```bash
curl -X POST https://rualive.itycon.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 获取用户配置
```bash
curl -X GET https://rualive.itycon.cn/api/config \
  -H "Authorization: Bearer <token>"
```

### 上传工作数据
```bash
curl -X POST https://rualive.itycon.cn/api/work-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "workDate": "2026-02-07",
    "workData": {
      "work_hours": 0.00056,
      "accumulated_work_hours": 54.68,
      "keyframe_count": 699,
      "composition_count": 38,
      "layer_count": 8,
      "effect_count": 273,
      "projects": [...]
    }
  }'
```

---

## 速率限制

当前版本未实施速率限制，建议在生产环境添加�?- 用户级别：每分钟 100 次请�?- IP 级别：每分钟 1000 次请�?- API 密钥级别：每分钟 500 次请�?
---

## 版本控制

当前 API 版本：v1.0

未来版本计划�?- API 版本化（`/api/v1/`�?- 向后兼容性保�?- 弃用通知机制

---

**文档版本**: 1.1
**最后更�?*: 2026-02-10
**作�?*: iFlow CLI
