# 运行时间跟踪功能部署指南

## 部署前准备

### 1. 检查当前状态
```bash
cd rualive-email-worker
git status
```

确认：
- src/index.js 存在
- src/index.js 已恢复
- runtime-tracking-implementation.txt 存在

### 2. 检查数据库表
确认以下表已创建（migration_003_add_project_tables.sql）：
- projects
- project_daily_stats

如果表不存在，执行迁移：
```bash
npx wrangler d1 execute rualive --local --file=migrations/migration_003_add_project_tables.sql
# 生产环境
npx wrangler d1 execute rualive --file=migrations/migration_003_add_project_tables.sql
```

## 手动集成代码步骤

### 步骤 1: 在 saveWorkData 函数末尾添加调用

**位置**: src/index.js 第 3188 行，`.run()` 之前

**添加代码**:
```javascript
  // 保存运行时间数据到 projects 和 project_daily_stats 表
  await saveProjectRuntimeData(userId, projectMap, workDate, env);
```

**完整片段**:
```javascript
      projectsJson,
      workHoursJson
    )
    
    // 在这里添加
    await saveProjectRuntimeData(userId, projectMap, workDate, env);
    
    .run();
```

### 步骤 2: 添加函数定义

**位置**: src/index.js 第 3203 行，getSendLogs 函数之前

**添加完整代码**:
```javascript
/**
 * 保存项目运行时间数据到数据库
 * @param {string} userId - 用户ID
 * @param {Map} projectMap - 项目映射（包含项目信息）
 * @param {string} workDate - 工作日期
 * @param {Object} env - 环境变量
 */
async function saveProjectRuntimeData(userId, projectMap, workDate, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('[saveProjectRuntimeData] Database not available');
    return;
  }

  try {
    console.log('[saveProjectRuntimeData] 开始保存项目运行时间数据');
    
    const now = new Date().toISOString();
    
    // 遍历所有项目，保存或更新项目数据和每日统计
    for (const [projectName, project] of projectMap.entries()) {
      try {
        const projectId = project.projectId || generateProjectId(project.path || projectName);
        const projectPath = project.path || '';
        const accumulatedRuntime = project.accumulatedRuntime || 0; // 秒
        
        // 1. 保存或更新 projects 表
        const existingProject = await DB.prepare(
          'SELECT id, total_work_hours, total_work_days FROM projects WHERE project_id = ?'
        ).bind(projectId).first();
        
        if (existingProject) {
          // 更新现有项目
          const workHours = accumulatedRuntime / 3600;
          
          await DB.prepare(`
            UPDATE projects SET
              project_name = ?,
              project_path = ?,
              last_work_date = ?,
              total_work_hours = total_work_hours + ?,
              updated_at = ?
            WHERE id = ?
          `).bind(
            projectName,
            projectPath,
            workDate,
            workHours,
            now,
            existingProject.id
          ).run();
          
          console.log('[saveProjectRuntimeData] 更新项目:', projectName, '新增工作时长:', workHours.toFixed(2), '小时');
        } else {
          // 插入新项目
          const workHours = accumulatedRuntime / 3600;
          
          await DB.prepare(`
            INSERT INTO projects (
              user_id, project_id, project_name, project_path,
              first_work_date, last_work_date,
              total_work_hours, total_work_days,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          `).bind(
            userId,
            projectId,
            projectName,
            projectPath,
            workDate,
            workDate,
            workHours,
            now,
            now
          ).run();
          
          console.log('[saveProjectRuntimeData] 创建新项目:', projectName, '工作时长:', workHours.toFixed(2), '小时');
        }
        
        // 2. 保存或更新 project_daily_stats 表
        const dbProject = await DB.prepare(
          'SELECT id FROM projects WHERE project_id = ?'
        ).bind(projectId).first();
        
        if (dbProject) {
          const existingDailyStats = await DB.prepare(
            'SELECT id, work_hours FROM project_daily_stats WHERE project_id = ? AND work_date = ?'
          ).bind(dbProject.id, workDate).first();
          
          if (existingDailyStats) {
            // 更新现有每日统计
            const workHours = accumulatedRuntime / 3600;
            
            await DB.prepare(`
              UPDATE project_daily_stats SET
                work_hours = ?,
                accumulated_runtime = ?,
                composition_count = ?,
                layer_count = ?,
                keyframe_count = ?,
                effect_count = ?,
                created_at = ?
              WHERE id = ?
            `).bind(
              workHours,
              accumulatedRuntime,
              project.statistics?.compositions || 0,
              project.statistics?.layers || 0,
              project.statistics?.keyframes || 0,
              project.statistics?.effects || 0,
              now,
              existingDailyStats.id
            ).run();
            
            console.log('[saveProjectRuntimeData] 更新每日统计:', projectName, '日期:', workDate, '工作时长:', workHours.toFixed(2), '小时');
          } else {
            // 插入新的每日统计
            const workHours = accumulatedRuntime / 3600;
            
            await DB.prepare(`
              INSERT INTO project_daily_stats (
                project_id, work_date, work_hours, accumulated_runtime,
                composition_count, layer_count, keyframe_count, effect_count,
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              dbProject.id,
              workDate,
              workHours,
              accumulatedRuntime,
              project.statistics?.compositions || 0,
              project.statistics?.layers || 0,
              project.statistics?.keyframes || 0,
              project.statistics?.effects || 0,
              now
            ).run();
            
            console.log('[saveProjectRuntimeData] 创建每日统计:', projectName, '日期:', workDate, '工作时长:', workHours.toFixed(2), '小时');
          }
        }
      } catch (error) {
        console.error('[saveProjectRuntimeData] 处理项目失败:', projectName, error);
      }
    }
    
    console.log('[saveProjectRuntimeData] 项目运行时间数据保存完成');
  } catch (error) {
    console.error('[saveProjectRuntimeData] 保存项目运行时间数据失败:', error);
    // 不抛出错误，因为这是附加功能
  }
}

/**
 * 生成项目ID（基于文件路径）
 * @param {string} projectPath - 项目路径
 * @returns {string} 项目ID（8位十六进制）
 */
function generateProjectId(projectPath) {
  if (!projectPath) {
    return Date.now().toString(16).substring(0, 8);
  }
  
  let hash = 0;
  for (let i = 0; i < projectPath.length; i++) {
    const char = projectPath.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  const hashStr = Math.abs(hash).toString(16);
  return hashStr.substring(0, 8);
}

/**
 * 处理项目摘要请求
 */
async function handleProjectSummary(request, env) {
  try {
    console.log('[handleProjectSummary] 开始处理项目摘要请求');
    
    // 验证用户权限
    const user = await verifyUserOnly(request, env);
    if (!user) {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }
    
    const userId = user.id;
    const DB = env.DB || env.rualive;
    
    if (!DB) {
      return Response.json({ error: '数据库不可用' }, { status: 500 });
    }
    
    // 查询所有项目摘要
    const result = await DB.prepare(`
      SELECT 
        project_id,
        project_name,
        project_path,
        first_work_date,
        last_work_date,
        total_work_hours,
        total_work_days
      FROM projects
      WHERE user_id = ?
      ORDER BY total_work_hours DESC
    `).bind(userId).all();
    
    const projects = result.results.map(row => ({
      projectId: row.project_id,
      projectName: row.project_name,
      projectPath: row.project_path,
      firstWorkDate: row.first_work_date,
      lastWorkDate: row.last_work_date,
      totalWorkHours: row.total_work_hours,
      totalWorkDays: row.total_work_days
    }));
    
    console.log('[handleProjectSummary] 返回项目数量:', projects.length);
    
    return Response.json({ success: true, projects });
  } catch (error) {
    console.error('[handleProjectSummary] 处理请求失败:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 处理项目历史请求
 */
async function handleProjectHistory(request, env) {
  try {
    console.log('[handleProjectHistory] 开始处理项目历史请求');
    
    // 验证用户权限
    const user = await verifyUserOnly(request, env);
    if (!user) {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }
    
    const userId = user.id;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    if (!projectId) {
      return Response.json({ error: '缺少 projectId 参数' }, { status: 400 });
    }
    
    const DB = env.DB || env.rualive;
    
    if (!DB) {
      return Response.json({ error: '数据库不可用' }, { status: 500 });
    }
    
    // 获取项目信息
    const project = await DB.prepare(
      'SELECT id, project_name FROM projects WHERE project_id = ? AND user_id = ?'
    ).bind(projectId, userId).first();
    
    if (!project) {
      return Response.json({ error: '项目不存在' }, { status: 404 });
    }
    
    // 构建查询条件
    let query = 'SELECT work_date, work_hours, accumulated_runtime, composition_count, layer_count, keyframe_count, effect_count FROM project_daily_stats WHERE project_id = ?';
    const params = [project.id];
    
    if (startDate) {
      query += ' AND work_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND work_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY work_date ASC';
    
    // 查询每日历史数据
    const result = await DB.prepare(query).bind(...params).all();
    
    const dailyStats = result.results.map(row => ({
      workDate: row.work_date,
      workHours: row.work_hours,
      accumulatedRuntime: row.accumulated_runtime,
      compositionCount: row.composition_count,
      layerCount: row.layer_count,
      keyframeCount: row.keyframe_count,
      effectCount: row.effect_count
    }));
    
    console.log('[handleProjectHistory] 返回每日数据数量:', dailyStats.length);
    
    return Response.json({ 
      success: true, 
      projectName: project.project_name,
      projectId: projectId,
      dailyStats 
    });
  } catch (error) {
    console.error('[handleProjectHistory] 处理请求失败:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### 步骤 3: 添加 API 路由

**位置**: src/index.js 路由处理部分，在 `/api/work-logs` 路由之后

**添加代码**:
```javascript
    // 项目相关 API
    if (path === '/api/projects/summary' && request.method === 'GET') {
      return handleProjectSummary(request, env);
    }

    if (path === '/api/projects/history' && request.method === 'GET') {
      return handleProjectHistory(request, env);
    }
```

## 部署步骤

### 1. 本地测试
```bash
cd rualive-email-worker

# 本地运行 D1 数据库
npx wrangler d1 execute rualive --local --file=migrations/migration_003_add_project_tables.sql

# 本地启动 worker
npx wrangler dev

# 在另一个终端测试
curl http://localhost:8787/health
```

### 2. 部署到生产环境
```bash
# 确保已登录 Cloudflare
npx wrangler login

# 部署
npx wrangler deploy

# 查看日志
npx wrangler tail
```

### 3. 验证部署
```bash
# 测试 health check
curl https://rualive-email-worker.cubetan57.workers.dev/health

# 测试项目摘要（需要登录 token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://rualive-email-worker.cubetan57.workers.dev/api/projects/summary

# 测试项目历史（需要登录 token 和 projectId）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://rualive-email-worker.cubetan57.workers.dev/api/projects/history?projectId=YOUR_PROJECT_ID"
```

## 测试计划

### 测试 1: 前端上传运行时间数据
1. 启动 AE 扩展
2. 打开一个项目
3. 点击刷新按钮
4. 检查浏览器控制台日志，确认数据已上传
5. 检查 Worker 日志，确认数据已保存到数据库

### 测试 2: 查询项目摘要
1. 使用有效的 token 调用 `/api/projects/summary`
2. 验证返回的项目列表
3. 检查 total_work_hours 和 total_work_days 是否正确

### 测试 3: 查询项目历史
1. 使用有效的 token 和 projectId 调用 `/api/projects/history`
2. 验证返回的每日数据
3. 检查 work_hours 和 accumulated_runtime 是否正确

### 测试 4: 跨天运行时间跟踪
1. 在同一天多次上传数据
2. 验证每天的数据只保存一次（更新而不是累加）
3. 第二天再次上传，验证是否正确记录

## 故障排除

### 问题 1: API 返回 404
**原因**: 路由未正确添加
**解决**: 检查路由代码是否添加到正确的位置

### 问题 2: 数据库错误
**原因**: 表不存在或迁移未执行
**解决**: 执行 migration_003_add_project_tables.sql

### 问题 3: 权限错误
**原因**: token 无效或过期
**解决**: 重新登录获取新 token

### 问题 4: 运行时间数据未保存
**原因**: saveProjectRuntimeData 函数未被调用
**解决**: 检查 saveWorkData 函数末尾的调用代码

## 部署检查清单

- [ ] 代码已正确集成到 src/index.js
- [ ] 数据库表已创建（projects 和 project_daily_stats）
- [ ] 本地测试通过
- [ ] 部署到生产环境
- [ ] Health check 正常
- [ ] 项目摘要 API 正常
- [ ] 项目历史 API 正常
- [ ] 前端上传功能正常
- [ ] 跨天跟踪功能正常

## 回滚方案

如果部署后出现问题，可以回滚到之前的版本：

```bash
# 回滚 worker 子模块
cd rualive-email-worker
git reset --hard HEAD~1

# 重新部署
npx wrangler deploy
```