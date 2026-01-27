# API 文档 - User V6 数据对接

## 概述

本文档描述 User V6 与后端 API 的交互，包括数据格式、端点定义和使用示例。

## 认证

所有 API 请求都需要在请求头中包含 JWT token：

```javascript
const token = localStorage.getItem('rualive_token');
const headers = {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
};
```

## API 端点

### 1. 获取工作日志

**端点：** `GET /api/work-logs`

**参数：**
- `date` (可选): 特定日期，格式 `YYYY-MM-DD`
  - 如果不提供，返回所有工作日志（摘要信息）
  - 如果提供，返回该日期的完整工作日志（包含详细数据）

**响应示例：**

**不带日期参数（摘要信息）：**
```json
{
  "success": true,
  "data": [
    {
      "id": 5133,
      "user_id": "user_1768671860467_uzdw8qz8m",
      "work_date": "2026-01-27",
      "work_hours": 185.46,
      "keyframe_count": 0,
      "json_size": 0,
      "project_count": 2,
      "composition_count": 56,
      "layer_count": 77,
      "effect_count": 2565
    }
  ]
}
```

**带日期参数（完整数据）：**
```json
{
  "success": true,
  "data": [
    {
      "id": 5133,
      "user_id": "user_1768671860467_uzdw8qz8m",
      "work_date": "2026-01-27",
      "work_hours": 185.46,
      "keyframe_count": 0,
      "json_size": 0,
      "project_count": 2,
      "composition_count": 56,
      "layer_count": 77,
      "effect_count": 2565,
      "compositions_json": "[{\"project\":\"1w钻-星月幻想.aep\",\"count\":29},{\"project\":\"10000钻-奇幻梦旅.aep\",\"count\":27}]",
      "effects_json": "[{\"project\":\"1w钻-星月幻想.aep\",\"name\":\"Gaussian Blur\"},{\"project\":\"10000钻-奇幻梦旅.aep\",\"name\":\"Motion Blur\"}]",
      "layers_json": "[{\"project\":\"1w钻-星月幻想.aep\",\"name\":\"video\",\"count\":44},{\"project\":\"10000钻-奇幻梦旅.aep\",\"name\":\"image\",\"count\":16}]",
      "keyframes_json": "[]",
      "projects_json": "[{\"name\":\"1w%E9%92%BB-%E6%98%9F%E6%9C%88%E5%B9%BB%E6%83%B3.aep\",\"path\":\"E:\\\\工作\\\\2026\\\\202601\\\\20260126 1w钻-星月幻想\\\\1w钻-星月幻想.aep\",\"compositions\":29,\"layers\":11,\"keyframes\":0,\"effects\":368},{\"name\":\"10000%E9%92%BB-%E5%A5%87%E5%B9%BB%E6%A2%A6%E6%97%85.aep\",\"path\":\"E:\\\\工作\\\\2026\\\\202601\\\\20260127 10000钻-奇幻梦旅\\\\10000钻-奇幻梦旅.aep\",\"compositions\":27,\"layers\":66,\"keyframes\":0,\"effects\":2197}]",
      "work_hours_json": "[{\"project\":\"1w钻-星月幻想.aep\",\"hours\":\"30.70\"},{\"project\":\"10000钻-奇幻梦旅.aep\",\"hours\":\"154.76\"}]"
    }
  ]
}
```

---

### 2. 获取日期范围的工作日志

**端点：** `GET /api/work-logs/range`

**参数：**
- `start_date` (必需): 开始日期，格式 `YYYY-MM-DD`
- `end_date` (必需): 结束日期，格式 `YYYY-MM-DD`

**请求示例：**
```
GET /api/work-logs/range?start_date=2026-01-20&end_date=2026-01-27
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 4621,
      "work_date": "2026-01-23",
      "work_hours": 45.2,
      "keyframe_count": 150,
      "project_count": 1,
      "composition_count": 15,
      "layer_count": 50,
      "effect_count": 200
    },
    {
      "id": 4731,
      "work_date": "2026-01-26",
      "work_hours": 21.27,
      "keyframe_count": 0,
      "project_count": 1,
      "composition_count": 17,
      "layer_count": 7,
      "effect_count": 206
    }
  ]
}
```

---

### 3. 上传工作数据

**端点：** `POST /api/work-data`

**请求体：**
```json
{
  "userId": "user_1768671860467_uzdw8qz8m",
  "workData": {
    "work_hours": 30.70611111111111,
    "keyframe_count": 0,
    "json_size": 0,
    "composition_count": 27,
    "layer_count": 11,
    "effect_count": 357,
    "projects": [
      {
        "name": "1w钻-星月幻想.aep",
        "path": "E:\\工作\\2026\\202601\\20260126 1w钻-星月幻想\\1w钻-星月幻想.aep",
        "statistics": {
          "compositions": 27,
          "layers": 11,
          "keyframes": 0,
          "effects": 357
        },
        "details": {
          "compositions": [
            {
              "project": "1w钻-星月幻想.aep",
              "count": 27
            }
          ],
          "layers": [
            {
              "project": "1w钻-星月幻想.aep",
              "name": "video",
              "count": 44
            },
            {
              "project": "1w钻-星月幻想.aep",
              "name": "image",
              "count": 16
            }
          ],
          "keyframes": [],
          "effects": [
            {
              "project": "1w钻-星月幻想.aep",
              "name": "Gaussian Blur"
            },
            {
              "project": "1w钻-星月幻想.aep",
              "name": "Motion Blur"
            }
          ]
        },
        "accumulatedRuntime": 110542
      }
    ]
  },
  "workDate": "2026-01-27"
}
```

**响应示例：**
```json
{
  "success": true
}
```

**重要说明：**
- 如果同一天已存在数据，新项目会被合并到现有数据中
- 合并逻辑基于项目名称去重
- 所有统计数据会被重新计算

---

### 4. 获取用户配置

**端点：** `GET /api/config`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "email_address": "user@example.com",
    "daily_report_time": "18:00",
    "enable_daily_report": true,
    "enable_emergency_contact": true,
    "emergency_contact_email": "emergency@example.com",
    "min_work_hours": 2,
    "min_keyframes": 50,
    "min_json_size": 10,
    "user_notification_time": "22:00",
    "emergency_notification_time": "22:00"
  }
}
```

---

### 5. 保存用户配置

**端点：** `POST /api/config`

**请求体：**
```json
{
  "enabled": true,
  "email_address": "user@example.com",
  "daily_report_time": "18:00",
  "enable_emergency_contact": true,
  "emergency_contact_email": "emergency@example.com",
  "min_work_hours": 2,
  "min_keyframes": 50
}
```

**响应示例：**
```json
{
  "success": true
}
```

---

## 数据格式详解

### WorkLog（工作日志）

```typescript
interface WorkLog {
  id: number;
  user_id: string;
  work_date: string;           // YYYY-MM-DD
  work_hours: number;          // 总工时（小时）
  keyframe_count: number;      // 总关键帧数
  json_size: number;           // JSON 文件大小
  project_count: number;       // 项目数量
  composition_count: number;   // 总合成数
  layer_count: number;         // 总图层数
  effect_count: number;        // 总特效数
  
  // JSON 字段（URL 编码）
  compositions_json: string;   // 合成列表
  effects_json: string;        // 特效列表
  layers_json: string;         // 图层列表
  keyframes_json: string;      // 关键帧列表
  projects_json: string;       // 项目列表
  work_hours_json: string;     // 工作时长列表
  
  created_at: string;
}
```

### ProjectInfo（项目信息）

```typescript
interface ProjectInfo {
  name: string;                    // 项目名称（URL 编码）
  path: string;                    // 项目路径
  compositions: number;            // 合成数量
  layers: number;                  // 图层数量
  keyframes: number;               // 关键帧数量
  effects: number;                 // 特效数量
}
```

### CompositionItem（合成项）

```typescript
interface CompositionItem {
  project: string;
  count: number;
}
```

### LayerItem（图层项）

```typescript
interface LayerItem {
  project: string;
  name: string;        // 图层类型（video, image, sequence, designFile, sourceFile, nullSolidLayer, shapeLayer, textLayer, adjustmentLayer, lightLayer, cameraLayer, other）
  count: number;
}
```

### KeyframeItem（关键帧项）

```typescript
interface KeyframeItem {
  project: string;
  layer: string;
  count: number;
}
```

### EffectItem（特效项）

```typescript
interface EffectItem {
  project: string;
  name: string;        // 特效名称
}
```

---

## 前端类型定义

### ProjectData（项目数据）

```typescript
interface ProjectData {
  projectId: string;
  name: string;
  dailyRuntime: string;          // 格式: "Xh Ym"
  accumulatedRuntime: number;     // 秒
  statistics: {
    compositions: number;
    layers: number;
    keyframes: number;
    effects: number;
  };
  details: {
    compositions: string[];
    layers: LayerDistribution;
    keyframes: Record<string, number>;
    effectCounts: Record<string, number>;
  };
}
```

### LayerDistribution（图层分布）

```typescript
interface LayerDistribution {
  video: number;
  image: number;
  sequence: number;
  designFile: number;
  sourceFile: number;
  nullSolidLayer: number;
  shapeLayer: number;
  textLayer: number;
  adjustmentLayer: number;
  lightLayer: number;
  cameraLayer: number;
  other: number;
}
```

### DailyData（每日数据）

```typescript
interface DailyData {
  date: string;
  projects: ProjectData[];
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "error": "错误信息"
}
```

### 常见错误

| HTTP 状态码 | 错误信息 | 原因 |
|------------|---------|------|
| 401 | 未授权 | Token 无效或过期 |
| 400 | Missing userId or workData | 请求体缺少必需参数 |
| 500 | Internal server error | 服务器内部错误 |

---

## 使用示例

### JavaScript

```javascript
// 获取特定日期的工作日志
const token = localStorage.getItem('rualive_token');
const response = await fetch('/api/work-logs?date=2026-01-27', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
if (result.success && result.data.length > 0) {
  const workLog = result.data[0];
  console.log('项目数量:', workLog.project_count);
  console.log('总工时:', workLog.work_hours);
}
```

### TypeScript

```typescript
import { getWorkLogs } from './src/api';

// 获取今天的工作日志
const today = new Date();
const dateStr = today.toISOString().split('T')[0];

const response = await getWorkLogs(dateStr, false);

if (response.success && response.data.length > 0) {
  const workLog = response.data[0];
  const transformedData = workLogToDailyData(workLog);
  console.log('项目列表:', transformedData.projects);
}
```

---

## 注意事项

### 1. URL 编码
- 项目名称和路径在数据库中以 URL 编码格式存储
- 前端需要使用 `decodeURIComponent()` 解码

### 2. 项目合并
- 同一天的数据会自动合并
- 合并基于项目名称去重
- 所有统计数据会重新计算

### 3. 数据缓存
- API 响应会被缓存 5 分钟
- 使用 `useCache = false` 参数可以跳过缓存

### 4. 日期格式
- 所有日期使用 `YYYY-MM-DD` 格式
- 时区为用户本地时区

---

## 相关文档

- [User V6 数据库对接修复](../debug/24_user_v6_database_integration_fixes.md)
- [数据库集成计划](../23_user_v6_database_integration_plan.md)
- [AE 扩展开发指南](../../docs/api/overview.md)

---

**文档版本：** 1.0  
**创建日期：** 2026-01-27  
**作者：** iFlow CLI  
**项目：** RuAlive@烟囱鸭