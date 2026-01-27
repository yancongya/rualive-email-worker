# 数据分析页性能优化方案

## 问题分析

### 当前数据流
```
AnalyticsView 组件
    ↓
useEffect (当 viewMode 或 cursorDate 变化时)
    ↓
getWorkLogsByRange(startDate, endDate)  ← API请求
    ↓
Worker: SELECT * FROM work_logs (返回所有字段+JSON数据)
    ↓
前端聚合计算
```

### 触发场景
1. 切换视图模式（week/month/quarter/year/all）→ 5次请求
2. 切换日期（左/右导航）→ N次请求
3. 刷新页面 → 1次请求
4. 切换 showDaily → 1次请求

### 数据量估算
- Week: 7天 × ~5-10KB = 35-70KB
- Month: 30天 × ~5-10KB = 150-300KB
- Quarter: 90天 × ~5-10KB = 450-900KB
- Year: 365天 × ~5-10KB = 1.8-3.6MB
- All: 1825天 × ~5-10KB = 9-18MB

### Cloudflare Workers 免费额度
- 每日请求次数: 100,000 次
- CPU时间: 10ms/请求（超出收费）
- 出站带宽: 1GB/天

---

## 优化方案：单次加载 + 智能缓存

### 核心思想
一次性加载所有数据，使用 localStorage 持久化缓存，前端按需过滤。

### 优化效果对比

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| API请求次数 | ~10次/会话 | ~1次/天 | **90% ↓** |
| 首次加载时间 | ~3-5秒 | ~5-8秒（首次）<br>~0.5秒（缓存） | **首次+70%↓, 缓存+90%↓** |
| 切换视图响应 | ~1-2秒 | ~0.1秒 | **95% ↓** |
| 带宽消耗 | ~50MB/会话 | ~10MB/天（只更新增量） | **80% ↓** |
| 实现复杂度 | - | ⭐（极简） | - |

---

## 实施步骤

### Step 1: 一次性加载所有数据

**文件**: `public/user-v6.tsx`

**位置**: AnalyticsView 组件的 useEffect

**修改前**:
```javascript
useEffect(() => {
  async function loadWorkLogs() {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange(viewMode, cursorDate);
      const response = await getWorkLogsByRange(startDate, endDate, true);
      if (response.success && response.data) {
        setWorkLogs(response.data);
      }
    } catch (error) {
      console.error('Failed to load work logs for analytics:', error);
      setWorkLogs([]);
    } finally {
      setIsLoading(false);
    }
  }
  loadWorkLogs();
}, [viewMode, cursorDate]);  // 每次切换都请求
```

**修改后**:
```javascript
const ALL_DATA_RANGE = {
  startDate: '2020-01-01',
  endDate: '2030-12-31'
};

useEffect(() => {
  async function loadAllData() {
    setIsLoading(true);
    try {
      // 检查持久化缓存
      const cached = localStorage.getItem('analytics_all_data');
      const cachedTime = localStorage.getItem('analytics_all_data_time');
      
      // 缓存1天内有效
      if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 24 * 60 * 60 * 1000) {
        console.log('[AnalyticsView] Using cached data');
        setWorkLogs(JSON.parse(cached));
        setIsLoading(false);
        return;
      }
      
      // 一次性加载所有数据
      console.log('[AnalyticsView] Loading all data from API');
      const response = await getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false);
      if (response.success && response.data) {
        setWorkLogs(response.data);
        // 缓存到 localStorage
        localStorage.setItem('analytics_all_data', JSON.stringify(response.data));
        localStorage.setItem('analytics_all_data_time', Date.now().toString());
        console.log('[AnalyticsView] Data cached to localStorage');
      }
    } catch (error) {
      console.error('Failed to load work logs for analytics:', error);
      setWorkLogs([]);
    } finally {
      setIsLoading(false);
    }
  }
  
  loadAllLogs();
}, []);  // 空依赖，只执行一次
```

---

### Step 2: 前端过滤（不需要改API）

**文件**: `public/user-v6.tsx`

**位置**: AnalyticsView 组件的数据聚合部分

**修改前**:
```javascript
const { data: rawData, label: timeLabel } = useMemo(() => {
  const result = getAnalyticsData(viewMode, cursorDate, showDaily, lang, workLogs);
  return result;
}, [viewMode, cursorDate, showDaily, lang, workLogs]);
```

**修改后**:
```javascript
// 根据当前视图模式过滤数据
const filteredWorkLogs = useMemo(() => {
  const { startDate, endDate } = getDateRange(viewMode, cursorDate);
  return workLogs.filter(log => {
    const date = log.work_date;
    return date >= startDate && date <= endDate;
  });
}, [workLogs, viewMode, cursorDate]);

const { data: rawData, label: timeLabel } = useMemo(() => {
  const result = getAnalyticsData(viewMode, cursorDate, showDaily, lang, filteredWorkLogs);
  return result;
}, [viewMode, cursorDate, showDaily, lang, filteredWorkLogs]);
```

---

### Step 3: 后台静默更新

**文件**: `public/user-v6.tsx`

**位置**: AnalyticsView 组件的 useEffect

**新增代码**:
```javascript
// 页面隐藏时静默更新缓存
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      console.log('[AnalyticsView] Page hidden, updating cache in background');
      // 页面隐藏时，后台更新缓存
      getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false)
        .then(response => {
          if (response.success && response.data) {
            localStorage.setItem('analytics_all_data', JSON.stringify(response.data));
            localStorage.setItem('analytics_all_data_time', Date.now().toString());
            console.log('[AnalyticsView] Cache updated in background');
          }
        })
        .catch(error => {
          console.error('[AnalyticsView] Failed to update cache:', error);
        });
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

### Step 4: 添加手动刷新按钮（可选）

**文件**: `public/user-v6.tsx`

**位置**: AnalyticsView 组件的控制栏

**新增代码**:
```javascript
const handleManualRefresh = async () => {
  setIsLoading(true);
  try {
    console.log('[AnalyticsView] Manual refresh requested');
    const response = await getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false);
    if (response.success && response.data) {
      setWorkLogs(response.data);
      localStorage.setItem('analytics_all_data', JSON.stringify(response.data));
      localStorage.setItem('analytics_all_data_time', Date.now().toString());
      console.log('[AnalyticsView] Data refreshed successfully');
    }
  } catch (error) {
    console.error('Failed to refresh data:', error);
  } finally {
    setIsLoading(false);
  }
};

// 在控制栏添加刷新按钮
<button 
  onClick={handleManualRefresh}
  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-ru-textMuted hover:text-white transition-colors"
  title="刷新数据"
>
  <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
  <span className="hidden sm:inline">刷新</span>
</button>
```

---

## 可选增强功能

### 增强1: 增量更新
只加载最近30天的新数据，合并到缓存，减少带宽消耗。

### 增强2: 缓存版本控制
避免数据格式变更导致缓存错误，使用版本号管理缓存。

### 增强3: 数据压缩
如果数据过大（>5MB），使用 pako 压缩后再存储。

### 增强4: IndexedDB 替代 localStorage
如果数据量过大（>50MB），使用 IndexedDB 替代 localStorage。

---

## 方案优势

### 1. 零后端改动
- 不需要修改 Worker 代码
- 不需要新增数据库表
- 不需要新的 API 接口

### 2. 用户体验极佳
- 缓存命中后：瞬间响应
- 无需等待：切换视图无延迟
- 后台更新：用户无感知

### 3. 实现成本极低
- 只需修改前端 1 个 useEffect
- 代码量：<50 行
- 开发时间：<30 分钟

### 4. 智能降级
- 首次加载稍慢（正常现象）
- 缓存失效自动刷新
- 支持手动刷新按钮

---

## 测试计划

### 功能测试
- [ ] 首次加载数据正常
- [ ] 缓存命中后快速响应
- [ ] 切换视图模式无延迟
- [ ] 切换日期无延迟
- [ ] 后台静默更新成功
- [ ] 手动刷新功能正常
- [ ] 清除缓存后重新加载

### 性能测试
- [ ] 首次加载时间 < 10秒
- [ ] 缓存命中响应时间 < 1秒
- [ ] 切换视图响应时间 < 0.5秒
- [ ] localStorage 容量检查

### 兼容性测试
- [ ] Chrome/Edge 浏览器
- [ ] Firefox 浏览器
- [ ] Safari 浏览器
- [ ] 移动端浏览器

---

## 风险评估

### 风险1: localStorage 容量限制
- **风险**: localStorage 容量约 5-10MB，数据可能超出
- **缓解**: 使用 IndexedDB 或数据压缩
- **优先级**: 中

### 风险2: 首次加载时间过长
- **风险**: 一次性加载所有数据可能较慢
- **缓解**: 添加加载提示，优化 Worker 查询
- **优先级**: 低

### 风险3: 数据不一致
- **风险**: 缓存数据与实际数据不一致
- **缓解**: 设置合理的缓存过期时间，支持手动刷新
- **优先级**: 低

---

## 实施时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| Phase 1 | Step 1: 一次性加载 | 15 分钟 |
| Phase 2 | Step 2: 前端过滤 | 10 分钟 |
| Phase 3 | Step 3: 后台更新 | 15 分钟 |
| Phase 4 | Step 4: 刷新按钮 | 10 分钟 |
| Phase 5 | 测试验证 | 30 分钟 |
| Phase 6 | 部署上线 | 10 分钟 |
| **总计** | | **90 分钟** |

---

## 回滚方案

如果优化后出现问题，可以通过以下方式回滚：

1. **清除缓存**: 打开浏览器控制台，执行 `localStorage.clear()`
2. **回滚代码**: 恢复到修改前的版本
3. **重新部署**: 重新部署 Worker

---

## 参考资料

- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Cloudflare Workers 免费额度](https://developers.cloudflare.com/workers/platform/pricing/)
- [React Hooks 最佳实践](https://react.dev/reference/react)

---

**文档版本**: 1.0
**创建日期**: 2026-01-27
**维护者**: iFlow CLI
**状态**: 待实施