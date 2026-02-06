# 功能模块总览

## 模块概述

功能模块负责说明 RuAlive Email Worker 的核心业务功能和特性实现。

## 功能列表

### 1. 邮件通知
**文档**: [email-notification.md](email-notification.md)

**功能描述**:
- 每日工作总结邮件
- 紧急联系人通知
- 密码重置邮件
- 测试邮件发送

**邮件类型**:
- **每日总结**: 每天定时发送工作数据汇总
- **紧急通知**: 工作时长未达标时发送
- **系统通知**: 系统相关通知

**触发条件**:
- Cron 定时任务（每小时检查）
- 手动发送（`/api/send-now`）
- 工作时长阈值检查

**邮件内容**:
- 项目统计数据
- 关键帧数量
- 工作时长统计
- AE 版本信息

### 2. 项目累积
**文档**: [project-accumulation.md](project-accumulation.md)

**功能描述**:
- 跨天项目数据累积
- 项目总时长计算
- 项目工作日统计
- 项目历史记录

**核心逻辑**:
- 基于 `project_id` 跟踪项目
- 累加每日运行时间
- 计算工作日数量
- 维护项目历史

**数据结构**:
```sql
-- 项目主表
projects (
  project_id UNIQUE,
  total_work_hours,
  total_work_days
)

-- 项目每日统计
project_daily_stats (
  project_id,
  work_date,
  work_hours,
  composition_count,
  layer_count,
  keyframe_count,
  effect_count
)
```

**计算规则**:
- `total_work_hours` = SUM(`project_daily_stats.work_hours`)
- `total_work_days` = COUNT(DISTINCT `project_daily_stats.work_date`)

### 3. 用户管理
**文档**: [user-management.md](user-management.md)

**功能描述**:
- 用户注册和登录
- 邀请码管理
- 用户权限管理
- 密码管理

**用户角色**:
- **admin**: 管理员，拥有所有权限
- **user**: 普通用户，仅限个人数据访问

**管理功能**:
- 查看用户列表
- 删除用户
- 重置用户密码
- 设置邮件限制
- 查看用户统计

**邀请码系统**:
- 管理员创建邀请码
- 用户使用邀请码注册
- 邀请码使用次数限制
- 邀请码过期时间

### 4. 工作数据上传
**文档**: [work-data-upload.md](work-data-upload.md)

**功能描述**:
- 接收 AE 扩展上传的工作数据
- 数据验证和转换
- 数据存储到 D1 数据库
- 系统信息记录

**数据格式**:
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
    "projects": [...]
  },
  "systemInfo": {
    "ae": {"version": "23.5x52"},
    "system": {"os": "Windows"}
  }
}
```

**数据处理流程**:
1. 验证用户 Token
2. 解析 JSON 数据
3. 提取项目信息
4. 保存到 `work_logs` 表
5. 更新 `projects` 表
6. 更新 `project_daily_stats` 表
7. 保存系统信息到 `ae_status` 表

### 5. 系统信息收集
**文档**: [system-info-collection.md](system-info-collection.md)

**功能描述**:
- 收集 AE 版本信息
- 收集操作系统信息
- 记录项目 ID
- 显示在用户界面

**收集内容**:
```javascript
{
  "ae": {
    "version": "23.5x52"
  },
  "system": {
    "os": "Windows"
  },
  "project_id": "abc123"
}
```

**显示位置**:
- 用户仪表板顶部导航栏
- 徽章形式显示
- 实时更新

### 6. 数据统计和分析
**文档**: [data-analytics.md](data-analytics.md)

**功能描述**:
- 每日工作时长统计
- 项目累积数据统计
- 关键帧数量分析
- 效果使用分析

**统计维度**:
- 时间维度：按日、周、月统计
- 项目维度：按项目统计
- 用户维度：按用户统计

**图表展示**:
- 工作时长趋势图
- 效果使用饼图
- 项目统计柱状图

---

## 功能依赖关系

```
邮件通知功能
  ├─ 依赖: 工作数据上传
  ├─ 依赖: 用户配置
  ├─ 依赖: Cron 定时任务
  └─ 依赖: Resend API

项目累积功能
  ├─ 依赖: 工作数据上传
  ├─ 依赖: 数据库 (projects, project_daily_stats)
  └─ 依赖: 项目 ID 生成

用户管理功能
  ├─ 依赖: 认证模块
  ├─ 依赖: 数据库 (users, sessions, invite_codes)
  └─ 依赖: JWT Token

工作数据上传功能
  ├─ 依赖: 认证模块
  ├─ 依赖: 数据库 (work_logs, projects, project_daily_stats)
  └─ 依赖: AE 扩展集成

系统信息收集功能
  ├─ 依赖: 工作数据上传
  ├─ 依赖: 数据库 (ae_status)
  └─ 依赖: AE 扩展集成

数据统计和分析功能
  ├─ 依赖: 工作数据上传
  ├─ 依赖: 数据库 (work_logs, projects, project_daily_stats)
  └─ 依赖: 前端图表组件
```

---

## 功能配置

### 邮件通知配置
```javascript
{
  "daily_report_time": "18:00",
  "enable_daily_report": true,
  "enable_emergency_contact": false,
  "emergency_contact_email": "admin@example.com",
  "min_work_hours": 2,
  "min_keyframes": 50
}
```

### 项目累积配置
```javascript
{
  "enable_accumulation": true,
  "accumulation_mode": "daily",
  "work_hour_threshold": 0.001 // 最小工作时长（小时）
}
```

### 用户管理配置
```javascript
{
  "enable_registration": false,  // 是否开放注册
  "require_invite_code": true,   // 是否需要邀请码
  "default_role": "user",        // 默认角色
  "password_min_length": 6       // 密码最小长度
}
```

---

## 功能测试

### 邮件通知测试
```bash
# 发送测试邮件
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/admin/test-email \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "测试邮件",
    "content": "这是一封测试邮件"
  }'
```

### 工作数据上传测试
```bash
# 上传测试数据
curl -X POST https://rualive-email-worker.cubetan57.workers.dev/api/work-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "workDate": "2026-02-07",
    "workData": {...}
  }'
```

### 项目累积测试
```bash
# 查询项目汇总
curl -X GET https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary \
  -H "Authorization: Bearer <token>"
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI