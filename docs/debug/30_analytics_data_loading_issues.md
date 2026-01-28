# 数据分析页数据加载问题调试

## 问题描述

在数据分析页（Analytics tab）中，第一次加载数据时显示为空，但刷新后（使用缓存）显示正常。

### 控制台日志

**第一次加载（数据为空）**:
```
[UserV6] Loading data for date: 2026-01-28
[UserV6] API response: {success: true, data: Array(1)}
[UserV6] Work log data: {id: 5160, user_id: 'user_1768671860467_uzdw8qz8m', work_date: '2026-01-28', work_hours: 1.03, keyframe_count: 23540, …}
[UserV6] Transformed data: {date: '2026-01-28', projects: Array(1)}
[AnalyticsView] Aggregated data: {data: Array(0), label: 'Week 1: 26/JAN - 1/FEB'}
```

**缓存命中（数据正常）**:
```
[AnalyticsView] Using cached data
[AnalyticsView] Filtering workLogs: {
  total: 1,
  dateRange: { startDate: '2026-01-26', endDate: '2026-02-01' },
  firstLogDate: '2026-01-28',
  lastLogDate: '2026-01-28'
}
[AnalyticsView] Filtered result: { count: 1 }
[AnalyticsView] Aggregated data: {data: Array(1), label: 'Week 1: 26/JAN - 1/FEB'}
```

### 问题分析

从日志可以看出：
1. 第一次加载时，没有看到 `Filtering workLogs` 日志，说明 filteredWorkLogs 的 useMemo 可能没有执行
2. 缓存命中后，`Filtering workLogs` 日志正常显示，过滤结果正确（count: 1）

### 可能的原因

1. **异步加载问题**：workLogs 状态还没有更新完成，useMemo 就已经执行了
2. **useMemo 依赖顺序问题**：workLogs, viewMode, cursorDate 三个依赖项可能导致 useMemo 在错误的时机执行
3. **过滤逻辑问题**：虽然缓存命中时正常，但第一次加载时可能有边界情况

### 数据流追踪

#### 正常流程（缓存命中）
```
1. 组件挂载
   ↓
2. useEffect 执行，检查 localStorage
   ↓
3. 找到缓存，setWorkLogs(cachedData)
   ↓
4. workLogs 更新，触发 filteredWorkLogs 的 useMemo
   ↓
5. filteredWorkLogs 过滤数据，返回结果
   ↓
6. rawData 的 useMemo 执行，调用 getAnalyticsData
   ↓
7. 显示数据 ✓
```

#### 异常流程（第一次加载）
```
1. 组件挂载
   ↓
2. useEffect 执行，检查 localStorage
   ↓
3. 没有缓存，调用 API
   ↓
4. API 返回数据，setWorkLogs(response.data)
   ↓
5. ❓ workLogs 更新，但 filteredWorkLogs 的 useMemo 可能没有执行
   ↓
6. ❓ rawData 的 useMemo 执行，但 filteredWorkLogs 为空
   ↓
7. 显示空数据 ✗
```

### 调试日志添加

需要在以下关键点添加调试日志：

1. **workLogs 状态变化**：
   ```javascript
   useEffect(() => {
     console.log('[AnalyticsView] workLogs changed:', {
       length: workLogs.length,
       first: workLogs[0],
       last: workLogs[workLogs.length - 1]
     });
   }, [workLogs]);
   ```

2. **filteredWorkLogs useMemo 执行**：
   ```javascript
   const filteredWorkLogs = useMemo(() => {
     console.log('[AnalyticsView] filteredWorkLogs useMemo executing...');
     // ... 现有逻辑
   }, [workLogs, viewMode, cursorDate]);
   ```

3. **getAnalyticsData 调用前**：
   ```javascript
   console.log('[AnalyticsView] Calling getAnalyticsData with:', {
     viewMode,
     cursorDate,
     showDaily,
     workLogsCount: filteredWorkLogs.length
   });
   ```

4. **getDateRange 结果**：
   ```javascript
   const { startDate, endDate } = getDateRange(viewMode, cursorDate);
   console.log('[AnalyticsView] Date range:', { startDate, endDate, viewMode, cursorDate });
   ```

### 临时解决方案

在数据加载时显示加载状态，确保数据完全加载后再渲染：

```javascript
const [isDataReady, setIsDataReady] = useState(false);

useEffect(() => {
  setIsDataReady(workLogs.length > 0);
}, [workLogs]);

// 在组件中
{isDataReady ? (
  <div> {/* 显示数据分析内容 */} </div>
) : (
  <div>Loading...</div>
)}
```

### 待验证

1. 添加完整调试日志，追踪数据流
2. 验证 useEffect 和 useMemo 的执行顺序
3. 检查是否有并发更新问题
4. 验证日期格式和比较逻辑

### 预期修复时间

根据调试结果，预计需要 10-30 分钟完成修复。