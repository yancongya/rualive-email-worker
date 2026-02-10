# 路由管理方案

## 概述

本文档详细说明了 RuAlive 项目的路由管理方案，包括页面路由和 API 路由的配置、处理逻辑和维护指南。

## 路由架构

### 路由类型

项目中有两种类型的路由：

1. **SPA 路由**（Single Page Application）
   - 由前端 React 应用处理
   - 所有页面路由返回同一个 HTML 文件
   - 前端根据 URL 切换不同的视图

2. **后端路由**
   - 由后端直接生成 HTML
   - 用于管理员仪表板等特殊页面

### 路由处理流程

```
用户请求 → 路由判断 → 返回相应页面 → 前端渲染
```

## 页面路由配置

### 根路由

| 路由 | 类型 | 文件 | 说明 |
|------|------|------|------|
| `/` | SPA | `index.html` | 落地页 |
| `/index.html` | SPA | `index.html` | 落地页 |

### 认证路由

| 路由 | 类型 | 文件 | 说明 |
|------|------|------|------|
| `/login` | SPA | `auth.html` | 登录/注册页 |
| `/register` | SPA | `auth.html` | 登录/注册页 |

### 用户路由

| 路由 | 类型 | 文件 | 说明 |
|------|------|------|------|
| `/user` | SPA | `index.html` | 用户面板 |
| `/user.html` | SPA | `index.html` | 用户面板 |

### 管理员路由

| 路由 | 类型 | 说明 |
|------|------|------|
| `/admin` | 后端 | 管理员仪表板 |
| `/admin.html` | 后端 | 管理员仪表板 |
| `/admin/` | 后端 | 管理员仪表板 |

## API 路由配置

所有 API 路由都以 `/api` 开头，便于管理和识别。

### 认证相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/auth/register` | POST | `handleRegister` | 用户注册 |
| `/api/auth/login` | POST | `handleLogin` | 用户登录 |
| `/api/auth/logout` | POST | `handleLogout` | 用户登出 |
| `/api/auth/me` | GET | `handleGetCurrentUser` | 获取当前用户信息 |
| `/api/auth/init` | POST | `handleInitAdmin` | 初始化管理员账户 |

### 管理员相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/admin/invite-codes` | GET | `handleGetInviteCodes` | 获取邀请码列表 |
| `/api/admin/invite-codes` | POST | `handleCreateInviteCodes` | 创建邀请码 |
| `/api/admin/invite-codes` | DELETE | `handleDeleteInviteCode` | 删除邀请码 |
| `/api/admin/users` | GET | `handleGetUsers` | 获取用户列表 |
| `/api/admin/api-key` | GET | `handleGetApiKey` | 获取 API 密钥 |
| `/api/admin/api-key` | POST | `handleGenerateApiKey` | 生成 API 密钥 |
| `/api/admin/api-key` | DELETE | `handleDeleteApiKey` | 删除 API 密钥 |
| `/api/admin/api-key/test` | POST | `handleTestApiKey` | 测试 API 密钥 |

### 配置相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/config` | GET | `handleGetConfig` | 获取用户配置 |
| `/api/config` | POST | `handleUpdateConfig` | 更新用户配置 |

### 统计相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/stats/users` | GET | `handleGetUserStats` | 获取用户统计数量 |

### 工作数据相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/work-data` | POST | `handleUploadWorkData` | 上传工作数据 |
| `/api/heartbeat` | POST | `handleHeartbeat` | 心跳检测 |

### AE 状态相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/ae-status` | GET | `handleGetAEStatus` | 获取 AE 状态 |
| `/api/ae-status` | POST | `handleUpdateAEStatus` | 更新 AE 状态 |

### 邮件相关

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/api/send-now` | POST | `handleSendNow` | 立即发送邮件 |
| `/api/logs` | GET | `handleGetLogs` | 获取发送日志 |
| `/api/work-logs` | GET | `handleGetWorkLogs` | 获取工作日志 |

### 健康检查

| 路由 | 方法 | 处理函数 | 说明 |
|------|------|----------|------|
| `/health` | GET | `handleHealth` | 健康检查 |

## 前端路由逻辑

### URL 初始化

前端 React 应用根据 URL 初始化视图：

```typescript
const [view, setView] = useState<'landing' | 'auth' | 'user'>(() => {
  const path = window.location.pathname;
  
  if (path === '/login' || path === '/register') {
    return 'auth';
  }
  
  if (path === '/user') {
    return 'user';
  }
  
  return 'landing';
});
```

### URL 变化监听

前端监听 URL 变化，自动切换视图：

```typescript
useEffect(() => {
  const checkUrlChange = () => {
    const path = window.location.pathname;
    
    if (path === '/login' || path === '/register') {
      setView('auth');
    } else if (path === '/user') {
      setView('user');
    } else {
      setView('landing');
    }
  };
  
  const intervalId = setInterval(checkUrlChange, 100);
  return () => clearInterval(intervalId);
}, []);
```

### 登录重定向

登录成功后根据用户角色重定向：

```typescript
if (data.user && data.user.role === 'admin') {
  window.location.href = '/admin';
} else {
  window.location.href = '/user';
}
```

### 用户验证

用户视图中的登录检查：

```typescript
const token = localStorage.getItem('rualive_token');
const user = localStorage.getItem('rualive_user');

if (!token || !user) {
  // 未登录，重定向到登录页
  useEffect(() => {
    window.location.href = '/login';
  }, []);
  return null;
}
```

## Token 管理

### Token 存储

```javascript
// 登录成功后保存
localStorage.setItem('rualive_token', data.token);
localStorage.setItem('rualive_user', JSON.stringify(data.user));

// 获取 token
const token = localStorage.getItem('rualive_token');
const user = JSON.parse(localStorage.getItem('rualive_user'));

// 清除 token
localStorage.removeItem('rualive_token');
localStorage.removeItem('rualive_user');
```

### Token 使用

```javascript
// 在 API 请求中使用
const headers = {
  'Authorization': 'Bearer ' + token
};
```

## 路由维护指南

### 添加新页面路由

1. 在 `routes.js` 中的 `PAGE_ROUTES` 添加路由配置
2. 在前端 `index.tsx` 中添加 URL 检查逻辑
3. 如果需要登录验证，添加 token 检查逻辑

### 添加新 API 路由

1. 在 `routes.js` 中的 `API_ROUTES` 添加路由配置
2. 在 `index.js` 中添加路由处理逻辑
3. 实现对应的处理函数

### 修改现有路由

1. 更新 `routes.js` 中的路由配置
2. 更新前端或后端的处理逻辑
3. 测试所有相关功能

### 删除路由

1. 从 `routes.js` 中删除路由配置
2. 从 `index.js` 中删除路由处理逻辑
3. 更新前端或后端的相关引用
4. 测试确保没有遗漏

## 常见问题

### 问题 1：页面路由返回 404

**原因**：HTML 文件不存在或路径错误

**解决**：
1. 检查 `dist` 目录中是否存在对应的 HTML 文件
2. 检查 `routes.js` 中的文件名是否正确
3. 重新构建前端代码

### 问题 2：登录后跳转错误

**原因**：Token 键名不匹配或路由配置错误

**解决**：
1. 确保使用 `rualive_token` 作为 token 键名
2. 检查登录成功后的重定向逻辑
3. 检查目标路由的配置

### 问题 3：API 路由返回 404

**原因**：路由配置错误或处理函数不存在

**解决**：
1. 检查 `routes.js` 中的 API 路由配置
2. 检查 `index.js` 中是否存在对应的路由处理逻辑
3. 检查处理函数名称是否正确

### 问题 4：重复的路由处理器

**原因**：在 `index.js` 中有多个相同的路由判断

**解决**：
1. 搜索所有 `if (path === '...')` 语句
2. 删除重复的路由处理器
3. 确保每个路由只有一个处理器

## 路由调试

### 查看当前路由

```javascript
console.log('Current path:', window.location.pathname);
console.log('Current view:', view);
```

### 测试路由

```bash
# 测试页面路由
curl -I http://127.0.0.1:8787/login
curl -I http://127.0.0.1:8787/user
curl -I http://127.0.0.1:8787/admin

# 测试 API 路由
curl -X POST http://127.0.0.1:8787/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'
```

## 最佳实践

1. **统一路由管理**
   - 使用 `routes.js` 统一管理所有路由配置
   - 避免在多处重复定义路由

2. **清晰的命名约定**
   - 页面路由使用简洁的路径（如 `/login`）
   - API 路由以 `/api` 开头
   - 使用有意义的处理函数名

3. **一致的 Token 管理**
   - 使用统一的 token 键名（`rualive_token`）
   - 在所有需要认证的地方检查 token

4. **完善的错误处理**
   - 对未找到的路由返回 404
   - 对未授权的请求返回 401
   - 提供清晰的错误信息

5. **详细的日志记录**
   - 记录路由访问日志
   - 记录错误和异常
   - 便于调试和监控

## 相关文件

- `src/routes.js` - 路由配置文件
- `src/index.js` - 主路由处理文件
- `public/index.tsx` - 前端路由逻辑
- `public/index.html` - 主页面 HTML
- `public/auth.html` - 登录页面 HTML

## 更新日志

- 2026-01-26: 创建路由管理方案文档
- 2026-01-26: 添加 `routes.js` 路由配置文件
- 2026-01-26: 统一页面路由和 API 路由管理