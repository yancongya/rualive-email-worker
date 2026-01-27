-- 删除并重新创建 user_configs 表
DROP TABLE IF EXISTS user_configs;

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