# AE 扩展开发指南 - User V6 数据对接

## 概述

本文档描述 AE 扩展如何与 User V6 进行数据对接，包括上传逻辑、数据格式和注意事项。

## 数据上传流程

### 1. 数据采集

AE 扩展通过以下方式采集数据：

```javascript
// 扫描所有模块
DataManager.scanAllModules(function(scanResult, error) {
  if (!error && scanResult) {
    console.log('扫描结果:', scanResult);
  }
});
```

**扫描结果包含：**
- 合成信息（数量、列表）
- 图层信息（数量、类型分布）
- 关键帧信息（数量、分布）
- 特效信息（数量、列表）

### 2. 获取项目信息

```javascript
DataManager.getCurrentProjectInfo(function(projectInfo, error) {
  if (!error && projectInfo && projectInfo.open) {
    console.log('项目名称:', projectInfo.name);
    console.log('项目路径:', projectInfo.path);
  }
});
```

**项目信息包含：**
- `name`: 项目名称（从文件名获取）
- `path`: 项目文件路径
- `hasFile`: 是否已保存
- `open`: 是否打开

### 3. 构建工作数据

```javascript
var workData = {
  work_hours: RuntimeTracker.getRuntime() / 3600,  // 转换为小时
  keyframe_count: scanResult.keyframes.count,
  json_size: 0,
  composition_count: scanResult.compositions.count,
  layer_count: scanResult.layers.count,
  effect_count: scanResult.effects.count,
  projects: [
    {
      name: projectInfo.name,      // 使用真实项目名称
      path: projectInfo.path,
      statistics: {
        compositions: scanResult.compositions.count,
        layers: scanResult.layers.count,
        keyframes: scanResult.keyframes.count,
        effects: scanResult.effects.count
      },
      details: {
        compositions: scanResult.compositions.compositions,
        layers: scanResult.layers.layers,
        keyframes: scanResult.keyframes.keyframes,
        effects: scanResult.effects.effects
      },
      accumulatedRuntime: RuntimeTracker.getRuntime()
    }
  ]
};
```

### 4. 发送到后端

```javascript
EmailManager.sendWorkData(workData);
```

## 关键函数

### uploadWorkData(scanResult)

上传工作数据的主函数。

**参数：**
- `scanResult` (可选): 扫描结果，如果提供则直接使用，否则重新扫描

**逻辑：**
1. 检查邮件功能是否启用
2. 如果提供了扫描结果：
   - 异步获取项目信息
   - 转换为工作数据格式
   - 发送到后端
3. 如果没有提供扫描结果：
   - 重新扫描
   - 获取项目信息
   - 转换为工作数据格式
   - 发送到后端

**示例：**
```javascript
// 方式 1: 提供扫描结果
var scanResult = DataManager.scanAllModules();
EmailManager.uploadWorkData(scanResult);

// 方式 2: 不提供扫描结果（内部会重新扫描）
EmailManager.uploadWorkData();
```

### convertScanResultToWorkData(scanResult, projectInfo)

将扫描结果转换为后端期望的工作数据格式。

**参数：**
- `scanResult`: 扫描结果
- `projectInfo`: 项目信息

**返回：**
- 工作数据对象或 null

**重要说明：**
- 必须提供 `projectInfo` 参数
- 使用 `projectInfo.name` 而不是硬编码 "Current Project"
- 使用 `projectInfo.path` 作为项目路径

## 数据格式说明

### 项目名称

**正确格式：**
- 已保存项目: `1w钻-星月幻想.aep`
- 未保存项目: `Project_2026-01-27`

**错误格式：**
- ❌ `Current Project` - 硬编码值
- ❌ `Untitled` - 默认值

### 运行时间

**单位：** 秒

**计算：**
```javascript
var runtimeSeconds = RuntimeTracker.getRuntime();  // 返回秒数
var runtimeHours = runtimeSeconds / 3600;        // 转换为小时
```

### 图层分布

**格式：** 对象格式，键为图层类型，值为数量

```javascript
layers: {
  video: 44,
  image: 16,
  sequence: 13,
  designFile: 164,
  sourceFile: 1,
  nullSolidLayer: 67,
  shapeLayer: 8,
  textLayer: 2,
  adjustmentLayer: 1,
  lightLayer: 2,
  cameraLayer: 1
}
```

### 关键帧分布

**格式：** 对象格式，键为图层名称，值为关键帧数量

```javascript
keyframes: {
  "Layer 1": 150,
  "Layer 2": 200,
  "Layer 3": 80
}
```

### 特效列表

**格式：** 对象数组

```javascript
effects: [
  { layer: "Layer 1", effectName: "Gaussian Blur" },
  { layer: "Layer 1", effectName: "Motion Blur" },
  { layer: "Layer 2", effectName: "Color Correction" }
]
```

## 注意事项

### 1. 异步获取项目信息

**错误做法：**
```javascript
// ❌ 错误：在同步函数中使用异步调用
var projectName = 'Current Project';
DataManager.getCurrentProjectInfo(function(projectInfo) {
  projectName = projectInfo.name;  // 这个赋值不会生效
});
return { name: projectName, ... };
```

**正确做法：**
```javascript
// ✅ 正确：在外层异步函数中获取项目信息
DataManager.getCurrentProjectInfo(function(projectInfo, error) {
  if (!error && projectInfo && projectInfo.open) {
    var workData = convertScanResultToWorkData(scanResult, projectInfo);
    sendWorkData(workData);
  }
});
```

### 2. 项目未保存的情况

如果项目未保存（新建项目），`projectInfo.name` 可能返回 `undefined` 或默认值。

**处理方式：**
```javascript
var projectName = projectInfo && projectInfo.name ? projectInfo.name : 'Project_' + dateStr;
```

### 3. 运行时间跟踪

确保 `RuntimeTracker` 已正确初始化：

```javascript
// 检查 RuntimeTracker 是否可用
if (typeof RuntimeTracker !== 'undefined') {
  var runtime = RuntimeTracker.getRuntime();
  console.log('运行时间（秒）:', runtime);
} else {
  console.warn('RuntimeTracker 不可用');
}
```

### 4. 错误处理

```javascript
DataManager.getCurrentProjectInfo(function(projectInfo, error) {
  if (error) {
    console.error('获取项目信息失败:', error);
    return;
  }
  
  if (!projectInfo || !projectInfo.open) {
    console.warn('没有打开的项目');
    return;
  }
  
  // 处理数据...
});
```

## 调试技巧

### 1. 查看扫描结果

```javascript
DataManager.scanAllModules(function(scanResult, error) {
  if (!error && scanResult) {
    console.log('=== 扫描结果 ===');
    console.log('合成:', scanResult.compositions);
    console.log('图层:', scanResult.layers);
    console.log('关键帧:', scanResult.keyframes);
    console.log('特效:', scanResult.effects);
  }
});
```

### 2. 查看项目信息

```javascript
DataManager.getCurrentProjectInfo(function(projectInfo, error) {
  if (!error && projectInfo) {
    console.log('=== 项目信息 ===');
    console.log('名称:', projectInfo.name);
    console.log('路径:', projectInfo.path);
    console.log('已保存:', projectInfo.hasFile);
    console.log('已打开:', projectInfo.open);
  }
});
```

### 3. 查看上传数据

```javascript
var workData = convertScanResultToWorkData(scanResult, projectInfo);
console.log('=== 工作数据 ===');
console.log(JSON.stringify(workData, null, 2));
```

### 4. 查看后端响应

```javascript
EmailManager.sendWorkData(workData);
// 在 Network 标签中查看请求和响应
```

## 常见问题

### Q1: 为什么项目名称显示为 "Current Project"？

**A:** 
- 确保项目已保存（.aep 文件）
- 确保使用 `projectInfo.name` 而不是硬编码值
- 确保在异步回调中处理项目信息

### Q2: 为什么运行时间为 0？

**A:** 
- 确保 `RuntimeTracker` 已初始化
- 确保已开始运行时间跟踪
- 检查 `RuntimeTracker.getRuntime()` 的返回值

### Q3: 为什么上传失败？

**A:** 
- 检查网络连接
- 检查邮件功能是否启用
- 检查浏览器控制台是否有错误
- 检查后端是否正常运行

### Q4: 为什么上传后看不到数据？

**A:** 
- 确保后端已部署
- 确保使用正确的 API 端点
- 检查数据库中是否有数据
- 刷新 User V6 页面

## 最佳实践

### 1. 定期上传

建议每隔一段时间（如 30 分钟）上传一次数据，避免数据丢失。

### 2. 项目保存

始终保存项目后再上传，确保项目名称正确。

### 3. 错误处理

始终添加错误处理，避免上传失败导致程序崩溃。

### 4. 日志记录

记录关键操作和数据，便于调试。

```javascript
console.log('[上传数据] 开始上传...');
console.log('[上传数据] 项目名称:', projectInfo.name);
console.log('[上传数据] 工作时长:', workData.work_hours);
console.log('[上传数据] 上传完成');
```

## 集成 User V6

### 上传单个项目

```javascript
// 1. 打开项目
// 2. 扫描数据
var scanResult = DataManager.scanAllModules();

// 3. 上传数据
EmailManager.uploadWorkData(scanResult);

// 4. 在 User V6 中查看数据
```

### 上传多个项目

```javascript
// 1. 打开第一个项目
EmailManager.uploadWorkData();

// 2. 打开第二个项目
EmailManager.uploadWorkData();

// 3. 在 User V6 中查看合并后的数据
```

## 相关文档

- [User V6 API 文档](../api/08_user_v6_api.md)
- [User V6 数据库对接修复](../debug/24_user_v6_database_integration_fixes.md)
- [数据管理器开发指南](../../docs/api/06_4-加载机制.md)

---

**文档版本：** 1.0  
**创建日期：** 2026-01-27  
**作者：** iFlow CLI  
**项目：** RuAlive@烟囱鸭