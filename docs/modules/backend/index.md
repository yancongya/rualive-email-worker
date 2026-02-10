# Worker 主入�?
## 文档信息
- **文件位置**: `src/index.js` (5950 �?
- **模块类型**: 后端核心模块
- **最后更�?*: 2026-02-07

---

## 1. 模块概述

### 1.1 模块职责
- Worker 主入口点
- 请求路由分发
- 静态文件服�?- CORS 处理
- 错误处理和日志记�?- 环境变量绑定管理

### 1.2 文件结构
```javascript
/**
 * 文件: src/index.js
 * 行数: 5950 �? * 主要组件:
 * - Worker 主入�?(export default)
 * - 认证模块 (authModule)
 * - 路由处理 (30+ 个路由条�?
 * - API 处理�?(36 �?handle 函数)
 * - 辅助函数 (工具函数)
 */
```

---

## 2. Worker 入口�?
### 2.1 主入口函�?```javascript
export default {
  async fetch(request, env) {
    // 兼容不同binding名称
    const DB = env.DB || env.rualive;
    const KV = env.KV;
    const ASSETS = env.ASSETS;
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理静态文件（�?Assets 绑定�?    if (ASSETS && !path.startsWith('/api/') && 
        path !== '/login' && path !== '/user' && 
        path !== '/user-v6' && path !== '/admin/login') {
      try {
        const assetResponse = await ASSETS.fetch(request);
        if (assetResponse && assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch (error) {
        console.error('Assets fetch error:', error);
      }
    }

    // CORS处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 路由处理
    if (path === '/' || path === '/index.html') {
      // 返回 React 应用
      if (ASSETS) {
        const assetResponse = await ASSETS.fetch(new Request(request.url, { method: 'GET' }));
        if (assetResponse && assetResponse.status !== 404) {
          return assetResponse;
        }
      }
      return new Response('Not Found', { status: 404 });
    }
    // ... 其他路由
  }
}
```

### 2.2 环境变量绑定
```javascript
// 数据库绑�?const DB = env.DB || env.rualive;

// KV 存储绑定
const KV = env.KV;

// Assets 绑定
const ASSETS = env.ASSETS;

// 环境变量
const ENVIRONMENT = env.ENVIRONMENT || 'production';
const FROM_EMAIL = env.FROM_EMAIL || 'RuAlive@itycon.cn';
```

---

## 3. 路由系统

### 3.1 路由分类

#### 静态文件路�?| 路由 | 说明 | 处理方式 |
|------|------|---------|
| `/` | 首页 | Assets 绑定 |
| `/login` | 登录�?| 返回 auth.html |
| `/user` | 用户仪表�?| 返回 user-v6.html |
| `/admin` | 管理后台 | 动态生�?|
| `/admin/login` | 管理员登�?| 返回 auth.html |
| `/*` | 其他静态文�?| Assets 绑定 |

#### API 路由
| 路由前缀 | 端点数量 | 说明 |
|---------|---------|------|
| `/api/auth/` | 8 | 认证相关 |
| `/api/admin/` | 11 | 管理员功�?|
| `/api/config` | 2 | 用户配置 |
| `/api/work-data` | 1 | 工作数据上传 |
| `/api/heartbeat` | 1 | 心跳检�?|
| `/api/ae-status` | 2 | AE 状态管�?|
| `/api/send-now` | 1 | 立即发送邮�?|
| `/api/logs` | 1 | 发送日�?|
| `/api/work-logs` | 2 | 工作日志 |
| `/api/projects/` | 2 | 项目数据 |

### 3.2 路由处理逻辑

#### 优先级顺�?```javascript
// 1. CORS 预检请求
if (request.method === 'OPTIONS') {
  return handleCORS();
}

// 2. 静态文件路由（优先处理�?if (path.startsWith('/assets/') || path.match(/\.(js|css|png|jpg|svg)$/)) {
  return handleStaticFile(request);
}

// 3. 特殊页面路由
if (path === '/') return handleHomePage();
if (path === '/login') return handleLoginPage();
if (path === '/user') return handleUserDashboard();
if (path === '/admin/login') return handleAdminLoginPage();

// 4. API 路由
if (path.startsWith('/api/')) {
  return handleAPIRoute(request);
}

// 5. 404 处理
return new Response('Not Found', { status: 404 });
```

---

## 4. CORS 处理

### 4.1 CORS 配置
```javascript
// CORS 响应�?const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 预检请求
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### 4.2 CORS 使用场景
- 前端跨域请求
- API 调用
- 预检请求（OPTIONS�?
---

## 5. 认证中间�?
### 5.1 Token 验证
```javascript
async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await authModule.verifyToken(token, env);
}
```

### 5.2 权限检�?```javascript
async function checkPermission(userId, requiredRole, env) {
  const DB = env.DB || env.rualive;
  
  const user = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return false;
  }

  // admin 可以访问所有资�?  if (user.role === 'admin') {
    return true;
  }

  // user 只能访问自己的资�?  if (requiredRole === 'admin') {
    return false;
  }

  return user.role === requiredRole;
}
```

---

## 6. 静态文件处�?
### 6.1 Assets 绑定使用
```javascript
// �?Assets 绑定获取静态文�?if (ASSETS && shouldServeFromAssets(path)) {
  try {
    const assetResponse = await ASSETS.fetch(request);
    if (assetResponse && assetResponse.status !== 404) {
      return assetResponse;
    }
  } catch (error) {
    console.error('Assets fetch error:', error);
  }
}
```

### 6.2 特殊页面路由
```javascript
// 首页
if (path === '/' || path === '/index.html') {
  if (ASSETS) {
    const assetResponse = await ASSETS.fetch(new Request(request.url, { method: 'GET' }));
    if (assetResponse && assetResponse.status !== 404) {
      return assetResponse;
    }
  }
  return new Response('Not Found', { status: 404 });
}

// 登录�?if (path === '/login' || path === '/admin/login') {
  const authHTML = await generateAuthHTML();
  return new Response(authHTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 用户仪表�?if (path === '/user') {
  const userDashboardHTML = await ASSETS.fetch(
    new Request('https://rualive.itycon.cn/user-v6.html', { method: 'GET' })
  );
  return userDashboardHTML;
}
```

---

## 7. 错误处理

### 7.1 错误响应格式
```javascript
function errorResponse(message, code, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code: code
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

### 7.2 错误处理示例
```javascript
try {
  // 执行数据库操�?  const result = await DB.prepare(sql).bind(params).run();
  
  if (!result.success) {
    throw new Error('Database operation failed');
  }
  
  return successResponse(result);
  
} catch (error) {
  console.error('Error:', error);
  return errorResponse('Internal server error', 'INTERNAL_ERROR');
}
```

---

## 8. 日志记录

### 8.1 日志级别
```javascript
console.log('[INFO] 普通信�?);
console.warn('[WARN] 警告信息');
console.error('[ERROR] 错误信息');
console.debug('[DEBUG] 调试信息');
```

### 8.2 日志使用示例
```javascript
// 请求日志
console.log(`[${request.method}] ${path} - ${new Date().toISOString()}`);

// 数据库操作日�?console.log('[DB] Executing:', sql);

// 认证日志
console.log('[AUTH] User logged in:', userId);

// 错误日志
console.error('[ERROR] Database query failed:', error);
```

---

## 9. 核心功能模块

### 9.1 认证模块
**文件**: `src/index.js` (内联定义)

**函数列表**:
- `generateUserId()` - 生成用户 ID
- `generateInviteCode()` - 生成邀请码
- `hashPassword()` - 密码哈希
- `verifyPassword()` - 密码验证
- `generateToken()` - 生成 JWT Token
- `verifyToken()` - 验证 JWT Token

**使用示例**:
```javascript
const userId = authModule.generateUserId();
const passwordHash = await authModule.hashPassword('password123');
const token = await authModule.generateToken(userId, 'user', env);
const payload = await authModule.verifyToken(token, env);
```

### 9.2 API 处理�?**函数列表**: 36 �?handle* 函数

**分类**:
- 认证处理 (8 �?
- 配置处理 (2 �?
- 工作数据处理 (4 �?
- 管理功能 (11 �?
- 项目数据 (2 �?
- 日志查询 (3 �?
- 系统功能 (6 �?

**详情**: �?[api-handlers.md](api-handlers.md)

### 9.3 邮件服务
**集成**: Resend API

**功能**:
- 发送邮�?- 邮件模板渲染
- 发送状态跟�?
**详情**: �?[email-service.md](email-service.md)

---

## 10. 性能优化

### 10.1 请求优化
- **异步处理**: 所�?I/O 操作使用 async/await
- **并行执行**: 独立操作并行执行
- **缓存机制**: 使用 KV 缓存频繁访问的数�?
### 10.2 静态资源优�?- **CDN 分发**: 通过 Cloudflare CDN 分发
- **资源压缩**: Vite 自动压缩 JavaScript �?CSS
- **代码分割**: 自动代码分割和懒加载
- **哈希命名**: 文件名包含哈希值，便于缓存

### 10.3 数据库优�?- **索引优化**: 为常用查询创建索�?- **批量操作**: 减少数据库往返次�?- **连接�?*: Cloudflare D1 自动管理连接

---

## 11. 安全机制

### 11.1 输入验证
```javascript
// JSON 解析错误处理
try {
  const data = await request.json();
  // 验证数据格式
  if (!data.email || !data.password) {
    return errorResponse('Missing required fields', 'INVALID_INPUT', 400);
  }
} catch (error) {
  return errorResponse('Invalid JSON', 'INVALID_JSON', 400);
}
```

### 11.2 SQL 注入防护
```javascript
// 使用参数化查�?const result = await DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).run();

// 而不是字符串拼接
// const result = DB.prepare('SELECT * FROM users WHERE id = ' + userId).run(); // �?不安�?```

### 11.3 XSS 防护
```javascript
// 输入转义
const safeInput = escapeHtml(userInput);

// CSP �?return new Response(html, {
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
  }
});
```

---

## 12. 监控和调�?
### 12.1 实时日志查看
```bash
npm run tail
```

### 12.2 日志分析
```javascript
// 请求追踪
console.log(`[${request.method}] ${path} - ${new Date().toISOString()}`);

// 数据库追�?console.log('[DB] Query:', sql, '- Params:', params);

// 性能追踪
const startTime = Date.now();
// ... 执行操作
console.log('[PERF] Operation took:', Date.now() - startTime, 'ms');
```

---

## 13. 开发模�?
### 13.1 本地开�?```bash
# 启动本地开发服务器
npm run dev

# 访问本地 Worker
http://localhost:8787
```

### 13.2 预览环境
```bash
# 部署到预览环�?wrangler deploy --env preview

# 访问预览环境
https://rualive-email-worker.preview.workers.dev
```

### 13.3 生产环境
```bash
# 部署到生产环�?npm run deploy

# 访问生产环境
https://rualive.itycon.cn
```

---

## 14. 部署流程

### 14.1 构建流程
```
代码修改
  �?Git 提交
  �?前端构建 (Vite)
  �?复制�?dist/
  �?Wrangler 部署
  �?Cloudflare Workers
  �?生产环境
```

### 14.2 快速部�?```bash
# 一键部署（推荐�?.\deploy.ps1

# 手动部署
npm run build:frontend
npm run deploy
```

---

**文档版本**: 1.0
**最后更�?*: 2026-02-07
**作�?*: iFlow CLI
**状�?*: �?完成
