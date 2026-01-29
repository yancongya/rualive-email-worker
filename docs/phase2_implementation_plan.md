# 第二阶段实施计划 - 后端 Worker 升级

## 概述

本文档详细说明第二阶段的实施步骤，包括需要修改的文件、函数和具体代码。

## 已完成的工作

### 1. 创建数据库迁移脚本 ✅

**文件**: `migrations/migration_003_add_project_tables.sql`

**内容**:
- 创建 `projects` 表（项目主表）
- 创建 `project_daily_stats` 表（项目每日统计）
- 创建必要的索引

## 待实施的工作

### 2. 修改 saveWorkData 函数

**文件**: `src/index.js`
**位置**: 第 2491 行开始的 `async function saveWorkData`

**修改点1**: 在 `console.log('[saveWorkData] 去重后的项目数量:', projectMap.size);` 之后添加项目累积逻辑

**插入代码**（约在第 2549 行之后）:

```javascript
// ============================================
// 新增：项目累积逻辑（Phase 2）
// ============================================
console.log('[saveWorkData] 开始处理项目累积...');

// 遍历所有去重后的项目，处理项目累积
for (const [projectName, project] of projectMap.entries()) {
  try {
    // 获取 projectId（从 project 对象中）
    const projectId = project.projectId || '';
    
    if (!projectId) {
      console.log('[saveWorkData] 项目缺少 projectId，跳过:', projectName);
      continue;
    }

    console.log('[saveWorkData] 处理项目累积 - projectId:', projectId, 'name:', projectName);

    // 1. 查找或创建项目记录
    let projectRecord = await DB.prepare(
      'SELECT id, total_work_hours, total_work_days FROM projects WHERE user_id = ? AND project_id = ?'
    ).bind(userId, projectId).first();

    let dbProjectId;
    if (!projectRecord) {
      // 创建新项目
      console.log('[saveWorkData] 创建新项目记录:', projectName);
      const result = await DB.prepare(`
        INSERT INTO projects (user_id, project_id, project_name, project_path, first_work_date, last_work_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        projectId,
        projectName,
        project.path || '',
        workDate,
        workDate
      ).run();
      dbProjectId = result.meta.last_row_id;
      console.log('[saveWorkData] 新项目 ID:', dbProjectId);
    } else {
      dbProjectId = projectRecord.id;
      console.log('[saveWorkData] 项目已存在，ID:', dbProjectId);
      // 更新最后工作日期
      await DB.prepare(`
        UPDATE projects SET last_work_date = ?, updated_at = ? WHERE id = ?
      `).bind(workDate, new Date().toISOString(), dbProjectId).run();
    }

    // 2. 保存每日统计到 project_daily_stats
    const hours = project.accumulatedRuntime ? project.accumulatedRuntime / 3600 : 0;
    const compositionCount = project.statistics ? project.statistics.compositions || 0 : 0;
    const layerCount = project.statistics ? project.statistics.layers || 0 : 0;
    const keyframeCount = project.statistics ? project.statistics.keyframes || 0 : 0;
    const effectCount = project.statistics ? project.statistics.effects || 0 : 0;
    const accumulatedRuntime = project.accumulatedRuntime || 0;

    console.log('[saveWorkData] 保存每日统计 - work_hours:', hours, 'compositions:', compositionCount);

    await DB.prepare(`
      INSERT OR REPLACE INTO project_daily_stats 
      (project_id, work_date, work_hours, accumulated_runtime, composition_count, layer_count, keyframe_count, effect_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      dbProjectId,
      workDate,
      hours,
      accumulatedRuntime,
      compositionCount,
      layerCount,
      keyframeCount,
      effectCount
    ).run();

    // 3. 更新项目累积统计（只在第一次添加时累加）
    if (!projectRecord) {
      await DB.prepare(`
        UPDATE projects SET
          total_work_hours = total_work_hours + ?,
          total_work_days = total_work_days + 1,
          updated_at = ?
        WHERE id = ?
      `).bind(hours, new Date().toISOString(), dbProjectId).run();
      console.log('[saveWorkData] 更新项目累积统计 - total_work_hours:', hours, 'total_work_days: 1');
    } else {
      // 检查当天是否已有记录
      const existingDaily = await DB.prepare(
        'SELECT id FROM project_daily_stats WHERE project_id = ? AND work_date = ?'
      ).bind(dbProjectId, workDate).first();

      if (!existingDaily) {
        // 当天没有记录，累加统计
        await DB.prepare(`
          UPDATE projects SET
            total_work_hours = total_work_hours + ?,
            total_work_days = total_work_days + 1,
            updated_at = ?
          WHERE id = ?
        `).bind(hours, new Date().toISOString(), dbProjectId).run();
        console.log('[saveWorkData] 更新项目累积统计 - 增加新天数');
      } else {
        console.log('[saveWorkData] 当天已有记录，不累加统计');
      }
    }

  } catch (error) {
    console.error('[saveWorkData] 处理项目累积失败:', projectName, error);
  }
}

console.log('[saveWorkData] 项目累积处理完成');
// ============================================
// 项目累积逻辑结束
// ============================================
```

**修改点2**: 修改 projectsJson 的生成，添加 project_id 字段

**位置**: 在 `allProjects.push({` 之后

**修改**:
```javascript
allProjects.push({
  projectId: project.projectId || '',  // 新增这一行
  name: project.name,
  path: project.path || '',
  compositions: project.statistics ? project.statistics.compositions || 0 : 0,
  layers: project.statistics ? project.statistics.layers || 0 : 0,
  keyframes: project.statistics ? project.statistics.keyframes || 0 : 0,
  effects: project.statistics ? project.statistics.effects || 0 : 0
});
```

**修改点3**: 修改 workHoursJson 的生成，使用 project_id 而不是 project

**位置**: 在 `allWorkHours.push({` 之后

**修改**:
```javascript
allWorkHours.push({
  project_id: project.projectId || '',  // 改为使用 project_id
  hours: (project.accumulatedRuntime / 3600).toFixed(2)
});
```

### 3. 添加 getProjectSummary 函数

**文件**: `src/index.js`
**位置**: 在 saveWorkData 函数之后（约第 2940 行之后）

**新增代码**:
```javascript
/**
 * 获取项目汇总
 * @param {string} userId - 用户ID
 * @param {object} env - Cloudflare Workers 环境变量
 * @returns {Promise<Array>} 项目汇总列表
 */
async function getProjectSummary(userId, env) {
  const DB = env.DB || env.rualive;
  
  console.log('[getProjectSummary] 获取项目汇总 - userId:', userId);
  
  const projects = await DB.prepare(`
    SELECT 
      p.*,
      pds.composition_count as latest_compositions,
      pds.layer_count as latest_layers,
      pds.keyframe_count as latest_keyframes,
      pds.effect_count as latest_effects
    FROM projects p
    LEFT JOIN project_daily_stats pds ON p.id = pds.project_id 
      AND pds.work_date = p.last_work_date
    WHERE p.user_id = ?
    ORDER BY p.last_work_date DESC
  `).bind(userId).all();
  
  console.log('[getProjectSummary] 查询到项目数量:', projects.results ? projects.results.length : 0);
  
  return projects.results || [];
}
```

### 4. 添加 getProjectDailyHistory 函数

**文件**: `src/index.js`
**位置**: 在 getProjectSummary 函数之后

**新增代码**:
```javascript
/**
 * 获取项目每日历史
 * @param {string} userId - 用户ID
 * @param {string} projectId - 项目ID
 * @param {object} env - Cloudflare Workers 环境变量
 * @returns {Promise<Array>} 项目每日历史列表
 */
async function getProjectDailyHistory(userId, projectId, env) {
  const DB = env.DB || env.rualive;
  
  console.log('[getProjectDailyHistory] 获取项目历史 - userId:', userId, 'projectId:', projectId);
  
  const history = await DB.prepare(`
    SELECT 
      pds.*,
      p.project_name
    FROM project_daily_stats pds
    JOIN projects p ON pds.project_id = p.id
    WHERE p.user_id = ? AND p.project_id = ?
    ORDER BY pds.work_date DESC
  `).bind(userId, projectId).all();
  
  console.log('[getProjectDailyHistory] 查询到历史记录数量:', history.results ? history.results.length : 0);
  
  return history.results || [];
}
```

### 5. 添加新的 API 路由

**文件**: `src/routes.js` 或 `src/index.js`

**修改位置**: 在路由处理部分

**新增路由**:
```javascript
// 获取项目汇总
if (path === '/api/projects/summary' && request.method === 'GET') {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const projects = await getProjectSummary(userId, env);
    return new Response(JSON.stringify({ success: true, data: projects }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[API] 获取项目汇总失败:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取项目每日历史
if (path === '/api/projects/history' && request.method === 'GET') {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    
    if (!projectId) {
      return new Response(JSON.stringify({ success: false, error: 'project_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const history = await getProjectDailyHistory(userId, projectId, env);
    return new Response(JSON.stringify({ success: true, data: history }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[API] 获取项目历史失败:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## 实施步骤

### 步骤1: 修改 saveWorkData 函数
1. 打开 `src/index.js`
2. 找到第 2549 行
3. 插入项目累积逻辑代码
4. 修改 projectsJson 生成（添加 projectId 字段）
5. 修改 workHoursJson 生成（使用 project_id）

### 步骤2: 添加查询函数
1. 在 saveWorkData 函数后添加 getProjectSummary 函数
2. 在 getProjectSummary 函数后添加 getProjectDailyHistory 函数

### 步骤3: 添加 API 路由
1. 在路由处理部分添加两个新路由
2. 确保路由正确处理认证和错误

### 步骤4: 测试
1. 执行数据库迁移
2. 上传测试数据
3. 验证数据库数据
4. 测试 API 端点

## 注意事项

1. **事务处理**: 当前实现没有使用数据库事务，如果需要可以添加
2. **错误处理**: 每个数据库操作都有 try-catch，确保单个项目失败不影响其他项目
3. **性能优化**: 可以考虑批量插入而不是逐个处理
4. **兼容性**: 确保向后兼容，处理没有 projectId 的旧数据

## 测试验证

参考 `docs/web_integration/06_跨天项目数据累积方案实施文档.md` 中的测试方案。

## 完成标准

- [ ] 数据库迁移脚本创建完成
- [ ] saveWorkData 函数修改完成
- [ ] getProjectSummary 函数添加完成
- [ ] getProjectDailyHistory 函数添加完成
- [ ] API 路由添加完成
- [ ] 本地测试通过
- [ ] 预览环境测试通过
- [ ] 数据验证通过