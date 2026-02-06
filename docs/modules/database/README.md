# 数据库模块总览

## 模块概述

数据库模块负责 RuAlive Email Worker 的数据持久化，使用 Cloudflare D1 数据库（SQLite 兼容）和 KV 存储系统。

## 存储系统

### D1 Database
- **绑定名称**: `DB`
- **数据库 ID**: `59a95578-9781-4592-a711-d961765766c5`
- **数据库名**: `rualive`
- **兼容性**: SQLite
- **用途**: 关系型数据存储

### KV Storage
- **绑定名称**: `KV`
- **KV ID**: `2ab9c0f8a4be4e56a30097fcd349befb`
- **Preview ID**: `192c3912542a49b99fa06c1419d2fd7a`
- **用途**: 键值存储、缓存、配置

---

## 模块列表

### 1. 数据库架构
**文件**: `schema.sql`

**职责**:
- 定义所有数据库表结构
- 创建索引
- 设置约束

**表结构**:
- `users` - 用户信息
- `sessions` - 会话管理
- `invite_codes` - 邀请码
- `user_configs` - 用户配置
- `work_logs` - 每日工作日志
- `projects` - 项目主表
- `project_daily_stats` - 项目每日统计
- `ae_status` - AE 状态
- `email_logs` - 邮件发送日志
- `api_keys` - API 密钥
- `test_email_logs` - 测试邮件日志

**文档**: [schema.md](schema.md)

### 2. 数据库迁移
**目录**: `migrations/`

**职责**:
- 数据库版本管理
- 架构变更记录
- 迁移脚本

**迁移历史**:
- `migration_001_create_tables.sql` - 初始化表结构
- `migration_002_add_auth_tables.sql` - 添加认证表
- `migration_003_add_project_tables.sql` - 添加项目表
- `migration_add_project_id.sql` - 添加 project_id 字段

**文档**: [migrations.md](migrations.md)

### 3. 索引设计
**文件**: `schema.sql` (CREATE INDEX 语句)

**职责**:
- 数据库索引优化
- 查询性能提升

**索引列表**:
- `idx_sessions_user_id`
- `idx_sessions_token`
- `idx_sessions_expires_at`
- `idx_invite_codes_code`
- `idx_work_data_user_id`
- `idx_work_data_date`
- `idx_email_logs_user_id`
- `idx_email_logs_status`
- `idx_api_keys_user_id`
- `idx_ae_status_project_id`

**文档**: [indexes.md](indexes.md)

---

## 核心表结构

### 用户相关表

#### users 表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  email_limit INTEGER DEFAULT 100,
  force_password_reset INTEGER DEFAULT 0,
  password_reset_token TEXT,
  password_reset_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### sessions 表
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### user_configs 表
```sql
CREATE TABLE user_configs (
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

### 工作数据相关表

#### work_logs 表
```sql
CREATE TABLE work_logs (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  work_date TEXT NOT NULL,
  work_hours REAL,
  keyframe_count INTEGER,
  json_size INTEGER,
  project_count INTEGER,
  composition_count INTEGER,
  layer_count INTEGER,
  effect_count INTEGER,
  compositions_json TEXT,
  effects_json TEXT,
  layers_json TEXT,
  keyframes_json TEXT,
  projects_json TEXT,
  work_hours_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, work_date)
);
```

#### projects 表
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_path TEXT,
  first_work_date TEXT NOT NULL,
  last_work_date TEXT NOT NULL,
  total_work_hours REAL DEFAULT 0,
  total_work_days INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### project_daily_stats 表
```sql
CREATE TABLE project_daily_stats (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  work_hours REAL DEFAULT 0,
  accumulated_runtime REAL DEFAULT 0,
  composition_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  keyframe_count INTEGER DEFAULT 0,
  effect_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, work_date)
);
```

### 系统相关表

#### ae_status 表
```sql
CREATE TABLE ae_status (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  ae_version TEXT,
  os_name TEXT,
  project_id TEXT,
  updated_at TEXT
);
```

#### email_logs 表
```sql
CREATE TABLE email_logs (
  id INTEGER PRIMARY KEY,
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

---

## KV 存储使用

### 存储内容
- 用户配置缓存
- 邀请码缓存
- API 密钥缓存
- 静态资源缓存

### KV 操作
```javascript
// 设置值
await KV.put(key, value);

// 获取值
const value = await KV.get(key);

// 删除值
await KV.delete(key);

// 列出所有键
const list = await KV.list({ prefix: 'user_' });
```

---

## 数据库操作

### 查询示例
```javascript
// 查询用户
const user = await DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();

// 查询列表
const users = await DB.prepare(
  'SELECT * FROM users ORDER BY created_at DESC LIMIT 10'
).all();

// 插入数据
await DB.prepare(
  'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)'
).bind(userId, email, username, passwordHash).run();

// 更新数据
await DB.prepare(
  'UPDATE users SET email = ? WHERE id = ?'
).bind(newEmail, userId).run();

// 删除数据
await DB.prepare(
  'DELETE FROM users WHERE id = ?'
).bind(userId).run();
```

### 事务操作
```javascript
// Cloudflare D1 不直接支持事务
// 需要分步执行并处理错误
try {
  await DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(newEmail, userId).run();
  await DB.prepare('UPDATE user_configs SET email_address = ? WHERE user_id = ?').bind(newEmail, userId).run();
  // 成功
} catch (error) {
  // 失败处理
  throw error;
}
```

---

## 数据迁移流程

### 执行迁移
```bash
# 执行单个迁移文件
wrangler d1 execute rualive --file=./migrations/migration_001_create_tables.sql

# 执行完整架构
wrangler d1 execute rualive --file=./schema.sql

# 远程环境
wrangler d1 execute rualive --remote --file=./schema.sql
```

### 迁移版本管理
```sql
-- 建议添加版本表
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 记录迁移历史
INSERT INTO schema_migrations (version) VALUES ('001_create_tables');
INSERT INTO schema_migrations (version) VALUES ('002_add_auth_tables');
INSERT INTO schema_migrations (version) VALUES ('003_add_project_tables');
```

---

## 数据备份和恢复

### 数据导出
```bash
# 导出整个数据库
wrangler d1 export rualive --remote --output=backup.sql

# 导出特定表
wrangler d1 execute rualive --remote --command="SELECT * FROM users"
```

### 数据恢复
```bash
# 执行备份文件
wrangler d1 execute rualive --remote --file=backup.sql
```

---

## 性能优化

### 索引策略
- 为所有外键字段创建索引
- 为常用查询条件创建索引
- 为排序字段创建索引

### 查询优化
- 使用 `EXPLAIN QUERY PLAN` 分析查询
- 避免 `SELECT *`，只查询需要的字段
- 使用 `LIMIT` 限制返回结果数量

### 缓存策略
- 使用 KV 缓存频繁查询的数据
- 设置合理的缓存过期时间
- 监控缓存命中率

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI