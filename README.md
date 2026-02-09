# RuAlive Email Worker - MVP部署指南

## ⚠️ 重要：前端修改和部署流程

修改前端代码（HTML/TSX/CSS）后，**必须**按以下步骤操作：

### 📋 完整部署流程（推荐）

使用自动化部署脚本一键完成所有步骤：

```bash
# 在 rualive-email-worker 目录下执行部署脚本
.\deploy.ps1
```

该脚本会自动完成：
1. 清理旧的 dist 目录
2. 构建前端（React应用）
3. 复制构建文件到 dist 目录
4. 部署到 Cloudflare Workers
5. 清理临时文件

### 🚀 手动部署流程（不推荐）

如果脚本无法使用，可以手动执行以下步骤：

```bash
# 1. 清理旧的构建文件
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue

# 2. 进入前端目录
cd public

# 3. 构建前端（React应用）
npm run build

# 4. 返回项目根目录
cd ..

# 5. 复制构建文件
Copy-Item public\dist -Destination dist -Recurse -Force

# 6. 部署到Cloudflare Worker
npm run deploy

# 7. 清理临时文件
Remove-Item public\dist -Recurse -Force -ErrorAction SilentlyContinue
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

使用自动化部署脚本（推荐）：

```bash
# 正常部署（智能检查文件变化）
.\deploy.ps1

# 强制重新构建（跳过检查）
.\deploy.ps1 -Force

# 只构建不部署
.\deploy.ps1 -NoDeploy
```

**脚本优化特性：**
- ✅ **智能检查**：自动检测源文件是否修改，未修改则跳过构建
- ✅ **节省时间**：避免不必要的重复构建
- ✅ **强制模式**：使用 `-Force` 参数强制重新构建
- ✅ **构建模式**：使用 `-NoDeploy` 参数只构建不部署

或手动部署：

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

## 常见部署问题

### 问题 1：静态资源 404 错误

**症状**：部署后访问页面，控制台显示静态资源（图片、JS、CSS）404 错误

**原因**：
- 配置文件引用的图片路径与实际文件路径不匹配
- 图片格式不一致（如配置引用 `.svg` 但实际是 `.jpg`）

**解决方法**：
1. 检查 `public/locals/landing/zh.json` 和 `en.json` 中的图片路径
2. 确保图片文件存在于 `public/assets/showcase/` 目录
3. 如果图片格式变更，更新配置文件中的文件扩展名

**示例**：
```json
// 错误配置
"showcase.items.0.img": "/assets/showcase/01-panel.svg"

// 正确配置（实际文件是 .jpg）
"showcase.items.0.img": "/assets/showcase/打卡页.jpg"
```

### 问题 2：MIME 类型错误

**症状**：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "".
```

**原因**：
- HTML 中引用了源代码文件（`.tsx`）而不是编译后的 JS 文件
- Worker 返回了错误的 MIME type

**解决方法**：
1. 确保使用 Vite 构建前端：`npm run build`
2. Vite 会自动编译 TSX 为 JS 并更新 HTML 引用
3. 部署前检查 `dist/index.html` 中的脚本引用

**对比**：
```html
<!-- 错误：引用源文件 -->
<script type="module" src="./index.tsx"></script>

<!-- 正确：引用编译后的文件 -->
<script type="module" crossorigin src="/assets/index-D0ADt15k.js"></script>
```

### 问题 3：构建产物路径问题

**症状**：部署后页面无法加载，Worker 找不到 `index.html`

**原因**：
- Vite 默认将 `public/` 目录下的文件构建到 `dist/public/`
- Worker 期望 `index.html` 在 `dist/` 根目录
- 路径不匹配导致 404

**解决方法**：
1. 在 `vite.config.ts` 中添加 `copy-showcase` 插件
2. 插件会在构建后自动复制 `index.html` 到正确位置

**配置示例**：
```typescript
{
  name: "copy-showcase",
  closeBundle() {
    // 复制 index.html 到 dist 根目录
    const indexSrc = join(__dirname, "dist/public/index.html");
    const indexDest = join(__dirname, "dist/index.html");
    if (existsSync(indexSrc)) {
      copyFileSync(indexSrc, indexDest);
    }
  }
}
```

### 问题 4：旧构建文件残留

**症状**：部署后仍显示旧版本代码或样式

**原因**：
- `public/assets/` 目录残留了之前的构建文件（JS 文件）
- 这些旧文件没有被清理，可能干扰新的构建

**解决方法**：
1. 定期清理 `public/assets/` 目录下的 JS 文件
2. 使用 `Get-ChildItem public\assets -Filter "*.js" | Remove-Item -Force` 清理
3. 或者使用自动化部署脚本 `.\deploy.ps1`

**清理命令**：
```powershell
Get-ChildItem public\assets -Filter "*.js" | Remove-Item -Force
```

### 问题 5：图片未正确部署

**症状**：部署后 showcase 图片无法显示

**原因**：
- Showcase 图片没有被复制到 `dist/assets/showcase/` 目录
- Vite 构建时只处理 JS 文件，不自动复制图片

**解决方法**：
1. 确保在 `vite.config.ts` 中配置了 `copy-showcase` 插件
2. 插件会在 `closeBundle` 钩子中复制所有图片
3. 验证构建输出中是否包含图片复制日志

**验证方法**：
```powershell
Get-ChildItem dist\assets\showcase -File
```

**Showcase 配置说明**：

落地页 showcase 部分支持展示 9 张功能截图，包含以下功能：

1. **打卡页** - 点击后即可定时循环进行刷新扫描打卡
2. **登录** - 数据默认本地进行保存，也可注册登录
3. **统计页** - 查看当天所有项目的各维度分析
4. **设置页** - 设置扫描间隔和下班提醒时间
5. **提醒** - 到时间后提醒当天工作的总结数据
6. **监控面板** - 各种图表查看当天的项目各项数据
7. **数据分析页** - 各个维度查看工作的变化
8. **同步提醒设置** - 可以每天邮箱进行提醒
9. **紧急联络人** - 工作时长低于一定阈值会触发提醒紧急联系人邮箱

**图片查看器功能**：
- 点击任何 showcase 图片可以打开全屏查看器
- 查看器包含黑色半透明背景和模糊效果
- 显示图片和完整的功能描述
- 点击任意位置或关闭按钮退出

**配置文件位置**：
- 中文配置：`public/locals/landing/zh.json`
- 英文配置：`public/locals/landing/en.json`
- 内嵌配置：`public/index.tsx` 中的 `TRANSLATIONS` 对象

**添加/修改 showcase 图片**：
1. 将图片放入 `public/assets/showcase/` 目录
2. 更新配置文件中的 `showcase.items` 数组
3. 格式：`{ "title": "标题 - 描述", "img": "/assets/showcase/文件名.jpg" }`
4. 重新构建并部署：`.\deploy.ps1`

---

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