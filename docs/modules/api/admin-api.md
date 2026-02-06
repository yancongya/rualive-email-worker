# 管理后台 API 文档

> 生成时间: 2026-01-30  
> 用途: 管理后台前端开发API参考

---

## 一、管理后台 API 端点

### 1. 邀请码管理

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/invite-codes` | GET | 获取所有邀请码列表 |
| `/api/admin/invite-codes` | POST | 创建新邀请码 |
| `/api/admin/invite-codes` | DELETE | 删除邀请码 |

#### GET /api/admin/invite-codes
获取所有邀请码列表

**响应示例：**
```json
{
  "success": true,
  "inviteCodes": [
    {
      "id": "code_123",
      "code": "ALIVE-ABCD",
      "maxUses": 10,
      "usedCount": 5,
      "expiresAt": "2026-02-30T00:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/admin/invite-codes
创建新邀请码

**请求示例：**
```json
{
  "maxUses": 10,
  "expiresInDays": 30
}
```

**响应示例：**
```json
{
  "success": true,
  "inviteCode": {
    "id": "code_456",
    "code": "ALIVE-XYZW"
  }
}
```

#### DELETE /api/admin/invite-codes
删除邀请码

**请求参数（query）：**
```
?codeId=code_123
```

**响应示例：**
```json
{
  "success": true,
  "message": "邀请码已删除"
}
```

---

### 2. 用户管理

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/users` | GET | 获取所有用户列表 |
| `/api/admin/users/:userId` | DELETE | 删除用户 |
| `/api/admin/users/:userId/reset-password` | POST | 重置用户密码 |
| `/api/admin/users/:userId/email-stats` | GET | 获取用户邮件统计 |
| `/api/admin/users/:userId/email-limit` | POST | 设置用户邮件限制 |
| `/api/admin/users/:userId/email-limit-status` | GET | 获取用户邮件限制状态 |

#### GET /api/admin/users
获取所有用户列表

**响应示例：**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_123",
      "username": "烟囱鸭",
      "email": "2655283737@qq.com",
      "role": "user",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### DELETE /api/admin/users/:userId
删除用户

**响应示例：**
```json
{
  "success": true,
  "message": "用户已删除"
}
```

#### POST /api/admin/users/:userId/reset-password
重置用户密码

**请求示例（自动生成）：**
```json
{
  "method": "generate",
  "forceReset": true
}
```

**请求示例（手动设置）：**
```json
{
  "method": "set",
  "newPassword": "newPassword123",
  "forceReset": true
}
```

**响应示例（自动生成）：**
```json
{
  "success": true,
  "message": "密码已重置",
  "method": "generate",
  "emailSent": true
}
```

**响应示例（手动设置）：**
```json
{
  "success": true,
  "message": "密码已重置",
  "method": "set",
  "emailSent": false
}
```

#### GET /api/admin/users/:userId/email-stats
获取用户邮件统计

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "username": "烟囱鸭",
    "email": "2655283737@qq.com",
    "totalEmailsSent": 150,
    "totalEmailsFailed": 5,
    "lastEmailSentAt": "2026-01-30T18:00:00Z",
    "emailLimit": {
      "dailyLimit": 10,
      "emailsSentToday": 5,
      "remainingToday": 5
    }
  }
}
```

#### POST /api/admin/users/:userId/email-limit
设置用户邮件限制

**请求示例：**
```json
{
  "dailyLimit": 20,
  "enabled": true
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "邮件限制已更新"
}
```

#### GET /api/admin/users/:userId/email-limit-status
获取用户邮件限制状态

**响应示例：**
```json
{
  "success": true,
  "data": {
    "dailyLimit": 10,
    "emailsSentToday": 5,
    "remainingToday": 5,
    "enabled": true,
    "resetAt": "2026-01-31T00:00:00Z"
  }
}
```

---

### 3. API密钥管理

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/api-key` | GET | 获取API密钥（脱敏） |
| `/api/admin/api-key` | POST | 设置新API密钥 |
| `/api/admin/api-key` | DELETE | 删除API密钥 |
| `/api/admin/api-key/test` | POST | 测试API密钥 |

#### GET /api/admin/api-key
获取API密钥（脱敏显示）

**响应示例：**
```json
{
  "success": true,
  "apiKey": "resend_***********xyz"
}
```

#### POST /api/admin/api-key
设置新API密钥

**请求示例：**
```json
{
  "apiKey": "re_xxxxxxxxxxxxxxxx"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "API密钥已设置"
}
```

#### DELETE /api/admin/api-key
删除API密钥

**响应示例：**
```json
{
  "success": true,
  "message": "API密钥已删除"
}
```

#### POST /api/admin/api-key/test
测试API密钥

**响应示例：**
```json
{
  "success": true,
  "message": "API密钥有效"
}
```

---

### 4. 邮件发送日志

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/email-stats` | GET | 获取全局邮件统计 |
| `/api/logs` | GET | 获取邮件发送日志 |

#### GET /api/admin/email-stats
获取全局邮件统计

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalEmailsSent": 1000,
    "totalEmailsFailed": 20,
    "successRate": 98.0,
    "last24Hours": {
      "sent": 50,
      "failed": 2
    },
    "lastEmailSentAt": "2026-01-30T18:00:00Z"
  }
}
```

#### GET /api/logs
获取邮件发送日志

**请求参数：**
```
?limit=50&offset=0&userId=user_123
```

**响应示例：**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "userId": "user_123",
      "recipient": "2655283737@qq.com",
      "subject": "RuAlive 密码重置通知",
      "status": "success",
      "sentAt": "2026-01-30T18:00:00Z",
      "error": null
    }
  ],
  "total": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 二、数据结构

### 用户数据结构
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}
```

### 邀请码数据结构
```typescript
interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}
```

### 邮件统计数据结构
```typescript
interface EmailStats {
  userId: string;
  username: string;
  email: string;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  lastEmailSentAt: string;
  emailLimit: {
    dailyLimit: number;
    emailsSentToday: number;
    remainingToday: number;
  };
}
```

---

## 三、错误码说明

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或token无效 |
| 403 | 权限不足（非管理员） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式：**
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

---

## 四、认证说明

### 请求头
所有管理后台API都需要管理员权限认证：

```
Authorization: Bearer <token>
```

### 认证流程
1. 用户登录获取token
2. 将token存储在 `localStorage['rualive_token']`
3. 每次请求在请求头中携带token
4. 后端验证token和用户角色（role: 'admin'）

---

## 五、注意事项

1. **管理员权限验证**：所有管理API都会验证用户角色是否为 `admin`
2. **密码安全**：所有密码相关操作都使用 bcrypt 进行哈希
3. **分页支持**：列表API支持 `limit` 和 `offset` 参数进行分页
4. **数据脱敏**：敏感数据（如API密钥）在返回时进行脱敏处理
5. **邮件限制**：用户级别的邮件限制基于日历日（每天重置）
6. **项目ID生成**：项目ID基于文件路径哈希生成，确保唯一性

---

**文档版本**: 1.0  
**最后更新**: 2026-01-30