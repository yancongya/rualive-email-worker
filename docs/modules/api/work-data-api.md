# 工作数据 API 文档

## 概述

工作数据 API 负责处理 AE 扩展上传的工作数据，包括工作日志、项目数据、运行时间统计等。同时提供心跳检测和 AE 状态管理功能�?
## 基础信息

- **基础路径**: `/api`
- **认证方式**: JWT Token
- **数据格式**: JSON

---

## API 端点

### 1. 上传工作数据

**端点**: `/api/work-data`
**方法**: `POST`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | �?| 用户 ID |
| workDate | string | �?| 工作日期（YYYY-MM-DD 格式�?|
| workData | object | �?| 工作数据对象 |
| workData.work_hours | number | �?| 工作时长（小时） |
| workData.accumulated_work_hours | number | �?| 累积工作时长（小时） |
| workData.keyframe_count | number | �?| 关键帧数�?|
| workData.composition_count | number | �?| 合成数量 |
| workData.layer_count | number | �?| 图层数量 |
| workData.effect_count | number | �?| 效果数量 |
| workData.projects | array | �?| 项目列表 |
| workData.projects[].id | string | �?| 项目 ID |
| workData.projects[].name | string | �?| 项目名称 |
| workData.projects[].path | string | �?| 项目路径 |
| workData.projects[].runtime | number | �?| 运行时长（秒�?|
| workData.projects[].statistics | object | �?| 项目统计 |
| workData.projects[].statistics.compositions | number | �?| 合成数量 |
| workData.projects[].statistics.layers | number | �?| 图层数量 |
| workData.projects[].statistics.keyframes | number | �?| 关键帧数�?|
| workData.projects[].statistics.effects | number | �?| 效果数量 |
| workData.projects[].details | object | �?| 项目详情 |
| workData.projects[].details.layers | object | �?| 图层分类统计 |
| workData.projects[].details.keyframes | object | �?| 关键帧详�?|
| workData.projects[].details.effectCounts | object | �?| 效果使用统计 |
| aeVersion | string | �?| AE 版本 |
| osInfo | string | �?| 操作系统信息 |

#### 请求示例

```json
{
  "userId": "user_123",
  "workDate": "2026-02-07",
  "workData": {
    "work_hours": 0.00056,
    "accumulated_work_hours": 54.68,
    "keyframe_count": 699,
    "composition_count": 38,
    "layer_count": 8,
    "effect_count": 273,
    "projects": [
      {
        "id": "abc123def456",
        "name": "项目A",
        "path": "E:\\工作\\2026\\项目A.aep",
        "runtime": 5400,
        "statistics": {
          "compositions": 20,
          "layers": 5,
          "keyframes": 350,
          "effects": 150
        },
        "details": {
          "layers": {
            "video": 2,
            "image": 2,
            "shapeLayer": 1
          },
          "keyframes": {
            "Layer1": 200,
            "Layer2": 150
          },
          "effectCounts": {
            "Gaussian Blur": 50,
            "Curves": 100
          }
        }
      }
    ]
  },
  "aeVersion": "23.5x52",
  "osInfo": "Windows"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "工作数据上传成功",
  "data": {
    "workLogId": 12345,
    "workDate": "2026-02-07",
    "userId": "user_123",
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "无效的工作日期格�?,
  "code": "INVALID_DATE_FORMAT"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "工作数据格式错误",
  "code": "INVALID_WORK_DATA"
}
```

---

### 2. 心跳检�?
**端点**: `/api/heartbeat`
**方法**: `POST`
**认证**: 不需�?
#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | �?| 状态（"online"�?offline"�?|
| userId | string | �?| 用户 ID |

#### 请求示例

```json
{
  "status": "online",
  "userId": "user_123"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "心跳接收成功",
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

---

### 3. 获取 AE 状�?
**端点**: `/api/ae-status`
**方法**: `GET`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "aeVersion": "23.5x52",
    "osInfo": "Windows",
    "lastUpdate": "2026-02-07T12:00:00.000Z",
    "isOnline": true
  }
}
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "AE 状态不存在",
  "code": "AE_STATUS_NOT_FOUND"
}
```

---

### 4. 更新 AE 状�?
**端点**: `/api/ae-status`
**方法**: `POST`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aeVersion | string | �?| AE 版本 |
| osInfo | string | �?| 操作系统信息 |

#### 请求示例

```json
{
  "aeVersion": "23.5x52",
  "osInfo": "Windows"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "AE 状态更新成�?,
  "data": {
    "userId": "user_123",
    "aeVersion": "23.5x52",
    "osInfo": "Windows",
    "updatedAt": "2026-02-07T12:00:00.000Z"
  }
}
```

---

### 5. 立即发送邮�?
**端点**: `/api/send-now`
**方法**: `POST`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workDate | string | �?| 工作日期（YYYY-MM-DD 格式，默认为今天�?|

#### 请求示例

```json
{
  "workDate": "2026-02-07"
}
```

#### 响应示例

**成功响应** (200):
```json
{
  "success": true,
  "message": "邮件发送成�?,
  "data": {
    "emailId": "msg_abc123def456",
    "toEmail": "user@example.com",
    "subject": "工作日报 - 2026-02-07",
    "sentAt": "2026-02-07T18:00:00.000Z"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "指定日期无工作数�?,
  "code": "NO_WORK_DATA"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "邮件发送失�?,
  "code": "EMAIL_SEND_FAILED"
}
```

---

### 6. 获取发送日�?
**端点**: `/api/logs`
**方法**: `GET`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | �?| 用户 ID |
| limit | number | �?| 返回数量限制（默�?50�?|

#### 请求示例

```http
GET /api/logs?userId=user_123&limit=50 HTTP/1.1
Host: rualive.itycon.cn
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
      "sentAt": "2026-02-07T18:00:00.000Z",
      "status": "success",
      "errorMessage": null
    },
    {
      "id": 2,
      "userId": "user_123",
      "email": "user@example.com",
      "workDate": "2026-02-06",
      "sentAt": "2026-02-06T18:00:00.000Z",
      "status": "success",
      "errorMessage": null
    }
  ]
}
```

---

### 7. 获取工作日志范围

**端点**: `/api/work-logs/range`
**方法**: `GET`
**认证**: 需�?
#### 请求�?
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
    "totalDays": 38
  }
}
```

---

### 8. 获取工作日志

**端点**: `/api/work-logs`
**方法**: `GET`
**认证**: 需�?
#### 请求�?
```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | �?| 开始日期（YYYY-MM-DD 格式�?|
| endDate | string | �?| 结束日期（YYYY-MM-DD 格式�?|

#### 请求示例

```http
GET /api/work-logs?startDate=2026-02-01&endDate=2026-02-07 HTTP/1.1
Host: rualive.itycon.cn
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
      "projects": [
        {
          "id": "abc123def456",
          "name": "项目A",
          "path": "E:\\工作\\2026\\项目A.aep",
          "runtime": 5400,
          "statistics": {
            "compositions": 20,
            "layers": 5,
            "keyframes": 350,
            "effects": 150
          }
        }
      ],
      "compositionsJson": "[...]",
      "effectsJson": "[...]",
      "layersJson": "{...}",
      "keyframesJson": "{...}",
      "projectsJson": "[...]",
      "createdAt": "2026-02-07T12:00:00.000Z"
    }
  ]
}
```

---

## 数据结构说明

### 项目统计对象 (statistics)

```typescript
{
  compositions: number;  // 合成数量
  layers: number;        // 图层数量
  keyframes: number;     // 关键帧数�?  effects: number;       // 效果数量（唯一类型数）
}
```

### 项目详情对象 (details)

```typescript
{
  layers?: {
    video?: number;          // 视频图层
    image?: number;          // 图像图层
    audio?: number;          // 音频图层
    shapeLayer?: number;     // 形状图层
    textLayer?: number;      // 文本图层
    // ... 其他图层类型
  };
  keyframes?: {
    [layerName: string]: number;  // 按图层分组的关键帧数�?  };
  effectCounts?: {
    [effectName: string]: number; // 效果使用次数统计
  };
}
```

### 运行时长

- **单位**: �?- **格式**: 整数
- **示例**: 5400�?.5 小时�?
---

## 使用示例

### 上传工作数据

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST https://rualive.itycon.cn/api/work-data \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "workDate": "2026-02-07",
    "workData": {
      "work_hours": 0.00056,
      "accumulated_work_hours": 54.68,
      "keyframe_count": 699,
      "composition_count": 38,
      "layer_count": 8,
      "effect_count": 273,
      "projects": [
        {
          "id": "abc123def456",
          "name": "项目A",
          "path": "E:\\\\工作\\\\2026\\\\项目A.aep",
          "runtime": 5400,
          "statistics": {
            "compositions": 20,
            "layers": 5,
            "keyframes": 350,
            "effects": 150
          }
        }
      ]
    },
    "aeVersion": "23.5x52",
    "osInfo": "Windows"
  }'
```

### 更新 AE 状�?
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST https://rualive.itycon.cn/api/ae-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aeVersion": "23.5x52",
    "osInfo": "Windows"
  }'
```

### 立即发送邮�?
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 发送今天的工作日报
curl -X POST https://rualive.itycon.cn/api/send-now \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workDate": "2026-02-07"
  }'
```

### 获取历史工作日志

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取本月工作日志
curl -X GET "https://rualive.itycon.cn/api/work-logs?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer $TOKEN"
```

### 心跳检�?
```bash
curl -X POST https://rualive.itycon.cn/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "status": "online",
    "userId": "user_123"
  }'
```

---

## 数据处理流程

### 1. 数据上传流程

```
AE 扩展扫描项目
    �?生成工作数据 JSON
    �?调用 /api/work-data 上传
    �?验证数据格式
    �?保存�?D1 数据�?    �?更新项目累积数据
    �?返回成功响应
```

### 2. 项目累积更新

每次上传工作数据时，系统会自动更新项目累积数据：

1. **检查项目是否存�?*（基�?`project.id`�?2. **如果不存�?*：创建新项目记录
3. **如果存在**：更新累积数�?   - 累加工作时长
   - 更新最后工作日�?   - 增加工作天数计数

### 3. 邮件发送流�?
```
调用 /api/send-now
    �?获取指定日期的工作日�?    �?检查用户配�?    �?生成邮件内容
    �?调用 Resend API 发送邮�?    �?记录发送日�?    �?返回发送结�?```

---

## 数据验证规则

### 日期格式

- 必须使用 `YYYY-MM-DD` 格式
- 示例：`2026-02-07`

### 工作时长

- 单位：小�?- 格式：浮点数
- 示例：`8.5`�?小时30分钟�?
### 运行时长

- 单位：秒
- 格式：整�?- 示例：`5400`�?.5小时�?
### 统计数据

- 所有统计数据必须为非负整数
- `effects` 为唯一效果类型数量

---

## 错误码说�?
| 错误�?| HTTP 状态码 | 说明 |
|--------|-------------|------|
| INVALID_DATE_FORMAT | 400 | 无效的日期格�?|
| INVALID_WORK_DATA | 400 | 工作数据格式错误 |
| NO_WORK_DATA | 400 | 指定日期无工作数�?|
| EMAIL_SEND_FAILED | 500 | 邮件发送失�?|
| AE_STATUS_NOT_FOUND | 404 | AE 状态不存在 |
| UNAUTHORIZED | 401 | 未授�?|

---

## 性能优化建议

### 1. 批量上传

如果需要上传多天的工作数据，建议分批上传：

```bash
# 上传第一天的数据
curl -X POST /api/work-data -d '{"workDate": "2026-02-01", ...}'

# 上传第二天的数据
curl -X POST /api/work-data -d '{"workDate": "2026-02-02", ...}'
```

### 2. 数据缓存

客户端可以缓存工作数据，避免重复上传�?
```javascript
// 检查是否已上传
const isUploaded = await checkWorkLogUploadStatus('2026-02-07');

if (!isUploaded) {
  // 上传新数�?  await uploadWorkData(workData);
}
```

### 3. 增量更新

对于运行时长，使用增量更新而非每次上传完整数据�?
```json
{
  "runtime": 3600  // 新增的运行时长（秒）
}
```

---

**文档版本**: 1.0
**最后更�?*: 2026-02-08
**作�?*: iFlow CLI
