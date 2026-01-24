-- 创建测试邮件记录表
CREATE TABLE IF NOT EXISTS test_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  test_email TEXT NOT NULL,
  test_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, test_email, test_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_email_logs_user_date ON test_email_logs(user_id, test_date);
CREATE INDEX IF NOT EXISTS idx_test_email_logs_email_date ON test_email_logs(test_email, test_date);