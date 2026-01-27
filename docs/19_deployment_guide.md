# Worker 部署指南

## 文档信息
- **创建日期**: 2026-01-26
- **项目**: RuAlive Email Worker
- **版本**: 1.0.0
- **作者**: iFlow CLI

## 目录
1. [环境准备](#环境准备)
2. [本地开发](#本地开发)
3. [构建流程](#构建流程)
4. [部署流程](#部署流程)
5. [数据库管理](#数据库管理)
6. [KV 存储](#kv-存储)
7. [问题排查](#问题排查)
8. [最佳实践](#最佳实践)

## 环境准备

### 必需工具

1. **Node.js** (v18 或更高)
```bash
node --version
# 应该显示 v18.x.x 或更高
```

2. **npm** (随 Node.js 安装)
```bash
npm --version
# 应该显示 9.x.x 或更高
```

3. **Wrangler CLI** (Cloudflare Workers 工具)
```bash
npm install -g wrangler
wrangler --version
# 应该显示版本号
```

### 安装依赖

```bash
# 进入项目目录
cd rualive-email-worker

# 安装项目依赖
npm install

# 安装前端依赖
cd public
npm install
cd ..
```

### 配置 Wrangler

```bash
# 登录 Cloudflare
wrangler login

# 验证登录
wrangler whoami
```

## 本地开发

### 启动开发服务器

**后端开发**:
```bash
cd rualive-email-worker
npm run dev
```

**前端开发**:
```bash
cd rualive-email-worker/public
npm run dev
```

**同时启动**:
```bash
# 终端 1: 启动后端
cd rualive-email-worker
npm run dev

# 终端 2: 启动前端
cd rualive-email-worker/public
npm run dev
```

### 访问应用

- **后端**: http://localhost:8787
- **前端**: http://localhost:3737

### 开发代理配置

**vite.config.ts**:
```typescript
server: {
  port: 3737,
  host: '0.0.0.0',
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 构建流程

### 构建前端

**标准构建**:
```bash
cd public
npm run build
```

**清理构建**:
```bash
cd public
rm -rf dist node_modules/.vite
npm run build
```

**构建输出**:
```
public/dist/
├── index.html
├── auth.html
└── assets/
    ├── main-C3FqXtyv.js
    ├── auth-Cd3Hrr86.js
    └── client-*.js
```

### 验证构建

**检查文件**:
```bash
ls -la public/dist/
ls -la public/dist/assets/
```

**检查 HTML 引用**:
```bash
grep "script" public/dist/index.html
grep "script" public/dist/auth.html
```

**检查文件大小**:
```bash
du -sh public/dist/
du -sh public/dist/assets/
```

## 部署流程

### 部署到 Cloudflare

**完整部署**:
```bash
# 1. 构建前端
cd public
npm run build
cd ..

# 2. 部署到 Cloudflare
npm run deploy
```

**一键部署脚本**:
```bash
# 创建 scripts/deploy.sh
#!/bin/bash
set -e

echo "🧹 清理构建产物..."
cd public
rm -rf dist node_modules/.vite

echo "🔨 构建前端..."
npm run build

echo "📦 部署到 Cloudflare..."
cd ..
npm run deploy

echo "✅ 部署完成！"
echo "🌐 访问: https://rualive-email-worker.cubetan57.workers.dev"
```

**使用脚本**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 部署选项

**部署到生产环境**:
```bash
npm run deploy
```

**部署到预览环境**:
```bash
wrangler deploy --env preview
```

**仅部署 Worker 代码**:
```bash
wrangler deploy src/index.js
```

**仅部署 Assets**:
```bash
wrangler deploy public/dist
```

### 验证部署

**检查部署状态**:
```bash
wrangler deployments list
```

**访问应用**:
```bash
# 生产环境
curl https://rualive-email-worker.cubetan57.workers.dev

# 预览环境
curl https://rualive-email-worker-preview.cubetan57.workers.dev
```

**查看日志**:
```bash
npm run tail
```

## 数据库管理

### 创建数据库

```bash
wrangler d1 create rualive
```

**输出示例**:
```
✅ Successfully created DB 'rualive'
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**更新 wrangler.toml**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 执行迁移

**创建表**:
```bash
wrangler d1 execute rualive --file=./schema.sql
```

**运行迁移**:
```bash
wrangler d1 migrations apply rualive --remote
```

### 查询数据库

**执行查询**:
```bash
wrangler d1 execute rualive --remote --command="SELECT * FROM users LIMIT 10"
```

**交互式查询**:
```bash
wrangler d1 execute rualive --remote --command="SELECT COUNT(*) as count FROM users"
```

### 备份数据库

**导出数据**:
```bash
wrangler d1 export rualive --remote --output=backup.sql
```

**恢复数据**:
```bash
wrangler d1 execute rualive --remote --file=backup.sql
```

## KV 存储

### 创建 KV 命名空间

**生产环境**:
```bash
wrangler kv:namespace create KV
```

**预览环境**:
```bash
wrangler kv:namespace create KV --preview
```

**输出示例**:
```
✅ Successfully created KV namespace 'KV'
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

**更新 wrangler.toml**:
```toml
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

### KV 操作

**写入数据**:
```bash
wrangler kv:key put --namespace-id=xxxxxxxx "key" "value"
```

**读取数据**:
```bash
wrangler kv:key get --namespace-id=xxxxxxxx "key"
```

**删除数据**:
```bash
wrangler kv:key delete --namespace-id=xxxxxxxx "key"
```

**列出所有键**:
```bash
wrangler kv:key list --namespace-id=xxxxxxxx
```

### 批量上传

**创建脚本**:
```javascript
// scripts/upload-kv.js
const KV_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const data = {
  'config:email': 'admin@example.com',
  'config:reminder_time': '18:00',
  'config:timezone': 'Asia/Shanghai'
};

for (const [key, value] of Object.entries(data)) {
  console.log(`Uploading ${key}...`);
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_ID}/values/${key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'text/plain'
    },
    body: value
  });
}

console.log('✅ Upload complete!');
```

**运行脚本**:
```bash
node scripts/upload-kv.js
```

## 问题排查

### 构建失败

**问题**: Vite 构建失败

**解决方案**:
```bash
# 1. 清理缓存
cd public
rm -rf dist node_modules/.vite

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 重新构建
npm run build
```

### 部署失败

**问题**: Wrangler 部署失败

**解决方案**:
```bash
# 1. 检查登录状态
wrangler whoami

# 2. 重新登录
wrangler login

# 3. 检查配置
wrangler deploy --dry-run

# 4. 查看详细日志
wrangler deploy --log-level debug
```

### Assets 404 错误

**问题**: 静态文件返回 404

**诊断**:
```bash
# 1. 检查 Assets 绑定
wrangler tail

# 2. 检查文件是否存在
ls -la public/dist/index.html
ls -la public/dist/assets/

# 3. 检查 wrangler.toml 配置
cat wrangler.toml | grep -A 5 "\[assets\]"
```

**解决方案**:
```bash
# 1. 重新构建
cd public
npm run build
cd ..

# 2. 重新部署
npm run deploy

# 3. 清除 Cloudflare 缓存
# 访问 Cloudflare Dashboard → Workers → RuAlive → Settings → Cache → Purge Cache
```

### 数据库连接失败

**问题**: D1 数据库连接失败

**诊断**:
```bash
# 1. 检查数据库配置
wrangler d1 list

# 2. 检查绑定
cat wrangler.toml | grep -A 5 "\[\[d1_databases\]\]\]"

# 3. 测试连接
wrangler d1 execute rualive --remote --command="SELECT 1"
```

**解决方案**:
```bash
# 1. 更新 wrangler.toml
# 确保 database_id 正确

# 2. 重新部署
npm run deploy

# 3. 检查数据库状态
wrangler d1 info rualive
```

### 环境变量问题

**问题**: 环境变量未加载

**解决方案**:
```bash
# 1. 设置环境变量
wrangler secret put RESEND_API_KEY

# 2. 验证环境变量
wrangler secret list

# 3. 在代码中使用
const apiKey = env.RESEND_API_KEY;
```

## 最佳实践

### 1. 版本控制

**忽略构建产物**:
```gitignore
# .gitignore
public/dist/
node_modules/
.wrangler/
```

**提交前检查**:
```bash
# 检查是否有未提交的构建产物
git status | grep "dist/"
```

### 2. 自动化部署

**使用 GitHub Actions**:
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd public && npm install && npm run build
      - uses: cloudflare/wrangler-action@v2
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 3. 监控和日志

**查看实时日志**:
```bash
npm run tail
```

**查看部署日志**:
```bash
wrangler deployments list
wrangler deployments tail <DEPLOYMENT_ID>
```

**设置告警**:
```javascript
// src/index.js
export default {
  async fetch(request, env, ctx) {
    try {
      // 处理请求
    } catch (error) {
      console.error('Request failed:', error);
      
      // 发送告警
      await fetch(env.ALERT_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify({ error: error.message })
      });
      
      throw error;
    }
  }
};
```

### 4. 性能优化

**构建优化**:
```typescript
// public/vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true  // 生产环境移除 console.log
    }
  }
}
```

**缓存优化**:
```javascript
// src/index.js
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    
    // 尝试从缓存获取
    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }
    
    // 处理请求
    response = await handleRequest(request, env);
    
    // 缓存响应
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    
    return response;
  }
};
```

### 5. 安全配置

**环境变量管理**:
```bash
# 使用 wrangler secrets
wrangler secret put RESEND_API_KEY
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
```

**CORS 配置**:
```javascript
// src/index.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

return new Response(data, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json'
  }
});
```

### 6. 测试策略

**单元测试**:
```bash
cd public
npm run test
```

**集成测试**:
```bash
cd tests
./test-simple.ps1
./test-send-email.ps1
```

**手动测试清单**:
- [ ] 落地页加载
- [ ] 登录功能
- [ ] 注册功能
- [ ] 用户页面
- [ ] 管理后台
- [ ] API 接口
- [ ] 邮件发送

## 总结

**部署流程**:
1. 构建前端 (`npm run build`)
2. 部署到 Cloudflare (`npm run deploy`)
3. 验证部署 (`curl <url>`)

**关键命令**:
```bash
npm run dev            # 本地开发
npm run build          # 构建前端
npm run deploy         # 部署到 Cloudflare
npm run tail           # 查看日志
wrangler d1 execute   # 数据库操作
wrangler kv:namespace # KV 操作
```

**常见问题**:
- 构建失败 → 清理缓存并重新构建
- 部署失败 → 检查登录状态和配置
- Assets 404 → 重新构建和部署
- 数据库连接失败 → 检查绑定和配置

**最佳实践**:
- 使用自动化部署（GitHub Actions）
- 监控日志和性能
- 优化缓存策略
- 加强安全配置
- 完善测试策略