# 部署场景和环境配�?
## 概述

本文档详细说明了 RuAlive Email Worker 的各种部署场景和环境配置，包括开发环境、测试环境、生产环境等�?
---

## 部署场景

### 1. 本地开发环�?
**用�?*: 开发和调试

**环境配置**:
```bash
# 环境变量
ENVIRONMENT=development
RESEND_API_KEY=your_api_key
FROM_EMAIL=dev@example.com
```

**部署步骤**:

```bash
# 1. 克隆项目
git clone https://github.com/yancongya/RuAlive.git
cd RuAlive/rualive-email-worker

# 2. 安装依赖
npm install

# 3. 创建 D1 数据库（本地�?npx wrangler d1 create rualive-dev --local

# 4. 执行数据库迁�?npm run db:migrate:local

# 5. 创建 KV 命名空间（本地）
npx wrangler kv create KV --local

# 6. 启动开发服务器
npm run dev
```

**特点**:
- 使用本地 D1 数据�?- 使用本地 KV 存储
- 热重载（Hot Reload�?- 源映射（Source Maps�?- 详细的错误信�?
**访问地址**:
```
http://localhost:8787
```

---

### 2. Cloudflare Workers Preview 环境

**用�?*: 在线预览和测�?
**环境配置**:
```bash
# wrangler.toml
[env.preview]
name = "rualive-email-worker-preview"
vars = { ENVIRONMENT = "preview" }

# 环境变量
ENVIRONMENT=preview
RESEND_API_KEY=your_api_key
FROM_EMAIL=preview@example.com
```

**部署步骤**:

```bash
# 1. 创建 Preview 环境 D1 数据�?npx wrangler d1 create rualive-preview

# 2. 记录 database_id
# database_id = "preview_db_id"

# 3. 更新 wrangler.toml
[[env.preview.d1_databases]]
binding = "DB"
database_name = "rualive-preview"
database_id = "preview_db_id"

# 4. 创建 Preview 环境 KV 命名空间
npx wrangler kv create KV --env preview

# 5. 记录 preview KV id
# preview_kv_id = "preview_kv_id"

# 6. 更新 wrangler.toml
[[env.preview.kv_namespaces]]
binding = "KV"
id = "preview_kv_id"

# 7. 执行数据库迁�?npx wrangler d1 execute rualive-preview --env preview --file=./migrations/migration_001_create_tables.sql
npx wrangler d1 execute rualive-preview --env preview --file=./migrations/migration_002_add_auth_tables.sql
npx wrangler d1 execute rualive-preview --env preview --file=./migrations/migration_003_add_project_tables.sql

# 8. 设置环境变量
npx wrangler secret put RESEND_API_KEY --env preview
npx wrangler secret put ENVIRONMENT --env preview

# 9. 部署�?Preview 环境
npx wrangler deploy --env preview
```

**特点**:
- �?Cloudflare Workers 上运�?- 独立�?D1 数据�?- 独立�?KV 存储
- 不影响生产环�?- 可随时删�?
**访问地址**:
```
https://rualive-email-worker-preview.YOUR_SUBDOMAIN.workers.dev
```

---

### 3. Cloudflare Workers 生产环境

**用�?*: 正式生产环境

**环境配置**:
```bash
# wrangler.toml
name = "rualive-email-worker"
vars = { ENVIRONMENT = "production" }

# 环境变量
ENVIRONMENT=production
RESEND_API_KEY=your_production_api_key
FROM_EMAIL=noreply@example.com
```

**部署步骤**:

```bash
# 1. 创建生产环境 D1 数据�?npx wrangler d1 create rualive

# 2. 记录 database_id
# database_id = "production_db_id"

# 3. 更新 wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "production_db_id"

# 4. 创建生产环境 KV 命名空间
npx wrangler kv create KV

# 5. 记录生产 KV id
# production_kv_id = "production_kv_id"

# 6. 更新 wrangler.toml
[[kv_namespaces]]
binding = "KV"
id = "production_kv_id"

# 7. 执行数据库迁�?npx wrangler d1 execute rualive --file=./migrations/migration_001_create_tables.sql
npx wrangler d1 execute rualive --file=./migrations/migration_002_add_auth_tables.sql
npx wrangler d1 execute rualive --file=./migrations/migration_003_add_project_tables.sql

# 8. 设置环境变量
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ENVIRONMENT

# 9. 初始化管理员账户
curl -X POST https://rualive.itycon.cn/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "your_strong_password"
  }'

# 10. 部署到生产环�?npm run deploy
```

**特点**:
- �?Cloudflare Workers 上运�?- 专用�?D1 数据�?- 专用�?KV 存储
- 配置 Cron 定时任务
- 配置自定义域�?
**访问地址**:
```
https://rualive.itycon.cn
https://api.example.com (自定义域�?
```

---

### 4. 多区域部�?
**用�?*: 全球分布部署，降低延�?
**配置示例**:

```bash
# wrangler.toml
[env.asia]
name = "rualive-email-worker-asia"
routes = [
  { pattern = "https://asia.example.com/*", zone_name = "example.com" }
]

[env.europe]
name = "rualive-email-worker-europe"
routes = [
  { pattern = "https://europe.example.com/*", zone_name = "example.com" }
]

[env.america]
name = "rualive-email-worker-america"
routes = [
  { pattern = "https://america.example.com/*", zone_name = "example.com" }
]
```

**部署步骤**:

```bash
# 1. 为每个区域创建独立的 D1 数据�?npx wrangler d1 create rualive-asia
npx wrangler d1 create rualive-europe
npx wrangler d1 create rualive-america

# 2. 更新 wrangler.toml 配置

# 3. 部署到各个区�?npx wrangler deploy --env asia
npx wrangler deploy --env europe
npx wrangler deploy --env america
```

**特点**:
- 多个地理区域部署
- 每个区域独立的数据库
- CDN 自动路由到最近区�?- 降低全球访问延迟

---

### 5. 灰度发布（蓝绿部署）

**用�?*: 平滑过渡，降低发布风�?
**配置示例**:

```bash
# wrangler.toml
[env.blue]
name = "rualive-email-worker-blue"
vars = { VERSION = "blue" }

[env.green]
name = "rualive-email-worker-green"
vars = { VERSION = "green" }
```

**部署步骤**:

```bash
# 1. 创建两个环境
npx wrangler d1 create rualive-blue
npx wrangler d1 create rualive-green

# 2. 配置 Workers Routes（Cloudflare Dashboard�?# - 蓝色环境�?00% 流量
# - 绿色环境�?% 流量

# 3. 部署新版本到绿色环境
npx wrangler deploy --env green

# 4. 测试绿色环境
curl https://rualive-email-worker-green.cubetan57.workers.dev/api/health

# 5. 逐步切换流量
# - �?天：10% �?绿色
# - �?天：50% �?绿色
# - �?天：100% �?绿色

# 6. 监控绿色环境，确认无问题

# 7. 删除蓝色环境
npx wrangler delete rualive-email-worker-blue
```

**特点**:
- 两个环境同时运行
- 逐步切换流量
- 快速回�?- 降低发布风险

---

## 环境配置详解

### wrangler.toml 配置

```toml
name = "rualive-email-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 环境变量
[vars]
ENVIRONMENT = "production"
FROM_EMAIL = "noreply@example.com"

# D1 数据库绑�?[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "59a95578-9781-4592-a711-d961765766c5"

# KV 存储绑定
[[kv_namespaces]]
binding = "KV"
id = "2ab9c0f8a4be4e56a30097fcd349befb"

# 静态资源绑�?[assets]
directory = "./public"
binding = "ASSETS"

# Cron 定时任务
[triggers]
crons = ["0 * * * *"]  # 每小时执行一�?
# 路由配置
routes = [
  { pattern = "https://api.example.com/*", zone_name = "example.com" }
]

# Preview 环境配置
[env.preview]
name = "rualive-email-worker-preview"
vars = { ENVIRONMENT = "preview" }

[[env.preview.d1_databases]]
binding = "DB"
database_name = "rualive-preview"
database_id = "preview_db_id"

[[env.preview.kv_namespaces]]
binding = "KV"
id = "preview_kv_id"

[env.preview.assets]
directory = "./public"
binding = "ASSETS"
```

### 环境变量配置

| 变量�?| 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| ENVIRONMENT | string | �?| 环境标识 | `production`、`preview`、`development` |
| RESEND_API_KEY | string | �?| Resend API 密钥（Secret�?| `re_xxxxxxxxx` |
| FROM_EMAIL | string | �?| 发件人邮�?| `noreply@example.com` |
| DEPLOY_TIMESTAMP | string | �?| 部署时间�?| `2026-02-08-12-00` |

### Secret 配置

Secret 是敏感信息，不能明文存储�?wrangler.toml 中：

```bash
# 设置 Secret
npx wrangler secret put RESEND_API_KEY

# 输入 API 密钥（不会回显）
# Enter the secret value you would like assigned to the variable RESEND_API_KEY on the script named rualive-email-worker:
# ****************************

# 查看 Secret（只能查看是否存在，不能查看值）
npx wrangler secret list

# 删除 Secret
npx wrangler secret delete RESEND_API_KEY
```

---

## 数据库配�?
### D1 数据库创�?
```bash
# 创建数据�?npx wrangler d1 create <database_name>

# 输出示例
# �?Successfully created DB 'rualive'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "rualive"
# database_id = "59a95578-9781-4592-a711-d961765766c5"
```

### 数据库迁�?
```bash
# 执行单个迁移文件
npx wrangler d1 execute <database_name> --file=./migrations/migration_001_create_tables.sql

# 执行 SQL 查询
npx wrangler d1 execute <database_name> --command="SELECT * FROM users LIMIT 10"

# 备份数据�?npx wrangler d1 export <database_name> --output=backup.sql

# 导入数据�?npx wrangler d1 execute <database_name> --file=backup.sql
```

### 数据库连�?
�?Worker 中连接数据库�?
```javascript
export default {
  async fetch(request, env, ctx) {
    // env.DB �?D1 数据库绑�?    const result = await env.DB.prepare('SELECT * FROM users').all();
    return new Response(JSON.stringify(result));
  }
};
```

---

## KV 存储配置

### KV 命名空间创建

```bash
# 创建 KV 命名空间
npx wrangler kv create <namespace_name>

# 输出示例
# �?Successfully created KV namespace with id "2ab9c0f8a4be4e56a30097fcd349befb"
#
# [[kv_namespaces]]
# binding = "KV"
# id = "2ab9c0f8a4be4e56a30097fcd349befb"
```

### KV 操作

```bash
# 写入键�?npx wrangler kv:key put --binding=KV --namespace-id=<id> "my-key" "my-value"

# 读取键�?npx wrangler kv:key get --binding=KV --namespace-id=<id> "my-key"

# 删除键�?npx wrangler kv:key delete --binding=KV --namespace-id=<id> "my-key"

# 列出所有键
npx wrangler kv:key list --binding=KV --namespace-id=<id>

# 批量导入
npx wrangler kv:bulk put --binding=KV --namespace-id=<id> --path=data.json
```

### KV 使用示例

```javascript
export default {
  async fetch(request, env, ctx) {
    // 写入 KV
    await env.KV.put('user-config', JSON.stringify(config));

    // 读取 KV
    const value = await env.KV.get('user-config', 'json');

    // 删除 KV
    await env.KV.delete('user-config');

    // 检查键是否存在
    const exists = await env.KV.get('user-config');

    return new Response('OK');
  }
};
```

---

## 自定义域名配�?
### 配置自定义域�?
```bash
# 方法 1：通过 wrangler.toml
[routes]
pattern = "https://api.example.com/*"
zone_name = "example.com"

# 方法 2：通过 Cloudflare Dashboard
# 1. 登录 Cloudflare Dashboard
# 2. 选择 Workers & Pages
# 3. 选择 rualive-email-worker
# 4. 点击 Settings �?Triggers �?Custom Domains
# 5. 添加自定义域�?```

### 配置 HTTPS

Cloudflare Workers 自动提供 HTTPS 证书，无需额外配置�?
```bash
# HTTPS 证书自动配置
# https://api.example.com (自动 HTTPS)
```

---

## Cron 定时任务配置

### Cron 表达式语�?
```
* * * * *
�?�?�?�?�?�?�?�?�?└─ 星期�?(0-6, 0=周日)
�?�?�?└─── 月份 (1-12)
�?�?└───── 日期 (1-31)
�?└─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

### 常用 Cron 表达�?
```bash
# 每小时执�?"0 * * * *"

# 每天凌晨 2 点执�?"0 2 * * *"

# 每周一早上 9 点执�?"0 9 * * 1"

# 每月 1 号凌�?3 点执�?"0 3 1 * *"

# �?5 分钟执行一�?"*/5 * * * *"

# 工作日早�?9 点执�?"0 9 * * 1-5"
```

### 配置 Cron 任务

```bash
# wrangler.toml
[triggers]
crons = ["0 * * * *"]  # 每小时执行一�?```

---

## 监控和日�?
### 查看实时日志

```bash
# 查看实时日志
npx wrangler tail

# 查看特定环境的日�?npx wrangler tail --env preview

# 过滤日志
npx wrangler tail --format=pretty | grep "ERROR"
```

### 查看分析数据

```bash
# 通过 Cloudflare Dashboard
# 1. 登录 Cloudflare Dashboard
# 2. 选择 Workers & Pages
# 3. 选择 rualive-email-worker
# 4. 点击 Analytics
# 5. 查看请求数、错误率、延迟等
```

---

## 回滚策略

### 快速回�?
```bash
# 方法 1：重新部署旧版本
git checkout <commit-hash>
npm run deploy

# 方法 2：使�?Cloudflare Dashboard
# 1. 登录 Cloudflare Dashboard
# 2. 选择 Workers & Pages
# 3. 选择 rualive-email-worker
# 4. 点击 Deployments
# 5. 选择旧版本并重新部署
```

### 数据库回�?
```bash
# 导出当前数据�?npx wrangler d1 export rualive --output=current.sql

# 恢复到之前的备份
npx wrangler d1 execute rualive --file=backup.sql
```

---

## 部署检查清�?
### 部署前检�?
- [ ] 代码已通过本地测试
- [ ] 数据库迁移已准备
- [ ] 环境变量已配�?- [ ] Secret 已设�?- [ ] 域名已配置（如果需要）
- [ ] Cron 任务已配置（如果需要）

### 部署后验�?
- [ ] 访问主页，确认页面加载正�?- [ ] 测试登录功能
- [ ] 测试 API 端点
- [ ] 检查控制台日志
- [ ] 验证数据库连�?- [ ] 验证邮件发送功�?
---

**文档版本**: 1.0
**最后更�?*: 2026-02-08
**作�?*: iFlow CLI
