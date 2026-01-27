# User V6 数据库对接方案

## 文档信息

- **创建日期**: 2026-01-27
- **版本**: 1.2
- **状态**: 实施中
- **目标**: 将 User V6 预览版升级为完整功能版本，实现与数据库的实时对接

---

## 实施进度（2026-01-27 更新）

### ✅ 已完成（40%）

**Stage 1: 数据获取与展示（已完成）**
- ✅ 实现 `workLogToProjectData()` 数据转换函数
- ✅ 实现 `workLogToDailyData()` 每日数据转换
- ✅ 实现 `aggregateWorkLogsByDate()` 日期聚合
- ✅ 修复项目名称 URL 编码问题
- ✅ 修复合成数据格式（对象转字符串数组）
- ✅ 修复图层数据格式（分类统计）
- ✅ 修复关键帧数据格式（按图层聚合）
- ✅ 修复特效数据格式（添加 count 字段）
- ✅ 修复运行时数据格式（累计工时）
- ✅ 修复日期时区问题（使用本地时区）
- ✅ 修复数据去重问题（合成、图层、关键帧、特效）
- ✅ 移除所有调试日志
- ✅ Dashboard 视图显示真实数据
- ✅ 数据持久化正常工作
- ✅ 完成日期：2026-01-27

**Stage 5: 错误处理（部分完成）**
- ✅ 处理 URL 编码项目名称
- ✅ 处理空 JSON 数据
- ✅ 处理数据格式不匹配
- ✅ 处理数据重复问题
- ✅ 添加数据验证和容错
- ⏳ 网络错误处理（待完善）
- ⏳ 用户友好的错误提示（待完善）

### 📝 实施日志

**2026-01-27 - 特效数据格式修复**
- **问题**: 特效面板显示 "368/45 独立特效"，但圆环不显示
- **原因**: Worker 后端处理特效数据时缺少 `count` 字段，导致前端无法正确聚合
- **修复**: 在 `src/index.js` 中为每个特效项添加 `count: 1` 字段
- **影响**: 特效圆环现在可以正常显示
- **相关文件**: `src/index.js:2519-2533`

**2026-01-27 - 移除调试日志**
- **问题**: 控制台输出大量重复的调试日志
- **原因**: 之前为了调试添加的 `console.log` 语句没有清理
- **修复**: 移除 `dataTransform.ts` 中所有调试日志
- **影响**: 控制台输出更加清爽
- **相关文件**: `public/src/dataTransform.ts`

**2026-01-27 - 日期时区修复**
- **问题**: 数据上传后无法按日期查询
- **原因**: AE 扩展没有发送 `workDate`，Worker 使用 UTC 日期
- **修复**: 在 AE 扩展的 `emailManager.js` 中添加 `workDate` 字段（本地时区）
- **影响**: 数据可以按正确日期查询和显示
- **相关文件**: `js/emailManager.js`

**2026-01-27 - 数据去重修复**
- **问题**: 合成数据重复显示（3份一样的数据）
- **原因**: 简单的 `concat()` 导致数据重复
- **修复**: 使用 Map 实现基于 `project + '|' + name` 的去重
- **影响**: 数据不再重复显示
- **相关文件**: `src/index.js`, `public/src/dataTransform.ts`

**2026-01-27 - 合成数据格式修复**
- **问题**: 合成名显示为对象 `{project: "...", name: {...}}`
- **原因**: `composition_scanner.jsx` 返回完整对象，但前端期望字符串数组
- **修复**: 在 `emailManager.js` 中提取合成名称
- **影响**: 合成名正常显示
- **相关文件**: `js/emailManager.js`

### 🔄 进行中（60%）

**Stage 2: Analytics 视图（进行中）**
- ⏳ 实现日期范围查询 API
- ⏳ 实现数据聚合逻辑
- ⏳ 更新 Analytics 视图数据源

**Stage 3: Settings 视图（未开始）**
- ⏳ 实现用户配置 API
- ⏳ 实现配置保存/加载
- ⏳ 更新 Settings 视图

**Stage 4: 优化增强（未开始）**
- ⏳ 性能优化（虚拟滚动、懒加载）
- ⏳ 缓存策略（IndexedDB）
- ⏳ 响应式设计（移动端适配）

---

## 一、现状分析

### 1.1 User V6 当前状态（预览版本）

**数据来源：**
- 使用 `MOCK_DATA` 对象存储模拟数据
- 使用 `generateDynamicProject()` 函数动态生成项目数据
- 所有数据都是随机生成的，不连接真实数据库

**核心数据结构：**
```typescript
interface ProjectData {
  projectId: string;
  name: string;
  dailyRuntime: string;
  accumulatedRuntime: number;
  statistics: {
    compositions: number;
    layers: number;
    keyframes: number;
    effects: number;
  };
  details: {
    compositions: string[];
    layers: LayerDistribution;
    keyframes: KeyframeData;
    effectCounts: EffectCountData;
  };
}
```

**功能特点：**
- ✅ 完整的 UI 展示（Dashboard/Analytics/Settings 三个视图）
- ✅ 日历选择器
- ✅ 数据可视化（雷达图、饼图、趋势图）
- ✅ 项目搜索和过滤
- ✅ 双语支持（中文/英文）
- ❌ 无真实数据连接
- ❌ 无用户配置功能
- ❌ 无实时更新

### 1.2 User 版本当前状态（完整功能版本）

**数据来源：**
- 通过 API 调用 `/api/work-logs` 获取真实工作日志
- 通过 API 调用 `/api/config` 获取用户配置
- 数据存储在 Cloudflare D1 数据库中

**使用的 API 端点：**
```javascript
- GET /api/work-logs - 获取工作日志
- GET /api/config - 获取用户配置
- POST /api/config - 保存用户配置
- POST /api/send-now - 发送测试邮件
- POST /api/heartbeat - 发送心跳
- GET /api/ae-status - 获取 AE 状态
- POST /api/ae-status - 更新 AE 状态
```

**数据库表结构：**
```sql
work_logs 表字段：
- id, user_id, work_date
- work_hours, keyframe_count, json_size
- project_count, composition_count, layer_count, effect_count
- compositions_json, effects_json, layers_json, keyframes_json
- projects_json, work_hours_json

user_configs 表字段：
- enabled, email_address, daily_report_time
- emergency_email, min_work_hours, min_keyframes
- user_notification_time, emergency_notification_time
- notification_schedule, notification_excluded_days
```

**功能特点：**
- ✅ 真实数据展示
- ✅ 用户配置管理
- ✅ 邮件通知配置
- ✅ AE 在线状态监控
- ✅ 实时数据更新
- ✅ 心跳机制
- ❌ UI 相对简单（使用传统 HTML/CSS）

---

## 二、数据格式对比分析

### 2.1 数据来源对比

| 数据项 | User V6（模拟） | User（真实） | 数据库字段 |
|--------|----------------|--------------|------------|
| 合成数量 | `project.statistics.compositions` | `work_logs.composition_count` | composition_count |
| 图层数量 | `project.statistics.layers` | `work_logs.layer_count` | layer_count |
| 关键帧数量 | `project.statistics.keyframes` | `work_logs.keyframe_count` | keyframe_count |
| 特效数量 | `project.statistics.effects` | `work_logs.effect_count` | effect_count |
| 运行时长 | `project.accumulatedRuntime` | `work_logs.work_hours` | work_hours |
| 项目名称 | `project.name` | JSON 解析 | projects_json |
| 合成列表 | `project.details.compositions` | JSON 解析 | compositions_json |
| 图层分布 | `project.details.layers` | JSON 解析 | layers_json |
| 关键帧详情 | `project.details.keyframes` | JSON 解析 | keyframes_json |
| 特效统计 | `project.details.effectCounts` | JSON 解析 | effects_json |

### 2.2 数据格式差异

**User V6 格式：**
```typescript
layers: {
  video: 10,
  image: 80,
  designFile: 120,
  sourceFile: 5,
  nullSolidLayer: 20
}
```

**数据库 JSON 格式：**
```json
[
  {"project": "Project1.aep", "name": "Video Layer 1"},
  {"project": "Project1.aep", "name": "Image Layer 1"}
]
```

**转换需求：**
- 数据库格式需要聚合成 User V6 的分类格式
- 需要根据图层名称前缀或关键词进行分类

---

## 三、实施步骤

### 阶段 1：数据获取层改造（基础数据）

**目标：** 将模拟数据替换为真实 API 数据

**步骤：**

1. **创建 API 服务模块**
   - 创建 `src/api.ts` 文件
   - 实现认证函数（从 localStorage 获取 token）
   - 实现数据获取函数

2. **实现基础数据获取**
   ```typescript
   // src/api.ts
   export async function getWorkLogs(date?: string): Promise<WorkLogResponse> {
     const token = localStorage.getItem('rualive_token');
     const url = date 
       ? `/api/work-logs?date=${date}`
       : '/api/work-logs';
     
     const response = await fetch(url, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     
     return response.json();
   }
   ```

3. **数据格式转换**
   - 创建 `src/dataTransform.ts` 文件
   - 实现 `workLogToProjectData()` 转换函数
   - 将数据库 JSON 格式转换为 User V6 的 TypeScript 接口

4. **替换 mock 数据**
   - 在 `user-v6.tsx` 中导入真实 API
   - 替换 `dailyData` 的 useMemo 逻辑
   - 使用 useEffect 进行初始数据加载

**预期结果：**
- ✅ Dashboard 视图显示真实数据
- ✅ 日历选择器加载对应日期数据
- ⚠️ Analytics 视图仍使用模拟数据（待阶段 2）

**时间估算：** 2-3 天

---

### 阶段 2：Analytics 数据对接（趋势分析）

**目标：** 实现 Analytics 视图的真实数据展示

**步骤：**

1. **实现日期范围数据获取**
   ```typescript
   export async function getWorkLogsByDateRange(
     startDate: string, 
     endDate: string
   ): Promise<WorkLogResponse> {
     // 需要后端支持日期范围查询
     // 或者前端多次调用后合并
   }
   ```

2. **后端 API 增强**
   - 在 `src/index.js` 中添加日期范围查询支持
   - 新增 `/api/work-logs/range` 端点
   - 支持 `start_date` 和 `end_date` 参数

3. **数据聚合逻辑**
   - 实现 `aggregateAnalyticsData()` 函数
   - 按周/月/季/年聚合数据
   - 计算统计指标（总和、平均值、最大值）

4. **替换 Analytics 数据**
   - 更新 `AnalyticsView` 组件
   - 使用真实数据替换 `getAnalyticsData()` 函数
   - 保持现有的图表和表格展示逻辑

**预期结果：**
- ✅ Analytics 视图显示真实趋势数据
- ✅ 支持周/月/季/年视图切换
- ✅ 图表和表格数据准确

**时间估算：** 2-3 天

---

### 阶段 3：用户配置功能（Settings 视图）

**目标：** 实现 Settings 视图的真实配置功能

**步骤：**

1. **实现配置 API**
   ```typescript
   export async function getUserConfig(): Promise<UserConfig> {
     const token = localStorage.getItem('rualive_token');
     const response = await fetch('/api/config', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   }
   
   export async function saveUserConfig(config: UserConfig): Promise<void> {
     const token = localStorage.getItem('rualive_token');
     await fetch('/api/config', {
       method: 'POST',
       headers: { 
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(config)
     });
   }
   ```

2. **Settings 组件改造**
   - 替换模拟配置为真实 API
   - 实现保存功能
   - 添加加载状态和错误处理

3. **配置表单增强**
   - 添加邮件通知配置
   - 添加紧急联系人配置
   - 添加工作时间阈值配置

**预期结果：**
- ✅ Settings 视图显示真实用户配置
- ✅ 可以保存和修改配置
- ✅ 配置变更即时生效

**时间估算：** 1-2 天

---

### 阶段 4：实时更新功能

**目标：** 实现数据的实时更新

**步骤：**

1. **心跳机制**
   - 定期发送心跳请求（每 30 秒）
   - 检测 AE 在线状态
   - 更新 UI 状态指示器

2. **自动刷新**
   - 实现 `useRealtimeData` Hook
   - 使用定时器定期刷新数据
   - 用户可选择自动刷新间隔

3. **WebSocket（可选）**
   - 考虑使用 WebSocket 实现推送
   - 实时通知新数据
   - 减少轮询开销

**预期结果：**
- ✅ 数据自动更新
- ✅ AE 状态实时监控
- ✅ 新数据即时展示

**时间估算：** 2-3 天

---

### 阶段 5：错误处理和优化

**目标：** 完善错误处理和性能优化

**步骤：**

1. **错误处理**
   - 添加 API 错误处理
   - 显示友好的错误提示
   - 实现重试机制

2. **加载状态**
   - 添加骨架屏加载效果
   - 优化加载体验
   - 处理空数据状态

3. **性能优化**
   - 实现数据缓存
   - 使用 React.memo 优化渲染
   - 添加虚拟滚动（长列表）

4. **数据验证**
   - 添加数据格式验证
   - 处理异常数据
   - 提供默认值

**预期结果：**
- ✅ 稳定的数据加载
- ✅ 良好的用户体验
- ✅ 优秀的性能表现

**时间估算：** 1-2 天

---

## 四、关键技术点

### 4.1 数据格式转换

**挑战：** 数据库 JSON 格式与 User V6 格式不匹配

**解决方案：**
```typescript
function transformWorkLogToProjectData(workLog: WorkLog): ProjectData[] {
  const projectsJson = JSON.parse(workLog.projects_json || '[]');
  const compositionsJson = JSON.parse(workLog.compositions_json || '[]');
  const layersJson = JSON.parse(workLog.layers_json || '[]');
  const keyframesJson = JSON.parse(workLog.keyframes_json || '[]');
  const effectsJson = JSON.parse(workLog.effects_json || '[]');
  
  // 按项目分组数据
  const projectMap = new Map<string, ProjectData>();
  
  // 初始化项目
  projectsJson.forEach((p: any) => {
    projectMap.set(p.name, {
      projectId: p.id || generateId(p.name),
      name: p.name,
      dailyRuntime: formatRuntime(workLog.work_hours),
      accumulatedRuntime: workLog.work_hours * 3600,
      statistics: {
        compositions: 0,
        layers: 0,
        keyframes: 0,
        effects: 0
      },
      details: {
        compositions: [],
        layers: { video: 0, image: 0, designFile: 0, sourceFile: 0, nullSolidLayer: 0 },
        keyframes: {},
        effectCounts: {}
      }
    });
  });
  
  // 填充合成数据
  compositionsJson.forEach((c: any) => {
    const project = projectMap.get(c.project);
    if (project) {
      project.details.compositions.push(c.name);
      project.statistics.compositions++;
    }
  });
  
  // 填充图层数据（需要分类）
  layersJson.forEach((l: any) => {
    const project = projectMap.get(l.project);
    if (project) {
      const layerType = classifyLayer(l.name);
      project.details.layers[layerType]++;
      project.statistics.layers++;
    }
  });
  
  // 填充关键帧数据
  keyframesJson.forEach((k: any) => {
    const project = projectMap.get(k.project);
    if (project) {
      project.details.keyframes[k.layer] = k.count;
      project.statistics.keyframes += k.count;
    }
  });
  
  // 填充特效数据
  effectsJson.forEach((e: any) => {
    const project = projectMap.get(e.project);
    if (project) {
      project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + e.count;
      project.statistics.effects++;
    }
  });
  
  return Array.from(projectMap.values());
}

function classifyLayer(layerName: string): keyof LayerDistribution {
  const name = layerName.toLowerCase();
  if (name.includes('video') || name.includes('mov') || name.includes('mp4')) {
    return 'video';
  } else if (name.includes('image') || name.includes('jpg') || name.includes('png')) {
    return 'image';
  } else if (name.includes('design') || name.includes('psd') || name.includes('ai')) {
    return 'designFile';
  } else if (name.includes('null') || name.includes('solid')) {
    return 'nullSolidLayer';
  } else {
    return 'sourceFile';
  }
}
```

### 4.2 后端 API 增强

**需要新增的 API 端点：**

```javascript
// src/index.js

// 获取日期范围的工作日志
if (path === '/api/work-logs/range' && request.method === 'GET') {
  return handleGetWorkLogsRange(request, env);
}

async function handleGetWorkLogsRange(request, env) {
  const payload = await verifyAuth(request, env);
  if (!payload) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }

  const userId = payload.userId;
  const url = new URL(request.url);
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  
  const result = await DB.prepare(`
    SELECT * FROM work_logs 
    WHERE user_id = ? 
    AND work_date BETWEEN ? AND ?
    ORDER BY work_date DESC
  `).bind(userId, startDate, endDate).all();
  
  return Response.json({ success: true, data: result.results || [] });
}
```

### 4.3 缓存策略

```typescript
class DataCache {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5分钟

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();
```

---

## 五、实施优先级和时间估算

### 高优先级（核心功能）

1. **阶段 1：基础数据对接** - 2-3 天
   - 创建 API 服务模块
   - 实现数据格式转换
   - Dashboard 视图真实数据展示

2. **阶段 2：Analytics 数据对接** - 2-3 天
   - 后端 API 增强
   - 数据聚合逻辑
   - Analytics 视图真实数据展示

### 中优先级（功能完善）

3. **阶段 3：用户配置功能** - 1-2 天
   - Settings 视图真实配置
   - 配置保存功能

4. **阶段 5：错误处理和优化** - 1-2 天
   - 错误处理机制
   - 加载状态优化

### 低优先级（增强功能）

5. **阶段 4：实时更新功能** - 2-3 天
   - 心跳机制
   - 自动刷新
   - WebSocket（可选）

**总工时估算：** 8-13 天

---

## 六、风险评估和建议

### 6.1 风险点

#### 1. 数据格式不匹配

- **风险：** 数据库 JSON 格式与 User V6 格式差异较大
- **影响：** 数据转换逻辑复杂，可能丢失部分信息
- **建议：** 详细测试数据转换，补充分类规则

#### 2. 性能问题

- **风险：** 大量数据加载和渲染可能影响性能
- **影响：** 页面卡顿，用户体验差
- **建议：** 实现分页、虚拟滚动、数据缓存

#### 3. 向后兼容性

- **风险：** User 版本可能需要继续维护
- **影响：** 维护成本增加
- **建议：** 考虑逐步迁移，统一代码库

### 6.2 建议

#### 1. 保持两个版本并行

- **User 版本：** 稳定版，用于生产环境
- **User V6：** 预览版，用于测试和迭代

#### 2. 渐进式迁移

- 先实现核心功能
- 逐步添加增强功能
- 收集用户反馈

#### 3. 充分的测试

- 单元测试：数据转换逻辑
- 集成测试：API 调用
- 端到端测试：完整流程

#### 4. 文档完善

- API 文档
- 数据格式文档
- 迁移指南

---

## 七、文件结构规划

### 新增文件

```
public/
├── src/
│   ├── api.ts              # API 服务模块
│   ├── dataTransform.ts    # 数据格式转换
│   ├── cache.ts            # 缓存管理
│   ├── hooks/
│   │   ├── useAuth.ts      # 认证 Hook
│   │   ├── useWorkLogs.ts  # 工作日志 Hook
│   │   └── useRealtimeData.ts  # 实时数据 Hook
│   └── types/
│       ├── api.ts          # API 类型定义
│       └── database.ts     # 数据库类型定义
```

### 修改文件

```
public/
├── user-v6.tsx             # 主应用组件
├── user-v6-settings.tsx    # Settings 组件
└── vite.config.ts          # Vite 配置（可能需要调整）
```

### 后端文件

```
src/
└── index.js                # 添加新的 API 端点
```

---

## 八、测试计划

### 8.1 单元测试

- 数据格式转换函数
- 图层分类逻辑
- 数据聚合函数
- 缓存管理

### 8.2 集成测试

- API 调用测试
- 认证流程测试
- 数据加载测试
- 错误处理测试

### 8.3 端到端测试

- 完整用户流程
- Dashboard 视图
- Analytics 视图
- Settings 视图

---

## 九、总结

User V6 是一个功能强大、UI 精美的预览版本，要实现与数据库的实时对接，需要：

1. **替换模拟数据**：从 MOCK_DATA 转为真实 API 调用
2. **数据格式转换**：将数据库 JSON 格式转换为 User V6 的 TypeScript 接口
3. **后端 API 增强**：添加日期范围查询等新功能
4. **逐步实现**：按照阶段 1-5 的顺序逐步实施
5. **充分测试**：确保数据准确性和系统稳定性

**预计总工时：** 8-13 天（根据功能优先级调整）

**建议采用渐进式开发**，先实现核心功能，再逐步完善增强功能，确保每个阶段都能产出可用的版本。

---

## 附录

### A. 相关文档

- [User V6 集成和修复文档](./22_user_v6_integration_and_fixes.md)
- [数据库架构设计](../schema.sql)
- [API 文档](../README.md)

### B. 联系方式

如有问题或建议，请联系项目维护者。

---

**文档版本历史：**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0 | 2026-01-27 | iFlow CLI | 初始版本 |