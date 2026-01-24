-- 添加紧急联系人通知开关和发送规则
ALTER TABLE user_configs ADD COLUMN enable_emergency_notification INTEGER DEFAULT 1;
ALTER TABLE user_configs ADD COLUMN notification_schedule TEXT DEFAULT 'all'; -- 'all', 'weekdays', 'custom'
ALTER TABLE user_configs ADD COLUMN notification_excluded_days TEXT DEFAULT ''; -- JSON array of excluded days, e.g., '["0","6"]' for Sunday and Saturday

-- 创建测试邮件日志表
CREATE TABLE IF NOT EXISTS test_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  test_email TEXT NOT NULL,
  test_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);