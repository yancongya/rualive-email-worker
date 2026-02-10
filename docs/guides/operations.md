# 运维指南

## 概述

本文档详细说明了 RuAlive Email Worker 的运维工作，包括监控、日志管理、数据备份、故障排查、性能优化等�?
---

## 监控

### 1. Cloudflare Workers Analytics

#### 访问 Analytics

```bash
# 方法 1：通过 Cloudflare Dashboard
# 1. 登录 Cloudflare Dashboard
# 2. 选择 Workers & Pages
# 3. 选择 rualive-email-worker
# 4. 点击 Analytics

# 方法 2：通过 wrangler CLI
npx wrangler analytics --format=json
```

#### 监控指标

| 指标 | 说明 | 告警阈�?|
|------|------|---------|
| 请求�?| 每日请求数量 | > 100,000/�?|
| 错误�?| 错误请求占比 | > 5% |
| 平均响应时间 | 平均响应延迟 | > 500ms |
| 99th 响应时间 | 99% 请求响应时间 | > 2000ms |
| CPU 使用�?| CPU 使用时间 | > 50ms/请求 |
| 内存使用�?| 内存使用�?| > 128MB |

#### 设置告警

```bash
# 通过 Cloudflare Dashboard 设置告警
# 1. 登录 Cloudflare Dashboard
# 2. 选择 Workers & Pages
# 3. 选择 rualive-email-worker
# 4. 点击 Analytics �?Set up alert
# 5. 配置告警规则
```

### 2. 自定义监控端�?
#### 健康检查端�?
```javascript
// src/index.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      // 健康检�?      try {
        // 检查数据库连接
        await env.DB.prepare('SELECT 1').first();

        // 检�?KV 连接
        await env.KV.put('health-check', 'ok', { expirationTtl: 60 });

        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'ok',
          kv: 'ok'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 其他路由...
  }
};
```

#### 使用健康检�?
```bash
# 检查健康状�?curl https://rualive.itycon.cn/health

# 输出示例
{
  "status": "healthy",
  "timestamp": "2026-02-08T12:00:00.000Z",
  "database": "ok",
  "kv": "ok"
}
```

### 3. 日志监控

#### 实时日志查看

```bash
# 查看实时日志
npx wrangler tail

# 过滤特定日志
npx wrangler tail | grep "ERROR"
npx wrangler tail | grep "WARNING"

# 保存日志到文�?npx wrangler tail > worker-logs.txt
```

#### 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| ERROR | 错误信息 | 系统错误、异�?|
| WARNING | 警告信息 | 潜在问题 |
| INFO | 一般信�?| 正常操作 |
| DEBUG | 调试信息 | 开发调�?|

---

## 日志管理

### 1. 应用日志

#### 日志格式

```javascript
// 标准日志格式
console.log('[INFO]', timestamp, 'message', data);
console.error('[ERROR]', timestamp, 'message', error);
console.warn('[WARNING]', timestamp, 'message', warning);
```

#### 日志示例

```javascript
export default {
  async fetch(request, env, ctx) {
    const timestamp = new Date().toISOString();

    try {
      // 记录请求信息
      console.log('[INFO]', timestamp, 'Request received', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers)
      });

      // 处理请求
      const result = await processRequest(request, env);

      // 记录响应信息
      console.log('[INFO]', timestamp, 'Request completed', {
        status: result.status,
        processingTime: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // 记录错误信息
      console.error('[ERROR]', timestamp, 'Request failed', {
        error: error.message,
        stack: error.stack
      });

      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
```

### 2. 数据库日�?
#### 查询日志

```javascript
export default {
  async fetch(request, env, ctx) {
    const timestamp = new Date().toISOString();

    try {
      const startTime = Date.now();

      // 执行查询
      const result = await env.DB.prepare('SELECT * FROM users').all();

      // 记录查询日志
      console.log('[DB]', timestamp, 'Query executed', {
        query: 'SELECT * FROM users',
        rows: result.results.length,
        executionTime: Date.now() - startTime
      });

      return new Response(JSON.stringify(result));
    } catch (error) {
      console.error('[DB]', timestamp, 'Query failed', {
        error: error.message
      });

      return new Response('Database Error', { status: 500 });
    }
  }
};
```

### 3. 邮件发送日�?
#### 发送日志记�?
```javascript
export default {
  async fetch(request, env, ctx) {
    const timestamp = new Date().toISOString();

    try {
      // 发送邮�?      const emailResult = await sendEmail(env, toEmail, subject, html);

      // 记录发送日�?      if (emailResult.success) {
        console.log('[EMAIL]', timestamp, 'Email sent', {
          to: toEmail,
          subject: subject,
          messageId: emailResult.id
        });
      } else {
        console.error('[EMAIL]', timestamp, 'Email failed', {
          to: toEmail,
          error: emailResult.error
        });
      }

      return new Response(JSON.stringify(emailResult));
    } catch (error) {
      console.error('[EMAIL]', timestamp, 'Email error', {
        error: error.message
      });

      return new Response('Email Error', { status: 500 });
    }
  }
};
```

### 4. 日志轮转

#### 自动清理旧日�?
```javascript
export default {
  async fetch(request, env, ctx) {
    const timestamp = new Date().toISOString();

    // 检查是否需要清理日�?    if (request.url.includes('/cleanup-logs')) {
      try {
        // 删除 30 天前的日�?        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        const result = await env.DB.prepare(`
          DELETE FROM send_logs
          WHERE sent_at < ?
        `).bind(cutoffDate.toISOString()).run();

        console.log('[CLEANUP]', timestamp, 'Logs cleaned', {
          deletedRows: result.meta.changes
        });

        return new Response(JSON.stringify({
          success: true,
          deletedRows: result.meta.changes
        }));
      } catch (error) {
        console.error('[CLEANUP]', timestamp, 'Cleanup failed', {
          error: error.message
        });

        return new Response('Cleanup Error', { status: 500 });
      }
    }
  }
};
```

---

## 数据备份

### 1. 数据库备�?
#### 手动备份

```bash
# 导出整个数据�?npx wrangler d1 export rualive --output=backup-$(date +%Y%m%d).sql

# 导出特定�?npx wrangler d1 execute rualive --command="SELECT * FROM users" > users-backup.sql
npx wrangler d1 execute rualive --command="SELECT * FROM work_logs" > work-logs-backup.sql
```

#### 自动备份

```javascript
// 创建备份端点
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/backup') {
      try {
        // 导出用户�?        const users = await env.DB.prepare('SELECT * FROM users').all();

        // 导出工作日志�?        const workLogs = await env.DB.prepare('SELECT * FROM work_logs').all();

        // 导出发送日志表
        const sendLogs = await env.DB.prepare('SELECT * FROM send_logs').all();

        // 生成备份文件
        const backup = {
          timestamp: new Date().toISOString(),
          users: users.results,
          workLogs: workLogs.results,
          sendLogs: sendLogs.results
        };

        // 保存�?KV�?4小时过期�?        await env.KV.put(
          `backup-${Date.now()}`,
          JSON.stringify(backup),
          { expirationTtl: 86400 }
        );

        return new Response(JSON.stringify({
          success: true,
          message: 'Backup created successfully',
          size: JSON.stringify(backup).length
        }));
      } catch (error) {
        console.error('[BACKUP]', 'Backup failed', {
          error: error.message
        });

        return new Response('Backup Error', { status: 500 });
      }
    }
  }
};
```

#### 定时备份

```bash
# 设置 Cron 任务
# wrangler.toml
[triggers]
crons = ["0 2 * * *"]  # 每天凌晨 2 点执行备�?
# 调用备份端点
# https://rualive.itycon.cn/backup
```

### 2. KV 数据备份

#### 导出 KV 数据

```bash
# 列出所有键
npx wrangler kv:key list --binding=KV

# 导出特定�?npx wrangler kv:key get --binding=KV "user-config" > user-config.json

# 批量导出
npx wrangler kv:key list --binding=KV --prefix="user-" | \
  jq -r '.[].name' | \
  xargs -I {} sh -c 'npx wrangler kv:key get --binding=KV "{}" > {}.json'
```

### 3. 配置备份

#### 备份 wrangler.toml

```bash
# 备份配置文件
cp wrangler.toml wrangler.toml.backup-$(date +%Y%m%d)

# 备份 package.json
cp package.json package.json.backup-$(date +%Y%m%d)
```

---

## 数据恢复

### 1. 数据库恢�?
#### �?SQL 文件恢复

```bash
# 恢复整个数据�?npx wrangler d1 execute rualive --file=backup-20260208.sql

# 恢复特定�?npx wrangler d1 execute rualive --file=users-backup.sql
```

#### �?KV 恢复

```javascript
// 创建恢复端点
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/restore') {
      const backupId = url.searchParams.get('backupId');

      if (!backupId) {
        return new Response('Missing backupId parameter', { status: 400 });
      }

      try {
        // �?KV 读取备份
        const backupData = await env.KV.get(`backup-${backupId}`);

        if (!backupData) {
          return new Response('Backup not found', { status: 404 });
        }

        const backup = JSON.parse(backupData);

        // 恢复用户�?        for (const user of backup.users) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO users (id, email, username, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            user.id,
            user.email,
            user.username,
            user.password_hash,
            user.role,
            user.created_at,
            user.updated_at
          ).run();
        }

        // 恢复其他�?..
        // 恢复工作日志�?        // 恢复发送日志表

        return new Response(JSON.stringify({
          success: true,
          message: 'Backup restored successfully',
          restoredRecords: {
            users: backup.users.length,
            workLogs: backup.workLogs.length,
            sendLogs: backup.sendLogs.length
          }
        }));
      } catch (error) {
        console.error('[RESTORE]', 'Restore failed', {
          error: error.message
        });

        return new Response('Restore Error', { status: 500 });
      }
    }
  }
};
```

---

## 故障排查

### 1. 常见问题

#### 问题 1：Worker 返回 502 错误

**症状**�?```
502 Bad Gateway
```

**可能原因**�?- Worker 超时
- Worker 崩溃
- 数据库连接失�?
**排查步骤**�?
```bash
# 1. 查看实时日志
npx wrangler tail

# 2. 检�?Worker 超时
# wrangler.toml
# 添加超时配置
[limits]
cpu_ms = 50

# 3. 测试数据库连�?npx wrangler d1 execute rualive --command="SELECT 1"

# 4. 检�?Worker 健康状�?curl https://rualive.itycon.cn/health
```

**解决方案**�?- 优化 Worker 代码，减�?CPU 使用
- 增加 CPU 限制
- 检查数据库连接

---

#### 问题 2：邮件发送失�?
**症状**�?```
Email send failed: Invalid API key
```

**可能原因**�?- Resend API Key 无效
- Resend API Key 过期
- Resend 服务不可�?
**排查步骤**�?
```bash
# 1. 检�?Secret 配置
npx wrangler secret list

# 2. 测试 API Key
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "delivered@resend.dev",
    "subject": "hello world",
    "html": "<strong>hello world</strong>"
  }'

# 3. 检查日�?npx wrangler tail | grep "EMAIL"
```

**解决方案**�?- 更新 Resend API Key
- 检�?Resend 服务状�?- 添加重试机制

---

#### 问题 3：数据库查询超时

**症状**�?```
Database query timeout
```

**可能原因**�?- 查询语句复杂
- 数据量过�?- 索引缺失

**排查步骤**�?
```bash
# 1. 检查查询语�?npx wrangler d1 execute rualive --command="EXPLAIN SELECT * FROM work_logs"

# 2. 检查索�?npx wrangler d1 execute rualive --command="SELECT sql FROM sqlite_master WHERE type='index'"

# 3. 分析慢查�?npx wrangler tail | grep "DB.*executionTime"
```

**解决方案**�?- 优化查询语句
- 添加索引
- 分页查询

---

#### 问题 5：项目历�?API 返回 404 错误

**症状**�?```
404 Not Found
[Dashboard] API request failed for gantt: 404
```

**可能原因**�?- 项目不在 `projects` 表中
- 项目不在 `work_logs` 表中
- 项目 ID 不匹�?
**排查步骤**�?
```bash
# 1. 检查项目是否在 projects 表中
npx wrangler d1 execute rualive --command="SELECT * FROM projects WHERE project_id = '617bc8f'"

# 2. 检查项目是否在 work_logs 表中
npx wrangler d1 execute rualive --command="SELECT work_date, projects_json FROM work_logs WHERE projects_json LIKE '%617bc8f%' LIMIT 5"

# 3. 检查日�?npx wrangler tail | grep "handleGetProjectHistory"
```

**解决方案**�?
系统已内置自动修复机制：
- 如果项目不在 `projects` 表中，会自动�?`work_logs` 表中提取项目信息并创建记�?- 如果 `project_daily_stats` 表中没有数据，会自动�?`work_logs` 表中聚合历史数据

**手动修复**（如果自动修复失败）�?
```javascript
// 创建修复脚本
async function fixProjectHistory(projectId, env) {
  const DB = env.DB || env.rualive;

  // �?work_logs 表中查询项目
  const workLogs = await DB.prepare(
    'SELECT work_date, projects_json FROM work_logs WHERE projects_json LIKE ?'
  ).bind(`%${projectId}%`).all();

  if (workLogs.results && workLogs.results.length > 0) {
    // 解析项目信息并创建记�?    const firstLog = workLogs.results[0];
    const projects = JSON.parse(firstLog.projects_json);
    const project = projects.find(p => p.projectId === projectId);

    if (project) {
      // �?projects 表中创建记录
      await DB.prepare(`
        INSERT INTO projects (
          user_id, project_id, project_name, project_path,
          first_work_date, last_work_date, total_work_hours, total_work_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'user_id',  // 需要替换为实际用户 ID
        projectId,
        project.name,
        project.path,
        firstLog.work_date,
        firstLog.work_date,
        0,
        1
      ).run();

      console.log('项目记录已创�?', projectId);
    }
  }
}
```

---

#### 问题 6：静态文�?404 错误

**症状**�?```
404 Not Found
Failed to load resource: user-v6.js
```

**可能原因**�?- 文件未正确部�?- Assets 绑定配置错误
- 文件路径错误

**排查步骤**�?
```bash
# 1. 检�?Assets 绑定
# wrangler.toml
[assets]
directory = "./public"
binding = "ASSETS"

# 2. 检查文件是否存�?ls -la dist/public/

# 3. 重新部署
npm run deploy

# 4. 检查部署日�?npx wrangler tail
```

**解决方案**�?- 确保 Assets 绑定正确
- 重新构建前端
- 重新部署

---

### 2. 故障排查工具

#### wrangler tail

```bash
# 查看实时日志
npx wrangler tail

# 查看特定环境的日�?npx wrangler tail --env preview

# 过滤日志
npx wrangler tail | grep "ERROR"

# 保存日志
npx wrangler tail > logs.txt
```

#### wrangler analytics

```bash
# 查看分析数据
npx wrangler analytics

# 导出分析数据
npx wrangler analytics --format=json > analytics.json
```

#### curl 测试

```bash
# 测试健康检�?curl https://rualive.itycon.cn/health

# 测试项目历史 API
curl "https://rualive.itycon.cn/api/projects/history?projectId=617bc8f" \
  -H "Authorization: Bearer token"

# 测试静态文�?curl -I https://rualive.itycon.cn/user-v6.html
```

#### 数据库查询测�?
```bash
# 查询项目记录
npx wrangler d1 execute rualive --command="SELECT * FROM projects WHERE project_id = '617bc8f'"

# 查询工作日志中的项目数据
npx wrangler d1 execute rualive --command="SELECT work_date, projects_json FROM work_logs WHERE projects_json LIKE '%617bc8f%' LIMIT 5"

# 查询项目每日统计
npx wrangler d1 execute rualive --command="SELECT * FROM project_daily_stats WHERE project_id = 1"
```

---

## 性能优化

### 1. Worker 性能优化

#### 减少 CPU 使用

```javascript
// �?不好的做法：同步处理大量数据
export default {
  async fetch(request, env, ctx) {
    const users = await env.DB.prepare('SELECT * FROM users').all();
    const processed = users.results.map(user => {
      // 复杂的同步处�?      return processUser(user);
    });
    return new Response(JSON.stringify(processed));
  }
};

// �?好的做法：使用异步处�?export default {
  async fetch(request, env, ctx) {
    const users = await env.DB.prepare('SELECT * FROM users').all();
    const processed = await Promise.all(
      users.results.map(user => processUserAsync(user))
    );
    return new Response(JSON.stringify(processed));
  }
};
```

#### 使用缓存

```javascript
export default {
  async fetch(request, env, ctx) {
    const cacheKey = 'work-logs-latest';

    // 尝试从缓存读�?    const cached = await env.KV.get(cacheKey, 'json');
    if (cached) {
      console.log('[CACHE]', 'Cache hit', { key: cacheKey });
      return new Response(JSON.stringify(cached));
    }

    // 从数据库读取
    const workLogs = await env.DB.prepare('SELECT * FROM work_logs LIMIT 100').all();

    // 保存到缓存（5分钟过期�?    await env.KV.put(cacheKey, JSON.stringify(workLogs.results), {
      expirationTtl: 300
    });

    console.log('[CACHE]', 'Cache miss', { key: cacheKey });
    return new Response(JSON.stringify(workLogs.results));
  }
};
```

### 2. 数据库性能优化

#### 添加索引

```sql
-- 为常用查询字段添加索�?CREATE INDEX idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX idx_work_logs_work_date ON work_logs(work_date);
CREATE INDEX idx_work_logs_user_date ON work_logs(user_id, work_date);
```

#### 优化查询

```javascript
// �?不好的做法：查询所有数�?const result = await env.DB.prepare('SELECT * FROM work_logs').all();

// �?好的做法：只查询需要的字段
const result = await env.DB.prepare(
  'SELECT work_date, work_hours, keyframe_count FROM work_logs'
).all();

// �?好的做法：使�?LIMIT
const result = await env.DB.prepare(
  'SELECT * FROM work_logs LIMIT 100'
).all();

// �?好的做法：使�?WHERE 条件
const result = await env.DB.prepare(
  'SELECT * FROM work_logs WHERE work_date >= ?'
).bind(startDate).all();
```

### 3. 前端性能优化

#### 代码分割

```javascript
// 使用动态导�?const Analytics = lazy(() => import('./Analytics'));
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Analytics />
    </Suspense>
  );
}
```

#### 图片优化

```javascript
// 使用懒加�?<img
  src="image.jpg"
  loading="lazy"
  alt="Description"
/>

// 使用 WebP 格式
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

---

## 安全加固

### 1. 认证安全

#### 使用强密�?
```javascript
// 密码强度验证
function validatePassword(password: string): boolean {
  // 至少 8 个字�?  if (password.length < 8) return false;

  // 包含大小写字�?  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;

  // 包含数字
  if (!/[0-9]/.test(password)) return false;

  // 包含特殊字符
  if (!/[^a-zA-Z0-9]/.test(password)) return false;

  return true;
}
```

#### Token 过期

```javascript
// 设置 Token 过期时间
const TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 �?
function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_EXPIRY
  };

  return jwt.sign(payload, SECRET_KEY);
}

function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 检查是否过�?    if (decoded.exp < Date.now()) {
      throw new Error('Token expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2. 数据安全

#### SQL 注入防护

```javascript
// �?不好的做法：字符串拼�?const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await env.DB.prepare(query).all();

// �?好的做法：使用参数化查询
const result = await env.DB.prepare(
  'SELECT * FROM users WHERE email = ?'
).bind(email).all();
```

#### XSS 防护

```javascript
// 对用户输入进行转�?function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 使用 React 自动转义
function UserComponent({ username }: { username: string }) {
  return <div>{username}</div>; // React 自动转义
}
```

### 3. 网络安全

#### HTTPS 强制

```javascript
export default {
  async fetch(request, env, ctx) {
    // 强制使用 HTTPS
    const url = new URL(request.url);
    if (url.protocol !== 'https:') {
      const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;
      return Response.redirect(httpsUrl, 301);
    }

    // 处理请求
    return new Response('OK');
  }
};
```

#### CORS 配置

```javascript
export default {
  async fetch(request, env, ctx) {
    // 配置 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 处理其他请求
    const response = await handleRequest(request, env);
    return new Response(response.body, {
      ...response,
      headers: { ...response.headers, ...corsHeaders }
    });
  }
};
```

---

## 运维检查清�?
### 日常检�?
- [ ] 检�?Worker 健康状�?- [ ] 查看错误日志
- [ ] 检查数据库连接
- [ ] 检查邮件发送状�?- [ ] 检查磁盘空间（如果有）

### 每周检�?
- [ ] 检查性能指标
- [ ] 分析慢查�?- [ ] 检查备份状�?- [ ] 检查安全更�?- [ ] 审查访问日志
- [ ] 检查项目历史数据完整�?
### 每月检�?
- [ ] 执行完整备份
- [ ] 测试恢复流程
- [ ] 审查用户账户
- [ ] 更新依赖�?- [ ] 优化数据�?- [ ] 清理旧数据（30天前的日志）

---

**文档版本**: 1.1
**最后更�?*: 2026-02-09
**作�?*: iFlow CLI
