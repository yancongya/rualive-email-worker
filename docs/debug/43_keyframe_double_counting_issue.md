# 关键帧数据翻倍问题

## 问题描述

在用户页面的统计标签中，关键帧数量显示为 **1142**，而实际数据库中存储的是 **571**，数据翻倍了。

## 问题分析

### 数据流程

1. **AE 扩展端扫描**
   - 扫描关键帧：`count = 571`
   - 发送到 Worker：`keyframe_count = 571`

2. **Worker 端处理**
   - 接收数据：`keyframe_count = 571`
   - 保存到数据库：`keyframe_count = 571` ✓

3. **前端数据转换（问题所在）**
   - 文件：`public/src/dataTransform.ts`
   - 第 165 行：初始化项目时分配关键帧数量
     ```typescript
     const projectKeyframes = Math.floor((workLog.keyframe_count || 0) / projectsJson.length);
     ```
     - 结果：`projectKeyframes = 571` ✓

   - 第 228-233 行：填充详细数据时累加关键帧
     ```typescript
     keyframesJson.forEach((k) => {
       const decodedProjectName = decodeProjectName(k.project);
       const project = projectMap.get(decodedProjectName);
       if (project) {
         project.details.keyframes[k.layer] = (project.details.keyframes[k.layer] || 0) + k.count;
         project.statistics.keyframes += k.count;  // ❌ 这里累加了！
         totalKeyframesFromJson += k.count;
       }
     });
     ```
     - 结果：`571 + 571 = 1142` ❌

## 问题原因

关键帧数据被计算了两次：
1. 初始化项目时，给 `statistics.keyframes` 分配了正确的总数（571）
2. 遍历关键帧 JSON 时，又累加了所有关键帧的 count，导致翻倍

## 修复方案

删除重复累加的那行代码，因为初始值已经包含了正确的总数：

### 修复前
```typescript
keyframesJson.forEach((k) => {
  const decodedProjectName = decodeProjectName(k.project);
  const project = projectMap.get(decodedProjectName);
  if (project) {
    project.details.keyframes[k.layer] = (project.details.keyframes[k.layer] || 0) + k.count;
    project.statistics.keyframes += k.count;  // ❌ 重复累加
    totalKeyframesFromJson += k.count;
  }
});
```

### 修复后
```typescript
keyframesJson.forEach((k) => {
  const decodedProjectName = decodeProjectName(k.project);
  const project = projectMap.get(decodedProjectName);
  if (project) {
    project.details.keyframes[k.layer] = (project.details.keyframes[k.layer] || 0) + k.count;
    // 🔍 不再累加到 statistics.keyframes，因为初始化时已经设置了正确的值
    totalKeyframesFromJson += k.count;
  }
});
```

## 验证步骤

1. 清除浏览器缓存（Ctrl+Shift+R）
2. 登录用户页面
3. 查看统计标签中的关键帧数量
4. 验证显示为 571（正确值）而不是 1142（错误值）

## 部署信息

- **修复文件**：`public/src/dataTransform.ts`
- **构建命令**：`cd public && npm run build`
- **部署命令**：`npx wrangler deploy`
- **部署时间**：2026-02-02
- **版本 ID**：405faecd-13a6-4d2f-8058-bef2ce93f1a3

## 相关提交

- **子模块**：`b7b6ea8` - fix: prevent keyframe data double-counting in user dashboard
- **主仓库**：`092d6af` - chore: update email-worker submodule with keyframe double-counting fix

## 其他相关问题

此修复同时也解决了之前在 Worker 端发现的数据合并累加问题（通过 `verifyUserOnly` 中间件和修改合并逻辑），但前端的数据转换问题是导致显示翻倍的主要原因。