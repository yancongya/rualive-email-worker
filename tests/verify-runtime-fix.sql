-- 验证运行时间修复效果的 SQL 脚本
-- 使用方法：在 Cloudflare D1 数据库控制台执行此脚本

-- 1. 查看项目每日统计（验证当天运行时间）
SELECT 
    p.project_name,
    pds.work_date,
    ROUND(pds.work_hours, 2) as daily_hours,  -- 当天运行时间（小时）
    ROUND(pds.accumulated_runtime / 3600, 2) as accumulated_hours,  -- 累积运行时间（小时）
    pds.composition_count,
    pds.layer_count,
    pds.keyframe_count,
    pds.effect_count
FROM project_daily_stats pds
JOIN projects p ON pds.project_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
ORDER BY pds.work_date DESC, p.project_name;

-- 2. 查看项目总时长（验证累积运行时间）
SELECT 
    project_name,
    ROUND(total_work_hours, 2) as total_hours,  -- 累积运行时间（小时）
    total_work_days,
    first_work_date,
    last_work_date
FROM projects
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
ORDER BY total_work_hours DESC;

-- 3. 查看 work_logs 表（验证当天总工作时长）
SELECT 
    work_date,
    ROUND(work_hours, 2) as daily_total_hours,  -- 当天总工作时长（小时）
    project_count,
    composition_count,
    layer_count,
    keyframe_count,
    effect_count
FROM work_logs
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
ORDER BY work_date DESC;

-- 4. 验证数据一致性
-- 检查：work_logs.work_hours 是否等于当天所有项目的当天运行时间之和
SELECT 
    wl.work_date,
    ROUND(wl.work_hours, 2) as work_logs_hours,
    ROUND(SUM(pds.work_hours), 2) as sum_project_daily_hours,
    ROUND(wl.work_hours - SUM(pds.work_hours), 2) as difference
FROM work_logs wl
LEFT JOIN project_daily_stats pds ON pds.work_date = wl.work_date
LEFT JOIN projects p ON pds.project_id = p.id AND p.user_id = wl.user_id
WHERE wl.user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
GROUP BY wl.work_date, wl.work_hours
HAVING ABS(wl.work_hours - SUM(pds.work_hours)) > 0.01;  -- 只显示不一致的数据

-- 5. 验证累积运行时间的计算
-- 检查：projects.total_work_hours 是否等于所有 project_daily_stats.work_hours 之和
SELECT 
    p.project_name,
    ROUND(p.total_work_hours, 2) as projects_total_hours,
    ROUND(SUM(pds.work_hours), 2) as sum_daily_hours,
    ROUND(p.total_work_hours - SUM(pds.work_hours), 2) as difference
FROM projects p
LEFT JOIN project_daily_stats pds ON pds.project_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
GROUP BY p.id, p.project_name, p.total_work_hours
HAVING ABS(p.total_work_hours - SUM(pds.work_hours)) > 0.01;  -- 只显示不一致的数据

-- 6. 测试场景：查看最近7天的数据
-- 预期结果：每天显示的是当天工作时长，而非累积运行时间
SELECT 
    p.project_name,
    pds.work_date,
    ROUND(pds.work_hours, 2) as daily_hours,
    ROUND(pds.accumulated_runtime / 3600, 2) as accumulated_hours,
    CASE 
        WHEN pds.work_hours < pds.accumulated_runtime / 3600 THEN '✅ 正确'
        ELSE '❌ 错误'
    END as status
FROM project_daily_stats pds
JOIN projects p ON pds.project_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
  AND pds.work_date >= date('now', '-7 days')
ORDER BY pds.work_date DESC, p.project_name;

-- 7. 查看最近的数据修改记录
SELECT 
    'work_logs' as table_name,
    work_date as date_key,
    ROUND(work_hours, 2) as hours_value,
    updated_at
FROM work_logs
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
  AND updated_at > datetime('now', '-1 day')

UNION ALL

SELECT 
    'project_daily_stats' as table_name,
    work_date as date_key,
    ROUND(work_hours, 2) as hours_value,
    updated_at
FROM project_daily_stats pds
JOIN projects p ON pds.project_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID
  AND pds.updated_at > datetime('now', '-1 day')

ORDER BY updated_at DESC;

-- 8. 统计数据概览
SELECT 
    '总工作天数' as metric,
    COUNT(DISTINCT work_date) as value
FROM work_logs
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID

UNION ALL

SELECT 
    '总项目数' as metric,
    COUNT(*) as value
FROM projects
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID

UNION ALL

SELECT 
    '平均每天工作时长' as metric,
    ROUND(AVG(work_hours), 2) as value
FROM work_logs
WHERE user_id = 'YOUR_USER_ID'  -- 替换为实际的用户ID

UNION ALL

SELECT 
    '总累积工作时长' as metric,
    ROUND(SUM(total_work_hours), 2) as value
FROM projects
WHERE user_id = 'YOUR_USER_ID';  -- 替换为实际的用户ID