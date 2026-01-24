-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建发送日志表
CREATE TABLE IF NOT EXISTS send_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_send_logs_user_date ON send_logs(user_id, sent_at);

-- 创建工作日志表
CREATE TABLE IF NOT EXISTS work_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  work_date TEXT NOT NULL,
  work_hours REAL DEFAULT 0,
  keyframe_count INTEGER DEFAULT 0,
  json_size INTEGER DEFAULT 0,
  project_count INTEGER DEFAULT 0,
  composition_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  effect_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, work_date)
);