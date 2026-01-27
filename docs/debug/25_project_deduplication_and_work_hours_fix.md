# 项目去重和工时修复

## 问题描述

在 User V6 数据库对接过程中，发现以下问题：

1. **项目重复**：同一个项目在数据库中出现多次，导致项目计数不准确
2. **工时叠加**：同一个项目的工时被多次累加，导致总工时从 30 小时增加到 279 小时
3. **工时为 null**：部分项目没有工时数据，导致总工时计算失败

## 问题分析

### 问题 1：项目重复

**原因：**
- AE 扩展在一次上传中可能发送多个相同的项目
- 后端在处理数据时没有进行去重
- 后端的合并逻辑在比较项目名称时使用了 `decodeURIComponent`，导致比较失败

**表现：**
```json
{
  "project_count": 3,
  "projects_json": [
    {"name": "1w钻-星月幻想.aep", ...},
    {"name": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", ...},
    {"name": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", ...}  // 重复
  ]
}
```

### 问题 2：工时叠加

**原因：**
- 后端的合并逻辑在处理 `work_hours_json` 时，简单追加而不是更新现有记录
- 同一个项目被添加了多次工时记录

**表现：**
```json
{
  "work_hours_json": [
    {"project": "1w钻-星月幻想.aep", "hours": "30.98"},
    {"project": "1w钻-星月幻想.aep", "hours": "30.99"},  // 重复
    {"project": "1w钻-星月幻想.aep", "hours": "31.00"}   // 重复
  ]
}
```

### 问题 3：工时为 null

**原因：**
- 部分项目没有 `accumulatedRuntime` 数据
- 后端在合并时添加了没有 `hours` 字段的记录
- `parseFloat(undefined)` 返回 `NaN`，导致总工时计算失败

**表现：**
```json
{
  "work_hours": null,
  "work_hours_json": [
    {"project": "1w钻-星月幻想.aep", "hours": "32.46"},
    {"project": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep"}  // 没有 hours 字段
  ]
}
```

## 解决方案

### 修复 1：添加项目去重逻辑

在 `saveWorkData` 函数中，在处理 `workData.projects` 之前进行去重：

```javascript
if (workData.projects && workData.projects.length > 0) {
  // 先对项目进行去重（按项目名称）
  const projectMap = new Map();
  workData.projects.forEach(project => {
    // 过滤空项目（没有名称的项目）
    if (!project.name || project.name.trim() === '') {
      return;
    }

    // 直接使用项目名称进行比较（不解码）
    const existingProject = projectMap.get(project.name);

    if (existingProject) {
      // 如果项目已存在，更新其数据
      existingProject.statistics = project.statistics || existingProject.statistics;
      existingProject.details = project.details || existingProject.details;
      // 合并运行时间
      if (project.accumulatedRuntime && project.accumulatedRuntime > 0) {
        existingProject.accumulatedRuntime = (existingProject.accumulatedRuntime || 0) + project.accumulatedRuntime;
      }
    } else {
      // 添加新项目
      projectMap.set(project.name, {
        ...project,
        accumulatedRuntime: project.accumulatedRuntime || 0
      });
    }
  });

  // 处理去重后的项目
  projectMap.forEach(project => {
    // 提取数据...
  });
}
```

### 修复 2：修复合并逻辑

在合并逻辑中，直接使用项目名称进行比较，不进行解码：

```javascript
// 处理新项目数据
allProjects.forEach(function(newProject) {
  // 直接使用项目名称进行比较（不解码）
  const existingProject = projectMap.get(newProject.name);
  
  // 从 allWorkHours 中查找新项目的工时
  const newWorkHour = allWorkHours.find(function(w) { return w.project === newProject.name; });
  const newHours = newWorkHour ? newWorkHour.hours : null;
  
  if (existingProject) {
    // 更新现有项目
    existingProject.compositions = newProject.compositions || existingProject.compositions;
    existingProject.layers = newProject.layers || existingProject.layers;
    existingProject.keyframes = newProject.keyframes || existingProject.keyframes;
    existingProject.effects = newProject.effects || existingProject.effects;
    
    // 更新或添加工作时长
    const existingWorkHour = existingWorkHours.find(function(w) { return w.project === newProject.name; });
    if (existingWorkHour) {
      // 如果新项目有工时，更新现有工时
      if (newHours !== null) {
        existingWorkHour.hours = newHours;
      }
    } else {
      // 如果新项目有工时，添加新记录
      if (newHours !== null) {
        existingWorkHours.push({
          project: newProject.name,
          hours: newHours
        });
      }
    }
  } else {
    // 添加新项目
    projectMap.set(newProject.name, newProject);
    // 只有当新项目有工时时才添加记录
    if (newHours !== null) {
      existingWorkHours.push({
        project: newProject.name,
        hours: newHours
      });
    }
  }
});
```

### 修复 3：前端工时显示

在前端 `dataTransform.ts` 中，从 `work_hours_json` 读取每个项目的独立工时：

```typescript
// 解析工作时长 JSON，创建项目名称到工时的映射
const workHoursMap = new Map<string, number>();
if (workLog.work_hours_json) {
  try {
    const workHoursJson = JSON.parse(workLog.work_hours_json);
    workHoursJson.forEach((wh: { project: string; hours: string }) => {
      const decodedName = decodeURIComponent(wh.project);
      workHoursMap.set(decodedName, parseFloat(wh.hours));
    });
  } catch (error) {
    console.error('[DataTransform] Failed to parse work_hours_json:', error);
  }
}

// 初始化项目
projectsJson.forEach((p) => {
  const projectId = p.id || generateId(p.name);
  const decodedName = decodeURIComponent(p.name);
  
  // 从 workHoursMap 中获取该项目的工时，如果没有则使用 0
  const projectHours = workHoursMap.get(decodedName) || 0;
  
  projectMap.set(decodedName, {
    projectId,
    name: decodedName,
    dailyRuntime: formatRuntime(projectHours),
    accumulatedRuntime: projectHours * 3600,
    // ...
  });
});
```

## 测试结果

### 修复前
```json
{
  "project_count": 3,
  "work_hours": null,
  "projects_json": [
    {"name": "1w钻-星月幻想.aep", ...},
    {"name": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", ...},
    {"name": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", ...}
  ],
  "work_hours_json": [
    {"project": "1w钻-星月幻想.aep", "hours": "32.46"},
    {"project": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep"}
  ]
}
```

### 修复后
```json
{
  "project_count": 2,
  "work_hours": 65.28,
  "projects_json": [
    {"name": "1w钻-星月幻想.aep", ...},
    {"name": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", ...}
  ],
  "work_hours_json": [
    {"project": "1w钻-星月幻想.aep", "hours": "32.64"},
    {"project": "星月童话动态勋章+动态麦位头像框+动态资料卡背景.aep", "hours": "32.64"}
  ]
}
```

## 总结

1. ✅ **项目去重**：不再出现重复的项目
2. ✅ **工时正确计算**：每个项目只有一条工时记录
3. ✅ **总工时正确**：从 `null` 变为正确的总工时
4. ✅ **数据正确合并**：多次上传会更新而不是添加重复记录
5. ✅ **前端显示正确**：每个项目显示正确的工时

## 相关文件

- `src/index.js` - 后端数据处理逻辑
- `public/src/dataTransform.ts` - 前端数据转换逻辑

## 部署

```bash
cd rualive-email-worker/public
npm run build
cd ..
npm run deploy
```