# 注册码输入框和 Hash 路由问题修复

**日期**: 2026-02-10
**问题类型**: 表单功能缺失、路由同步问题
**影响范围**: 注册表单、登录/注册切换

---

## 问题描述

### 问题 1: 注册表单缺少邀请码输入框

**现象**:
- 注册表单中没有邀请码输入框
- 提交注册时后端返回"缺少必要参数"错误
- 后端 API (`/api/auth/register`) 需要 `inviteCode` 参数

**根本原因**:
- 前端表单缺少邀请码输入字段
- 表单提交时没有收集 `inviteCode` 参数
- 后端验证逻辑要求必须提供邀请码（后端代码第 744 行）：
  ```javascript
  if (!email || !username || !password || !inviteCode) {
    return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
  }
  ```

**后端验证逻辑**:
1. 检查邀请码是否存在且激活
2. 检查邀请码是否过期
3. 检查邀请码使用次数是否达到上限
4. 创建用户后增加邀请码使用次数

### 问题 2: 注册/登录切换时 URL hash 不同步

**现象**:
- 点击"注册"按钮后，虽然切换到注册表单，但 URL 仍为 `/login`
- 点击"登录"按钮后，URL 仍为 `/login#register`
- 刷新页面后无法保持当前模式
- 与落地页行为不一致（落地页使用 hash 路由）

**根本原因**:
- 原代码使用 URL 查询参数 `?mode=register` 读取初始模式
- `toggleMode` 函数切换模式时没有更新 URL
- 没有监听 URL hash 变化事件
- 与落地页的 hash 路由行为不一致（落地页直接访问 `/login#register`）

---

## 解决方案

### 修复 1: 添加邀请码输入框

**修改文件**:
- `public/auth.tsx` - 添加邀请码输入字段和验证逻辑
- `public/locals/auth/zh.json` - 添加中文翻译
- `public/locals/auth/en.json` - 添加英文翻译

**代码修改**:

1. **添加邀请码输入框** (auth.tsx 第 395-408 行):
```tsx
{!isLogin && (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{trans.inviteCodeLabel}</label>
    <input
      type="text"
      name="inviteCode"
      placeholder={trans.placeholderInviteCode || 'ABCD-1234'}
      className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm uppercase"
      autoComplete="off"
      disabled={isLoading}
    />
  </div>
)}
```

2. **收集邀请码参数** (auth.tsx 第 270-277 行):
```tsx
const formData = {
  email: (form.elements.namedItem('email') as HTMLInputElement).value,
  password: (form.elements.namedItem('password') as HTMLInputElement).value,
  ...(!isLogin ? {
    username: (form.elements.namedItem('username') as HTMLInputElement).value,
    inviteCode: (form.elements.namedItem('inviteCode') as HTMLInputElement).value
  } : {})
};
```

3. **验证邀请码** (auth.tsx 第 280-285 行):
```tsx
// 注册时验证邀请码
if (!isLogin && !formData.inviteCode) {
  setError(trans.fillAllFields);
  setIsLoading(false);
  return;
}
```

4. **更新翻译文件**:
```json
// zh.json
{
  "inviteCodeLabel": "邀请码",
  "placeholderInviteCode": "ABCD-1234"
}

// en.json
{
  "inviteCodeLabel": "Invite Code",
  "placeholderInviteCode": "ABCD-1234"
}
```

**样式特点**:
- 仅在注册模式下显示（`!isLogin` 条件）
- 大写显示输入内容（`uppercase` class）
- 格式提示：ABCD-1234
- 与其他输入框样式一致

### 修复 2: 实现 Hash 路由同步

**修改文件**:
- `public/auth.tsx` - 改用 hash 路由并添加监听器

**代码修改**:

1. **从 URL hash 读取初始模式** (auth.tsx 第 172-189 行):
```tsx
// 从URL hash读取mode，自动切换到注册模式
useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash;
    if (hash === '#register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  };

  // 初始化时检查 hash
  handleHashChange();

  // 监听 hash 变化
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);
```

2. **toggleMode 时更新 URL hash** (auth.tsx 第 217-241 行):
```tsx
const toggleMode = () => {
  setError(null);
  const newMode = !isLogin;

  if (window.gsap && formRef.current) {
    window.gsap.to(formRef.current,
      { opacity: 0, x: isLogin ? -20 : 20, duration: 0.3, ease: "power2.in",
        onComplete: () => {
          // 更新 URL hash
          window.location.hash = newMode ? '' : 'register';
          setIsLogin(newMode);
          window.gsap.fromTo(formRef.current,
            { opacity: 0, x: isLogin ? 20 : -20 },
            { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
          );
        }
      }
    );
  } else {
    // 更新 URL hash
    window.location.hash = newMode ? '' : 'register';
    setIsLogin(newMode);
  }
};
```

**路由行为**:
- 登录页: `/login` 或 `/login#`
- 注册页: `/login#register`
- 切换到注册: URL 变为 `/login#register`
- 切换到登录: URL 变为 `/login`
- 刷新页面: 根据 hash 保持当前模式
- 前进/后退: 通过 `hashchange` 事件支持

---

## 技术细节

### 邀请码系统后端逻辑

**数据库表**: `invite_codes`

```sql
CREATE TABLE invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**验证逻辑** (src/index.js 第 747-761 行):
```javascript
const invite = await DB.prepare(
  'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))'
).bind(inviteCode).first();

if (!invite) {
  return Response.json({ success: false, error: '无效的邀请码' }, { status: 400 });
}

if (invite.used_count >= invite.max_uses) {
  return Response.json({ success: false, error: '邀请码已用完' }, { status: 400 });
}
```

**使用逻辑** (src/index.js 第 777-780 行):
```javascript
// 更新邀请码使用次数
await DB.prepare(
  'UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?'
).bind(invite.id).run();
```

### Hash 路由优势

1. **无服务器配置**: 不需要额外的路由配置
2. **客户端管理**: 完全由前端控制
3. **与落地页一致**: 落地页也使用 hash 路由
4. **书签友好**: 可以直接保存 `/login#register` 书签
5. **浏览器支持**: 自动支持前进/后退按钮

---

## 测试清单

### 邀请码功能测试

- [ ] 注册表单显示邀请码输入框
- [ ] 邀请码输入框大写显示
- [ ] 不填写邀请码提交时显示"请填写所有必填字段"
- [ ] 输入无效邀请码时后端返回"无效的邀请码"
- [ ] 输入已用完的邀请码时后端返回"邀请码已用完"
- [ ] 输入有效的邀请码时注册成功
- [ ] 邀请码使用次数正确增加
- [ ] 中英文翻译正确显示

### Hash 路由测试

- [ ] 点击"注册"按钮 URL 变为 `/login#register`
- [ ] 点击"登录"按钮 URL 变为 `/login`
- [ ] 直接访问 `/login#register` 显示注册表单
- [ ] 刷新 `/login#register` 保持注册模式
- [ ] 浏览器前进/后退按钮正常工作
- [ ] 动画切换流畅
- [ ] 与落地页行为一致

---

## 相关文档

- [邀请码管理 API](modules/api/admin-api.md) - 管理员创建和删除邀请码
- [认证 API](modules/api/auth-api.md) - 注册和登录接口
- [认证模块](modules/backend/auth.md) - 邀请码生成和验证逻辑
- [路由管理](api/17_route_management.md) - 完整路由配置

---

## 注意事项

1. **邀请码格式**: 后端生成的邀请码格式为 `XXXX-XXXX`（4位-4位）
2. **邀请码管理**: 管理员在管理后台创建和删除邀请码
3. **大写显示**: 前端强制大写显示，但后端验证不区分大小写
4. **URL 兼容性**: 支持 `/login`、`/login#`、`/login#register` 三种格式
5. **浏览器历史**: 每次切换都会添加历史记录，支持前进/后退
6. **动画时序**: URL 更新在动画完成后执行，确保状态同步

---

## 提交记录

- `f6c41c6` - fix(auth): 添加注册码输入框到注册表单
- `586cf93` - fix(auth): 修复注册/登录切换时 URL hash 不同步问题