# 翻译键结构冲突问题修复

## 问题描述

在 admin-v2 管理后台中，翻译键显示为英文或键名，而不是翻译后的中文文本。

### 表现症状

- 显示为键名：`ACTIONS.CREATE`、`LABELS.CODE`、`INVITES.MESSAGES.INVITEDETAILS`
- 显示为英文：`labels.code`、`labels.maxUses`、`labels.usage`、`labels.expires`、`labels.createdAt`、`labels.createdBy`、`@actions.close`
- 显示日期错误：`Invalid Date`

### 影响范围

- 邀请码管理页面
- 用户管理页面
- API密钥页面
- 邮件日志页面

## 根本原因

翻译文件结构存在键冲突，嵌套对象中包含了重复的键名。

### 错误的结构

```json
{
  "labels": {
    "code": "邀请码",
    "usage": "使用情况",
    "expires": "过期时间",
    "maxUses": "最大使用次数",
    "createdAt": "创建时间",
    "createdBy": "创建者"
  },
  "invites": {
    "headers": {...},
    "subheaders": {...},
    "labels": {  // ❌ 重复的 labels 键
      "code": "邀请码",
      "usage": "使用情况",
      "expires": "过期时间"
    },
    "messages": {...}
  },
  "users": {
    "labels": {...}  // ❌ 重复的 labels 键
  },
  "api": {
    "labels": {...}  // ❌ 重复的 labels 键
  },
  "logs": {
    "labels": {...}  // ❌ 重复的 labels 键
  }
}
```

### 冲突原因

1. 顶层有统一的 `labels`、`actions`、`status` 键
2. 嵌套的 `invites`、`users`、`api`、`logs` 对象中又各自定义了 `labels` 键
3. 导致翻译键查找时出现冲突，无法正确匹配

## 解决方案

移除嵌套对象中的重复键，只保留顶层的通用键。

### 修复后的结构

```json
{
  "labels": {
    "time": "时间",
    "recipient": "收件人",
    "subject": "主题",
    "status": "状态",
    "joined": "加入日期",
    "code": "邀请码",
    "usage": "使用情况",
    "expires": "过期时间",
    "maxUses": "最大使用次数",
    "editingUser": "正在编辑用户",
    "limit": "每日限制",
    "createdAt": "创建时间",
    "createdBy": "创建者"
  },
  "actions": {
    "create": "创建",
    "delete": "删除",
    "edit": "编辑",
    "reset": "重置密码",
    "set": "设置密钥",
    "test": "测试密钥",
    "save": "保存",
    "cancel": "取消",
    "close": "关闭",
    "view": "查看"
  },
  "status": {
    "success": "成功",
    "failed": "失败",
    "sent": "已发送",
    "pending": "等待中"
  },
  "invites": {
    "headers": {
      "invites": "邀请码管理",
      "create": "创建邀请码"
    },
    "subheaders": {
      "invites": "管理用户注册邀请码"
    },
    "messages": {
      "noKeys": "暂无邀请码",
      "confirmTitle": "确认删除",
      "confirmDesc": "确定要删除这个邀请码吗？",
      "deleted": "邀请码已删除",
      "ticketPrinted": "邀请码已创建",
      "inviteDetails": "邀请码详情"
    }
  },
  "users": {
    "headers": {
      "users": "用户管理"
    },
    "subheaders": {
      "users": "管理注册用户和权限"
    },
    "actions": {
      "edit": "编辑",
      "reset": "重置密码",
      "delete": "删除"
    },
    "table": {
      "userIdentity": "用户信息",
      "role": "角色"
    },
    "messages": {
      "resetConfirm": "确定要重置 {username} 的密码吗？",
      "passwordReset": "密码已重置",
      "deleteUserConfirm": "确定要删除 {username} 吗？"
    }
  },
  "api": {
    "headers": {
      "api": "API密钥管理"
    },
    "subheaders": {
      "api": "管理邮件发送API密钥"
    },
    "actions": {
      "set": "设置密钥",
      "test": "测试密钥",
      "delete": "删除密钥",
      "addKey": "添加密钥"
    },
    "messages": {
      "keySet": "API密钥已设置",
      "keyDeleted": "API密钥已删除",
      "keyTested": "API密钥测试成功",
      "revokeKeyConfirm": "确定要撤销此API密钥吗？",
      "keyRevoked": "API密钥已撤销",
      "apiKeyHelp": "输入Resend API密钥以启用邮件发送功能",
      "currentConfig": "当前配置",
      "noKeyConfigured": "未配置密钥",
      "revokeKey": "撤销密钥",
      "connectionValid": "连接有效",
      "perDay": "每天",
      "ban": "封禁",
      "vip": "VIP",
      "loadingData": "正在加载数据...",
      "totalSent": "总发送",
      "totalFailed": "总失败"
    }
  },
  "logs": {
    "headers": {
      "logs": "邮件日志"
    },
    "subheaders": {
      "logs": "查看邮件发送记录"
    },
    "messages": {
      "loading": "正在加载日志...",
      "logDetails": "日志详情",
      "deliveryRate": "交付率",
      "sent24h": "24小时已发送",
      "failed24h": "24小时失败",
      "error": "错误",
      "noLogs": "暂无日志记录"
    }
  }
}
```

### 修复原则

1. **顶层通用键**：`labels`、`actions`、`status` 作为唯一的通用键
2. **嵌套特定键**：`invites`、`users`、`api`、`logs` 只包含特定的 `headers`、`subheaders`、`messages`、`table` 键
3. **避免重复**：嵌套对象不重复定义通用键

## 修复步骤

### 1. 修改中文翻译文件

**文件路径**: `public/admin-v2/locals/zh.json`

移除嵌套对象中的 `labels` 键，保留顶层 `labels` 键。

### 2. 修改英文翻译文件

**文件路径**: `public/admin-v2/locals/en.json`

同样的结构修改。

### 3. 复制到 dist 目录

```bash
copy public\admin-v2\locals\zh.json public\dist\locals\zh.json
copy public\admin-v2\locals\en.json public\dist\locals\en.json
```

### 4. 重新构建前端

```bash
cd public\admin-v2
npx vite build
```

### 5. 复制构建产物

```bash
Copy-Item -Path "public\admin-v2\dist\*" -Destination "public\dist\" -Recurse -Force
```

### 6. 部署到 Cloudflare

```bash
npx wrangler deploy --assets public/dist
```

### 7. 提交代码

```bash
git add public/admin-v2/locals/zh.json public/admin-v2/locals/en.json
git commit -m "fix: remove duplicate labels keys from translation file structure"
```

## 验证

### 检查项

- [x] 邀请码管理页面：所有标签显示为中文
- [x] 用户管理页面：所有标签显示为中文
- [x] API密钥页面：所有标签显示为中文
- [x] 邮件日志页面：所有标签显示为中文
- [x] 按钮文本显示为中文
- [x] 消息提示显示为中文
- [x] 日期格式正确显示

### 部署信息

- **版本 ID**: a0525f74-c8ed-4005-95f4-3c4bdc625ac4
- **部署时间**: 2026-02-01
- **URL**: https://rualive-email-worker.cubetan57.workers.dev

## 相关问题

### 问题 1: 日期显示 "Invalid Date"

**原因**: 日期格式化时没有进行 null 检查

**修复**: 在 admin-v2.tsx 中添加 null 检查

```typescript
{invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : '-'}
{invite.createdAt ? new Date(invite.createdAt).toLocaleString() : '-'}
```

### 问题 2: 邀请码显示为空

**原因**: API 字段名不匹配（`codes` vs `inviteCodes`）

**修复**: 在 fetchInvites 函数中使用正确的字段名

```typescript
const data = await apiClient('/admin/invite-codes');
if (data.success) setInvites(data.codes || []);  // 不是 data.inviteCodes
```

## 经验教训

### 1. 翻译文件结构设计

- 避免在嵌套对象中重复定义通用键
- 使用单一数据源原则
- 保持翻译键的唯一性和一致性

### 2. 调试技巧

- 使用浏览器开发者工具检查翻译键的实际值
- 检查控制台是否有翻译相关的错误
- 对比代码中的翻译键路径与翻译文件中的实际路径

### 3. 部署流程

- 修改翻译文件后需要重新构建前端
- 复制翻译文件到 dist 目录
- 部署到 Cloudflare 时需要指定 assets 参数

## 参考资料

- **相关文档**:
  - `docs/debug/16_login_redirect_and_token_issues.md`
  - `docs/debug/25_user_v6_integration_fixes.md`
  - `public/admin-v2/locals/zh.json`
  - `public/admin-v2/locals/en.json`

- **相关代码**:
  - `public/admin-v2/admin-v2.tsx`

## 创建时间

2026-02-01