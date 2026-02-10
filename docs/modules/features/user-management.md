# 用户管理功能文档

> 用户注册、登录、邀请码管理和权限控�?
---

## 概述

用户管理功能负责处理用户的注册、登录、认证和权限管理，包括邀请码系统以确保系统的安全性�?
---

## 核心功能

### 1. 用户注册

**API 端点**: `POST /api/auth/register`

**认证**: 不需�?
**请求参数**:
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123",
  "inviteCode": "ABCD-1234"
}
```

**验证逻辑**:
- 邮箱格式验证
- 密码长度验证（最�?6 位）
- 邀请码有效性验�?- 邮箱唯一性检�?
**注册流程**:
1. 验证所有必填字�?2. 检查邮箱是否已存在
3. 验证邀请码有效�?4. 检查邀请码是否过期
5. 检查邀请码使用次数
6. 创建用户记录
7. 更新邀请码使用次数
8. 创建用户配置

**错误处理**:
```json
{
  "success": false,
  "error": "无效的邀请码"
}
```

### 2. 用户登录

**API 端点**: `POST /api/auth/login`

**认证**: 不需�?
**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**登录流程**:
1. 查询用户记录
2. 验证密码（bcrypt�?3. 生成 JWT Token�?0 天有效期�?4. 返回用户信息�?Token

**响应格式**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "testuser",
    "role": "user"
  }
}
```

### 3. 邀请码系统

**创建邀请码**:
```javascript
// API 端点: POST /api/admin/invite-codes
POST https://rualive.itycon.cn/api/admin/invite-codes
```

**邀请码格式**: `XXXX-XXXX`�? 个字符，大写字母和数字）

**邀请码属�?*:
- **唯一�?*: 每个邀请码全局唯一
- **有效�?*: 可设置过期时间（可选）
- **使用次数**: 可设置最大使用次�?- **状�?*: 可激�?禁用

**数据库表结构**:
```sql
CREATE TABLE invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**邀请码验证逻辑**:
```javascript
async function validateInviteCode(code, env) {
  const inviteCode = await DB.prepare(
    'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1'
  ).bind(code).first();

  if (!inviteCode) {
    return { valid: false, error: '无效的邀请码' };
  }

  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return { valid: false, error: '邀请码已过�? };
  }

  if (inviteCode.used_count >= inviteCode.max_uses) {
    return { valid: false, error: '邀请码已用�? };
  }

  return { valid: true, inviteCode };
}
```

### 4. 密码管理

**修改密码**:
```javascript
// API 端点: POST /api/auth/change-password
POST https://rualive.itycon.cn/api/auth/change-password
```

**请求参数**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**验证逻辑**:
- 验证当前密码
- 新密码长度验证（最�?6 位）
- 新密码不能与当前密码相同
- 使用 bcrypt 加密新密�?
**密码重置（管理员�?*:
```javascript
// API 端点: POST /api/admin/users/:id/reset-password
POST https://rualive.itycon.cn/api/admin/users/user_123/reset-password
```

**重置模式**:
1. **自动生成**: 系统生成 12 位随机密�?2. **自定�?*: 管理员设置自定义密码

**重置流程**:
1. 生成新密码（如果未提供）
2. 使用 bcrypt 加密
3. 更新数据�?4. 发送邮件通知用户

### 5. 用户权限管理

**用户角色**:
- **admin**: 管理员，拥有所有权�?- **user**: 普通用户，仅限个人数据访问

**权限控制**:
```javascript
// API 端点权限检查示�?async function verifyAdmin(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await verifyToken(token, env);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}
```

**需要管理员权限的端�?*:
- `/api/admin/invite-codes` (GET/POST/DELETE)
- `/api/admin/users` (GET/DELETE)
- `/api/admin/users/:id/reset-password` (POST)
- `/api/admin/users/:id/email-limit` (POST)
- `/api/admin/api-key` (GET/POST/DELETE)

---

## 前端集成

### 注册表单

**注册表单字段**:
```tsx
<form onSubmit={handleRegister}>
  {/* 用户名（仅注册时显示�?*/}
  <input name="username" placeholder="K帧高�? />
  
  {/* 邮箱 */}
  <input name="email" placeholder="animator@rualive.com" />
  
  {/* 密码 */}
  <input name="password" type="password" placeholder="••••••••�? />
  
  {/* 邀请码（仅注册时显示） */}
  <input name="inviteCode" placeholder="ABCD-1234" />
  
  <button type="submit">创建账户</button>
</form>
```

**路由处理**:
- `/login` - 登录模式
- `/login#register` - 注册模式
- `/register` - 注册模式（兼容旧版）

### React Hooks

```typescript
// 用户统计 Hook
function useUserCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/stats/users')
      .then(res => res.json())
      .then(data => setCount(data.count));
  }, []);

  return count;
}

// 认证 Hook
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rualive_token');
    const userStr = localStorage.getItem('rualive_user');
    
    if (token && userStr) {
      setUser(JSON.parse(userStr));
    }
    
    setLoading(false);
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

---

## 安全考虑

### 密码安全
- 所有密码使�?bcrypt 加密存储（salt rounds: 10�?- 密码最小长�?6 �?- 禁止使用弱密�?
### Token 安全
- JWT Token 有效�?30 �?- Token 存储�?localStorage
- 敏感操作需要验�?Token

### 邀请码安全
- 邀请码唯一性保�?- 邀请码可设置过期时�?- 邀请码可设置最大使用次�?- 邀请码可被管理员禁�?
### API 安全
- 所有需要认证的端点检�?JWT Token
- 管理员功能验证用户角�?- 输入数据验证和清�?
---

## 数据库表结构

### users �?```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email_limit INTEGER DEFAULT 100,
  force_password_reset INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### invite_codes �?```sql
CREATE TABLE invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### sessions �?```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);
```

---

## 管理后台功能

### 邀请码管理
- 查看所有邀请码列表
- 创建新邀请码
- 删除邀请码
- 查看邀请码使用状�?
### 用户管理
- 查看所有用户列�?- 删除用户
- 重置用户密码
- 设置用户邮件限制
- 查看用户统计

---

**文档版本**: 1.0
**最后更�?*: 2026-02-10
**作�?*: iFlow CLI
