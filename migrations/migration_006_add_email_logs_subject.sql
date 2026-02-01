-- Migration 006: 为 email_logs 表添加 subject 字段
-- 添加主题字段并填充现有数据

-- 添加 subject 字段
ALTER TABLE email_logs ADD COLUMN subject TEXT;

-- 根据 email_type 字段填充主题
UPDATE email_logs 
SET subject = CASE 
  WHEN email_type = 'summary' THEN '工作总结报告'
  WHEN email_type = 'warning' THEN '紧急提醒'
  WHEN email_type = 'test' THEN '测试邮件'
  ELSE '系统通知'
END 
WHERE subject IS NULL;