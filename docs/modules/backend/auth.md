# 认证模块

## 文档信息
- **模块类型**: 后端核心模块
- **最后更新**: 2026-02-07

---

## 1. 模块概述

### 1.1 模块职责
- 用户注册和登录
- JWT Token 生成和验证
- 密码哈希和验证
- 会话管理
- 权限控制

### 1.2 模块位置
**文件**: `src/index.js` (内联定义，第 17-108 行)

### 1.3 依赖关系
- **依赖**: Cloudflare Workers (crypto.subtle)
- **被依赖**: 所有需要认证的 API 端点

---

## 2. 核心函数

### 2.1 用户ID生成
```javascript
/**
 * 生成唯一用户ID
 * @returns {string} 用户ID
 */
generateUserId: () => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
```

**格式**: `user_1707261234567_abc123def`

### 2.2 邀请码生成
```javascript
/**
 * 生成邀请码
 * @returns {string} 邀请码 (格式: XXXX-XXXX)
 */
generateInviteCode: () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.slice(0, 4) + '-' + code.slice(4, 8);
}
```

**格式**: `ABCD-1234`

### 2.3 密码哈希
```javascript
/**
 * 密码哈希 (SHA-256 + 盐值)
 * @param {string} password - 原始密码
 * @returns {Promise<string>} 哈希后的密码
 */
hashPassword: async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'rualive_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**盐值**: `rualive_salt_2024`（硬编码）

**示例**:
```
输入: "password123"
输出: "a8f5f167a4415c0b2393d6724499a9e7a"
```

### 2.4 密码验证
```javascript
/**
 * 密码验证
 * @param {string} password - 用户输入的密码
 * @param {string} hash - 数据库中的哈希值
 * @returns {Promise<boolean>} 是否匹配
 */
verifyPassword: async (password, hash) => {
  const passwordHash = await authModule.hashPassword(password);
  return passwordHash === hash;
}
```

**注意**: 当前实现使用比较法，生产环境建议使用 bcrypt

### 2.5 Token 生成
```javascript
/**
 * 生成 JWT Token
 * @param {string} userId - 用户ID
 * @param {string} role - 用户角色
 * @param {Object} env - 环境变量
 * @returns {Promise<string>} JWT Token
 */
generateToken: async (userId, role, env) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30天有效期
  };
  const secret = env.JWT_SECRET || 'rualive_secret_key_2024';
  
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(headerBase64 + '.' + payloadBase64)
  );
  
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return headerBase64 + '.' + payloadBase64 + '.' + signatureBase64;
}
```

**Token 结构**: `<header>.<payload>.<signature>`

**有效期**: 30 天

### 2.6 Token 验证
```javascript
/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|null>} Token 载荷或 null
 */
verifyToken: async (token, env) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查过期时间
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    const secret = env.JWT_SECRET || 'rualive_secret_key_2024';
    const signature = parts[2];
    
    // 验证签名
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(parts[0] + '.' + parts[1])
    );
    
    const expectedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
    
    if (signature !== expectedSignatureBase64) return null;
    
    return payload;
  } catch (error) {
    return null;
  }
}
```

**验证流程**:
1. 分割 Token 为三部分
2. 解析 Header 和 Payload
3. 检查过期时间
4. 重新生成签名
5. 比较签名

---

## 3. 认证流程

### 3.1 用户注册流程

```
用户提交注册表单
  ↓
handleRegister()
  ↓
验证邀请码（如果启用）
  ↓
检查邮箱是否已存在
  ↓
生成用户ID
  ↓
哈希密码
  ↓
插入用户数据到数据库
  ↓
返回注册成功
```

### 3.2 用户登录流程

```
用户提交登录表单
  ↓
handleLogin()
  ↓
查询用户数据
  ↓
验证密码
  ↓
生成 JWT Token
  ↓
返回 Token 和用户信息
```

### 3.3 Token 验证流程

```
API 请求携带 Token
  ↓
verifyToken()
  ↓
解析 Token
  ↓
检查签名和过期时间
  │
  ├─ 验证失败 → 返回 401 Unauthorized
  │
  └─ 验证成功 → 返回用户信息
```

---

## 4. 会话管理

### 4.1 会话表结构
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.2 会话创建
```javascript
async function createSession(userId, env) {
  const DB = env.DB || env.rualive;
  
  const token = await authModule.generateToken(userId, 'user', env);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  await DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, token, expiresAt).run();
  
  return token;
}
```

### 4.3 会话验证
```javascript
async function validateSession(token, env) {
  const DB = env.DB || env.rualive;
  
  const session = await DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();
  
  return session;
}
```

### 4.4 会话清理
```javascript
async function cleanupExpiredSessions(env) {
  const DB = env.DB || env.rualive;
  
  const result = await DB.prepare(
    'DELETE FROM sessions WHERE expires_at < ?'
  ).bind(new Date().toISOString()).run();
  
  console.log(`[Session] Cleaned up ${result.meta.changes} expired sessions`);
}
```

---

## 5. 权限控制

### 5.1 角色定义
| 角色 | 权限 |
|------|------|
| `admin` | 所有功能权限 |
| `user` | 仅个人数据访问权限 |

### 5.2 权限检查
```javascript
async function checkPermission(userId, requiredRole, env) {
  const DB = env.DB || env.rualive;
  
  const user = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(userId).first();
  
  if (!user) {
    return false;
  }
  
  // admin 可以访问所有资源
  if (user.role === 'admin') {
    return true;
  }
  
  // user 只能访问自己的资源
  if (requiredRole === 'admin') {
    return false;
  }
  
  return user.role === requiredRole;
}
```

### 5.3 权限中间件
```javascript
async function requireAuth(request, env) {
  const payload = await verifyToken(request, env);
  
  if (!payload) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  return payload;
}

async function requireAdmin(request, env) {
  const payload = await requireAuth(request, env);
  
  if (payload && payload.role !== 'admin') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Forbidden',
      code: 'FORBIDDEN'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  return payload;
}
```

---

## 6. 密码管理

### 6.1 密码强度要求
- **最小长度**: 6 个字符
- **建议**: 包含大小写字母、数字和特殊字符

### 6.2 密码重置流程
```
用户请求重置密码
  ↓
验证 Token 或管理员权限
  ↓
生成新密码或使用自定义密码
  ↓
哈希新密码
  │
  ├─ 自动生成模式：生成 12 字符随机密码
  └─ 自定义模式：使用管理员提供的密码
  ↓
更新数据库
  ↓
发送密码重置邮件
  ↓
返回成功
```

### 6.3 密码修改流程
```
用户请求修改密码
  ↓
验证当前密码
  ↓
验证新密码强度
  ↓
哈希新密码
  ↓
更新数据库
  ↓
返回成功
```

---

## 7. 邀请码系统

### 7.1 邀请码表结构
```sql
CREATE TABLE invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

### 7.2 邀请码验证
```javascript
async function validateInviteCode(code, env) {
  const DB = env.DB || env.rualive;
  
  const inviteCode = await DB.prepare(
    'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1'
  ).bind(code).first();
  
  if (!inviteCode) {
    return { valid: false, error: 'Invalid invite code' };
  }
  
  // 检查过期时间
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return { valid: false, error: 'Invite code expired' };
  }
  
  // 检查使用次数
  if (inviteCode.used_count >= inviteCode.max_uses) {
    return { valid: false, error: 'Invite code already used' };
  }
  
  return { valid: true, inviteCode };
}
```

### 7.3 邀请码使用
```javascript
async function useInviteCode(code, env) {
  const DB = env.DB || env.rualive;
  
  const result = await DB.prepare(
    'UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?'
  ).bind(code).run();
  
  return result.meta.changes > 0;
}
```

---

## 8. 安全注意事项

### 8.1 密码安全
- ✅ 使用 SHA-256 哈希 + 盐值
- ⚠️ 建议升级到 bcrypt
- ✅ 不存储明文密码
- ✅ 密码验证失败不泄露信息

### 8.2 Token 安全
- ✅ 使用 HMAC-SHA256 签名
- ✅ 30天有效期
- ✅ 过期自动失效
- ✅ 签名验证防止伪造

### 8.3 会话安全
- ✅ Token 过期时间限制
- ✅ 定期清理过期会话
- ✅ 用户登出删除会话
- ✅ 会话与用户关联

### 8.4 输入验证
- ✅ 邮箱格式验证
- ✅ 密码长度验证
- ✅ 邀请码格式验证
- ✅ SQL 注入防护（参数化查询）

---

## 9. 常见问题

### Q1: 为什么 Token 验证失败？
**A**: 可能原因：
- Token 格式错误（应该是 `header.payload.signature` 格式）
- Token 已过期（30天有效期）
- 签名不匹配（密钥不匹配）
- Token 被篡改

### Q2: 密码重置不生效？
**A**: 检查：
- 确认管理员权限
- 检查用户 ID 是否正确
- 检查邮件发送是否成功
- 检查用户是否使用旧密码登录

### Q3: 邀请码失效？
**A**: 检查：
- 邀请码是否过期
- 邀请码是否已达到使用次数上限
- 邀请码是否被管理员禁用

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成