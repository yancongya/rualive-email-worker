-- Migration 004: Add notification hour fields
-- 添加通知小时字段（只存储小时，分钟固定为00）

-- Add user_notification_hour column
ALTER TABLE user_configs ADD COLUMN user_notification_hour INTEGER DEFAULT 22;

-- Add emergency_notification_hour column
ALTER TABLE user_configs ADD COLUMN emergency_notification_hour INTEGER DEFAULT 22;

-- Create index for notification hour queries
CREATE INDEX IF NOT EXISTS idx_user_notification_hour ON user_configs(user_notification_hour);
CREATE INDEX IF NOT EXISTS idx_emergency_notification_hour ON user_configs(emergency_notification_hour);