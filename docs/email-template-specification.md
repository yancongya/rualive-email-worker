# 邮件模板规范

**用途**：生成用于邮件通知的 HTML 网页模板

## 函数

```javascript
export function generateDailySummaryEmail(user, workData, config)
export function generateWarningEmail(user, workData, config)
```

返回：HTML 字符串

## 变量

### user
- username - 用户名
- email - 邮箱

### workData
- work_hours - 工作时长（小时）
- project_count - 项目数
- composition_count - 合成数
- keyframe_count - 关键帧数
- layer_count - 图层数
- effect_count - 特效数
- last_work_date - 最后工作日期

### config
- emergency_name - 紧急联系人姓名
- emergency_email - 紧急联系人邮箱
- thresholds.minWorkHours - 最小工作时长（小时）

### 自动生成
- date - 当前日期（中文格式）
- hoursText - 格式化工作时长

## 要求
- 邮件客户端兼容（Gmail、Outlook、Apple Mail）
- 使用内联 CSS
- 使用模板字符串
- 使用可选链（?.）
- 提供默认值（|| 0）
- 响应式设计（移动端适配）