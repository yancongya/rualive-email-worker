# 数据流分析

## 文档信息
- **最后更新**: 2026-02-07

---

## 1. 用户注册数据流

### 1.1 流程图
```
用户提交注册表单
  ↓
POST /api/auth/register
  ↓
handleRegister()
  ↓
验证邀请码（如果启用）
  ├─ 失败 → 返回 400 错误
  └─ 成功 → 继续
  ↓
检查邮箱是否已存在
  ├─ 存在 → 返回 409 错误
  └─ 不存在 → 继续
  ↓
生成用户ID
  ↓
哈希密码 (SHA-256)
  ↓
插入 users 表
  ├─ 失败 → 返回 500 错误
  └─ 成功 → 继续
  ↓
返回用户信息
```

### 1.2 数据变化
```sql
-- 插入用户记录
INSERT INTO users (id, email, username, password_hash, role, created_at)
VALUES ('user_1234567890_abc123', 'user@example.com', 'testuser', 'a8f5...', 'user', '2026-02-07T14:30:00.000Z');

-- 使用邀请码（如果提供）
UPDATE invite_codes SET used_count = used_count + 1 WHERE code = 'ABCD-1234';
```

---

## 2. 用户登录数据流

### 2.1 流程图
```
用户提交登录表单
  ↓
POST /api/auth/login
  ↓
handleLogin()
  ↓
查询用户数据
  ├─ 不存在 → 返回 401 错误
  └─ 存在 → 继续
  ↓
验证密码
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
生成 JWT Token (30天有效期)
  ↓
创建会话记录
  ↓
更新用户最后登录时间
  ↓
返回 Token 和用户信息
```

### 2.2 数据变化
```sql
-- 查询用户
SELECT * FROM users WHERE email = 'user@example.com';

-- 更新最后登录时间
UPDATE users SET last_login = '2026-02-07T14:30:00.000Z' WHERE id = 'user_1234567890_abc123';

-- 创建会话
INSERT INTO sessions (user_id, token, expires_at, created_at)
VALUES ('user_1234567890_abc123', 'eyJhbG...', '2026-03-09T14:30:00.000Z', '2026-02-07T14:30:00.000Z');
```

---

## 3. 工作数据上传数据流

### 3.1 流程图
```
AE 扩展上传工作数据
  ↓
POST /api/work-data
  ↓
验证 JWT Token
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
解析 JSON 数据
  ├─ 失败 → 返回 400 错误
  └─ 成功 → 继续
  ↓
检查今日是否已有记录
  ├─ 存在 → 更新记录
  └─ 不存在 → 创建新记录
  ↓
更新/创建 work_data 记录
  ↓
更新项目数据（如果存在）
  ↓
更新 AE 状态
  ↓
返回成功
```

### 3.2 数据变化
```sql
-- 查询今日记录
SELECT * FROM work_data WHERE user_id = ? AND date = '2026-02-07';

-- 创建新记录
INSERT INTO work_data (user_id, project_name, date, compositions, layers, keyframes, effects, runtime_seconds)
VALUES ('user_1234567890_abc123', '项目A', '2026-02-07', 38, 8, 699, 273, 200);

-- 更新记录
UPDATE work_data SET 
  compositions = 38,
  layers = 8,
  keyframes = 699,
  effects = 273,
  runtime_seconds = 200
WHERE user_id = 'user_1234567890_abc123' AND date = '2026-02-07';

-- 更新 AE 状态（假设有 ae_status 表）
UPDATE ae_status SET 
  version = '23.5x52',
  operating_system = 'Windows'
WHERE user_id = 'user_1234567890_abc123';
```

---

## 4. 邮件发送数据流

### 4.1 流程图
```
Cron 触发器（每小时）
  ↓
handleCronTrigger()
  ↓
查询启用的用户配置
  ↓
遍历每个配置
  ↓
检查是否到达发送时间
  ├─ 未到达 → 跳过
  └─ 已到达 → 继续
  ↓
查询今日工作数据
  ├─ 无数据 → 记录日志，跳过
  └─ 有数据 → 继续
  ↓
检查今日是否已发送
  ├─ 已发送 → 跳过
  └─ 未发送 → 继续
  ↓
获取用户信息
  ↓
生成邮件模板
  ↓
调用 Resend API 发送邮件
  ├─ 失败 → 记录错误日志
  └─ 成功 → 继续
  ↓
记录发送日志
  ↓
继续下一个用户
```

### 4.2 数据变化
```sql
-- 查询用户配置
SELECT * FROM user_configs WHERE enabled = 1;

-- 查询今日工作数据
SELECT * FROM work_data WHERE user_id = ? AND date = '2026-02-07';

-- 查询今日发送记录
SELECT * FROM email_logs 
WHERE user_id = ? AND created_at LIKE '2026-02-07%';

-- 获取用户信息
SELECT * FROM users WHERE id = ?;

-- 记录发送成功
INSERT INTO email_logs (user_id, email_address, subject, status, sent_at, created_at)
VALUES ('user_1234567890_abc123', 'user@example.com', 'RuAlive 工作日报 - 2026-02-07', 'sent', '2026-02-07T22:00:00.000Z', '2026-02-07T22:00:00.000Z');

-- 记录发送失败
INSERT INTO email_logs (user_id, email_address, subject, status, error_message, created_at)
VALUES ('user_1234567890_abc123', 'user@example.com', 'RuAlive 工作日报 - 2026-02-07', 'failed', 'API rate limit exceeded', '2026-02-07T22:00:00.000Z');
```

---

## 5. 用户配置更新数据流

### 5.1 流程图
```
用户更新配置
  ↓
POST /api/config
  ↓
验证 JWT Token
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
解析配置数据
  ├─ 失败 → 返回 400 错误
  └─ 成功 → 继续
  ↓
检查用户权限
  ├─ 无权限 → 返回 403 错误
  └─ 有权限 → 继续
  ↓
检查配置是否已存在
  ├─ 存在 → 更新配置
  └─ 不存在 → 创建配置
  ↓
更新 user_configs 表
  ↓
返回成功
```

### 5.2 数据变化
```sql
-- 检查配置是否存在
SELECT * FROM user_configs WHERE user_id = 'user_1234567890_abc123';

-- 创建配置
INSERT INTO user_configs (user_id, send_time, timezone, min_work_hours, min_keyframes, created_at, updated_at)
VALUES ('user_1234567890_abc123', '22:00', 'Asia/Shanghai', 2, 50, '2026-02-07T14:30:00.000Z', '2026-02-07T14:30:00.000Z');

-- 更新配置
UPDATE user_configs SET 
  send_time = '22:00',
  timezone = 'Asia/Shanghai',
  min_work_hours = 2,
  min_keyframes = 50,
  updated_at = '2026-02-07T14:30:00.000Z'
WHERE user_id = 'user_1234567890_abc123';
```

---

## 6. 密码重置数据流

### 6.1 流程图
```
管理员重置用户密码
  ↓
POST /api/admin/users/:id/reset-password
  ↓
验证管理员 Token
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
检查管理员权限
  ├─ 非管理员 → 返回 403 错误
  └─ 管理员 → 继续
  ↓
生成新密码或使用自定义密码
  ├─ 自动生成 → 生成 12 字符随机密码
  └─ 自定义 → 使用管理员提供的密码
  ↓
哈希新密码
  ↓
更新用户密码
  ↓
发送密码重置邮件
  ├─ 失败 → 记录错误
  └─ 成功 → 记录发送日志
  ↓
返回成功
```

### 6.2 数据变化
```sql
-- 更新用户密码
UPDATE users SET 
  password_hash = 'new_hash_value'
WHERE id = 'user_1234567890_abc123';

-- 记录邮件发送
INSERT INTO email_logs (user_id, email_address, subject, status, sent_at, created_at)
VALUES ('user_1234567890_abc123', 'user@example.com', 'RuAlive 密码重置通知', 'sent', '2026-02-07T14:30:00.000Z', '2026-02-07T14:30:00.000Z');
```

---

## 7. 邀请码创建数据流

### 7.1 流程图
```
管理员创建邀请码
  ↓
POST /api/auth/invite-codes
  ↓
验证管理员 Token
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
检查管理员权限
  ├─ 非管理员 → 返回 403 错误
  └─ 管理员 → 继续
  ↓
生成邀请码
  ↓
插入 invite_codes 表
  ↓
返回邀请码
```

### 7.2 数据变化
```sql
-- 插入邀请码
INSERT INTO invite_codes (id, code, created_by, max_uses, used_count, is_active, created_at)
VALUES ('invite_1234567890_abc123', 'ABCD-1234', 'admin_1234567890_xyz789', 10, 0, 1, '2026-02-07T14:30:00.000Z');
```

---

## 8. 项目数据查询数据流

### 8.1 流程图
```
用户查询项目汇总
  ↓
GET /api/projects/summary
  ↓
验证 JWT Token
  ├─ 失败 → 返回 401 错误
  └─ 成功 → 继续
  ↓
查询用户工作数据
  ↓
按项目分组统计
  ↓
计算总工作时长和工作天数
  ↓
返回项目汇总数据
```

### 8.2 数据变化
```sql
-- 查询用户工作数据
SELECT project_name, date, runtime_seconds 
FROM work_data 
WHERE user_id = 'user_1234567890_abc123'
ORDER BY date ASC;

-- 分组统计（应用层）
-- SELECT project_name, 
--        COUNT(DISTINCT date) as work_days,
--        SUM(runtime_seconds) as total_runtime
-- FROM work_data
-- WHERE user_id = 'user_1234567890_abc123'
-- GROUP BY project_name;
```

---

## 9. 数据清理数据流

### 9.1 流程图
```
定时任务（每日）
  ↓
清理过期会话
  ↓
查询所有过期会话
  ↓
删除过期会话
  ↓
清理旧日志
  ↓
查询90天前的日志
  ↓
删除旧日志
  ↓
记录清理统计
```

### 9.2 数据变化
```sql
-- 清理过期会话
DELETE FROM sessions WHERE expires_at < '2026-02-07T14:30:00.000Z';

-- 清理旧邮件日志
DELETE FROM email_logs WHERE created_at < '2025-11-09T14:30:00.000Z';

-- 清理旧测试邮件日志
DELETE FROM test_email_logs WHERE created_at < '2025-11-09T14:30:00.000Z';
```

---

## 10. 数据关系图

```
users (用户表)
  ├─→ sessions (会话表) [1:N]
  ├─→ invite_codes (邀请码表) [1:N, created_by]
  ├─→ user_configs (用户配置表) [1:1]
  ├─→ work_data (工作数据表) [1:N]
  ├─→ email_logs (邮件日志表) [1:N]
  ├─→ api_keys (API 密钥表) [1:N]
  └─→ test_email_logs (测试邮件日志表) [1:N]
```

---

## 11. 关键数据指标

### 11.1 用户指标
```sql
-- 总用户数
SELECT COUNT(*) FROM users;

-- 活跃用户数（最近30天有工作数据）
SELECT COUNT(DISTINCT user_id) FROM work_data WHERE date >= date('now', '-30 days');

-- 今日登录用户数
SELECT COUNT(*) FROM users WHERE last_login >= date('now');
```

### 11.2 工作数据指标
```sql
-- 今日工作数据
SELECT 
  COUNT(*) as count,
  SUM(compositions) as total_compositions,
  SUM(layers) as total_layers,
  SUM(keyframes) as total_keyframes,
  SUM(runtime_seconds) as total_runtime
FROM work_data WHERE date = date('now');

-- 本周工作数据
SELECT 
  COUNT(*) as count,
  SUM(runtime_seconds) as total_runtime
FROM work_data WHERE date >= date('now', '-7 days');
```

### 11.3 邮件发送指标
```sql
-- 今日发送邮件数
SELECT COUNT(*) FROM email_logs WHERE created_at >= date('now') AND status = 'sent';

-- 本周邮件发送统计
SELECT status, COUNT(*) as count 
FROM email_logs 
WHERE created_at >= date('now', '-7 days')
GROUP BY status;

-- 邮件发送成功率
SELECT 
  (SELECT COUNT(*) FROM email_logs WHERE created_at >= date('now') AND status = 'sent') * 100.0 / COUNT(*) as success_rate
FROM email_logs 
WHERE created_at >= date('now');
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成