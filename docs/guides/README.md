# 开发指南总览

## 指南分类

### 1. 快速开始
**文档**: [quick-start.md](quick-start.md)

**内容**:
- 环境准备
- 依赖安装
- 项目初始化
- 第一个 API 测试

**前置要求**:
- Cloudflare 账号
- Node.js 18+
- Wrangler CLI
- Resend 账号

**预计时间**: 30 分钟

### 2. 部署指南
**文档**: [deployment.md](deployment.md)

**内容**:
- 前端构建流程
- Worker 部署流程
- 数据库初始化
- KV 存储配置
- 密钥配置

**部署方式**:
- 自动化部署脚本（推荐）
- 手动分步部署
- 环境配置

**预计时间**: 15 分钟

### 3. 数据库迁移
**文档**: [database-migration.md](database-migration.md)

**内容**:
- 数据库创建
- 架构变更
- 迁移脚本
- 数据备份
- 数据恢复

**迁移步骤**:
1. 创建迁移文件
2. 本地测试
3. 预览环境测试
4. 生产环境部署
5. 验证结果

**预计时间**: 20 分钟

### 4. 故障排除
**文档**: [troubleshooting.md](troubleshooting.md)

**内容**:
- 常见错误和解决方案
- 日志分析
- 性能优化
- 安全检查

**常见问题**:
- 部署失败
- 数据库连接失败
- 邮件发送失败
- 前端加载失败
- API 调用失败

---

## 快速链接

### 新手入门
1. [快速开始](quick-start.md) - 30 分钟快速上手
2. [部署指南](deployment.md) - 15 分钟完成部署
3. [常见问题](troubleshooting.md) - 解决常见问题

### 开发人员
1. [项目结构](../PHASE1_PROJECT_STRUCTURE.md) - 了解项目结构
2. [API 文档](../modules/api/README.md) - 查看 API 接口
3. [数据库架构](../modules/database/README.md) - 了解数据库结构

### 运维人员
1. [部署指南](deployment.md) - 部署和更新
2. [数据库迁移](database-migration.md) - 数据库管理
3. [故障排除](troubleshooting.md) - 问题诊断

---

## 开发环境配置

### 本地开发
```bash
# 1. 克隆项目
git clone <repo-url>
cd rualive-email-worker

# 2. 安装依赖
npm install

# 3. 启动 Worker 开发服务器
npm run dev

# 4. 启动前端开发服务器
npm run dev:frontend

# 5. 查看实时日志
npm run tail
```

### 环境变量
```bash
# 设置 Resend API 密钥
wrangler secret put RESEND_API_KEY

# 设置 JWT 密钥（可选）
wrangler secret put JWT_SECRET
```

### 数据库配置
```bash
# 创建 D1 数据库
npm run db:create

# 执行架构迁移
npm run db:migrate

# 创建 KV 命名空间
npm run kv:create
```

---

## 测试指南

### 集成测试
```bash
cd tests

# 运行单个测试
.\test-simple.ps1           # 基本登录测试
.\test-send-email.ps1       # 邮件发送测试
.\test-admin-login.ps1      # 管理员认证测试
```

### API 测试
```bash
# 测试用户注册
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'

# 测试用户登录
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 前端测试
```bash
# 构建前端
npm run build:frontend

# 部署到本地测试
npm run deploy

# 访问测试地址
https://rualive-email-worker.cubetan57.workers.dev
```

---

## 监控和调试

### 实时日志
```bash
# 查看 Worker 实时日志
npx wrangler tail

# 查看特定日志级别
npx wrangler tail --format pretty
```

### 数据库查询
```bash
# 查询用户列表
wrangler d1 execute rualive --remote --command "SELECT id, email, username FROM users LIMIT 10"

# 查询工作日志
wrangler d1 execute rualive --remote --command "SELECT * FROM work_logs ORDER BY created_at DESC LIMIT 10"

# 查询邮件日志
wrangler d1 execute rualive --remote --command "SELECT * FROM email_logs WHERE status = 'failed'"
```

### KV 存储
```bash
# 列出所有键
wrangler kv:key list KV --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"

# 获取键值
wrangler kv:key get KV "user_123" --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"

# 删除键
wrangler kv:key delete KV "user_123" --namespace-id="2ab9c0f8a4be4e56a30097fcd349befb"
```

---

## 性能优化

### 数据库优化
- 为常用查询字段添加索引
- 避免全表扫描
- 使用 LIMIT 限制结果数量
- 使用缓存减少数据库访问

### API 优化
- 实现速率限制
- 启用压缩
- 优化响应格式
- 减少不必要的数据传输

### 前端优化
- 使用代码分割
- 实现懒加载
- 优化图片资源
- 启用浏览器缓存

---

## 安全检查清单

### 数据安全
- [ ] 密码使用哈希存储
- [ ] 敏感信息使用 Secrets 存储
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CSRF 防护

### API 安全
- [ ] JWT Token 认证
- [ ] 权限验证
- [ ] 速率限制
- [ ] 输入验证
- [ ] 错误处理不泄露敏感信息

### 邮件安全
- [ ] 邮件地址验证
- [ ] 防止邮件滥用
- [ ] 邮件内容验证
- [ ] 发送频率限制

---

## 更新和维护

### 版本更新
```bash
# 更新依赖
npm update

# 更新 Wrangler
npm install --save-dev wrangler@latest

# 测试更新
npm run dev
npm run test
```

### 部署更新
```bash
# 自动化部署
.\deploy.ps1

# 手动部署
npm run build:frontend
npm run deploy
```

### 监控更新
- 检查 Worker 日志
- 监控 API 响应时间
- 检查数据库性能
- 监控邮件发送成功率

---

## 社区和支持

### 文档
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)

### 工具
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Resend API](https://resend.com/)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI