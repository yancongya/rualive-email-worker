# API 处理器

## 文档信息
- **模块类型**: 后端核心模块
- **最后更新**: 2026-02-07

---

## 1. 模块概述

### 1.1 模块职责
- 处理所有 HTTP 请求
- 实现业务逻辑
- 数据库操作
- 响应格式化

### 1.2 函数统计
- **总数**: 36 个 handle* 函数
- **分类**:
  - 认证处理: 8 个
  - 配置处理: 2 个
  - 工作数据处理: 4 个
  - 管理功能: 11 个
  - 项目数据: 2 个
  - 日志查询: 3 个
  - 系统功能: 6 个

---

## 2. 认证处理 (8个函数)

### 2.1 handleRegister
**路由**: `POST /api/auth/register`

**功能**: 用户注册

**参数**:
```javascript
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123",
  "inviteCode": "ABCD-1234"  // 可选
}
```

**流程**:
1. 验证邀请码（如果启用）
2. 检查邮箱是否已存在
3. 生成用户ID
4. 哈希密码
5. 插入用户数据
6. 返回用户信息

**返回**:
```javascript
{
  "success": true,
  "userId": "user_1234567890_abc123",
  "username": "testuser",
  "email": "user@example.com",
  "role": "user"
}
```

### 2.2 handleLogin
**路由**: `POST /api/auth/login`

**功能**: 用户登录

**参数**:
```javascript
{
  "email": "user@example.com",
  "password": "password123"
}
```

**流程**:
1. 查询用户数据
2. 验证密码
3. 生成 JWT Token
4. 返回 Token 和用户信息

**返回**:
```javascript
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890_abc123",
    "username": "testuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 2.3 handleLogout
**路由**: `POST /api/auth/logout`

**功能**: 用户登出

**认证**: 需要登录

**流程**:
1. 验证 Token
2. 删除会话
3. 返回成功

**返回**:
```javascript
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2.4 handleGetCurrentUser
**路由**: `GET /api/auth/user`

**功能**: 获取当前用户信息

**认证**: 需要登录

**返回**:
```javascript
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "username": "testuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 2.5 handleChangePassword
**路由**: `POST /api/auth/change-password`

**功能**: 修改密码

**认证**: 需要登录

**参数**:
```javascript
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**流程**:
1. 验证 Token
2. 查询用户数据
3. 验证当前密码
4. 哈希新密码
5. 更新数据库
6. 返回成功

**返回**:
```javascript
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 2.6 handleCreateInviteCode
**路由**: `POST /api/auth/invite-codes`

**功能**: 创建邀请码

**认证**: 需要管理员权限

**参数**:
```javascript
{
  "maxUses": 10,
  "expiresAt": "2026-03-01T00:00:00.000Z"  // 可选
}
```

**返回**:
```javascript
{
  "success": true,
  "code": "ABCD-1234",
  "maxUses": 10
}
```

### 2.7 handleListInviteCodes
**路由**: `GET /api/auth/invite-codes`

**功能**: 列出所有邀请码

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "codes": [
    {
      "code": "ABCD-1234",
      "maxUses": 10,
      "usedCount": 3,
      "isActive": true
    }
  ]
}
```

### 2.8 handleRevokeInviteCode
**路由**: `DELETE /api/auth/invite-codes/:code`

**功能**: 撤销邀请码

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "message": "Invite code revoked"
}
```

---

## 3. 配置处理 (2个函数)

### 3.1 handleGetConfig
**路由**: `GET /api/config`

**功能**: 获取用户配置

**认证**: 需要登录

**参数**:
```
?userId=user_1234567890_abc123
```

**返回**:
```javascript
{
  "success": true,
  "config": {
    "enabled": true,
    "sendTime": "22:00",
    "timezone": "Asia/Shanghai",
    "userEmails": ["user@example.com"],
    "emergencyContacts": [
      {
        "email": "emergency@example.com",
        "name": "紧急联系人",
        "relation": "家人"
      }
    ],
    "thresholds": {
      "minWorkHours": 2,
      "minKeyframes": 50,
      "minJsonSize": 10
    }
  }
}
```

### 3.2 handleUpdateConfig
**路由**: `POST /api/config`

**功能**: 更新用户配置

**认证**: 需要登录

**参数**:
```javascript
{
  "userId": "user_1234567890_abc123",
  "config": {
    "enabled": true,
    "sendTime": "22:00",
    "timezone": "Asia/Shanghai",
    "userEmails": ["user@example.com"],
    "emergencyContacts": [...],
    "thresholds": {...}
  }
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "Configuration updated"
}
```

---

## 4. 工作数据处理 (4个函数)

### 4.1 handleWorkDataUpload
**路由**: `POST /api/work-data`

**功能**: 上传工作数据

**认证**: 需要登录

**参数**:
```javascript
{
  "userId": "user_1234567890_abc123",
  "workDate": "2026-02-07",
  "workData": {
    "work_hours": 0.00056,
    "accumulated_work_hours": 54.68,
    "keyframe_count": 699,
    "composition_count": 38,
    "layer_count": 8,
    "effect_count": 273,
    "project_count": 2,
    "projects": [
      {
        "project_id": "abc123",
        "project_name": "项目A",
        "project_path": "E:/project.aep"
      }
    ]
  },
  "ae_status": {
    "version": "23.5x52",
    "operating_system": "Windows"
  }
}
```

**流程**:
1. 验证 Token
2. 解析工作数据
3. 更新/创建 work_logs 记录
4. 更新项目数据
5. 更新 AE 状态
6. 返回成功

**返回**:
```javascript
{
  "success": true,
  "message": "Work data uploaded",
  "logId": 12345
}
```

### 4.2 handleGetWorkLogs
**路由**: `GET /api/work-logs`

**功能**: 获取工作日志

**认证**: 需要登录

**参数**:
```
?userId=user_1234567890_abc123&limit=10&offset=0
```

**返回**:
```javascript
{
  "success": true,
  "logs": [
    {
      "id": 12345,
      "workDate": "2026-02-07",
      "workHours": 0.00056,
      "keyframeCount": 699,
      "compositionCount": 38,
      "layerCount": 8,
      "effectCount": 273
    }
  ],
  "total": 100
}
```

### 4.3 handleGetProjectSummary
**路由**: `GET /api/projects/summary`

**功能**: 获取项目汇总

**认证**: 需要登录

**参数**:
```
?userId=user_1234567890_abc123
```

**返回**:
```javascript
{
  "success": true,
  "projects": [
    {
      "projectId": "abc123",
      "projectName": "项目A",
      "totalWorkHours": 54.68,
      "totalWorkDays": 15,
      "firstWorkDate": "2026-01-01",
      "lastWorkDate": "2026-02-07"
    }
  ]
}
```

### 4.4 handleGetProjectHistory
**路由**: `GET /api/projects/history`

**功能**: 获取项目历史

**认证**: 需要登录

**参数**:
```
?projectId=abc123&limit=30
```

**返回**:
```javascript
{
  "success": true,
  "history": [
    {
      "workDate": "2026-02-07",
      "workHours": 0.00056,
      "accumulatedRuntime": 54.68,
      "compositionCount": 38,
      "layerCount": 8,
      "keyframeCount": 699,
      "effectCount": 273
    }
  ]
}
```

---

## 5. 管理功能 (11个函数)

### 5.1 handleGetAdminDashboard
**路由**: `GET /api/admin/dashboard`

**功能**: 获取管理员仪表板数据

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "stats": {
    "totalUsers": 50,
    "totalProjects": 200,
    "totalWorkHours": 1000,
    "emailsSentToday": 25,
    "activeUsers": 30
  }
}
```

### 5.2 handleGetAllUsers
**路由**: `GET /api/admin/users`

**功能**: 获取所有用户列表

**认证**: 需要管理员权限

**参数**:
```
?limit=50&offset=0&search=searchQuery
```

**返回**:
```javascript
{
  "success": true,
  "users": [
    {
      "id": "user_1234567890_abc123",
      "username": "testuser",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "total": 50
}
```

### 5.3 handleDeleteUser
**路由**: `DELETE /api/admin/users/:id`

**功能**: 删除用户

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "message": "User deleted"
}
```

### 5.4 handleResetUserPassword
**路由**: `POST /api/admin/users/:id/reset-password`

**功能**: 重置用户密码

**认证**: 需要管理员权限

**参数**:
```javascript
{
  "newPassword": "newPassword123"  // 可选，不提供则自动生成
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "Password reset email sent",
  "mode": "auto"  // 或 "custom"
}
```

### 5.5 handleGetUserEmailStats
**路由**: `GET /api/admin/users/:id/email-stats`

**功能**: 获取用户邮件统计

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "stats": {
    "totalEmailsSent": 100,
    "emailsSentToday": 5,
    "emailsSentThisMonth": 30
  }
}
```

### 5.6 handleSetUserEmailLimit
**路由**: `POST /api/admin/users/:id/email-limit`

**功能**: 设置用户邮件限制

**认证**: 需要管理员权限

**参数**:
```javascript
{
  "emailLimit": 100
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "Email limit updated"
}
```

### 5.7 handleGetUserEmailLimitStatus
**路由**: `GET /api/admin/users/:id/email-limit-status`

**功能**: 获取用户邮件限制状态

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "status": {
    "emailLimit": 100,
    "emailsSentToday": 5,
    "emailsRemaining": 95
  }
}
```

### 5.8 handleTestEmail
**路由**: `POST /api/admin/test-email`

**功能**: 发送测试邮件

**认证**: 需要管理员权限

**参数**:
```javascript
{
  "to": "user@example.com",
  "subject": "Test Email",
  "content": "This is a test email"
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "Test email sent",
  "emailId": "email_1234567890_abc123"
}
```

### 5.9 handleGetEmailLogs
**路由**: `GET /api/admin/email-logs`

**功能**: 获取邮件日志

**认证**: 需要管理员权限

**参数**:
```
?limit=100&offset=0&userId=user_1234567890_abc123
```

**返回**:
```javascript
{
  "success": true,
  "logs": [
    {
      "id": 12345,
      "userId": "user_1234567890_abc123",
      "to": "user@example.com",
      "subject": "Work Summary",
      "status": "sent",
      "sentAt": "2026-02-07T22:00:00.000Z"
    }
  ],
  "total": 100
}
```

### 5.10 handleGetUserConfigs
**路由**: `GET /api/admin/user-configs`

**功能**: 获取所有用户配置

**认证**: 需要管理员权限

**返回**:
```javascript
{
  "success": true,
  "configs": [
    {
      "userId": "user_1234567890_abc123",
      "username": "testuser",
      "enabled": true,
      "sendTime": "22:00"
    }
  ]
}
```

### 5.11 handleUpdateUserConfig
**路由**: `POST /api/admin/user-configs/:userId`

**功能**: 更新用户配置

**认证**: 需要管理员权限

**参数**:
```javascript
{
  "enabled": true,
  "sendTime": "22:00"
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "User configuration updated"
}
```

---

## 6. 系统功能 (6个函数)

### 6.1 handleHealthCheck
**路由**: `GET /health`

**功能**: 健康检查

**返回**:
```javascript
{
  "status": "healthy",
  "timestamp": "2026-02-07T14:30:00.000Z"
}
```

### 6.2 handleSendNow
**路由**: `POST /api/send-now`

**功能**: 立即发送邮件

**认证**: 需要登录

**参数**:
```javascript
{
  "userId": "user_1234567890_abc123"
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "Email sent successfully"
}
```

### 6.3 handleGetLogs
**路由**: `GET /api/logs`

**功能**: 获取发送日志

**认证**: 需要登录

**参数**:
```
?userId=user_1234567890_abc123&limit=10
```

**返回**:
```javascript
{
  "success": true,
  "logs": [
    {
      "id": 12345,
      "userId": "user_1234567890_abc123",
      "status": "sent",
      "sentAt": "2026-02-07T22:00:00.000Z"
    }
  ]
}
```

### 6.4 handleHeartbeat
**路由**: `POST /api/heartbeat`

**功能**: 心跳检测

**认证**: 需要登录

**参数**:
```javascript
{
  "userId": "user_1234567890_abc123"
}
```

**返回**:
```javascript
{
  "success": true,
  "timestamp": "2026-02-07T14:30:00.000Z"
}
```

### 6.5 handleSaveAEStatus
**路由**: `POST /api/ae-status`

**功能**: 保存 AE 状态

**认证**: 需要登录

**参数**:
```javascript
{
  "userId": "user_1234567890_abc123",
  "aeStatus": {
    "version": "23.5x52",
    "operating_system": "Windows"
  }
}
```

**返回**:
```javascript
{
  "success": true,
  "message": "AE status saved"
}
```

### 6.6 handleGetAEStatus
**路由**: `GET /api/ae-status`

**功能**: 获取 AE 状态

**认证**: 需要登录

**参数**:
```
?userId=user_1234567890_abc123
```

**返回**:
```javascript
{
  "success": true,
  "aeStatus": {
    "version": "23.5x52",
    "operating_system": "Windows"
  }
}
```

---

## 7. 响应格式

### 7.1 成功响应
```javascript
{
  "success": true,
  "data": {...}  // 或 message
}
```

### 7.2 错误响应
```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 7.3 错误码
| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `UNAUTHORIZED` | 未授权 | 401 |
| `FORBIDDEN` | 禁止访问 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `INVALID_INPUT` | 输入无效 | 400 |
| `INVALID_JSON` | JSON 格式错误 | 400 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

---

## 8. 数据库操作

### 8.1 查询示例
```javascript
const DB = env.DB || env.rualive;

// 单行查询
const user = await DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();

// 多行查询
const users = await DB.prepare(
  'SELECT * FROM users LIMIT ? OFFSET ?'
).bind(limit, offset).all();

// 插入
const result = await DB.prepare(
  'INSERT INTO users (id, username, email) VALUES (?, ?, ?)'
).bind(id, username, email).run();

// 更新
const result = await DB.prepare(
  'UPDATE users SET username = ? WHERE id = ?'
).bind(newUsername, userId).run();

// 删除
const result = await DB.prepare(
  'DELETE FROM users WHERE id = ?'
).bind(userId).run();
```

### 8.2 事务处理
```javascript
// D1 不支持事务，需要手动处理
try {
  // 操作1
  await DB.prepare(sql1).bind(params1).run();
  
  // 操作2
  await DB.prepare(sql2).bind(params2).run();
  
  return { success: true };
} catch (error) {
  console.error('Transaction failed:', error);
  return { success: false, error: error.message };
}
```

---

## 9. 安全性

### 9.1 输入验证
```javascript
// 验证必填字段
if (!data.email || !data.password) {
  return errorResponse('Missing required fields', 'INVALID_INPUT', 400);
}

// 验证邮箱格式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(data.email)) {
  return errorResponse('Invalid email format', 'INVALID_EMAIL', 400);
}

// 验证密码长度
if (data.password.length < 6) {
  return errorResponse('Password too short', 'PASSWORD_TOO_SHORT', 400);
}
```

### 9.2 SQL 注入防护
```javascript
// ✅ 正确：使用参数化查询
const result = await DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).run();

// ❌ 错误：字符串拼接
// const result = DB.prepare('SELECT * FROM users WHERE id = ' + userId).run();
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成