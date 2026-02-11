# RuAlive Email Worker - MVP部署指南

## ⚠️ 重要：前端修改和部署流程

修改前端代码（HTML/TSX/CSS）后�?*必须**按以下步骤操作：

### 📋 完整部署流程（推荐）

使用自动化部署脚本一键完成所有步骤：

```bash
# �?rualive-email-worker 目录下执行部署脚�?.\deploy.ps1
```

该脚本会自动完成�?1. 清理旧的 dist 目录
2. 构建前端（React应用�?3. 复制构建文件�?dist 目录
4. 部署�?Cloudflare Workers
5. 清理临时文件

### 🚀 手动部署流程（不推荐�?
如果脚本无法使用，可以手动执行以下步骤：

```bash
# 1. 清理旧的构建文件
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue

# 2. 进入前端目录
cd public

# 3. 构建前端（React应用�?npm run build

# 4. 返回项目根目�?cd ..

# 5. 复制构建文件
Copy-Item public\dist -Destination dist -Recurse -Force

# 6. 部署到Cloudflare Worker
npm run deploy

# 7. 清理临时文件
Remove-Item public\dist -Recurse -Force -ErrorAction SilentlyContinue
```

### ⚠️ 常见错误

- **错误**: 修改代码后未构建就部�?  - **解决**: 必须先执�?`npm run build`

- **错误**: 手动修改 dist 目录文件
  - **解决**: 不要手动修改，必须通过构建生成

- **错误**: 路由配置修改后未重新构建
  - **解决**: 修改 vite.config.ts 后必须重新构�?
### 📁 当前路由配置

| 路由 | 源文�?| 说明 |
|------|--------|------|
| `/` | index.html | 首页 |
| `/login` | auth.html | 登录�?|
| `/user` | user-v6.html | 用户仪表�?|
| `/admin` | (动态生�? | 管理后台 |

> **注意**: `/user-v6` 路由已删除，使用 `/user` 访问用户页面

---

## 前置要求

1. Cloudflare账号（已注册�?2. Resend账号（已注册�?3. Node.js已安�?4. Wrangler CLI已安�?
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

**重要�?* 将返回的ID复制�?`wrangler.toml` 文件中：
```toml
[[kv_namespaces]]
binding = "KV"
id = "生产环境ID"  # 替换这里
preview_id = "预览环境ID"  # 替换这里
```

### 4. 创建D1数据�?
```bash
# 创建数据�?npm run db:create

# 记录返回的database_id，替换到wrangler.toml

# 创建表结�?npm run db:migrate
```

**重要�?* 将返回的 `database_id` 复制�?`wrangler.toml` 文件中：
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
- �?**智能检�?*：自动检测源文件是否修改，未修改则跳过构�?- �?**节省时间**：避免不必要的重复构�?- �?**强制模式**：使�?`-Force` 参数强制重新构建
- �?**构建模式**：使�?`-NoDeploy` 参数只构建不部署

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
# 使用curl创建用户（需要先获取你的Worker URL�?curl -X POST https://your-worker-url/api/config \
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
# 测试健康检�?curl https://your-worker-url/health

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

# 测试立即发送邮�?curl -X POST https://your-worker-url/api/send-now \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'

# 查看发送日�?curl "https://your-worker-url/api/logs?userId=user-001&limit=10"
```

### 9. 查看日志

```bash
# 实时查看Worker日志
npm run tail
```

## API端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检�?|
| `/api/config` | GET | 获取用户配置 |
| `/api/config` | POST | 更新用户配置 |
| `/api/work-data` | POST | 上传工作数据 |
| `/api/send-now` | POST | 立即发送邮�?|
| `/api/logs` | GET | 获取发送日�?|

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
      "name": "联系人名�?,
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

### 阈值说�?
- `minWorkHours`: 最小工作时长（小时�?- `minKeyframes`: 最小关键帧数量
- `minJsonSize`: 最小JSON文件大小（KB�?
## 常见部署问题

### 问题 1：静态资�?404 错误

**症状**：部署后访问页面，控制台显示静态资源（图片、JS、CSS�?04 错误

**原因**�?- 配置文件引用的图片路径与实际文件路径不匹�?- 图片格式不一致（如配置引�?`.svg` 但实际是 `.jpg`�?
**解决方法**�?1. 检�?`public/locals/landing/zh.json` �?`en.json` 中的图片路径
2. 确保图片文件存在�?`public/assets/showcase/` 目录
3. 如果图片格式变更，更新配置文件中的文件扩展名

**示例**�?```json
// 错误配置
"showcase.items.0.img": "/assets/showcase/01-panel.svg"

// 正确配置（实际文件是 .jpg�?"showcase.items.0.img": "/assets/showcase/打卡�?jpg"
```

### 问题 2：MIME 类型错误

**症状**�?```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "".
```

**原因**�?- HTML 中引用了源代码文件（`.tsx`）而不是编译后�?JS 文件
- Worker 返回了错误的 MIME type

**解决方法**�?1. 确保使用 Vite 构建前端：`npm run build`
2. Vite 会自动编�?TSX �?JS 并更�?HTML 引用
3. 部署前检�?`dist/index.html` 中的脚本引用

**对比**�?```html
<!-- 错误：引用源文件 -->
<script type="module" src="./index.tsx"></script>

<!-- 正确：引用编译后的文�?-->
<script type="module" crossorigin src="/assets/index-D0ADt15k.js"></script>
```

### 问题 3：构建产物路径问�?
**症状**：部署后页面无法加载，Worker 找不�?`index.html`

**原因**�?- Vite 默认�?`public/` 目录下的文件构建�?`dist/public/`
- Worker 期望 `index.html` �?`dist/` 根目�?- 路径不匹配导�?404

**解决方法**�?1. �?`vite.config.ts` 中添�?`copy-showcase` 插件
2. 插件会在构建后自动复�?`index.html` 到正确位�?
**配置示例**�?```typescript
{
  name: "copy-showcase",
  closeBundle() {
    // 复制 index.html �?dist 根目�?    const indexSrc = join(__dirname, "dist/public/index.html");
    const indexDest = join(__dirname, "dist/index.html");
    if (existsSync(indexSrc)) {
      copyFileSync(indexSrc, indexDest);
    }
  }
}
```

### 问题 4：旧构建文件残留

**症状**：部署后仍显示旧版本代码或样�?
**原因**�?- `public/assets/` 目录残留了之前的构建文件（JS 文件�?- 这些旧文件没有被清理，可能干扰新的构�?
**解决方法**�?1. 定期清理 `public/assets/` 目录下的 JS 文件
2. 使用 `Get-ChildItem public\assets -Filter "*.js" | Remove-Item -Force` 清理
3. 或者使用自动化部署脚本 `.\deploy.ps1`

**清理命令**�?```powershell
Get-ChildItem public\assets -Filter "*.js" | Remove-Item -Force
```

### 问题 5：图片未正确部署

**症状**：部署后 showcase 图片无法显示

**原因**�?- Showcase 图片没有被复制到 `dist/assets/showcase/` 目录
- Vite 构建时只处理 JS 文件，不自动复制图片

**解决方法**�?1. 确保�?`vite.config.ts` 中配置了 `copy-showcase` 插件
2. 插件会在 `closeBundle` 钩子中复制所有图�?3. 验证构建输出中是否包含图片复制日�?
**验证方法**�?```powershell
Get-ChildItem dist\assets\showcase -File
```

**Showcase 配置说明**�?
落地�?showcase 部分支持展示 9 张功能截图，包含以下功能�?
1. **打卡�?* - 点击后即可定时循环进行刷新扫描打�?2. **登录** - 数据默认本地进行保存，也可注册登�?3. **统计�?* - 查看当天所有项目的各维度分�?4. **设置�?* - 设置扫描间隔和下班提醒时�?5. **提醒** - 到时间后提醒当天工作的总结数据
6. **监控面板** - 各种图表查看当天的项目各项数�?7. **数据分析�?* - 各个维度查看工作的变�?8. **同步提醒设置** - 可以每天邮箱进行提醒
9. **紧急联络人** - 工作时长低于一定阈值会触发提醒紧急联系人邮箱

**图片查看器功�?*�?- 点击任何 showcase 图片可以打开全屏查看�?- 查看器包含黑色半透明背景和模糊效�?- 显示图片和完整的功能描述
- 点击任意位置或关闭按钮退�?
**配置文件位置**�?- 中文配置：`public/locals/landing/zh.json`
- 英文配置：`public/locals/landing/en.json`
- 内嵌配置：`public/index.tsx` 中的 `TRANSLATIONS` 对象

### 问题 6：登录页/其他页面 404 错误

**症状**�?```
GET https://rualive.itycon.cn/assets/client-Cc-pX27n-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG.js net::ERR_ABORTED 404 (Not Found)
```

**原因**�?- HTML 源文件（`public/auth.html`, `public/index.html` 等）中包含旧�?`<link rel="modulepreload">` 标签
- 这些标签引用了之前构建时生成�?JS 文件（如 `client-Cc-pX27n-FUpTIXKG-...js`�?- 这些文件已被删除或文件哈希已更改

**解决方法**�?1. 检�?HTML 源文件中�?`<link rel="modulepreload">` 标签
2. 删除所有手动添加的 modulepreload 标签
3. 只保�?`<script type="module">` 主入口点标签
4. 重新构建并部�?
**验证方法**�?```powershell
# 检�?HTML 文件中的 modulepreload 标签
Select-String -Path "public\*.html" -Pattern "modulepreload"

# 重新构建并部�?.\deploy.ps1 -Force
```

**修复后的正确 HTML 结构**�?```html
<!-- �?错误：旧�?modulepreload 标签 -->
<link rel="modulepreload" crossorigin href="/assets/client-Cc-pX27n-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG-FUpTIXKG.js">

<!-- �?正确：只保留主入口点 -->
<script type="module" crossorigin src="/assets/auth-QHsbu9yW.js"></script>
```

**注意事项**�?- 不要手动添加 `<link rel="modulepreload">` 标签
- Vite 会自动优化加载策�?- 每次构建后，文件哈希会变化，需要重新部�?
**添加/修改 showcase 图片**：
1. 将图片放到 `public/assets/showcase/` 目录
2. 更新配置文件中的 `showcase.items` 数组
3. 格式：`{ "title": "标题 - 描述", "img": "/assets/showcase/文件名.jpg" }`
4. 重新构建并部署：`.\deploy.ps1`

## 落地页功能说明

### 技术架构页面 (Tech Stack)

落地页新增 Section 5：技术架构页面，展示 RuAlive 完整的技术栈。

**页面结构**：
- 左侧面板：CEP 扩展技术栈
  - HTML5：纯原生 HTML/CSS/JavaScript
  - ExtendScript：Adobe After Effects API 脚本
  - CSInterface：CEP 通信桥接库
  - CSXS Manifest：扩展配置与权限管理
- 右侧面板：Email Worker 技术栈
  - Node.js：Cloudflare Workers 运行时环境
  - React 19：现代前端组件库
  - Vite 5：极速构建工具
  - Cloudflare D1：SQLite 数据库
- 数据流向动画：展示 AE 扫描 → 本地存储 → 云端上传 → 邮件通知 的完整数据流

**动画效果**：
- 数据包沿路径移动（使用 GSAP MotionPathPlugin）
- 节点呼吸循环动画：每个节点从圆心向外脉冲扩散
- 面板悬停效果：鼠标悬停时卡片轻微移动
- 响应式设计：小屏幕隐藏数据流向动画

**配置文件**：
- 中文：`public/locals/landing/zh.json`
- 英文：`public/locals/landing/en.json`
- 内嵌：`public/index.tsx` 中的 `TRANSLATIONS` 对象

### Hero 页面动画

**打字机动画效果**：
- 主标题 "Ru Alive?" 中的 "Alive" 部分带有呼吸动画
- 副标题 "你还Alive吗？" 支持循环打字机动画
  - 中文：显示 "你还"，然后逐字显示 "Alive吗？"
  - 英文：显示 "Are you still "，然后逐字显示 "Alive?"
- 打字机动画流程：
  1. 进场动画：逐字显示文本（每字 0.08 秒）
  2. 第一次闪烁：0.35 秒
  3. 等待 0.5 秒
  4. 第二次闪烁：0.35 秒
  5. 重新进场：循环播放

### 所有页面动画

**GSAP 动画库**：
- 使用 GSAP 及其插件：Observer、Draggable、MotionPathPlugin
- 背景线条动画：根据当前页面章节动态变化
- 滚动吸附定位：自动滚动到最近的页面章节
- 卡片悬停效果：轻微位移和透明度变化

**配置翻译键**：
- Hero 打字机动画使用 `hero.subtitlePrefix` 和 `hero.subtitleTypewriter`
- 技术架构页面使用 `techstack.*` 键（title、cep、worker、dataflow）

---

## 故障排查

### 邮件发送失�?
1. 检查Resend API密钥是否正确
2. 查看Worker日志：`npm run tail`
3. 确认发送域名已验证（如果使用自定义域名�?
### 定时任务不触�?
1. 检查Cron配置是否正确
2. 确认Worker已成功部�?3. 在Cloudflare Dashboard中手动触发测�?
### 数据未保�?
1. 检查D1数据库是否正确创�?2. 查看Worker日志中的错误信息
3. 确认API调用格式正确

## 下一�?
完成Worker部署后，需要：

1. 在AE扩展中集成邮件管理模�?2. 配置自动上传工作数据
3. 测试端到端功�?
详细说明请参�?`docs/web_integration/04_邮箱通知功能实施方案.md`
