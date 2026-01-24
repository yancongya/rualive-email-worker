-- 创建 AE 在线状态表
CREATE TABLE IF NOT EXISTS ae_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  is_online INTEGER DEFAULT 0,
  last_heartbeat DATETIME,
  project_name TEXT,
  composition_name TEXT,
  last_work_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ae_status_user ON ae_status(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_status_last_heartbeat ON ae_status(last_heartbeat);