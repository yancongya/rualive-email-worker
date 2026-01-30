-- ==================== 用户管理功能迁移 ====================
-- 版本: 005
-- 日期: 2026-01-30
-- 描述: 添加用户管理功能所需字段和索引
-- 功能: 删除用户、重置密码、查看邮件统计、限制发送次数

-- ==================== 重置密码相关 ====================
ALTER TABLE users ADD COLUMN force_password_reset INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT;

-- ==================== 邮件限制相关 ====================
ALTER TABLE user_configs ADD COLUMN daily_email_limit INTEGER DEFAULT 10;
ALTER TABLE user_configs ADD COLUMN daily_email_count INTEGER DEFAULT 0;
ALTER TABLE user_configs ADD COLUMN last_email_date TEXT;

-- ==================== 创建索引优化查询 ====================
CREATE INDEX IF NOT EXISTS idx_email_logs_user_date ON email_logs(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_user_configs_user ON user_configs(user_id);

-- ==================== 字段说明 ====================
-- users表新增字段:
--   force_password_reset: 是否强制用户修改密码 (0=否, 1=是)
--   password_reset_token: 密码重置token（用于验证）
--   password_reset_expires_at: 重置token过期时间

-- user_configs表新增字段:
--   daily_email_limit: 每日最大发送次数（默认10）
--   daily_email_count: 当天已发送次数
--   last_email_date: 上次发送邮件的日期