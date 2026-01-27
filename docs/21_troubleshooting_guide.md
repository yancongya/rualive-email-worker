# 故障排查指南

## 文档信息
- **创建日期**: 2026-01-26
- **项目**: RuAlive Email Worker
- **版本**: 1.0.0
- **作者**: iFlow CLI

## 目录
1. [常见问题](#常见问题)
2. [诊断工具](#诊断工具)
3. [解决方案](#解决方案)
4. [日志分析](#日志分析)
5. [性能优化](#性能优化)

## 常见问题

### 问题 1：路由显示错误

**症状**:
- 访问 `/user` 显示落地页
- 访问 `/login` 显示落地页
- 路由判断失效

**诊断步骤**:
```javascript
// 1. 检查路径
console.log('Path:', window.location.pathname);

// 2. 检查视图状态
console.log('View:', view);

// 3. 检查构建版本
console.log('Build version:', window.BUILD_VERSION);

// 4. 检查路由逻辑
console.log('Starts with /user:', window.location.pathname.startsWith('/user'));
```

**解决方案**:
```bash
# 1. 清除浏览器缓存
# 按 Ctrl+Shift+Delete

# 2. 强制刷新
# 按 Ctrl+F5

# 3. 检查构建产物
cd public
grep "Build version" dist/assets/main-*.js

# 4. 重新部署
cd ..
npm run deploy
```

### 问题 2：登录失败

**症状**:
- 点击登录按钮无响应
- 登录后立即跳转回登录页
- Token 未保存

**诊断步骤**:
```javascript
// 1. 检查网络请求
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: '123456' })
}).then(r => r.json()).then(console.log);

// 2. 检查 Token
console.log('Token:', localStorage.getItem('rualive_token'));
console.log('User:', localStorage.getItem('rualive_user'));

// 3. 检查 Token 验证
fetch('/api/auth/user', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('rualive_token') }
}).then(r => r.json()).then(console.log);
```

**解决方案**:
```bash
# 1. 检查后端日志
npm run tail

# 2. 检查数据库
wrangler d1 execute rualive --remote --command="SELECT * FROM users WHERE email = 'test@example.com'"

# 3. 测试登录接口
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### 问题 3：构建失败

**症状**:
- Vite 构建失败
- TypeScript 编译错误
- 依赖安装失败

**诊断步骤**:
```bash
# 1. 检查 Node.js 版本
node --version
npm --version

# 2. 检查依赖
cd public
npm list

# 3. 检查 TypeScript
npx tsc --noEmit

# 4. 检查 Vite 配置
cat vite.config.ts
```

**解决方案**:
```bash
# 1. 清理缓存
cd public
rm -rf dist node_modules/.vite node_modules package-lock.json

# 2. 重新安装依赖
npm install

# 3. 重新构建
npm run build

# 4. 如果仍有问题，升级依赖
npm update
```

### 问题 4：部署失败

**症状**:
- Wrangler 部署失败
- Assets 上传失败
- 数据库迁移失败

**诊断步骤**:
```bash
# 1. 检查登录状态
wrangler whoami

# 2. 检查配置
cat wrangler.toml

# 3. 测试部署
wrangler deploy --dry-run

# 4. 查看详细日志
wrangler deploy --log-level debug
```

**解决方案**:
```bash
# 1. 重新登录
wrangler login

# 2. 检查配置
# 确保 wrangler.toml 中的 ID 正确

# 3. 重新部署
npm run deploy

# 4. 如果仍有问题，联系 Cloudflare 支持
```

### 问题 5：数据库连接失败

**症状**:
- D1 数据库连接失败
- 查询超时
- 数据未保存

**诊断步骤**:
```bash
# 1. 检查数据库配置
cat wrangler.toml | grep -A 5 "\[\[d1_databases\]\]\]"

# 2. 测试连接
wrangler d1 execute rualive --remote --command="SELECT 1"

# 3. 检查数据库状态
wrangler d1 info rualive

# 4. 查看日志
npm run tail
```

**解决方案**:
```bash
# 1. 重新创建数据库
wrangler d1 create rualive

# 2. 更新配置
# 复制新的 database_id 到 wrangler.toml

# 3. 执行迁移
wrangler d1 execute rualive --remote --file=./schema.sql

# 4. 重新部署
npm run deploy
```

### 问题 6：邮件发送失败

**症状**:
- 邮件未发送
- 发送超时
- Resend API 错误

**诊断步骤**:
```bash
# 1. 检查环境变量
wrangler secret list

# 2. 测试 API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'

# 3. 查看日志
npm run tail
```

**解决方案**:
```bash
# 1. 重新设置 API Key
wrangler secret put RESEND_API_KEY

# 2. 验证 API Key
# 访问 https://resend.com/api-keys

# 3. 测试发送
# 使用上面的 curl 命令

# 4. 重新部署
npm run deploy
```

### 问题 7：静态文件 404

**症状**:
- CSS 文件 404
- JS 文件 404
- 图片文件 404

**诊断步骤**:
```bash
# 1. 检查文件是否存在
ls -la public/dist/
ls -la public/dist/assets/

# 2. 检查 HTML 引用
grep "script" public/dist/index.html
grep "link" public/dist/index.html

# 3. 测试文件访问
curl -I http://127.0.0.1:8787/assets/main-C3FqXtyv.js

# 4. 检查 Assets 绑定
npm run tail
```

**解决方案**:
```bash
# 1. 重新构建
cd public
npm run build

# 2. 检查构建产物
ls -la dist/assets/

# 3. 重新部署
cd ..
npm run deploy

# 4. 清除浏览器缓存
# 按 Ctrl+Shift+Delete
```

### 问题 8：性能问题

**症状**:
- 页面加载慢
- API 响应慢
- 内存占用高

**诊断步骤**:
```bash
# 1. 检查页面加载时间
# 在浏览器开发者工具中打开 Network 标签
# 查看 Time 列

# 2. 检查 API 响应时间
curl -w "@-" -o /dev/null -s "http://127.0.0.1:8787/api/config" <<'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# 3. 检查 Worker 性能
npm run tail
# 查看日志中的时间戳

# 4. 检查文件大小
du -sh public/dist/assets/
```

**解决方案**:
```bash
# 1. 优化构建
cd public
npm run build -- --minify

# 2. 启用压缩
# 在 wrangler.toml 中添加
[build]
command = "npm run build"

# 3. 启用缓存
# 在 src/index.js 中添加
const cache = caches.default;
const cacheKey = new Request(request.url, request);
const cached = await cache.match(cacheKey);
if (cached) return cached;

# 4. 使用 CDN
# Cloudflare 自动提供 CDN
```

## 诊断工具

### 1. 浏览器开发者工具

**Network 标签**:
- 查看所有网络请求
- 检查请求/响应头
- 查看响应时间

**Console 标签**:
- 查看 JavaScript 错误
- 查看 console.log 输出
- 执行 JavaScript 代码

**Application 标签**:
- 查看 localStorage
- 查看 sessionStorage
- 查看 Cookies

**Performance 标签**:
- 分析页面性能
- 查看渲染时间
- 识别性能瓶颈

### 2. Wrangler CLI

**查看日志**:
```bash
npm run tail
```

**查看部署**:
```bash
wrangler deployments list
```

**测试路由**:
```bash
wrangler tail
# 然后访问页面，查看日志
```

**查看环境变量**:
```bash
wrangler secret list
```

### 3. 数据库工具

**查询数据**:
```bash
wrangler d1 execute rualive --remote --command="SELECT * FROM users LIMIT 10"
```

**查看表结构**:
```bash
wrangler d1 execute rualive --remote --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

**执行迁移**:
```bash
wrangler d1 migrations apply rualive --remote
```

### 4. KV 工具

**列出所有键**:
```bash
wrangler kv:key list --namespace-id=xxxxxxxx
```

**读取值**:
```bash
wrangler kv:key get --namespace-id=xxxxxxxx "key"
```

**写入值**:
```bash
wrangler kv:key put --namespace-id=xxxxxxxx "key" "value"
```

### 5. 网络工具

**测试 API**:
```bash
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

**测试静态文件**:
```bash
curl -I http://127.0.0.1:8787/assets/main-C3FqXtyv.js
```

**测试数据库**:
```bash
curl http://127.0.0.1:8787/api/config
```

## 解决方案

### 方案 1：强制清除缓存

**浏览器缓存**:
```javascript
// 在浏览器控制台中
// 方法 1: 强制刷新
location.reload(true);

// 方法 2: 清除 localStorage
localStorage.clear();
location.reload();

// 方法 3: 添加时间戳
const url = new URL(window.location.href);
url.searchParams.set('t', Date.now());
window.location.href = url.toString();
```

**Cloudflare 缓存**:
```bash
# 1. 清除单个文件
wrangler deploy public/dist/index.html

# 2. 清除所有文件
wrangler deploy public/dist

# 3. 在 Cloudflare Dashboard 中清除缓存
# 访问 https://dash.cloudflare.com → Workers → RuAlive → Settings → Cache → Purge Cache
```

### 方案 2：回滚部署

**查看部署历史**:
```bash
wrangler deployments list
```

**回滚到上一个版本**:
```bash
wrangler rollback <deployment-id>
```

**回滚到特定版本**:
```bash
wrangler rollback <deployment-id> --to <target-id>
```

### 方案 3：紧急修复

**快速修复步骤**:
```bash
# 1. 修改代码
# 编辑文件

# 2. 快速构建
cd public
npm run build

# 3. 快速部署
cd ..
npm run deploy

# 4. 验证修复
curl http://127.0.0.1:8787
```

**热修复（不重新部署）**:
```bash
# 修改 wrangler.toml
# 添加环境变量
wrangler secret put EMERGENCY_FIX

# 部署配置
wrangler deploy wrangler.toml
```

### 方案 4：数据恢复

**从备份恢复**:
```bash
# 1. 导出现有数据
wrangler d1 export rualive --remote --output=backup.sql

# 2. 恢复数据
wrangler d1 execute rualive --remote --file=backup.sql

# 3. 验证数据
wrangler d1 execute rualive --remote --command="SELECT COUNT(*) FROM users"
```

**从 KV 恢复**:
```bash
# 1. 导出 KV 数据
wrangler kv:key list --namespace-id=xxxxxxxx > kv-backup.txt

# 2. 恢复 KV 数据
while read key; do
  value=$(wrangler kv:key get --namespace-id=xxxxxxxx "$key")
  wrangler kv:key put --namespace-id=xxxxxxxx "$key" "$value"
done < kv-backup.txt
```

## 日志分析

### 前端日志

**启用详细日志**:
```typescript
// public/index.tsx
const DEBUG = true;

if (DEBUG) {
  console.log('[App] Initial path:', path);
  console.log('[App] Setting view to:', view);
  console.log('[App] User logged in:', !!token);
}
```

**查看日志**:
```javascript
// 在浏览器控制台中
console.log('All logs:', console);
console.log('Errors:', console.error);
```

### 后端日志

**启用详细日志**:
```javascript
// src/index.js
const DEBUG = true;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (DEBUG) {
      console.log('[Worker] Request path:', path);
      console.log('[Worker] Method:', request.method);
      console.log('[Worker] Headers:', Object.fromEntries(request.headers));
    }

    // 处理请求
    return handleRequest(request, env);
  }
};
```

**查看日志**:
```bash
npm run tail
```

**过滤日志**:
```bash
npm run tail | grep "ERROR"
npm run tail | grep "Route accessed"
```

### 数据库日志

**启用查询日志**:
```javascript
// src/index.js
async function handleRequest(request, env) {
  const startTime = Date.now();
  
  try {
    const result = await env.DB.prepare('SELECT * FROM users').all();
    const duration = Date.now() - startTime;
    
    console.log(`[DB] Query completed in ${duration}ms`);
    console.log(`[DB] Result count: ${result.length}`);
    
    return result;
  } catch (error) {
    console.error('[DB] Query failed:', error);
    throw error;
  }
}
```

### 性能日志

**启用性能监控**:
```javascript
// src/index.js
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    
    try {
      const response = await handleRequest(request, env);
      const duration = Date.now() - startTime;
      
      console.log(`[Perf] Request completed in ${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Perf] Request failed after ${duration}ms:`, error);
      throw error;
    }
  }
};
```

## 性能优化

### 前端优化

**代码分割**:
```typescript
// public/index.tsx
import { lazy, Suspense } from 'react';

const LandingView = lazy(() => import('./components/LandingView'));
const AuthView = lazy(() => import('./components/AuthView'));
const UserView = lazy(() => import('./components/UserView'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {view === 'landing' && <LandingView />}
      {view === 'auth' && <AuthView />}
      {view === 'user' && <UserView />}
    </Suspense>
  );
}
```

**图片优化**:
```html
<!-- public/index.html -->
<img src="/assets/image.webp" alt="Image" loading="lazy" />
```

**CSS 优化**:
```css
/* public/index.css */
/* 使用 CSS 变量 */
:root {
  --primary-color: #ff6b35;
  --text-color: #ffffff;
}

/* 使用 CSS Grid 和 Flexbox */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

### 后端优化

**缓存策略**:
```javascript
// src/index.js
const cache = caches.default;

export default {
  async fetch(request, env, ctx) {
    const cacheKey = new Request(request.url, request);
    
    // 尝试从缓存获取
    const cached = await cache.match(cacheKey);
    if (cached) {
      console.log('[Cache] Hit:', request.url);
      return cached;
    }
    
    // 处理请求
    const response = await handleRequest(request, env);
    
    // 缓存响应（仅缓存 GET 请求）
    if (request.method === 'GET') {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    
    return response;
  }
};
```

**数据库优化**:
```javascript
// src/index.js
// 使用索引
await env.DB.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
`).run();

// 使用连接池
// Cloudflare D1 自动管理连接

// 批量操作
await env.DB.prepare(`
  INSERT INTO users (email, password_hash) VALUES (?, ?)
`).bind(email1, hash1).bind(email2, hash2).all();
```

**压缩响应**:
```javascript
// src/index.js
export default {
  async fetch(request, env) {
    const response = await handleRequest(request, env);
    
    // 添加压缩头
    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', 'gzip');
    headers.set('Content-Type', 'application/json');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

### 部署优化

**使用 CDN**:
```toml
# wrangler.toml
[assets]
directory = "public/dist"
binding = "ASSETS"

# Cloudflare 自动提供 CDN
```

**启用边缘缓存**:
```javascript
// src/index.js
export default {
  async fetch(request, env) {
    const response = await handleRequest(request, env);
    
    // 添加缓存头
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

**使用预览环境**:
```bash
# 部署到预览环境
wrangler deploy --env preview

# 测试预览环境
curl https://rualive-email-worker-preview.cubetan57.workers.dev
```

## 总结

**常见问题**:
1. 路由显示错误
2. 登录失败
3. 构建失败
4. 部署失败
5. 数据库连接失败
6. 邮件发送失败
7. 静态文件 404
8. 性能问题

**诊断工具**:
1. 浏览器开发者工具
2. Wrangler CLI
3. 数据库工具
4. KV 工具
5. 网络工具

**解决方案**:
1. 强制清除缓存
2. 回滚部署
3. 紧急修复
4. 数据恢复

**日志分析**:
1. 前端日志
2. 后端日志
3. 数据库日志
4. 性能日志

**性能优化**:
1. 前端优化（代码分割、图片优化、CSS 优化）
2. 后端优化（缓存策略、数据库优化、压缩响应）
3. 部署优化（CDN、边缘缓存、预览环境）

**文件路径**:
- 前端源码: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\public\index.tsx`
- 后端源码: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\src\index.js`
- 配置文件: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\wrangler.toml`