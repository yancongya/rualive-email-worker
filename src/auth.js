/**
 * 认证模块
 * 处理用户注册、登录、会话管理
 */

// 生成用户ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 生成邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // 格式化为 XXXX-XXXX
  return code.slice(0, 4) + '-' + code.slice(4, 8);
}

// 密码哈希（简单实现，生产环境应使用bcrypt等）
function hashPassword(password) {
  // 使用Web Crypto API进行SHA-256哈希
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'rualive_salt_2024');
  return crypto.subtle.digest('SHA-256', data).then(hash => {
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

// 验证密码
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成JWT token
function generateToken(userId, role, env) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    userId: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30天过期
  };

  const secret = env ? (env.JWT_SECRET || 'rualive_secret_key_2024') : 'rualive_secret_key_2024';
  
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
}

// 验证JWT token
async function verifyToken(token, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    // 检查过期
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // 验证签名
    const secret = env ? (env.JWT_SECRET || 'rualive_secret_key_2024') : 'rualive_secret_key_2024';
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
    
    if (signature !== expectedSignatureBase64) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

// 用户注册
async function registerUser(email, username, password, inviteCode, env) {
  const DB = env.DB || env.rualive;
  
  // 检查邮箱是否已存在
  const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existingUser) {
    return { success: false, error: '邮箱已被注册' };
  }
  
  // 验证邀请码
  const invite = await DB.prepare(
    'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))'
  ).bind(inviteCode).first();
  
  if (!invite) {
    return { success: false, error: '无效的邀请码' };
  }
  
  if (invite.used_count >= invite.max_uses) {
    return { success: false, error: '邀请码已用完' };
  }
  
  // 创建用户
  const userId = generateUserId();
  const passwordHash = await hashPassword(password);
  
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
  
  return { success: true, userId };
}

// 用户登录
async function loginUser(email, password, env) {
  const DB = env.DB || env.rualive;
  
  const user = await DB.prepare(
    'SELECT id, email, username, password_hash, role FROM users WHERE email = ?'
  ).bind(email).first();
  
  if (!user) {
    return { success: false, error: '邮箱或密码错误' };
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return { success: false, error: '邮箱或密码错误' };
  }

  // 生成token
  const token = await generateToken(user.id, user.role, env);

  // 保存会话
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(user.id, token, expiresAt).run();
  
  // 更新最后登录时间
  await DB.prepare(
    'UPDATE users SET last_login = datetime("now") WHERE id = ?'
  ).bind(user.id).run();
  
  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
  };
}

// 登出
async function logoutUser(token, env) {
  const DB = env.DB || env.rualive;
  
  await DB.prepare(
    'DELETE FROM sessions WHERE token = ?'
  ).bind(token).run();
  
  return { success: true };
}

// 获取当前用户
async function getCurrentUser(token, env) {
  const DB = env.DB || env.rualive;
  
  // 验证token
  const payload = await verifyToken(token);
  if (!payload) {
    return { success: false, error: '无效的token' };
  }
  
  // 检查会话是否存在
  const session = await DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
  
  if (!session) {
    return { success: false, error: '会话已过期' };
  }
  
  // 获取用户信息
  const user = await DB.prepare(
    'SELECT id, email, username, role, created_at, last_login FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  
  return {
    success: true,
    user
  };
}

// 创建邀请码（仅管理员）
async function createInviteCode(adminUserId, maxUses, expiresInDays, env) {
  const DB = env.DB || env.rualive;
  
  // 验证管理员权限
  const admin = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(adminUserId).first();
  
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: '权限不足' };
  }
  
  const codeId = generateUserId();
  const code = generateInviteCode();
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  
  await DB.prepare(
    'INSERT INTO invite_codes (id, code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(codeId, code, adminUserId, maxUses, expiresAt).run();
  
  return {
    success: true,
    code,
    expiresAt
  };
}

// 获取邀请码列表（仅管理员）
async function getInviteCodes(adminUserId, env) {
  const DB = env.DB || env.rualive;
  
  // 验证管理员权限
  const admin = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(adminUserId).first();
  
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: '权限不足' };
  }
  
  const codes = await DB.prepare(
    'SELECT ic.*, u.username as created_by_name FROM invite_codes ic LEFT JOIN users u ON ic.created_by = u.id ORDER BY ic.created_at DESC'
  ).all();
  
  return {
    success: true,
    codes: codes.results
  };
}

// 删除邀请码（仅管理员）
async function deleteInviteCode(codeId, adminUserId, env) {
  const DB = env.DB || env.rualive;
  
  // 验证管理员权限
  const admin = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(adminUserId).first();
  
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: '权限不足' };
  }
  
  await DB.prepare(
    'UPDATE invite_codes SET is_active = 0 WHERE id = ?'
  ).bind(codeId).run();
  
  return { success: true };
}

// 获取用户列表（仅管理员）
async function getUsers(adminUserId, env) {
  const DB = env.DB || env.rualive;
  
  // 验证管理员权限
  const admin = await DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(adminUserId).first();
  
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: '权限不足' };
  }
  
  const users = await DB.prepare(
    'SELECT id, email, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
  ).all();
  
  return {
    success: true,
    users: users.results
  };
}

// 创建初始管理员账户
async function createInitialAdmin(env) {
  const DB = env.DB || env.rualive;
  
  // 检查是否已有管理员
  const adminCount = await DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
  ).first();
  
  if (adminCount.count > 0) {
    return { success: false, error: '管理员已存在' };
  }
  
  const adminId = 'admin_' + Date.now();
  const passwordHash = await hashPassword('admin123'); // 默认密码
  
  await DB.prepare(
    'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).bind(adminId, 'admin@rualive.com', '管理员', passwordHash, 'admin').run();
  
  // 创建初始邀请码
  const codeId = generateUserId();
  const code = generateInviteCode();
  
  await DB.prepare(
    'INSERT INTO invite_codes (id, code, created_by, max_uses) VALUES (?, ?, ?, ?)'
  ).bind(codeId, code, adminId, 10).run();
  
  return {
    success: true,
    admin: {
      email: 'admin@rualive.com',
      password: 'admin123',
      inviteCode: code
    }
  };
}

export {
  generateUserId,
  generateInviteCode,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  createInviteCode,
  getInviteCodes,
  deleteInviteCode,
  getUsers,
  createInitialAdmin
};