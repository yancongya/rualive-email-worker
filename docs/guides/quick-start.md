# 快速开始指南 (Quick Start Guide)

> 适用于新用户和开发者快速上手 RuAlive Email Worker

---

## 📋 前置要求

### 必需工具
- **Node.js**: 版本 ≥ 18.0.0
- **npm**: 版本 ≥ 9.0.0
- **Git**: 版本 ≥ 2.30.0
- **Wrangler CLI**: Cloudflare Workers 命令行工具

### 安装 Wrangler CLI
```bash
npm install -g wrangler
```

---

## 🚀 快速部署（5分钟）

### 1. 克隆项目
```bash
git clone https://github.com/yancongya/RuAlive.git
cd RuAlive/rualive-email-worker
```

### 2. 安装依赖
```bash
npm install
```

### 3. 登录 Cloudflare
```bash
wrangler login
```

### 4. 创建数据库
```bash
npm run db:create
```

**重要**：复制返回的 `database_id`，更新到 `wrangler.toml`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "你的数据库ID"  # 替换这里
```

### 5. 创建 KV 命名空间
```bash
npm run kv:create
```

**重要**：复制返回的 ID，更新到 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "KV"
id = "生产环境ID"  # 替换这里
preview_id = "预览环境ID"  # 替换这里
```

### 6. 运行数据库迁移
```bash
npm run db:migrate
```

### 7. 设置环境变量
```bash
wrangler secret put RESEND_API_KEY
```
输入你的 Resend API 密钥。

### 8. 部署 Worker
```bash
npm run deploy
```

部署成功后，你会看到 Worker 的 URL。

---

## 📝 创建第一个用户

### 方法1: 使用邀请码注册
```bash
# 先使用管理员账号创建邀请码（如果已有邀请码可跳过）
curl -X POST https://your-worker-url/api/admin/invite-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "maxUses": 1,
    "expiresInDays": 30
  }'

# 使用邀请码注册用户
curl -X POST https://your-worker-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "email": "your-email@example.com",
    "password": "your-password",
    "inviteCode": "ALIVE-ABCD"
  }'
```

### 方法2: 管理员直接创建
```bash
curl -X POST https://your-worker-url/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "username": "your-username",
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

---

## 🔧 配置用户设置

### 设置工作数据上传配置
```bash
curl -X POST https://your-worker-url/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "enabled": true,
    "sendTime": "22:00",
    "timezone": "Asia/Shanghai",
    "userEmails": ["your-email@example.com"],
    "emergencyContacts": [
      {
        "email": "emergency@example.com",
        "name": "紧急联系人",
        "relation": "家人"
      }
    ],
    "thresholds": {
      "minWorkHours": 2,
      "minKeyframes": 50,
      "minJsonSize": 10
    }
  }'
```

---

## 📤 测试工作数据上传

```bash
curl -X POST https://your-worker-url/api/work-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "work_hours": 3.5,
    "keyframe_count": 120,
    "json_size": 15,
    "project_count": 2,
    "composition_count": 5,
    "layer_count": 80,
    "effect_count": 30,
    "projects": [
      {
        "projectId": "abc123",
        "name": "示例项目",
        "statistics": {
          "compositions": 3,
          "layers": 40,
          "keyframes": 60,
          "effects": 15
        },
        "currentDayRuntime": 7200
      }
    ]
  }'
```

---

## 📧 测试邮件发送

### 立即发送邮件
```bash
curl -X POST https://your-worker-url/api/send-now \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{}'
```

### 查看发送日志
```bash
curl "https://your-worker-url/api/logs?limit=10" \
  -H "Authorization: Bearer <your-token>"
```

---

## 🎯 下一步

1. **查看完整文档**：访问 [docs/README.md](../README.md) 查看所有文档
2. **了解 API 端点**：查看 [API 文档](../modules/api/README.md) 了解所有可用 API
3. **配置自动发送**：设置 Cron 触发器（每小时检查）
4. **自定义邮件模板**：修改邮件内容以适应你的需求

---

## ❓ 常见问题

### Q: 如何查看 Worker 日志？
```bash
npm run tail
```

### Q: 如何在本地测试？
```bash
npm run dev
```

### Q: 如何更新已部署的 Worker？
```bash
npm run deploy
```

### Q: 如何回滚到上一个版本？
```bash
wrangler rollback
```

---

## 📚 更多资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Resend API 文档](https://resend.com/docs)
- [Vite 文档](https://vitejs.dev/)

---

**需要帮助？** 查看 [故障排查指南](./troubleshooting.md) 或提交 Issue。