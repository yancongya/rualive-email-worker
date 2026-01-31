-- Migration 004: 添加 Resend 集成字段
-- 为 email_logs 表添加 Resend 相关字段

-- 添加 resend_email_id 字段用于存储 Resend 返回的邮件 ID
ALTER TABLE email_logs ADD COLUMN resend_email_id TEXT;

-- 添加 last_event 字段用于存储最新的邮件事件状态
ALTER TABLE email_logs ADD COLUMN last_event TEXT;

-- 添加 events_json 字段用于存储 Resend 返回的事件详情（JSON格式）
ALTER TABLE email_logs ADD COLUMN events_json TEXT;

-- 添加 updated_at 字段用于记录最后更新时间
ALTER TABLE email_logs ADD COLUMN updated_at TEXT;

-- 为已有数据设置默认值
UPDATE email_logs SET last_event = CASE WHEN status = 'sent' THEN 'sent' ELSE 'failed' END WHERE last_event IS NULL;
UPDATE email_logs SET updated_at = sent_at WHERE updated_at IS NULL;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_last_event ON email_logs(last_event);