# 效果数据优化方案

## 当前问题

### 1. 数据重复
- `details.effects`: 效果名称列表（去重）
- `details.effectCounts`: 效果名称和计数（去重）
- `statistics.effects`: 所有效果的总数（包含重复）

### 2. 统计不准确
- `statistics.effects = 123` 是所有图层效果的总和（重复计算）
- 应该是 `details.effects.length = 28`（不重复的效果数量）

## 优化方案

### 1. AE 扩展数据结构优化

**修改文件**: `js/dataManager.js:1725`

**修改前**:
```javascript
statistics: {
    compositions: scanResult.compositions.count || 0,
    layers: scanResult.layers.count || 0,
    keyframes: scanResult.keyframes.count || 0,
    effects: scanResult.effects.count || 0  // 包含重复
}
```

**修改后**:
```javascript
statistics: {
    compositions: scanResult.compositions.count || 0,
    layers: scanResult.layers.count || 0,
    keyframes: scanResult.keyframes.count || 0,
    effects: Object.keys(effectNames).length  // 不重复的效果数量
}
```

### 2. 数据结构说明

#### 优化后的 JSON 结构
```json
{
  "projectId": "240c62c4",
  "name": "52000钻-炽恋弦歌.aep",
  "path": "E:\\工作\\...",
  "accumulatedRuntime": 2257,
  "statistics": {
    "compositions": 32,
    "layers": 330,
    "keyframes": 315,
    "effects": 28  // 不重复的效果数量
  },
  "details": {
    "compositions": ["开花1", "开花2", ...],
    "layers": ["音符 1", "音符 2", ...],
    "keyframes": {
      "玫瑰花生长出来...": 4,
      "音符 1": 8,
      ...
    },
    "effects": ["Keylight (1.2)", "简单阻塞工具", ...],  // 不重复的效果列表
    "effectCounts": {  // 每种效果的使用次数
      "Keylight (1.2)": 10,
      "简单阻塞工具": 10,
      ...
    }
  }
}
```

### 3. 数据流转说明

#### AE 扩展 → 后端 → 前端

**AE 扩展生成数据**:
- `statistics.effects`: 28（不重复的效果数量）
- `details.effects`: 28 个效果名称（去重）
- `details.effectCounts`: 每种效果的使用次数

**后端处理**:
- 直接使用 `workData.effect_count`（28）
- 不重复计算
- 保存到数据库 `effect_count` 字段

**前端显示**:
- 单个项目：显示 `effect_count`（28）
- 多个项目：累加各项目的 `effect_count`
- 总效果数 = 项目A效果数 + 项目B效果数 + ...

### 4. 统计逻辑

#### 单个项目
- 显示该项目的 `statistics.effects`（不重复的效果数量）

#### 多个项目（同一天）
- 总效果数 = 项目A效果数 + 项目B效果数 + ...
- 例如：项目A有28种效果，项目B有15种效果，总效果数 = 43

#### 注意
- 不进行跨项目去重
- 因为不同项目使用相同效果是正常的
- 统计的是"使用了多少种效果"，而不是"有哪些独特的效果"

### 5. 验证方法

#### 查看生成的 JSON
```bash
# 查看最新的 JSON 文件
ls -lt temp/*.json | head -1
cat temp/2026-01-19-*.json | jq '.statistics.effects'
```

#### 查看数据库
```bash
# 查看效果数量
npx wrangler d1 execute rualive --remote --command="SELECT work_date, project_count, effect_count FROM work_logs ORDER BY work_date DESC LIMIT 5;"
```

#### 查看前端
- 打开用户面板
- 查看工作历史表格中的"效果"列
- 双击查看详情，确认效果数量

### 6. 优势

#### 数据准确性
- `statistics.effects` 反映实际使用的效果种类数量
- 避免重复计算导致的虚高

#### 数据一致性
- `statistics.effects` = `details.effects.length`
- 数据来源统一，不会出现矛盾

#### 可维护性
- 减少数据冗余
- 逻辑清晰，易于理解和维护

### 7. 兼容性

#### 向后兼容
- 旧数据仍然可以正常显示
- 新数据使用优化后的统计方式

#### 前端无需修改
- 前端代码已经正确处理
- 只是数据来源更准确了

### 8. 实施步骤

1. ✅ 修改 AE 扩展 `dataManager.js`
2. ✅ 重新加载 AE 扩展
3. ✅ 验证生成的 JSON 数据
4. ✅ 验证数据库中的数据
5. ✅ 验证前端显示

### 9. 示例对比

#### 优化前
```json
{
  "statistics": {
    "effects": 123  // 所有图层效果总数（重复计算）
  },
  "details": {
    "effects": ["Keylight (1.2)", ...],  // 28 个效果
    "effectCounts": {
      "Keylight (1.2)": 10,
      ...
    }
  }
}
```

#### 优化后
```json
{
  "statistics": {
    "effects": 28  // 不重复的效果数量
  },
  "details": {
    "effects": ["Keylight (1.2)", ...],  // 28 个效果
    "effectCounts": {
      "Keylight (1.2)": 10,
      ...
    }
  }
}
```

## 总结

通过这次优化：
1. ✅ 消除了数据重复
2. ✅ 提高了统计准确性
3. ✅ 保持了数据一致性
4. ✅ 简化了逻辑
5. ✅ 无需修改前端代码

现在 `statistics.effects` 正确反映了项目中使用的不重复效果数量。