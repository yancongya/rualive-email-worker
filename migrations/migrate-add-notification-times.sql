-- 添加用户通知时间和紧急联系人通知时间字段
ALTER TABLE user_configs ADD COLUMN user_notification_time TEXT DEFAULT '22:00';
ALTER TABLE user_configs ADD COLUMN emergency_notification_time TEXT DEFAULT '22:00';