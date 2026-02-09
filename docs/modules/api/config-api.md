# 配置 API 文档

## 概述

配置 API 提供用户配置的获取和更新功能，包括邮件设置、工作时间设置、提醒设置等。

## 基础信息

- **基础路径**: `/api`
- **认证方式**: JWT Token

---

## API 端点

### 1. 获取用户配置

**端点**: `/api/config`
**方法**: `GET`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户 ID（可选，用于管理员查询其他用户配置） |

#### 请求示例

```http
GET /api/config HTTP/1.1
Host: rualive-email-worker.cubetan57.workers.dev
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "toEmail": "user@example.com",
    "adminEmail": "admin@example.com",
    "workStartTime": "09:00",
    "workEndTime": "18:00",
    "reminderTime": "18:00",
    "workHoursThreshold": 8,
    "keyframeThreshold": 100,
    "enableEmail": true,
    "enableReminder": true,
    "timezone": "Asia/Shanghai",
    "language": "zh",
    "createdAt": "2026-02-07T12:00:00.000Z",
    "updatedAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "未授权",
  "code": "UNAUTHORIZED"
}
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "用户配置不存在",
  "code": "CONFIG_NOT_FOUND"
}
```

---

### 2. 更新用户配置

**端点**: `/api/config`
**方法**: `POST`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| toEmail | string | 否 | 接收邮件的邮箱 |
| adminEmail | string | 否 | 紧急联系人邮箱 |
| workStartTime | string | 否 | 工作开始时间（HH:MM 格式） |
| workEndTime | string | 否 | 工作结束时间（HH:MM 格式） |
| reminderTime | string | 否 | 提醒时间（HH:MM 格式） |
| workHoursThreshold | number | 否 | 工作时长阈值（小时） |
| keyframeThreshold | number | 否 | 关键帧阈值 |
| enableEmail | boolean | 否 | 是否启用邮件通知 |
| enableReminder | boolean | 否 | 是否启用提醒 |
| timezone | string | 否 | 时区（如 "Asia/Shanghai"） |
| language | string | 否 | 语言（"zh" 或 "en"） |

#### 请求示例

```json
{
  "toEmail": "user@example.com",
  "adminEmail": "admin@example.com",
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "reminderTime": "18:00",
  "workHoursThreshold": 8,
  "keyframeThreshold": 100,
  "enableEmail": true,
  "enableReminder": true,
  "timezone": "Asia/Shanghai",
  "language": "zh"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "toEmail": "user@example.com",
    "adminEmail": "admin@example.com",
    "workStartTime": "09:00",
    "workEndTime": "18:00",
    "reminderTime": "18:00",
    "workHoursThreshold": 8,
    "keyframeThreshold": 100,
    "enableEmail": true,
    "enableReminder": true,
    "timezone": "Asia/Shanghai",
    "language": "zh",
    "updatedAt": "2026-02-07T13:00:00.000Z"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "无效的时间格式",
  "code": "INVALID_TIME_FORMAT"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "无效的时区",
  "code": "INVALID_TIMEZONE"
}
```

---

## 配置字段说明

### 邮件设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| toEmail | string | 用户邮箱 | 接收每日报告的邮箱 |
| adminEmail | string | 无 | 紧急情况联系邮箱 |
| enableEmail | boolean | true | 是否启用邮件通知 |

### 工作时间设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| workStartTime | string | "09:00" | 工作开始时间（24小时制） |
| workEndTime | string | "18:00" | 工作结束时间（24小时制） |
| workHoursThreshold | number | 8 | 工作时长阈值（小时） |

### 提醒设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| reminderTime | string | "18:00" | 每日提醒时间（24小时制） |
| enableReminder | boolean | true | 是否启用提醒 |

### 阈值设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| workHoursThreshold | number | 8 | 工作时长阈值（小时） |
| keyframeThreshold | number | 100 | 关键帧阈值（数量） |

### 系统设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| timezone | string | "Asia/Shanghai" | 用户时区 |
| language | string | "zh" | 界面语言 |

---

## 支持的时区列表

| 时区 | UTC 偏移 |
|------|---------|
| Asia/Shanghai | UTC+8 |
| Asia/Tokyo | UTC+9 |
| Asia/Hong_Kong | UTC+8 |
| Asia/Singapore | UTC+8 |
| America/New_York | UTC-5 |
| America/Los_Angeles | UTC-8 |
| Europe/London | UTC+0 |
| Europe/Paris | UTC+1 |
| Europe/Berlin | UTC+1 |

---

## 使用示例

### 获取配置

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取当前用户配置
curl -X GET https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN"

# 管理员获取指定用户配置
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/config?userId=user_123" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 更新配置

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 更新全部配置
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "user@example.com",
    "adminEmail": "admin@example.com",
    "workStartTime": "09:00",
    "workEndTime": "18:00",
    "reminderTime": "18:00",
    "workHoursThreshold": 8,
    "keyframeThreshold": 100,
    "enableEmail": true,
    "enableReminder": true,
    "timezone": "Asia/Shanghai",
    "language": "zh"
  }'

# 部分更新
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableEmail": false,
    "language": "en"
  }'
```

### 更新工作时间

```bash
# 修改工作时间为 8:30-17:30
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workStartTime": "08:30",
    "workEndTime": "17:30"
  }'
```

### 修改提醒设置

```bash
# 修改提醒时间为 19:00
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderTime": "19:00",
    "enableReminder": true
  }'
```

---

## 配置验证规则

### 时间格式

- 必须使用 `HH:MM` 格式（24小时制）
- 小时：00-23
- 分钟：00-59
- 示例：`09:00`、`13:30`、`23:59`

### 时区验证

- 必须是有效的 IANA 时区标识符
- 示例：`Asia/Shanghai`、`America/New_York`

### 语言验证

- 支持的语言：`zh`（中文）、`en`（英文）
- 默认值：`zh`

### 阈值验证

- `workHoursThreshold`：必须大于 0
- `keyframeThreshold`：必须大于等于 0

---

## 错误码说明

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INVALID_TIME_FORMAT | 400 | 无效的时间格式 |
| INVALID_TIMEZONE | 400 | 无效的时区 |
| INVALID_LANGUAGE | 400 | 无效的语言代码 |
| INVALID_THRESHOLD | 400 | 无效的阈值 |
| UNAUTHORIZED | 401 | 未授权 |
| CONFIG_NOT_FOUND | 404 | 用户配置不存在 |

---

## 配置使用场景

### 场景 1：首次使用

用户首次登录后，系统会自动创建默认配置：
- 邮件：使用注册邮箱
- 工作时间：09:00-18:00
- 提醒时间：18:00
- 时区：Asia/Shanghai
- 语言：zh

### 场景 2：调整工作时间

用户可以调整工作时间和提醒时间：
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workStartTime": "10:00",
    "workEndTime": "19:00",
    "reminderTime": "19:00"
  }'
```

### 场景 3：关闭邮件通知

临时关闭邮件通知（如休假期间）：
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableEmail": false
  }'
```

### 场景 4：切换语言

切换界面语言：
```bash
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en"
  }'
```

---

## 配置与邮件通知的关系

配置直接影响邮件通知的行为：

1. **工作时长阈值** (`workHoursThreshold`)
   - 如果工作时长低于阈值，邮件会标注"未达标"
   - 默认值：8 小时

2. **提醒时间** (`reminderTime`)
   - 在指定时间发送工作总结提醒
   - 如果 `enableReminder` 为 false，则不发送提醒

3. **邮件接收地址** (`toEmail`)
   - 每日报告发送到此邮箱
   - 可与注册邮箱不同

4. **紧急联系人** (`adminEmail`)
   - 在异常情况下发送通知
   - 可选字段

5. **启用邮件** (`enableEmail`)
   - 如果为 false，则不发送任何邮件

---

## 配置数据持久化

- 配置数据存储在 D1 数据库的 `user_configs` 表
- 每次更新都会记录 `updatedAt` 时间戳
- 支持配置历史记录查询（未来功能）

---

**文档版本**: 1.0
**最后更新**: 2026-02-08
**作者**: iFlow CLI