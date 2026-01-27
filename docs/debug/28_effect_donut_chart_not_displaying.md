# 特效圆环图表不显示问题

**日期**: 2026-01-27
**状态**: ✅ 已修复
**影响范围**: User V6 Dashboard - 特效使用频率面板

---

## 问题描述

### 症状
- 特效面板显示 "368/45 独立特效"
- 数量显示正确（368 个总特效，45 个独立特效）
- 但中间的圆环图表不显示（空白）

### 控制台日志
```
effectsJson: Array(45)
effect_count: 45
```

日志显示特效数据已成功加载，但图表不渲染。

---

## 问题分析

### 1. 数据流程追踪

**数据库 → Worker 后端 → 前端 API → dataTransform.ts → React 组件**

#### 数据库端
```sql
SELECT effects_json FROM work_logs WHERE work_date = '2026-01-28'
-- 结果: '[{"project":"xxx.aep","name":"Gaussian Blur"}, ...]'
```

#### Worker 后端（`src/index.js`）
```javascript
// 处理 AE 扩展上传的特效数据
if (project.details && project.details.effects) {
  if (Array.isArray(project.details.effects)) {
    project.details.effects.forEach(effect => {
      if (effect && typeof effect === 'string') {
        allEffects.push({
          project: project.name,
          name: effect  // ❌ 缺少 count 字段！
        });
      }
    });
  }
}
```

#### 前端 API
```typescript
const workLog = await fetchWorkLog(token, date);
// workLog.effects_json: '[{"project":"xxx.aep","name":"Gaussian Blur"}, ...]'
```

#### dataTransform.ts
```typescript
// 解析 JSON
const effectsJson = safeParseJSON<EffectItem[]>(workLog.effects_json || '[]');
// effectsJson: [{project: "xxx.aep", name: "Gaussian Blur"}] (缺少 count)

// 处理特效数据
effectsJson.forEach((e) => {
  const project = projectMap.get(decodedProjectName);
  if (project) {
    project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + e.count;
    // ❌ e.count 是 undefined！
  }
});
```

#### React 组件（`user-v6.tsx`）
```typescript
// EffectDonut 组件
const chartData = useMemo(() => {
  const entries = Object.entries(data);
  entries.sort((a, b) => b[1] - a[1]);
  const top8 = entries.slice(0, 8);
  return top8.map(([name, value]) => ({ name, value }));
}, [data]);

// data = {} (空对象，因为 effectCounts 是空的)
// chartData = [] (空数组，圆环不显示)
```

### 2. 根本原因

**Worker 后端在处理特效数据时，没有添加 `count` 字段**，导致：

1. `EffectItem` 缺少 `count` 属性
2. `dataTransform.ts` 中 `e.count` 是 `undefined`
3. `project.details.effectCounts` 计算错误：`0 + undefined = NaN`
4. `effectCounts` 变成空对象 `{}`
5. `EffectDonut` 组件收到空数据，无法渲染圆环

---

## 解决方案

### 修复 Worker 后端（`src/index.js`）

**修改位置**: 第 2519-2533 行

**修改前**:
```javascript
allEffects.push({
  project: project.name,
  name: effect
  // ❌ 缺少 count 字段
});
```

**修改后**:
```javascript
allEffects.push({
  project: project.name,
  name: effect,
  count: 1  // ✅ 每个特效出现一次，count 为 1
});
```

**完整修复代码**:
```javascript
// 效果列表 - 扩展发送的可能是对象数组或字符串数组
if (project.details && project.details.effects) {
  if (Array.isArray(project.details.effects)) {
    project.details.effects.forEach(effect => {
      if (effect && typeof effect === 'string') {
        // 字符串格式：["Gaussian Blur", "Motion Blur", ...]
        allEffects.push({
          project: project.name,
          name: effect,
          count: 1  // ✅ 添加 count 字段
        });
      } else if (effect && effect.effectName) {
        // 对象格式：[{effectName: "Gaussian Blur", ...}, ...]
        allEffects.push({
          project: project.name,
          name: effect.effectName,
          count: 1  // ✅ 添加 count 字段
        });
      }
    });
  } else if (typeof project.details.effects === 'string') {
    // 字符串格式（兼容旧数据）
    allEffects.push({
      project: project.name,
      name: project.details.effects,
      count: 1  // ✅ 添加 count 字段
    });
  }
}
```

---

## 验证步骤

### 1. 重新上传数据
在 AE 扩展中：
1. 点击刷新按钮
2. 上传工作数据到云端（使用新版本的 Worker）

### 2. 检查数据库
```sql
SELECT
  id,
  work_date,
  effect_count,
  SUBSTR(effects_json, 1, 300) as effects_preview
FROM work_logs
WHERE work_date = '2026-01-28'
ORDER BY id DESC
LIMIT 1;
```

**预期结果**:
```json
[{"project":"1w钻-星月幻想.aep","name":"Gaussian Blur","count":1},{"project":"1w钻-星月幻想.aep","name":"Motion Blur","count":1},...]
```

### 3. 检查前端控制台
打开 User V6 页面，检查控制台：

**预期日志**:
```
effectsJson: Array(45)
effect_count: 45
project.details.effectCounts: { "Gaussian Blur": 15, "Motion Blur": 10, ... }
```

### 4. 检查圆环显示
打开 User V6 Dashboard，查看 "特效使用频率" 面板：

**预期结果**:
- ✅ 圆环正常显示
- ✅ 中间显示特效名称和百分比
- ✅ 鼠标悬停时高亮显示对应扇区
- ✅ 滚动时显示更多特效类别

---

## 相关文件

### 修改的文件
- `src/index.js` - Worker 后端，添加 `count` 字段

### 相关的文件
- `public/src/types/database.ts` - 类型定义 `EffectItem` 接口
- `public/src/dataTransform.ts` - 数据转换逻辑
- `public/user-v6.tsx` - EffectDonut 组件（第 543-623 行）

---

## 技术细节

### 数据格式对比

**Worker 输出（修复前）**:
```json
{
  "project": "1w钻-星月幻想.aep",
  "name": "Gaussian Blur"
}
```

**Worker 输出（修复后）**:
```json
{
  "project": "1w钻-星月幻想.aep",
  "name": "Gaussian Blur",
  "count": 1
}
```

**前端聚合逻辑**:
```typescript
// dataTransform.ts
effectsJson.forEach((e) => {
  if (project) {
    project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + (e.count || 0);
    // 修复后: 0 + 1 = 1 ✅
    // 修复前: 0 + undefined = NaN ❌
  }
});

// 结果
{
  "Gaussian Blur": 15,  // 出现 15 次
  "Motion Blur": 10,     // 出现 10 次
  "Color Correction": 20 // 出现 20 次
}
```

### 圆环渲染逻辑
```typescript
// user-v6.tsx - EffectDonut 组件
const chartData = useMemo(() => {
  const entries = Object.entries(data);
  entries.sort((a, b) => b[1] - a[1]);
  const top8 = entries.slice(0, 8);
  return top8.map(([name, value]) => ({ name, value }));
}, [data]);

// data = {"Gaussian Blur": 15, "Motion Blur": 10, ...}
// chartData = [
//   {name: "Gaussian Blur", value: 15},
//   {name: "Motion Blur", value: 10},
//   ...
// ] ✅

// data = {} (空对象)
// chartData = [] (空数组) ❌
```

---

## 经验教训

### 1. 数据类型一致性
- Worker 后端和前端的数据结构必须完全一致
- TypeScript 类型定义应该在后端实现之前就确定好
- 使用接口文档或类型定义文件作为"契约"

### 2. 数据验证
- 在数据转换时添加类型检查
- 使用可选链和默认值处理可能缺失的字段
- 添加单元测试覆盖数据转换逻辑

### 3. 调试日志
- 添加调试日志时，标记为临时性日志
- 问题修复后立即清理日志
- 使用日志级别（debug/info/error）区分日志重要性

### 4. 渐进式修复
- 先验证数据流程的每个环节
- 从数据库到 Worker，再到前端，逐步验证
- 使用控制台日志追踪数据变化

---

## 后续优化

### 1. 添加单元测试
```typescript
// test/dataTransform.test.ts
describe('workLogToProjectData', () => {
  it('should correctly aggregate effects with count', () => {
    const workLog: WorkLog = {
      effects_json: JSON.stringify([
        {project: 'test.aep', name: 'Gaussian Blur', count: 1},
        {project: 'test.aep', name: 'Gaussian Blur', count: 1}
      ])
    };

    const result = workLogToProjectData(workLog);
    expect(result[0].details.effectCounts['Gaussian Blur']).toBe(2);
  });
});
```

### 2. 添加数据验证
```typescript
// dataTransform.ts
function validateEffectItem(e: any): e is EffectItem {
  return e &&
    typeof e.project === 'string' &&
    typeof e.name === 'string' &&
    typeof e.count === 'number' &&
    e.count > 0;
}

effectsJson.forEach((e) => {
  if (!validateEffectItem(e)) {
    console.warn('Invalid effect item:', e);
    return; // 跳过无效数据
  }
  // ... 处理逻辑
});
```

### 3. 添加错误处理
```typescript
try {
  project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + (e.count || 0);
} catch (error) {
  console.error('Failed to process effect:', e, error);
  // 继续处理其他特效，不中断整个流程
}
```

---

## 参考资料

- [Recharts PieChart 文档](https://recharts.org/en-US/api/PieChart)
- [Cloudflare D1 数据类型](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/)
- [TypeScript 类型守卫](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

**文档维护**: iFlow CLI
**最后更新**: 2026-01-27