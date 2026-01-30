# RuAlive 管理后台功能列表与 API 清单

> 生成时间: 2026-01-30  
> 用途: 重新设计管理路由前端参考

---

## 一、页面结构

当前管理后台为单页面应用（SPA），包含以下主要功能模块：

```
/admin
├── 邀请码管理 (Invite Codes)
├── 用户管理 (Users)
├── API密钥管理 (API Key)
└── 邮件发送日志 (Email Logs)
```

---

## 二、功能模块详细说明

### 1. 邀请码管理

#### 功能列表
- 查看所有邀请码列表
- 创建新邀请码（可设置最大使用次数和有效期）
- 删除邀请码
- 查看邀请码使用状态（已用次数/最大次数）

#### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/invite-codes` | GET | 获取所有邀请码列表 |
| `/api/admin/invite-codes` | POST | 创建新邀请码 |
| `/api/admin/invite-codes` | DELETE | 删除邀请码 |

#### API 请求/响应示例

**GET /api/admin/invite-codes**
```json
// 响应
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

**POST /api/admin/invite-codes**
```json
// 请求
{
  "maxUses": 10,
  "expiresInDays": 30
}

// 响应
{
  "success": true,
  "inviteCode": {
    "id": "code_456",
    "code": "ALIVE-XYZW"
  }
}
```

**DELETE /api/admin/invite-codes**
```json
// 请求（query参数）
?codeId=code_123

// 响应
{
  "success": true,
  "message": "邀请码已删除"
}
```

---

### 2. 用户管理

#### 功能列表
- 查看所有用户列表
- 查看用户详情（基本信息、邮件统计、邮件限制）
- 删除用户
- 重置用户密码（支持自动生成或手动设置）
- 查看用户邮件发送统计
- 设置用户邮件发送限制

#### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/users` | GET | 获取所有用户列表 |
| `/api/admin/users/:userId` | DELETE | 删除用户 |
| `/api/admin/users/:userId/reset-password` | POST | 重置用户密码 |
| `/api/admin/users/:userId/email-stats` | GET | 获取用户邮件统计 |
| `/api/admin/users/:userId/email-limit` | POST | 设置用户邮件限制 |
| `/api/admin/users/:userId/email-limit-status` | GET | 获取用户邮件限制状态 |

#### API 请求/响应示例

**GET /api/admin/users**
```json
// 响应
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

**DELETE /api/admin/users/:userId**
```json
// 响应
{
  "success": true,
  "message": "用户已删除"
}
```

**POST /api/admin/users/:userId/reset-password**
```json
// 请求（自动生成）
{
  "method": "generate",
  "forceReset": true
}

// 请求（手动设置）
{
  "method": "set",
  "newPassword": "newPassword123",
  "forceReset": true
}

// 响应（自动生成）
{
  "success": true,
  "message": "密码已重置",
  "method": "generate",
  "emailSent": true
}

// 响应（手动设置）
{
  "success": true,
  "message": "密码已重置",
  "method": "set",
  "emailSent": false
}
```

**GET /api/admin/users/:userId/email-stats**
```json
// 响应
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

**POST /api/admin/users/:userId/email-limit**
```json
// 请求
{
  "dailyLimit": 20,
  "enabled": true
}

// 响应
{
  "success": true,
  "message": "邮件限制已更新"
}
```

**GET /api/admin/users/:userId/email-limit-status**
```json
// 响应
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

#### 功能列表
- 查看当前API密钥（脱敏显示）
- 设置新API密钥
- 删除API密钥
- 测试API密钥连接

#### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/api-key` | GET | 获取API密钥（脱敏） |
| `/api/admin/api-key` | POST | 设置新API密钥 |
| `/api/admin/api-key` | DELETE | 删除API密钥 |
| `/api/admin/api-key/test` | POST | 测试API密钥 |

#### API 请求/响应示例

**GET /api/admin/api-key**
```json
// 响应
{
  "success": true,
  "apiKey": "resend_***********xyz"  // 脱敏显示
}
```

**POST /api/admin/api-key**
```json
// 请求
{
  "apiKey": "re_xxxxxxxxxxxxxxxx"
}

// 响应
{
  "success": true,
  "message": "API密钥已设置"
}
```

**DELETE /api/admin/api-key**
```json
// 响应
{
  "success": true,
  "message": "API密钥已删除"
}
```

**POST /api/admin/api-key/test**
```json
// 响应
{
  "success": true,
  "message": "API密钥有效"
}
```

---

### 4. 邮件发送日志

#### 功能列表
- 查看所有邮件发送日志
- 查看邮件发送统计（总数、成功、失败）
- 按用户筛选邮件日志
- 查看邮件发送详情（收件人、主题、时间、状态）

#### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/email-stats` | GET | 获取全局邮件统计 |
| `/api/logs` | GET | 获取邮件发送日志 |

#### API 请求/响应示例

**GET /api/admin/email-stats**
```json
// 响应
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

**GET /api/logs**
```json
// 请求参数
?limit=50&offset=0&userId=user_123

// 响应
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

## 三、公共API（需要认证）

以下API所有用户（包括管理员和普通用户）都可以访问：

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/user` | GET | 获取当前用户信息 |
| `/api/auth/change-password` | POST | 修改密码 |
| `/api/config` | GET | 获取用户配置 |
| `/api/config` | POST | 更新用户配置 |
| `/api/work-data` | POST | 上传工作数据 |
| `/api/send-now` | POST | 立即发送邮件 |
| `/api/projects/summary` | GET | 获取项目汇总 |
| `/api/projects/history` | GET | 获取项目历史 |

---

## 四、认证说明

所有管理后台API都需要管理员权限认证：

**请求头：**
```
Authorization: Bearer <token>
```

**认证流程：**
1. 用户登录获取token
2. 将token存储在 `localStorage['rualive_token']`
3. 每次请求在请求头中携带token
4. 后端验证token和用户角色（role: 'admin'）

---

## 五、数据结构

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

## 六、错误码说明

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

## 七、注意事项

1. **管理员权限验证**：所有管理API都会验证用户角色是否为 `admin`
2. **密码安全**：所有密码相关操作都使用 bcrypt 进行哈希
3. **分页支持**：列表API支持 `limit` 和 `offset` 参数进行分页
4. **数据脱敏**：敏感数据（如API密钥）在返回时进行脱敏处理
5. **邮件限制**：用户级别的邮件限制基于日历日（每天重置）
6. **项目ID生成**：项目ID基于文件路径哈希生成，确保唯一性

---

## 八、设计建议

### 前端设计要点
1. **Tab切换**：使用Tab组件切换不同功能模块
2. **权限控制**：根据用户角色显示/隐藏管理功能
3. **加载状态**：所有API调用都应显示加载状态
4. **错误处理**：统一的错误提示机制
5. **确认操作**：删除用户、重置密码等危险操作需要二次确认
6. **实时更新**：考虑使用WebSocket或轮询实现实时数据更新

### UI/UX 建议
1. **响应式设计**：支持桌面和移动端
2. **暗色主题**：保持与整体风格一致
3. **拟态窗**：详情查看、确认操作使用模态窗
4. **数据可视化**：邮件统计可使用图表展示
5. **搜索过滤**：用户列表支持搜索和过滤功能

---

**文档版本**: 1.0  
**最后更新**: 2026-01-30