# 邮件通知功能

> RuAlive Email Worker 邮件通知系统完整文档

---

## 📧 功能概述

邮件通知系统是 RuAlive 的核心功能之一，通过 Cloudflare Workers 和 Resend API 实现定时邮件发送，包括：

1. **每日工作总结邮件** - 定时发送给用户
2. **紧急联系人提醒邮件** - 工作量不足时发送给紧急联系人
3. **API 密钥测试邮件** - 验证 Resend API 配置
4. **密码重置通知邮件** - 管理员重置密码时发送通知

---

## 🏗️ 系统架构

### 技术栈
- **邮件服务商**: Resend API
- **定时触发**: Cloudflare Workers Cron
- **数据库**: Cloudflare D1 (邮件日志存储)
- **密钥存储**: Cloudflare KV (API 密钥管理)

### 架构图
```
Cloudflare Cron (每小时触发)
  ↓
handleCronTrigger()
  ↓
遍历所有用户
  ↓
检查用户配置和时区
  ↓
判断发送条件
  ↓
发送邮件 → Resend API
  ↓
记录日志 → email_logs 表
```

---

## 📬 邮件类型详解

### 1️⃣ 每日工作总结邮件

**目的**: 向用户发送当日工作统计报告

**触发条件**:
- 用户已启用邮件通知 (`enabled = true`)
- 今天在通知周期中 (`scheduleDays.includes(currentDayOfWeek)`)
- 当前时间 = 用户通知时间 (默认 22:00)
- 有工作数据 (`workData !== null`)

**发送对象**: 用户邮箱

**邮件主题**: `[RuAlive] 日期 工作总结报告`

**邮件内容**:
- 工作时长
- 合成数量
- 图层数量
- 关键帧数量
- 效果数量
- 项目统计
- 幽默风格总结

**代码位置**:
- 发送函数: `src/index.js:sendDailySummary()`
- 邮件模板: `src/templates/daily-summary-humor.js`

**配置项**:
```javascript
{
  enabled: true,                    // 是否启用
  user_notification_hour: 22,       // 通知时间（24小时制）
  timezone: 'Asia/Shanghai',        // 时区
  notification_schedule: "[1,2,3,4,5]",  // 通知周期（周一到周五）
  min_work_hours: 2                // 最小工作时长阈值
}
```

---

### 2️⃣ 紧急联系人提醒邮件

**目的**: 当用户工作量不足时，通知紧急联系人

**触发条件**:
- 用户已启用紧急通知 (`enable_emergency_notification = true`)
- 今天在通知周期中
- 当前时间 = 紧急通知时间 (默认 22:00)
- 配置了紧急联系人邮箱 (`emergency_email`)
- 工作量不足（无数据或工时不足阈值）

**发送对象**: 紧急联系人邮箱

**邮件主题**: `[紧急提醒] 用户名 今天工作量不足！`

**邮件内容**:
- 用户名
- 工作时长（或提示无工作数据）
- 项目统计
- 幽默风格警告
- 联系方式

**代码位置**:
- 发送函数: `src/index.js:sendWarningEmail()`
- 邮件模板: `src/templates/warning-humor.js`

**配置项**:
```javascript
{
  enable_emergency_notification: true,  // 是否启用紧急通知
  emergency_notification_hour: 22,     // 紧急通知时间
  emergency_email: 'contact@example.com',  // 紧急联系人邮箱
  min_work_hours: 2                    // 最小工作时长阈值
}
```

---

### 3️⃣ API 密钥测试邮件

**目的**: 验证 Resend API 配置是否正确

**触发方式**:
- 管理员通过后台管理界面手动触发
- 调用 `POST /api/admin/test-email` API

**限制条件**:
- 每天每个邮箱最多发送 3 次测试邮件
- 记录在 `test_email_logs` 表

**发送对象**: 管理员邮箱或指定的测试邮箱

**邮件主题**: `[RuAlive] API密钥测试邮件`

**邮件内容**:
- 测试成功提示
- API 密钥状态
- 发送时间
- 系统信息

**代码位置**:
- API 端点: `src/index.js:handleTestEmail()`
- 邮件内容: 硬编码在 `handleTestEmail()` 函数中

**请求格式**:
```json
{
  "apiKey": "re_xxxxxxxxxxxxxx",
  "testEmail": "test@example.com"  // 可选，默认使用管理员邮箱
}
```

---

### 4️⃣ 密码重置通知邮件

**目的**: 管理员重置用户密码后，通过邮件通知用户新密码

**触发方式**:
- 管理员通过后台管理界面重置密码
- 调用 `POST /api/admin/users/:id/reset-password` API

**发送对象**: 用户邮箱

**邮件主题**: `RuAlive 密码重置通知`

**邮件内容**:
- 用户名
- 临时密码
- 登录指引
- 安全提醒

**密码重置模式**:
1. **自动生成模式**: 系统生成 12 位随机密码
2. **自定义密码模式**: 管理员指定密码（最少 6 位）

**代码位置**:
- API 端点: `src/index.js:handleResetPassword()`
- 邮件内容: 硬编码在 `handleResetPassword()` 函数中

**请求格式**:
```json
{
  "method": "generate",  // 或 "set"
  "newPassword": "自定义密码"  // 仅在 method 为 "set" 时需要
}
```

---

## ⚙️ 邮件发送核心函数

### sendEmail()
**位置**: `src/index.js:3618`

**功能**: 通过 Resend API 发送邮件

**参数**:
```javascript
async function sendEmail(to, subject, html, env)
```

**参数说明**:
- `to`: 收件人邮箱地址
- `subject`: 邮件主题
- `html`: 邮件 HTML 内容
- `env`: Cloudflare 环境变量

**API 密钥获取顺序**:
1. 优先从 KV 存储获取: `KV.get('RESEND_API_KEY')`
2. 回退到环境变量: `env.RESEND_API_KEY`
3. 如果都没有，抛出错误

**返回值**: Resend API 响应对象

**错误处理**:
- API 密钥未设置 → 抛出错误
- API 调用失败 → 解析错误信息并抛出

---

### logSend()
**位置**: `src/index.js:3564`

**功能**: 记录邮件发送日志到数据库

**参数**:
```javascript
async function logSend(userId, recipientType, recipientEmail, emailType, status, errorMessage, env, resendEmailId = null, subject = null)
```

**参数说明**:
- `userId`: 用户 ID
- `recipientType`: 收件人类型（user/emergency）
- `recipientEmail`: 收件人邮箱
- `emailType`: 邮件类型（summary/warning/test/reset）
- `status`: 发送状态（success/failed）
- `errorMessage`: 错误信息（失败时）
- `env`: 环境变量
- `resendEmailId`: Resend API 返回的邮件 ID
- `subject`: 邮件主题

**数据库表**: `email_logs`

---

## 🔒 邮件发送限制

### 每日发送限制

**限制目的**: 防止滥发邮件，保护用户邮箱

**配置项**:
```javascript
{
  daily_email_limit: 100,  // 每日最大发送次数
  daily_email_count: 0,    // 今日已发送次数
  last_email_date: null    // 上次发送日期
}
```

**检查逻辑** (`checkEmail()`):
1. 获取用户配置
2. 检查上次发送日期
3. 如果日期不同，重置计数器
4. 检查是否超过限制
5. 返回检查结果

**响应格式**:
```javascript
{
  allowed: true/false,
  limit: 100,
  current: 50,
  remaining: 50,
  message: "每日发送次数已达上限 (100)"
}
```

**计数器更新**:
- 每次成功发送邮件后调用 `incrementEmailCount()`
- 自动跨日重置

---

### 测试邮件限制

**限制规则**: 每天每个邮箱最多发送 3 次测试邮件

**数据库表**: `test_email_logs`

**检查逻辑**:
1. 获取当前日期
2. 查询该邮箱今天的发送次数
3. 如果 >= 3，拒绝发送
4. 返回 429 状态码

**错误响应**:
```json
{
  "success": false,
  "error": "今日测试次数已达上限（3次），请明天再试"
}
```

---

## 📊 邮件日志系统

### email_logs 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | TEXT | 用户 ID |
| recipient_type | TEXT | 收件人类型（user/emergency） |
| recipient_email | TEXT | 收件人邮箱 |
| email_type | TEXT | 邮件类型（summary/warning/test/reset） |
| status | TEXT | 发送状态（success/failed） |
| error_message | TEXT | 错误信息 |
| sent_at | TEXT | 发送时间 |
| resend_email_id | TEXT | Resend 邮件 ID |
| subject | TEXT | 邮件主题 |

### 查询接口

#### 获取用户邮件统计
**端点**: `GET /api/admin/users/:id/email-stats`

**返回数据**:
```javascript
{
  email: "user@example.com",
  totalEmailsSent: 100,
  totalEmailsFailed: 5,
  lastEmailSentAt: "2026-02-07T22:00:00.000Z",
  emailLimit: {
    dailyLimit: 100,
    emailsSentToday: 10,
    remainingToday: 90
  }
}
```

#### 获取邮件发送日志
**端点**: `GET /api/admin/logs`

**返回数据**: 邮件发送记录列表

#### 获取全局邮件统计
**端点**: `GET /api/admin/email-stats`

**返回数据**:
```javascript
{
  totalEmailsSent: 1000,
  totalEmailsFailed: 50,
  totalUsers: 10,
  lastEmailSentAt: "2026-02-07T22:00:00.000Z"
}
```

---

## 🔄 定时任务流程

### Cron 触发器配置

**配置文件**: `wrangler.toml`

```toml
[triggers]
crons = ["0 * * * *"]  # 每小时的 0 分触发
```

### 处理流程详解

```
1. Cron 触发
   ↓
2. handleCronTrigger(env)
   ↓
3. 获取所有用户
   ↓
4. 遍历每个用户:
   ↓
   5. 获取用户配置
   ↓
   6. 转换为用户时区时间
   ↓
   7. 解析通知周期 (notification_schedule)
   ↓
   8. 检查今天是否在通知周期
   ↓
   9. 检查当前时间是否匹配通知时间
   ↓
   10. 获取当天工作数据
   ↓
   11. 判断发送条件:
       - 有工作数据 + 用户通知时间 → 发送总结邮件
       - 工作不足 + 紧急通知时间 → 发送警告邮件
   ↓
   12. 记录发送日志
```

### 时区处理

**重要性**: 确保用户在正确的时间收到邮件

**处理逻辑**:
```javascript
// 获取当前 UTC 时间
const now = new Date();

// 转换为用户时区
const userTimezone = config.timezone || 'Asia/Shanghai';
const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));

// 获取用户时区的小时和星期几
const currentTime = `${String(userNow.getHours()).padStart(2, '0')}:${String(userNow.getMinutes()).padStart(2, '0')}`;
const currentDayOfWeek = userNow.getDay();
```

---

## 🎨 邮件模板风格

### 幽默风格设计

**设计理念**: 让工作总结不再枯燥，增加趣味性和可读性

**特点**:
- 使用轻松幽默的语气
- 加入调侃和鼓励的话语
- 使用表情符号增加亲和力
- 数据可视化展示

**示例**:
```
今天你居然坚持工作了 X 小时！
（虽然比起昨天可能差点意思）

你的合成数量达到了 Y 个！
（是不是又在疯狂Ctrl+D复制图层了？）
```

---

## 🛠️ 配置和管理

### 用户配置管理

**配置接口**: `POST /api/config`

**配置项**:
```javascript
{
  enabled: true,                           // 是否启用邮件通知
  send_time: "22:00",                      // 发送时间
  timezone: "Asia/Shanghai",               // 时区
  notification_schedule: "[1,2,3,4,5]",    // 通知周期
  emergency_email: "contact@example.com", // 紧急联系人邮箱
  enable_emergency_notification: true,    // 是否启用紧急通知
  min_work_hours: 2,                       // 最小工作时长
  user_notification_hour: 22,             // 用户通知时间
  emergency_notification_hour: 22         // 紧急通知时间
}
```

### 邮件限制管理

**设置限制**: `POST /api/admin/users/:id/email-limit`

**查询限制状态**: `GET /api/admin/users/:id/email-limit-status`

---

## 🔍 故障排查

### 邮件未发送

**可能原因**:
1. 用户配置未启用 (`enabled = false`)
2. 不在通知周期内
3. 当前时间不匹配通知时间
3. 无工作数据（对于总结邮件）
4. 工作量充足（对于警告邮件）
5. 邮件发送限制已达到
6. Resend API 密钥未设置或失效

**排查步骤**:
1. 检查用户配置: `SELECT * FROM user_configs WHERE user_id = ?`
2. 检查邮件日志: `SELECT * FROM email_logs WHERE user_id = ? ORDER BY sent_at DESC`
3. 检查 Resend API 密钥: `wrangler secret list`
4. 查看 Worker 日志: `npm run tail`
5. 测试邮件发送: `POST /api/admin/test-email`

### Resend API 错误

**常见错误**:
- API 密钥未设置: `API密钥未设置`
- 发送人邮箱未验证: 检查 Resend 后台
- 收件人邮箱无效: 检查邮箱格式
- 超过发送限制: 等待下一小时或升级账户

---

## 📝 最佳实践

### 1. 时区配置
- 始终使用用户本地时区
- 考虑夏令时变化
- 测试不同时区的发送时间

### 2. 通知周期
- 工作日设置: `[1,2,3,4,5]` (周一到周五)
- 每天设置: `[0,1,2,3,4,5,6]` (周一到周日)
- 自定义设置: 根据实际情况配置

### 3. 邮件限制
- 合理设置每日发送限制（默认 100 次）
- 监控发送频率，避免被标记为垃圾邮件
- 定期清理无效邮箱地址

### 4. 错误处理
- 始终记录发送日志
- 失败时重试机制（可选）
- 向用户友好的错误提示

### 5. 安全考虑
- API 密钥存储在 KV 中，不要硬编码
- 敏感信息（密码）通过邮件发送后立即失效
- 验证收件人邮箱格式

---

## 🚀 扩展建议

### 1. 邮件模板自定义
- 允许用户选择邮件风格（正式/幽默）
- 支持自定义邮件内容
- 添加邮件签名

### 2. 多语言支持
- 根据用户语言偏好发送对应语言的邮件
- 支持中英文切换

### 3. 附件支持
- 添加图表附件
- 导出 Excel 报告

### 4. 通知渠道扩展
- 支持短信通知
- 支持微信通知
- 支持钉钉/企业微信通知

### 5. 智能分析
- 工作趋势分析
- 效率提升建议
- 异常检测

---

## 📚 相关文档

- [邮件服务文档](../backend/email-service.md)
- [数据库架构](../database/schema.md)
- [数据流分析](../database/data-flows.md)
- [Resend API 文档](https://resend.com/docs)

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI