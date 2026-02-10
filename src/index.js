/**
 * RuAlive Email Notification Worker
 * MVP版本 - 每日工作总结和紧急联系人监督
 * Last Deploy: 2026-01-30 15:00 - Disabled /user-v6 route
 *
 * ==================== 重要路由配置说明 ====================
 *
 * 用户路由变更 (2026-01-30):
 * - /user 路由现在返回 user-v6.html（新用户界面）
 * - /user-v6 路由已删除，不再可用
 * - 旧 user.html 文件已删除，不再构建
 *
 * 修改路由后的部署步骤（必须按顺序执行）:
 * 1. 修改 public/vite.config.ts - 更新构建入口点
 * 2. cd public && npm run build - React构建前端
 * 3. cd .. && npx wrangler deploy - Worker部署到Cloudflare
 * 4. 验证 /user 路由显示新界面
 *
 * ⚠️ 注意事项：
 * - 修改路由配置后必须重新构建前端
 * - 构建完成后必须部署 Worker 才能生效
 * - 不要直接修改 dist 目录，必须通过构建生成
 * =========================================================
 */

// 导入认证模块（注意：在Cloudflare Workers中需要使用动态导入）
const authModule = {
  generateUserId: () => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  generateInviteCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.slice(0, 4) + '-' + code.slice(4, 8);
  },
  hashPassword: async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'rualive_salt_2024');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },
  verifyPassword: async (password, hash) => {
    const passwordHash = await authModule.hashPassword(password);
    return passwordHash === hash;
  },
  generateToken: async (userId, role, env) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: userId,
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    };
    const secret = env.JWT_SECRET || 'rualive_secret_key_2024';
    const headerBase64 = btoa(JSON.stringify(header));
    const payloadBase64 = btoa(JSON.stringify(payload));
    const signature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(headerBase64 + '.' + payloadBase64)
    );
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return headerBase64 + '.' + payloadBase64 + '.' + signatureBase64;
  },
  verifyToken: async (token, env) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      const secret = env.JWT_SECRET || 'rualive_secret_key_2024';
      const signature = parts[2];
      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        ),
        new TextEncoder().encode(parts[0] + '.' + parts[1])
      );
      const expectedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
      if (signature !== expectedSignatureBase64) return null;
      return payload;
    } catch (error) {
      return null;
    }
  }
};

export default {
  async fetch(request, env) {
    // 兼容不同binding名称
    const DB = env.DB || env.rualive;
    const KV = env.KV;
    const ASSETS = env.ASSETS;
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理静态文件（从 Assets 绑定）
    // 只对非 API 路径使用 Assets，避免消耗 request body
    // 排除 /login、/user、/user-v6 和 /admin/login 路由，这些路由需要特殊处理
    // 注意：/admin 路由不排除，因为它需要返回后端生成的管理员仪表板 HTML
    if (ASSETS && !path.startsWith('/api/') && path !== '/login' && path !== '/user' && path !== '/user-v6' && path !== '/admin/login') {
      try {
        console.log('[Assets] Fetching static file for path:', path);
        const assetResponse = await ASSETS.fetch(request);
        console.log('[Assets] Response status:', assetResponse.status);
        console.log('[Assets] Response Content-Type:', assetResponse.headers.get('Content-Type'));
        
        if (assetResponse && assetResponse.status !== 404) {
          console.log('[Assets] Static file found, returning response');
          
          // 确定正确的 MIME 类型
          let contentType = 'text/plain;charset=UTF-8';
          if (path.endsWith('.js') || path.endsWith('.mjs')) {
            contentType = 'application/javascript;charset=UTF-8';
          } else if (path.endsWith('.json')) {
            contentType = 'application/json;charset=UTF-8';
          } else if (path.endsWith('.css')) {
            contentType = 'text/css;charset=UTF-8';
          } else if (path.endsWith('.html')) {
            contentType = 'text/html;charset=UTF-8';
          } else if (path.endsWith('.svg')) {
            contentType = 'image/svg+xml;charset=UTF-8';
          } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            contentType = 'image/jpeg';
          } else if (path.endsWith('.webp')) {
            contentType = 'image/webp';
          }
          
          console.log('[Assets] Setting Content-Type to:', contentType);
          
          // 创建新的 Response 对象，明确设置 Content-Type
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          });
        }
      } catch (error) {
        // Assets 失败，继续处理其他路由
        console.error('Assets fetch error:', error);
      }
    }

    // CORS处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 路由处理
    if (path === '/' || path === '/index.html') {
      // 返回 React 应用（从 Assets）
      if (ASSETS) {
        try {
          const assetResponse = await ASSETS.fetch(new Request(request.url, { method: 'GET' }));
          if (assetResponse && assetResponse.status !== 404) {
            return assetResponse;
          }
        } catch (error) {
          console.error('Failed to fetch index.html from Assets:', error);
        }
      }
      // 如果 Assets 失败，返回备用 HTML
      const html = await getLandingHtml();
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    

    if (path === '/login') {
      // 返回 auth.html
      if (ASSETS) {
        try {
          const authUrl = new URL('/auth.html', request.url);
          const assetResponse = await ASSETS.fetch(new Request(authUrl, { method: 'GET' }));
          if (assetResponse && assetResponse.status !== 404) {
            return assetResponse;
          }
        } catch (error) {
          console.error('Failed to fetch auth.html from Assets:', error);
        }
      }
      // 如果 Assets 失败，返回错误
      return new Response('Auth page not found', { status: 404 });
    }

    if (path === '/user') {
      // 从 Assets 读取用户页面 HTML
      const userV6Url = new URL('/user-v6.html', request.url);
      const assetResponse = await ASSETS.fetch(new Request(userV6Url, { method: 'GET' }));
      if (assetResponse && assetResponse.status !== 404) {
        console.log('[Route] /user: Found user-v6.html in Assets');
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
          }
        });
      }
      
      console.log('[Route] /user: user-v6.html not found in Assets, returning 404');
      return new Response('User page not found', { status: 404 });
    }

    if (path === '/user-v6') {
      // /user-v6 路由已废弃，重定向到 /user
      console.log('[Route] /user-v6 accessed, redirecting to /user');
      return new Response(null, {
        status: 308, // Permanent Redirect
        headers: {
          'Location': '/user',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      });
    }

    if (path === '/admin-v2' || path === '/admin-v2.html') {
      // 新增 /admin-v2 路由
      if (ASSETS) {
        const adminV2Url = new URL('/admin-v2.html', request.url);
        const assetResponse = await ASSETS.fetch(new Request(adminV2Url, { method: 'GET' }));
        if (assetResponse && assetResponse.status !== 404) {
          const newHeaders = new Headers(assetResponse.headers);
          newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            headers: newHeaders
          });
        }
      }
      return new Response('管理后台V2页面未找到', { status: 404 });
    }

    if (path === '/admin' || path === '/admin.html' || path === '/admin/') {
      // 从public/admin.html文件读取管理仪表板HTML
      if (ASSETS) {
        const adminUrl = new URL('/admin.html', request.url);
        const assetResponse = await ASSETS.fetch(new Request(adminUrl, { method: 'GET' }));
        if (assetResponse && assetResponse.status !== 404) {
          const newHeaders = new Headers(assetResponse.headers);
          newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            headers: newHeaders
          });
        }
      }
      return new Response('管理后台页面未找到', { status: 404 });
    }

    if (path === '/health') {
      return Response.json({ status: 'ok', timestamp: Date.now() });
    }

    // 认证API
    if (path === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if (path === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request, env);
    }

    if (path === '/api/auth/me' && request.method === 'GET') {
      return handleGetCurrentUser(request, env);
    }

    if (path === '/api/auth/me' && request.method === 'PUT') {
      return handleUpdateCurrentUser(request, env);
    }

    if (path === '/api/auth/change-password' && request.method === 'POST') {
      return handleChangePassword(request, env);
    }

    if (path === '/api/auth/init' && request.method === 'POST') {
      return handleInitAdmin(request, env);
    }

    // 重置管理员密码（临时调试用）
    if (path === '/api/auth/reset-admin-password' && request.method === 'POST') {
      return handleResetAdminPassword(request, env);
    }

    // 调试：查看管理员账户信息（临时调试用）
    if (path === '/api/auth/debug-admin' && request.method === 'GET') {
      return handleDebugAdmin(request, env);
    }

    // 公共 API - 用户统计（无需认证）
    if (path === '/api/stats/users' && request.method === 'GET') {
      return handleGetUserStats(request, env);
    }

    // 管理员API
    if (path === '/api/admin/invite-codes' && request.method === 'GET') {
      return handleGetInviteCodes(request, env);
    }

    if (path === '/api/admin/invite-codes' && request.method === 'POST') {
      return handleCreateInviteCode(request, env);
    }

    if (path === '/api/admin/invite-codes' && request.method === 'DELETE') {
      return handleDeleteInviteCode(request, env);
    }

    if (path === '/api/admin/users' && request.method === 'GET') {
      return handleGetUsers(request, env);
    }

    // 用户管理路由（仅管理员）
    if (path.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === 'DELETE') {
      return handleDeleteUser(request, env);
    }

    if (path.match(/^\/api\/admin\/users\/[^\/]+\/reset-password$/) && request.method === 'POST') {
      return handleResetPassword(request, env);
    }

    if (path.match(/^\/api\/admin\/users\/[^\/]+\/email-stats$/) && request.method === 'GET') {
      return handleGetUserEmailStats(request, env);
    }

    if (path.match(/^\/api\/admin\/users\/[^\/]+\/email-limit$/) && request.method === 'POST') {
      return handleSetEmailLimit(request, env);
    }

    if (path.match(/^\/api\/admin\/users\/[^\/]+\/email-limit-status$/) && request.method === 'GET') {
      return handleGetEmailLimitStatus(request, env);
    }

    if (path === '/api/admin/email-stats' && request.method === 'GET') {
      return handleGetEmailStats(request, env);
    }

    // API密钥管理（仅管理员）
    if (path === '/api/admin/api-key' && request.method === 'GET') {
      return handleGetApiKey(request, env);
    }

    if (path === '/api/admin/api-key' && request.method === 'POST') {
      return handleSetApiKey(request, env);
    }

    if (path === '/api/admin/api-key' && request.method === 'DELETE') {
      return handleDeleteApiKey(request, env);
    }

    if (path === '/api/admin/api-key/test' && request.method === 'POST') {
      return handleTestApiKey(request, env);
    }

    if (path === '/api/config' && request.method === 'GET') {
      return handleGetConfig(request, env);
    }

    if (path === '/api/config' && request.method === 'POST') {
      return handleUpdateConfig(request, env);
    }

    if (path === '/api/work-data' && request.method === 'POST') {
      return handleWorkData(request, env);
    }

    if (path === '/api/heartbeat' && request.method === 'POST') {
      return handleHeartbeat(request, env);
    }

    // AE 在线状态相关 API
    if (path === '/api/ae-status' && request.method === 'GET') {
      return handleGetAEStatus(request, env);
    }

    if (path === '/api/ae-status' && request.method === 'POST') {
      return handleUpdateAEStatus(request, env);
    }

    if (path === '/api/send-now' && request.method === 'POST') {
      return handleSendNow(request, env);
    }

    if (path === '/api/logs' && request.method === 'GET') {
      return handleGetLogs(request, env);
    }

    if (path === '/api/work-logs/range' && request.method === 'GET') {
      return handleGetWorkLogsRange(request, env);
    }

    if (path === '/api/work-logs' && request.method === 'GET') {
      return handleGetWorkLogs(request, env);
    }

    // 项目总时长列表 API
    if (path === '/api/projects/summary' && request.method === 'GET') {
      console.log('[Router] 项目总时长列表 API 被调用');
      return handleGetProjectsSummary(request, env);
    }

    // 项目历史 API
    if (path === '/api/projects/history' && request.method === 'GET') {
      console.log('[Router] 项目历史 API 被调用');
      return handleGetProjectHistory(request, env);
    }

    // 修改项目运行时长 API
    if (path.startsWith('/api/projects/') && path.includes('/daily-stats/') && request.method === 'PUT') {
      console.log('[Router] 修改项目运行时长 API 被调用');
      return handleUpdateProjectDailyStats(request, env);
    }

    // 删除项目 API
    if (path.startsWith('/api/projects/') && request.method === 'DELETE') {
      console.log('[Router] 删除项目 API 被调用');
      return handleDeleteProject(request, env);
    }

    // Cron触发器检测
    const userAgent = request.headers.get('User-Agent') || '';
    if (userAgent.includes('Cloudflare-Cron')) {
      return handleCronTrigger(env);
    }

    return new Response('Not Found', { status: 404 });
  },

  // 定时任务触发
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCronTrigger(env));
  },
};

// ==================== Cron触发处理 ====================

async function handleCronTrigger(env) {
  console.log('Cron trigger at:', new Date().toISOString());

  try {
    // 获取所有用户配置
    const users = await getAllUsers(env);
    console.log('Found users:', users.length);

    let processed = 0;
    for (const user of users) {
      try {
        await processUser(user, env);
        processed++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    return Response.json({ success: true, processed, total: users.length });
  } catch (error) {
    console.error('Cron trigger error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 处理单个用户
async function processUser(user, env) {
  const userId = user.id;

  // 获取用户配置
  const config = await getUserConfig(userId, env);
  if (!config || !config.enabled) {
    console.log(`User ${userId} disabled or no config`);
    return;
  }

  // 获取当前时间（转换为用户时区）
  const now = new Date();
  const userTimezone = config.timezone || 'Asia/Shanghai';

  // 转换为用户时区的时间
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  const currentTime = `${String(userNow.getHours()).padStart(2, '0')}:${String(userNow.getMinutes()).padStart(2, '0')}`;
  const currentDayOfWeek = userNow.getDay(); // 0-6, 0=Sunday, 1=Monday, etc.

  // 使用用户时区的日期（而不是 UTC 日期）
  const today = `${userNow.getFullYear()}-${String(userNow.getMonth() + 1).padStart(2, '0')}-${String(userNow.getDate()).padStart(2, '0')}`;

  console.log(`User ${userId} - today: ${today}, currentTime: ${currentTime}, currentDay: ${currentDayOfWeek}, timezone: ${userTimezone}`);

  console.log(`User ${userId} - currentTime: ${currentTime}, currentDay: ${currentDayOfWeek}, timezone: ${userTimezone}`);

  // 解析通知周期配置（前端传递的是 JSON 数组字符串，如 "[1,2,3,4,5]"）
  let scheduleDays = [];
  try {
    const schedule = config.notification_schedule || '[]';
    // 如果是 JSON 数组字符串，解析它
    if (schedule.startsWith('[')) {
      scheduleDays = JSON.parse(schedule);
    } else if (schedule === 'weekdays') {
      // 兼容旧配置格式
      scheduleDays = [1, 2, 3, 4, 5];
    } else if (schedule === 'all') {
      scheduleDays = [0, 1, 2, 3, 4, 5, 6];
    }
  } catch (e) {
    console.error('Failed to parse notification_schedule:', e);
    scheduleDays = [0, 1, 2, 3, 4, 5, 6]; // 默认每天
  }

  // 检查今天是否在通知周期中
  const shouldSendToday = scheduleDays.includes(currentDayOfWeek);

  console.log(`User ${userId} - scheduleDays: [${scheduleDays.join(',')}], shouldSendToday: ${shouldSendToday}`);

  // 检查是否应该发送紧急联系人通知
  let shouldSendEmergency = false;
  if (config.enable_emergency_notification && config.emergency_email && shouldSendToday) {
    shouldSendEmergency = true;
  }

  // 检查是否到了用户通知时间
  const userNotificationHour = config.user_notification_hour !== undefined ? config.user_notification_hour : 22;
  const userNotificationTime = `${String(userNotificationHour).padStart(2, '0')}:00`;
  const isUserNotificationTime = currentTime === userNotificationTime && shouldSendToday;

  // 检查是否到了紧急联系人通知时间
  const emergencyNotificationHour = config.emergency_notification_hour !== undefined ? config.emergency_notification_hour : 22;
  const emergencyNotificationTime = `${String(emergencyNotificationHour).padStart(2, '0')}:00`;
  const isEmergencyNotificationTime = currentTime === emergencyNotificationTime && shouldSendToday;

  console.log(`User ${userId} - userTime: ${userNotificationTime}, emergencyTime: ${emergencyNotificationTime}, shouldSendEmergency: ${shouldSendEmergency}`);

  // 获取当天工作数据
  const workData = await getWorkData(userId, today, env);

  // 检测工作状态
  const hasWork = workData !== null;
  const isSufficient = hasWork && checkWorkSufficient(workData, config.thresholds);

  console.log(`User ${userId} - hasWork: ${hasWork}, isSufficient: ${isSufficient}`);

  // 根据时间和工作状态发送邮件
  if (isUserNotificationTime && hasWork) {
    // 到了用户通知时间且有工作数据，发送总结给用户（不管工作时长）
    await sendDailySummary(user, workData, config, env);
  } else if (isEmergencyNotificationTime && shouldSendEmergency && (!hasWork || !isSufficient)) {
    // 到了紧急联系人通知时间、启用了紧急联系人通知、且工作不足，发送警告给紧急联系人
    await sendWarningEmail(user, workData, config, env);
  } else {
    console.log(`User ${userId} - no notification needed at this time`);
  }
}

// 检查工作量是否充足
function checkWorkSufficient(workData, thresholds) {
  const hours = workData.work_hours || 0;
  const minHours = thresholds?.minWorkHours || 2;

  return hours >= minHours;
}

// ==================== 认证处理函数 ====================

// 中间件：验证token
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await authModule.verifyToken(token, env);
  
  if (!payload) {
    return null;
  }
  
  return payload;
}

// 中间件：验证管理员权限
async function verifyAdmin(request, env) {
  const DB = env.DB || env.rualive;
  
  const payload = await verifyAuth(request, env);
  if (!payload) {
    return null;
  }
  
  // 检查用户角色
  const user = await DB.prepare(
    'SELECT id, email, role FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return user;
}

// 中间件：验证用户权限（排除管理员）
async function verifyUserOnly(request, env) {
  const DB = env.DB || env.rualive;
  
  const payload = await verifyAuth(request, env);
  console.log('[verifyUserOnly] Payload:', payload);
  
  if (!payload) {
    console.log('[verifyUserOnly] 验证失败：payload为空');
    return null;
  }
  
  // 检查用户角色（排除管理员）
  const user = await DB.prepare(
    'SELECT id, email, role FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  console.log('[verifyUserOnly] 查询结果:', user);
  console.log('[verifyUserOnly] 用户角色:', user ? user.role : 'null');
  
  if (!user) {
    console.log('[verifyUserOnly] 验证失败：用户不存在');
    return null;
  }
  
  if (user.role === 'admin') {
    console.log('[verifyUserOnly] 验证失败：用户是管理员');
    return null;
  }
  
  console.log('[verifyUserOnly] 验证成功');
  return user;
}

// 初始化管理员
async function handleInitAdmin(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 检查是否已有管理员
    const adminCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
    ).first();
    
    if (adminCount.count > 0) {
      return Response.json({ success: false, error: '管理员已存在' }, { status: 400 });
    }
    
    const adminId = 'admin_' + Date.now();
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await DB.prepare(
      'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(adminId, 'admin@rualive.com', '管理员', passwordHash, 'admin').run();
    
    // 创建初始邀请码（30天有效期）
    const codeId = authModule.generateUserId();
    const code = authModule.generateInviteCode();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    await DB.prepare(
      'INSERT INTO invite_codes (id, code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(codeId, code, adminId, 10, expiresAt).run();
    
    return Response.json({
      success: true,
      admin: {
        email: 'admin@rualive.com',
        password: 'admin123',
        inviteCode: code
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 重置管理员密码（临时调试用）
async function handleResetAdminPassword(request, env) {
  const DB = env.DB || env.rualive;

  try {
    console.log('[ResetAdmin] Starting password reset');

    // 更新所有管理员账户的密码为 bcrypt 格式
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 10);

    const result = await DB.prepare(
      'UPDATE users SET password_hash = ? WHERE role = "admin"'
    ).bind(passwordHash).run();

    console.log('[ResetAdmin] Updated', result.changes, 'admin accounts');

    return Response.json({
      success: true,
      message: '管理员密码已重置为 admin123',
      updated: result.changes
    });
  } catch (error) {
    console.error('[ResetAdmin] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 调试：查看管理员账户信息（临时调试用）
async function handleDebugAdmin(request, env) {
  const DB = env.DB || env.rualive;

  try {
    console.log('[DebugAdmin] Fetching admin accounts');

    const admins = await DB.prepare(
      'SELECT id, email, username, role, created_at FROM users WHERE role = "admin"'
    ).all();

    console.log('[DebugAdmin] Found', admins.results.length, 'admin accounts');

    return Response.json({
      success: true,
      admins: admins.results
    });
  } catch (error) {
    console.error('[DebugAdmin] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 用户注册
async function handleRegister(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const body = await request.json();
    const { email, username, password, inviteCode } = body;
    
    if (!email || !username || !password || !inviteCode) {
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }
    
    // 检查邮箱是否已存在
    const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return Response.json({ success: false, error: '邮箱已被注册' }, { status: 400 });
    }
    
    // 验证邀请码
    const invite = await DB.prepare(
      'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))'
    ).bind(inviteCode).first();
    
    if (!invite) {
      return Response.json({ success: false, error: '无效的邀请码' }, { status: 400 });
    }
    
    if (invite.used_count >= invite.max_uses) {
      return Response.json({ success: false, error: '邀请码已用完' }, { status: 400 });
    }
    
    // 创建用户
    const userId = authModule.generateUserId();
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    await DB.prepare(
      'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, username, passwordHash, 'user').run();
    
    // 更新邀请码使用次数
    await DB.prepare(
      'UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?'
    ).bind(invite.id).run();
    
    // 创建默认配置
    await DB.prepare(
      'INSERT INTO user_configs (user_id) VALUES (?)'
    ).bind(userId).run();
    
    return Response.json({ success: true, userId });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 用户登录
async function handleLogin(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[Login] Attempt:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      console.log('[Login] Missing parameters');
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }
    
    const user = await DB.prepare(
      'SELECT id, email, username, password_hash, role FROM users WHERE email = ?'
    ).bind(email).first();
    
    console.log('[Login] User found:', !!user, user ? user.email : 'none');
    
    if (!user) {
      console.log('[Login] User not found');
      return Response.json({ success: false, error: '邮箱或密码错误' }, { status: 401 });
    }
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('[Login] Password valid:', isValid);
    
    if (!isValid) {
      console.log('[Login] Invalid password');
      return Response.json({ success: false, error: '邮箱或密码错误' }, { status: 401 });
    }
    
    // 生成token
    const token = await authModule.generateToken(user.id, user.role, env);
    
    // 保存会话
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await DB.prepare(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, token, expiresAt).run();
    
    // 更新最后登录时间
    await DB.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    ).bind(user.id).run();
    
    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 登出
async function handleLogout(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const authHeader = request.headers.get('Authorization');
    const token = authHeader.substring(7);
    
    await DB.prepare(
      'DELETE FROM sessions WHERE token = ?'
    ).bind(token).run();
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取当前用户
async function handleGetCurrentUser(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    console.log('[GetCurrentUser] Starting...');
    const payload = await verifyAuth(request, env);
    console.log('[GetCurrentUser] Payload:', payload ? { userId: payload.userId, role: payload.role } : 'null');
    
    if (!payload) {
      console.log('[GetCurrentUser] No payload, returning 401');
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const authHeader = request.headers.get('Authorization');
    console.log('[GetCurrentUser] Auth header exists:', !!authHeader);
    const token = authHeader.substring(7);
    console.log('[GetCurrentUser] Token (first 20 chars):', token.substring(0, 20));
    
    // 检查会话是否存在
    const session = await DB.prepare(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();
    
    console.log('[GetCurrentUser] Session found:', !!session);
    if (session) {
      console.log('[GetCurrentUser] Session user_id:', session.user_id);
    }
    
    if (!session) {
      console.log('[GetCurrentUser] No valid session, returning 401');
      return Response.json({ success: false, error: '会话已过期' }, { status: 401 });
    }
    
    // 获取用户信息
    const user = await DB.prepare(
      'SELECT id, email, username, role, created_at, last_login FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    if (!user) {
      return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    }
    
    // 获取用户配置信息（包括紧急联系人）
    const config = await DB.prepare(
      'SELECT enabled, send_time, timezone, emergency_email, emergency_name, min_work_hours, min_keyframes, min_json_size, user_notification_time, emergency_notification_time, enable_emergency_notification, notification_schedule, notification_excluded_days FROM user_configs WHERE user_id = ?'
    ).bind(payload.userId).first();
    
    return Response.json({ 
      success: true, 
      user: {
        ...user,
        config: config || {
          enabled: 0,
          send_time: '22:00',
          timezone: 'Asia/Shanghai',
          emergency_email: '',
          emergency_name: '',
          min_work_hours: 8,
          min_keyframes: 50,
          min_json_size: 10,
          user_notification_time: '22:00',
          emergency_notification_time: '22:00',
          enable_emergency_notification: 1,
          notification_schedule: 'all',
          notification_excluded_days: '[]'
        }
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 更新当前用户信息
async function handleUpdateCurrentUser(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const body = await request.json();
    const { username } = body;
    
    // 验证用户名
    if (!username) {
      return Response.json({ success: false, error: '用户名不能为空' }, { status: 400 });
    }
    
    // 用户名验证规则
    const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
    if (!usernameRegex.test(username)) {
      return Response.json({ success: false, error: '用户名只能包含字母、数字、下划线和中文' }, { status: 400 });
    }
    
    if (username.length < 2) {
      return Response.json({ success: false, error: '用户名至少需要2个字符' }, { status: 400 });
    }
    
    if (username.length > 20) {
      return Response.json({ success: false, error: '用户名不能超过20个字符' }, { status: 400 });
    }
    
    // 检查用户名是否已被其他用户使用
    const existingUser = await DB.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ?'
    ).bind(username, payload.userId).first();
    
    if (existingUser) {
      return Response.json({ success: false, error: '该用户名已被使用' }, { status: 409 });
    }
    
    // 更新用户名
    await DB.prepare(
      'UPDATE users SET username = ? WHERE id = ?'
    ).bind(username, payload.userId).run();
    
    // 获取更新后的用户信息
    const user = await DB.prepare(
      'SELECT id, email, username, role, created_at, last_login FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    return Response.json({ 
      success: true, 
      user: user,
      message: '用户名更新成功'
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 修改密码
async function handleChangePassword(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // 验证输入
    if (!currentPassword || !newPassword) {
      return Response.json({ success: false, error: '请填写所有字段' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return Response.json({ success: false, error: '新密码长度至少需要6个字符' }, { status: 400 });
    }
    
    // 获取当前用户信息
    const user = await DB.prepare(
      'SELECT id, email, username, password_hash FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    if (!user) {
      return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    }
    
    // 验证当前密码
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return Response.json({ success: false, error: '当前密码不正确' }, { status: 401 });
    }
    
    // 生成新密码哈希
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newPasswordHash, payload.userId).run();
    
    return Response.json({ 
      success: true, 
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('[ChangePassword] Error:', error);
    return Response.json({ success: false, error: '密码修改失败' }, { status: 500 });
  }
}

// 创建邀请码（仅管理员）
async function handleCreateInviteCode(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }
    
    const body = await request.json();
    const { maxUses = 1, expiresInDays = 30 } = body;
    
    const codeId = authModule.generateUserId();
    const code = authModule.generateInviteCode();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    await DB.prepare(
      'INSERT INTO invite_codes (id, code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(codeId, code, adminUser.id, maxUses, expiresAt).run();
    
    return Response.json({
      success: true,
      code,
      expiresAt
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取邀请码列表（仅管理员）
async function handleGetInviteCodes(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }
    
    const codes = await DB.prepare(
      'SELECT ic.*, u.username as created_by_name FROM invite_codes ic LEFT JOIN users u ON ic.created_by = u.id ORDER BY ic.created_at DESC'
    ).all();
    
    // Convert snake_case to camelCase for frontend
    const convertedCodes = codes.results.map(row => ({
      id: row.id,
      code: row.code,
      maxUses: row.max_uses,
      usedCount: row.used_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      created_by_name: row.created_by_name,
      isActive: row.is_active
    }));
    
    return Response.json({
      success: true,
      codes: convertedCodes
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 删除邀请码（仅管理员）
async function handleDeleteInviteCode(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const codeId = url.searchParams.get('id');
    
    await DB.prepare(
      'UPDATE invite_codes SET is_active = 0 WHERE id = ?'
    ).bind(codeId).run();
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取用户列表（仅管理员）
async function handleGetUsers(request, env) {
  const DB = env.DB || env.rualive;

  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }

    const users = await DB.prepare(
      `SELECT u.id, u.email, u.username, u.role, u.created_at, u.last_login,
              uc.daily_email_limit, uc.daily_email_count, uc.last_email_date
       FROM users u
       LEFT JOIN user_configs uc ON u.id = uc.user_id
       ORDER BY u.created_at DESC`
    ).all();

    // Convert snake_case to camelCase for frontend
    const convertedUsers = users.results.map(row => ({
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      dailyEmailLimit: row.daily_email_limit,
      dailyEmailCount: row.daily_email_count,
      lastEmailDate: row.last_email_date
    }));

    return Response.json({
      success: true,
      users: convertedUsers
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// API密钥管理（仅管理员）
async function handleGetApiKey(request, env) {
  try {
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
    }

    const KV = env.KV;
    let apiKey = '';

    // 优先从KV存储读取
    if (KV) {
      apiKey = await KV.get('RESEND_API_KEY') || '';
    }

    // 回退到环境变量
    if (!apiKey) {
      apiKey = env.RESEND_API_KEY || '';
    }

    return Response.json({
      success: true,
      apiKey: apiKey,
      isSet: !!apiKey
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleSetApiKey(request, env) {
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return Response.json({ success: false, error: 'API密钥不能为空' }, { status: 400 });
    }

    // 测试API密钥是否有效
    try {
      const testResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'test@resend.dev',
          to: 'test@example.com',
          subject: 'API Key Test',
          html: '<p>Test</p>'
        })
      });
      
      if (testResponse.status === 401 || testResponse.status === 403) {
        return Response.json({ success: false, error: 'API密钥无效' }, { status: 400 });
      }
    } catch (error) {
      // 测试失败，但不阻止保存（可能是网络问题）
      console.warn('API key test failed:', error);
    }

    // 注意：这里不能直接设置环境变量，需要用户手动设置
    return Response.json({
      success: true,
      message: '请使用以下命令更新API密钥：wrangler secret put RESEND_API_KEY',
      apiKey: apiKey
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDeleteApiKey(request, env) {
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }

    // 注意：这里不能直接删除环境变量，需要用户手动删除
    return Response.json({
      success: true,
      message: '请使用以下命令删除API密钥：wrangler secret delete RESEND_API_KEY'
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleTestApiKey(request, env) {
  try {
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({ success: false, error: '权限不足，需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey, testEmail } = body;

    if (!apiKey) {
      return Response.json({ success: false, error: 'API密钥不能为空' }, { status: 400 });
    }

    // 获取管理员信息
    const DB = env.DB || env.rualive;
    const user = await DB.prepare(
      'SELECT id, email, username FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) {
      return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 获取管理员邮箱
    const adminEmail = user.email;

    // 确定接收测试邮件的邮箱地址
    const recipientEmail = testEmail || adminEmail;

    // 检查测试次数限制（每天每个邮箱最多3次）
    const today = new Date().toISOString().split('T')[0];
    const testCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM test_email_logs WHERE test_email = ? AND test_date = ?'
    ).bind(recipientEmail, today).first();

    if (testCount && testCount.count >= 3) {
      return Response.json({
        success: false,
        error: `今日测试次数已达上限（3次），请明天再试。邮箱：${recipientEmail}`
      }, { status: 429 });
    }

    // 发送测试邮件
    const testSubject = '[RuAlive] API密钥测试邮件';
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f0fdf4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
      overflow: hidden;
      border: 2px solid #86efac;
    }
    .header {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .success-icon {
      text-align: center;
      font-size: 64px;
      margin: 24px 0;
    }
    .success-title {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 16px;
    }
    .success-message {
      text-align: center;
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6b7280;
      font-size: 14px;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 4px 0;
      color: #9ca3af;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #bbf7d0;
      color: #166534;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ 测试成功</h1>
      <p>${new Date().toLocaleDateString('zh-CN')}</p>
      <span class="badge">API密钥验证</span>
    </div>
    <div class="content">
      <div class="success-icon">🎉</div>
      <div class="success-title">API密钥配置正确</div>
      <div class="success-message">邮件发送功能正常工作</div>

      <div class="info-box">
        <div class="info-item">
          <span class="info-label">测试时间</span>
          <span class="info-value">${new Date().toLocaleString('zh-CN')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">接收邮箱</span>
          <span class="info-value">${recipientEmail}</span>
        </div>
        <div class="info-item">
          <span class="info-label">测试次数</span>
          <span class="info-value">${testCount ? testCount.count + 1 : 1}/3（今日）</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>📧 此邮件由 RuAlive 自动发送</p>
        <p>这是一封测试邮件，请勿回复</p>
        <p style="margin-top: 8px;">© ${new Date().getFullYear()} RuAlive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const KV = env.KV;
      let actualApiKey = '';

      if (KV) {
        actualApiKey = await KV.get('RESEND_API_KEY') || '';
      }

      if (!actualApiKey) {
        actualApiKey = env.RESEND_API_KEY || '';
      }

      // 使用提供的API密钥进行测试
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'RuAlive@itycon.cn',
          to: [recipientEmail],
          subject: testSubject,
          html: testHtml
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return Response.json({
          success: false,
          error: 'API密钥测试失败: ' + error
        }, { status: 400 });
      }

      // 记录测试日志
      await DB.prepare(
        'INSERT INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
      ).bind(payload.userId, recipientEmail, today).run();

      const remainingTests = 3 - (testCount ? testCount.count + 1 : 1);
      return Response.json({
        success: true,
        message: `测试邮件已发送到 ${recipientEmail}，今日剩余测试次数：${remainingTests}`,
        remainingTests: remainingTests
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: 'API密钥测试失败: ' + error.message
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ==================== 用户管理功能 - 管理员专用 ====================

// 删除用户
async function handleDeleteUser(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 1. 验证管理员权限
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可删除用户'
      }, { status: 403 });
    }

    // 2. 获取要删除的用户ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userIdToDelete = pathParts[pathParts.length - 1];

    // 3. 防止删除自己
    if (userIdToDelete === adminUser.id) {
      return Response.json({
        success: false,
        error: '无法删除自己的账户'
      }, { status: 400 });
    }

    // 4. 检查用户是否存在
    const userToDelete = await DB.prepare(
      'SELECT id, username, role FROM users WHERE id = ?'
    ).bind(userIdToDelete).first();

    if (!userToDelete) {
      return Response.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 5. 检查是否是最后一个管理员
    if (userToDelete.role === 'admin') {
      const adminCount = await DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE role = ?'
      ).bind('admin').first();

      if (adminCount.count <= 1) {
        return Response.json({
          success: false,
          error: '无法删除最后一个管理员账户'
        }, { status: 400 });
      }
    }

    // 6. 执行删除（级联删除会自动处理关联表）
    await DB.prepare('DELETE FROM users WHERE id = ?').bind(userIdToDelete).run();

    // 7. 记录操作日志
    console.log(`[Admin] User ${payload.userId} deleted user ${userIdToDelete} (${userToDelete.username})`);

    // 8. 返回成功响应
    return Response.json({
      success: true,
      message: '用户已成功删除',
      deletedUserId: userIdToDelete,
      deletedUsername: userToDelete.username
    });

  } catch (error) {
    console.error('[DeleteUser] Error:', error);
    return Response.json({
      success: false,
      error: '删除用户失败: ' + error.message
    }, { status: 500 });
  }
}

// 重置密码
async function handleResetPassword(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 1. 验证管理员权限
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可重置密码'
      }, { status: 403 });
    }

    // 2. 获取用户ID和请求数据
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];
    const body = await request.json();

    // 自动判断模式：如果提供了newPassword则使用'set'模式，否则使用'generate'模式
    const method = body.method || (body.newPassword ? 'set' : 'generate');

    // 3. 检查用户是否存在
    const user = await DB.prepare(
      'SELECT id, username, email FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return Response.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 4. 生成或设置密码
    let newPassword;
    if (method === 'generate') {
      // 生成12位随机密码
      newPassword = generateSecurePassword(12);
    } else if (method === 'set') {
      // 验证密码长度（管理员重置密码只需至少6位）
      if (!body.newPassword || body.newPassword.length < 6) {
        return Response.json({
          success: false,
          error: '密码长度至少需要6个字符'
        }, { status: 400 });
      }
      newPassword = body.newPassword;
    }

    // 5. 生成密码哈希（使用bcrypt，与验证保持一致）
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 6. 更新用户密码和强制修改标记
    await DB.prepare(`
      UPDATE users
      SET password_hash = ?,
          force_password_reset = 1,
          password_reset_token = ?,
          password_reset_expires_at = ?
      WHERE id = ?
    `).bind(
      passwordHash,
      null,
      null,
      userId
    ).run();

    // 7. 发送邮件通知
    const emailSubject = 'RuAlive 密码重置通知';
    const emailBody = `
      <h2>密码已重置</h2>
      <p>您好，${user.username}：</p>
      <p>您的密码已被管理员重置。</p>
      <p>临时密码：<strong>${newPassword}</strong></p>
      <p>请使用此密码登录，登录后请立即修改密码。</p>
      <p>临时密码有效期：24小时</p>
      <p>如果这不是您本人的操作，请立即联系管理员。</p>
    `;

    // 获取API密钥
    const KV = env.KV;
    let actualApiKey = '';
    if (KV) {
      actualApiKey = await KV.get('RESEND_API_KEY') || '';
    }
    if (!actualApiKey) {
      actualApiKey = env.RESEND_API_KEY || '';
    }

    let emailSent = false;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + actualApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || 'RuAlive@itycon.cn',
          to: [user.email],
          subject: emailSubject,
          html: emailBody
        })
      });
      emailSent = response.ok;
    } catch (error) {
      console.error('[ResetPassword] Email send failed:', error);
    }

    // 8. 记录操作日志
    console.log(`[Admin] User ${payload.userId} reset password for user ${userId} (${user.username})`);

    // 9. 返回成功响应
    return Response.json({
      success: true,
      message: '密码已重置',
      userId,
      username: user.username,
      method,
      emailSent
    });

  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return Response.json({
      success: false,
      error: '重置密码失败: ' + error.message
    }, { status: 500 });
  }
}

// 获取用户邮件统计
async function handleGetUserEmailStats(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 1. 验证管理员权限
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可查看统计'
      }, { status: 403 });
    }

    // 2. 获取用户ID和查询参数
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];
    const startDate = url.searchParams.get('startDate') || '1970-01-01';
    const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const status = url.searchParams.get('status') || 'all';

    // 3. 获取用户信息
    const user = await DB.prepare(
      'SELECT id, username, email FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return Response.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 4. 构建查询条件
    let query = 'SELECT * FROM email_logs WHERE user_id = ? AND sent_at >= ? AND sent_at <= ?';
    const params = [userId, startDate + ' 00:00:00', endDate + ' 23:59:59'];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    // 5. 获取统计信息
    const logs = await DB.prepare(query).bind(...params).all();

    const totalSent = logs.results.filter(l => l.status === 'sent').length;
    const totalFailed = logs.results.filter(l => l.status === 'failed').length;
    const totalPending = logs.results.filter(l => l.status === 'pending').length;
    const lastSentAt = logs.results.filter(l => l.status === 'sent').sort((a, b) =>
      new Date(b.sent_at) - new Date(a.sent_at)
    )[0]?.sent_at;

    // 6. 按日期分组统计
    const dailyStats = {};
    logs.results.forEach(log => {
      const date = log.sent_at ? log.sent_at.split(' ')[0] : new Date().toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { sent: 0, failed: 0, pending: 0 };
      }
      dailyStats[date][log.status]++;
    });

    const dailyStatsArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats
    }));

    // 7. 获取用户邮件限制配置
    const config = await DB.prepare(
      'SELECT enabled, daily_email_limit FROM user_configs WHERE user_id = ?'
    ).bind(userId).first();

    // 计算今日发送数量
    const today = new Date().toISOString().split('T')[0];
    const emailsSentToday = logs.results.filter(l =>
      l.sent_at && l.sent_at.startsWith(today) && l.status === 'sent'
    ).length;

    // 8. 返回结果（符合前端 UserEmailStats 接口）
    return Response.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        totalEmailsSent: totalSent,
        totalEmailsFailed: totalFailed,
        lastEmailSentAt: lastSentAt,
        emailLimit: {
          dailyLimit: config && config.enabled && config.daily_email_limit ? config.daily_email_limit : 0,
          emailsSentToday: emailsSentToday,
          remainingToday: config && config.enabled && config.daily_email_limit ? Math.max(0, config.daily_email_limit - emailsSentToday) : 0
        },
        dailyStats: dailyStatsArray,
        recentLogs: logs.results
          .sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0))
          .slice(0, 10)
          .map(log => ({
            id: log.id,
            subject: log.subject,
            status: log.status,
            sentAt: log.sent_at,
            errorMessage: log.error_message
          }))
      }
    });

  } catch (error) {
    console.error('[GetUserEmailStats] Error:', error);
    return Response.json({
      success: false,
      error: '获取统计失败: ' + error.message
    }, { status: 500 });
  }
}

// 获取全局邮件统计
async function handleGetEmailStats(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 1. 验证管理员权限
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可查看统计'
      }, { status: 403 });
    }

    // 2. 获取全局统计
    const totalSent = await DB.prepare('SELECT COUNT(*) as count FROM email_logs WHERE status = ?').bind('success').first();
    const totalFailed = await DB.prepare('SELECT COUNT(*) as count FROM email_logs WHERE status = ?').bind('failed').first();

    // 3. 获取最近24小时的统计
    const last24hSent = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE status = 'success'
      AND datetime(sent_at) >= datetime('now', '-24 hours')
    `).first();

    const last24hFailed = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE status = 'failed'
      AND datetime(sent_at) >= datetime('now', '-24 hours')
    `).first();

    // 4. 获取最后发送时间
    const lastEmail = await DB.prepare(`
      SELECT sent_at
      FROM email_logs
      WHERE status = 'success'
      ORDER BY sent_at DESC
      LIMIT 1
    `).first();

    // 5. 计算成功率
    const total = totalSent.count + totalFailed.count;
    const successRate = total > 0 ? ((totalSent.count / total) * 100).toFixed(1) : 0;

    // 6. 返回结果
    return Response.json({
      success: true,
      data: {
        totalEmailsSent: totalSent.count || 0,
        totalEmailsFailed: totalFailed.count || 0,
        successRate: parseFloat(successRate),
        last24Hours: {
          sent: last24hSent.count || 0,
          failed: last24hFailed.count || 0
        },
        lastEmailSentAt: lastEmail ? lastEmail.sent_at : null
      }
    });

  } catch (error) {
    console.error('[GetEmailStats] Error:', error);
    return Response.json({
      success: false,
      error: '获取统计失败: ' + error.message
    }, { status: 500 });
  }
}

// 设置邮件限制
async function handleSetEmailLimit(request, env) {
  const DB = env || env.rualive;

  try {
    // 1. 验证管理员权限
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可设置限制'
      }, { status: 403 });
    }

    // 2. 获取用户ID和请求数据
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];
    const body = await request.json();
    const dailyEmailLimit = body.dailyEmailLimit;

    // 3. 验证限制值
    if (dailyEmailLimit < 0 || dailyEmailLimit > 5) {
      return Response.json({
        success: false,
        error: '邮件限制必须在 0-5 之间'
      }, { status: 400 });
    }

    // 4. 检查用户是否存在
    const user = await DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return Response.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 5. 更新邮件限制
    await DB.prepare(`
      INSERT INTO user_configs (user_id, daily_email_limit)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET daily_email_limit = excluded.daily_email_limit
    `).bind(userId, dailyEmailLimit).run();

    // 6. 记录操作日志
    console.log(`[Admin] User ${payload.userId} set email limit to ${dailyEmailLimit} for user ${userId}`);

    // 7. 返回成功响应
    return Response.json({
      success: true,
      message: '邮件限制已设置',
      userId,
      dailyEmailLimit
    });

  } catch (error) {
    console.error('[SetEmailLimit] Error:', error);
    return Response.json({
      success: false,
      error: '设置限制失败: ' + error.message
    }, { status: 500 });
  }
}

// 获取邮件限制状态
async function handleGetEmailLimitStatus(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 1. 验证管理员权限
    const adminUser = await verifyAdmin(request, env);
    if (!adminUser) {
      return Response.json({
        success: false,
        error: '权限不足，仅管理员可查看状态'
      }, { status: 403 });
    }

    // 2. 获取用户ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts - 2];

    // 3. 获取配置
    const config = await DB.prepare(
      'SELECT daily_email_limit, daily_email_count, last_email_date FROM user_configs WHERE user_id = ?'
    ).bind(userId).first();

    // 4. 如果配置不存在，返回默认值
    if (!config) {
      return Response.json({
        success: true,
        data: {
          userId,
          dailyEmailLimit: 10,
          dailyEmailCount: 0,
          remaining: 10,
          lastEmailDate: null
        }
      });
    }

    // 5. 检查是否是新的一天
    const today = new Date().toISOString().split('T')[0];
    let dailyEmailCount = config.daily_email_count;
    if (config.last_email_date !== today) {
      dailyEmailCount = 0;
    }

    // 6. 返回结果
    return Response.json({
      success: true,
      data: {
        userId,
        dailyEmailLimit: config.daily_email_limit,
        dailyEmailCount,
        remaining: config.daily_email_limit - dailyEmailCount,
        lastEmailDate: config.last_email_date
      }
    });

  } catch (error) {
    console.error('[GetEmailLimitStatus] Error:', error);
    return Response.json({
      success: false,
      error: '获取状态失败: ' + error.message
    }, { status: 500 });
  }
}

// 检查邮件限制
async function checkEmailLimit(userId, env) {
  const DB = env.DB || env.rualive;
  const today = new Date().toISOString().split('T')[0];

  // 获取用户配置
  const config = await DB.prepare(
    'SELECT daily_email_limit, daily_email_count, last_email_date FROM user_configs WHERE user_id = ?'
  ).bind(userId).first();

  // 如果配置不存在，创建默认配置
  if (!config) {
    await DB.prepare(`
      INSERT INTO user_configs (user_id, daily_email_limit, daily_email_count, last_email_date)
      VALUES (?, 10, 0, ?)
    `).bind(userId, today).run();
    return { allowed: true, remaining: 10 };
  }

  // 如果是新的一天，重置计数器
  if (config.last_email_date !== today) {
    await DB.prepare(`
      UPDATE user_configs
      SET daily_email_count = 0, last_email_date = ?
      WHERE user_id = ?
    `).bind(today, userId).run();
    config.daily_email_count = 0;
  }

  // 检查是否超限
  if (config.daily_email_count >= config.daily_email_limit) {
    return {
      allowed: false,
      reason: 'daily_limit_exceeded',
      limit: config.daily_email_limit,
      current: config.daily_email_count,
      message: `每日发送次数已达上限 (${config.daily_email_limit})`
    };
  }

  return {
    allowed: true,
    remaining: config.daily_email_limit - config.daily_email_count
  };
}

// 增加发送计数
async function incrementEmailCount(userId, env) {
  const DB = env.DB || env.rualive;
  await DB.prepare(`
    UPDATE user_configs
    SET daily_email_count = daily_email_count + 1
    WHERE user_id = ?
  `).bind(userId).run();
}

// 生成安全密码
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 验证密码强度
function isPasswordStrong(password) {
  // 至少8位，包含大小写字母、数字和特殊字符
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

// ==================== API处理函数 ====================

async function handleGetConfig(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const config = await getUserConfig(userId, env);
    return Response.json({ success: true, data: config });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleUpdateConfig(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return Response.json({ error: 'Missing config' }, { status: 400 });
    }

    await saveUserConfig(payload.userId, config, env);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleWorkData(request, env) {
  console.log('[handleWorkData] ========== 开始处理工作数据上传请求 ==========');
  console.log('[handleWorkData] 请求URL:', request.url);
  console.log('[handleWorkData] 请求方法:', request.method);
  console.log('[handleWorkData] 请求头:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log('[handleWorkData] 请求体:', body);
    const { userId, workData, workDate, systemInfo } = body;

    if (!userId || !workData) {
      console.log('[handleWorkData] 缺少参数: userId=', userId, ', workData=', workData);
      return Response.json({ error: 'Missing userId or workData' }, { status: 400 });
    }

    // 验证用户权限（排除管理员）
    const user = await verifyUserOnly(request, env);
    if (!user) {
      console.log('[handleWorkData] 权限不足：用户不存在或为管理员');
      return Response.json({ error: '权限不足：此接口仅限普通用户使用' }, { status: 403 });
    }

    // 确保用户只能上传自己的数据
    if (userId !== user.id) {
      console.log('[handleWorkData] 用户ID不匹配: 请求userId=', userId, ', 用户ID=', user.id);
      return Response.json({ error: '只能上传自己的工作数据' }, { status: 403 });
    }

    // 使用传入的日期，如果没有则使用当天日期
    const date = workDate || new Date().toISOString().split('T')[0];
    console.log('[handleWorkData] 准备保存数据: userId=', userId, ', date=', date, ', workData=', workData);
    
    // 如果有系统信息，提取并保存
    if (systemInfo) {
      console.log('[handleWorkData] 包含系统信息:', JSON.stringify(systemInfo.ae));
      await saveSystemInfo(userId, systemInfo, env);
    }
    
    await saveWorkData(userId, workData, env, date);
    console.log('[handleWorkData] 数据保存成功');
    return Response.json({ success: true });
  } catch (error) {
    console.log('[handleWorkData] 发生错误:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 保存系统信息到数据库
 * @param {string} userId - 用户ID
 * @param {Object} systemInfo - 系统信息对象
 * @param {Object} env - 环境变量
 */
async function saveSystemInfo(userId, systemInfo, env) {
  const DB = env.DB || env.rualive;
  const now = new Date().toISOString();

  try {
    // 提取系统信息
    const aeInfo = systemInfo.ae || {};
    const sysInfo = systemInfo.system || {};

    console.log('[saveSystemInfo] 收到系统信息:', JSON.stringify(systemInfo));
    console.log('[saveSystemInfo] aeInfo:', JSON.stringify(aeInfo));
    console.log('[saveSystemInfo] sysInfo:', JSON.stringify(sysInfo));

    // 检查记录是否存在
    const existingRecord = await DB.prepare(`
      SELECT user_id FROM ae_status WHERE user_id = ?
    `).bind(userId).first();

    if (existingRecord) {
      console.log('[saveSystemInfo] 更新现有记录');
      // 更新现有记录 - 只保存必要字段：ae_version、os_name、updated_at
      await DB.prepare(`
        UPDATE ae_status 
        SET ae_version = ?,
            os_name = ?,
            updated_at = ?
        WHERE user_id = ?
      `).bind(
        aeInfo.version || null,
        sysInfo.os || null,
        now,
        userId
      ).run();
    } else {
      console.log('[saveSystemInfo] 插入新记录');
      // 插入新记录 - 只保存必要字段
      await DB.prepare(`
        INSERT INTO ae_status 
        (user_id, ae_version, os_name, is_online, last_heartbeat, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).bind(
        userId,
        aeInfo.version || null,
        sysInfo.os || null,
        now,
        now
      ).run();
    }

    console.log('[saveSystemInfo] 系统信息保存成功');
  } catch (error) {
    console.error('[saveSystemInfo] 保存系统信息失败:', error);
    // 不抛出错误，因为系统信息是可选的
  }
}

async function handleHeartbeat(request, env) {
  try {
    // 验证用户权限（排除管理员）
    const user = await verifyUserOnly(request, env);
    if (!user) {
      return Response.json({ error: '权限不足：此接口仅限普通用户使用' }, { status: 403 });
    }

    const userId = user.id;
    const DB = env.DB || env.rualive;

    // 更新用户最后在线时间
    const now = new Date().toISOString();
    await DB.prepare(`
      UPDATE users SET last_online = ? WHERE id = ?
    `).bind(now, userId).run();

    // 同时更新 AE 在线状态 - 使用 UPDATE 而不是 INSERT OR REPLACE，避免覆盖系统信息
    await DB.prepare(`
      UPDATE ae_status 
      SET is_online = 1, last_heartbeat = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(now, now, userId).run();

    return Response.json({ success: true, timestamp: now });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 获取 AE 在线状态
async function handleGetAEStatus(request, env) {
  try {
    // 验证用户权限（排除管理员）
    const user = await verifyUserOnly(request, env);
    if (!user) {
      return Response.json({ error: '权限不足：此接口仅限普通用户使用' }, { status: 403 });
    }

    const userId = user.id;
    const DB = env.DB || env.rualive;

    // 获取用户的 AE 在线状态
    const status = await DB.prepare(`
      SELECT * FROM ae_status WHERE user_id = ?
    `).bind(userId).first();

    // 判断是否在线（5分钟内有心跳）
    let isOnline = false;
    let lastHeartbeatTime = null;

    if (status && status.last_heartbeat) {
      const lastHeartbeat = new Date(status.last_heartbeat);
      const now = new Date();
      const diffMinutes = (now - lastHeartbeat) / (1000 * 60);
      isOnline = diffMinutes < 5;
      lastHeartbeatTime = status.last_heartbeat;
    }

    // 如果没有状态记录，返回默认离线状态
    return Response.json({
      success: true,
      data: {
        isOnline: isOnline,
        lastHeartbeat: lastHeartbeatTime,
        projectName: status?.project_name || null,
        compositionName: status?.composition_name || null,
        projectId: status?.project_id || null,
        lastWorkData: status?.last_work_data ? JSON.parse(status.last_work_data) : null,
        ae_version: status?.ae_version || null,
        os_name: status?.os_name || null,
        updated_at: status?.updated_at || null
      }
    });
  } catch (error) {
    console.error('Get AE status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 更新 AE 在线状态
async function handleUpdateAEStatus(request, env) {
  try {
    // 验证用户权限（排除管理员）
    const user = await verifyUserOnly(request, env);
    if (!user) {
      return Response.json({ error: '权限不足：此接口仅限普通用户使用' }, { status: 403 });
    }

    const userId = user.id;
    const body = await request.json();
    const {
      isOnline,
      projectName,
      compositionName,
      workData,
      projectId
    } = body;

    const DB = env.DB || env.rualive;
    const now = new Date().toISOString();

    // 更新 AE 在线状态 - 使用 UPDATE 而不是 INSERT OR REPLACE，避免覆盖系统信息
    await DB.prepare(`
      UPDATE ae_status 
      SET is_online = ?, last_heartbeat = ?, project_name = ?, composition_name = ?, last_work_data = ?, project_id = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(
      isOnline ? 1 : 0,
      now,
      projectName || null,
      compositionName || null,
      workData ? JSON.stringify(workData) : null,
      projectId || null,
      now,
      userId
    ).run();

    return Response.json({
      success: true,
      timestamp: now
    });
  } catch (error) {
    console.error('Update AE status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleSendNow(request, env) {
  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const user = await getUser(userId, env);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 检查邮件发送限制
    const limitCheck = await checkEmailLimit(userId, env);
    if (!limitCheck.allowed) {
      return Response.json({
        error: limitCheck.message,
        limit: limitCheck.limit,
        current: limitCheck.current
      }, { status: 429 });
    }

    // 获取请求体中的收件人选择（安全处理空body）
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // 请求没有body，使用默认值
      body = {};
    }
    const recipient = body.recipient || 'user';

    // 检查测试次数限制（每天每个用户最多3次）
    const DB = env.DB || env.rualive;
    const today = new Date().toISOString().split('T')[0];
    const testCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM test_email_logs WHERE user_id = ? AND test_date = ?'
    ).bind(userId, today).first();

    if (testCount && testCount.count >= 3) {
      return Response.json({
        error: '今日测试次数已达上限（3次），请明天再试'
      }, { status: 429 });
    }

    const config = await getUserConfig(userId, env);
    const workData = await getWorkData(userId, today, env);

    console.log('Config:', config);
    console.log('WorkData:', workData);

    if (recipient === 'emergency') {
      // 发送给紧急联系人
      if (!config) {
        return Response.json({
          error: '未配置用户配置'
        }, { status: 400 });
      }
      if (!config.emergency_email) {
        return Response.json({
          error: '未配置紧急联系人邮箱'
        }, { status: 400 });
      }
      console.log('Sending warning email to emergency contact');
      await sendWarningEmail(user, workData, config, env);
    } else {
      // 发送给用户
      console.log('Sending daily summary to user');
      await sendDailySummary(user, workData, config, env);
    }

    // 增加邮件发送计数
    await incrementEmailCount(userId, env);

    // 记录测试日志
    const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
    try {
      await DB.prepare(
        'INSERT OR IGNORE INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
      ).bind(userId, testEmail, today).run();
    } catch (error) {
      // 忽略重复插入错误，使用已有的记录
      console.log('Test email log already exists:', error.message);
    }

    const remainingTests = 3 - (testCount ? testCount.count + 1 : 1);
    const recipientName = recipient === 'emergency' ? '紧急联系人' : '用户';
    return Response.json({
      success: true,
      message: `测试邮件已发送给${recipientName}，今日剩余测试次数：${remainingTests}`,
      remainingTests: remainingTests
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleGetLogs(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // 如果是管理员，返回所有用户的邮件日志
    if (payload.role === 'admin') {
      const logs = await getAllSendLogs(limit, env);
      return Response.json({ success: true, logs: logs });
    }

    // 普通用户只返回自己的邮件日志
    const userId = payload.userId;
    const logs = await getSendLogs(userId, limit, env);
    return Response.json({ success: true, logs: logs });
  } catch (error) {
    console.error('handleGetLogs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleGetWorkLogsRange(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    if (!startDate || !endDate) {
      return Response.json({ error: '缺少 start_date 或 end_date 参数' }, { status: 400 });
    }
    
    // 获取日期范围内的工作日志（包含详细数据）
    const result = await DB.prepare(
      'SELECT * FROM work_logs WHERE user_id = ? AND work_date BETWEEN ? AND ? ORDER BY work_date DESC'
    ).bind(userId, startDate, endDate).all();
    
    return Response.json({ success: true, data: result.results || [] });
  } catch (error) {
    console.error('handleGetWorkLogsRange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleGetWorkLogs(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    let result;
    if (date) {
      // 获取特定日期的工作日志（包含详细数据）
      result = await DB.prepare(
        'SELECT * FROM work_logs WHERE user_id = ? AND work_date = ?'
      ).bind(userId, date).all();
    } else {
      // 获取所有工作日志（不包含详细数据，减少数据传输）
      result = await DB.prepare(
        'SELECT id, user_id, work_date, work_hours, keyframe_count, json_size, project_count, composition_count, layer_count, effect_count FROM work_logs WHERE user_id = ? ORDER BY work_date DESC'
      ).bind(userId).all();
    }
    
    return Response.json({ success: true, data: result.results || [] });
  } catch (error) {
    console.error('handleGetWorkLogs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ==================== 项目相关 API ====================

// 获取所有项目的总时长列表
async function handleGetProjectsSummary(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;

    // 从projects表获取用户的所有项目及其总时长
    const result = await DB.prepare(
      'SELECT project_id, project_name, total_work_hours, total_work_days, first_work_date, last_work_date FROM projects WHERE user_id = ? ORDER BY last_work_date DESC'
    ).bind(userId).all();

    return Response.json({
      success: true,
      projects: result.results || []
    });
  } catch (error) {
    console.error('handleGetProjectsSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 获取单个项目的历史数据
async function handleGetProjectHistory(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 从token获取用户ID
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return Response.json({ error: '缺少projectId参数' }, { status: 400 });
    }

    // 查询项目信息
    let project = await DB.prepare(
      'SELECT id, project_id, project_name FROM projects WHERE user_id = ? AND project_id = ?'
    ).bind(userId, projectId).first();

    // 如果 projects 表中没有记录，从 work_logs 表中查询并创建记录
    if (!project) {
      console.log('[handleGetProjectHistory] 项目不在 projects 表中，尝试从 work_logs 表中查询:', projectId);

      // 从 work_logs 表中查询所有包含该项目的日志
      const workLogs = await DB.prepare(
        'SELECT work_date, projects_json, work_hours_json FROM work_logs WHERE user_id = ? AND projects_json IS NOT NULL ORDER BY work_date DESC'
      ).bind(userId).all();

      if (workLogs.results && workLogs.results.length > 0) {
        // 在 JavaScript 中过滤出匹配的项目
        const matchingLogs = workLogs.results.filter(log => {
          if (!log.projects_json) return false;
          try {
            const projects = JSON.parse(log.projects_json);
            return Array.isArray(projects) && projects.some(p => p.projectId === projectId);
          } catch (e) {
            return false;
          }
        });

        if (matchingLogs.length > 0) {
          // 获取第一个匹配日志中的项目信息
          const firstProject = JSON.parse(matchingLogs[0].projects_json).find(p => p.projectId === projectId);
          const firstWorkDate = matchingLogs[0].work_date;
          const lastWorkDate = firstWorkDate;

          // 计算总时长和总天数
          let totalWorkHours = 0;
          let totalWorkDays = 0;

          matchingLogs.forEach(log => {
            const projects = JSON.parse(log.projects_json);
            const project = projects.find(p => p.projectId === projectId);
            if (project) {
              totalWorkHours += (project.dailyRuntime || 0) / 3600; // 转换为小时
              totalWorkDays += 1;
            }
          });

          // 在 projects 表中创建记录
          await DB.prepare(`
            INSERT INTO projects (
              user_id, project_id, project_name, project_path,
              first_work_date, last_work_date, total_work_hours, total_work_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            userId,
            projectId,
            firstProject.name || '未知项目',
            firstProject.path || '',
            firstWorkDate,
            lastWorkDate,
            totalWorkHours,
            totalWorkDays
          ).run();

          console.log('[handleGetProjectHistory] 已在 projects 表中创建记录:', projectId);

          // 重新查询项目信息
          project = await DB.prepare(
            'SELECT id, project_id, project_name FROM projects WHERE user_id = ? AND project_id = ?'
          ).bind(userId, projectId).first();
        }
      }
    }

    if (!project) {
      return Response.json({ error: '项目不存在' }, { status: 404 });
    }

    // 查询项目的历史数据
    const dailyStats = await DB.prepare(
      'SELECT work_date, work_hours, accumulated_runtime, composition_count, layer_count, keyframe_count, effect_count FROM project_daily_stats WHERE project_id = ? ORDER BY work_date DESC'
    ).bind(project.id).all();

    // 如果 project_daily_stats 表中没有数据，尝试从 work_logs 表中聚合
    if (!dailyStats.results || dailyStats.results.length === 0) {
      console.log('[handleGetProjectHistory] project_daily_stats 表中没有数据，尝试从 work_logs 表中聚合:', projectId);

      const workLogs = await DB.prepare(
        'SELECT work_date, projects_json FROM work_logs WHERE user_id = ? AND projects_json IS NOT NULL ORDER BY work_date DESC'
      ).bind(userId).all();

      if (workLogs.results && workLogs.results.length > 0) {
        // 在 JavaScript 中过滤出匹配的项目
        const matchingLogs = workLogs.results.filter(log => {
          if (!log.projects_json) return false;
          try {
            const projects = JSON.parse(log.projects_json);
            return Array.isArray(projects) && projects.some(p => p.projectId === projectId);
          } catch (e) {
            return false;
          }
        });

        if (matchingLogs.length > 0) {
          const aggregatedStats = matchingLogs.map((log) => {
            const projects = JSON.parse(log.projects_json);
            const project = projects.find(p => p.projectId === projectId);
            return {
              work_date: log.work_date,
              work_hours: (project?.dailyRuntime || 0) / 3600, // 转换为小时
              accumulated_runtime: project?.dailyRuntime || 0,
              composition_count: project?.statistics?.compositions || 0,
              layer_count: project?.statistics?.layers || 0,
              keyframe_count: project?.statistics?.keyframes || 0,
              effect_count: project?.statistics?.effects || 0
            };
          });

          console.log('[handleGetProjectHistory] 已从 work_logs 表中聚合', aggregatedStats.length, '天的数据');

          return Response.json({
            success: true,
            projectId: project.project_id,
            projectName: project.project_name,
            dailyStats: aggregatedStats
          });
        }
      }
    }

    return Response.json({
      success: true,
      projectId: project.project_id,
      projectName: project.project_name,
      dailyStats: dailyStats.results || []
    });
  } catch (error) {
    console.error('handleGetProjectHistory error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 修改项目运行时长
async function handleUpdateProjectDailyStats(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 验证用户身份
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[3]; // /api/projects/:projectId/daily-stats/:date
    const workDate = pathParts[5];

    if (!projectId || !workDate) {
      return Response.json({ error: '缺少 projectId 或 date 参数' }, { status: 400 });
    }

    // 验证项目所有权
    const project = await DB.prepare(
      'SELECT id, project_id, user_id FROM projects WHERE user_id = ? AND project_id = ?'
    ).bind(userId, projectId).first();

    if (!project) {
      return Response.json({ error: '项目不存在或无权访问' }, { status: 404 });
    }

    // 解析请求体
    const body = await request.json();
    const { work_hours } = body;

    if (typeof work_hours !== 'number' || work_hours < 0) {
      return Response.json({ error: '无效的 work_hours 值' }, { status: 400 });
    }

    // 更新或创建日统计记录
    const accumulated_runtime = work_hours * 3600; // 转换为秒
    const result = await DB.prepare(`
      INSERT INTO project_daily_stats (project_id, work_date, work_hours, accumulated_runtime)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(project_id, work_date) DO UPDATE SET
        work_hours = excluded.work_hours,
        accumulated_runtime = excluded.accumulated_runtime
    `).bind(project.id, workDate, work_hours, accumulated_runtime).run();

    console.log('[handleUpdateProjectDailyStats] 更新成功:', {
      projectId,
      workDate,
      work_hours,
      accumulated_runtime
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('handleUpdateProjectDailyStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 删除项目
async function handleDeleteProject(request, env) {
  const DB = env.DB || env.rualive;

  try {
    // 验证用户身份
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[3]; // /api/projects/:projectId

    if (!projectId) {
      return Response.json({ error: '缺少 projectId 参数' }, { status: 400 });
    }

    // 验证项目所有权
    const project = await DB.prepare(
      'SELECT id, project_id, user_id FROM projects WHERE user_id = ? AND project_id = ?'
    ).bind(userId, projectId).first();

    if (!project) {
      return Response.json({ error: '项目不存在或无权访问' }, { status: 404 });
    }

    // 删除项目（级联删除 project_daily_stats 和清理 work_logs）
    const projectDbId = project.id;
    
    // 先删除日统计
    await DB.prepare('DELETE FROM project_daily_stats WHERE project_id = ?')
      .bind(projectDbId).run();
    
    // 清理 work_logs 表中的项目数据
    const workLogs = await DB.prepare(
      'SELECT id, projects_json FROM work_logs WHERE user_id = ? AND projects_json IS NOT NULL'
    ).bind(userId).all();
    
    if (workLogs.results && workLogs.results.length > 0) {
      for (const log of workLogs.results) {
        try {
          const projects = JSON.parse(log.projects_json);
          if (Array.isArray(projects)) {
            // 过滤掉要删除的项目
            const filteredProjects = projects.filter(p => p.projectId !== projectId);
            
            // 更新 work_logs 表
            if (filteredProjects.length > 0) {
              // 还有其他项目，更新 projects_json
              await DB.prepare('UPDATE work_logs SET projects_json = ? WHERE id = ?')
                .bind(JSON.stringify(filteredProjects), log.id)
                .run();
            } else {
              // 没有其他项目了，删除这条 work_logs 记录
              await DB.prepare('DELETE FROM work_logs WHERE id = ?')
                .bind(log.id)
                .run();
            }
          }
        } catch (e) {
          console.error('[handleDeleteProject] 清理 work_logs 失败:', log.id, e);
        }
      }
    }
    
    // 再删除项目
    await DB.prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectDbId).run();

    console.log('[handleDeleteProject] 删除成功:', {
      projectId,
      projectDbId,
      userId
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('handleDeleteProject error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ==================== 数据库操作 ====================

async function getAllUsers(env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in getAllUsers');
    return [];
  }
  
  try {
    const result = await DB.prepare('SELECT id, email, username, role, created_at, last_login FROM users').all();
    return result.results || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

async function getUserCount(env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in getUserCount');
    return { count: 0 };
  }
  
  try {
    const result = await DB.prepare('SELECT COUNT(*) as count FROM users').first();
    return { count: result?.count || 0 };
  } catch (error) {
    console.error('Error in getUserCount:', error);
    return { count: 0 };
  }
}

async function handleGetUserStats(request, env) {
  try {
    const stats = await getUserCount(env);
    return Response.json({ success: true, ...stats });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function getUser(userId, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in getUser');
    return null;
  }
  
  try {
    const result = await DB.prepare('SELECT id, email, username, role FROM users WHERE id = ?')
      .bind(userId)
      .first();
    return result;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

async function getUserConfig(userId, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in getUserConfig');
    return null;
  }
  
  try {
    const result = await DB.prepare(
      'SELECT * FROM user_configs WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!result) return null;
    
    return {
      enabled: result.enabled === 1,
      sendTime: result.send_time,
      timezone: result.timezone,
      emergency_email: result.emergency_email,
      emergency_name: result.emergency_name,
      min_work_hours: result.min_work_hours,
      min_keyframes: result.min_keyframes,
      min_json_size: result.min_json_size,
      user_notification_time: result.user_notification_time,
      emergency_notification_time: result.emergency_notification_time,
      user_notification_hour: result.user_notification_hour !== undefined ? result.user_notification_hour : 22,
      emergency_notification_hour: result.emergency_notification_hour !== undefined ? result.emergency_notification_hour : 22,
      enable_emergency_notification: result.enable_emergency_notification === 1,
      notification_schedule: result.notification_schedule || 'all',
      notification_excluded_days: result.notification_excluded_days || '[]',
      thresholds: {
        minWorkHours: result.min_work_hours || 8,
        minKeyframes: result.min_keyframes || 50,
        minJsonSize: result.min_json_size || 10
      }
    };
  } catch (error) {
    console.error('Error in getUserConfig:', error);
    return null;
  }
}

async function saveUserConfig(userId, config, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in saveUserConfig');
    return;
  }
  
  try {
    await DB.prepare(`
      INSERT INTO user_configs (
        user_id, enabled, send_time, timezone, emergency_email,
        emergency_name, min_work_hours, min_keyframes, min_json_size,
        user_notification_time, emergency_notification_time,
        user_notification_hour, emergency_notification_hour,
        enable_emergency_notification, notification_schedule, notification_excluded_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        enabled = excluded.enabled,
        send_time = excluded.send_time,
        timezone = excluded.timezone,
        emergency_email = excluded.emergency_email,
        emergency_name = excluded.emergency_name,
        min_work_hours = excluded.min_work_hours,
        min_keyframes = excluded.min_keyframes,
        min_json_size = excluded.min_json_size,
        user_notification_time = excluded.user_notification_time,
        emergency_notification_time = excluded.emergency_notification_time,
        user_notification_hour = excluded.user_notification_hour,
        emergency_notification_hour = excluded.emergency_notification_hour,
        enable_emergency_notification = excluded.enable_emergency_notification,
        notification_schedule = excluded.notification_schedule,
        notification_excluded_days = excluded.notification_excluded_days,
        updated_at = datetime("now")
    `).bind(
      userId,
      config.enabled ? 1 : 0,
      config.sendTime || '22:00',
      config.timezone || 'Asia/Shanghai',
      config.emergency_email || null,
      config.emergency_name || null,
      config.min_work_hours || 8,
      config.min_keyframes || 50,
      config.min_json_size || 10,
      config.user_notification_time || '22:00',
      config.emergency_notification_time || '22:00',
      config.user_notification_hour !== undefined ? config.user_notification_hour : 22,
      config.emergency_notification_hour !== undefined ? config.emergency_notification_hour : 22,
      config.enable_emergency_notification ? 1 : 0,
      config.notification_schedule || 'all',
      config.notification_excluded_days || '[]'
    ).run();
  } catch (error) {
    console.error('Error in saveUserConfig:', error);
    throw error;
  }
}

async function getWorkData(userId, date, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in getWorkData');
    return null;
  }

  try {
    const result = await DB.prepare(
      'SELECT * FROM work_logs WHERE user_id = ? AND work_date = ?'
    )
      .bind(userId, date)
      .first();
    
    if (!result) {
      return null;
    }
    
    // 🔍 从 projects_json 和 work_hours_json 重新计算统计数据
    // 确保邮件显示的是完整的数据，而不是可能不准确的统计字段
    if (result.projects_json && result.work_hours_json) {
      try {
        const projects = JSON.parse(result.projects_json);
        const workHoursList = JSON.parse(result.work_hours_json);
        
        // 重新计算项目数量
        result.project_count = projects.length;
        
        // 重新计算总工作时长
        result.work_hours = workHoursList.reduce(function(acc, w) {
          return acc + parseFloat(w.hours || 0);
        }, 0);
        
        // 🔍 重新计算其他维度数据（从 projects_json 累加）
        result.composition_count = projects.reduce(function(acc, p) {
          return acc + (p.compositions || 0);
        }, 0);
        
        result.layer_count = projects.reduce(function(acc, p) {
          return acc + (p.layers || 0);
        }, 0);
        
        result.keyframe_count = projects.reduce(function(acc, p) {
          return acc + (p.keyframes || 0);
        }, 0);
        
        result.effect_count = projects.reduce(function(acc, p) {
          return acc + (p.effects || 0);
        }, 0);
        
        console.log('[getWorkData] 重新计算统计数据:', {
          date: date,
          original_project_count: result.project_count,
          original_work_hours: result.work_hours,
          calculated_project_count: projects.length,
          calculated_work_hours: result.work_hours,
          calculated_composition_count: result.composition_count,
          calculated_layer_count: result.layer_count,
          calculated_keyframe_count: result.keyframe_count,
          calculated_effect_count: result.effect_count
        });
      } catch (error) {
        console.error('[getWorkData] 重新计算统计数据失败:', error);
      }
    }
    
    // 添加 last_work_date 字段（使用 work_date）
    result.last_work_date = result.work_date;
    
    return result;
  } catch (error) {
    console.error('Error in getWorkData:', error);
    return null;
  }
}
async function saveWorkData(userId, workData, env, date) {
  const DB = env.DB || env.rualive;
  // 如果没有传入日期，使用当天日期
  const workDate = date || new Date().toISOString().split('T')[0];

  // 提取详细列表数据
  let compositionsJson = null;
  let effectsJson = null;
  let layersJson = null;
  let keyframesJson = null;
  let projectsJson = null;
  let workHoursJson = null;

  // 从 projects 数组中提取详细数据
  const allCompositions = [];
  const allEffects = [];
  const allLayers = [];
  const allKeyframes = [];
  const allProjects = [];
  const allWorkHours = [];

  if (workData.projects && workData.projects.length > 0) {
    console.log('[saveWorkData] ========== 开始处理项目数据 ==========');
    console.log('[saveWorkData] 收到的项目数量:', workData.projects.length);
    console.log('[saveWorkData] 完整项目数据:', JSON.stringify(workData.projects, null, 2));

    // 先对项目进行去重（按项目名称）
    const projectMap = new Map();
    workData.projects.forEach(project => {
      // 过滤空项目（没有名称或没有路径的项目）
      if (!project.name || project.name.trim() === '') {
        console.log('[saveWorkData] 过滤空项目: name=', project.name);
        return;
      }
      if (!project.path || project.path.trim() === '') {
        console.log('[saveWorkData] 过滤无路径项目: name=', project.name, ', path=', project.path);
        return;
      }

      console.log('[saveWorkData] 处理项目:', project.name, ', projectId=', project.projectId);
      // 直接使用项目名称进行比较（不解码）
      const existingProject = projectMap.get(project.name);

      if (existingProject) {
        console.log('[saveWorkData] 项目已存在，更新数据:', project.name);
        // 如果项目已存在，更新其数据（使用最新值，不累加）
        existingProject.statistics = project.statistics || existingProject.statistics;
        existingProject.details = project.details || existingProject.details;
        existingProject.projectId = project.projectId || existingProject.projectId;
        // 使用最新的运行时间（不累加，避免重复计算）
        if (project.accumulatedRuntime && project.accumulatedRuntime > 0) {
          existingProject.accumulatedRuntime = project.accumulatedRuntime;
        }
      } else {
        console.log('[saveWorkData] 新项目，添加到映射:', project.name, ', projectId=', project.projectId);
        // 添加新项目
        projectMap.set(project.name, {
          ...project,
          accumulatedRuntime: project.accumulatedRuntime || 0
        });
      }
    });

    console.log('[saveWorkData] 去重后的项目数量:', projectMap.size);
    
    // 处理去重后的项目
    projectMap.forEach(project => {
      // 项目列表
      console.log('[saveWorkData] 添加项目到列表:', {
        name: project.name,
        path: project.path,
        projectId: project.projectId,
        compositions: project.statistics ? project.statistics.compositions : 0
      });
      allProjects.push({
        name: project.name,
        path: project.path || '',
        projectId: project.projectId || '',
        compositions: project.statistics ? project.statistics.compositions || 0 : 0,
        layers: project.statistics ? project.statistics.layers || 0 : 0,
        keyframes: project.statistics ? project.statistics.keyframes || 0 : 0,
        effects: project.statistics ? project.statistics.effects || 0 : 0
      });

      // 工作时长列表 - 使用每个项目的当天运行时间（project.currentDayRuntime）
      // 注意：只有 project.currentDayRuntime 存在时才计入该项目的工时
      let projectDailyHours = 0;
      if (project.currentDayRuntime && project.currentDayRuntime > 0) {
        projectDailyHours = (project.currentDayRuntime / 3600).toFixed(2);
        console.log('[saveWorkData] 项目 ' + project.name + ' 的当天运行时间:', project.currentDayRuntime, '秒 =', projectDailyHours, '小时');
      }
      
      if (projectDailyHours > 0) {
        allWorkHours.push({
          project: project.name,
          hours: projectDailyHours
        });
      }

      // 合成列表
      if (project.details && project.details.compositions) {
        if (Array.isArray(project.details.compositions)) {
          // 数组格式：["Comp 1", "Comp 2", ...]
          project.details.compositions.forEach(compName => {
            allCompositions.push({
              project: project.name,
              name: compName
            });
          });
        } else if (typeof project.details.compositions === 'object' && !Array.isArray(project.details.compositions)) {
          // 对象格式：{"Comp 1": {...}, "Comp 2": {...}}
          Object.keys(project.details.compositions).forEach(compName => {
            allCompositions.push({
              project: project.name,
              name: compName
            });
          });
        } else if (project.statistics && project.statistics.compositions) {
          // 如果 details.compositions 不存在，但有统计数据，生成默认名称
          for (let i = 1; i <= project.statistics.compositions; i++) {
            allCompositions.push({
              project: project.name,
              name: `合成 ${i}`
            });
          }
        }
      }

      // 效果列表 - 扩展发送的可能是对象数组或字符串数组
      if (project.details && project.details.effects) {
        if (Array.isArray(project.details.effects)) {
          // 🔍 检查数组格式
          project.details.effects.forEach(effect => {
            if (effect && typeof effect === 'string') {
              // 字符串格式：["Gaussian Blur", "Motion Blur", ...]
              allEffects.push({
                project: project.name,
                name: effect,
                count: 1
              });
            } else if (effect && effect.effectName) {
              // 对象格式（旧）：[{effectName: "Gaussian Blur", ...}, ...]
              allEffects.push({
                project: project.name,
                name: effect.effectName,
                count: 1
              });
            } else if (effect && effect.name && effect.count) {
              // 对象格式（新）：[{name: "Gaussian Blur", count: 5}, ...]
              allEffects.push({
                project: project.name,
                name: effect.name,
                count: effect.count
              });
            }
          });
        } else if (typeof project.details.effects === 'string') {
          // 字符串格式（兼容旧数据）
          allEffects.push({
            project: project.name,
            name: project.details.effects,
            count: 1
          });
        }
      }

      // 图层列表 - 扩展发送的是对象 {video: 10, image: 5, ...}
      if (project.details && project.details.layers) {
        if (typeof project.details.layers === 'object' && !Array.isArray(project.details.layers)) {
          // 对象格式（扩展发送的格式）
          Object.keys(project.details.layers).forEach(layerType => {
            const count = project.details.layers[layerType];
            if (count > 0) {
              allLayers.push({
                project: project.name,
                name: layerType,
                count: count
              });
            }
          });
        } else if (Array.isArray(project.details.layers)) {
          // 数组格式（兼容旧数据）
          project.details.layers.forEach(layerName => {
            if (typeof layerName === 'string') {
              allLayers.push({
                project: project.name,
                name: layerName,
                count: 1  // 🔍 添加 count 字段
              });
            }
          });
        }
      }

      // 关键帧列表 - 支持多种格式
      if (project.details && project.details.keyframes) {
        console.log('[saveWorkData] ========== 处理关键帧数据 ==========');
        console.log('[saveWorkData] 项目名称:', project.name);
        console.log('[saveWorkData] keyframes 类型:', typeof project.details.keyframes);
        console.log('[saveWorkData] keyframes 是否为数组:', Array.isArray(project.details.keyframes));
        console.log('[saveWorkData] keyframes 数据:', JSON.stringify(project.details.keyframes, null, 2));
        
        if (Array.isArray(project.details.keyframes)) {
          console.log('[saveWorkData] 处理数组格式，元素数量:', project.details.keyframes.length);
          // 对象数组格式 - 可能是统计格式 [{layerName: "Layer1", keyframeCount: 5}, ...]
          project.details.keyframes.forEach(kf => {
            if (kf && kf.layerName) {
              // 统计格式
              if (kf.keyframeCount !== undefined) {
                allKeyframes.push({
                  project: project.name,
                  layer: kf.layerName,
                  count: kf.keyframeCount
                });
                console.log('[saveWorkData] 添加关键帧（统计格式）: layer=', kf.layerName, ', count=', kf.keyframeCount);
              } 
              // 原始格式 [{id: 1, layerName: "Layer1", propertyName: "Position", ...}]
              else if (kf.layerName && kf.propertyName) {
                // 按图层分组统计
                const existing = allKeyframes.find(item => item.project === project.name && item.layer === kf.layerName);
                if (existing) {
                  existing.count++;
                  console.log('[saveWorkData] 累加关键帧（原始格式）: layer=', kf.layerName, ', count=', existing.count);
                } else {
                  allKeyframes.push({
                    project: project.name,
                    layer: kf.layerName,
                    count: 1
                  });
                  console.log('[saveWorkData] 添加关键帧（原始格式）: layer=', kf.layerName, ', count=1');
                }
              }
            }
          });
        } else if (typeof project.details.keyframes === 'object' && !Array.isArray(project.details.keyframes)) {
          console.log('[saveWorkData] 处理对象格式，键数量:', Object.keys(project.details.keyframes).length);
          // 对象格式（兼容旧数据） - {"Layer1": 5, "Layer2": 3}
          Object.keys(project.details.keyframes).forEach(layerName => {
            const count = project.details.keyframes[layerName];
            allKeyframes.push({
              project: project.name,
              layer: layerName,
              count: count
            });
            console.log('[saveWorkData] 添加关键帧（对象格式）: layer=', layerName, ', count=', count);
          });
        }
        
        console.log('[saveWorkData] 处理后的 allKeyframes 数量:', allKeyframes.length);
        console.log('[saveWorkData] allKeyframes 数据:', JSON.stringify(allKeyframes, null, 2));
        console.log('[saveWorkData] ========== 关键帧数据处理结束 ==========');
      }
    });

    compositionsJson = allCompositions.length > 0 ? JSON.stringify(allCompositions) : null;
    effectsJson = allEffects.length > 0 ? JSON.stringify(allEffects) : null;
    layersJson = allLayers.length > 0 ? JSON.stringify(allLayers) : null;
    keyframesJson = allKeyframes.length > 0 ? JSON.stringify(allKeyframes) : null;
    projectsJson = allProjects.length > 0 ? JSON.stringify(allProjects) : null;
    workHoursJson = allWorkHours.length > 0 ? JSON.stringify(allWorkHours) : null;
  }

  // 检查是否已存在同一天的数据
  const existingData = await DB.prepare(
    'SELECT compositions_json, effects_json, layers_json, keyframes_json, projects_json, work_hours_json FROM work_logs WHERE user_id = ? AND work_date = ?'
  ).bind(userId, workDate).first();

  // 如果已存在数据，需要合并
  if (existingData) {
    try {
      // 解析现有数据
      const existingCompositions = existingData.compositions_json ? JSON.parse(existingData.compositions_json) : [];
      const existingEffects = existingData.effects_json ? JSON.parse(existingData.effects_json) : [];
      const existingLayers = existingData.layers_json ? JSON.parse(existingData.layers_json) : [];
      const existingKeyframes = existingData.keyframes_json ? JSON.parse(existingData.keyframes_json) : [];
      const existingProjects = existingData.projects_json ? JSON.parse(existingData.projects_json) : [];
      const existingWorkHours = existingData.work_hours_json ? JSON.parse(existingData.work_hours_json) : [];

      // 🔍 创建项目映射，用于更新现有项目
      const projectMap = new Map();
      existingProjects.forEach(function(p) {
        projectMap.set(p.name, p);
      });

      // 🔍 处理新项目数据（使用新数据覆盖旧数据，而不是累加）
      allProjects.forEach(function(newProject) {
        // 从 allWorkHours 中查找新项目的工时
        const newWorkHour = allWorkHours.find(function(w) { return w.project === newProject.name; });
        const newHours = newWorkHour ? newWorkHour.hours : null;
        
        // 🔍 使用新数据覆盖旧数据，而不是合并
        projectMap.set(newProject.name, {
          ...newProject,
          accumulatedRuntime: newHours ? parseFloat(newHours) * 3600 : 0
        });
      });

      // 从映射中获取最终的项目列表
      const mergedProjects = Array.from(projectMap.values());

      // 🔍 重新构建 work_hours_json，确保所有项目都被包含
      const mergedWorkHours = mergedProjects.map(function(p) {
        return {
          project: p.name,
          hours: (p.accumulatedRuntime / 3600).toFixed(2)
        };
      });

      // 🔍 合并其他数据（去重，使用新数据）
      // 🔍 过滤掉旧格式的合成数据（只有 count 没有 name 的数据）
      const filteredExistingCompositions = existingCompositions.filter(function(c) {
        return c && c.name && typeof c.name === 'string';
      });
      
      // 🔍 合成数据：使用新数据覆盖旧数据
      const compositionMap = new Map();
      allCompositions.forEach(function(c) {
        var key = c.project + '|' + c.name;
        compositionMap.set(key, c);
      });
      const mergedCompositions = Array.from(compositionMap.values());
      
      // 🔍 特效数据：使用新数据覆盖旧数据
      const effectMap = new Map();
      allEffects.forEach(function(e) {
        var key = e.project + '|' + e.name;
        effectMap.set(key, e);
      });
      const mergedEffects = Array.from(effectMap.values());
      
      // 🔍 图层数据：使用新数据覆盖旧数据
      const layerMap = new Map();
      allLayers.forEach(function(l) {
        var key = l.project + '|' + l.name;
        layerMap.set(key, l);
      });
      const mergedLayers = Array.from(layerMap.values());
      
      // 🔍 关键帧数据：使用新数据覆盖旧数据（不累加！）
      const keyframeMap = new Map();
      allKeyframes.forEach(function(k) {
        var key = k.project + '|' + k.layer;
        keyframeMap.set(key, {...k});
      });
      const mergedKeyframes = Array.from(keyframeMap.values());

      // 更新 JSON 字符串
      compositionsJson = mergedCompositions.length > 0 ? JSON.stringify(mergedCompositions) : null;
      effectsJson = mergedEffects.length > 0 ? JSON.stringify(mergedEffects) : null;
      layersJson = mergedLayers.length > 0 ? JSON.stringify(mergedLayers) : null;
      keyframesJson = mergedKeyframes.length > 0 ? JSON.stringify(mergedKeyframes) : null;
      projectsJson = mergedProjects.length > 0 ? JSON.stringify(mergedProjects) : null;
      workHoursJson = mergedWorkHours.length > 0 ? JSON.stringify(mergedWorkHours) : null;

      console.log('[saveWorkData] ========== 合并后的项目数据 ==========');
      console.log('[saveWorkData] mergedProjects:', JSON.stringify(mergedProjects, null, 2));
      console.log('[saveWorkData] projects_json (将保存到数据库):', projectsJson);
      console.log('[saveWorkData] ========== 准备更新数据库 ==========');

      // 🔍 重新计算总数（使用新数据，不累加旧数据）
      const mergedStats = {
        compositions: mergedCompositions.length,  // 🔍 直接统计合成数量
        layers: mergedLayers.reduce(function(acc, l) { return acc + (l.count || 0); }, 0),
        keyframes: mergedKeyframes.reduce(function(acc, k) { return acc + (k.count || 0); }, 0),
        effects: mergedEffects.reduce(function(acc, e) { return acc + (e.count || 0); }, 0),  // 🔍 计算总使用次数
        work_hours: mergedWorkHours.reduce(function(acc, w) { return acc + parseFloat(w.hours); }, 0)  // 🔍 从 mergedWorkHours 计算总工作时长
      };

      // 更新数据库
      await DB.prepare(`
        UPDATE work_logs SET
          work_hours = ?,
          keyframe_count = ?,
          json_size = ?,
          project_count = ?,
          composition_count = ?,
          layer_count = ?,
          effect_count = ?,
          compositions_json = ?,
          effects_json = ?,
          layers_json = ?,
          keyframes_json = ?,
          projects_json = ?,
          work_hours_json = ?
        WHERE user_id = ? AND work_date = ?
      `)
        .bind(
          mergedStats.work_hours,
          mergedStats.keyframes,
          workData.json_size || 0,
          mergedProjects.length,
          mergedStats.compositions,
          mergedStats.layers,
          mergedStats.effects,
          compositionsJson,
          effectsJson,
          layersJson,
          keyframesJson,
          projectsJson,
          workHoursJson,
          userId,
          workDate
        )
        .run();

      // 继续执行后面的项目累积数据更新
    } catch (error) {
      console.error('Failed to merge existing data:', error);
      // 如果合并失败，继续执行插入（会覆盖旧数据）
    }
  }

  // 计算当天总工作时长（所有项目的当天运行时间之和）
  // 这才是正确的当天总工作时长！
  const totalDailyWorkHours = allWorkHours.reduce(function(acc, w) { 
    return acc + parseFloat(w.hours); 
  }, 0);

  // 如果不存在或合并失败，执行插入或覆盖
  await DB.prepare(`
    INSERT INTO work_logs (
      user_id, work_date, work_hours, keyframe_count, json_size,
      project_count, composition_count, layer_count, effect_count,
      compositions_json, effects_json, layers_json, keyframes_json,
      projects_json, work_hours_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, work_date) DO UPDATE SET
      work_hours = excluded.work_hours,
      keyframe_count = excluded.keyframe_count,
      json_size = excluded.json_size,
      project_count = excluded.project_count,
      composition_count = excluded.composition_count,
      layer_count = excluded.layer_count,
      effect_count = excluded.effect_count,
      compositions_json = excluded.compositions_json,
      effects_json = excluded.effects_json,
      layers_json = excluded.layers_json,
      keyframes_json = excluded.keyframes_json,
      projects_json = excluded.projects_json,
      work_hours_json = excluded.work_hours_json
  `)
    .bind(
      userId, workDate,
      totalDailyWorkHours,  // 先使用临时值，后面会更新
      workData.keyframe_count || 0,
      workData.json_size || 0,
      allProjects.length,  // 使用过滤后的项目数量
      workData.composition_count || 0,
      workData.layer_count || 0,
      workData.effect_count || 0,
      compositionsJson,
      effectsJson,
      layersJson,
      keyframesJson,
      projectsJson,
      workHoursJson
    )
    .run();

  // 更新projects表和project_daily_stats表
  console.log('[saveWorkData] ========== 开始更新项目累积数据 ==========');
  
  // 遍历所有项目，更新projects表和project_daily_stats表
  for (const project of allProjects) {
    try {
      // 获取项目的累积运行时长（秒）
      const dailyHours = parseFloat(
        allWorkHours.find(w => w.project === project.name)?.hours || '0'
      );
      const dailyRuntime = dailyHours * 3600;  // 转换为秒
      
      console.log('[saveWorkData] ========== 开始处理项目:', project.name, '==========');
      console.log('[saveWorkData] 当天运行时长（来自AE扩展端）:', dailyHours.toFixed(2), '小时 (', dailyRuntime, '秒)');
      
      // 检查项目是否已存在
      const existingProject = await DB.prepare(
        'SELECT id, total_work_hours, total_work_days FROM projects WHERE user_id = ? AND project_id = ?'
      ).bind(userId, project.projectId).first();
                // 检查当前日期是否是新日期（不同于last_work_date）
                const isNewDate = existingProject.last_work_date !== workDate;
                
                if (existingProject) {
        console.log('[saveWorkData] 项目已存在，更新项目信息');
        
        // 更新现有项目基本信息
        await DB.prepare(`
          UPDATE projects SET
            project_name = ?,
            project_path = ?,
            last_work_date = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          project.name,
          project.path,
          workDate,
          existingProject.id
        ).run();
      } else {
        console.log('[saveWorkData] 新项目，插入项目信息');
        
        // 插入新项目
        await DB.prepare(`
          INSERT INTO projects (
            user_id, project_id, project_name, project_path,
            first_work_date, last_work_date, total_work_hours, total_work_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          project.projectId,
          project.name,
          project.path,
          workDate,
          workDate,
          0,  // total_work_hours 将在后面通过累加计算
          1
        ).run();
      }
      
      // 更新或插入project_daily_stats表
      // 先获取项目的数据库ID
      const projectRecord = await DB.prepare(
        'SELECT id FROM projects WHERE user_id = ? AND project_id = ?'
      ).bind(userId, project.projectId).first();
      
      if (projectRecord) {
        const existingDailyStats = await DB.prepare(
          'SELECT id FROM project_daily_stats WHERE project_id = ? AND work_date = ?'
        ).bind(projectRecord.id, workDate).first();
        
        if (existingDailyStats) {
          // 更新现有日期的统计 - 直接使用当天运行时间
          await DB.prepare(`
            UPDATE project_daily_stats SET
              work_hours = ?,
              accumulated_runtime = ?,
              composition_count = MAX(composition_count, ?),
              layer_count = MAX(layer_count, ?),
              keyframe_count = MAX(keyframe_count, ?),
              effect_count = MAX(effect_count, ?)
            WHERE id = ?
          `).bind(
            dailyHours,  // ✅ 直接使用当天运行时间（小时）
            dailyRuntime,  // ✅ 当天运行时间（秒）
            project.compositions,
            project.layers,
            project.keyframes,
            project.effects,
            existingDailyStats.id
          ).run();
          console.log('[saveWorkData] ✅ 更新项目每日统计:', project.name, workDate, '当天时长:', dailyHours.toFixed(2), '小时');
        } else {
          // 插入新的每日统计
          await DB.prepare(`
            INSERT INTO project_daily_stats (
              project_id, work_date, work_hours, accumulated_runtime,
              composition_count, layer_count, keyframe_count, effect_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            projectRecord.id,
            workDate,
            dailyHours,  // ✅ 直接使用当天运行时间（小时）
            dailyRuntime,  // ✅ 当天运行时间（秒）
            project.compositions,
            project.layers,
            project.keyframes,
            project.effects
          ).run();
          console.log('[saveWorkData] ✅ 插入项目每日统计:', project.name, workDate, '当天时长:', dailyHours.toFixed(2), '小时');
        }
      }
    } catch (error) {
      console.error('[saveWorkData] 处理项目累积数据失败:', project.name, error);
    }
  }
  
  // 重新计算所有项目的total_work_hours（基于project_daily_stats表）
  console.log('[saveWorkData] ========== 重新计算项目总时长 ==========');
  for (const project of allProjects) {
    try {
      const projectRecord = await DB.prepare(
        'SELECT id FROM projects WHERE user_id = ? AND project_id = ?'
      ).bind(userId, project.projectId).first();
      
      if (projectRecord) {
        const totalHoursResult = await DB.prepare(
          'SELECT SUM(work_hours) as total_hours, COUNT(DISTINCT work_date) as total_days FROM project_daily_stats WHERE project_id = ?'
        ).bind(projectRecord.id).first();
        
        const totalHours = totalHoursResult.total_hours || 0;
        const totalDays = totalHoursResult.total_days || 0;
        
        await DB.prepare(`
          UPDATE projects SET
            total_work_hours = ?,
            total_work_days = ?
          WHERE id = ?
        `).bind(
          totalHours,
          totalDays,
          projectRecord.id
        ).run();
        
        console.log('[saveWorkData] 重新计算项目总时长:', project.name, '总时长:', totalHours, '小时', '工作日:', totalDays);
      }
    } catch (error) {
      console.error('[saveWorkData] 重新计算项目总时长失败:', project.name, error);
    }
  }
  
  console.log('[saveWorkData] ========== 项目累积数据更新完成 ==========');
  
  // 重新计算 work_logs.work_hours（当天总工作时长）
  console.log('[saveWorkData] ========== 重新计算当天总工作时长 ==========');
  console.log('[saveWorkData] 当天总工作时长:', totalDailyWorkHours.toFixed(2), '小时');
  
  // 更新 work_logs 表的 work_hours 字段
  await DB.prepare(`
    UPDATE work_logs SET work_hours = ? WHERE user_id = ? AND work_date = ?
  `).bind(totalDailyWorkHours, userId, workDate).run();
  
  console.log('[saveWorkData] ✅ 已更新 work_logs.work_hours 为当天总工作时长:', totalDailyWorkHours.toFixed(2), '小时');
}

async function getSendLogs(userId, limit, env) {
  const DB = env.DB || env.rualive;

  if (!DB) {
    console.error('Database not available in getSendLogs');
    return [];
  }

  try {
    const result = await DB.prepare(
      'SELECT * FROM email_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?'
    )
      .bind(userId, limit)
      .all();

    // Convert snake_case to camelCase for frontend
    const convertedLogs = result.results.map(row => ({
      id: row.id,
      userId: row.user_id,
      sentAt: row.sent_at,
      recipientType: row.recipient_type,
      recipient: row.recipient_email,
      subject: row.subject,
      emailType: row.email_type,
      status: row.status,
      error: row.error_message,
      errorMessage: row.error_message,
      resendEmailId: row.resend_email_id,
      lastEvent: row.last_event,
      eventsJson: row.events_json,
      updatedAt: row.updated_at
    }));

    return convertedLogs;
  } catch (error) {
    console.error('Error in getSendLogs:', error);
    return [];
  }
}

async function getAllSendLogs(limit, env) {
  const DB = env.DB || env.rualive;

  if (!DB) {
    console.error('Database not available in getAllSendLogs');
    return [];
  }

  try {
    const result = await DB.prepare(
      'SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT ?'
    )
      .bind(limit)
      .all();

    // Convert snake_case to camelCase for frontend
    const convertedLogs = result.results.map(row => ({
      id: row.id,
      userId: row.user_id,
      sentAt: row.sent_at,
      recipientType: row.recipient_type,
      recipient: row.recipient_email,
      subject: row.subject,
      emailType: row.email_type,
      status: row.status,
      error: row.error_message,
      errorMessage: row.error_message,
      resendEmailId: row.resend_email_id,
      lastEvent: row.last_event,
      eventsJson: row.events_json,
      updatedAt: row.updated_at
    }));

    return convertedLogs;
  } catch (error) {
    console.error('Error in getAllSendLogs:', error);
    return [];
  }
}

async function logSend(userId, recipientType, recipientEmail, emailType, status, errorMessage, env, resendEmailId = null, subject = null) {
  const DB = env.DB || env.rualive;

  if (!DB) {
    console.error('Database not available in logSend');
    return;
  }

  try {
    await DB.prepare(`
      INSERT INTO email_logs (user_id, recipient_type, recipient_email, email_type, status, error_message, sent_at, resend_email_id, subject)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(userId, recipientType, recipientEmail, emailType, status, errorMessage, resendEmailId, subject || 'No Subject').run();
  } catch (error) {
    console.error('Error in logSend:', error);
  }
}

// ==================== 邮件发送 ====================

async function sendDailySummary(user, workData, config, env) {
  const html = await generateDailySummaryEmail(user, workData, config);
  const date = new Date().toLocaleDateString('zh-CN');
  const subject = `[RuAlive] ${date} 工作总结报告`;

  // 使用用户的邮箱
  const email = user.email;
  try {
    const resendResult = await sendEmail(email, subject, html, env);
    await logSend(user.id, 'user', email, 'summary', 'success', null, env, resendResult?.id || null, subject);
    console.log(`Daily summary sent to ${email}, Resend ID: ${resendResult?.id}`);
  } catch (error) {
    console.error(`Failed to send to ${email}:`, error);
    await logSend(user.id, 'user', email, 'summary', 'failed', error.message, env, null, subject);
  }
}

async function sendWarningEmail(user, workData, config, env) {
  const html = await generateWarningEmail(user, workData, config);
  const subject = `[紧急提醒] ${user.username} 今天工作量不足！`;

  // 使用紧急联系人邮箱
  if (config.emergency_email) {
    try {
      const resendResult = await sendEmail(config.emergency_email, subject, html, env);
      await logSend(user.id, 'emergency', config.emergency_email, 'warning', 'success', null, env, resendResult?.id || null, subject);
      console.log(`Warning sent to ${config.emergency_email}, Resend ID: ${resendResult?.id}`);
    } catch (error) {
      console.error(`Failed to send to ${config.emergency_email}:`, error);
      await logSend(user.id, 'emergency', config.emergency_email, 'warning', 'failed', error.message, env, null, subject);
    }
  }
}

async function sendEmail(to, subject, html, env) {
  const KV = env.KV;
  let apiKey = '';

  // 优先从KV存储获取API密钥
  if (KV) {
    apiKey = await KV.get('RESEND_API_KEY') || '';
  }

  // 回退到环境变量
  if (!apiKey) {
    apiKey = env.RESEND_API_KEY || '';
  }

  // 如果没有API密钥，抛出错误
  if (!apiKey) {
    throw new Error('API密钥未设置');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'RuAlive@itycon.cn',
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend API error response:', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(`Resend API error: ${JSON.stringify(errorJson)}`);
    } catch (e) {
      throw new Error(`Resend API error: ${errorText}`);
    }
  }

  return await response.json();
}

// ==================== Resend 日志同步 ====================

/**
 * 从 Resend API 获取邮件日志并同步到本地数据库
 * @param {Object} env - Cloudflare 环境变量
 * @param {number} limit - 获取的日志数量限制
 */
async function syncResendLogs(env, limit = 50) {
  const DB = env.DB || env.rualive;
  const KV = env.KV;

  if (!DB || !KV) {
    console.error('Database or KV not available in syncResendLogs');
    return;
  }

  try {
    // 获取 API 密钥
    const apiKey = await KV.get('RESEND_API_KEY') || env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.log('RESEND_API_KEY not set, skipping sync');
      return;
    }

    // 从 Resend API 获取邮件日志
    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Resend logs:', await response.text());
      return;
    }

    const resendData = await response.json();
    const resendLogs = resendData.data || [];

    console.log(`Fetched ${resendLogs.length} logs from Resend`);

    // 同步到本地数据库
    let syncedCount = 0;
    for (const resendLog of resendLogs) {
      // 检查是否已存在此日志
      const existing = await DB.prepare(
        'SELECT id FROM email_logs WHERE resend_email_id = ?'
      ).bind(resendLog.id).first();

      if (!existing) {
        // 获取用户邮箱（从 to 数组中）
        const recipientEmail = resendLog.to && resendLog.to[0] ? resendLog.to[0] : 'unknown';

        // 查找对应用户
        const user = await DB.prepare(
          'SELECT id FROM users WHERE email = ?'
        ).bind(recipientEmail).first();

        if (user) {
          // 根据主题判断邮件类型
          let emailType = 'unknown';
          if (resendLog.subject?.includes('工作总结')) {
            emailType = 'summary';
          } else if (resendLog.subject?.includes('紧急提醒')) {
            emailType = 'warning';
          }

          // 根据 last_event 判断状态
          const status = resendLog.last_event === 'delivered' ? 'sent' : 'failed';

          // 保存到本地数据库
          await DB.prepare(`
            INSERT INTO email_logs (user_id, email_address, subject, status, sent_at, resend_email_id, last_event, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            user.id,
            recipientEmail,
            resendLog.subject || 'No Subject',
            status,
            resendLog.sent_at || resendLog.created_at,
            resendLog.id,
            resendLog.last_event
          ).run();

          syncedCount++;
        }
      }
    }

    console.log(`Synced ${syncedCount} new logs from Resend`);
    return syncedCount;
  } catch (error) {
    console.error('Error in syncResendLogs:', error);
    return 0;
  }
}

/**
 * 获取单个邮件的事件详情
 * @param {string} resendEmailId - Resend 邮件 ID
 * @param {Object} env - Cloudflare 环境变量
 */
async function fetchResendEmailEvents(resendEmailId, env) {
  const KV = env.KV;

  if (!KV) {
    console.error('KV not available in fetchResendEmailEvents');
    return null;
  }

  try {
    const apiKey = await KV.get('RESEND_API_KEY') || env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.log('RESEND_API_KEY not set');
      return null;
    }

    const response = await fetch(`https://api.resend.com/emails/${resendEmailId}/events`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch events for email ${resendEmailId}:`, await response.text());
      return null;
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching events for email ${resendEmailId}:`, error);
    return null;
  }
}

// ==================== 落地页面 ====================

function generateLandingPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive - 智能工作追踪系统</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .landing-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.3);
      padding: 60px 40px;
      width: 100%;
      max-width: 900px;
      text-align: center;
    }
    .logo {
      margin-bottom: 40px;
    }
    .logo h1 {
      font-size: 48px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }
    .logo p {
      color: #6b7280;
      font-size: 18px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 30px;
      margin-bottom: 50px;
    }
    .feature-card {
      padding: 30px 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 16px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .feature-icon {
      font-size: 40px;
      margin-bottom: 15px;
    }
    .feature-card h3 {
      font-size: 18px;
      color: #374151;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .feature-card p {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }
    .action-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 16px 40px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
      min-width: 200px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    .btn-secondary:hover {
      background: #667eea;
      color: white;
      transform: translateY(-3px);
    }
    .footer {
      margin-top: 40px;
      color: #9ca3af;
      font-size: 14px;
    }
    @media (max-width: 768px) {
      .landing-container {
        padding: 40px 20px;
      }
      .logo h1 {
        font-size: 36px;
      }
      .features {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
      .btn {
        width: 100%;
        max-width: 300px;
      }
    }
  </style>
</head>
<body>
  <div class="landing-container">
    <div class="logo">
      <h1>🎬 RuAlive</h1>
      <p>智能工作追踪与邮件通知系统</p>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>实时追踪</h3>
        <p>自动监控AE项目工作进度，实时记录关键数据</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📧</div>
        <h3>邮件通知</h3>
        <p>智能生成每日工作总结，及时发送提醒通知</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>数据分析</h3>
        <p>可视化展示工作数据，助力效率提升</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>安全可靠</h3>
        <p>企业级数据加密，保护您的隐私安全</p>
      </div>
    </div>

    <div class="action-buttons">
      <a href="/login" class="btn btn-primary">用户登录</a>
      <a href="/admin/login" class="btn btn-secondary">管理员登录</a>
    </div>

    <div class="footer">
      <p>&copy; 2024 RuAlive. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ==================== 登录页面 ====================

function generateLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive - 用户登录</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      font-size: 28px;
      color: #667eea;
      margin-bottom: 8px;
    }
    .logo p {
      color: #6b7280;
      font-size: 14px;
    }
    .tabs {
      display: flex;
      margin-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
    }
    .tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      color: #6b7280;
      font-weight: 500;
      transition: all 0.3s;
    }
    .tab.active {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      margin-bottom: -2px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #374151;
      font-weight: 500;
      font-size: 14px;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      background: #667eea;
      color: white;
    }
    .btn:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    .alert {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }
    .alert.show {
      display: block;
    }
    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .hidden { display: none; }
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      color: #6b7280;
      font-size: 12px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>📧 RuAlive</h1>
      <p>邮件通知管理系统</p>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="switchTab('login')">登录</div>
      <div class="tab" onclick="switchTab('register')">注册</div>
    </div>

    <div id="alert" class="alert"></div>

    <!-- 登录表单 -->
    <div id="loginForm">
      <div class="form-group">
        <label>邮箱</label>
        <input type="email" id="loginEmail" placeholder="your-email@example.com">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="loginPassword" placeholder="请输入密码">
      </div>
      <button class="btn" id="loginBtn" onclick="handleLogin()">登录</button>
    </div>

    <!-- 注册表单 -->
    <div id="registerForm" class="hidden">
      <div class="form-group">
        <label>邮箱</label>
        <input type="email" id="registerEmail" placeholder="your-email@example.com">
      </div>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="registerUsername" placeholder="你的名字">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="registerPassword" placeholder="至少6位密码">
      </div>
      <div class="form-group">
        <label>邀请码</label>
        <input type="text" id="inviteCode" placeholder="XXXX-XXXX">
      </div>
      <button class="btn" id="registerBtn" onclick="handleRegister()">注册</button>
    </div>

    <div class="footer">
      <a href="/admin">管理员登录</a>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;

    function switchTab(tab) {
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(t => t.classList.remove('active'));
      
      if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
      } else {
        tabs[1].classList.add('active');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
      }
    }

    function showAlert(message, type = 'error') {
      const alert = document.getElementById('alert');
      alert.className = 'alert alert-' + type + ' show';
      alert.textContent = message;
      setTimeout(() => alert.classList.remove('show'), 4000);
    }

    async function handleLogin() {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('loginBtn');

      if (!email || !password) {
        showAlert('请填写邮箱和密码');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>登录中...';

      try {
        const response = await fetch(API_BASE + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.success) {
          localStorage.setItem('rualive_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('[Login] Token saved to localStorage (rualive_token)');
          
          if (data.user.role === 'admin') {
            console.log('[Login] Redirecting to /admin');
            window.location.href = '/admin';
          } else {
            console.log('[Login] Redirecting to /user');
            window.location.href = '/user';
          }
        } else {
          console.log('[Login] Login failed:', data.error);
          showAlert(data.error || '登录失败');
        }
      } catch (error) {
        showAlert('登录失败: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '登录';
      }
    }

    async function handleRegister() {
      const email = document.getElementById('registerEmail').value.trim();
      const username = document.getElementById('registerUsername').value.trim();
      const password = document.getElementById('registerPassword').value;
      const inviteCode = document.getElementById('inviteCode').value.trim();
      const btn = document.getElementById('registerBtn');

      if (!email || !username || !password || !inviteCode) {
        showAlert('请填写所有字段');
        return;
      }

      if (password.length < 6) {
        showAlert('密码至少6位');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>注册中...';

      try {
        const response = await fetch(API_BASE + '/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, inviteCode })
        });
        const data = await response.json();

        if (data.success) {
          showAlert('注册成功！请登录', 'success');
          switchTab('login');
        } else {
          showAlert(data.error || '注册失败');
        }
      } catch (error) {
        showAlert('注册失败: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '注册';
      }
    }

    // 检查是否已登录
    window.onload = function() {
      const token = localStorage.getItem('rualive_token');
      if (token) {
        fetch(API_BASE + '/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            if (data.user.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/user';
            }
          }
        })
        .catch(() => {});
      }
    };
  </script>
</body>
</html>`;
}

function generateUserDashboard() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive - 用户面板</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-primary: #f3f4f6;
      --bg-secondary: #ffffff;
      --bg-card: #ffffff;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --border-color: #e5e7eb;
      --accent-primary: #667eea;
      --accent-secondary: #764ba2;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-hover: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .dark {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-card: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --border-color: #374151;
      --shadow: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-hover: 0 4px 6px rgba(0,0,0,0.4);
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: background 0.3s, color 0.3s;
    }
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .navbar h1 {
      font-size: 1.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.3s;
    }
    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-1px);
    }
    .dark-mode-toggle {
      padding: 0.5rem;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.3s;
    }
    .dark-mode-toggle:hover {
      background: rgba(255,255,255,0.3);
      transform: rotate(15deg);
    }
    .main-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }
    .card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      margin-bottom: 1.5rem;
      transition: all 0.3s;
    }
    .card:hover {
      box-shadow: var(--shadow-hover);
    }
    .card h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--accent-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-hover);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    }
    .stat-card h3 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--accent-primary);
      margin-bottom: 0.5rem;
    }
    .stat-card p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-card .icon {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 2rem;
      opacity: 0.2;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;
    }
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-section {
      margin-bottom: 1.5rem;
    }
    .form-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 500;
      font-size: 0.875rem;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      background: var(--bg-secondary);
      color: var(--text-primary);
      transition: all 0.2s;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
    }
    .btn-success {
      background: var(--success);
      color: white;
    }
    .btn-success:hover {
      background: #059669;
      transform: translateY(-2px);
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--bg-secondary);
    }
    td {
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    tr:hover {
      background: var(--bg-secondary);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-success {
      background: #d1fae5;
      color: #065f46;
    }
    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }
    .dark .status-success {
      background: #065f46;
      color: #d1fae5;
    }
    .dark .status-warning {
      background: #92400e;
      color: #fef3c7;
    }
    .dark .status-error {
      background: #991b1b;
      color: #fee2e2;
    }
    .toast {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    }
    .toast-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .toast-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .dark .toast-success {
      background: #065f46;
      color: #d1fae5;
    }
    .dark .toast-error {
      background: #991b1b;
      color: #fee2e2;
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    .toast.hide {
      animation: slideOut 0.3s ease-out;
    }
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .chart-container {
      position: relative;
      height: 300px;
      margin-bottom: 1.5rem;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
    }
    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .toggle-btn:hover {
      background: var(--bg-primary);
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-content">
      <h1>📧 RuAlive 用户面板</h1>
      <div class="user-info">
        <button class="dark-mode-toggle" onclick="toggleDarkMode()" title="切换暗黑模式">🌙</button>
        <span id="userInfo">加载中...</span>
        <button class="logout-btn" onclick="handleLogout()">退出登录</button>
      </div>
    </div>
  </nav>

  <div class="main-container">
    <div class="stats-grid">
      <div class="stat-card">
        <span class="icon">⏱️</span>
        <h3 id="stat-work-hours">0</h3>
        <p>工作时长(小时)</p>
      </div>
      <div class="stat-card">
        <span class="icon">🎬</span>
        <h3 id="stat-compositions">0</h3>
        <p>合成数量</p>
      </div>
      <div class="stat-card">
        <span class="icon">🔑</span>
        <h3 id="stat-keyframes">0</h3>
        <p>关键帧数</p>
      </div>
      <div class="stat-card">
        <span class="icon">📑</span>
        <h3 id="stat-layers">0</h3>
        <p>图层数量</p>
      </div>
      <div class="stat-card">
        <span class="icon">✨</span>
        <h3 id="stat-effects">0</h3>
        <p>效果数量</p>
      </div>
      <div class="stat-card">
        <span class="icon">📁</span>
        <h3 id="stat-projects">0</h3>
        <p>项目数量</p>
      </div>
    </div>

    <div class="content-grid">
      <div class="left-column">
        <div class="card">
          <h2>⚙️ 邮件配置</h2>
          
          <div class="form-section">
            <h3>📋 基本配置</h3>
            <div class="form-group">
              <label>启用邮件通知</label>
              <select id="enabled">
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>

          <div class="form-section">
            <h3>👤 紧急联系人</h3>
            <div class="form-group">
              <label>紧急联系人邮箱</label>
              <input type="email" id="emergencyEmail" placeholder="emergency@example.com">
            </div>
            <div class="form-group">
              <label>紧急联系人姓名</label>
              <input type="text" id="emergencyName" placeholder="联系人姓名">
            </div>
          </div>

          <div class="form-section">
            <h3>🎯 工作阈值</h3>
            <div class="form-group">
              <label>最小工作时长（小时）</label>
              <input type="number" id="minHours" value="2" min="0" max="24" step="0.5">
            </div>
            <div class="form-group">
              <label>最小关键帧数</label>
              <input type="number" id="minKeyframes" value="50" min="0">
            </div>
            <div class="form-group">
              <label>最小JSON大小（KB）</label>
              <input type="number" id="minJsonSize" value="10" min="0">
            </div>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" onclick="saveConfig()">💾 保存配置</button>
            <button class="btn btn-success" onclick="sendTestEmail()">📧 发送测试邮件</button>
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--accent-primary);">
            <h2 style="margin: 0; border: none; padding: 0;">📈 工作数据趋势</h2>
            <div class="btn-group" style="gap: 0.5rem;">
              <button class="btn" id="btn-day" onclick="setTimeRange('day')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">日</button>
              <button class="btn" id="btn-month" onclick="setTimeRange('month')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">月</button>
              <button class="btn" id="btn-year" onclick="setTimeRange('year')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">年</button>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="workChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--accent-primary);">
            <h2 style="margin: 0; border: none; padding: 0;">📋 工作历史记录</h2>
            <button class="toggle-btn" onclick="toggleLogs()">
              <span id="toggleIcon">▼</span>
              <span id="toggleText">展开全部</span>
            </button>
          </div>
          
          <div class="table-container" id="logsContainer">
            <table id="logsTable">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>工作时长</th>
                  <th>合成数</th>
                  <th>关键帧</th>
                  <th>图层数</th>
                  <th>效果数</th>
                </tr>
              </thead>
              <tbody id="logsBody">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;
    let workChart = null;
    let allWorkLogs = [];
    let logsExpanded = false;
    let currentTimeRange = 'day';

    function showToast(message, type = 'success') {
      const existingToast = document.querySelector('.toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      const icon = type === 'success' ? '✅' : '❌';
      toast.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('darkMode', isDark);
      
      const btn = document.querySelector('.dark-mode-toggle');
      btn.textContent = isDark ? '☀️' : '🌙';
      
      if (emailChart) {
        updateChartTheme(isDark);
      }
    }

    function loadDarkMode() {
      const isDark = localStorage.getItem('darkMode') === 'true';
      if (isDark) {
        document.body.classList.add('dark');
        document.querySelector('.dark-mode-toggle').textContent = '☀️';
      }
    }

    function getAuthHeader() {
      const token = localStorage.getItem('rualive_token');
      return { 'Authorization': 'Bearer ' + token };
    }

    async function loadUserInfo() {
      try {
        const response = await fetch(API_BASE + '/api/auth/me', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success && data.user) {
          document.getElementById('userInfo').textContent = data.user.username;
          loadStats();
          loadConfig();
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    }

    async function loadConfig() {
      try {
        const response = await fetch(API_BASE + '/api/config', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success && data.data) {
          const config = data.data;
          document.getElementById('enabled').value = config.enabled ? 'true' : 'false';
          document.getElementById('emergencyEmail').value = config.emergency_email || '';
          document.getElementById('emergencyName').value = config.emergency_name || '';
          document.getElementById('minHours').value = config.min_work_hours || 8;
          document.getElementById('minKeyframes').value = config.min_keyframes || 50;
          document.getElementById('minJsonSize').value = config.min_json_size || 10;
        }
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    }

    async function saveConfig() {
      const enabled = document.getElementById('enabled').value === 'true';
      const emergencyEmail = document.getElementById('emergencyEmail').value.trim();
      const emergencyName = document.getElementById('emergencyName').value.trim();
      const minHours = parseFloat(document.getElementById('minHours').value);
      const minKeyframes = parseInt(document.getElementById('minKeyframes').value);
      const minJsonSize = parseInt(document.getElementById('minJsonSize').value);

      const config = {
        enabled: enabled,
        emergency_email: emergencyEmail,
        emergency_name: emergencyName,
        min_work_hours: minHours,
        min_keyframes: minKeyframes,
        min_json_size: minJsonSize
      };

      try {
        const response = await fetch(API_BASE + '/api/config', {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ config })
        });
        const data = await response.json();

        if (data.success) {
          showToast('配置保存成功');
        } else {
          showToast('保存失败: ' + data.error, 'error');
        }
      } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
      }
    }

    async function sendTestEmail() {
      try {
        const response = await fetch(API_BASE + '/api/send-now', {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
          showToast(data.message || '测试邮件已发送');
        } else {
          showToast('发送失败: ' + data.error, 'error');
        }
      } catch (error) {
        showToast('发送失败: ' + error.message, 'error');
      }
    }

    async function loadStats() {
      try {
        const response = await fetch(API_BASE + '/api/work-logs', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
          allWorkLogs = data.data || [];
          
          let totalWorkHours = 0;
          let totalCompositions = 0;
          let totalKeyframes = 0;
          let totalLayers = 0;
          let totalEffects = 0;
          let totalProjects = 0;
          let workDays = new Set();

          allWorkLogs.forEach(log => {
            totalWorkHours += log.work_hours || 0;
            totalCompositions += log.composition_count || 0;
            totalKeyframes += log.keyframe_count || 0;
            totalLayers += log.layer_count || 0;
            totalEffects += log.effect_count || 0;
            totalProjects += log.project_count || 0;
            if (log.work_date) {
              workDays.add(log.work_date);
            }
          });

          const today = new Date().toISOString().split('T')[0];
          const todayLog = allWorkLogs.find(log => log.work_date === today);
          const todayHours = todayLog ? todayLog.work_hours : 0;
          const todayComps = todayLog ? todayLog.composition_count : 0;
          const todayKeys = todayLog ? todayLog.keyframe_count : 0;
          const todayLayers = todayLog ? todayLog.layer_count : 0;
          const todayEffects = todayLog ? todayLog.effect_count : 0;
          const todayProjects = todayLog ? todayLog.project_count : 0;

          document.getElementById('stat-work-hours').textContent = todayHours.toFixed(1);
          document.getElementById('stat-compositions').textContent = todayComps;
          document.getElementById('stat-keyframes').textContent = todayKeys;
          document.getElementById('stat-layers').textContent = todayLayers;
          document.getElementById('stat-effects').textContent = todayEffects;
          document.getElementById('stat-projects').textContent = todayProjects;

          renderLogs();
          renderChart();
        }
      } catch (error) {
        console.error('加载统计失败:', error);
      }
    }

    function renderLogs() {
      const tbody = document.getElementById('logsBody');
      const displayLogs = logsExpanded ? allWorkLogs : allWorkLogs.slice(0, 5);

      if (displayLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p>暂无工作记录</p></div></td></tr>';
        return;
      }

      tbody.innerHTML = displayLogs.map(log => {
        const date = log.work_date ? new Date(log.work_date).toLocaleDateString('zh-CN') : '-';
        const hours = (log.work_hours || 0).toFixed(1) + 'h';
        const comps = log.composition_count || 0;
        const keys = log.keyframe_count || 0;
        const layers = log.layer_count || 0;
        const effects = log.effect_count || 0;

        return '<tr>' +
          '<td>' + date + '</td>' +
          '<td>' + hours + '</td>' +
          '<td>' + comps + '</td>' +
          '<td>' + keys + '</td>' +
          '<td>' + layers + '</td>' +
          '<td>' + effects + '</td>' +
          '</tr>';
      }).join('');

      const toggleText = document.getElementById('toggleText');
      const toggleIcon = document.getElementById('toggleIcon');
      if (allWorkLogs.length > 5) {
        toggleText.textContent = logsExpanded ? '收起' : '展开全部';
        toggleIcon.textContent = logsExpanded ? '▲' : '▼';
      } else {
        toggleText.textContent = '';
        toggleIcon.textContent = '';
      }
    }

    function toggleLogs() {
      logsExpanded = !logsExpanded;
      renderLogs();
    }

    function setTimeRange(range) {
      currentTimeRange = range;
      
      // Update button styles
      document.querySelectorAll('#btn-day, #btn-month, #btn-year').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
      });
      
      const activeBtn = document.getElementById('btn-' + range);
      activeBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      activeBtn.style.color = 'white';
      
      renderChart();
    }

    function renderChart() {
      const ctx = document.getElementById('workChart').getContext('2d');
      
      let labels = [];
      let workHoursData = [];
      let compositionsData = [];
      let keyframesData = [];

      if (currentTimeRange === 'day') {
        // Last 7 days
        const dailyData = {};
        allWorkLogs.forEach(log => {
          if (log.work_date) {
            const date = log.work_date;
            if (!dailyData[date]) {
              dailyData[date] = { hours: 0, comps: 0, keys: 0 };
            }
            dailyData[date].hours += log.work_hours || 0;
            dailyData[date].comps += log.composition_count || 0;
            dailyData[date].keys += log.keyframe_count || 0;
          }
        });

        const sortedDates = Object.keys(dailyData).sort().slice(-7);
        labels = sortedDates.map(date => {
          const d = new Date(date);
          return (d.getMonth() + 1) + '/' + d.getDate();
        });
        workHoursData = sortedDates.map(date => dailyData[date].hours.toFixed(1));
        compositionsData = sortedDates.map(date => dailyData[date].comps);
        keyframesData = sortedDates.map(date => dailyData[date].keys);
      } else if (currentTimeRange === 'month') {
        // Last 6 months
        const monthlyData = {};
        allWorkLogs.forEach(log => {
          if (log.work_date) {
            const date = new Date(log.work_date);
            const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { hours: 0, comps: 0, keys: 0, days: new Set() };
            }
            monthlyData[monthKey].hours += log.work_hours || 0;
            monthlyData[monthKey].comps += log.composition_count || 0;
            monthlyData[monthKey].keys += log.keyframe_count || 0;
            monthlyData[monthKey].days.add(log.work_date);
          }
        });

        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
        labels = sortedMonths.map(month => {
          const parts = month.split('-');
          return parseInt(parts[1]) + '月';
        });
        workHoursData = sortedMonths.map(month => monthlyData[month].hours.toFixed(1));
        compositionsData = sortedMonths.map(month => monthlyData[month].comps);
        keyframesData = sortedMonths.map(month => monthlyData[month].keys);
      } else if (currentTimeRange === 'year') {
        // All years
        const yearlyData = {};
        allWorkLogs.forEach(log => {
          if (log.work_date) {
            const year = new Date(log.work_date).getFullYear();
            if (!yearlyData[year]) {
              yearlyData[year] = { hours: 0, comps: 0, keys: 0 };
            }
            yearlyData[year].hours += log.work_hours || 0;
            yearlyData[year].comps += log.composition_count || 0;
            yearlyData[year].keys += log.keyframe_count || 0;
          }
        });

        const sortedYears = Object.keys(yearlyData).sort();
        labels = sortedYears.map(year => year + '年');
        workHoursData = sortedYears.map(year => yearlyData[year].hours.toFixed(1));
        compositionsData = sortedYears.map(year => yearlyData[year].comps);
        keyframesData = sortedYears.map(year => yearlyData[year].keys);
      }

      const isDark = document.body.classList.contains('dark');
      const textColor = isDark ? '#9ca3af' : '#6b7280';
      const gridColor = isDark ? '#374151' : '#e5e7eb';

      if (workChart) {
        workChart.destroy();
      }

      workChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '工作时长(小时)',
              data: workHoursData,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#667eea',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              label: '合成数量',
              data: compositionsData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              label: '关键帧数',
              data: keyframesData,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#f59e0b',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: textColor,
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              titleColor: isDark ? '#f9fafb' : '#111827',
              bodyColor: isDark ? '#9ca3af' : '#6b7280',
              borderColor: isDark ? '#374151' : '#e5e7eb',
              borderWidth: 1,
              padding: 12,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor
              }
            }
          }
        }
      });
    }

    function updateChartTheme(isDark) {
      if (!workChart) return;
      
      const textColor = isDark ? '#9ca3af' : '#6b7280';
      const gridColor = isDark ? '#374151' : '#e5e7eb';

      workChart.options.plugins.tooltip.backgroundColor = isDark ? '#1f2937' : '#ffffff';
      workChart.options.plugins.tooltip.titleColor = isDark ? '#f9fafb' : '#111827';
      workChart.options.plugins.tooltip.bodyColor = isDark ? '#9ca3af' : '#6b7280';
      workChart.options.plugins.tooltip.borderColor = isDark ? '#374151' : '#e5e7eb';
      workChart.options.plugins.legend.labels.color = textColor;
      
      workChart.options.scales.x.grid.color = gridColor;
      workChart.options.scales.x.ticks.color = textColor;
      workChart.options.scales.y.grid.color = gridColor;
      workChart.options.scales.y.ticks.color = textColor;

      workChart.update();
    }

    async function handleLogout() {
      try {
        await fetch(API_BASE + '/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeader()
        });
      } catch (error) {
        console.error('登出失败:', error);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }

    window.onload = function() {
      loadDarkMode();
      loadUserInfo();
      setTimeRange('day'); // 默认显示日视图
    };
  </script>
</body>
</html>`;
}

// ==================== 管理页面 ====================

function generateAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive 邮件通知管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
    }
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .navbar-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .navbar h1 {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .main-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 0.5rem;
    }
    .stat-card p {
      color: #6b7280;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;
    }
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }
    .card h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #667eea;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary {
      background: #667eea;
      color: white;
    }
    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    .btn-secondary:hover {
      background: #4b5563;
    }
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-success:hover {
      background: #059669;
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .log-container {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      border-radius: 0.5rem;
      max-height: 400px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
    }
    .log-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #374151;
    }
    .log-item:last-child {
      border-bottom: none;
    }
    .log-item.success { color: #10b981; }
    .log-item.error { color: #ef4444; }
    .log-item.warning { color: #f59e0b; }
    .log-time {
      color: #9ca3af;
      margin-right: 0.5rem;
    }
    .alert {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .hidden { display: none; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .info-icon {
      width: 20px;
      height: 20px;
      display: inline-block;
    }
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-content">
      <h1>📧 RuAlive 邮件通知管理后台</h1>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <span style="font-size: 0.875rem; opacity: 0.9;">Worker状态: <span id="workerStatus" style="font-weight: 600;">检查中...</span></span>
      </div>
    </div>
  </nav>

  <div class="main-container">
    <div id="alert" class="alert hidden"></div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3 id="stat-users">-</h3>
        <p>用户数量</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-emails">-</h3>
        <p>已发送邮件</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-today">-</h3>
        <p>今日发送</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-success">-</h3>
        <p>成功率</p>
      </div>
    </div>

    <div class="content-grid">
      <div>
        <div class="card">
          <h2>⚙️ 用户配置</h2>
          <div class="form-group">
            <label>用户邮箱 <span style="color: #ef4444;">*</span></label>
            <input type="email" id="userEmail" placeholder="your-email@example.com">
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">邮箱将作为用户唯一标识</p>
          </div>
          <div class="form-group">
            <label>用户名</label>
            <input type="text" id="username" placeholder="用户名">
          </div>
          <div class="form-group">
            <label>紧急联系人邮箱</label>
            <input type="email" id="emergencyEmail" placeholder="emergency@example.com">
          </div>
          <div class="form-group">
            <label>紧急联系人姓名</label>
            <input type="text" id="emergencyName" placeholder="联系人姓名">
          </div>
          <div class="form-group">
            <label>最小工作时长（小时）</label>
            <input type="number" id="minHours" value="2" min="0" max="24" step="0.5">
          </div>
          <div class="form-group">
            <label>最小关键帧数</label>
            <input type="number" id="minKeyframes" value="50" min="0">
          </div>
          <div class="form-group">
            <label>最小JSON大小（KB）</label>
            <input type="number" id="minJsonSize" value="10" min="0">
          </div>
          <div class="form-group">
            <label>启用通知</label>
            <select id="enabled">
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" onclick="saveConfig()">
              <span>💾</span> 保存配置
            </button>
            <button class="btn btn-secondary" onclick="loadConfig()">
              <span>📥</span> 加载配置
            </button>
            <button class="btn btn-success" onclick="sendTestEmail()">
              <span>📧</span> 发送测试邮件
            </button>
          </div>
        </div>

        <div class="card">
          <h2>📋 快捷操作</h2>
          <div class="btn-group">
            <button class="btn btn-secondary" onclick="loadLogs()">
              <span>🔄</span> 刷新日志
            </button>
            <button class="btn btn-secondary" onclick="loadStats()">
              <span>📊</span> 刷新统计
            </button>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>📋 发送日志</h2>
          <div class="log-container" id="logContainer">
            <p style="color: #9ca3af; text-align: center; padding: 2rem;">点击"刷新日志"查看发送记录</p>
          </div>
        </div>

        <div class="card">
          <h2>📊 最近活动</h2>
          <div id="recentActivity" style="color: #6b7280; font-size: 0.875rem;">
            <p>暂无活动记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;

    function showAlert(message, type = 'success') {
      const alert = document.getElementById('alert');
      const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
      alert.className = 'alert alert-' + type;
      alert.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
      alert.classList.remove('hidden');
      setTimeout(() => alert.classList.add('hidden'), 4000);
    }

    function generateUserId(email) {
      // 使用邮箱作为用户ID，并生成一个唯一的hash
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'user_' + Math.abs(hash).toString(16);
    }

    async function loadConfig() {
      const userEmail = document.getElementById('userEmail').value.trim();
      if (!userEmail) {
        showAlert('请输入用户邮箱', 'error');
        return;
      }

      const userId = generateUserId(userEmail);
      
      try {
        const response = await fetch(API_BASE + '/api/config?userId=' + userId);
        const data = await response.json();
        
        if (data.success && data.data) {
          const config = data.data;
          document.getElementById('username').value = config.username || '';
          document.getElementById('emergencyEmail').value = config.emergencyContacts?.[0]?.email || '';
          document.getElementById('emergencyName').value = config.emergencyContacts?.[0]?.name || '';
          document.getElementById('minHours').value = config.thresholds?.minWorkHours || 2;
          document.getElementById('minKeyframes').value = config.thresholds?.minKeyframes || 50;
          document.getElementById('minJsonSize').value = config.thresholds?.minJsonSize || 10;
          document.getElementById('enabled').value = config.enabled ? 'true' : 'false';
          showAlert('配置加载成功');
        } else {
          showAlert('未找到配置，请新建配置', 'warning');
        }
      } catch (error) {
        showAlert('加载配置失败: ' + error.message, 'error');
      }
    }

    async function saveConfig() {
      const userEmail = document.getElementById('userEmail').value.trim();
      if (!userEmail) {
        showAlert('请输入用户邮箱', 'error');
        return;
      }

      const userId = generateUserId(userEmail);
      const username = document.getElementById('username').value.trim();
      const emergencyEmail = document.getElementById('emergencyEmail').value.trim();
      const emergencyName = document.getElementById('emergencyName').value.trim();
      const minHours = parseFloat(document.getElementById('minHours').value);
      const minKeyframes = parseInt(document.getElementById('minKeyframes').value);
      const minJsonSize = parseInt(document.getElementById('minJsonSize').value);
      const enabled = document.getElementById('enabled').value === 'true';

      const config = {
        enabled: enabled,
        sendTime: '22:00',
        timezone: 'Asia/Shanghai',
        userEmails: [userEmail],
        emergencyContacts: emergencyEmail ? [{
          email: emergencyEmail,
          name: emergencyName || '紧急联系人',
          relation: '家人'
        }] : [],
        thresholds: {
          minWorkHours: minHours,
          minKeyframes: minKeyframes,
          minJsonSize: minJsonSize
        }
      };

      try {
        const response = await fetch(API_BASE + '/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, config })
        });
        const data = await response.json();
        
        if (data.success) {
          showAlert('配置保存成功');
          loadStats();
          addRecentActivity('用户 ' + username + ' 的配置已更新');
        } else {
          showAlert('保存失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('保存失败: ' + error.message, 'error');
      }
    }

    async function sendTestEmail() {
      const userEmail = document.getElementById('userEmail').value.trim();
      if (!userEmail) {
        showAlert('请输入用户邮箱', 'error');
        return;
      }

      const userId = generateUserId(userEmail);
      
      try {
        const response = await fetch(API_BASE + '/api/send-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const data = await response.json();
        
        if (data.success) {
          showAlert('测试邮件已发送到 ' + userEmail);
          addRecentActivity('向 ' + userEmail + ' 发送测试邮件');
        } else {
          showAlert('发送失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('发送失败: ' + error.message, 'error');
      }
    }

    async function loadLogs() {
      const userEmail = document.getElementById('userEmail').value.trim();
      if (!userEmail) {
        showAlert('请输入用户邮箱', 'error');
        return;
      }

      const userId = generateUserId(userEmail);
      const container = document.getElementById('logContainer');
      
      try {
        const response = await fetch(API_BASE + '/api/logs?userId=' + userId + '&limit=50');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          container.innerHTML = data.data.map(log => {
            const statusClass = log.status === 'success' ? 'success' : 'error';
            const badgeClass = log.status === 'success' ? 'badge-success' : 'badge-error';
            const time = new Date(log.sent_at).toLocaleString('zh-CN');
            return '<div class="log-item ' + statusClass + '">' +
              '<span class="log-time">[' + time + ']</span>' +
              '<span class="badge ' + badgeClass + '">' + log.recipient_type + '</span>' +
              ' → ' + log.recipient_email +
              ' (' + log.email_type + ')' +
              (log.error_message ? '<br><span style="color: #ef4444;">错误: ' + log.error_message + '</span>' : '') +
              '</div>';
          }).join('');
          addRecentActivity('加载了 ' + data.data.length + ' 条发送记录');
        } else {
          container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">暂无发送记录</p>';
        }
      } catch (error) {
        container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">加载失败: ' + error.message + '</p>';
      }
    }

    async function loadStats() {
      try {
        // 这里可以添加实际的统计API调用
        document.getElementById('stat-users').textContent = '1';
        document.getElementById('stat-emails').textContent = '0';
        document.getElementById('stat-today').textContent = '0';
        document.getElementById('stat-success').textContent = '100%';
        
        // 检查Worker状态
        const healthResponse = await fetch(API_BASE + '/health');
        if (healthResponse.ok) {
          document.getElementById('workerStatus').innerHTML = '<span style="color: #10b981;">● 正常运行</span>';
        } else {
          document.getElementById('workerStatus').innerHTML = '<span style="color: #ef4444;">● 异常</span>';
        }
      } catch (error) {
        console.error('加载统计失败:', error);
        document.getElementById('workerStatus').innerHTML = '<span style="color: #ef4444;">● 离线</span>';
      }
    }

    function addRecentActivity(message) {
      const container = document.getElementById('recentActivity');
      const time = new Date().toLocaleTimeString('zh-CN');
      const activity = '<p style="padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #9ca3af;">[' + time + ']</span> ' + message + '</p>';
      
      if (container.innerHTML.includes('暂无活动记录')) {
        container.innerHTML = activity;
      } else {
        container.innerHTML = activity + container.innerHTML;
      }
      
      // 只保留最近10条
      const activities = container.querySelectorAll('p');
      if (activities.length > 10) {
        activities[activities.length - 1].remove();
      }
    }

    // 页面加载时初始化
    window.onload = function() {
      loadStats();
      addRecentActivity('管理后台已加载');
    };
  </script>
</body>
</html>`;
}

// ==================== 邮件模板 ====================

async function generateDailySummaryEmail(user, workData, config) {
  // 动态导入邮件模板（使用幽默版）
  const { generateDailySummaryHumorEmail: generateTemplate } = await import('./templates/daily-summary-humor.js');
  return generateTemplate(user, workData, config);
}

async function generateWarningEmail(user, workData, config) {
  // 动态导入邮件模板（使用幽默版）
  const { generateWarningHumorEmail: generateTemplate } = await import('./templates/warning-humor.js');
  return generateTemplate(user, workData, config);
}