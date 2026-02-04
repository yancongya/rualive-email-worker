# 运行时间跟踪 API 升级方案

## 概述

本文档描述了如何升级 Email Worker 的前后端 API 以支持每日运行时间跟踪功能。该功能允许跟踪每个项目的每日运行时间，支持跨天和历史数据查询。

## 当前状态

### 数据库结构

Migration 003 已经创建了必要的表结构：

```sql
-- 项目主表
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_path TEXT,
  first_work_date TEXT NOT NULL,
  last_work_date TEXT NOT NULL,
  total_work_hours REAL DEFAULT 0,
  total_work_days INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 项目每日统计表
CREATE TABLE IF NOT EXISTS project_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  work_hours REAL DEFAULT 0,
  accumulated_runtime REAL DEFAULT 0,
  composition_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  keyframe_count INTEGER DEFAULT 0,
  effect_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, work_date),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 现有 API

```
GET  /api/projects/summary      # Get project summary
GET  /api/projects/history      # Get project daily history
POST /api/work-data             # Upload work data
```

## 升级方案

### 后端 API 升级

#### 1. 更新 /api/work-data 接口

**功能**：在上传工作数据时同时上传运行时间数据

**请求格式**：
```json
{
  "userId": "user123",
  "workData": {
    "projectId": "abc123",
    "projectName": "示例项目",
    "projectPath": "C:/Projects/example.aep",
    "workHours": 2.5,
    "compositions": 5,
    "layers": 20,
    "keyframes": 100,
    "effects": 15,
    "runtime": 9000,
    "accumulatedRuntime": 9000,
    "dailyRuntimes": {
      "20260204": 3600,
      "20260203": 5400
    },
    "currentDayRuntime": 3600,
    "lastUpdateDate": "20260204"
  },
  "workDate": "2026-02-04",
  "systemInfo": { ... }
}
```

**响应格式**：
```json
{
  "success": true,
  "message": "工作数据上传成功",
  "projectId": "abc123",
  "totalWorkHours": 2.5
}
```

**实现逻辑**：
```javascript
// 伪代码
async function handleWorkDataUpload(request, env) {
  const { userId, workData, workDate } = await request.json();

  // 1. 验证用户
  const user = await verifyUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  // 2. 查找或创建项目
  let project = await env.db.prepare(
    'SELECT * FROM projects WHERE project_id = ? AND user_id = ?'
  ).bind(workData.projectId, userId).first();

  if (!project) {
    // 创建新项目
    await env.db.prepare(`
      INSERT INTO projects (user_id, project_id, project_name, project_path, first_work_date, last_work_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, workData.projectId, workData.projectName, workData.projectPath, workDate, workDate).run();

    project = await env.db.prepare(
      'SELECT * FROM projects WHERE project_id = ?'
    ).bind(workData.projectId).first();
  }

  // 3. 更新项目的最后工作日期
  await env.db.prepare(`
    UPDATE projects
    SET last_work_date = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(workDate, project.id).run();

  // 4. 处理每日运行时间数据
  if (workData.dailyRuntimes && Object.keys(workData.dailyRuntimes).length > 0) {
    for (const [date, runtimeSeconds] of Object.entries(workData.dailyRuntimes)) {
      const runtimeHours = runtimeSeconds / 3600;

      // 检查是否已存在该日期的记录
      const existing = await env.db.prepare(`
        SELECT * FROM project_daily_stats
        WHERE project_id = ? AND work_date = ?
      `).bind(project.id, date).first();

      if (existing) {
        // 更新现有记录
        await env.db.prepare(`
          UPDATE project_daily_stats
          SET work_hours = ?,
              accumulated_runtime = ?,
              composition_count = ?,
              layer_count = ?,
              keyframe_count = ?,
              effect_count = ?
          WHERE project_id = ? AND work_date = ?
        `).bind(
          runtimeHours,
          runtimeSeconds,
          workData.compositions || existing.composition_count,
          workData.layers || existing.layer_count,
          workData.keyframes || existing.keyframe_count,
          workData.effects || existing.effect_count,
          project.id,
          date
        ).run();
      } else {
        // 创建新记录
        await env.db.prepare(`
          INSERT INTO project_daily_stats (project_id, work_date, work_hours, accumulated_runtime, composition_count, layer_count, keyframe_count, effect_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          project.id,
          date,
          runtimeHours,
          runtimeSeconds,
          workData.compositions,
          workData.layers,
          workData.keyframes,
          workData.effects
        ).run();
      }
    }

    // 5. 重新计算项目的总工作小时数和工作天数
    const stats = await env.db.prepare(`
      SELECT SUM(work_hours) as total_hours, COUNT(*) as total_days
      FROM project_daily_stats
      WHERE project_id = ?
    `).bind(project.id).first();

    await env.db.prepare(`
      UPDATE projects
      SET total_work_hours = ?,
          total_work_days = ?
      WHERE id = ?
    `).bind(stats.total_hours || 0, stats.total_days || 0, project.id).run();
  }

  // 6. 存储当前工作数据到 work_data 表（向后兼容）
  await env.db.prepare(`
    INSERT INTO work_data (user_id, project_name, date, compositions, layers, keyframes, effects, runtime_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    workData.projectName,
    workDate,
    workData.compositions,
    workData.layers,
    workData.keyframes,
    workData.effects,
    workData.accumulatedRuntime || 0
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message: '工作数据上传成功',
    projectId: workData.projectId,
    totalWorkHours: stats.total_hours || 0
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 2. 更新 /api/projects/summary 接口

**功能**：返回项目摘要，包含运行时间统计

**请求格式**：
```
GET /api/projects/summary?userId=user123
```

**响应格式**：
```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "projectId": "abc123",
      "projectName": "示例项目",
      "projectPath": "C:/Projects/example.aep",
      "firstWorkDate": "2026-02-02",
      "lastWorkDate": "2026-02-04",
      "totalWorkHours": 2.5,
      "totalWorkDays": 3,
      "accumulatedRuntime": 9000,
      "createdAt": "2026-02-02T10:00:00.000Z",
      "updatedAt": "2026-02-04T15:30:00.000Z"
    }
  ]
}
```

**实现逻辑**：
```javascript
async function handleProjectSummary(request, env) {
  const { userId } = new URL(request.url).searchParams;

  const user = await verifyUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  const projects = await env.db.prepare(`
    SELECT
      p.*,
      (SELECT SUM(accumulated_runtime) FROM project_daily_stats WHERE project_id = p.id) as accumulated_runtime
    FROM projects p
    WHERE p.user_id = ?
    ORDER BY p.last_work_date DESC
  `).bind(userId).all();

  return new Response(JSON.stringify({
    success: true,
    projects: projects.results.map(p => ({
      ...p,
      accumulatedRuntime: p.accumulated_runtime || 0
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 3. 更新 /api/projects/history 接口

**功能**：返回项目的每日运行时间历史

**请求格式**：
```
GET /api/projects/history?userId=user123&projectId=abc123&startDate=2026-02-01&endDate=2026-02-28
```

**响应格式**：
```json
{
  "success": true,
  "project": {
    "id": 1,
    "projectId": "abc123",
    "projectName": "示例项目",
    "totalWorkHours": 2.5,
    "totalWorkDays": 3
  },
  "dailyStats": [
    {
      "date": "2026-02-04",
      "workHours": 1.0,
      "accumulatedRuntime": 3600,
      "compositions": 5,
      "layers": 20,
      "keyframes": 100,
      "effects": 15
    },
    {
      "date": "2026-02-03",
      "workHours": 1.5,
      "accumulatedRuntime": 5400,
      "compositions": 5,
      "layers": 20,
      "keyframes": 100,
      "effects": 15
    }
  ]
}
```

**实现逻辑**：
```javascript
async function handleProjectHistory(request, env) {
  const { userId, projectId, startDate, endDate } = new URL(request.url).searchParams;

  const user = await verifyUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  // 查询项目信息
  const project = await env.db.prepare(`
    SELECT * FROM projects WHERE project_id = ? AND user_id = ?
  `).bind(projectId, userId).first();

  if (!project) {
    return new Response(JSON.stringify({ success: false, error: 'Project not found' }), { status: 404 });
  }

  // 构建查询条件
  let query = 'SELECT * FROM project_daily_stats WHERE project_id = ?';
  const params = [project.id];

  if (startDate) {
    query += ' AND work_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND work_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY work_date DESC';

  // 查询每日统计数据
  const dailyStats = await env.db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({
    success: true,
    project: {
      id: project.id,
      projectId: project.project_id,
      projectName: project.project_name,
      totalWorkHours: project.total_work_hours,
      totalWorkDays: project.total_work_days
    },
    dailyStats: dailyStats.results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 前端升级

#### 1. 更新 emailManager.js 的 convertScanResultToWorkData 函数

**目标**：在转换扫描结果时包含每日运行时间数据

**实现**：
```javascript
/**
 * 将扫描结果转换为工作数据格式
 */
convertScanResultToWorkData: function(scanResult, projectInfo) {
  try {
    var statistics = {
      compositions: scanResult.compositions ? scanResult.compositions.count || 0 : 0,
      layers: scanResult.layers ? scanResult.layers.count || 0 : 0,
      keyframes: scanResult.keyframes ? scanResult.keyframes.count || 0 : 0,
      effects: scanResult.effects ? scanResult.effects.count || 0 : 0
    };

    // 计算work_hours（从RuntimeTracker获取运行时间）
    var workHours = (typeof RuntimeTracker !== "undefined" ? RuntimeTracker.getRuntime() / 3600 : 0);

    // 使用传入的项目信息
    var projectName = projectInfo && projectInfo.name ? projectInfo.name : 'Current Project';
    var projectPath = projectInfo && projectInfo.path ? projectInfo.path : '';

    // 生成项目ID
    var projectId = null;
    if (typeof DataManager !== 'undefined' && typeof DataManager.generateProjectId === 'function') {
      projectId = DataManager.generateProjectId(projectPath);
    }

    // 🔍 新增：加载每日运行时间数据
    var dailyRuntimes = {};
    var currentDayRuntime = 0;
    var accumulatedRuntime = 0;

    if (typeof RuntimeTracker !== "undefined") {
      accumulatedRuntime = RuntimeTracker.getRuntime();
      currentDayRuntime = RuntimeTracker.currentDayRuntime || 0;
    }

    // 从 RuntimeManager 加载每日运行时间数据
    if (typeof RuntimeManager !== 'undefined' && projectId) {
      RuntimeManager.loadProjectRuntime(projectId, function(runtimeData, error) {
        if (!error && runtimeData && runtimeData.dailyRuntimes) {
          dailyRuntimes = runtimeData.dailyRuntimes;
          Logger.info('[convertScanResultToWorkData] 加载每日运行时间数据: ' + JSON.stringify(dailyRuntimes));
        }
      });
    }

    // 转换合成对象数组为合成名称数组
    var compositionNames = [];
    if (scanResult.compositions && scanResult.compositions.compositions && Array.isArray(scanResult.compositions.compositions)) {
      compositionNames = scanResult.compositions.compositions.map(function(comp) {
        return comp.name;
      });
    }

    // 构建工作数据对象
    var workData = {
      projectId: projectId,
      projectName: projectName,
      projectPath: projectPath,
      workHours: workHours,
      runtime: accumulatedRuntime,
      accumulatedRuntime: accumulatedRuntime,
      dailyRuntimes: dailyRuntimes,
      currentDayRuntime: currentDayRuntime,
      lastUpdateDate: new Date().toISOString(),
      statistics: statistics,
      details: {
        compositions: compositionNames,
        layers: scanResult.layers && scanResult.layers.layers ? scanResult.layers.layers : {},
        keyframes: scanResult.keyframes && scanResult.keyframes.keyframes ? scanResult.keyframes.keyframes : [],
        effects: scanResult.effects && scanResult.effects.effects ? scanResult.effects.effects : []
      }
    };

    Logger.info('[convertScanResultToWorkData] 构建的工作数据: ' + JSON.stringify(workData));
    return workData;
  } catch (error) {
    Logger.error('[convertScanResultToWorkData] 转换失败: ' + error);
    return null;
  }
}
```

**问题**：RuntimeManager.loadProjectRuntime 是异步的，但 convertScanResultToWorkData 需要同步返回数据。

**解决方案**：使用 Promise 或重构代码流程。

#### 2. 使用 Promise 重构上传流程

```javascript
/**
 * 上传工作数据（重构版，使用 Promise）
 */
uploadWorkData: function(scanResult) {
  var self = this;
  var Logger = window.Logger || console;

  if (!this.config.enabled) {
    Logger.warning('[上传数据] 邮件功能未启用');
    return Promise.resolve();
  }

  Logger.info('[上传数据] 开始上传工作数据...');

  // 如果提供了扫描结果，异步获取项目信息
  if (scanResult) {
    return new Promise(function(resolve, reject) {
      if (typeof DataManager !== 'undefined' && typeof DataManager.getCurrentProjectInfo === 'function') {
        DataManager.getCurrentProjectInfo(function(projectInfo, error) {
          if (error || !projectInfo || !projectInfo.open) {
            Logger.warning('[上传数据] 无法获取项目信息');
            reject(error || '无法获取项目信息');
            return;
          }

          // 转换扫描结果为工作数据
          self.convertScanResultToWorkDataAsync(scanResult, projectInfo)
            .then(function(workData) {
              if (workData) {
                // 获取系统信息并上传
                return self.getSystemInfoAndUploadAsync(workData);
              } else {
                reject('转换工作数据失败');
              }
            })
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject('DataManager 不可用');
      }
    });
  } else {
    // 否则重新扫描
    return new Promise(function(resolve, reject) {
      self.getCurrentWorkData(function(workData) {
        if (workData) {
          self.getSystemInfoAndUploadAsync(workData)
            .then(resolve)
            .catch(reject);
        } else {
          reject('无法获取工作数据');
        }
      });
    });
  }
},

/**
 * 异步转换扫描结果为工作数据格式
 */
convertScanResultToWorkDataAsync: function(scanResult, projectInfo) {
  var self = this;
  var Logger = window.Logger || console;

  return new Promise(function(resolve, reject) {
    try {
      var statistics = {
        compositions: scanResult.compositions ? scanResult.compositions.count || 0 : 0,
        layers: scanResult.layers ? scanResult.layers.count || 0 : 0,
        keyframes: scanResult.keyframes ? scanResult.keyframes.count || 0 : 0,
        effects: scanResult.effects ? scanResult.effects.count || 0 : 0
      };

      var workHours = (typeof RuntimeTracker !== "undefined" ? RuntimeTracker.getRuntime() / 3600 : 0);
      var projectName = projectInfo && projectInfo.name ? projectInfo.name : 'Current Project';
      var projectPath = projectInfo && projectInfo.path ? projectInfo.path : '';

      var projectId = null;
      if (typeof DataManager !== 'undefined' && typeof DataManager.generateProjectId === 'function') {
        projectId = DataManager.generateProjectId(projectPath);
      }

      var accumulatedRuntime = 0;
      var currentDayRuntime = 0;
      if (typeof RuntimeTracker !== "undefined") {
        accumulatedRuntime = RuntimeTracker.getRuntime();
        currentDayRuntime = RuntimeTracker.currentDayRuntime || 0;
      }

      var dailyRuntimes = {};

      // 从 RuntimeManager 加载每日运行时间数据（异步）
      if (typeof RuntimeManager !== 'undefined' && projectId) {
        RuntimeManager.loadProjectRuntime(projectId, function(runtimeData, error) {
          if (!error && runtimeData && runtimeData.dailyRuntimes) {
            dailyRuntimes = runtimeData.dailyRuntimes;
            Logger.info('[convertScanResultToWorkDataAsync] 加载每日运行时间数据');
          }

          // 构建工作数据对象
          var workData = {
            projectId: projectId,
            projectName: projectName,
            projectPath: projectPath,
            workHours: workHours,
            runtime: accumulatedRuntime,
            accumulatedRuntime: accumulatedRuntime,
            dailyRuntimes: dailyRuntimes,
            currentDayRuntime: currentDayRuntime,
            lastUpdateDate: new Date().toISOString(),
            statistics: statistics,
            details: {
              compositions: scanResult.compositions && scanResult.compositions.compositions ?
                scanResult.compositions.compositions.map(function(comp) { return comp.name; }) : [],
              layers: scanResult.layers && scanResult.layers.layers ? scanResult.layers.layers : {},
              keyframes: scanResult.keyframes && scanResult.keyframes.keyframes ? scanResult.keyframes.keyframes : [],
              effects: scanResult.effects && scanResult.effects.effects ? scanResult.effects.effects : []
            }
          };

          Logger.info('[convertScanResultToWorkDataAsync] 构建的工作数据完成');
          resolve(workData);
        });
      } else {
        // RuntimeManager 不可用，直接返回数据
        var workData = {
          projectId: projectId,
          projectName: projectName,
          projectPath: projectPath,
          workHours: workHours,
          runtime: accumulatedRuntime,
          accumulatedRuntime: accumulatedRuntime,
          dailyRuntimes: dailyRuntimes,
          currentDayRuntime: currentDayRuntime,
          lastUpdateDate: new Date().toISOString(),
          statistics: statistics,
          details: {
            compositions: scanResult.compositions && scanResult.compositions.compositions ?
              scanResult.compositions.compositions.map(function(comp) { return comp.name; }) : [],
            layers: scanResult.layers && scanResult.layers.layers ? scanResult.layers.layers : {},
            keyframes: scanResult.keyframes && scanResult.keyframes.keyframes ? scanResult.keyframes.keyframes : [],
            effects: scanResult.effects && scanResult.effects.effects ? scanResult.effects.effects : []
          }
        };

        resolve(workData);
      }
    } catch (error) {
      Logger.error('[convertScanResultToWorkDataAsync] 转换失败: ' + error);
      reject(error);
    }
  });
},

/**
 * 异步获取系统信息并上传数据
 */
getSystemInfoAndUploadAsync: function(workData) {
  var self = this;
  var Logger = window.Logger || console;

  return new Promise(function(resolve, reject) {
    if (typeof SystemInfo !== 'undefined' && typeof SystemInfo.getSystemInfo === 'function') {
      SystemInfo.getSystemInfo(function(systemInfo, error) {
        if (error) {
          Logger.warning('[系统信息] 获取系统信息失败: ' + error);
          // 即使系统信息获取失败，也上传工作数据
          self.sendWorkDataAsync(workData, null)
            .then(resolve)
            .catch(reject);
          return;
        }

        Logger.info('[系统信息] 成功获取系统信息');
        self.sendWorkDataAsync(workData, systemInfo)
          .then(resolve)
          .catch(reject);
      });
    } else {
      Logger.warning('[系统信息] SystemInfo 模块不可用');
      self.sendWorkDataAsync(workData, null)
        .then(resolve)
        .catch(reject);
    }
  });
},

/**
 * 异步发送工作数据
 */
sendWorkDataAsync: function(workData, systemInfo) {
  var Logger = window.Logger || console;

  return new Promise(function(resolve, reject) {
    Logger.info('[发送数据] 开始发送工作数据到云端...');

    var url = 'https://rualive-email-worker.cubetan57.workers.dev/api/work-data';
    var token = localStorage.getItem('rualive.token');
    var userId = localStorage.getItem('rualive.userId');

    if (!token) {
      Logger.error('[发送数据] 未登录，无法上传数据');
      reject('未登录，无法上传数据');
      return;
    }

    if (!userId) {
      Logger.error('[发送数据] 未设置userId，无法上传数据');
      reject('未设置userId，无法上传数据');
      return;
    }

    var headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    var now = new Date();
    var workDate = now.getFullYear() + '-' +
                   String(now.getMonth() + 1).padStart(2, '0') + '-' +
                   String(now.getDate()).padStart(2, '0');

    var requestData = {
      userId: userId,
      workData: workData,
      workDate: workDate
    };

    if (systemInfo) {
      requestData.systemInfo = systemInfo;
      Logger.info('[发送数据] 包含系统信息');
    }

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData)
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        Logger.success('[发送数据] 工作数据上传成功');
        if (typeof window.showToast === 'function') {
          window.showToast('工作数据上传成功', 'success', 2000);
        }
        resolve(data);
      } else {
        Logger.error('[发送数据] 工作数据上传失败: ' + data.error);
        if (typeof window.showToast === 'function') {
          window.showToast('上传失败: ' + data.error, 'error', 3000);
        }
        reject(data.error);
      }
    })
    .catch(function(error) {
      Logger.error('[发送数据] 工作数据上传错误: ' + error);
      if (typeof window.showToast === 'function') {
        window.showToast('上传失败: ' + error, 'error', 3000);
      }
      reject(error);
    });
  });
}
```

#### 3. 更新 main.js 中的调用

```javascript
// 在 saveData 函数的回调中
dm.saveProjectData(projectData, function(success, error) {
    if (success) {
        Logger.success('数据已保存');

        // 保存运行时间到文件
        if (typeof RuntimeTracker !== 'undefined' && RuntimeTracker.currentProjectId) {
            Logger.info('[saveData] 保存运行时间到文件...');
            RuntimeTracker.saveRuntimeToFile();
        }

        // 上传数据到 Worker（使用 Promise）
        if (typeof EmailManager !== 'undefined') {
            Logger.info('[上传数据] 开始上传工作数据到云端...');
            EmailManager.uploadWorkData(data)
                .then(function(result) {
                    Logger.success('[上传数据] 工作数据上传成功');
                })
                .catch(function(error) {
                    Logger.error('[上传数据] 工作数据上传失败: ' + error);
                });
        }
    } else {
        Logger.error('保存失败: ' + error);
    }
});
```

## 测试计划

### 后端测试

1. **测试 /api/work-data 接口**：
   - 上传包含 dailyRuntimes 的工作数据
   - 验证数据正确存储到 project_daily_stats 表
   - 验证项目的 total_work_hours 和 total_work_days 正确更新

2. **测试 /api/projects/summary 接口**：
   - 查询用户的项目摘要
   - 验证返回的 accumulatedRuntime 字段正确

3. **测试 /api/projects/history 接口**：
   - 查询项目的每日运行时间历史
   - 验证日期范围过滤功能

### 前端测试

1. **测试运行时间数据加载**：
   - 验证 RuntimeManager.loadProjectRuntime 正确加载数据
   - 验证数据正确包含在上传的工作数据中

2. **测试异步上传流程**：
   - 验证 Promise 链正确执行
   - 验证错误处理正确

3. **测试 UI 集成**：
   - 验证上传按钮点击后正确触发上传
   - 验证成功/失败提示正确显示

## 部署步骤

### 后端部署

1. 确保数据库迁移 003 已执行
2. 更新 Worker 代码
3. 部署到 Cloudflare Workers：
   ```bash
   cd rualive-email-worker
   npm run deploy
   ```

### 前端部署

1. 更新 emailManager.js 文件
2. 更新 main.js 文件（如果需要）
3. 重新加载 CEP 扩展

## 注意事项

1. **向后兼容性**：
   - 确保更新后的 API 兼容旧版本的客户端
   - dailyRuntimes 字段应该是可选的

2. **错误处理**：
   - 处理 RuntimeManager 加载失败的情况
   - 处理网络请求失败的情况

3. **性能考虑**：
   - 避免频繁上传大量运行时间数据
   - 考虑批量上传优化

4. **数据一致性**：
   - 确保本地运行时间文件和数据库数据一致
   - 处理并发上传冲突

## 总结

本升级方案通过以下方式实现每日运行时间跟踪功能：

1. **后端**：
   - 更新 /api/work-data 接口以接收 dailyRuntimes 数据
   - 更新 /api/projects/summary 和 /api/projects/history 接口以返回运行时间统计

2. **前端**：
   - 重构 emailManager.js 以使用 Promise 处理异步操作
   - 在上传工作数据时包含每日运行时间数据
   - 确保运行时间数据正确加载和上传

3. **数据库**：
   - 使用现有的 project_daily_stats 表存储每日运行时间
   - 自动计算项目的总工作小时数和工作天数

这个方案充分利用了现有的数据库结构，最小化了对系统的改动，同时提供了完整的运行时间跟踪功能。