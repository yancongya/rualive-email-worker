# 认证 API 文档

## 概述

认证 API 提供用户注册、登录、登出、获取当前用户信息、修改密码等功能�?
## 基础信息

- **基础路径**: `/api/auth`
- **认证方式**: JWT Token
- **Token 有效�?*: 30 �?
---

## API 端点

### 1. 用户注册

**端点**: `/api/auth/register`
**方法**: `POST`
**认证**: 不需�?
#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | �?| 用户邮箱 |
| username | string | �?| 用户�?|
| password | string | �?| 密码（最�?个字符） |
| inviteCode | string | �?| 邀请码 |

#### 请求示例

```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123",
  "inviteCode": "ABCD-1234"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "testuser",
      "role": "user",
      "created_at": "2026-02-07T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "邀请码无效或已过期",
  "code": "INVALID_INVITE_CODE"
}
```

**错误响应** (409):
```json
{
  "success": false,
  "error": "邮箱已被注册",
  "code": "EMAIL_EXISTS"
}
```

---

### 2. 用户登录

**端点**: `/api/auth/login`
**方法**: `POST`
**认证**: 不需�?
#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | �?| 用户邮箱 |
| password | string | �?| 密码 |

#### 请求示例

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "testuser",
      "role": "user",
      "email_limit": 100,
      "created_at": "2026-02-07T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "邮箱或密码错�?,
  "code": "INVALID_CREDENTIALS"
}
```

---

### 3. 用户登出

**端点**: `/api/auth/logout`
**方法**: `POST`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "登出成功"
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "未授�?,
  "code": "UNAUTHORIZED"
}
```

---

### 4. 获取当前用户信息

**端点**: `/api/auth/me`
**方法**: `GET`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "testuser",
    "role": "user",
    "email_limit": 100,
    "force_password_reset": 0,
    "created_at": "2026-02-07T12:00:00.000Z",
    "updated_at": "2026-02-07T12:00:00.000Z"
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "Token 过期或无�?,
  "code": "UNAUTHORIZED"
}
```

---

### 5. 更新当前用户信息

**端点**: `/api/auth/me`
**方法**: `PUT`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | �?| 新用户名 |
| email | string | �?| 新邮�?|

#### 请求示例

```json
{
  "username": "newusername"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "newusername",
    "role": "user",
    "updated_at": "2026-02-07T13:00:00.000Z"
  }
}
```

**错误响应** (409):
```json
{
  "success": false,
  "error": "用户名已被使�?,
  "code": "USERNAME_EXISTS"
}
```

---

### 6. 修改密码

**端点**: `/api/auth/change-password`
**方法**: `POST`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | string | �?| 当前密码 |
| newPassword | string | �?| 新密码（最�?个字符） |

#### 请求示例

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "当前密码不正�?,
  "code": "INVALID_CURRENT_PASSWORD"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "新密码长度不能少�?个字�?,
  "code": "PASSWORD_TOO_SHORT"
}
```

---

### 7. 初始化管理员

**端点**: `/api/auth/init`
**方法**: `POST`
**认证**: 不需�?
#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | �?| 管理员邮�?|
| username | string | �?| 管理员用户名 |
| password | string | �?| 密码（最�?个字符） |

#### 请求示例

```json
{
  "email": "admin@example.com",
  "username": "admin",
  "password": "adminpassword123"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "admin_123",
      "email": "admin@example.com",
      "username": "admin",
      "role": "admin",
      "created_at": "2026-02-07T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应** (409):
```json
{
  "success": false,
  "error": "系统已初始化，无法重复创建管理员",
  "code": "ALREADY_INITIALIZED"
}
```

---

### 8. 重置管理员密�?
**端点**: `/api/auth/reset-admin-password`
**方法**: `POST`
**认证**: 需要（仅管理员�?
#### 请求�?
```
Authorization: Bearer <admin_token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newPassword | string | �?| 新密码（如果不提供则自动生成12位随机密码） |

#### 请求示例

**自定义密�?*:
```json
{
  "newPassword": "newAdminPassword123"
}
```

**自动生成密码**:
```json
{}
```

#### 响应示例

**成功响应** (200) - 自定义密�?
```json
{
  "success": true,
  "message": "管理员密码已重置"
}
```

**成功响应** (200) - 自动生成:
```json
{
  "success": true,
  "message": "管理员密码已重置",
  "newPassword": "aB3xY9zP2qL5"
}
```

**错误响应** (403):
```json
{
  "success": false,
  "error": "权限不足",
  "code": "FORBIDDEN"
}
```

---

### 9. 调试管理员信�?
**端点**: `/api/auth/debug-admin`
**方法**: `GET`
**认证**: 不需要（仅用于调试）

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "adminExists": true,
    "admin": {
      "id": "admin_123",
      "email": "admin@example.com",
      "username": "admin",
      "role": "admin",
      "created_at": "2026-02-07T12:00:00.000Z"
    }
  }
}
```

**响应示例** - 管理员不存在 (200):
```json
{
  "success": true,
  "data": {
    "adminExists": false,
    "admin": null
  }
}
```

---

## 错误码说�?
| 错误�?| HTTP 状态码 | 说明 |
|--------|-------------|------|
| INVALID_INVITE_CODE | 400 | 邀请码无效或已过期 |
| INVALID_CREDENTIALS | 401 | 邮箱或密码错�?|
| UNAUTHORIZED | 401 | 未授权或 Token 过期 |
| USERNAME_EXISTS | 409 | 用户名已被使�?|
| EMAIL_EXISTS | 409 | 邮箱已被注册 |
| INVALID_CURRENT_PASSWORD | 400 | 当前密码不正�?|
| PASSWORD_TOO_SHORT | 400 | 密码长度不足 |
| ALREADY_INITIALIZED | 409 | 系统已初始化 |
| FORBIDDEN | 403 | 权限不足 |

---

## 使用示例

### 用户注册并登�?
```bash
# 1. 用户注册
curl -X POST https://rualive.itycon.cn/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123",
    "inviteCode": "ABCD-1234"
  }'

# 2. 用户登录
curl -X POST https://rualive.itycon.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 3. 使用 Token 获取用户信息
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET https://rualive.itycon.cn/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. 修改密码
curl -X POST https://rualive.itycon.cn/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'

# 5. 登出
curl -X POST https://rualive.itycon.cn/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## 安全注意事项

1. **密码安全**:
   - 所有密码使�?bcrypt 哈希存储
   - 最小密码长度：6 个字�?   - 建议：使用强密码（包含大小写字母、数字、特殊字符）

2. **Token 安全**:
   - Token 有效期：30 �?   - Token 存储：建议使�?localStorage �?sessionStorage
   - Token 泄露：立即登出并重新登录

3. **HTTPS**:
   - 生产环境必须使用 HTTPS
   - 防止中间人攻�?
4. **输入验证**:
   - 邮箱格式验证
   - 用户名长度和格式验证
   - 密码长度验证

---

**文档版本**: 1.0
**最后更�?*: 2026-02-08
**作�?*: iFlow CLI
