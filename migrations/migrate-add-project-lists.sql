-- 添加项目列表和工作时长列表字段到 work_logs 表
ALTER TABLE work_logs ADD COLUMN projects_json TEXT;
ALTER TABLE work_logs ADD COLUMN work_hours_json TEXT;