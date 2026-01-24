# 详细数据查看功能修复说明

## 问题描述
用户在双击工作详情拟态窗中的统计卡片时，显示"暂无详细数据"。

## 根本原因
AE 扩展在上传数据时，没有包含 `details` 字段，导致后端无法提取详细数据。

## 修复内容

### 1. 后端修复（已完成）
- 修复了 `saveWorkData` 函数中的字段名错误
- 将 `project.details.keyframeCounts` 改为 `project.details.keyframes`

### 2. AE 扩展修复（已完成）
- 修改了 `emailManager.js` 中的 `getCurrentWorkData` 函数
- 在上传数据时添加了 `details: data.details` 字段

### 3. 前端部署（已完成）
- 重新构建并部署了前端代码到 KV 数据库

## 用户需要执行的操作

### 重要：重新加载 AE 扩展
由于 AE 扩展的代码已经更新，用户需要重新加载扩展才能使用新代码：

1. **关闭 After Effects**
2. **重新打开 After Effects**
3. **重新加载 RuAlive 扩展**：
   - 在 After Effects 中，打开"编辑" > "首选项" > "脚本和表达式"
   - 点击"重新加载脚本"按钮
   - 或者直接重启 After Effects

### 验证修复
重新加载扩展后，AE 扩展会自动上传包含 `details` 字段的数据。之后：

1. 打开用户面板：https://rualive-email-worker.cubetan57.workers.dev
2. 双击工作历史中的任意一行
3. 在详情拟态窗中，双击任意统计卡片（合成数量、关键帧数、效果数量、图层数量）
4. 应该能看到对应的详细数据列表

## 技术细节

### 数据流程
1. AE 扩展扫描项目，生成包含 `details` 字段的 JSON 文件
2. AE 扩展每分钟自动上传数据到后端
3. 后端从 `projects` 数组中提取详细数据
4. 后端将详细数据保存到数据库的 JSON 字段中
5. 前端双击统计卡片时，调用 API 获取详细数据
6. 前端在拟态窗中显示详细数据列表

### 数据库字段
- `compositions_json`: 合成列表
- `effects_json`: 效果列表
- `layers_json`: 图层列表
- `keyframes_json`: 关键帧列表

### 测试数据
如果需要立即测试，可以使用以下 SQL 更新测试数据：

```sql
UPDATE work_logs SET
  effects_json = JSON_ARRAY(
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','Keylight (1.2)'),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','简单阻塞工具'),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','快速方框模糊')
  ),
  layers_json = JSON_ARRAY(
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','右翅膀'),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','左翅膀'),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','name','左猫耳')
  ),
  keyframes_json = JSON_ARRAY(
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','layer','右翅膀','count',9),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','layer','左翅膀','count',9),
    JSON_OBJECT('project','52000钻-炽恋弦歌.aep','layer','左猫耳','count',15)
  )
WHERE id=348;
```

注意：测试数据会被 AE 扩展的上传数据覆盖，所以这只是临时测试用。

## 常见问题

### Q: 为什么数据又被覆盖了？
A: AE 扩展每分钟自动上传一次数据。如果 AE 扩展还在使用旧代码，上传的数据就不会包含 `details` 字段，导致详细数据被清空。

### Q: 如何确认 AE 扩展已经更新？
A: 检查 `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\js\emailManager.js` 文件的第 508 行，应该包含 `details: data.details`。

### Q: 如何查看数据库中的数据？
A: 使用以下命令：
```bash
npx wrangler d1 execute rualive --remote --command="SELECT compositions_json, effects_json, layers_json, keyframes_json FROM work_logs WHERE id=348;"
```

## 联系支持
如果问题仍然存在，请联系技术支持并提供以下信息：
1. After Effects 版本
2. AE 扩展是否已重新加载
3. 浏览器控制台的错误信息
4. 数据库查询结果