# 数据库结构

## 文档信息
- **数据库类型**: Cloudflare D1 (SQLite)
- **最后更新**: 2026-02-07

---

## 1. 数据库概述

### 1.1 技术栈
- **数据库**: Cloudflare D1
- **引擎**: SQLite
- **部署**: 全球分布式
- **绑定**: `env.DB` 或 `env.rualive`

### 1.2 数据库 ID
```
database_id = "59a95578-9781-4592-a711-d961765766c5"
```

### 1.3 表结构概览
| 表名 | 说明 | 记录数预估 |
|------|------|----------|
| `users` | 用户信息 | 100+ |
| `sessions` | 用户会话 | 500+ |
| `invite_codes` | 邀请码 | 50+ |
| `user_configs` | 用户配置 | 100+ |
| `work_data` | 工作数据 | 10000+ |
| `email_logs` | 邮件日志 | 5000+ |
| `api_keys` | API 密钥 | 200+ |
| `test_email_logs` | 测试邮件日志 | 100+ |

---

## 2. 表结构详解

### 2.1 users - 用户表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TEXT | PRIMARY KEY | 用户 ID |
| `email` | TEXT | UNIQUE NOT NULL | 邮箱地址 |
| `username` | TEXT | NOT NULL | 用户名 |
| `password_hash` | TEXT | NOT NULL | 密码哈希 (SHA-256) |
| `role` | TEXT | DEFAULT 'user' | 用户角色 (admin/user) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `last_login` | TEXT | NULL | 最后登录时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);
```

#### 索引
- 主键: `id`
- 唯一索引: `email`

#### 常用查询
```sql
-- 查询用户
SELECT * FROM users WHERE id = ?;

-- 根据邮箱查询
SELECT * FROM users WHERE email = ?;

-- 查询所有用户
SELECT * FROM users ORDER BY created_at DESC;

-- 统计用户数量
SELECT COUNT(*) FROM users;
```

---

### 2.2 sessions - 会话表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 会话 ID |
| `user_id` | TEXT | NOT NULL | 用户 ID |
| `token` | TEXT | NOT NULL | JWT Token |
| `expires_at` | TEXT | NOT NULL | 过期时间 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 索引
```sql
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

#### 常用查询
```sql
-- 验证会话
SELECT * FROM sessions WHERE token = ? AND expires_at > ?;

-- 查询用户的所有会话
SELECT * FROM sessions WHERE user_id = ?;

-- 清理过期会话
DELETE FROM sessions WHERE expires_at < ?;
```

---

### 2.3 invite_codes - 邀请码表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TEXT | PRIMARY KEY | 邀请码 ID |
| `code` | TEXT | UNIQUE NOT NULL | 邀请码 (格式: XXXX-XXXX) |
| `created_by` | TEXT | NOT NULL | 创建者用户 ID |
| `max_uses` | INTEGER | DEFAULT 1 | 最大使用次数 |
| `used_count` | INTEGER | DEFAULT 0 | 已使用次数 |
| `is_active` | INTEGER | DEFAULT 1 | 是否激活 (1/0) |
| `expires_at` | TEXT | NULL | 过期时间 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 索引
```sql
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
```

#### 常用查询
```sql
-- 验证邀请码
SELECT * FROM invite_codes WHERE code = ? AND is_active = 1;

-- 查询所有邀请码
SELECT * FROM invite_codes ORDER BY created_at DESC;

-- 使用邀请码
UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?;

-- 撤销邀请码
UPDATE invite_codes SET is_active = 0 WHERE code = ?;
```

---

### 2.4 user_configs - 用户配置表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 配置 ID |
| `user_id` | TEXT | UNIQUE NOT NULL | 用户 ID |
| `email_address` | TEXT | NULL | 邮箱地址 |
| `daily_report_time` | TEXT | DEFAULT '18:00' | 日报发送时间 |
| `enable_daily_report` | INTEGER | DEFAULT 1 | 是否启用日报 (1/0) |
| `enable_emergency_contact` | INTEGER | DEFAULT 0 | 是否启用紧急联系人 (1/0) |
| `emergency_contact_email` | TEXT | NULL | 紧急联系人邮箱 |
| `enabled` | INTEGER | DEFAULT 0 | 是否启用 (1/0) |
| `send_time` | TEXT | DEFAULT '22:00' | 发送时间 |
| `timezone` | TEXT | DEFAULT 'Asia/Shanghai' | 时区 |
| `emergency_email` | TEXT | NULL | 紧急邮箱 |
| `emergency_name` | TEXT | NULL | 紧急联系人姓名 |
| `min_work_hours` | INTEGER | DEFAULT 2 | 最小工作时长（小时） |
| `min_keyframes` | INTEGER | DEFAULT 50 | 最小关键帧数 |
| `min_json_size` | INTEGER | DEFAULT 10 | 最小 JSON 大小（KB） |
| `user_notification_time` | TEXT | DEFAULT '22:00' | 用户通知时间 |
| `emergency_notification_time` | TEXT | DEFAULT '22:00' | 紧急通知时间 |
| `enable_emergency_notification` | INTEGER | DEFAULT 1 | 是否启用紧急通知 (1/0) |
| `notification_schedule` | TEXT | NULL | 通知计划 |
| `notification_excluded_days` | TEXT | NULL | 排除通知的日期 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  email_address TEXT,
  daily_report_time TEXT DEFAULT '18:00',
  enable_daily_report INTEGER DEFAULT 1,
  enable_emergency_contact INTEGER DEFAULT 0,
  emergency_contact_email TEXT,
  enabled INTEGER DEFAULT 0,
  send_time TEXT DEFAULT '22:00',
  timezone TEXT DEFAULT 'Asia/Shanghai',
  emergency_email TEXT,
  emergency_name TEXT,
  min_work_hours INTEGER DEFAULT 2,
  min_keyframes INTEGER DEFAULT 50,
  min_json_size INTEGER DEFAULT 10,
  user_notification_time TEXT DEFAULT '22:00',
  emergency_notification_time TEXT DEFAULT '22:00',
  enable_emergency_notification INTEGER DEFAULT 1,
  notification_schedule TEXT,
  notification_excluded_days TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 常用查询
```sql
-- 获取用户配置
SELECT * FROM user_configs WHERE user_id = ?;

-- 更新配置
UPDATE user_configs SET 
  send_time = ?, 
  timezone = ?, 
  min_work_hours = ?,
  updated_at = ?
WHERE user_id = ?;

-- 查询启用的配置
SELECT * FROM user_configs WHERE enabled = 1;
```

---

### 2.5 work_data - 工作数据表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 数据 ID |
| `user_id` | TEXT | NOT NULL | 用户 ID |
| `project_name` | TEXT | NOT NULL | 项目名称 |
| `date` | TEXT | NOT NULL | 日期 (YYYY-MM-DD) |
| `compositions` | INTEGER | DEFAULT 0 | 合成数量 |
| `layers` | INTEGER | DEFAULT 0 | 图层数量 |
| `keyframes` | INTEGER | DEFAULT 0 | 关键帧数量 |
| `effects` | INTEGER | DEFAULT 0 | 效果数量 |
| `runtime_seconds` | INTEGER | DEFAULT 0 | 运行时长（秒） |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS work_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  date TEXT NOT NULL,
  compositions INTEGER DEFAULT 0,
  layers INTEGER DEFAULT 0,
  keyframes INTEGER DEFAULT 0,
  effects INTEGER DEFAULT 0,
  runtime_seconds INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 索引
```sql
CREATE INDEX IF NOT EXISTS idx_work_data_user_id ON work_data(user_id);
CREATE INDEX IF NOT EXISTS idx_work_data_date ON work_data(date);
```

#### 常用查询
```sql
-- 查询用户今日数据
SELECT * FROM work_data WHERE user_id = ? AND date = ?;

-- 查询用户近期数据
SELECT * FROM work_data WHERE user_id = ? ORDER BY date DESC LIMIT 30;

-- 统计用户工作数据
SELECT 
  SUM(compositions) as total_compositions,
  SUM(layers) as total_layers,
  SUM(keyframes) as total_keyframes,
  SUM(effects) as total_effects,
  SUM(runtime_seconds) as total_runtime
FROM work_data 
WHERE user_id = ? AND date >= ?;

-- 查询项目数据
SELECT * FROM work_data WHERE project_name = ? ORDER BY date DESC;
```

---

### 2.6 email_logs - 邮件日志表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 日志 ID |
| `user_id` | TEXT | NOT NULL | 用户 ID |
| `email_address` | TEXT | NOT NULL | 收件人邮箱 |
| `subject` | TEXT | NOT NULL | 邮件主题 |
| `status` | TEXT | DEFAULT 'pending' | 状态 (pending/sent/failed) |
| `error_message` | TEXT | NULL | 错误信息 |
| `sent_at` | TEXT | NULL | 发送时间 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 索引
```sql
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
```

#### 常用查询
```sql
-- 查询用户邮件日志
SELECT * FROM email_logs WHERE user_id = ? ORDER BY created_at DESC;

-- 查询今日发送的邮件
SELECT * FROM email_logs WHERE created_at LIKE ?;

-- 统计邮件发送状态
SELECT status, COUNT(*) as count FROM email_logs GROUP BY status;

-- 查询失败的邮件
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;
```

---

### 2.7 api_keys - API 密钥表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 密钥 ID |
| `user_id` | TEXT | NOT NULL | 用户 ID |
| `key_hash` | TEXT | NOT NULL | 密钥哈希 |
| `name` | TEXT | NULL | 密钥名称 |
| `last_used` | TEXT | NULL | 最后使用时间 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  last_used TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 索引
```sql
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
```

#### 常用查询
```sql
-- 查询用户 API 密钥
SELECT * FROM api_keys WHERE user_id = ?;

-- 更新最后使用时间
UPDATE api_keys SET last_used = ? WHERE id = ?;

-- 删除 API 密钥
DELETE FROM api_keys WHERE id = ? AND user_id = ?;
```

---

### 2.8 test_email_logs - 测试邮件日志表

#### 字段说明
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 日志 ID |
| `user_id` | TEXT | NOT NULL | 用户 ID |
| `test_email` | TEXT | NOT NULL | 测试邮箱 |
| `test_date` | TEXT | NOT NULL | 测试日期 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 创建语句
```sql
CREATE TABLE IF NOT EXISTS test_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  test_email TEXT NOT NULL,
  test_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 常用查询
```sql
-- 查询用户测试邮件日志
SELECT * FROM test_email_logs WHERE user_id = ? ORDER BY created_at DESC;

-- 统计测试邮件数量
SELECT COUNT(*) FROM test_email_logs WHERE user_id = ?;
```

---

## 3. 数据库操作

### 3.1 基础操作

#### 连接数据库
```javascript
const DB = env.DB || env.rualive;
```

#### 查询操作
```javascript
// 单行查询
const user = await DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();

// 多行查询
const users = await DB.prepare(
  'SELECT * FROM users LIMIT ?'
).bind(limit).all();
```

#### 插入操作
```javascript
const result = await DB.prepare(
  'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)'
).bind(id, email, username, passwordHash).run();

console.log('Inserted rows:', result.meta.changes);
```

#### 更新操作
```javascript
const result = await DB.prepare(
  'UPDATE users SET last_login = ? WHERE id = ?'
).bind(lastLogin, userId).run();

console.log('Updated rows:', result.meta.changes);
```

#### 删除操作
```javascript
const result = await DB.prepare(
  'DELETE FROM sessions WHERE expires_at < ?'
).bind(now).run();

console.log('Deleted rows:', result.meta.changes);
```

### 3.2 高级操作

#### 批量插入
```javascript
const insert = DB.prepare(
  'INSERT INTO work_data (user_id, project_name, date, compositions) VALUES (?, ?, ?, ?)'
);

for (const data of dataArray) {
  await insert.bind(data.userId, data.projectName, data.date, data.compositions).run();
}
```

#### 聚合查询
```javascript
// 统计总数
const count = await DB.prepare(
  'SELECT COUNT(*) as count FROM users'
).first();

// 分组统计
const stats = await DB.prepare(
  'SELECT role, COUNT(*) as count FROM users GROUP BY role'
).all();

// 求和
const total = await DB.prepare(
  'SELECT SUM(runtime_seconds) as total FROM work_data WHERE user_id = ?'
).bind(userId).first();
```

#### 连接查询
```javascript
const results = await DB.prepare(`
  SELECT 
    u.username,
    w.project_name,
    w.compositions,
    w.date
  FROM work_data w
  JOIN users u ON w.user_id = u.id
  WHERE w.date >= ?
  ORDER BY w.date DESC
`).bind(startDate).all();
```

---

## 4. 数据库迁移

### 4.1 执行迁移

#### 初始架构
```bash
wrangler d1 execute rualive --file=./schema.sql
```

#### 增量迁移
```bash
wrangler d1 execute rualive --file=./migrations/migration_add_new_column.sql
```

### 4.2 迁移脚本示例

#### 添加新字段
```sql
-- migration_add_project_id.sql
ALTER TABLE work_data ADD COLUMN project_id TEXT;
```

#### 创建新表
```sql
-- migration_create_projects_table.sql
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 数据迁移
```sql
-- migration_migrate_data.sql
-- 将旧数据迁移到新表
INSERT INTO projects (project_id, project_name, user_id)
SELECT DISTINCT 
  LOWER(REPLACE(project_name, ' ', '_')) as project_id,
  project_name,
  user_id
FROM work_data;
```

---

## 5. 性能优化

### 5.1 索引优化

#### 常用索引
```sql
-- 用户相关
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- 工作数据
CREATE INDEX idx_work_data_user_id ON work_data(user_id);
CREATE INDEX idx_work_data_date ON work_data(date);
CREATE INDEX idx_work_data_user_date ON work_data(user_id, date);

-- 邮件日志
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
```

### 5.2 查询优化

#### 使用 LIMIT
```sql
-- ✅ 好：使用 LIMIT
SELECT * FROM work_data WHERE user_id = ? ORDER BY date DESC LIMIT 30;

-- ❌ 差：可能返回大量数据
SELECT * FROM work_data WHERE user_id = ?;
```

#### 使用索引
```sql
-- ✅ 好：使用索引字段
SELECT * FROM users WHERE email = ?;

-- ❌ 差：不使用索引
SELECT * FROM users WHERE LOWER(email) = ?;
```

#### 避免 SELECT *
```sql
-- ✅ 好：只查询需要的字段
SELECT id, username, email FROM users;

-- ❌ 差：查询所有字段
SELECT * FROM users;
```

---

## 6. 数据备份和恢复

### 6.1 备份数据库
```bash
# 导出数据库
wrangler d1 export rualive --remote --output=backup.sql

# 导出特定表
wrangler d1 export rualive --remote --output=backup_users.sql --table=users
```

### 6.2 恢复数据库
```bash
# 导入数据库
wrangler d1 execute rualive --remote --file=backup.sql

# 执行 SQL 文件
wrangler d1 execute rualive --remote --command="SELECT * FROM users"
```

---

## 7. 数据清理

### 7.1 清理过期会话
```javascript
async function cleanupExpiredSessions(env) {
  const DB = env.DB || env.rualive;
  const now = new Date().toISOString();
  
  const result = await DB.prepare(
    'DELETE FROM sessions WHERE expires_at < ?'
  ).bind(now).run();
  
  console.log(`[Cleanup] Removed ${result.meta.changes} expired sessions`);
}
```

### 7.2 清理旧日志
```javascript
async function cleanupOldLogs(env, daysToKeep = 90) {
  const DB = env.DB || env.rualive;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoff = cutoffDate.toISOString();
  
  // 清理旧的邮件日志
  const emailResult = await DB.prepare(
    'DELETE FROM email_logs WHERE created_at < ?'
  ).bind(cutoff).run();
  
  // 清理旧的测试邮件日志
  const testResult = await DB.prepare(
    'DELETE FROM test_email_logs WHERE created_at < ?'
  ).bind(cutoff).run();
  
  console.log(`[Cleanup] Removed ${emailResult.meta.changes} email logs`);
  console.log(`[Cleanup] Removed ${testResult.meta.changes} test email logs`);
}
```

---

## 8. 数据一致性

### 8.1 外键约束
所有表都使用 `ON DELETE CASCADE`：
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

**效果**：删除用户时，自动删除关联数据

### 8.2 唯一约束
```sql
-- 用户邮箱唯一
email TEXT UNIQUE NOT NULL

-- 邀请码唯一
code TEXT UNIQUE NOT NULL

-- 用户配置唯一
user_id TEXT UNIQUE NOT NULL
```

### 8.3 事务处理
D1 不支持传统事务，需要手动处理：
```javascript
try {
  // 操作1
  await DB.prepare(sql1).bind(params1).run();
  
  // 操作2
  await DB.prepare(sql2).bind(params2).run();
  
  // 操作3
  await DB.prepare(sql3).bind(params3).run();
  
  return { success: true };
} catch (error) {
  console.error('Transaction failed:', error);
  // 可以在这里回滚操作
  return { success: false, error: error.message };
}
```

---

## 9. 监控和维护

### 9.1 数据库统计
```javascript
async function getDatabaseStats(env) {
  const DB = env.DB || env.rualive;
  
  const stats = {
    users: (await DB.prepare('SELECT COUNT(*) as count FROM users').first()).count,
    sessions: (await DB.prepare('SELECT COUNT(*) as count FROM sessions').first()).count,
    workData: (await DB.prepare('SELECT COUNT(*) as count FROM work_data').first()).count,
    emailLogs: (await DB.prepare('SELECT COUNT(*) as count FROM email_logs').first()).count,
  };
  
  return stats;
}
```

### 9.2 健康检查
```javascript
async function healthCheck(env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 简单查询测试连接
    await DB.prepare('SELECT 1').first();
    
    return {
      status: 'healthy',
      database: 'connected'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    };
  }
}
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成