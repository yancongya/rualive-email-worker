# 日志 API 文档

## 概述

日志 API 提供工作日志、邮件发送日志的查询功能，支持按日期范围、用户等条件过滤，用于数据分析和问题排查。

## 基础信息

- **基础路径**: `/api`
- **认证方式**: JWT Token
- **数据来源**: D1 数据库（work_logs、send_logs 表）

---

## API 端点

### 1. 获取邮件发送日志

**端点**: `/api/logs`
**方法**: `GET`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户 ID（管理员可查询其他用户） |
| limit | number | 否 | 返回数量限制（默认 50，最大 1000） |
| status | string | 否 | 邮件状态（"success"、"failed"） |
| startDate | string | 否 | 开始日期（YYYY-MM-DD 格式） |
| endDate | string | 否 | 结束日期（YYYY-MM-DD 格式） |

#### 请求示例

```http
GET /api/logs?userId=user_123&limit=50&status=success&startDate=2026-02-01&endDate=2026-02-07 HTTP/1.1
Host: rualive-email-worker.cubetan57.workers.dev
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "user_123",
      "email": "user@example.com",
      "workDate": "2026-02-07",
      "subject": "工作日报 - 2026-02-07",
      "sentAt": "2026-02-07T18:00:00.000Z",
      "status": "success",
      "errorMessage": null
    },
    {
      "id": 2,
      "userId": "user_123",
      "email": "user@example.com",
      "workDate": "2026-02-06",
      "subject": "工作日报 - 2026-02-06",
      "sentAt": "2026-02-06T18:00:00.000Z",
      "status": "failed",
      "errorMessage": "Resend API error: Invalid recipient email"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 50
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

---

### 2. 获取工作日志范围

**端点**: `/api/work-logs/range`
**方法**: `GET`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "minDate": "2026-01-01",
    "maxDate": "2026-02-07",
    "totalDays": 38,
    "totalLogs": 38
  }
}
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "无工作日志",
  "code": "NO_WORK_LOGS"
}
```

---

### 3. 获取工作日志

**端点**: `/api/work-logs`
**方法**: `GET`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期（YYYY-MM-DD 格式） |
| endDate | string | 否 | 结束日期（YYYY-MM-DD 格式） |
| userId | string | 否 | 用户 ID（管理员可查询其他用户） |
| limit | number | 否 | 返回数量限制（默认 100，最大 1000） |

#### 请求示例

```http
GET /api/work-logs?startDate=2026-02-01&endDate=2026-02-07&limit=100 HTTP/1.1
Host: rualive-email-worker.cubetan57.workers.dev
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "user_123",
      "workDate": "2026-02-07",
      "workHours": 8.5,
      "keyframeCount": 699,
      "compositionCount": 38,
      "layerCount": 8,
      "effectCount": 273,
      "projectCount": 2,
      "jsonSize": 15360,
      "compositionsJson": "[{\"name\":\"Comp1\",\"width\":1920,\"height\":1080}]",
      "effectsJson": "[{\"layerName\":\"Layer1\",\"effectName\":\"Gaussian Blur\"}]",
      "layersJson": "{\"video\":2,\"image\":3,\"shapeLayer\":1}",
      "keyframesJson": "{\"Layer1\":350,\"Layer2\":349}",
      "projectsJson": "[{\"id\":\"abc123def456\",\"name\":\"项目A\"}]",
      "createdAt": "2026-02-07T12:00:00.000Z"
    },
    {
      "id": 2,
      "userId": "user_123",
      "workDate": "2026-02-06",
      "workHours": 7.2,
      "keyframeCount": 550,
      "compositionCount": 35,
      "layerCount": 10,
      "effectCount": 200,
      "projectCount": 1,
      "jsonSize": 10240,
      "compositionsJson": "[{\"name\":\"Comp2\",\"width\":1920,\"height\":1080}]",
      "effectsJson": "[{\"layerName\":\"Layer2\",\"effectName\":\"Curves\"}]",
      "layersJson": "{\"video\":3,\"image\":2,\"textLayer\":1}",
      "keyframesJson": "{\"Layer3\":300,\"Layer4\":250}",
      "projectsJson": "[{\"id\":\"xyz789uvw012\",\"name\":\"项目B\"}]",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 100
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "无效的日期范围",
  "code": "INVALID_DATE_RANGE"
}
```

---

## 数据结构说明

### 邮件发送日志对象 (Send Log)

```typescript
{
  id: number;              // 日志 ID
  userId: string;          // 用户 ID
  email: string;           // 接收邮件的邮箱
  workDate: string;        // 工作日期（YYYY-MM-DD）
  subject: string;         // 邮件主题
  sentAt: string;          // 发送时间（ISO 8601）
  status: string;          // 发送状态（"success"、"failed"）
  errorMessage: string | null; // 错误信息（如果有）
}
```

### 工作日志对象 (Work Log)

```typescript
{
  id: number;              // 日志 ID
  userId: string;          // 用户 ID
  workDate: string;        // 工作日期（YYYY-MM-DD）
  workHours: number;       // 工作时长（小时）
  keyframeCount: number;   // 关键帧数量
  compositionCount: number;// 合成数量
  layerCount: number;      // 图层数量
  effectCount: number;     // 效果数量
  projectCount: number;    // 项目数量
  jsonSize: number;        // JSON 数据大小（字节）
  compositionsJson: string;// 合成数据（JSON 字符串）
  effectsJson: string;     // 效果数据（JSON 字符串）
  layersJson: string;      // 图层数据（JSON 字符串）
  keyframesJson: string;   // 关键帧数据（JSON 字符串）
  projectsJson: string;    // 项目数据（JSON 字符串）
  createdAt: string;       // 创建时间（ISO 8601）
}
```

---

## 使用示例

### 获取邮件发送日志

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取当前用户的所有邮件发送日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs" \
  -H "Authorization: Bearer $TOKEN"

# 获取本月成功的邮件发送日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?status=success&startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"

# 获取失败的邮件发送日志（用于排查问题）
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?status=failed" \
  -H "Authorization: Bearer $TOKEN"

# 管理员查询指定用户的邮件发送日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?userId=user_456" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 获取工作日志

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取所有工作日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs" \
  -H "Authorization: Bearer $TOKEN"

# 获取本月工作日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"

# 获取最近 7 天的工作日志
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "7 days ago" +%Y-%m-%d)

curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN"
```

### 获取工作日志范围

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取工作日志的日期范围
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs/range" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 日志查询场景

### 场景 1：检查邮件发送状态

```bash
# 查看最近 7 天的邮件发送情况
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "7 days ago" +%Y-%m-%d)

curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {date: .workDate, status: .status, email: .email}'
```

### 场景 2：排查失败的邮件

```bash
# 获取所有失败的邮件发送日志
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?status=failed" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {date: .workDate, error: .errorMessage}'
```

### 场景 3：统计工作时长

```bash
# 获取本月工作日志并计算总工作时长
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[].workHours] | add'
```

### 场景 4：分析关键帧趋势

```bash
# 获取最近 30 天的关键帧数量趋势
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "30 days ago" +%Y-%m-%d)

curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {date: .workDate, keyframes: .keyframeCount}'
```

### 场景 5：检查项目活跃度

```bash
# 获取每天的项目数量
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {date: .workDate, projects: .projectCount}'
```

---

## 日志数据分析

### 1. 邮件发送成功率

```bash
# 计算邮件发送成功率
TOTAL=$(curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs" -H "Authorization: Bearer $TOKEN" | jq '.total')
SUCCESS=$(curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?status=success" -H "Authorization: Bearer $TOKEN" | jq '.total')

SUCCESS_RATE=$(echo "scale=2; $SUCCESS * 100 / $TOTAL" | bc)
echo "邮件发送成功率: $SUCCESS_RATE%"
```

### 2. 平均工作时长

```bash
# 计算平均工作时长
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs" \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[].workHours] | add / length'
```

### 3. 关键帧统计

```bash
# 计算总关键帧数量
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs" \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[].keyframeCount] | add'

# 计算平均关键帧数量
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs" \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[].keyframeCount] | add / length'
```

### 4. 工作天数统计

```bash
# 计算总工作天数
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs/range" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.totalDays'
```

---

## 性能优化

### 1. 使用日期范围过滤

```bash
# ✅ 好的做法：使用日期范围过滤
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer $TOKEN"

# ❌ 不好的做法：获取所有数据后客户端过滤
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | select(.workDate >= "2026-02-01" and .workDate <= "2026-02-07")'
```

### 2. 限制返回数量

```bash
# ✅ 好的做法：使用 limit 参数
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# ❌ 不好的做法：获取所有数据后客户端截取
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/logs" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[:10]'
```

### 3. 分页查询

```bash
# 第一页（1-50）
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# 第二页（51-100）
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?limit=50&offset=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 错误码说明

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INVALID_DATE_RANGE | 400 | 无效的日期范围 |
| NO_WORK_LOGS | 404 | 无工作日志 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 权限不足 |

---

## 日志数据清理

### 自动清理策略

当前版本未实施自动清理，建议未来实施：

```sql
-- 保留最近 90 天的工作日志
DELETE FROM work_logs
WHERE created_at < datetime('now', '-90 days');

-- 保留最近 180 天的邮件发送日志
DELETE FROM send_logs
WHERE sent_at < datetime('now', '-180 days');
```

### 手动清理

管理员可以手动清理旧日志：

```bash
# 删除 2025 年的所有工作日志
curl -X POST "https://rualive-email-worker.cubetan57.workers.dev/api/admin/cleanup-logs" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "type": "work-logs"
  }'
```

---

## 日志导出

### 导出为 CSV

```bash
# 导出工作日志为 CSV
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[] | [.workDate, .workHours, .keyframeCount, .compositionCount] | @csv' > work-logs-2026-02.csv
```

### 导出为 JSON

```bash
# 导出工作日志为 JSON
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '.data' > work-logs-2026-02.json
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-08
**作者**: iFlow CLI