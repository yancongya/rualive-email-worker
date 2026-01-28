# RuAlive 邮件发送功能测试报告

## 测试日期
2026年1月28日

## 测试人员
iFlow CLI

## 测试概述
本测试针对 RuAlive 邮件发送功能中的"测试操作员"按钮进行全面测试，重点检查可能出现的 500 错误。

---

## 1. 测试步骤

### 1.1 环境准备
- 测试URL: https://rualive-email-worker.cubetan57.workers.dev/user-v6
- 测试账户: test@example.com / test123456
- 测试工具: PowerShell 脚本

### 1.2 测试场景

#### 场景 1: 正常登录
```powershell
# 执行登录测试
POST https://rualive-email-worker.cubetan57.workers.dev/api/auth/login
Body: {"email":"test@example.com","password":"test123456"}

# 结果
✓ 登录成功
✓ 获得 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk1OTczMzEsImV4cCI6MTc3MjE4OTMzMX0=.ymOFtBOpYHcBEymLvvPB/1jJWtUlXCH4V9viy1tJq/g=
✓ 用户信息返回正确
```

#### 场景 2: 正常发送邮件给操作员
```powershell
# 发送测试邮件给操作员
POST https://rualive-email-worker.cubetan57.workers.dev/api/send-now
Headers: Authorization: Bearer [token]
Body: {"recipient":"user"}

# 结果
✓ 响应状态码: 200
✓ 响应内容: {"success":true,"message":"测试邮件已发送给用户，今日剩余测试次数：2","remainingTests":2}
✓ 邮件发送成功
```

#### 场景 3: 无效 token 测试
```powershell
# 使用无效 token
POST https://rualive-email-worker.cubetan57.workers.dev/api/send-now
Headers: Authorization: Bearer invalid_token

# 结果
✓ 响应状态码: 401 Unauthorized
✓ 正确拒绝无效请求
```

#### 场景 4: 不发送请求体（重现 500 错误）
```powershell
# 不发送请求体
POST https://rualive-email-worker.cubetan57.workers.dev/api/send-now
Headers: Authorization: Bearer [valid_token]
Body: (无)

# 结果
✗ 响应状态码: 500 Internal Server Error
✗ 错误信息: {"error":"D1_ERROR: UNIQUE constraint failed: test_email_logs.user_id, test_email_logs.test_email, test_date: SQLITE_CONSTRAINT"}
```

#### 场景 5: 发送邮件给紧急联系人
```powershell
# 发送测试邮件给紧急联系人
POST https://rualive-email-worker.cubetan57.workers.dev/api/send-now
Headers: Authorization: Bearer [token]
Body: {"recipient":"emergency"}

# 结果
✓ 响应状态码: 200
✓ 响应内容: {"success":true,"message":"测试邮件已发送给紧急联系人，今日剩余测试次数：1","remainingTests":1}
✓ 邮件发送成功
```

#### 场景 6: 获取用户配置
```powershell
# 获取用户配置
GET https://rualive-email-worker.cubetan57.workers.dev/api/config
Headers: Authorization: Bearer [token]

# 结果
✓ 响应状态码: 200
✓ 用户配置返回正确
✓ emergency_email: emergency@example.com
✓ emergency_name: 紧急联系人
```

---

## 2. 遇到的错误

### 2.1 主要错误：500 内部服务器错误

**错误详情：**
```
状态码: 500 Internal Server Error
错误类型: SQLITE_CONSTRAINT
错误消息: D1_ERROR: UNIQUE constraint failed: test_email_logs.user_id, test_email_logs.test_email, test_date: SQLITE_CONSTRAINT
```

**错误发生条件：**
- 不发送请求体
- 使用有效的 token
- 尝试插入重复的测试记录

---

## 3. 错误详细信息

### 3.1 错误来源分析

**后端代码位置：** `src/index.js` 第 2091-2190 行（`handleSendNow` 函数）

**问题代码片段：**
```javascript
// 获取请求体中的收件人选择（安全处理空body）
let body = {};
try {
  body = await request.json();
} catch (e) {
  // 请求没有body，使用默认值
  body = {};
}
const recipient = body.recipient || 'user';  // 默认为 'user'

// ... 检查测试次数限制 ...

// 记录测试日志
const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
await DB.prepare(
  'INSERT INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
).bind(userId, testEmail, today).run();  // 这里会抛出 UNIQUE constraint 错误
```

### 3.2 数据库约束

**表结构：** `test_email_logs`
```sql
CREATE TABLE test_email_logs (
  user_id TEXT,
  test_email TEXT,
  test_date TEXT,
  PRIMARY KEY (user_id, test_email, test_date)  -- 联合主键，必须唯一
);
```

**约束说明：**
- 每个用户 (user_id)
- 每个测试邮箱 (test_email)
- 每天只能有一条记录 (test_date)
- 如果尝试插入重复的组合，会抛出 `UNIQUE constraint` 错误

### 3.3 错误触发流程

1. 前端调用 `/api/send-now` 端点
2. 后端解析请求体，如果请求体为空，则 `body = {}`
3. `recipient` 默认为 `'user'`
4. 后端检查测试次数限制，如果今天已经发送过邮件给该用户
5. 尝试插入新的测试记录到 `test_email_logs` 表
6. 由于 `user_id + test_email + test_date` 组合已存在，数据库抛出 `UNIQUE constraint` 错误
7. 后端未捕获此错误，返回 500 状态码

---

## 4. 可能的原因分析

### 4.1 根本原因

**后端代码缺陷：**
1. **未处理重复插入错误**：当尝试插入重复记录时，应该捕获 `UNIQUE constraint` 错误并返回友好的错误信息
2. **请求体处理不完善**：虽然代码尝试处理空请求体，但没有确保必需参数存在
3. **测试次数检查不够严格**：应该在插入记录之前检查是否已经存在记录

### 4.2 前端代码问题

**前端代码位置：** `public/dist/assets/userV6-eN3aYMCQ.js`

**问题代码片段：**
```javascript
async function RR(e){
  try{
    const t=e==="proxy"?"emergency":"user",
    r=await fetch(`${cs}/api/send-now`,{
      method:"POST",
      headers:us(),
      body:JSON.stringify(t?{recipient:t}:{})  // 问题：当 t 为空时，发送空对象 {}
    });
```

**问题分析：**
- 当调用 `RR("operator")` 时，`t` 被设置为 `"user"`
- 当调用 `RR("proxy")` 时，`t` 被设置为 `"emergency"`
- 但是如果 `t` 为空或未定义，则会发送空对象 `{}`
- 这会导致后端使用默认值 `'user'`，可能触发重复插入错误

### 4.3 用户体验影响

**影响场景：**
1. 用户快速多次点击"测试操作员"按钮
2. 网络延迟导致请求重复发送
3. 前端未正确传递 `recipient` 参数
4. 用户在同一天多次测试同一个收件人

**用户体验：**
- 看到 500 错误，不清楚具体原因
- 错误信息显示数据库错误，不够友好
- 可能误认为是系统故障

---

## 5. 解决方案建议

### 5.1 后端修复（推荐）

**修复方案 1：使用 INSERT OR IGNORE**
```javascript
// 记录测试日志（如果记录已存在，则忽略）
const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
await DB.prepare(
  'INSERT OR IGNORE INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
).bind(userId, testEmail, today).run();
```

**修复方案 2：使用 INSERT OR REPLACE**
```javascript
// 记录测试日志（如果记录已存在，则替换）
const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
await DB.prepare(
  'INSERT OR REPLACE INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
).bind(userId, testEmail, today).run();
```

**修复方案 3：先检查再插入**
```javascript
// 记录测试日志（先检查是否存在）
const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
const existing = await DB.prepare(
  'SELECT COUNT(*) as count FROM test_email_logs WHERE user_id = ? AND test_email = ? AND test_date = ?'
).bind(userId, testEmail, today).first();

if (!existing || existing.count === 0) {
  await DB.prepare(
    'INSERT INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
  ).bind(userId, testEmail, today).run();
}
```

**修复方案 4：捕获重复插入错误**
```javascript
// 记录测试日志（捕获重复插入错误）
const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
try {
  await DB.prepare(
    'INSERT INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
  ).bind(userId, testEmail, today).run();
} catch (error) {
  if (!error.message.includes('UNIQUE constraint')) {
    throw error; // 重新抛出非重复插入错误
  }
  // 忽略重复插入错误
  console.log('Test email log already exists, skipping insert');
}
```

### 5.2 前端修复

**修复方案：确保正确传递参数**
```javascript
async function RR(e){
  try{
    const recipient = e === "proxy" ? "emergency" : "user";  // 确保始终有值
    const response = await fetch(`${cs}/api/send-now`,{
      method:"POST",
      headers:us(),
      body:JSON.stringify({recipient})  // 始终传递 recipient
    });
    // ...
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}
```

### 5.3 综合修复方案

**建议采用后端修复方案 4 + 前端修复方案，这样可以：**

1. **后端层面：**
   - 捕获重复插入错误，避免 500 错误
   - 记录日志，便于调试
   - 返回友好的错误信息

2. **前端层面：**
   - 确保始终传递 `recipient` 参数
   - 防止重复点击（添加防抖）
   - 显示友好的错误提示

---

## 6. 测试结论

### 6.1 功能状态

| 功能 | 状态 | 备注 |
|------|------|------|
| 用户登录 | ✅ 正常 | 登录成功，token 获取正常 |
| 发送邮件给操作员 | ✅ 正常 | 正常情况工作正常 |
| 发送邮件给紧急联系人 | ✅ 正常 | 正常情况工作正常 |
| 测试次数限制 | ✅ 正常 | 每天最多 3 次 |
| 无效 token 拒绝 | ✅ 正常 | 正确拒绝无效请求 |
| 空请求体处理 | ❌ 异常 | 返回 500 错误 |

### 6.2 问题总结

**主要问题：**
1. 当不发送请求体时，后端返回 500 错误
2. 错误信息显示数据库约束错误，不够友好
3. 前端代码可能发送空对象，触发此问题

**影响范围：**
- 用户在特定情况下会看到 500 错误
- 不影响正常使用场景
- 但影响用户体验

**严重程度：**
- 中等（Medium）
- 功能基本可用，但存在边界情况问题

---

## 7. 下一步行动

### 7.1 立即行动

1. **修复后端代码：**
   - 在 `src/index.js` 的 `handleSendNow` 函数中添加错误处理
   - 使用修复方案 4（捕获重复插入错误）

2. **修复前端代码：**
   - 在 `public/user-v6.tsx` 或相关文件中修复 `RR` 函数
   - 确保始终传递 `recipient` 参数

3. **添加前端防抖：**
   - 在"测试操作员"和"测试联系人"按钮上添加防抖
   - 防止用户快速多次点击

### 7.2 测试验证

1. **修复后测试：**
   - 测试空请求体场景
   - 测试重复点击场景
   - 测试正常发送场景

2. **回归测试：**
   - 测试所有邮件发送功能
   - 测试测试次数限制
   - 测试边界情况

### 7.3 长期改进

1. **改进错误处理：**
   - 统一错误处理机制
   - 返回友好的错误信息
   - 添加详细的错误日志

2. **改进 API 设计：**
   - 使用更严格的参数验证
   - 添加 API 文档
   - 改进错误响应格式

3. **改进用户体验：**
   - 添加加载状态
   - 添加成功/失败提示
   - 改进错误信息显示

---

## 8. 附录

### 8.1 测试脚本位置

- **测试脚本目录：** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\tests`
- **登录测试脚本：** `test-user-login.ps1`
- **发送邮件测试脚本：** `test-send-now-operator.ps1`
- **错误场景测试脚本：** `test-send-now-errors.ps1`

### 8.2 相关文档

- **用户 v6 集成文档：** `docs/22_user_v6_integration_and_fixes.md`
- **数据库集成文档：** `docs/23_user_v6_database_integration_plan.md`
- **调试文档：** `docs/debug/24_user_v6_database_integration_fixes.md`

### 8.3 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/send-now` | POST | 发送测试邮件 |
| `/api/config` | GET | 获取用户配置 |

---

## 9. 联系信息

如有问题或疑问，请联系：
- 项目负责人：iFlow CLI
- 测试日期：2026年1月28日
- 测试环境：https://rualive-email-worker.cubetan57.workers.dev

---

**报告生成时间：** 2026年1月28日
**报告版本：** 1.0
**报告状态：** 完成 ✅