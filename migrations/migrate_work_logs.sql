-- 迁移脚本：为 work_logs 表添加缺失的列
-- 运行方式：npx wrangler d1 execute rualive --remote --file=migrate_work_logs.sql

-- 检查并添加 composition_count 列
ALTER TABLE work_logs ADD COLUMN composition_count INTEGER DEFAULT 0;

-- 检查并添加 layer_count 列
ALTER TABLE work_logs ADD COLUMN layer_count INTEGER DEFAULT 0;

-- 检查并添加 effect_count 列
ALTER TABLE work_logs ADD COLUMN effect_count INTEGER DEFAULT 0;

-- 检查并添加 json_size 列
ALTER TABLE work_logs ADD COLUMN json_size INTEGER DEFAULT 0;

-- 检查并添加 project_count 列
ALTER TABLE work_logs ADD COLUMN project_count INTEGER DEFAULT 0;