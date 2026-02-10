/**
 * 路由配置文件
 * 统一管理所有页面路由和 API 路由
 */

// ==================== 页面路由 ====================
// 所有页面路由都返回相应的 HTML 文件
// 前端 React 应用根据 URL 切换视图

export const PAGE_ROUTES = {
  // 根路由 - 落地页
  '/': {
    type: 'spa',
    file: 'index.html',
    description: '落地页 - RuAlive 介绍'
  },
  '/index.html': {
    type: 'spa',
    file: 'index.html',
    description: '落地页 - RuAlive 介绍'
  },
  
  // 登录/注册页
  '/login': {
    type: 'spa',
    file: 'auth.html',
    description: '登录/注册页'
  },
  '/register': {
    type: 'spa',
    file: 'auth.html',
    description: '登录/注册页'
  },
  
  // 用户页
  '/user': {
    type: 'spa',
    file: 'index.html',
    description: '用户面板'
  },
  '/user.html': {
    type: 'spa',
    file: 'index.html',
    description: '用户面板'
  },
  
  // 管理员页
  '/admin': {
    type: 'backend',
    description: '管理员仪表板（后端生成）'
  },
  '/admin.html': {
    type: 'backend',
    description: '管理员仪表板（后端生成）'
  },
  '/admin/': {
    type: 'backend',
    description: '管理员仪表板（后端生成）'
  }
};

// ==================== API 路由 ====================
// 所有 API 路由都以 /api 开头

export const API_ROUTES = {
  // 公共 API - 统计（无需认证）
  '/api/stats/users': {
    method: 'GET',
    handler: 'handleGetUserStats',
    description: '获取用户数量统计'
  },

  // 认证相关
  '/api/auth/register': {
    method: 'POST',
    handler: 'handleRegister',
    description: '用户注册'
  },
  '/api/auth/login': {
    method: 'POST',
    handler: 'handleLogin',
    description: '用户登录'
  },
  '/api/auth/logout': {
    method: 'POST',
    handler: 'handleLogout',
    description: '用户登出'
  },
  '/api/auth/me': {
    method: 'GET',
    handler: 'handleGetCurrentUser',
    description: '获取当前用户信息'
  },
  '/api/auth/me': {
    method: 'PUT',
    handler: 'handleUpdateCurrentUser',
    description: '更新当前用户信息'
  },
  '/api/auth/init': {
    method: 'POST',
    handler: 'handleInitAdmin',
    description: '初始化管理员账户'
  },
  
  // 管理员相关
  '/api/admin/invite-codes': {
    method: 'GET',
    handler: 'handleGetInviteCodes',
    description: '获取邀请码列表'
  },
  '/api/admin/invite-codes': {
    method: 'POST',
    handler: 'handleCreateInviteCodes',
    description: '创建邀请码'
  },
  '/api/admin/invite-codes': {
    method: 'DELETE',
    handler: 'handleDeleteInviteCode',
    description: '删除邀请码'
  },
  '/api/admin/users': {
    method: 'GET',
    handler: 'handleGetUsers',
    description: '获取用户列表'
  },
  '/api/admin/api-key': {
    method: 'GET',
    handler: 'handleGetApiKey',
    description: '获取 API 密钥'
  },
  '/api/admin/api-key': {
    method: 'POST',
    handler: 'handleGenerateApiKey',
    description: '生成 API 密钥'
  },
  '/api/admin/api-key': {
    method: 'DELETE',
    handler: 'handleDeleteApiKey',
    description: '删除 API 密钥'
  },
  '/api/admin/api-key/test': {
    method: 'POST',
    handler: 'handleTestApiKey',
    description: '测试 API 密钥'
  },
  
  // 配置相关
  '/api/config': {
    method: 'GET',
    handler: 'handleGetConfig',
    description: '获取用户配置'
  },
  '/api/config': {
    method: 'POST',
    handler: 'handleUpdateConfig',
    description: '更新用户配置'
  },
  
  // 工作数据相关
  '/api/work-data': {
    method: 'POST',
    handler: 'handleUploadWorkData',
    description: '上传工作数据'
  },
  '/api/heartbeat': {
    method: 'POST',
    handler: 'handleHeartbeat',
    description: '心跳检测'
  },
  
  // AE 状态相关
  '/api/ae-status': {
    method: 'GET',
    handler: 'handleGetAEStatus',
    description: '获取 AE 状态'
  },
  '/api/ae-status': {
    method: 'POST',
    handler: 'handleUpdateAEStatus',
    description: '更新 AE 状态'
  },
  
  // 邮件相关
  '/api/send-now': {
    method: 'POST',
    handler: 'handleSendNow',
    description: '立即发送邮件'
  },
  '/api/logs': {
    method: 'GET',
    handler: 'handleGetLogs',
    description: '获取发送日志'
  },
  '/api/work-logs': {
    method: 'GET',
    handler: 'handleGetWorkLogs',
    description: '获取工作日志'
  },
  
  // 健康检查
  '/health': {
    method: 'GET',
    handler: 'handleHealth',
    description: '健康检查'
  }
};

// ==================== 路由处理函数 ====================

/**
 * 处理页面路由
 * @param {string} path - 请求路径
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Response} 响应对象
 */
export async function handlePageRoute(path, request, env) {
  const route = PAGE_ROUTES[path];
  
  if (!route) {
    return new Response('Not Found', { status: 404 });
  }
  
  if (route.type === 'spa') {
    // SPA 路由 - 返回对应的 HTML 文件
    if (env.ASSETS) {
      try {
        const fileUrl = new URL('/' + route.file, request.url);
        const assetResponse = await env.ASSETS.fetch(new Request(fileUrl, { method: 'GET' }));
        if (assetResponse && assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch (error) {
        console.error(`Failed to fetch ${route.file} from Assets:`, error);
      }
    }
    return new Response('Not Found', { status: 404 });
  } else if (route.type === 'backend') {
    // 后端生成路由 - 返回后端生成的 HTML
    if (path.startsWith('/admin')) {
      return generateAdminDashboard();
    }
    return new Response('Not Found', { status: 404 });
  }
  
  return new Response('Not Found', { status: 404 });
}

/**
 * 生成管理员仪表板 HTML
 * @returns {string} HTML 字符串
 */
function generateAdminDashboard() {
  // 这里返回管理员仪表板的 HTML
  // 简化版本，实际应该从 KV 中获取或生成
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive 管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; min-height: 100vh; }
    .navbar { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1rem 2rem; }
    .navbar h1 { font-size: 1.5rem; font-weight: 600; }
    .logout-btn { padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; color: white; cursor: pointer; }
    .main-container { max-width: 1400px; margin: 2rem auto; padding: 0 1rem; }
    .content-card { background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .content-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
  </style>
</head>
<body>
  <nav class="navbar">
    <h1>🔐 RuAlive 管理后台</h1>
    <button class="logout-btn" onclick="logout()">退出登录</button>
  </nav>
  <div class="main-container">
    <div class="content-card">
      <h2>👥 用户管理</h2>
      <table id="usersTable">
        <thead><tr><th>用户名</th><th>邮箱</th><th>角色</th></tr></thead>
        <tbody><tr><td colspan="3">加载中...</td></tr></tbody>
      </table>
    </div>
  </div>
  <script>
    const API_BASE = window.location.origin;
    function getAuthHeader() {
      const token = localStorage.getItem('rualive_token');
      return { 'Authorization': 'Bearer ' + token };
    }
    async function loadUsers() {
      try {
        const response = await fetch(API_BASE + '/api/admin/users', { headers: getAuthHeader() });
        const data = await response.json();
        if (data.success) {
          document.querySelector('#usersTable tbody').innerHTML = data.users.map(u => 
            '<tr><td>' + u.username + '</td><td>' + u.email + '</td><td>' + u.role + '</td></tr>'
          ).join('');
        }
      } catch (error) {
        console.error('加载用户失败:', error);
      }
    }
    function logout() {
      localStorage.removeItem('rualive_token');
      localStorage.removeItem('rualive_user');
      window.location.href = '/login';
    }
    window.onload = loadUsers;
  </script>
</body>
</html>`;
}