# 项目 API 文档

## 概述

项目 API 提供项目数据的查询和统计功能，包括项目总时长列表、项目历史记录等。支持跨天项目数据累积和统计分析。

## 基础信息

- **基础路径**: `/api/projects`
- **认证方式**: JWT Token
- **数据来源**: D1 数据库（projects 和 project_daily_stats 表）

---

## API 端点

### 1. 获取项目总时长列表

**端点**: `/api/projects/summary`
**方法**: `GET`
**认证**: 需要

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sortBy | string | 否 | 排序字段（"totalWorkHours"、"totalWorkDays"、"firstWorkDate"、"lastWorkDate"） |
| sortOrder | string | 否 | 排序方向（"asc"、"desc"，默认 "desc"） |
| limit | number | 否 | 返回数量限制（默认 100） |

#### 请求示例

```http
GET /api/projects/summary?sortBy=totalWorkHours&sortOrder=desc&limit=10 HTTP/1.1
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
      "projectId": "abc123def456",
      "projectName": "项目A",
      "projectPath": "E:\\工作\\2026\\项目A.aep",
      "firstWorkDate": "2026-01-01",
      "lastWorkDate": "2026-02-07",
      "totalWorkHours": 54.68,
      "totalWorkDays": 15,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-02-07T18:00:00.000Z"
    },
    {
      "id": 2,
      "userId": "user_123",
      "projectId": "xyz789uvw012",
      "projectName": "项目B",
      "projectPath": "E:\\工作\\2026\\项目B.aep",
      "firstWorkDate": "2026-01-15",
      "lastWorkDate": "2026-02-05",
      "totalWorkHours": 32.50,
      "totalWorkDays": 10,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-02-05T18:00:00.000Z"
    }
  ]
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

### 2. 获取项目历史

**端点**: `/api/projects/history`
**方法**: `GET`
**认证**: 需要

#### 功能说明

此 API 用于获取单个项目的历史工作数据，包括每日的工作时长、合成数量、图层数量、关键帧数量、效果数量等。

**数据来源优先级**：
1. **优先查询** `project_daily_stats` 表（项目累积功能实现后的新数据）
2. **后备查询** `work_logs` 表（项目累积功能实现前的旧数据）
3. **自动创建** 如果项目不在 `projects` 表中，会自动从 `work_logs` 表中提取项目信息并创建记录

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 项目 ID |
| startDate | string | 否 | 开始日期（YYYY-MM-DD 格式） |
| endDate | string | 否 | 结束日期（YYYY-MM-DD 格式） |

#### 请求示例

```http
GET /api/projects/history?projectId=abc123def456&startDate=2026-02-01&endDate=2026-02-07 HTTP/1.1
Host: rualive-email-worker.cubetan57.workers.dev
Authorization: Bearer <token>
```

#### 响应示例

**成功响应** (200) - 从 `project_daily_stats` 表获取：
```json
{
  "success": true,
  "projectId": "abc123def456",
  "projectName": "项目A",
  "dailyStats": [
    {
      "work_date": "2026-02-07",
      "work_hours": 8.5,
      "accumulated_runtime": 30600,
      "composition_count": 38,
      "layer_count": 8,
      "keyframe_count": 699,
      "effect_count": 273
    },
    {
      "work_date": "2026-02-06",
      "work_hours": 7.2,
      "accumulated_runtime": 25920,
      "composition_count": 35,
      "layer_count": 10,
      "keyframe_count": 550,
      "effect_count": 200
    }
  ]
}
```

**成功响应** (200) - 从 `work_logs` 表聚合（旧数据兼容）：
```json
{
  "success": true,
  "projectId": "617bc8f",
  "projectName": "10000钻-星河梦骑.aep",
  "dailyStats": [
    {
      "work_date": "2026-02-02",
      "work_hours": 2.5,
      "accumulated_runtime": 9000,
      "composition_count": 46,
      "layer_count": 367,
      "keyframe_count": 698,
      "effect_count": 424
    },
    {
      "work_date": "2026-02-01",
      "work_hours": 1.8,
      "accumulated_runtime": 6480,
      "composition_count": 27,
      "layer_count": 257,
      "keyframe_count": 418,
      "effect_count": 169
    }
  ]
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "缺少projectId参数",
  "code": "MISSING_PROJECT_ID"
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
  "error": "项目不存在",
  "code": "PROJECT_NOT_FOUND"
}
```

#### 数据聚合逻辑

当 `project_daily_stats` 表中没有数据时，系统会从 `work_logs` 表中聚合历史数据：

1. **查询所有工作日志**：获取用户的所有 `work_logs` 记录
2. **过滤项目数据**：在 JavaScript 中解析 `projects_json` 数组，过滤出匹配 `projectId` 的日志
3. **提取项目信息**：从第一个匹配的日志中提取项目名称、路径等信息
4. **创建项目记录**：自动在 `projects` 表中创建项目记录（如果不存在）
5. **聚合统计数据**：
   - `work_hours`: 从 `dailyRuntime` 转换为小时（`dailyRuntime / 3600`）
   - `accumulated_runtime`: 直接使用 `dailyRuntime`（秒）
   - `composition_count`: 从 `statistics.compositions` 获取
   - `layer_count`: 从 `statistics.layers` 获取
   - `keyframe_count`: 从 `statistics.keyframes` 获取
   - `effect_count`: 从 `statistics.effects` 获取

**数据结构说明**：

`work_logs` 表中的 `projects_json` 字段是一个 JSON 数组：
```json
[
  {
    "projectId": "617bc8f",
    "name": "10000钻-星河梦骑.aep",
    "path": "E:\\工作\\2026\\202602\\20260202\\10000钻-星河梦骑.aep",
    "statistics": {
      "compositions": 46,
      "layers": 367,
      "keyframes": 698,
      "effects": 424
    },
    "dailyRuntime": 9000
  },
  {
    "projectId": "another-id",
    ...
  }
]
```

**兼容性说明**：

- ✅ 支持新数据：`project_daily_stats` 表中的项目累积数据
- ✅ 支持旧数据：`work_logs` 表中的历史数据
- ✅ 自动迁移：首次查询旧数据时自动创建 `projects` 表记录
- ✅ 无缝切换：前端代码无需修改，API 自动适配不同数据源

---

## 数据结构说明

### 项目总时长对象 (Project Summary)

```typescript
{
  id: number;              // 数据库记录 ID
  userId: string;          // 用户 ID
  projectId: string;       // 项目 ID（基于文件路径的哈希值）
  projectName: string;     // 项目名称
  projectPath: string;     // 项目路径
  firstWorkDate: string;   // 首次工作日期（YYYY-MM-DD）
  lastWorkDate: string;    // 最后工作日期（YYYY-MM-DD）
  totalWorkHours: number;  // 总工作时长（小时）
  totalWorkDays: number;   // 总工作天数
  createdAt: string;       // 创建时间（ISO 8601）
  updatedAt: string;       // 更新时间（ISO 8601）
}
```

### 项目历史对象 (Project History)

```typescript
{
  project: {
    id: number;
    projectId: string;
    projectName: string;
    projectPath: string;
    totalWorkHours: number;
    totalWorkDays: number;
  };
  dailyStats: Array<{
    id: number;
    projectId: number;
    workDate: string;
    workHours: number;          // 每日工作时长（小时）
    accumulatedRuntime: number; // 每日累积运行时长（秒）
    compositionCount: number;   // 合成数量
    layerCount: number;         // 图层数量
    keyframeCount: number;      // 关键帧数量
    effectCount: number;        // 效果数量
    createdAt: string;
  }>;
}
```

---

## 使用示例

### 获取所有项目总时长

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取所有项目，按总工作时长降序排列
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?sortBy=totalWorkHours&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"

# 获取前 10 个项目
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 获取指定项目的历史记录

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取项目的所有历史记录
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=abc123def456" \
  -H "Authorization: Bearer $TOKEN"

# 获取项目在指定日期范围内的历史记录
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=abc123def456&startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer $TOKEN"
```

### 按工作天数排序

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 按工作天数降序排列
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?sortBy=totalWorkDays&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 项目 ID 生成规则

项目 ID 基于项目文件路径生成，确保同一项目在不同日期上传时使用相同的 ID：

```javascript
// 伪代码示例
function generateProjectId(projectPath) {
  // 1. 转换为小写
  const normalizedPath = projectPath.toLowerCase();

  // 2. 计算哈希值
  const hash = simpleHash(normalizedPath);

  // 3. 转换为十六进制字符串
  return hash.toString(16);
}

// 示例
// 项目路径: "E:\工作\2026\项目A.aep"
// 项目 ID: "abc123def456"
```

**优点**：
- 项目重命名不影响数据连续性
- 项目移动到不同路径会创建新 ID
- 确保唯一性

---

## 数据累积逻辑

### 1. 首次上传

当项目首次上传时，系统会：

1. 创建项目记录（`projects` 表）
2. 记录首次工作日期
3. 初始化总工作时长为 0
4. 初始化工作天数为 0

### 2. 持续更新

每次上传同一项目的工作数据时，系统会：

1. 更新最后工作日期
2. 累加工作时长
3. 增加工作天数（如果当天是新工作日）
4. 更新 `updatedAt` 时间戳

### 3. 工作天数计算

```sql
-- 每个工作日只计数一次
UPDATE projects
SET totalWorkDays = totalWorkDays + 1
WHERE id = ?
  AND NOT EXISTS (
    SELECT 1 FROM project_daily_stats
    WHERE project_id = ?
      AND work_date = ?
  );
```

---

## 查询优化

### 1. 索引使用

数据库表已创建以下索引以提高查询性能：

```sql
-- projects 表索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_project_id ON projects(project_id);

-- project_daily_stats 表索引
CREATE INDEX idx_daily_stats_project_id ON project_daily_stats(project_id);
CREATE INDEX idx_daily_stats_work_date ON project_daily_stats(work_date);
CREATE INDEX idx_daily_stats_project_date ON project_daily_stats(project_id, work_date);
```

### 2. 分页查询

对于大量项目数据，建议使用分页：

```bash
# 第一页（前 20 个项目）
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# 第二页（第 21-40 个项目）
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?limit=20&offset=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 日期范围过滤

获取项目历史时，尽量使用日期范围过滤：

```bash
# 只查询本月数据
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=abc123def456&startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 数据分析示例

### 1. 查找最活跃的项目

```bash
# 按总工作时长排序，找出前 10 个项目
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?sortBy=totalWorkHours&sortOrder=desc&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. 查找长期项目

```bash
# 按工作天数排序，找出长期维护的项目
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?sortBy=totalWorkDays&sortOrder=desc&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 查找最近活跃的项目

```bash
# 按最后工作日期排序
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary?sortBy=lastWorkDate&sortOrder=desc&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 分析项目趋势

```bash
# 获取项目最近 7 天的历史数据
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "7 days ago" +%Y-%m-%d)

curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=abc123def456&startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 错误码说明

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| MISSING_PROJECT_ID | 400 | 项目 ID 不能为空 |
| PROJECT_NOT_FOUND | 404 | 项目不存在 |
| INVALID_DATE_RANGE | 400 | 无效的日期范围 |
| UNAUTHORIZED | 401 | 未授权 |

---

## 未来功能规划

### 1. 项目标签

```json
{
  "projectId": "abc123def456",
  "tags": ["紧急", "重要", "长期"]
}
```

### 2. 项目分组

```json
{
  "groupId": "group_123",
  "groupName": "2026年Q1项目",
  "projects": [...]
}
```

### 3. 项目对比

```bash
# 对比两个项目的工作时长
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/compare?projectIds=abc123def456,xyz789uvw012" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 项目统计图表

```bash
# 获取项目工作时长趋势图数据
curl -X GET "https://rualive-email-worker.cubetan57.workers.dev/api/projects/abc123def456/trend?period=30d" \
  -H "Authorization: Bearer $TOKEN"
```

---

**文档版本**: 1.1
**最后更新**: 2026-02-09
**作者**: iFlow CLI