# Worker 部署流程和配置分析

## 文档信息
- **创建日期**: 2026-02-07
- **分析阶段**: 阶段6 - 部署流程和配置
- **分析范围**: RuAlive Email Worker 的完整部署流程和配置管理

---

## 1. 部署架构概述

### 1.1 部署平台
- **Cloudflare Workers**: 无服务器计算平台
- **全球部署**: Cloudflare 边缘网络（200+ 数据中心）
- **自动扩展**: 按需扩展，无需管理服务器
- **版本控制**: 通过 Git + Wrangler CLI 管理

### 1.2 部署架构图

```
本地开发环境
  ↓
代码提交 (Git)
  ↓
构建流程 (Vite)
  ├─ React 应用构建
  ├─ 资源优化
  └─ 代码分割
  ↓
输出目录 (dist/)
  ├─ HTML 文件
  ├─ JavaScript 文件
  ├─ CSS 文件
  └─ 资源文件
  ↓
Wrangler 部署
  ├─ 上传到 Cloudflare Workers
  ├─ 配置 Assets 绑定
  ├─ 配置 D1 数据库
  ├─ 配置 KV 存储
  └─ 设置环境变量
  ↓
生产环境
  ├─ https://rualive-email-worker.cubetan57.workers.dev
  ├─ D1 数据库 (rualive)
  ├─ KV 存储 (KV)
  └─ Cron 触发器 (每小时)
```

---

## 2. 构建流程

### 2.1 构建工具

#### Vite 配置
**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'user-v6': 'public/user-v6.html',
        'admin': 'public/admin.html',
        'auth': 'public/auth.html',
        'index': 'public/index.html',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: undefined,
      }
    }
  }
});
```

#### 构建入口点
| 入口名称 | 源文件 | 路由 | 说明 |
|---------|--------|------|------|
| `index` | `public/index.html` | `/` | 首页 |
| `auth` | `public/auth.html` | `/login` | 登录页 |
| `user-v6` | `public/user-v6.html` | `/user` | 用户仪表板 |
| `admin` | `public/admin.html` | `/admin` | 管理后台 |

### 2.2 构建流程详解

#### 步骤1: 清理旧文件
```bash
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
```

#### 步骤2: 前端构建
```bash
cd public
npm run build
```

**构建过程**:
1. Vite 读取 `vite.config.ts`
2. 解析 HTML 入口文件
3. 编译 TypeScript
4. 转换 JSX
5. 模块打包和分割
6. 代码压缩和优化
7. 生成哈希文件名
8. 输出到 `public/dist/`

#### 步骤3: 复制构建文件
```bash
cd ..
Copy-Item public\dist -Destination dist -Recurse -Force
```

#### 步骤4: 部署到 Cloudflare
```bash
npx wrangler deploy
```

**部署过程**:
1. Wrangler 读取 `wrangler.toml`
2. 打包 `dist/` 目录
3. 上传到 Cloudflare
4. 配置 Assets 绑定
5. 配置 D1 数据库绑定
6. 配置 KV 存储绑定
7. 设置 Cron 触发器
8. 部署完成

#### 步骤5: 清理临时文件
```bash
Remove-Item public\dist -Recurse -Force -ErrorAction SilentlyContinue
```

### 2.3 自动化部署脚本

**文件**: `deploy.ps1`

**脚本特性**:
- ✅ 智能检查：检测源文件是否修改
- ✅ 节省时间：避免不必要的重复构建
- ✅ 强制模式：使用 `-Force` 参数强制重新构建
- ✅ 构建模式：使用 `-NoDeploy` 参数只构建不部署

**使用方法**:
```bash
# 正常部署（智能检查文件变化）
.\deploy.ps1

# 强制重新构建（跳过检查）
.\deploy.ps1 -Force

# 只构建不部署
.\deploy.ps1 -NoDeploy
```

**脚本内容**:
```powershell
# 检查源文件是否修改
$sourceFiles = Get-ChildItem -Path "public/src" -Recurse -File
$distFiles = Get-ChildItem -Path "dist/assets" -File
$needRebuild = $false

if (-not $Force -and $distFiles.Count -gt 0) {
    # 比较文件修改时间
    foreach ($source in $sourceFiles) {
        $distFile = "dist/assets/" + $source.Name
        if (Test-Path $distFile) {
            $distItem = Get-Item $distFile
            if ($source.LastWriteTime -gt $distItem.LastWriteTime) {
                $needRebuild = $true
                break
            }
        }
    }
}

if ($needRebuild -or $Force) {
    # 执行构建
    Write-Host "开始构建前端..."
    Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
    cd public
    npm run build
    cd ..
    Copy-Item public\dist -Destination dist -Recurse -Force
    
    if (-not $NoDeploy) {
        # 部署
        Write-Host "开始部署 Worker..."
        npx wrangler deploy
    }
} else {
    Write-Host "源文件未修改，跳过构建"
}
```

---

## 3. 配置管理

### 3.1 Wrangler 配置

**文件**: `wrangler.toml`

```toml
name = "rualive-email-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Assets 配置 - 静态文件托管
[assets]
directory = "dist"
binding = "ASSETS"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "KV"
id = "2ab9c0f8a4be4e56a30097fcd349befb"
preview_id = "192c3912542a49b99fa06c1419d2fd7a"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "59a95578-9781-4592-a711-d961765766c5"

# Cron 触发器 - 每小时检查一次
[triggers]
crons = ["0 * * * *"]

# 环境变量（公开）
[vars]
ENVIRONMENT = "production"
FROM_EMAIL = "RuAlive@itycon.cn"
DEPLOY_TIMESTAMP = "2026-02-02-10-20"
```

### 3.2 环境变量

#### 公开环境变量
存储在 `wrangler.toml` 的 `[vars]` 部分：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ENVIRONMENT` | 运行环境 | `production` / `preview` |
| `FROM_EMAIL` | 发件人邮箱 | `RuAlive@itycon.cn` |
| `DEPLOY_TIMESTAMP` | 部署时间戳 | `2026-02-02-10-20` |

#### 私密环境变量
存储在 Cloudflare Secrets 中：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `RESEND_API_KEY` | Resend API 密钥 | `wrangler secret put RESEND_API_KEY` |
| `JWT_SECRET` | JWT 签名密钥 | `wrangler secret put JWT_SECRET`（可选） |

**设置方法**:
```bash
# 设置 Resend API 密钥
wrangler secret put RESEND_API_KEY
# 输入: re_xxxxxxxxxxxxxx

# 设置 JWT 密钥（可选）
wrangler secret put JWT_SECRET
# 输入: your-secret-key-here
```

### 3.3 绑定配置

#### Assets 绑定
```toml
[assets]
directory = "dist"
binding = "ASSETS"
```

**用途**:
- 托管静态 HTML 文件
- 托管构建后的 JavaScript 文件
- 托管构建后的 CSS 文件
- 托管图片和其他资源

**访问方式**:
```javascript
const ASSETS = env.ASSETS;
const response = await ASSETS.fetch(new Request(request.url, { method: 'GET' }));
```

#### KV 绑定
```toml
[[kv_namespaces]]
binding = "KV"
id = "2ab9c0f8a4be4e56a30097fcd349befb"
preview_id = "192c3912542a49b99fa06c1419d2fd7a"
```

**用途**:
- 缓存用户配置
- 存储邀请码
- 存储 API 密钥
- 缓存静态资源

**访问方式**:
```javascript
const KV = env.KV;
await KV.put(key, value);
const value = await KV.get(key);
```

#### D1 数据库绑定
```toml
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "59a95578-9781-4592-a711-d961765766c5"
```

**用途**:
- 用户数据存储
- 工作日志存储
- 项目数据存储
- 系统配置存储

**访问方式**:
```javascript
const DB = env.DB || env.rualive;
const result = await DB.prepare(sql).bind(params).run();
```

---

## 4. 数据库配置

### 4.1 创建数据库

#### 方法1: 自动创建（推荐）
```bash
npm run db:create
```

**返回示例**:
```
✨ Successfully created DB 'rualive'!

database_id = "59a95578-9781-4592-a711-d961765766c5"
```

#### 方法2: 手动创建
```bash
wrangler d1 create rualive
```

### 4.2 执行数据库迁移

#### 初始架构
```bash
npm run db:migrate
```

**等同于**:
```bash
wrangler d1 execute rualive --file=./schema.sql
```

#### 增量迁移
```bash
# 执行单个迁移文件
wrangler d1 execute rualive --file=./migrations/migration_add_project_id.sql

# 本地环境
wrangler d1 execute rualive --local --file=./schema.sql

# 远程环境
wrangler d1 execute rualive --remote --file=./schema.sql
```

### 4.3 数据库迁移版本

#### 已执行的迁移
| 迁移版本 | 文件名 | 说明 | 日期 |
|---------|--------|------|------|
| v001 | `schema.sql` | 初始架构 | 2026-01-01 |
| v002 | `migration_add_project_id.sql` | 添加 project_id 字段 | 2026-01-29 |

#### 迁移历史
```sql
-- 建议添加版本表
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
INSERT INTO schema_migrations (version) VALUES ('002_add_project_id');
```

---

## 5. KV 存储配置

### 5.1 创建 KV 命名空间

#### 生产环境
```bash
npm run kv:create
```

**返回示例**:
```
✨ Successfully created KV namespace!

id = "2ab9c0f8a4be4e56a30097fcd349befb"
```

#### 预览环境
```bash
npm run kv:create-preview
```

**返回示例**:
```
✨ Successfully created KV namespace!

id = "192c3912542a49b99fa06c1419d2fd7a"
```

### 5.2 更新配置

将返回的 ID 更新到 `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "2ab9c0f8a4be4e56a30097fcd349befb"  # 替换这里
preview_id = "192c3912542a49b99fa06c1419d2fd7a"  # 替换这里
```

### 5.3 KV 存储使用

#### 缓存键命名规范
```javascript
// 用户配置缓存
`user_config:${userId}`

// 邀请码缓存
`invite_code:${code}`

// API 密钥缓存
`api_key:${userId}`

// 静态资源缓存
`static:${path}:${hash}`
```

#### 缓存过期时间
```javascript
// 短期缓存（5分钟）
await KV.put(key, value, { expirationTtl: 300 })

// 中期缓存（1小时）
await KV.put(key, value, { expirationTtl: 3600 })

// 长期缓存（24小时）
await KV.put(key, value, { expirationTtl: 86400 })

// 永久缓存
await KV.put(key, value)
```

---

## 6. Cron 触发器配置

### 6.1 Cron 表达式

**配置**: `wrangler.toml`
```toml
[triggers]
crons = ["0 * * * *"]
```

**表达式说明**:
```
0 * * * *
│ │ │ │ │
│ │ │ │ └─ 星期几 (0-6, 0=周日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

**当前配置**: `0 * * * *` = 每小时的第 0 分钟执行

### 6.2 Cron 触发功能

**触发后执行**:
```javascript
async function handleCronTrigger(env) {
  // 检查是否需要发送邮件
  // 查询待发送邮件的用户
  // 发送邮件
  // 记录发送日志
}
```

**执行逻辑**:
1. 获取当前时间
2. 查询用户配置
3. 检查邮件发送时间
4. 查询今日工作数据
5. 检查工作时长阈值
6. 发送邮件通知
7. 记录发送日志

---

## 7. 部署命令

### 7.1 基础命令

#### 初始化项目
```bash
# 安装依赖
npm install

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
npm run kv:create
npm run kv:create-preview

# 创建数据库
npm run db:create

# 执行数据库迁移
npm run db:migrate

# 设置密钥
wrangler secret put RESEND_API_KEY
```

#### 开发命令
```bash
# 本地开发（Worker）
npm run dev

# 前端开发（React）
npm run dev:frontend

# 查看实时日志
npm run tail
```

#### 构建命令
```bash
# 构建前端
npm run build:frontend

# 部署 Worker
npm run deploy

# 部署首页
npm run deploy:landing
```

### 7.2 高级命令

#### 数据库操作
```bash
# 查询数据库
wrangler d1 execute rualive --remote --command "SELECT * FROM users"

# 执行 SQL 文件
wrangler d1 execute rualive --remote --file=./schema.sql

# 备份数据库
wrangler d1 export rualive --remote --output=backup.sql

# 导入数据
wrangler d1 execute rualive --remote --file=backup.sql
```

#### KV 操作
```bash
# 列出所有键
wrangler kv:key list KV --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"

# 获取键值
wrangler kv:key get KV "user_123" --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"

# 设置键值
wrangler kv:key put KV "user_123" '{"config":{...}}' --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"

# 删除键
wrangler kv:key delete KV "user_123" --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"
```

---

## 8. 部署验证

### 8.1 健康检查

#### 基础健康检查
```bash
curl https://rualive-email-worker.cubetan57.workers.dev/health
```

**预期响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T14:30:00.000Z"
}
```

### 8.2 功能测试

#### 用户注册
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

#### 用户登录
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 上传工作数据
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/work-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "workDate": "2026-02-07",
    "workData": {
      "work_hours": 0.00056,
      "accumulated_work_hours": 54.68,
      "keyframe_count": 699,
      "composition_count": 38,
      "layer_count": 8,
      "effect_count": 273
    }
  }'
```

### 8.3 前端访问

#### 访问地址
| 页面 | URL | 说明 |
|------|-----|------|
| 首页 | `https://rualive-email-worker.cubetan57.workers.dev/` | 产品介绍 |
| 登录页 | `https://rualive-email-worker.cubetan57.workers.dev/login` | 用户登录 |
| 用户仪表板 | `https://rualive-email-worker.cubetan57.workers.dev/user` | 数据查看 |
| 管理后台 | `https://rualive-email-worker.cubetan57.workers.dev/admin` | 系统管理 |

---

## 9. 监控和调试

### 9.1 实时日志

#### 查看实时日志
```bash
npm run tail
```

#### 日志级别
```javascript
console.log('[INFO] 信息日志');
console.error('[ERROR] 错误日志');
console.warn('[WARN] 警告日志');
console.debug('[DEBUG] 调试日志');
```

### 9.2 数据库监控

#### 查询用户统计
```bash
wrangler d1 execute rualive --remote --command "SELECT COUNT(*) as total_users FROM users"
```

#### 查询今日工作数据
```bash
wrangler d1 execute rualive --remote --command "SELECT * FROM work_logs WHERE work_date = '2026-02-07'"
```

#### 查询邮件发送状态
```bash
wrangler d1 execute rualive --remote --command "SELECT status, COUNT(*) as count FROM email_logs GROUP BY status"
```

### 9.3 性能监控

#### Worker 性能指标
- 响应时间
- 请求成功率
- 错误率
- CPU 使用率

#### 监控工具
- Cloudflare Dashboard
- Cloudflare Analytics
- Wrangler CLI

---

## 10. 常见问题

### 10.1 部署失败

#### 问题1: 构建失败
**症状**: `npm run build:frontend` 失败

**解决方案**:
```bash
# 清理缓存
Remove-Item node_modules -Recurse -Force
Remove-Item public\dist -Recurse -Force

# 重新安装依赖
npm install

# 重新构建
npm run build:frontend
```

#### 问题2: 部署失败
**症状**: `npm run deploy` 失败

**解决方案**:
```bash
# 检查登录状态
wrangler whoami

# 重新登录
wrangler login

# 检查配置
wrangler tail

# 重新部署
npm run deploy
```

### 10.2 配置问题

#### 问题1: 环境变量未生效
**症状**: 环境变量读取失败

**解决方案**:
```bash
# 检查 Secrets
wrangler secret list

# 重新设置 Secret
wrangler secret put RESEND_API_KEY

# 验证配置
wrangler tail
```

#### 问题2: 数据库连接失败
**症状**: 数据库查询失败

**解决方案**:
```bash
# 检查数据库 ID
wrangler d1 list

# 更新 wrangler.toml
# 确保数据库 ID 正确

# 重新部署
npm run deploy
```

### 10.3 路由问题

#### 问题1: 前端路由404
**症状**: 访问 `/user` 返回 404

**解决方案**:
```bash
# 检查构建文件
dir dist

# 检查 vite.config.ts
# 确认 user-v6.html 在输入列表

# 重新构建
npm run build:frontend

# 重新部署
npm run deploy
```

#### 问题2: API 路由404
**症状**: API 请求返回 404

**解决方案**:
```bash
# 检查 Worker 路由配置
# 查看 src/index.js 路由定义

# 检查请求方法
# 确认 GET/POST 方法正确

# 检查路由路径
# 确认路径拼写正确
```

---

## 11. 版本管理

### 11.1 版本控制策略

#### Git 工作流
```bash
# 开发分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/new-feature

# 合并到主分支
git checkout master
git merge feature/new-feature

# 部署到生产
.\deploy.ps1
```

#### 版本标签
```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

### 11.2 回滚策略

#### 代码回滚
```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交
git reset --hard <commit-hash>

# 重新部署
.\deploy.ps1
```

#### 数据库回滚
```bash
# 查看迁移历史
wrangler d1 execute rualive --remote --command "SELECT * FROM schema_migrations ORDER BY applied_at DESC"

# 回滚到指定版本
# 手动执行回滚 SQL
wrangler d1 execute rualive --remote --file=./rollback_v001.sql
```

---

## 12. 最佳实践

### 12.1 部署前检查清单
- [ ] 代码已提交到 Git
- [ ] 本地测试通过
- [ ] 数据库迁移已准备
- [ ] 环境变量已配置
- [ ] Secrets 已设置
- [ ] 配置文件已更新
- [ ] 构建文件已生成

### 12.2 部署后验证
- [ ] Worker URL 可访问
- [ ] 健康检查通过
- [ ] 前端页面正常加载
- [ ] API 端点正常工作
- [ ] 数据库连接正常
- [ ] 日志输出正常
- [ ] Cron 触发器正常

### 12.3 安全建议
- [ ] 定期更新依赖
- [ ] 使用强密码
- [ ] 定期审查 Secrets
- [ ] 启用 HTTPS
- [ ] 实施 CORS 策略
- [ ] 定期备份数据
- [ ] 监控异常访问

---

## 13. 下一步分析

本阶段已完成部署流程和配置分析，下一阶段将分析：
- 数据库结构和数据流（阶段3）
- 前端架构和构建流程（阶段4）
- 前端面板功能和数据获取（阶段5）

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 阶段6 完成