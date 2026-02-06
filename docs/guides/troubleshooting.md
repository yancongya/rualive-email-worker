# 故障排查指南 (Troubleshooting Guide)

> 常见问题和解决方案

---

## 🔍 诊断工具

### 查看实时日志
```bash
npm run tail
```

### 检查 Worker 状态
```bash
curl https://your-worker-url/health
```

### 查看数据库状态
```bash
wrangler d1 execute rualive --remote --command "SELECT COUNT(*) as count FROM users"
```

---

## ❓ 常见问题

### 1. 部署失败

#### 问题：部署时出现 "Error: No such file or directory"
**解决方案：**
```bash
# 确保在正确的目录
cd rualive-email-worker

# 重新构建
npm run build:frontend

# 再次部署
npm run deploy
```

#### 问题：部署时出现 "Error: Account not found"
**解决方案：**
```bash
# 重新登录 Cloudflare
wrangler logout
wrangler login
```

---

### 2. 数据库连接失败

#### 问题：出现 "Error: D1 database not found"
**解决方案：**
```bash
# 检查 wrangler.toml 中的 database_id
cat wrangler.toml | grep database_id

# 如果为空，重新创建数据库
npm run db:create

# 更新 wrangler.toml 后运行迁移
npm run db:migrate
```

#### 问题：出现 "Error: Table does not exist"
**解决方案：**
```bash
# 重新运行数据库迁移
npm run db:migrate

# 验证表是否创建成功
wrangler d1 execute rualive --remote --command ".tables"
```

---

### 3. 邮件发送失败

#### 问题：邮件发送时出现 "Error: Invalid API key"
**解决方案：**
```bash
# 验证 API 密钥是否设置
wrangler secret list

# 重新设置 API 密钥
wrangler secret put RESEND_API_KEY

# 测试 API 密钥
curl -X POST https://your-worker-url/api/admin/api-key/test \
  -H "Authorization: Bearer <admin-token>"
```

#### 问题：邮件发送时出现 "Error: Rate limit exceeded"
**解决方案：**
```bash
# 检查用户的邮件限制
curl "https://your-worker-url/api/admin/users/:userId/email-limit-status" \
  -H "Authorization: Bearer <admin-token>"

# 调整用户的邮件限制
curl -X POST "https://your-worker-url/api/admin/users/:userId/email-limit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "dailyLimit": 20,
    "enabled": true
  }'
```

---

### 4. 认证失败

#### 问题：登录时出现 "Error: Invalid credentials"
**解决方案：**
```bash
# 检查用户是否存在
curl "https://your-worker-url/api/admin/users" \
  -H "Authorization: Bearer <admin-token>"

# 重置用户密码
curl -X POST "https://your-worker-url/api/admin/users/:userId/reset-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "method": "generate",
    "forceReset": false
  }'
```

#### 问题：Token 过期
**解决方案：**
```bash
# 重新登录获取新 token
curl -X POST https://your-worker-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# 保存返回的 token 到 localStorage
localStorage.setItem('rualive_token', '<new-token>')
```

---

### 5. 前端构建失败

#### 问题：Vite 构建时出现 "Error: Cannot find module"
**解决方案：**
```bash
# 清除缓存和重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build:frontend
```

#### 问题：构建时出现 "Error: Out of memory"
**解决方案：**
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 重新构建
npm run build:frontend
```

---

### 6. Cron 触发器不工作

#### 问题：定时任务没有执行
**解决方案：**
```bash
# 检查 Cron 触发器配置
cat wrangler.toml | grep triggers

# 手动触发 Cron 任务
wrangler cron trigger rualive-email-worker "0 * * * *"

# 查看 Cron 日志
npm run tail
```

#### 问题：Cron 任务执行但邮件未发送
**解决方案：**
```bash
# 检查是否有符合条件的用户
wrangler d1 execute rualive --remote --command \
  "SELECT * FROM user_configs WHERE enabled = 1"

# 检查用户的配置是否正确
curl "https://your-worker-url/api/config" \
  -H "Authorization: Bearer <user-token>"

# 手动触发邮件发送
curl -X POST https://your-worker-url/api/send-now \
  -H "Authorization: Bearer <user-token>"
```

---

### 7. 性能问题

#### 问题：Worker 响应缓慢
**解决方案：**
```bash
# 检查 Worker 日志是否有错误
npm run tail

# 检查数据库查询是否优化
wrangler d1 execute rualive --remote --command \
  "EXPLAIN QUERY PLAN SELECT * FROM work_logs WHERE user_id = 'xxx'"

# 添加数据库索引（如果需要）
wrangler d1 execute rualive --remote --command \
  "CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, work_date)"
```

#### 问题：数据库查询超时
**解决方案：**
```bash
# 检查数据库大小
wrangler d1 execute rualive --remote --command \
  "SELECT name, SUM(length(sql)) as size FROM sqlite_master WHERE type='table'"

# 清理旧数据（保留最近30天）
wrangler d1 execute rualive --remote --command \
  "DELETE FROM work_logs WHERE work_date < date('now', '-30 days')"

# 清理旧日志（保留最近7天）
wrangler d1 execute rualive --remote --command \
  "DELETE FROM email_logs WHERE created_at < datetime('now', '-7 days')"
```

---

## 🆘 获取帮助

### 提交 Bug 报告
1. 查看 [已知问题](https://github.com/yancongya/RuAlive/issues)
2. 搜索是否已有相同问题
3. 提交新 Issue 时包含：
   - Worker URL
   - 错误日志
   - 重现步骤
   - 环境信息（Node.js 版本、Wrangler 版本）

### 联系支持
- **邮箱**: support@example.com
- **GitHub Issues**: https://github.com/yancongya/RuAlive/issues

---

## 📚 相关文档

- [快速开始指南](./quick-start.md)
- [部署指南](../DEPLOYMENT_AND_OPERATIONS.md)
- [API 文档](../modules/api/README.md)
- [数据库文档](../modules/database/README.md)

---

**仍然无法解决问题？** 请提交 Issue 并提供详细信息。