# RuAlive Email Worker - MVP部署指南

## ⚠️ 重要：前端修改和部署流程

修改前端代码（HTML/TSX/CSS）后，**必须**按以下步骤操作：

### 📋 完整部署流程

```bash
# 1. 进入前端目录
cd public

# 2. 构建前端（React应用）
npm run build

# 3. 返回项目根目录
cd ..

# 4. 部署到Cloudflare Worker
npx wrangler deploy

# 5. 验证功能
# 访问部署地址检查修改是否生效
```

### 🚀 快捷部署（推荐）

```bash
# 在 public 目录下执行一键构建和部署
cd public
npm run deploy
```

### ⚠️ 常见错误

- **错误**: 修改代码后未构建就部署
  - **解决**: 必须先执行 `npm run build`

- **错误**: 手动修改 dist 目录文件
  - **解决**: 不要手动修改，必须通过构建生成

- **错误**: 路由配置修改后未重新构建
  - **解决**: 修改 vite.config.ts 后必须重新构建

### 📁 当前路由配置

| 路由 | 源文件 | 说明 |
|------|--------|------|
| `/` | index.html | 首页 |
| `/login` | auth.html | 登录页 |
| `/user` | user-v6.html | 用户仪表板 |
| `/admin` | (动态生成) | 管理后台 |

> **注意**: `/user-v6` 路由已删除，使用 `/user` 访问用户页面

---

## 前置要求

1. Cloudflare账号（已注册）
2. Resend账号（已注册）
3. Node.js已安装
4. Wrangler CLI已安装

## 部署步骤

### 1. 安装依赖

```bash
cd rualive-email-worker
npm install
```

### 2. 登录Cloudflare

```bash
wrangler login
```

### 3. 创建KV命名空间

```bash
# 创建生产环境KV
npm run kv:create

# 创建预览环境KV
npm run kv:create-preview
```

**重要：** 将返回的ID复制到 `wrangler.toml` 文件中：
```toml
[[kv_namespaces]]
binding = "KV"
id = "生产环境ID"  # 替换这里
preview_id = "预览环境ID"  # 替换这里
```

### 4. 创建D1数据库

```bash
# 创建数据库
npm run db:create

# 记录返回的database_id，替换到wrangler.toml

# 创建表结构
npm run db:migrate
```

**重要：** 将返回的 `database_id` 复制到 `wrangler.toml` 文件中：
```toml
[[d1_databases]]
binding = "DB"
database_name = "rualive"
database_id = "数据库ID"  # 替换这里
```

### 5. 设置环境变量

```bash
# 设置Resend API密钥
wrangler secret put RESEND_API_KEY
# 输入你的Resend API密钥，格式如: re_xxxxxxxxxxxxxx
```

### 6. 部署Worker

```bash
npm run deploy
```

部署成功后会显示Worker的URL，类似：
```
https://rualive-email-worker.your-subdomain.workers.dev
```

### 7. 创建测试用户

```bash
# 使用curl创建用户（需要先获取你的Worker URL）
curl -X POST https://your-worker-url/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "config": {
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
    }
  }'
```

### 8. 测试功能

```bash
# 测试健康检查
curl https://your-worker-url/health

# 测试上传工作数据
curl -X POST https://your-worker-url/api/work-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "workData": {
      "work_hours": 3.5,
      "keyframe_count": 120,
      "json_size": 15,
      "project_count": 2,
      "composition_count": 5,
      "layer_count": 80,
      "effect_count": 30
    }
  }'

# 测试立即发送邮件
curl -X POST https://your-worker-url/api/send-now \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'

# 查看发送日志
curl "https://your-worker-url/api/logs?userId=user-001&limit=10"
```

### 9. 查看日志

```bash
# 实时查看Worker日志
npm run tail
```

## API端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/config` | GET | 获取用户配置 |
| `/api/config` | POST | 更新用户配置 |
| `/api/work-data` | POST | 上传工作数据 |
| `/api/send-now` | POST | 立即发送邮件 |
| `/api/logs` | GET | 获取发送日志 |

## 配置说明

### 用户配置示例

```json
{
  "enabled": true,
  "sendTime": "22:00",
  "timezone": "Asia/Shanghai",
  "userEmails": ["user@example.com"],
  "emergencyContacts": [
    {
      "email": "contact@example.com",
      "name": "联系人名称",
      "relation": "家人/朋友/同事"
    }
  ],
  "thresholds": {
    "minWorkHours": 2,
    "minKeyframes": 50,
    "minJsonSize": 10
  }
}
```

### 阈值说明

- `minWorkHours`: 最小工作时长（小时）
- `minKeyframes`: 最小关键帧数量
- `minJsonSize`: 最小JSON文件大小（KB）

## 故障排查

### 邮件发送失败

1. 检查Resend API密钥是否正确
2. 查看Worker日志：`npm run tail`
3. 确认发送域名已验证（如果使用自定义域名）

### 定时任务不触发

1. 检查Cron配置是否正确
2. 确认Worker已成功部署
3. 在Cloudflare Dashboard中手动触发测试

### 数据未保存

1. 检查D1数据库是否正确创建
2. 查看Worker日志中的错误信息
3. 确认API调用格式正确

## 下一步

完成Worker部署后，需要：

1. 在AE扩展中集成邮件管理模块
2. 配置自动上传工作数据
3. 测试端到端功能

详细说明请参考 `docs/web_integration/04_邮箱通知功能实施方案.md`