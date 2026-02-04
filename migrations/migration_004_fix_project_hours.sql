-- Migration 004: 修复项目总时长累计错误
-- 问题：由于前端重复发送项目数据导致运行时间被累计多次
-- 解决方案：重新计算所有项目的总时长，基于 project_daily_stats 表

-- 步骤1：重新计算所有项目的 total_work_hours 和 total_work_days
UPDATE projects
SET
  total_work_hours = (
    SELECT COALESCE(SUM(work_hours), 0)
    FROM project_daily_stats
    WHERE project_daily_stats.project_id = projects.id
  ),
  total_work_days = (
    SELECT COUNT(DISTINCT work_date)
    FROM project_daily_stats
    WHERE project_daily_stats.project_id = projects.id
  ),
  updated_at = datetime('now')
WHERE id IN (
  SELECT DISTINCT project_id FROM project_daily_stats
);

-- 步骤2：验证修复结果
SELECT
  p.project_id,
  p.project_name,
  p.total_work_hours,
  p.total_work_days,
  (SELECT COUNT(*) FROM project_daily_stats WHERE project_id = p.id) as daily_stats_count,
  (SELECT COALESCE(SUM(work_hours), 0) FROM project_daily_stats WHERE project_id = p.id) as calculated_hours
FROM projects p
ORDER BY p.total_work_hours DESC;

-- 步骤3：检查是否有不一致的数据
SELECT
  p.project_id,
  p.project_name,
  p.total_work_hours as stored_hours,
  (SELECT COALESCE(SUM(work_hours), 0) FROM project_daily_stats WHERE project_id = p.id) as calculated_hours,
  ABS(p.total_work_hours - (SELECT COALESCE(SUM(work_hours), 0) FROM project_daily_stats WHERE project_id = p.id)) as difference
FROM projects p
WHERE ABS(p.total_work_hours - (SELECT COALESCE(SUM(work_hours), 0) FROM project_daily_stats WHERE project_id = p.id)) > 0.01;