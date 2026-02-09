# 部署问题汇总与解决方案

本文档汇总了在 RuAlive Email Worker 部署过程中遇到的所有问题、注意事项和最佳实践。

**文档版本**: 1.2.0
**最后更新**: 2026-02-09

## 目录

1. [常见问题](#常见问题)
2. [根本原因分析](#根本原因分析)
3. [解决方案](#解决方案)
4. [部署流程](#部署流程)
5. [注意事项](#注意事项)
6. [故障排查](#故障排查)

---

## 常见问题

### 1. 翻译文件未更新

**现象**：
- 修改了 `public/locals/user/zh.json` 或 `en.json`
- 部署后线上仍显示旧版本的翻译文本
- 部分翻译键缺失（如 `projectRuntimeGantt`、`days` 等）

**错误信息**：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script
```

**影响范围**：
- 翻译键丢失导致UI显示英文
- 部分功能无法正常使用

---

### 2. HTML 文件引用错误的 JS 文件

**现象**：
- 浏览器控制台报错：
  ```
  cdn.tailwindcss.com should not be used in production
  Failed to load module script: Expected a JavaScript-or-Wasm module script
  ```
- 页面白屏或无法加载

**原因**：
- HTML 文件引用的是 `./user-v6.tsx`（源文件）而非编译后的 JS 文件
- 编译后的 JS 文件应为 `/assets/user-v6-DqW8xjDM.js`

---

### 3. Cloudflare Assets CDN 缓存问题

**现象**：
- 本地文件已修改并部署
- wrangler 显示文件已上传
- 但线上仍返回旧版本文件

**特点**：
- 问题偶发性出现
- 特别是在频繁部署时
- 翻译文件和 HTML 文件最易受影响

---

### 4. 构建文件复制到错误目录

**现象**：
- 部署后部分文件缺失
- 或文件在错误的位置

**原因**：
- 手动复制文件时路径错误
- `dist` 目录与 `rualive-email-worker-dist` 目录混淆

---

### 5. Vite 构建不包含 locals 文件

**现象**：
- `dist/public/locals/user/zh.json` 文件缺失
- 导致翻译文件无法访问

**原因**：
- Vite 默认只处理 HTML 和 JS 文件
- 需要配置 `publicDir` 或手动复制

---

### 6. Worker 路由返回错误的 HTML 内容

**现象**：
- 浏览器控制台报错：
  ```
  Failed to load module script: Expected a JavaScript-or-Wasm module script
  but the server responded with a MIME type of ""
  ```
- 页面无法加载

**错误信息**：
```
GET /user-v6.tsx 404 (Not Found)
```

**原因**：
- Worker 代码中 `/user` 路由返回硬编码的 HTML 内容
- 硬编码的 HTML 引用的是源文件 `./user-v6.tsx` 而非编译后的 JS 文件
- 每次构建后 JS 文件名会变化（如 `user-v6-DOnukJ-W.js`），但硬编码的 HTML 不更新

**示例问题代码**：
```javascript
// ❌ 错误：硬编码 HTML 内容
if (path === '/user') {
  const userHtml = `<!DOCTYPE html>
    ...
    <script type="module" src="./user-v6.tsx"></script>
  </html>`;
  return new Response(userHtml, { ... });
}
```

**修复方案**：
```javascript
// ✅ 正确：从 Assets 读取构建后的 HTML
if (path === '/user') {
  const userV6Url = new URL('/public/user-v6.html', request.url);
  const assetResponse = await ASSETS.fetch(new Request(userV6Url, { method: 'GET' }));
  if (assetResponse && assetResponse.status !== 404) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
  return new Response('User page not found', { status: 404 });
}
```

---

### 7. Assets 返回的 MIME 类型为空

**现象**：
- 浏览器控制台报错：
  ```
  Failed to load module script: Expected a JavaScript-or-Wasm module script
  but the server responded with a MIME type of ""
  ```

**原因**：
- Cloudflare Assets 返回的静态文件 MIME 类型可能为空或不正确
- 模块脚本要求 MIME 类型必须为 `application/javascript` 或 `text/javascript`

**修复方案**：
```javascript
// 确保正确的 MIME 类型
let contentType = 'text/plain;charset=UTF-8';
if (path.endsWith('.js') || path.endsWith('.mjs')) {
  contentType = 'application/javascript;charset=UTF-8';
} else if (path.endsWith('.json')) {
  contentType = 'application/json;charset=UTF-8';
} else if (path.endsWith('.css')) {
  contentType = 'text/css;charset=UTF-8';
} else if (path.endsWith('.html')) {
  contentType = 'text/html;charset=UTF-8';
}

return new Response(assetResponse.body, {
  status: assetResponse.status,
  headers: {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
  }
});
```

---

## 根本原因分析

### 1. Wrangler 的文件检测机制

**工作原理**：
```
wrangler deploy
  ↓
计算文件内容哈希值
  ↓
与上次部署的哈希值对比
  ↓
如果哈希值相同 → 跳过上传
如果哈希值不同 → 上传文件
```

**问题**：
- 如果文件内容没有实质性变化（如只是格式调整），wrangler 不会重新上传
- 即使文件时间戳改变，内容哈希不变也不会上传

### 2. Cloudflare Assets 的多层缓存

**缓存层级**：
```
用户请求
  ↓
浏览器缓存（本地）
  ↓
CDN 边缘节点缓存（Cloudflare）
  ↓
源服务器（Cloudflare Assets）
```

**问题**：
- 即使 wrangler 上传了新文件，CDN 边缘节点可能仍返回旧版本
- 缓存失效时间不确定（通常 5-30 分钟）

### 3. Vite 构建配置问题

**关键配置**：
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    publicDir: 'public',  // 关键：指定公共资源目录
    emptyOutDir: true,
  }
});
```

**问题**：
- 如果 `publicDir` 未正确配置，locals 文件不会被复制到 dist
- 导致翻译文件在构建后丢失

---

## 解决方案

### 方案 1：强制文件内容更新（推荐）

**原理**：
在部署前强制修改关键文件的内容，确保 wrangler 能检测到变化。

**实现**：
创建 `scripts/force-update.js`：

```javascript
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'public/user-v6.html',
  'public/admin.html',
  'public/auth.html',
  'public/locals/user/zh.json',
  'public/locals/user/en.json'
];

criticalFiles.forEach(relativePath => {
  const fullPath = path.join(__dirname, '..', relativePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const newTimestamp = new Date().toISOString();
  
  if (relativePath.endsWith('.html')) {
    // HTML 文件：添加部署时间戳注释
    const pattern = /<!-- Deploy Time: .*? -->/;
    if (pattern.test(content)) {
      newContent = content.replace(pattern, '<!-- Deploy Time: ' + newTimestamp + ' -->');
    } else {
      newContent = content.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Deploy Time: ' + newTimestamp + ' -->');
    }
  } else {
    // JSON 文件：添加 _deployTime 字段
    const json = JSON.parse(content);
    json._deployTime = newTimestamp;
    newContent = JSON.stringify(json, null, 2);
  }
  
  fs.writeFileSync(fullPath, newContent, 'utf8');
});
```

**配置 package.json**：
```json
{
  "scripts": {
    "predeploy": "node scripts/force-update.js",
    "deploy": "npm run predeploy && wrangler deploy"
  }
}
```

**优点**：
- ✅ 自动化，无需手动干预
- ✅ 每次部署都强制更新关键文件
- ✅ 确保 wrangler 检测到文件变化

**缺点**：
- ❌ 每次部署都会重新上传所有关键文件
- ❌ 部署时间略增（约 1-2 秒）

---

### 方案 2：使用 Worker 直接返回 HTML

**原理**：
在 Worker 代码中直接返回 HTML 内容，绕过 Assets 缓存。

**实现**：
```javascript
// src/index.js
if (path === '/user') {
  // 直接返回构建后的 HTML 内容
  const htmlContent = `
    <!DOCTYPE html>
    <script type="module" crossorigin src="/assets/user-v6-DqW8xjDM.js"></script>
    ...
  `;
  
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
```

**优点**：
- ✅ 完全绕过 Assets 缓存
- ✅ 响应速度更快
- ✅ 可以动态生成内容

**缺点**：
- ❌ 需要手动维护 HTML 内容
- ❌ 修改 HTML 时需要更新 Worker 代码
- ❌ 不利于版本管理

---

### 方案 3：版本化文件名

**原理**：
在文件名中包含版本号或哈希值，确保每次更新都是新文件。

**实现**：
```javascript
// 自动生成带版本号的文件名
const version = Date.now();
const htmlFileName = `user-v6-${version}.html`;
const jsonFileName = `zh-${version}.json`;
```

**优点**：
- ✅ CDN 缓存问题自动解决
- ✅ 可以保留多个版本
- ✅ 回滚方便

**缺点**：
- ❌ 会积累大量历史文件
- ❌ 需要清理旧版本
- ❌ 引用文件名时需要动态生成

---

### 方案 4：手动清除 CDN 缓存

**原理**：
使用 Cloudflare API 清除特定文件的 CDN 缓存。

**实现**：
```bash
# 使用 wrangler 清除缓存
wrangler cache purge --url https://rualive-email-worker.cubetan57.workers.dev/locals/user/zh.json

# 或使用 Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/:zone_id/purge_cache" \
  -H "Authorization: Bearer :token" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://.../zh.json","https://.../en.json"]}'
```

**优点**：
- ✅ 精确控制清除范围
- ✅ 可以批量清除多个文件

**缺点**：
- ❌ 需要额外的 API 调用
- ❌ 需要管理 API token
- ❌ 增加部署复杂度

---

## 部署流程

### 推荐流程（自动化）

```bash
# 1. 修改代码或翻译文件
# 2. 运行部署命令
npm run deploy

# 自动执行：
# - [predeploy] 强制更新关键文件时间戳
# - [deploy] wrangler 部署到 Cloudflare
# - wrangler 检测到文件变化并上传
```

### 完整部署流程（包含验证）

```bash
# 验证构建 → 强制更新 → 构建 → 部署
npm run deploy:full

# 自动执行：
# 1. 验证构建结果
# 2. 强制更新关键文件
# 3. 构建前端（可选）
# 4. 清理旧部署文件
# 5. 复制构建文件
# 6. 部署到 Cloudflare
```

### 手动部署流程（不推荐）

```bash
# 1. 强制更新文件时间戳
node scripts/force-update.js

# 2. 构建前端
npm run build:frontend

# 3. 验证关键文件存在
npm run verify:build

# 4. 复制到部署目录
xcopy dist rualive-email-worker-dist /E /I /Y

# 5. 部署
npm run deploy
```

---

## 注意事项

### 1. 文件路径配置

**关键配置文件**：
- `vite.config.ts` - Vite 构建配置
- `wrangler.toml` - Cloudflare Worker 配置
- `package.json` - 脚本命令

**路径说明**：
```
项目根目录/
├── public/              # 源文件目录
│   ├── user-v6.html
│   ├── locals/
│   │   └── user/
│   │       ├── zh.json
│   │       └── en.json
│   └── ...
├── dist/                # Vite 构建输出目录
│   ├── public/
│   │   ├── user-v6.html
│   │   ├── locals/
│   │   │   └── user/
│   │   │       ├── zh.json
│   │   │       └── en.json
│   │   └── ...
│   └── assets/
│       └── user-v6-DqW8xjDM.js
└── rualive-email-worker-dist/  # Cloudflare 部署目录
    └── dist/                    # 与 dist 内容一致
```

### 2. 环境变量管理

**必需的环境变量**：
```bash
# Cloudflare Workers
RESEND_API_KEY=<your-resend-api-key>
ENVIRONMENT=production
FROM_EMAIL=RuAlive@itycon.cn
DEPLOY_TIMESTAMP=2026-02-02-10-20
```

**设置方法**：
```bash
wrangler secret put RESEND_API_KEY
wrangler secret put OTHER_SECRET
```

### 3. 数据库迁移

**迁移命令**：
```bash
# 创建数据库
npm run db:create

# 执行迁移
npm run db:migrate

# 查看数据库状态
wrangler d1 info rualive
```

### 4. KV 命名空间

**创建 KV**：
```bash
npm run kv:create           # 生产环境
npm run kv:create-preview   # 预览环境
```

**配置 wrangler.toml**：
```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"
```

### 5. Cron 触发器

**配置定时任务**：
```toml
[triggers]
crons = ["0 * * * *"]  # 每小时执行一次
```

**常用 Cron 表达式**：
- `0 * * * *` - 每小时
- `0 0 * * *` - 每天午夜
- `0 18 * * *` - 每天 18:00
- `*/30 * * * *` - 每 30 分钟

### 6. 资源大小限制

**Cloudflare 限制**：
- Worker 代码：最大 1 MB（压缩后）
- Assets 总大小：最大 100 MB
- 单个文件大小：最大 25 MB
- 请求数据大小：最大 128 MB

**优化建议**：
- 使用代码分割（Code Splitting）
- 压缩静态资源
- 懒加载非关键资源

---

## 故障排查

### 问题 1：部署后文件未更新

**排查步骤**：

1. 检查本地文件是否修改：
   ```bash
   # 查看文件修改时间
   ls -la public/locals/user/
   ```

2. 检查 wrangler 是否检测到变化：
   ```bash
   # 查看部署日志
   npm run deploy
   # 应该看到 "Found X new or modified static assets"
   ```

3. 检查线上文件：
   ```bash
   # 使用 curl 查看文件内容
   curl -I https://rualive-email-worker.cubetan57.workers.dev/locals/user/zh.json
   
   # 查看响应头
   # 检查 CF-Cache-Status
   # HIT = 缓存命中（返回旧版本）
   # MISS = 缓存未命中（返回新版本）
   ```

4. 强制更新文件：
   ```bash
   node scripts/force-update.js
   npm run deploy
   ```

5. 如果仍无效，等待 CDN 缓存过期（通常 5-30 分钟）

---

### 问题 2：HTML 文件 404 错误

**排查步骤**：

1. 检查文件是否存在：
   ```bash
   ls -la dist/public/user-v6.html
   ls -la rualive-email-worker-dist/dist/public/user-v6.html
   ```

2. 检查 HTML 引用：
   ```bash
   grep "script" dist/public/user-v6.html
   
   # 应该看到：
   # <script type="module" crossorigin src="/assets/user-v6-DqW8xjDM.js"></script>
   
   # 不应该看到：
   # <script type="module" src="./user-v6.tsx"></script>
   ```

3. 检查 Worker 路由：
   ```javascript
   // src/index.js
   if (path === '/user') {
     // 应该返回构建后的 HTML
     return new Response(htmlContent, { ... });
   }
   ```

4. 使用正确的 URL：
   - ✅ 正确：`https://.../user`
   - ❌ 错误：`https://.../user-v6.html`

---

### 问题 4：MIME 类型错误

**现象**：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of ""
```

**排查步骤**：

1. 检查 Worker 返回的 MIME 类型：
   ```bash
   # 使用 PowerShell
   Invoke-WebRequest -Uri "https://.../assets/user-v6-DOnukJ-W.js" -Method Head | 
     Select-Object -ExpandProperty Headers | 
     Select-Object Content-Type
   
   # 应该返回：
   # Content-Type : application/javascript
   ```

2. 检查 Worker 代码中的 MIME 类型设置：
   ```javascript
   // src/index.js
   // 确保有正确的 MIME 类型映射
   if (path.endsWith('.js') || path.endsWith('.mjs')) {
     contentType = 'application/javascript;charset=UTF-8';
   }
   
   // 确保返回新的 Response 对象
   return new Response(assetResponse.body, {
     status: assetResponse.status,
     headers: {
       'Content-Type': contentType,
       // ...
     }
   });
   ```

3. 检查 Assets 绑定配置：
   ```toml
   # wrangler.toml
   [assets]
   directory = "dist"
   binding = "ASSETS"
   ```

4. 部署后清除浏览器缓存：
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - 或使用无痕模式

---

### 问题 5：Worker 路由返回错误的 HTML 内容

**现象**：
- 页面引用 `./user-v6.tsx`（源文件）
- 控制台显示 404 错误

**排查步骤**：

1. 检查 `/user` 路由返回的内容：
   ```bash
   curl https://rualive-email-worker.cubetan57.workers.dev/user | 
     grep "script.*user-v6"
   
   # 应该看到：
   # src="/assets/user-v6-DOnukJ-W.js"
   
   # 不应该看到：
   # src="./user-v6.tsx"
   ```

2. 检查 Worker 代码中的路由处理：
   ```javascript
   // src/index.js
   if (path === '/user') {
     // ❌ 错误：硬编码 HTML
     // const userHtml = `...`;
     // return new Response(userHtml, { ... });
     
     // ✅ 正确：从 Assets 读取
     const userV6Url = new URL('/public/user-v6.html', request.url);
     const assetResponse = await ASSETS.fetch(new Request(userV6Url, { method: 'GET' }));
     if (assetResponse && assetResponse.status !== 404) {
       return new Response(assetResponse.body, {
         status: assetResponse.status,
         headers: {
           'Content-Type': 'text/html;charset=UTF-8',
           'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
         }
       });
     }
   }
   ```

3. 确保构建后的 HTML 文件在 Assets 中：
   ```bash
   ls -la dist/public/user-v6.html
   # 应该存在
   ```

4. 避免在 Worker 代码中硬编码 HTML 内容：
   - 每次构建后 JS 文件名会变化
   - 硬编码的 HTML 不会自动更新
   - 始终从 Assets 读取构建后的文件

---

### 问题 6：翻译文件 404 错误

**排查步骤**：

1. 检查 locals 目录结构：
   ```bash
   tree dist/public/locals/
   
   # 应该是：
   # dist/public/locals/
   # ├── user/
   # │   ├── zh.json
   # │   └── en.json
   ```

2. 检查 vite.config.ts 配置：
   ```typescript
   build: {
     publicDir: 'public',  // 确保设置了 publicDir
     emptyOutDir: true,
   }
   ```

3. 重新构建：
   ```bash
   npm run build:frontend
   ```

4. 验证构建结果：
   ```bash
   npm run verify:build
   ```

5. 检查 wrangler.toml：
   ```toml
   [assets]
   directory = "dist"  # 确保 directory 正确
   ```

---

### 问题 4：模块加载错误

**错误信息**：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script
```

**原因**：
- HTML 引用了错误的文件类型（.tsx 而非 .js）
- MIME type 错误

**解决方案**：

1. 检查 HTML 文件：
   ```bash
   grep "script" dist/public/user-v6.html
   
   # 确保引用的是 .js 文件
   # 确保使用 type="module"
   ```

2. 检查 Worker 响应头：
   ```javascript
   return new Response(htmlContent, {
     headers: {
       'Content-Type': 'text/html;charset=UTF-8',
       // 不要设置错误的 MIME type
     }
   });
   ```

3. 清除浏览器缓存：
   - Ctrl + Shift + R（强制刷新）
   - 或使用无痕模式

---

### 问题 5：部署超时

**错误信息**：
```
Timeout: Deploy operation timed out
```

**原因**：
- 网络连接不稳定
- 文件过大
- Cloudflare API 响应慢

**解决方案**：

1. 检查网络连接：
   ```bash
   ping api.cloudflare.com
   ```

2. 减小文件大小：
   ```bash
   # 优化构建配置
   # vite.config.ts
   build: {
     chunkSizeWarningLimit: 500,
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom'],
         }
       }
     }
   }
   ```

3. 增加超时时间：
   ```bash
   # wrangler.toml
   [build]
   timeout = 180  # 秒
   ```

4. 重试部署：
   ```bash
   npm run deploy
   ```

---

## 最佳实践

### 1. 部署前检查清单

在每次部署前，确保：

- [ ] 所有代码已提交到 Git
- [ ] 本地构建成功（`npm run build:frontend`）
- [ ] 翻译文件已更新（`public/locals/user/*.json`）
- [ ] 运行验证脚本（`npm run verify:build`）
- [ ] 环境变量已设置（`wrangler secret list`）
- [ ] 数据库迁移已执行（`npm run db:migrate`）
- [ ] 在预览环境测试（`wrangler dev`）
- [ ] Worker 路由使用 Assets 读取 HTML 文件（非硬编码）
- [ ] 静态文件返回正确的 MIME 类型
- [ ] 浏览器控制台无 404 或 MIME 类型错误

### 2. 避免硬编码 HTML 内容

**❌ 错误做法**：
```javascript
// 硬编码 HTML 内容
if (path === '/user') {
  const html = `<!DOCTYPE html>
    <script type="module" src="./user-v6.tsx"></script>
  </html>`;
  return new Response(html, { ... });
}
```

**✅ 正确做法**：
```javascript
// 从 Assets 读取构建后的 HTML
if (path === '/user') {
  const userV6Url = new URL('/public/user-v6.html', request.url);
  const assetResponse = await ASSETS.fetch(new Request(userV6Url, { method: 'GET' }));
  if (assetResponse && assetResponse.status !== 404) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}
```

**原因**：
- 每次构建后 JS 文件名会变化（哈希值）
- 硬编码的 HTML 不会自动更新
- 从 Assets 读取确保总是使用最新版本

### 3. 正确设置 MIME 类型

**所有静态资源必须设置正确的 MIME 类型**：
```javascript
// MIME 类型映射
const mimeTypes = {
  '.js': 'application/javascript;charset=UTF-8',
  '.mjs': 'application/javascript;charset=UTF-8',
  '.json': 'application/json;charset=UTF-8',
  '.css': 'text/css;charset=UTF-8',
  '.html': 'text/html;charset=UTF-8',
  '.svg': 'image/svg+xml;charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// 获取 MIME 类型
const ext = path.substring(path.lastIndexOf('.'));
const contentType = mimeTypes[ext] || 'application/octet-stream';
```

**重要**：
- 模块脚本（`type="module"`）必须返回 `application/javascript` 或 `text/javascript`
- MIME 类型不能为空字符串

### 4. 版本管理

**使用 Git 标签**：
```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0

# 查看标签
git tag -l
```

**版本号规范**：
- 主版本号.次版本号.修订号
- 例如：1.0.0, 1.0.1, 1.1.0, 2.0.0

### 3. 回滚策略

**快速回滚**：
```bash
# 1. 回滚到上一个 Git 版本
git reset --hard HEAD~1

# 2. 重新部署
npm run deploy

# 3. 验证线上版本
curl https://rualive-email-worker.cubetan57.workers.dev/
```

**使用 Wrangler 回滚**：
```bash
# 查看部署历史
wrangler deployments list

# 回滚到特定版本
wrangler rollback <version-id>
```

### 4. 监控和日志

**查看 Worker 日志**：
```bash
# 实时查看日志
npm run tail

# 查看特定时间的日志
wrangler tail --format pretty
```

**监控关键指标**：
- 请求数量
- 错误率
- 响应时间
- 资源使用量

### 5. 安全检查

**部署前安全检查**：

1. 检查敏感信息：
   ```bash
   # 搜索硬编码的密钥
   grep -r "API_KEY\|SECRET\|PASSWORD" src/
   ```

2. 验证环境变量：
   ```bash
   wrangler secret list
   ```

3. 检查权限：
   ```bash
   # 确保 .env 文件不在 Git 中
   grep ".env" .gitignore
   ```

---

## 常用命令速查

### 开发命令

```bash
# 本地开发
npm run dev

# 前端开发
npm run dev:frontend

# 构建前端
npm run build:frontend
```

### 部署命令

```bash
# 验证构建
npm run verify:build

# 强制更新文件
node scripts/force-update.js

# 部署（推荐）
npm run deploy

# 完整部署
npm run deploy:full

# 查看日志
npm run tail
```

### 数据库命令

```bash
# 创建数据库
npm run db:create

# 执行迁移
npm run db:migrate

# 查看数据库信息
wrangler d1 info rualive
```

### KV 命令

```bash
# 创建 KV 命名空间
npm run kv:create

# 查看 KV 内容
wrangler kv:key list --namespace-id=your-kv-id
```

---

## 参考资料

### 官方文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)

### 项目文档

- [README.md](../README.md) - 项目概述
- [QUICK_START.md](../QUICK_START.md) - 快速开始
- [AGENTS.md](../../AGENTS.md) - 开发指南

### 相关工具

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Resend Email API](https://resend.com/)
- [D1 Database](https://developers.cloudflare.com/d1/)

### 7. 项目历史 API 返回 404 错误

**现象**：
- 点击项目查看历史时返回 404 错误
- 项目历史数据无法加载
- 甘特图无法显示项目数据

**错误信息**：
```
GET /api/projects/history?projectId=617bc8f 404 (Not Found)
[Dashboard] API request failed for gantt: 404
```

**原因**：
- 项目不在 `projects` 表中（旧数据）
- 项目不在 `work_logs` 表中
- 项目 ID 不匹配

**数据结构说明**：

`work_logs` 表中的 `projects_json` 字段是一个 JSON 数组：
```json
[
  {
    "projectId": "617bc8f",
    "name": "10000钻-星河梦骑.aep",
    "path": "E:\\工作\\2026\\202602\\20260202\\10000钻-星河梦骑.aep",
    "statistics": {
      "compositions": 46,
      "layers": 367,
      "keyframes": 698,
      "effects": 424
    },
    "dailyRuntime": 9000
  }
]
```

**修复方案**：

系统已内置自动修复机制，API 会自动处理：

1. **查询优先级**：
   - 优先查询 `project_daily_stats` 表（新数据）
   - 后备查询 `work_logs` 表（旧数据）
   - 自动创建 `projects` 表记录

2. **JavaScript 过滤**：
   - 查询所有 `work_logs` 记录
   - 在 JavaScript 中解析 `projects_json` 数组
   - 过滤出匹配 `projectId` 的日志

3. **自动创建记录**：
   - 提取项目名称、路径等信息
   - 计算总工作时长和工作天数
   - 在 `projects` 表中创建记录

4. **聚合统计数据**：
   - `work_hours`: 从 `dailyRuntime` 转换为小时（`dailyRuntime / 3600`）
   - `accumulated_runtime`: 直接使用 `dailyRuntime`（秒）
   - `composition_count`: 从 `statistics.compositions` 获取
   - `layer_count`: 从 `statistics.layers` 获取
   - `keyframe_count`: 从 `statistics.keyframes` 获取
   - `effect_count`: 从 `statistics.effects` 获取

**验证修复**：

```bash
# 1. 查看日志
npx wrangler tail | grep "handleGetProjectHistory"

# 2. 检查项目记录
npx wrangler d1 execute rualive --remote --command="SELECT * FROM projects WHERE project_id = '617bc8f'"

# 3. 测试 API
curl "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=617bc8f" \
  -H "Authorization: Bearer your-token"
```

**兼容性说明**：

- ✅ 支持新数据：`project_daily_stats` 表中的项目累积数据
- ✅ 支持旧数据：`work_logs` 表中的历史数据
- ✅ 自动迁移：首次查询旧数据时自动创建 `projects` 表记录
- ✅ 无缝切换：前端代码无需修改，API 自动适配不同数据源

---

## 更新日志

### 2026-02-07

- 新增强制文件更新脚本 (`scripts/force-update.js`)
- 修改 `package.json` 添加 `predeploy` 钩子
- 优化部署流程，确保关键文件始终更新
- 新增 `deploy:full` 命令

### 2026-01-30

- 修复翻译文件部署问题
- 优化 HTML 文件引用
- 新增部署验证脚本

---

## 贡献

如果您遇到新的部署问题或解决方案，请更新本文档。

**更新步骤**：
1. 在相应章节添加问题描述
2. 详细记录排查步骤
3. 提供有效的解决方案
4. 更新更新日志

---

## 许可证

ISC

---

**文档版本**: 1.1.0  
**最后更新**: 2026-02-08  
**维护者**: iFlow CLI  

**更新日志**：
- v1.2.0 (2026-02-09): 添加项目历史 API 404 错误的解决方案
- v1.1.0 (2026-02-08): 添加 Worker 路由错误和 MIME 类型问题的解决方案
- v1.0.0 (2026-02-07): 初始版本，汇总部署问题和解决方案