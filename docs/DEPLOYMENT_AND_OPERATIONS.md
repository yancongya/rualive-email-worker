# 部署和运维指南

## 文档信息
- **最后更新**: 2026-02-07

---

## 1. 部署概述

### 1.1 部署架构
```
本地开发环境
  ↓
Git 仓库
  ↓
CI/CD Pipeline (可选)
  ↓
Cloudflare Workers
  ↓
全球边缘网络
```

### 1.2 部署环境
| 环境 | URL | 用途 |
|------|-----|------|
| 开发环境 | http://localhost:5173 | 本地开发 |
| 预览环境 | https://rualive-email-worker.preview.workers.dev | 测试验证 |
| 生产环境 | https://rualive-email-worker.cubetan57.workers.dev | 正式运行 |

---

## 2. 快速部署

### 2.1 前置要求
- Node.js 18+
- Wrangler CLI
- Cloudflare 账户
- Resend API 密钥

### 2.2 安装依赖
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 进入项目目录
cd rualive-email-worker

# 安装项目依赖
npm install
```

### 2.3 配置环境
```bash
# 创建 D1 数据库
npm run db:create

# 执行数据库迁移
npm run db:migrate

# 创建 KV 命名空间
npm run kv:create
npm run kv:create-preview

# 设置环境变量
wrangler secret put RESEND_API_KEY
# 输入: re_xxxxxxxxxxxxxx

wrangler secret put JWT_SECRET
# 输入: your-secret-key-here
```

### 2.4 部署 Worker
```bash
# 使用自动化部署脚本
.\deploy.ps1

# 或手动部署（完整流程）
# 步骤1：构建前端
cd public
npm run build

# 步骤2：复制构建产物到根目录 dist
# 重要：wrangler.toml 配置的 assets.directory 是根目录的 dist
# Vite 构建输出到 public/dist，需要复制到根目录 dist
cd ..
Remove-Item -Recurse -Force dist
Copy-Item -Recurse -Force public\dist dist

# 步骤3：部署到 Cloudflare
npm run deploy
```

#### 📌 重要注意事项

**构建目录结构说明**：
- `public/vite.config.ts` 配置输出目录为 `dist`
- Vite 构建输出到 `public/dist/` 目录
- `wrangler.toml` 配置 `assets.directory = "dist"`（根目录）
- **必须将 `public/dist` 复制到根目录 `dist` 才能正确部署**

**为什么需要复制 dist 目录**：
1. Vite 构建工具默认输出到 `public/dist` 目录
2. Cloudflare Wrangler 的 Assets 绑定配置指向根目录的 `dist`
3. 如果不复制，部署的将是旧版本的静态文件
4. 复制确保最新的前端代码被部署到 Cloudflare Workers

**常见问题**：
- **问题**：部署后前端代码没有更新
- **原因**：只构建了 `public/dist`，没有复制到根目录 `dist`
- **解决**：执行 `Remove-Item -Recurse -Force dist; Copy-Item -Recurse -Force public\dist dist`
- **验证**：检查 `dist/user-v6.html` 中的 JS 文件引用是否是最新的哈希值

**文件哈希验证**：
```bash
# 检查构建输出
cd public/dist
cat user-v6.html | grep userV6
# 输出示例：src="/assets/userV6-KJ6OtQ4y.js"

# 检查部署输出
cd ../dist
cat user-v6.html | grep userV6
# 应该与构建输出一致
```

### 2.5 验证部署
```bash
# 健康检查
curl https://rualive-email-worker.cubetan57.workers.dev/health

# 测试登录
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 3. 监控和日志

### 3.1 实时日志
```bash
# 查看实时日志
npm run tail

# 或使用 wrangler
wrangler tail
```

### 3.2 日志级别
```javascript
console.log('[INFO] 信息日志');
console.warn('[WARN] 警告日志');
console.error('[ERROR] 错误日志');
console.debug('[DEBUG] 调试日志');
```

### 3.3 日志分析
```bash
# 过滤错误日志
wrangler tail | grep ERROR

# 过滤特定用户日志
wrangler tail | grep "user_123"

# 导出日志到文件
wrangler tail > logs.txt
```

### 3.4 监控指标
- **请求量**: 每小时请求数
- **响应时间**: 平均响应时间
- **错误率**: 错误请求占比
- **CPU 使用率**: Worker CPU 使用情况

---

## 4. 数据库管理

### 4.1 数据库备份
```bash
# 导出数据库
wrangler d1 export rualive --remote --output=backup_$(date +%Y%m%d).sql

# 查看备份文件
cat backup_20260207.sql
```

### 4.2 数据库恢复
```bash
# 导入数据库
wrangler d1 execute rualive --remote --file=backup_20260207.sql

# 验证恢复
wrangler d1 execute rualive --remote --command="SELECT COUNT(*) FROM users"
```

### 4.3 数据库查询
```bash
# 查询用户统计
wrangler d1 execute rualive --remote --command="SELECT COUNT(*) as total_users FROM users"

# 查询今日工作数据
wrangler d1 execute rualive --remote --command="SELECT * FROM work_data WHERE date = '2026-02-07'"

# 查询邮件发送状态
wrangler d1 execute rualive --remote --command="SELECT status, COUNT(*) as count FROM email_logs GROUP BY status"
```

### 4.4 数据库优化
```sql
-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_data_user_date ON work_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created ON email_logs(user_id, created_at);

-- 分析查询性能
EXPLAIN QUERY PLAN SELECT * FROM work_data WHERE user_id = ? AND date >= ?;
```

---

## 5. 性能优化

### 5.1 缓存策略
```javascript
// KV 缓存
const cachedData = await KV.get(`user_config:${userId}`);
if (cachedData) {
  return JSON.parse(cachedData);
}

// 设置缓存
await KV.put(`user_config:${userId}`, JSON.stringify(config), {
  expirationTtl: 3600 // 1小时
});
```

### 5.2 代码优化
```javascript
// 并行请求
const [users, logs, stats] = await Promise.all([
  getUsers(),
  getLogs(),
  getStats()
]);

// 批量操作
const insert = DB.prepare('INSERT INTO work_data (...) VALUES (...)');
for (const data of dataArray) {
  await insert.bind(...params).run();
}
```

### 5.3 资源优化
```javascript
// 压缩响应
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip'
  }
});

// CDN 缓存
return new Response(html, {
  headers: {
    'Cache-Control': 'public, max-age=3600'
  }
});
```

---

## 6. 安全管理

### 6.1 API 密钥管理
```bash
# 查看密钥列表
wrangler secret list

# 更新密钥
wrangler secret put RESEND_API_KEY

# 删除密钥
wrangler secret delete RESEND_API_KEY
```

### 6.2 访问控制
```javascript
// IP 白名单
const allowedIPs = ['192.168.1.1', '10.0.0.1'];
const clientIP = request.headers.get('CF-Connecting-IP');

if (!allowedIPs.includes(clientIP)) {
  return new Response('Forbidden', { status: 403 });
}

// 速率限制
const rateLimitKey = `rate_limit:${clientIP}`;
const requests = await KV.get(rateLimitKey);

if (requests && parseInt(requests) > 100) {
  return new Response('Too Many Requests', { status: 429 });
}

await KV.put(rateLimitKey, (parseInt(requests || '0') + 1).toString(), {
  expirationTtl: 60
});
```

### 6.3 数据加密
```javascript
// 加密敏感数据
const encoder = new TextEncoder();
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(data)
);
```

---

## 7. 故障排查

### 7.1 常见问题

#### 问题1: Worker 部署失败
**症状**: `npm run deploy` 失败

**解决方案**:
```bash
# 检查登录状态
wrangler whoami

# 重新登录
wrangler login

# 检查配置
wrangler deploy --dry-run

# 查看详细日志
wrangler deploy --verbose
```

#### 问题2: 数据库连接失败
**症状**: 数据库查询失败

**解决方案**:
```bash
# 检查数据库 ID
wrangler d1 list

# 更新 wrangler.toml
# 确保数据库 ID 正确

# 测试数据库连接
wrangler d1 execute rualive --remote --command="SELECT 1"
```

#### 问题3: 邮件发送失败
**症状**: 邮件无法发送

**解决方案**:
```bash
# 检查 API 密钥
wrangler secret list

# 测试邮件 API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"from":"from@example.com","to":["to@example.com"],"subject":"Test","html":"<p>Test</p>"}'

# 查看邮件日志
wrangler d1 execute rualive --remote --command="SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10"
```

#### 问题4: 性能问题
**症状**: 响应时间过长

**解决方案**:
```bash
# 分析慢查询
wrangler tail | grep "DB query"

# 添加索引
CREATE INDEX idx_work_data_user_date ON work_data(user_id, date);

# 优化代码
// 使用缓存
// 减少数据库查询
// 批量操作
```

### 7.2 日志分析
```bash
# 查看错误日志
wrangler tail | grep ERROR

# 统计错误类型
wrangler tail | grep ERROR | awk '{print $NF}' | sort | uniq -c

# 查看特定时间段日志
wrangler tail --format pretty | grep "2026-02-07 14:00"
```

---

## 8. 维护任务

### 8.1 定期维护

#### 每日任务
- 检查错误日志
- 监控系统性能
- 验证邮件发送

#### 每周任务
- 清理过期会话
- 备份数据库
- 分析用户数据

#### 每月任务
- 清理旧日志
- 更新依赖
- 审查安全日志

### 8.2 清理脚本
```javascript
// 清理过期会话
async function cleanupSessions(env) {
  const DB = env.DB || env.rualive;
  const now = new Date().toISOString();
  
  const result = await DB.prepare(
    'DELETE FROM sessions WHERE expires_at < ?'
  ).bind(now).run();
  
  console.log(`[Cleanup] Removed ${result.meta.changes} expired sessions`);
}

// 清理旧日志
async function cleanupLogs(env, daysToKeep = 90) {
  const DB = env.DB || env.rualive;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoff = cutoffDate.toISOString();
  
  const result = await DB.prepare(
    'DELETE FROM email_logs WHERE created_at < ?'
  ).bind(cutoff).run();
  
  console.log(`[Cleanup] Removed ${result.meta.changes} old email logs`);
}
```

---

## 9. 升级和迁移

### 9.1 代码升级
```bash
# 更新依赖
npm update

# 检查过时依赖
npm outdated

# 安装特定版本
npm install react@19.2.4
```

### 9.2 数据库迁移
```bash
# 创建迁移文件
cat > migrations/migration_add_new_column.sql << EOF
ALTER TABLE work_data ADD COLUMN new_field TEXT;
EOF

# 执行迁移
wrangler d1 execute rualive --remote --file=migrations/migration_add_new_column.sql

# 验证迁移
wrangler d1 execute rualive --remote --command="PRAGMA table_info(work_data)"
```

### 9.3 版本回滚
```bash
# 查看部署历史
wrangler deployments list

# 回滚到特定版本
wrangler rollback --version <version-id>

# 或使用 Git
git checkout <commit-hash>
npm run deploy
```

---

## 10. 备份和恢复

### 10.1 自动备份
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/rualive"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
wrangler d1 export rualive --remote --output=$BACKUP_DIR/db_$DATE.sql

# 备份配置
cp wrangler.toml $BACKUP_DIR/wrangler_$DATE.toml

# 清理旧备份（保留30天）
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: db_$DATE.sql"
EOF

chmod +x backup.sh

# 添加到 cron
# 0 2 * * * /path/to/backup.sh
```

### 10.2 恢复流程
```bash
# 停止服务（可选）
# wrangler delete

# 恢复数据库
wrangler d1 execute rualive --remote --file=/backup/rualive/db_20260207.sql

# 恢复配置
cp /backup/rualive/wrangler_20260207.toml wrangler.toml

# 重新部署
npm run deploy
```

---

## 11. 监控和告警

### 11.1 监控指标
- **可用性**: Worker 在线时间
- **响应时间**: 平均响应时间
- **错误率**: 错误请求占比
- **吞吐量**: 每秒请求数

### 11.2 告警配置
```javascript
// 检查错误率
async function checkErrorRate(env) {
  const DB = env.DB || env.rualive;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const total = await DB.prepare(
    'SELECT COUNT(*) as count FROM email_logs WHERE created_at > ?'
  ).bind(oneHourAgo).first();
  
  const errors = await DB.prepare(
    'SELECT COUNT(*) as count FROM email_logs WHERE created_at > ? AND status = "failed"'
  ).bind(oneHourAgo).first();
  
  const errorRate = (errors.count / total.count) * 100;
  
  if (errorRate > 10) {
    // 发送告警
    await sendAlert(env, `错误率过高: ${errorRate}%`);
  }
}
```

---

## 12. 最佳实践

### 12.1 部署前检查
- [ ] 代码已提交到 Git
- [ ] 本地测试通过
- [ ] 数据库迁移已准备
- [ ] 环境变量已配置
- [ ] Secrets 已设置
- [ ] 备份已完成

### 12.2 部署后验证
- [ ] Worker URL 可访问
- [ ] 健康检查通过
- [ ] 前端页面正常加载
- [ ] API 端点正常工作
- [ ] 数据库连接正常
- [ ] 日志输出正常

### 12.3 安全建议
- [ ] 定期更新依赖
- [ ] 使用强密码
- [ ] 定期审查 Secrets
- [ ] 启用 HTTPS
- [ ] 实施 CORS 策略
- [ ] 定期备份数据
- [ ] 监控异常访问

### 12.4 性能建议
- [ ] 使用缓存
- [ ] 优化数据库查询
- [ ] 压缩响应
- [ ] 使用 CDN
- [ ] 批量操作
- [ ] 异步处理

---

## 13. 故障恢复

### 13.1 故障检测
```bash
# 健康检查脚本
#!/bin/bash
HEALTH_URL="https://rualive-email-worker.cubetan57.workers.dev/health"
ALERT_EMAIL="admin@example.com"

HEALTH_CHECK=$(curl -s $HEALTH_URL)

if [ "$HEALTH_CHECK" != '{"status":"healthy"}' ]; then
  echo "Health check failed" | mail -s "RuAlive Alert" $ALERT_EMAIL
fi
```

### 13.2 故障恢复流程
1. **检测故障**: 健康检查失败
2. **分析日志**: 查看错误日志
3. **诊断问题**: 确定故障原因
4. **修复问题**: 应用修复方案
5. **验证修复**: 确认问题解决
6. **恢复服务**: 重新部署
7. **总结经验**: 更新文档

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成