# 详细数据查看功能问题排查

## 问题描述
用户在双击工作详情拟态窗中的统计卡片时，显示"暂无详细数据"。

## 根本原因
AE 扩展在上传数据时，没有包含完整的 `details` 字段和 `accumulatedRuntime` 字段，导致后端无法提取详细数据。

## 问题分析

### 1. 数据流程问题
- **AE 扩展**：扫描项目生成 JSON 文件，包含 `details` 和 `accumulatedRuntime` 字段
- **上传时**：AE 扩展只上传了 `statistics` 字段，没有上传 `details` 和 `accumulatedRuntime`
- **后端**：尝试从 `projects.details` 提取数据，但该字段为空
- **结果**：`compositions_json`、`effects_json`、`layers_json`、`keyframes_json`、`work_hours_json` 字段为 null

### 2. 字段名错误
- **后端代码**：使用了错误的字段名 `project.details.keyframeCounts`
- **实际数据**：AE 生成的数据中是 `project.details.keyframes`
- **结果**：关键帧数据无法提取

### 3. 空项目问题
- **现象**：项目列表中包含空项目（没有 `name` 字段）
- **原因**：AE 扩展没有过滤无效项目
- **结果**：显示错误的项目数量

### 4. 性能问题
- **现象**：每次双击查看详情都很慢
- **原因**：没有缓存机制，每次都从服务器请求数据
- **结果**：用户体验差

## 解决方案

### 1. 修复 AE 扩展（`js/emailManager.js`）

#### 1.1 添加 details 字段
```javascript
dataByDate[date].projects.push({
  projectId: data.projectId,
  name: data.name,
  path: data.path || '',
  statistics: data.statistics,
  details: data.details,  // ← 添加此字段
  accumulatedRuntime: data.accumulatedRuntime || 0  // ← 添加此字段
});
```

#### 1.2 位置
- 文件：`C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\js\emailManager.js`
- 行号：508

### 2. 修复后端代码（`src/index.js`）

#### 2.1 修正字段名
```javascript
// 修改前
if (project.details && project.details.keyframeCounts) {
  // ...
}

// 修改后
if (project.details && project.details.keyframes) {
  // ...
}
```

#### 2.2 添加项目列表和工作时长列表
```javascript
// 项目列表
allProjects.push({
  name: project.name,
  path: project.path || '',
  compositions: project.statistics ? project.statistics.compositions || 0 : 0,
  layers: project.statistics ? project.statistics.layers || 0 : 0,
  keyframes: project.statistics ? project.statistics.keyframes || 0 : 0,
  effects: project.statistics ? project.statistics.effects || 0 : 0
});

// 工作时长列表
if (project.accumulatedRuntime && project.accumulatedRuntime > 0) {
  allWorkHours.push({
    project: project.name,
    hours: (project.accumulatedRuntime / 3600).toFixed(2)
  });
}
```

#### 2.3 过滤空项目
```javascript
workData.projects.forEach(project => {
  // 过滤空项目（没有名称的项目）
  if (!project.name || project.name.trim() === '') {
    return;
  }
  // ... 处理逻辑
});
```

#### 2.4 更新数据库字段
```javascript
await DB.prepare(`
  INSERT INTO work_logs (
    user_id, work_date, work_hours, keyframe_count, json_size,
    project_count, composition_count, layer_count, effect_count,
    compositions_json, effects_json, layers_json, keyframes_json,
    projects_json, work_hours_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id, work_date) DO UPDATE SET
    work_hours = excluded.work_hours,
    compositions_json = excluded.compositions_json,
    effects_json = excluded.effects_json,
    layers_json = excluded.layers_json,
    keyframes_json = excluded.keyframes_json,
    projects_json = excluded.projects_json,
    work_hours_json = excluded.work_hours_json
`).bind(...);
```

### 3. 修复前端代码（`src/components/logs-table.js`）

#### 3.1 添加双击功能
```javascript
// 工作时长
<div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'work-hours')" title="双击查看各项目工作时长">
  <div class="detail-stat-icon">⏱️</div>
  <div class="detail-stat-content">
    <div class="detail-stat-value">${hours} 小时</div>
    <div class="detail-stat-label">工作时长</div>
  </div>
</div>

// 项目数量
<div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'projects')" title="双击查看项目列表">
  <div class="detail-stat-icon">📁</div>
  <div class="detail-stat-content">
    <div class="detail-stat-value">${projects}</div>
    <div class="detail-stat-label">项目数量</div>
  </div>
</div>
```

#### 3.2 添加缓存机制
```javascript
constructor(containerId) {
  this.container = document.getElementById(containerId);
  this.data = [];
  this.currentPage = 1;
  this.pageSize = 10;
  this.sortColumn = 'work_date';
  this.sortDirection = 'desc';
  // 添加详细数据缓存
  this.detailCache = new Map(); // key: date_type, value: data
  this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间
  this.cacheTimestamps = new Map(); // key: date_type, value: timestamp
  this.render();
}
```

#### 3.3 优化数据获取
```javascript
async showDetailList(date, type) {
  try {
    const cacheKey = `${date}_${type}`;

    // 检查缓存
    const now = Date.now();
    const cachedTimestamp = this.cacheTimestamps.get(cacheKey);
    const cachedData = this.detailCache.get(cacheKey);

    if (cachedData && cachedTimestamp && (now - cachedTimestamp) < this.cacheExpiry) {
      console.log(`[LogsTable] 使用缓存数据: ${cacheKey}`);
      this.showListModal(cachedData.title, cachedData.jsonData, cachedData.columns);
      return;
    }

    console.log(`[LogsTable] 从服务器获取数据: ${cacheKey}`);

    // 从服务器获取数据
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/work-logs?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // ... 处理数据

    // 保存到缓存
    this.detailCache.set(cacheKey, { title, jsonData, columns });
    this.cacheTimestamps.set(cacheKey, now);

    // 显示列表
    this.showListModal(title, jsonData, columns);
  } catch (error) {
    console.error('获取详细数据失败:', error);
    alert('获取详细数据失败: ' + error.message);
  }
}
```

### 4. 数据库迁移

#### 4.1 添加字段
```sql
-- 添加详细数据字段
ALTER TABLE work_logs ADD COLUMN compositions_json TEXT;
ALTER TABLE work_logs ADD COLUMN effects_json TEXT;
ALTER TABLE work_logs ADD COLUMN layers_json TEXT;
ALTER TABLE work_logs ADD COLUMN keyframes_json TEXT;

-- 添加项目列表字段
ALTER TABLE work_logs ADD COLUMN projects_json TEXT;
ALTER TABLE work_logs ADD COLUMN work_hours_json TEXT;
```

#### 4.2 执行迁移
```bash
npx wrangler d1 execute rualive --remote --file=./migrate-add-detail-data.sql
npx wrangler d1 execute rualive --remote --file=./migrate-add-project-lists.sql
```

## 验证步骤

### 1. 重新加载 AE 扩展
**重要：必须执行此步骤**

1. 关闭 After Effects
2. 重新打开 After Effects
3. 重新加载 RuAlive 扩展：
   - 在 After Effects 中，打开"编辑" > "首选项" > "脚本和表达式"
   - 点击"重新加载脚本"按钮
   - 或者直接重启 After Effects

### 2. 验证数据库数据
```bash
npx wrangler d1 execute rualive --remote --command="SELECT compositions_json, effects_json, layers_json, keyframes_json, projects_json, work_hours_json FROM work_logs WHERE id=348;"
```

### 3. 测试前端功能
1. 打开用户面板：https://rualive-email-worker.cubetan57.workers.dev
2. 双击工作历史中的任意一行
3. 在详情拟态窗中双击任意统计卡片：
   - 合成数量 → 应显示合成列表
   - 关键帧数 → 应显示关键帧列表
   - 效果数量 → 应显示效果列表
   - 图层数量 → 应显示图层列表
   - 工作时长 → 应显示各项目工作时长
   - 项目数量 → 应显示项目列表

### 4. 验证缓存功能
1. 首次双击查看详情，观察控制台输出：`[LogsTable] 从服务器获取数据: 2026-01-19_compositions`
2. 5分钟内再次双击查看相同数据，观察控制台输出：`[LogsTable] 使用缓存数据: 2026-01-19_compositions`
3. 第二次查看应该明显更快

## 常见问题

### Q1: 为什么数据又被覆盖了？
**A:** AE 扩展每分钟自动上传一次数据。如果 AE 扩展还在使用旧代码，上传的数据就不会包含 `details` 和 `accumulatedRuntime` 字段，导致详细数据被清空。

**解决方法：** 重新加载 AE 扩展（见验证步骤 1）

### Q2: 如何确认 AE 扩展已经更新？
**A:** 检查 `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\js\emailManager.js` 文件的第 508 行，应该包含：
```javascript
details: data.details,
accumulatedRuntime: data.accumulatedRuntime || 0
```

### Q3: 如何查看数据库中的数据？
**A:** 使用以下命令：
```bash
npx wrangler d1 execute rualive --remote --command="SELECT * FROM work_logs WHERE id=348;"
```

### Q4: 测试数据会被覆盖吗？
**A:** 是的。测试数据会被 AE 扩展的上传数据覆盖。测试数据只是临时用于验证功能，实际使用时应该由 AE 扩展自动上传数据。

### Q5: 缓存多久过期？
**A:** 缓存有效期为 5 分钟。5 分钟后会自动过期，下次查看时会从服务器重新获取最新数据。

### Q6: 如何清空缓存？
**A:** 刷新页面会清空所有缓存。或者等待 5 分钟让缓存自动过期。

## 性能优化效果

### 优化前
- 每次双击查看详情都需要从服务器请求数据
- 网络延迟 + 服务器处理时间 = 约 1-2 秒
- 重复查看相同数据时体验差

### 优化后
- 首次查看：从服务器加载（约 1-2 秒）
- 5分钟内重复查看：从缓存加载（约 0.1 秒）
- 性能提升：约 10-20 倍

## 相关文件

### AE 扩展
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\js\emailManager.js`

### 后端
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\src\index.js`

### 前端
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\src\components\logs-table.js`

### 数据库迁移
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\migrate-add-detail-data.sql`
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\migrate-add-project-lists.sql`

### 文档
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\docs\detail-data-viewing-fix.md`
- `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\data-flow-explanation.html`

## 总结

本次修复解决了以下问题：
1. ✅ 详细数据显示为空的问题
2. ✅ 字段名错误导致数据无法提取的问题
3. ✅ 空项目被统计的问题
4. ✅ 双击查看详情性能慢的问题
5. ✅ 添加了缓存机制，提升用户体验

**关键点：** 必须重新加载 AE 扩展才能使修复生效！