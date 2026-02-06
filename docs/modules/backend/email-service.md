# 邮件服务

## 文档信息
- **模块类型**: 后端服务模块
- **最后更新**: 2026-02-07

---

## 1. 模块概述

### 1.1 模块职责
- 邮件发送
- 邮件模板渲染
- 发送状态跟踪
- 错误处理和重试

### 1.2 依赖服务
- **邮件服务提供商**: Resend
- **API 密钥**: `RESEND_API_KEY` (Cloudflare Secret)

### 1.3 邮件类型
- 工作摘要邮件
- 密码重置邮件
- 测试邮件

---

## 2. Resend API 集成

### 2.1 配置
**环境变量**:
```bash
wrangler secret put RESEND_API_KEY
# 输入: re_xxxxxxxxxxxxxx
```

**发件人邮箱**:
```toml
[vars]
FROM_EMAIL = "RuAlive@itycon.cn"
```

### 2.2 API 端点
- **Base URL**: `https://api.resend.com/emails`
- **认证方式**: Bearer Token (API Key)
- **请求方法**: POST

---

## 3. 邮件发送

### 3.1 基本发送函数
```javascript
/**
 * 发送邮件
 * @param {Object} env - 环境变量
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件 HTML 内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendEmail(env, to, subject, html) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.FROM_EMAIL || 'RuAlive@itycon.cn';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send email');
  }

  return data;
}
```

### 3.2 发送工作摘要邮件
```javascript
/**
 * 发送工作摘要邮件
 * @param {Object} env - 环境变量
 * @param {Object} user - 用户信息
 * @param {Object} workData - 工作数据
 * @param {Object} config - 用户配置
 * @returns {Promise<Object>} 发送结果
 */
async function sendWorkSummaryEmail(env, user, workData, config) {
  const html = generateWorkSummaryHTML(user, workData, config);
  
  return await sendEmail(
    env,
    user.email,
    `RuAlive 工作日报 - ${workData.workDate}`,
    html
  );
}
```

### 3.3 发送密码重置邮件
```javascript
/**
 * 发送密码重置邮件
 * @param {Object} env - 环境变量
 * @param {Object} user - 用户信息
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} 发送结果
 */
async function sendPasswordResetEmail(env, user, newPassword) {
  const html = generatePasswordResetHTML(user, newPassword);
  
  return await sendEmail(
    env,
    user.email,
    'RuAlive 密码重置通知',
    html
  );
}
```

### 3.4 发送测试邮件
```javascript
/**
 * 发送测试邮件
 * @param {Object} env - 环境变量
 * @param {string} to - 收件人邮箱
 * @param {string} content - 邮件内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendTestEmail(env, to, content) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">测试邮件</h1>
      <p style="color: #666;">这是一封测试邮件</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
        <p>${content}</p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        发送时间: ${new Date().toLocaleString('zh-CN')}
      </p>
    </div>
  `;
  
  return await sendEmail(env, to, 'RuAlive 测试邮件', html);
}
```

---

## 4. 邮件模板

### 4.1 工作摘要模板
```javascript
function generateWorkSummaryHTML(user, workData, config) {
  const projectsHTML = workData.projects.map(project => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${project.project_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${workData.composition_count}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${workData.layer_count}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${workData.keyframe_count}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${workData.effect_count}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #999; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #667eea; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 RuAlive 工作日报</h1>
          <p>${workData.workDate} · ${user.username}</p>
        </div>
        <div class="content">
          <h2>今日工作统计</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${workData.work_hours.toFixed(2)}h</div>
              <div class="stat-label">工作时长</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${workData.accumulated_work_hours.toFixed(2)}h</div>
              <div class="stat-label">累计时长</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${workData.composition_count}</div>
              <div class="stat-label">合成数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${workData.keyframe_count}</div>
              <div class="stat-label">关键帧数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${workData.layer_count}</div>
              <div class="stat-label">图层数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${workData.effect_count}</div>
              <div class="stat-label">效果数量</div>
            </div>
          </div>

          <h2>项目详情</h2>
          <table>
            <thead>
              <tr>
                <th>项目名称</th>
                <th>合成</th>
                <th>图层</th>
                <th>关键帧</th>
                <th>效果</th>
              </tr>
            </thead>
            <tbody>
              ${projectsHTML}
            </tbody>
          </table>

          <div class="footer">
            <p>此邮件由 RuAlive@烟囱鸭 自动发送</p>
            <p>如需停止接收，请登录您的账户并修改设置</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### 4.2 密码重置模板
```javascript
function generatePasswordResetHTML(user, newPassword) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .password-box { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; margin: 20px 0; }
        .password { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
        .warning { background: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 密码重置通知</h1>
        </div>
        <div class="content">
          <p>您好，<strong>${user.username}</strong>：</p>
          <p>您的 RuAlive 账户密码已被重置。</p>

          <div class="password-box">
            <p style="margin-bottom: 10px;">您的新密码是：</p>
            <div class="password">${newPassword}</div>
          </div>

          <div class="warning">
            ⚠️ <strong>安全提示：</strong>
            <ul style="margin: 10px 0 0 20px;">
              <li>请立即登录并修改密码</li>
              <li>不要将此密码分享给他人</li>
              <li>建议使用强密码保护账户安全</li>
            </ul>
          </div>

          <p>如果您没有请求重置密码，请联系管理员。</p>

          <div class="footer">
            <p>此邮件由 RuAlive@烟囱鸭 自动发送</p>
            <p>重置时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

---

## 5. 发送状态跟踪

### 5.1 邮件日志表
```sql
CREATE TABLE email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  email_id TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.2 记录发送日志
```javascript
/**
 * 记录邮件发送日志
 * @param {Object} env - 环境变量
 * @param {string} userId - 用户ID
 * @param {string} toEmail - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} status - 发送状态 (sent/failed)
 * @param {string} errorMessage - 错误信息（可选）
 * @param {string} emailId - Resend 邮件ID（可选）
 * @returns {Promise<Object>} 日志记录
 */
async function logEmail(env, userId, toEmail, subject, status, errorMessage = null, emailId = null) {
  const DB = env.DB || env.rualive;
  
  const result = await DB.prepare(
    'INSERT INTO email_logs (user_id, to_email, subject, status, error_message, email_id, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    userId,
    toEmail,
    subject,
    status,
    errorMessage,
    emailId,
    new Date().toISOString()
  ).run();
  
  return result;
}
```

### 5.3 查询发送日志
```javascript
/**
 * 查询用户邮件发送日志
 * @param {Object} env - 环境变量
 * @param {string} userId - 用户ID
 * @param {number} limit - 返回数量限制
 * @returns {Promise<Array>} 邮件日志列表
 */
async function getEmailLogs(env, userId, limit = 10) {
  const DB = env.DB || env.rualive;
  
  const logs = await DB.prepare(
    'SELECT * FROM email_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(userId, limit).all();
  
  return logs.results || [];
}
```

---

## 6. 错误处理

### 6.1 常见错误
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `400` | 请求参数错误 | 检查邮件地址格式和内容 |
| `401` | API 密钥无效 | 检查 RESEND_API_KEY 配置 |
| `429` | 请求频率限制 | 减少发送频率，等待冷却 |
| `500` | Resend 服务错误 | 重试发送，联系 Resend 支持 |

### 6.2 重试机制
```javascript
/**
 * 带重试的邮件发送
 * @param {Object} env - 环境变量
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件 HTML 内容
 * @param {number} maxRetries - 最大重试次数（默认3次）
 * @returns {Promise<Object>} 发送结果
 */
async function sendEmailWithRetry(env, to, subject, html, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmail(env, to, subject, html);
      console.log(`[Email] Sent successfully (attempt ${attempt})`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[Email] Failed (attempt ${attempt}):`, error.message);
      
      // 等待后重试（指数退避）
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}
```

---

## 7. 定时发送

### 7.1 Cron 触发器
**配置**: `wrangler.toml`
```toml
[triggers]
crons = ["0 * * * *"]  # 每小时第0分钟执行
```

### 7.2 定时任务逻辑
```javascript
/**
 * 处理 Cron 触发器
 * @param {Object} env - 环境变量
 * @param {Object} ctx - 执行上下文
 */
async function handleCronTrigger(env, ctx) {
  console.log('[Cron] Checking email schedules...');
  
  const DB = env.DB || env.rualive;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 查询启用的用户配置
  const configs = await DB.prepare(
    'SELECT * FROM user_configs WHERE enabled = 1'
  ).all();
  
  for (const config of (configs.results || [])) {
    const sendTime = config.send_time; // 格式: "22:00"
    const [hour, minute] = sendTime.split(':').map(Number);
    
    // 检查是否到达发送时间
    if (currentHour === hour && currentMinute === minute) {
      await processUserEmailSchedule(env, config);
    }
  }
}

/**
 * 处理用户邮件计划
 * @param {Object} env - 环境变量
 * @param {Object} config - 用户配置
 */
async function processUserEmailSchedule(env, config) {
  const DB = env.DB || env.rualive;
  const today = new Date().toISOString().split('T')[0];
  
  // 查询今日工作数据
  const workLog = await DB.prepare(
    'SELECT * FROM work_logs WHERE user_id = ? AND work_date = ?'
  ).bind(config.user_id, today).first();
  
  if (!workLog) {
    console.log(`[Cron] No work data for user ${config.user_id}`);
    return;
  }
  
  // 检查今日是否已发送
  const todayEmail = await DB.prepare(
    'SELECT * FROM email_logs WHERE user_id = ? AND created_at LIKE ?'
  ).bind(config.user_id, today + '%').first();
  
  if (todayEmail) {
    console.log(`[Cron] Email already sent for user ${config.user_id}`);
    return;
  }
  
  // 获取用户信息
  const user = await DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(config.user_id).first();
  
  if (!user) {
    console.error(`[Cron] User not found: ${config.user_id}`);
    return;
  }
  
  try {
    // 解析配置
    const configData = JSON.parse(config.config);
    
    // 发送邮件
    await sendWorkSummaryEmail(env, user, workLog, configData);
    
    // 记录发送日志
    await logEmail(env, config.user_id, user.email, `RuAlive 工作日报 - ${today}`, 'sent');
    
    console.log(`[Cron] Email sent successfully for user ${config.user_id}`);
  } catch (error) {
    console.error(`[Cron] Failed to send email for user ${config.user_id}:`, error);
    
    // 记录错误日志
    await logEmail(env, config.user_id, user.email, `RuAlive 工作日报 - ${today}`, 'failed', error.message);
  }
}
```

---

## 8. 使用示例

### 8.1 发送工作摘要
```javascript
const user = {
  id: 'user_123',
  username: 'testuser',
  email: 'user@example.com'
};

const workData = {
  workDate: '2026-02-07',
  work_hours: 3.5,
  accumulated_work_hours: 54.68,
  composition_count: 38,
  layer_count: 8,
  keyframe_count: 699,
  effect_count: 273,
  projects: [...]
};

const config = {
  enabled: true,
  sendTime: '22:00',
  userEmails: ['user@example.com']
};

await sendWorkSummaryEmail(env, user, workData, config);
```

### 8.2 发送密码重置
```javascript
const user = {
  id: 'user_123',
  username: 'testuser',
  email: 'user@example.com'
};

const newPassword = 'NewPassword123';

await sendPasswordResetEmail(env, user, newPassword);
```

### 8.3 发送测试邮件
```javascript
await sendTestEmail(env, 'user@example.com', '这是一封测试邮件');
```

---

## 9. 最佳实践

### 9.1 邮件模板
- ✅ 使用响应式设计
- ✅ 包含清晰的视觉层次
- ✅ 提供取消订阅选项
- ✅ 包含发送时间戳

### 9.2 错误处理
- ✅ 记录所有发送失败
- ✅ 实现重试机制
- ✅ 提供错误日志
- ✅ 通知管理员

### 9.3 性能优化
- ✅ 批量发送邮件
- ✅ 使用队列处理
- ✅ 避免重复发送
- ✅ 缓存模板

### 9.4 安全性
- ✅ 验证邮箱格式
- ✅ 限制发送频率
- ✅ 记录发送日志
- ✅ 防止垃圾邮件

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成