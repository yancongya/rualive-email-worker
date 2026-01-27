# User V6 数据库对接问题修复

## 问题描述

User V6 从预览版本升级为真实数据对接版本过程中遇到的问题和解决方案。

## 问题列表

### 1. 模拟数据 vs 真实数据

**问题：**
- User V6 使用 `MOCK_DATA` 对象存储模拟数据
- 数据来源是随机生成的，不连接真实数据库

**解决方案：**
- 创建 API 服务模块 (`src/api.ts`)
- 创建数据格式转换模块 (`src/dataTransform.ts`)
- 替换模拟数据为真实 API 调用

**相关文件：**
- `public/src/api.ts` - API 服务模块
- `public/src/dataTransform.ts` - 数据转换模块
- `public/user-v6.tsx` - 主应用组件

---

### 2. 默认日期问题

**问题：**
- 硬编码默认日期为 `2026-01-26`
- 每次打开都显示旧日期的数据

**解决方案：**
```javascript
// 修改前
const [currentDate, setCurrentDate] = useState<string>('2026-01-26');

// 修改后
const today = new Date();
const dateStr = today.getFullYear() + '-' + 
             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
             String(today.getDate()).padStart(2, '0');
const [currentDate, setCurrentDate] = useState<string>(dateStr);
```

**相关文件：**
- `public/user-v6.tsx` - Dashboard 和 AnalyticsView 组件

---

### 3. 项目名称显示为 "Current Project"

**问题：**
- 项目名称硬编码为 "Current Project"
- 不显示真实的项目名称（如 "星月幻想.aep"）

**根本原因：**
- AE 扩展的 `emailManager.js` 中 `convertScanResultToWorkData` 函数硬编码了项目名称
- 由于 `DataManager.getCurrentProjectInfo` 是异步函数，无法在同步函数中正确获取项目信息

**解决方案：**
1. 修改 `uploadWorkData` 函数，在提供 `scanResult` 时也异步获取项目信息
2. 修改 `convertScanResultToWorkData` 函数，接受 `projectInfo` 作为参数
3. 使用传入的项目名称，而不是硬编码的 "Current Project"

**修改前：**
```javascript
convertScanResultToWorkData: function(scanResult) {
  return {
    projects: [
      {
        name: 'Current Project',  // 硬编码
        path: '',
        // ...
      }
    ]
  };
}
```

**修改后：**
```javascript
uploadWorkData: function(scanResult) {
  if (scanResult) {
    DataManager.getCurrentProjectInfo(function(projectInfo, error) {
      if (!error && projectInfo && projectInfo.open) {
        var workData = self.convertScanResultToWorkData(scanResult, projectInfo);
        self.sendWorkData(workData);
      }
    });
  }
}

convertScanResultToWorkData: function(scanResult, projectInfo) {
  var projectName = projectInfo && projectInfo.name ? projectInfo.name : 'Current Project';
  return {
    projects: [
      {
        name: projectName,  // 使用真实项目名称
        path: projectInfo && projectInfo.path ? projectInfo.path : '',
        // ...
      }
    ]
  };
}
```

**相关文件：**
- `js/emailManager.js` - AE 扩展的数据上传逻辑

---

### 4. URL 编码问题

**问题：**
- 项目名称 "1w钻-星月幻想.aep" 被编码为 `1w%E9%92%BB-%E6%98%9F%E6%9C%88%E5%B9%BB%E6%83%B3.aep`
- 显示为乱码

**解决方案：**
在数据转换时使用 `decodeURIComponent()` 解码项目名称

```javascript
// 修改前
projectMap.set(p.name, {
  name: p.name,
  // ...
});

// 修改后
const decodedName = decodeURIComponent(p.name);
projectMap.set(decodedName, {
  name: decodedName,
  // ...
});
```

**相关文件：**
- `public/src/dataTransform.ts` - 数据转换模块

---

### 5. 图层类型支持不完整

**问题：**
- 原始代码只支持 5 种图层类型（video, image, designFile, sourceFile, nullSolidLayer）
- 实际数据包含 12 种图层类型（包括 shapeLayer, textLayer, adjustmentLayer, lightLayer, cameraLayer, other）
- 部分图层被错误分类或忽略

**解决方案：**
1. 更新 `LayerDistribution` 类型定义，包含所有 12 种图层类型
2. 完善 `classifyLayer` 函数，支持所有图层类型的分类
3. 更新项目初始化逻辑，初始化所有图层类型为 0

**修改前：**
```typescript
export interface LayerDistribution {
  video: number;
  image: number;
  designFile: number;
  sourceFile: number;
  nullSolidLayer: number;
}
```

**修改后：**
```typescript
export interface LayerDistribution {
  video: number;
  image: number;
  sequence: number;
  designFile: number;
  sourceFile: number;
  nullSolidLayer: number;
  shapeLayer: number;
  textLayer: number;
  adjustmentLayer: number;
  lightLayer: number;
  cameraLayer: number;
  other: number;
}
```

**相关文件：**
- `public/src/types/database.ts` - 类型定义
- `public/src/dataTransform.ts` - 数据转换模块

---

### 6. 多项目合并问题

**问题：**
- 每次上传只显示当前项目
- 同一天打开多个项目时，后端会覆盖之前的数据
- 无法在同一天的数据中显示多个项目

**根本原因：**
- 后端使用 `ON CONFLICT` 会完全覆盖同一天的数据
- AE 扩展每次只上传当前活动的项目

**解决方案：**
修改后端 `saveWorkData` 函数，实现项目合并逻辑：

1. 检查是否已存在同一天的数据
2. 如果存在，读取现有数据
3. 合并新项目和现有项目（根据项目名称去重）
4. 重新计算统计数据
5. 更新数据库

**修改前：**
```javascript
await DB.prepare(`
  INSERT INTO work_logs (...) VALUES (...)
  ON CONFLICT(user_id, work_date) DO UPDATE SET
    work_hours = excluded.work_hours,
    projects_json = excluded.projects_json,
    -- 覆盖所有字段
`).bind(...).run();
```

**修改后：**
```javascript
// 检查是否已存在同一天的数据
const existingData = await DB.prepare(
  'SELECT * FROM work_logs WHERE user_id = ? AND work_date = ?'
).bind(userId, workDate).first();

if (existingData) {
  // 解析现有数据
  const existingProjects = JSON.parse(existingData.projects_json || '[]');
  
  // 合并项目（去重）
  const existingProjectNames = new Set(existingProjects.map(function(p) { return p.name; }));
  const newProjects = allProjects.filter(function(p) { return !existingProjectNames.has(p.name); });
  const mergedProjects = existingProjects.concat(newProjects);
  
  // 合并所有数据
  const mergedCompositions = existingCompositions.concat(allCompositions);
  const mergedEffects = existingEffects.concat(allEffects);
  // ... 其他数据
  
  // 重新计算总数
  const mergedStats = {
    compositions: mergedCompositions.reduce(function(acc, c) { return acc + c.count; }, 0),
    layers: mergedLayers.reduce(function(acc, l) { return acc + l.count; }, 0),
    // ...
  };
  
  // 更新数据库
  await DB.prepare(`
    UPDATE work_logs SET
      project_count = ?,
      composition_count = ?,
      -- 更新所有字段
    WHERE user_id = ? AND work_date = ?
  `).bind(mergedProjects.length, mergedStats.compositions, userId, workDate).run();
}
```

**相关文件：**
- `src/index.js` - 后端数据保存逻辑

**使用方法：**
1. 打开第一个项目
2. 上传数据 - 第一个项目被保存
3. 打开第二个项目
4. 上传数据 - 第二个项目被合并到同一天的数据中
5. 刷新 User V6 页面 - 看到两个项目

---

### 7. 页面滚动条问题

**问题：**
- 电脑模式下右侧有原生滚动条
- 影响美观性

**解决方案：**
隐藏滚动条但保留滚动功能

```css
/* 隐藏所有滚动条 */
body, html {
  overflow: hidden;
}

/* 在 #root 中启用滚动，但隐藏滚动条 */
#root {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

#root::-webkit-scrollbar {
  display: none;
}

#root {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**相关文件：**
- `public/user-v6.html` - HTML 样式

---

### 8. 日历按钮位置问题

**问题：**
- 日历按钮位置不理想
- 需要移动到三个 tab 按钮的左边（电脑模式下）

**解决方案：**
调整 Header 组件布局，将日历按钮和 tab 按钮组合在一起

**相关文件：**
- `public/user-v6.tsx` - Header 组件

---

## 技术栈

### 前端
- React 19.2.3
- TypeScript
- Vite 6.2.0
- Recharts 3.7.0
- Lucide React 0.563.0
- Tailwind CSS (CDN)

### 后端
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Node.js

### AE 扩展
- ExtendScript
- CEP (Common Extensibility Platform)
- CSInterface

---

## 数据流程

### AE 扩展 → 后端 → 前端

```
AE 扩展
  ↓ 扫描项目数据
  ↓ 获取项目信息（项目名称、路径）
  ↓ 构建工作数据
  ↓ 发送到 Cloudflare Worker
  ↓
Cloudflare Worker
  ↓ 接收工作数据
  ↓ 检查是否已存在同一天数据
  ↓ 合并或插入数据
  ↓ 保存到 D1 数据库
  ↓
User V6 前端
  ↓ 请求 API
  ↓ 获取工作日志
  ↓ 转换数据格式
  ↓ 解码 URL 编码
  ↓ 显示数据
```

---

## 文件结构

### 新增文件

```
public/
├── src/
│   ├── types/
│   │   ├── database.ts      # 数据库类型定义
│   │   └── api.ts            # API 类型定义
│   ├── cache.ts              # 缓存管理
│   ├── api.ts                # API 服务模块
│   ├── dataTransform.ts      # 数据格式转换
│   └── analyticsData.ts      # Analytics 数据聚合
```

### 修改文件

```
public/
└── user-v6.tsx              # 主应用组件（数据加载、默认日期）

js/
└── emailManager.js          # AE 扩展上传逻辑（项目名称）

src/
└── index.js                  # 后端路由（日期范围查询、项目合并）
```

---

## 测试步骤

### 1. 单项目上传测试

1. 打开 After Effects
2. 打开一个项目（确保已保存）
3. 打开 RuAlive@烟囱鸭 扩展
4. 上传工作数据
5. 打开 User V6 页面
6. 验证：
   - 项目名称正确显示
   - 所有统计数据正确
   - 图层分布雷达图正确

### 2. 多项目上传测试

1. 打开第一个项目
2. 上传数据
3. 刷新 User V6 页面 - 应该看到 1 个项目
4. 打开第二个项目
5. 上传数据
6. 刷新 User V6 页面 - 应该看到 2 个项目
7. 验证：
   - 项目列表包含两个项目
   - 统计数据是两个项目的总和
   - 可以在两个项目之间切换

### 3. 日期切换测试

1. 打开 User V6 页面
2. 验证默认显示当天日期
3. 使用日历选择器选择其他日期
4. 验证数据正确加载
5. 验证 Analytics 视图的数据正确

---

## 常见问题

### Q1: 为什么项目名称还是显示 "Current Project"？

**A:** 
- 确保项目已保存（.aep 文件）
- 确保重新加载了 AE 扩展
- 检查浏览器控制台是否有错误

### Q2: 为什么上传第二个项目后，第一个项目不见了？

**A:**
- 确保后端已部署最新的合并逻辑
- 检查数据库中是否有两条记录
- 删除今天的数据，重新上传两个项目

### Q3: 为什么图层类型分布不正确？

**A:**
- 确保前端已重新构建并部署
- 检查浏览器控制台的日志
- 查看 `LayerDistribution` 类型定义是否包含所有 12 种类型

### Q4: 为什么 Analytics 视图没有数据？

**A:**
- 确保后端已部署日期范围查询 API
- 检查 API 请求是否成功
- 查看浏览器控制台的错误信息

---

## 性能优化

### 缓存策略
- 使用 `DataCache` 类缓存 API 响应
- 缓存 TTL 为 5 分钟
- 定期清理过期缓存

### 数据聚合
- 使用 `useMemo` 优化数据转换
- 使用 `useEffect` 进行异步数据加载
- 避免不必要的重新渲染

---

## 安全考虑

### 数据验证
- 验证 API 响应格式
- 处理异常数据
- 提供默认值

### 错误处理
- 捕获所有可能的错误
- 显示友好的错误提示
- 实现重试机制

---

## 未来改进

### 1. 批量上传功能
- 支持一次性上传当天目录中的所有项目
- 避免逐个上传的繁琐操作

### 2. 实时数据同步
- 使用 WebSocket 实现实时数据推送
- 减少轮询开销

### 3. 数据导出
- 支持导出为 Excel 格式
- 支持导出为 PDF 报告

### 4. 历史数据对比
- 支持不同日期的数据对比
- 生成趋势报告

---

## 总结

通过以上修复，User V6 已经从预览版本成功升级为具有真实数据对接功能的完整版本，支持：
- ✅ 真实项目数据显示
- ✅ 多项目数据合并
- ✅ 完整的图层类型支持
- ✅ URL 编码解码
- ✅ 默认显示当天数据
- ✅ Dashboard 和 Analytics 视图
- ✅ 数据缓存和错误处理

---

**文档版本：** 1.0  
**创建日期：** 2026-01-27  
**作者：** iFlow CLI  
**项目：** RuAlive@烟囱鸭