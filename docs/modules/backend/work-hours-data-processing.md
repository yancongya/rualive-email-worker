# work_hours_json 和 project_count 数据处理逻辑

## 概述

本文档详细说明 `work_hours_json` 和 `project_count` 字段的数据处理逻辑，以及如何确保数据的准确性和一致性。

## 问题背景

### 原始问题
在 2026-02-09 之前，系统存在以下数据不一致问题：
- **项目数量统计错误**：当天有 2 个项目，但 `project_count` 显示为 1
- **工作时长统计错误**：`work_hours` 只累加部分项目的工作时长
- **work_hours_json 数据缺失**：只包含有运行时间的项目，导致部分项目被遗漏

### 问题根本原因

#### 1. Worker 端 Bug (src/index.js 第 3338 行)
```javascript
workHoursJson = newWorkHours.length > 0 ? JSON.stringify(newWorkHours) : null;
```
使用了未定义的变量 `newWorkHours`，应该使用 `allWorkHours` 或重新构建。

#### 2. 数据合并逻辑缺陷
在合并多个项目数据时，逻辑只保留了有运行时间的项目：
```javascript
const newWorkHour = allWorkHours.find(function(w) { return w.project === newProject.name; });
const newHours = newWorkHour ? newWorkHour.hours : null;

projectMap.set(newProject.name, {
  ...newProject,
  accumulatedRuntime: newHours ? parseFloat(newHours) * 3600 : 0
});
```

如果一个项目的运行时间为 0 或未上传，它会被排除在 `work_hours_json` 之外。

#### 3. work_hours 计算错误
```javascript
work_hours: allWorkHours.reduce(function(acc, w) { return acc + parseFloat(w.hours); }, 0)
```
只累加了 `allWorkHours` 中的项目，而不是所有项目。

## 解决方案

### 修复后的逻辑

#### 1. 重新构建 work_hours_json
```javascript
// 🔍 重新构建 work_hours_json，确保所有项目都被包含
const mergedWorkHours = mergedProjects.map(function(p) {
  return {
    project: p.name,
    hours: (p.accumulatedRuntime / 3600).toFixed(2)
  };
});

workHoursJson = mergedWorkHours.length > 0 ? JSON.stringify(mergedWorkHours) : null;
```

**关键改进**：
- 从 `mergedProjects` 重新构建工作时长数据
- 确保所有项目都被包含，即使运行时间为 0
- 使用 `accumulatedRuntime` 计算每个项目的工作时长

#### 2. 修复 work_hours 计算
```javascript
const mergedStats = {
  compositions: mergedCompositions.length,
  layers: mergedLayers.reduce(function(acc, l) { return acc + (l.count || 0); }, 0),
  keyframes: mergedKeyframes.reduce(function(acc, k) { return acc + (k.count || 0); }, 0),
  effects: mergedEffects.reduce(function(acc, e) { return acc + (e.count || 0); }, 0),
  work_hours: mergedWorkHours.reduce(function(acc, w) { return acc + parseFloat(w.hours); }, 0)  // 使用 mergedWorkHours
};
```

**关键改进**：
- 使用 `mergedWorkHours` 累加所有项目的工作时长
- 确保总时长正确反映所有项目的工作时间

#### 3. 修复 project_count 计算
```javascript
project_count = ?,
```

在数据库更新时使用 `mergedProjects.length`，确保项目数量正确。

## 数据结构

### work_logs 表字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `work_hours` | REAL | 总工作时长（小时） | 5.42 |
| `project_count` | INTEGER | 项目数量 | 2 |
| `work_hours_json` | TEXT | 每个项目的工作时长（JSON） | 见下方 |

### work_hours_json 格式
```json
[
  {
    "project": "10000钻-星河梦骑.aep",
    "hours": "4.58"
  },
  {
    "project": "红包动画2.aep",
    "hours": "0.84"
  }
]
```

### projects_json 格式
```json
[
  {
    "name": "10000钻-星河梦骑.aep",
    "path": "E:\\工作\\2026\\202602\\20260209 10000钻-星河梦骑\\10000钻-星河梦骑.aep",
    "projectId": "617bc8f",
    "compositions": 19,
    "layers": 7,
    "keyframes": 380,
    "effects": 89,
    "accumulatedRuntime": 16488
  },
  {
    "name": "红包动画2.aep",
    "path": "E:\\工作\\2025\\202501\\20250102 红包动画\\红包动画\\红包动画2.aep",
    "projectId": "7374e9b",
    "compositions": 21,
    "layers": 7,
    "keyframes": 544,
    "effects": 118,
    "accumulatedRuntime": 3024
  }
]
```

## 数据处理流程

### 1. 接收工作数据（AE 扩展端）
```javascript
// js/emailManager.js
var workData = {
  work_hours: currentDayRuntime / 3600,  // 当天运行时间（小时）
  projects: [
    {
      name: projectName,
      currentDayRuntime: currentDayRuntime,  // 当天运行时间（秒）
      accumulatedRuntime: accumulatedRuntime,  // 累积运行时间（秒）
      // ... 其他字段
    }
  ]
};
```

### 2. 保存数据到数据库（Worker 端）
```javascript
// src/index.js - saveWorkData
// 处理每个项目的当天运行时间
projectMap.forEach(project => {
  let projectDailyHours = 0;
  if (project.currentDayRuntime && project.currentDayRuntime > 0) {
    projectDailyHours = (project.currentDayRuntime / 3600).toFixed(2);
  }
  
  if (projectDailyHours > 0) {
    allWorkHours.push({
      project: project.name,
      hours: projectDailyHours
    });
  }
  
  allProjects.push({...project});
});
```

### 3. 合并现有数据
```javascript
// 如果当天已有数据，需要合并
if (existingData) {
  // 从 existingData 解析现有项目
  const existingProjects = JSON.parse(existingData.projects_json);
  
  // 创建项目映射
  const projectMap = new Map();
  existingProjects.forEach(p => projectMap.set(p.name, p));
  
  // 处理新项目数据
  allProjects.forEach(newProject => {
    const newWorkHour = allWorkHours.find(w => w.project === newProject.name);
    const newHours = newWorkHour ? newWorkHour.hours : null;
    
    projectMap.set(newProject.name, {
      ...newProject,
      accumulatedRuntime: newHours ? parseFloat(newHours) * 3600 : 0
    });
  });
  
  // 获取最终项目列表
  const mergedProjects = Array.from(projectMap.values());
  
  // 重新构建 work_hours_json
  const mergedWorkHours = mergedProjects.map(p => ({
    project: p.name,
    hours: (p.accumulatedRuntime / 3600).toFixed(2)
  }));
  
  // 计算统计数据
  const mergedStats = {
    work_hours: mergedWorkHours.reduce((acc, w) => acc + parseFloat(w.hours), 0),
    project_count: mergedProjects.length,
    // ... 其他统计
  };
}
```

### 4. 更新数据库
```javascript
await DB.prepare(`
  UPDATE work_logs SET
    work_hours = ?,
    project_count = ?,
    work_hours_json = ?,
    projects_json = ?
  WHERE user_id = ? AND work_date = ?
`).bind(
  mergedStats.work_hours,
  mergedProjects.length,
  JSON.stringify(mergedWorkHours),
  JSON.stringify(mergedProjects),
  userId,
  workDate
).run();
```

## 数据一致性验证

### 验证 SQL
```sql
-- 检查 work_hours_json 和 project_count 是否一致
SELECT 
  work_date,
  project_count,
  JSON_ARRAY_LENGTH(projects_json) as actual_project_count,
  work_hours,
  JSON_ARRAY_LENGTH(work_hours_json) as work_hours_count,
  work_hours_json,
  projects_json
FROM work_logs
WHERE work_date = '2026-02-09';
```

### 预期结果
- `project_count` 应该等于 `JSON_ARRAY_LENGTH(projects_json)`
- `JSON_ARRAY_LENGTH(work_hours_json)` 应该等于 `project_count`
- `work_hours` 应该等于 `work_hours_json` 中所有 `hours` 的总和

### 验证脚本
```bash
# 查询今天的数据
npx wrangler d1 execute rualive --remote --command "
  SELECT 
    work_date,
    project_count,
    work_hours,
    work_hours_json,
    projects_json
  FROM work_logs 
  WHERE work_date = '2026-02-09'
"
```

## 邮箱提醒数据使用

### 数据获取
```javascript
// src/index.js - getWorkData
const workData = await getWorkData(userId, today, env);
// 返回包含以下字段的 workData 对象：
// - work_hours: 总工作时长
// - project_count: 项目数量
// - work_hours_json: 每个项目的工作时长
// - projects_json: 项目详情
// - composition_count: 合成数量
// - layer_count: 图层数量
// - keyframe_count: 关键帧数量
// - effect_count: 特效数量
```

### getWorkData 数据重新计算逻辑

**重要**：`getWorkData()` 函数会在获取数据后，从 `projects_json` 和 `work_hours_json` 重新计算所有统计数据，确保邮件显示的是完整的数据。

```javascript
async function getWorkData(userId, date, env) {
  const result = await DB.prepare(
    'SELECT * FROM work_logs WHERE user_id = ? AND work_date = ?'
  ).bind(userId, date).first();
  
  if (!result) {
    return null;
  }
  
  // 🔍 从 projects_json 和 work_hours_json 重新计算统计数据
  // 确保邮件显示的是完整的数据，而不是可能不准确的统计字段
  if (result.projects_json && result.work_hours_json) {
    const projects = JSON.parse(result.projects_json);
    const workHoursList = JSON.parse(result.work_hours_json);
    
    // 重新计算项目数量
    result.project_count = projects.length;
    
    // 重新计算总工作时长
    result.work_hours = workHoursList.reduce(function(acc, w) {
      return acc + parseFloat(w.hours || 0);
    }, 0);
    
    // 重新计算其他维度数据（从 projects_json 累加）
    result.composition_count = projects.reduce(function(acc, p) {
      return acc + (p.compositions || 0);
    }, 0);
    
    result.layer_count = projects.reduce(function(acc, p) {
      return acc + (p.layers || 0);
    }, 0);
    
    result.keyframe_count = projects.reduce(function(acc, p) {
      return acc + (p.keyframes || 0);
    }, 0);
    
    result.effect_count = projects.reduce(function(acc, p) {
      return acc + (p.effects || 0);
    }, 0);
    
    console.log('[getWorkData] 重新计算统计数据:', {
      date: date,
      project_count: result.project_count,
      work_hours: result.work_hours,
      composition_count: result.composition_count,
      layer_count: result.layer_count,
      keyframe_count: result.keyframe_count,
      effect_count: result.effect_count
    });
  }
  
  return result;
}
```

**设计原理**：
1. **数据来源**：从 `projects_json` 和 `work_hours_json` 获取完整的项目数据
2. **重新计算**：不依赖数据库中可能不准确的统计字段，而是从 JSON 数据重新计算
3. **确保完整性**：即使 AE 扩展只上传部分项目，邮件也会显示完整的数据
4. **数据一致性**：所有统计数据都基于同一数据源，确保一致性

### 邮件模板使用
```javascript
// templates/daily-summary-email.js
const workHours = Number(workData?.work_hours) || 0;
const projectCount = workData?.project_count || 0;
const compositionCount = workData?.composition_count || 0;
const layerCount = workData?.layer_count || 0;
const keyframeCount = workData?.keyframe_count || 0;
const effectCount = workData?.effect_count || 0;

// 显示在邮件中
<div class="stat-value">${workHours.toFixed(2)}h</div>
<div class="stat-value">${projectCount}</div>
<div class="stat-value">${compositionCount}</div>
<div class="stat-value">${layerCount}</div>
<div class="stat-value">${keyframeCount}</div>
<div class="stat-value">${effectCount}</div>
```

## 常见问题

### Q1: 为什么 project_count 和 work_hours_json 数组长度不一致？
**A**: 这是旧版本的 bug，已修复。修复后两者应该一致。

### Q2: 如果一个项目的运行时间为 0，会被包含在 work_hours_json 中吗？
**A**: 会的。修复后的逻辑会包含所有项目，即使运行时间为 0。

### Q3: work_hours 是如何计算的？
**A**: `work_hours` 是 `work_hours_json` 中所有项目 `hours` 字段的总和。

### Q4: 合并数据时，如何处理运行时间为 0 的项目？
**A**: 修复后的逻辑会从 `mergedProjects` 的 `accumulatedRuntime` 计算工作时长，确保所有项目都被包含。

## 相关文件

- **Worker 端**: `src/index.js` - `saveWorkData` 函数
- **AE 扩展端**: `js/emailManager.js` - `uploadWorkData` 函数
- **数据库表**: `work_logs` 表
- **API 端点**: `POST /api/work-data`

## 更新历史

- **2026-02-09**: 修复邮件数据统计问题，确保所有维度数据正确
  - 在 `getWorkData()` 函数中添加统计数据重新计算逻辑
  - 从 `projects_json` 和 `work_hours_json` 重新计算所有维度数据
  - 修复项目数量、工作时长、合成数、图层数、关键帧数、特效数
  - 更新数据库记录，确保数据一致性

- **2026-02-09**: 修复 work_hours_json 和 project_count 计算错误
  - 添加 `mergedWorkHours` 变量
  - 修复 `workHoursJson` 赋值
  - 修复 `work_hours` 计算逻辑
  - 确保 `project_count` 正确反映项目总数

## 参考资料

- [数据库 Schema](../database/schema.md)
- [API 文档](../api/work-data-api.md)
- [数据流文档](../database/data-flows.md)