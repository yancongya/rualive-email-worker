# Worker API 文档

## 概述

RuAlive Email Worker 提供了一套 RESTful API，用于管理工作数据、用户配置和邮件通知。

## 基础信息

- **Base URL**: `https://rualive-email-worker.cubetan57.workers.dev`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

### 获取 Token

所有需要认证的 API 都需要在请求头中包含 Bearer Token：

```http
Authorization: Bearer <your-token>
```

Token 通过登录接口获取，有效期 7 天。

## API 端点

### 1. 健康检查

检查 Worker 是否正常运行。

**端点**: `GET /health`

**请求示例**:
```http
GET /health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T06:18:32.000Z"
}
```

---

### 2. 用户配置

#### 获取配置

获取当前用户的配置信息。

**端点**: `GET /api/config`

**请求头**:
```http
Authorization: Bearer <your-token>
```

**响应示例**:
```json
{
  "success": true,
  "config": {
    "email": "user@example.com",
    "reminderTime": "18:00",
    "minKeyframes": 100,
    "minEffects": 10,
    "minHours": 1.0,
    "enabled": true
  }
}
```

#### 更新配置

更新当前用户的配置信息。

**端点**: `POST /api/config`

**请求头**:
```http
Authorization: Bearer <your-token>
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "user@example.com",
  "reminderTime": "18:00",
  "minKeyframes": 100,
  "minEffects": 10,
  "minHours": 1.0,
  "enabled": true
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "配置已更新"
}
```

---

### 3. 工作数据

#### 上传工作数据

上传 AE 扩展扫描的工作数据。

**端点**: `POST /api/work-data`

**请求头**:
```http
Authorization: Bearer <your-token>
Content-Type: application/json
```

**请求体**:
```json
{
  "work_hours": 2.5,
  "keyframe_count": 100,
  "json_size": 1024,
  "composition_count": 5,
  "layer_count": 20,
  "effect_count": 15,
  "projects": [
    {
      "name": "项目名称",
      "path": "项目路径",
      "statistics": {
        "compositions": 5,
        "layers": 20,
        "keyframes": 100,
        "effects": 15
      },
      "details": {
        "compositions": ["合成1", "合成2"],
        "layers": ["图层1", "图层2"],
        "keyframes": {"图层1": 50, "图层2": 50},
        "effects": ["效果1", "效果2"]
      },
      "accumulatedRuntime": 9000
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "数据已保存"
}
```

#### 立即发送邮件

立即发送日报邮件，不等待定时触发。

**端点**: `POST /api/send-now`

**请求头**:
```http
Authorization: Bearer <your-token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "邮件已发送"
}
```

---

### 4. 工作日志

#### 获取工作日志

获取工作历史记录。

**端点**: `GET /api/logs`

**请求头**:
```http
Authorization: Bearer <your-token>
```

**查询参数**:
- `date` (可选): 指定日期，格式 `YYYY-MM-DD`
- `limit` (可选): 返回数量，默认 30
- `offset` (可选): 偏移量，默认 0

**请求示例**:
```http
GET /api/logs?date=2026-01-23&limit=30&offset=0
```

**响应示例**:
```json
{
  "success": true,
  "logs": [
    {
      "id": 348,
      "work_date": "2026-01-23",
      "work_hours": 2.5,
      "keyframe_count": 100,
      "composition_count": 5,
      "layer_count": 20,
      "effect_count": 15,
      "project_count": 1,
      "created_at": "2026-01-23T06:18:32.000Z"
    }
  ],
  "total": 1
}
```

---

### 5. 认证

#### 用户登录

使用用户名和密码登录，获取访问 Token。

**端点**: `POST /api/auth/login`

**请求体**:
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**响应示例**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "your-username",
    "email": "user@example.com"
  }
}
```

#### 用户登出

登出当前用户，使 Token 失效。

**端点**: `POST /api/auth/logout`

**请求头**:
```http
Authorization: Bearer <your-token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "已登出"
}
```

#### 获取当前用户

获取当前登录用户的信息。

**端点**: `GET /api/auth/user`

**请求头**:
```http
Authorization: Bearer <your-token>
```

**响应示例**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "your-username",
    "email": "user@example.com",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 6. 管理员

#### 管理员仪表板

获取管理员仪表板数据（需要管理员权限）。

**端点**: `GET /api/admin/dashboard`

**请求头**:
```http
Authorization: Bearer <admin-token>
```

**响应示例**:
```json
{
  "success": true,
  "dashboard": {
    "totalUsers": 10,
    "totalWorkLogs": 100,
    "totalWorkHours": 250.5,
    "recentActivity": [...]
  }
}
```

#### 发送测试邮件

发送测试邮件到指定地址（需要管理员权限）。

**端点**: `POST /api/admin/test-email`

**请求头**:
```http
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "test@example.com"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "测试邮件已发送"
}
```

---

## 错误响应

所有 API 在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### 常见错误代码

- `400` - 请求参数错误
- `401` - 未授权（Token 无效或过期）
- `403` - 禁止访问（权限不足）
- `404` - 资源不存在
- `500` - 服务器内部错误

### 错误示例

```json
{
  "success": false,
  "error": "Token 已过期，请重新登录"
}
```

---

## 数据结构详解

### workData 对象

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| work_hours | number | 工作时长（小时） | 是 |
| keyframe_count | number | 关键帧数量 | 是 |
| json_size | number | JSON 文件大小（字节） | 是 |
| composition_count | number | 合成数量 | 是 |
| layer_count | number | 图层数量 | 是 |
| effect_count | number | 效果数量 | 是 |
| projects | array | 项目列表 | 是 |

### project 对象

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| name | string | 项目名称 | 是 |
| path | string | 项目路径 | 否 |
| statistics | object | 统计数据 | 是 |
| details | object | 详细数据 | 是 |
| accumulatedRuntime | number | 累计运行时间（秒） | 否 |

### statistics 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| compositions | number | 合成数量 |
| layers | number | 图层数量 |
| keyframes | number | 关键帧数量 |
| effects | number | 效果数量 |

### details 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| compositions | array | 合成名称数组 |
| layers | array | 图层类型数组 |
| keyframes | object | 关键帧对象（图层名: 数量） |
| effects | array | 效果名称数组 |

---

## 限制与配额

- **请求频率限制**: 每分钟最多 60 次请求
- **文件大小限制**: 单次请求最大 10MB
- **并发限制**: 最多 10 个并发连接

---

## 最佳实践

1. **Token 管理**
   - 妥善保管 Token，不要泄露
   - Token 过期后重新登录获取
   - 使用 HTTPS 保证传输安全

2. **错误处理**
   - 检查 `success` 字段判断请求是否成功
   - 处理错误响应，给用户友好提示
   - 实现重试机制处理临时错误

3. **性能优化**
   - 合理使用分页参数
   - 避免频繁请求相同数据
   - 使用缓存减少网络请求

---

## 更新日志

### v1.0.0 (2026-01-23)
- 初始版本
- 支持基础 CRUD 操作
- 支持邮件通知功能
- 支持管理员功能

---

## 联系支持

如有 API 相关问题，请提交 Issue 或联系技术支持。