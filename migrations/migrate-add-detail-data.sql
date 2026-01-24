-- 添加详细数据字段到 work_logs 表
ALTER TABLE work_logs ADD COLUMN compositions_json TEXT;
ALTER TABLE work_logs ADD COLUMN effects_json TEXT;
ALTER TABLE work_logs ADD COLUMN layers_json TEXT;
ALTER TABLE work_logs ADD COLUMN keyframes_json TEXT;