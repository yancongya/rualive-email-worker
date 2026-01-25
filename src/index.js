/**
 * RuAlive Email Notification Worker
 * MVP版本 - 每日工作总结和紧急联系人监督
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

// Landing 页 HTML 内容
const LANDING_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="RuAlive 是一款专为 After Effects 动画师设计的智能工作追踪工具，自动统计工作量、实时监控项目进度，让你的动画'活'起来">
  <meta name="keywords" content="After Effects, AE, 动画, 工作追踪, 时间统计, AE扩展">
  <meta name="author" content="RuAlive@烟囱鸭">
  <meta name="robots" content="index, follow">
  <title>RuAlive - After Effects 智能工作追踪工具</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <!-- AOS -->
  <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
  <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { DEFAULT: '#ff6b35', light: '#ff8c42', dark: '#e55a2b' },
            secondary: '#2d2d2d',
            accent: '#ff6b35',
            dark: { DEFAULT: '#1a1a1a', card: 'rgba(45, 45, 45, 0.9)' },
          },
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          borderRadius: { 'card': '16px', 'button': '8px' },
          boxShadow: { 'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3)', 'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.4)' },
        },
      },
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%); min-height: 100vh; color: #ffffff; overflow-x: hidden; }
    html { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #1a1a1a; }
    ::-webkit-scrollbar-thumb { background: #ff6b35; border-radius: 4px; }
    .glass-effect { background: rgba(45, 45, 45, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .gradient-text { background: linear-gradient(135deg, #ff6b35, #ff8c42); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .slogan-popup { position: fixed; background: linear-gradient(135deg, #ff6b35, #ff8c42); color: white; padding: 12px 24px; border-radius: 20px; font-size: 16px; font-weight: 600; pointer-events: none; z-index: 9999; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4); white-space: nowrap; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
    @media (max-width: 768px) { .slogan-popup { font-size: 14px; padding: 10px 20px; } }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
    .faq-item.active .faq-answer { max-height: 500px; }
    .faq-item.active .faq-icon { transform: rotate(180deg); }
    .stat-number { font-variant-numeric: tabular-nums; }
    .nav-hidden { transform: translateY(-100%); }
    .nav-visible { transform: translateY(0); }
  </style>
</head>
<body>
  <nav class="fixed top-0 left-0 right-0 z-50 glass-effect transition-transform duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center"><span class="text-2xl">🔥</span><span class="ml-2 text-xl font-bold gradient-text">RuAlive</span></div>
        <div class="hidden md:flex items-center space-x-8">
          <a href="#features" class="text-gray-300 hover:text-white transition-colors">功能特性</a>
          <a href="#how-it-works" class="text-gray-300 hover:text-white transition-colors">使用场景</a>
          <a href="#testimonials" class="text-gray-300 hover:text-white transition-colors">用户评价</a>
          <a href="#faq" class="text-gray-300 hover:text-white transition-colors">FAQ</a>
        </div>
        <a href="/login" class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-button font-semibold transition-colors duration-200 cursor-pointer">立即开始（免费）</a>
      </div>
    </div>
  </nav>
  <section class="min-h-screen flex items-center justify-center pt-16 px-4">
    <div class="max-w-7xl mx-auto text-center">
      <h1 class="hero-title text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">你今天动了吗？</h1>
      <p class="hero-subtitle text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">专为 After Effects 动画师设计，实时追踪你的'存活状态'，让你的动画搭子知道你还在努力搬砖</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/login" class="cta-button px-8 py-4 bg-primary hover:bg-primary-dark rounded-button font-bold text-lg transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5">立即注册</a>
        <a href="/login" class="cta-button px-8 py-4 bg-transparent border-2 border-primary hover:bg-primary hover:text-white rounded-button font-bold text-lg transition-all duration-200 cursor-pointer">已有账号？登录</a>
      </div>
    </div>
  </section>
  <section class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto">
      <div class="glass-effect rounded-card p-8 mb-8">
        <p class="text-center text-gray-400 mb-8">⚠️ 以下数据纯属虚构，如有雷同，纯属巧合</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center"><div class="stat-number text-4xl md:text-5xl font-bold gradient-text mb-2">50,000+</div><p class="text-gray-400">已追踪搬砖时间（瞎吹的）</p></div>
          <div class="text-center"><div class="stat-number text-4xl md:text-5xl font-bold gradient-text mb-2">1,000+</div><p class="text-gray-400">动画搭子在线（可能是我编的）</p></div>
          <div class="text-center"><div class="stat-number text-4xl md:text-5xl font-bold gradient-text mb-2">4.9/5</div><p class="text-gray-400">动画师好评（朋友给的）</p></div>
          <div class="text-center"><div class="stat-number text-4xl md:text-5xl font-bold gradient-text mb-2">99.9%</div><p class="text-gray-400">存活率（希望如此）</p></div>
        </div>
      </div>
    </div>
  </section>
  <section class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">动画师的日常困境</h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">🫠</div><h3 class="text-xl font-bold mb-2">每天加班到深夜</h3><p class="text-gray-400">感觉快要猝死了，但项目deadline一个接一个</p></div>
        <div class="glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">🤔</div><h3 class="text-xl font-bold mb-2">家人朋友的关心</h3><p class="text-gray-400">天天问"你还在做动画吗？"，都不知道我死没死</p></div>
        <div class="glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">🔄</div><h3 class="text-xl font-bold mb-2">工作生活失衡</h3><p class="text-gray-400">想平衡生活和工作，但根本停不下来</p></div>
        <div class="glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">👀</div><h3 class="text-xl font-bold mb-2">朋友的猜测</h3><p class="text-gray-400">朋友想关心我，但不知道我什么时候有空，只能看着朋友圈猜测</p></div>
      </div>
    </div>
  </section>
  <section class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-6">RuAlive 来了，你的动画搭子已上线 🚀</h2>
      <p class="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">自动追踪，让你专注于'搞事'而不是'记事' 📝<br>数据说话，再也不用'我觉得'了 💯</p>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="glass-effect rounded-card p-8"><div class="text-5xl mb-4">⚡</div><h3 class="text-xl font-bold mb-2">自动扫描</h3><p class="text-gray-400">你负责动，我负责数</p></div>
        <div class="glass-effect rounded-card p-8"><div class="text-5xl mb-4">📊</div><h3 class="text-xl font-bold mb-2">数据可视化</h3><p class="text-gray-400">关键帧数、合成数，一个都不能少</p></div>
        <div class="glass-effect rounded-card p-8"><div class="text-5xl mb-4">🔔</div><h3 class="text-xl font-bold mb-2">智能提醒</h3><p class="text-gray-400">该休息了，但甲方还在催</p></div>
      </div>
    </div>
  </section>
  <section id="features" class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">功能特性</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">⚡</div><h3 class="text-xl font-bold mb-2">自动扫描</h3><p class="text-gray-400 mb-4">你负责动，我负责数</p><p class="text-primary font-semibold">节省每天 30+ 分钟</p></div>
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">⏰</div><h3 class="text-xl font-bold mb-2">运行时间</h3><p class="text-gray-400 mb-4">今天搬砖几小时，一目了然</p><p class="text-primary font-semibold">精确到秒级</p></div>
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">📊</div><h3 class="text-xl font-bold mb-2">工作统计</h3><p class="text-gray-400 mb-4">关键帧数、合成数，一个都不能少</p><p class="text-primary font-semibold">数据可视化</p></div>
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">🔔</div><h3 class="text-xl font-bold mb-2">智能提醒</h3><p class="text-gray-400 mb-4">该休息了，但甲方还在催</p><p class="text-primary font-semibold">从不错过</p></div>
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">📧</div><h3 class="text-xl font-bold mb-2">邮件通知</h3><p class="text-gray-400 mb-4">给动画搭子报个信，让监督更轻松</p><p class="text-primary font-semibold">自动提醒</p></div>
        <div class="feature-card glass-effect rounded-card p-6 hover:shadow-card-hover transition-all duration-300 cursor-pointer"><div class="text-4xl mb-4">💾</div><h3 class="text-xl font-bold mb-2">数据保存</h3><p class="text-gray-400 mb-4">你的努力，我都记着呢</p><p class="text-primary font-semibold">本地存储</p></div>
      </div>
    </div>
  </section>
  <section id="how-it-works" class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">三步开始使用</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center"><div class="glass-effect rounded-card p-8 mb-4"><div class="text-5xl mb-4">1️⃣</div><h3 class="text-xl font-bold mb-2">安装扩展</h3><p class="text-gray-400">三步搞定，比煮泡面还快</p></div></div>
        <div class="text-center"><div class="glass-effect rounded-card p-8 mb-4"><div class="text-5xl mb-4">2️⃣</div><h3 class="text-xl font-bold mb-2">注册登录</h3><p class="text-gray-400">填个邮箱，就能开始</p></div></div>
        <div class="text-center"><div class="glass-effect rounded-card p-8 mb-4"><div class="text-5xl mb-4">3️⃣</div><h3 class="text-xl font-bold mb-2">开始追踪</h3><p class="text-gray-400">打开 AE，自动干活</p></div></div>
      </div>
    </div>
  </section>
  <section id="testimonials" class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">用户评价</h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="testimonial-card glass-effect rounded-card p-6"><p class="text-gray-300 mb-4">"终于不用担心猝死了，朋友看到我的工作数据，都会提醒我休息"</p><p class="text-primary font-semibold">— 某加班动画师 🫠</p></div>
        <div class="testimonial-card glass-effect rounded-card p-6"><p class="text-gray-300 mb-4">"妈妈再也不用担心我了，她能看到我还在努力活着"</p><p class="text-primary font-semibold">— 孝顺动画师 👨‍👩‍👧</p></div>
        <div class="testimonial-card glass-effect rounded-card p-6"><p class="text-gray-300 mb-4">"朋友通过 RuAlive 知道我什么时候有空，终于可以约饭了"</p><p class="text-primary font-semibold">— 社交动画师 🍻</p></div>
        <div class="testimonial-card glass-effect rounded-card p-6"><p class="text-gray-300 mb-4">"工作搭子们互相监督，谁偷懒一目了然"</p><p class="text-primary font-semibold">— 团队动画师 👥</p></div>
      </div>
    </div>
  </section>
  <section id="faq" class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">常见问题</h2>
      <div class="space-y-4">
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">RuAlive 是免费的吗？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">是的，完全免费，比甲方画的大饼还实在 🥞</p></div></div>
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">需要联网吗？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">扫描功能离线可用，邮件通知需要联网（毕竟要给搭子报信）📧</p></div></div>
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">支持哪些版本的 AE？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">支持 CC 2015 及以上，老古董就别来了吧 😅</p></div></div>
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">数据保存在哪里？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">保存在本地，比你的甲方还可靠 🤫</p></div></div>
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">如何开始使用？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">三步搞定：下载 → 安装 → 开搞，比点外卖还简单 🍔</p></div></div>
        <div class="faq-item glass-effect rounded-card overflow-hidden"><div class="faq-question p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"><h3 class="text-lg font-semibold">有使用限制吗？</h3><i class="faq-icon fas fa-chevron-down transition-transform duration-300"></i></div><div class="faq-answer px-6 pb-6"><p class="text-gray-400">没有，想怎么用就怎么用，就像你对待甲方一样（开玩笑的）😜</p></div></div>
      </div>
    </div>
  </section>
  <section class="py-20 px-4" data-aos="fade-up">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-6">别让你的动画'死'在半路上</h2>
      <p class="text-xl text-gray-300 mb-8">加入 1,000+ 动画师，让你的动画搭子知道你还在努力活着</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/login" class="px-8 py-4 bg-primary hover:bg-primary-dark rounded-button font-bold text-lg transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5">立即注册</a>
        <a href="/login" class="px-8 py-4 bg-transparent border-2 border-primary hover:bg-primary hover:text-white rounded-button font-bold text-lg transition-all duration-200 cursor-pointer">已有账号？登录</a>
      </div>
    </div>
  </section>
  <footer class="py-12 px-4 border-t border-white/10">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-4 gap-8 mb-8">
        <div><div class="flex items-center mb-4"><span class="text-2xl">🔥</span><span class="ml-2 text-xl font-bold gradient-text">RuAlive</span></div><p class="text-gray-400">活着，就是为了做动画</p></div>
        <div><h4 class="font-bold mb-4">产品</h4><ul class="space-y-2"><li><a href="#features" class="text-gray-400 hover:text-white transition-colors">功能特性</a></li><li><a href="#how-it-works" class="text-gray-400 hover:text-white transition-colors">使用场景</a></li><li><a href="#testimonials" class="text-gray-400 hover:text-white transition-colors">用户评价</a></li></ul></div>
        <div><h4 class="font-bold mb-4">支持</h4><ul class="space-y-2"><li><a href="#faq" class="text-gray-400 hover:text-white transition-colors">FAQ</a></li><li><a href="#" class="text-gray-400 hover:text-white transition-colors">使用文档</a></li><li><a href="#" class="text-gray-400 hover:text-white transition-colors">联系我们</a></li></ul></div>
        <div><h4 class="font-bold mb-4">信任标识</h4><ul class="space-y-2"><li class="text-gray-400">🛡️ 数据安全</li><li class="text-gray-400">🔒 隐私保护</li><li class="text-gray-400">✅ 完全免费</li><li class="text-gray-400">🚀 99.9% 正常运行</li></ul></div>
      </div>
      <div class="border-t border-white/10 pt-8 text-center text-gray-400"><p>&copy; 2026 RuAlive@烟囱鸭. All rights reserved.</p><p class="mt-2">活着，就是为了做动画</p></div>
    </div>
  </footer>
  <script>
    // Landing Page JS
    const CONSTANTS = { SLOGANS: ["你今天动了吗？","活着，就是为了做动画","别让你的动画'死'在半路上","搬砖也要搬得有仪式感","你的动画搭子正在看着你","加班归加班，身体要紧","猝死是不可能猝死的","今天也是努力搬砖的一天呢","动画师永不言弃","活着真好","你还在做动画吗？","RuAlive：你的动画搭子","为了梦想，加油","休息一下，别累坏了","你的努力，我都记着呢","动画师，冲鸭！","活着，才有动画","别让梦想'死'在半路上","今天搬砖了吗？","动画师永不加班（才怪）"], TRIGGER_PROBABILITY: { DESKTOP: 0.2, MOBILE: 0.1 }, DISPLAY_DURATION: 2000, ANIMATION: { POP_IN_DURATION: 0.3, POP_OUT_DURATION: 0.3, POP_IN_EASE: 'back.out(1.7)', POP_OUT_EASE: 'power2.in' } };
    const Utils = { random: (min, max) => Math.random() * (max - min) + min, randomChoice: (array) => array[Math.floor(Math.random() * array.length)], isMobile: () => window.innerWidth < 768, isInteractiveElement: (element) => element.closest('button, a, .faq-question, input, select, textarea'), getBoundedPosition: (x, y, width, height) => { const margin = 20; const maxLeft = window.innerWidth - width - margin; const maxTop = window.innerHeight - height - margin; return { x: Math.min(Math.max(x - width / 2, margin), maxLeft), y: Math.min(Math.max(y - height - 20, margin), maxTop) }; } };
    class SloganManager { constructor() { this.slogans = CONSTANTS.SLOGANS; this.init(); } init() { document.addEventListener('click', this.handleClick.bind(this)); } handleClick(e) { if (Utils.isInteractiveElement(e.target)) return; const probability = Utils.isMobile() ? CONSTANTS.TRIGGER_PROBABILITY.MOBILE : CONSTANTS.TRIGGER_PROBABILITY.DESKTOP; if (Math.random() < probability) { const slogan = Utils.randomChoice(this.slogans); this.showSlogan(e.clientX, e.clientY, slogan); } } showSlogan(x, y, text) { const sloganEl = this.createSloganElement(text); document.body.appendChild(sloganEl); const position = Utils.getBoundedPosition(x, y, sloganEl.offsetWidth, sloganEl.offsetHeight); sloganEl.style.left = position.x + 'px'; sloganEl.style.top = position.y + 'px'; this.animateSlogan(sloganEl); } createSloganElement(text) { const el = document.createElement('div'); el.className = 'slogan-popup'; el.textContent = text; return el; } animateSlogan(element) { gsap.fromTo(element, { opacity: 0, scale: 0.5, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: CONSTANTS.ANIMATION.POP_IN_DURATION, ease: CONSTANTS.ANIMATION.POP_IN_EASE }); setTimeout(() => { gsap.to(element, { opacity: 0, scale: 0.8, y: -10, duration: CONSTANTS.ANIMATION.POP_OUT_DURATION, ease: CONSTANTS.ANIMATION.POP_OUT_EASE, onComplete: () => element.remove() }); }, CONSTANTS.DISPLAY_DURATION); } }
    class FAQManager { constructor() { this.init(); } init() { document.querySelectorAll('.faq-question').forEach(question => { question.addEventListener('click', this.handleClick.bind(this)); }); } handleClick(e) { const faqItem = e.target.closest('.faq-item'); const isActive = faqItem.classList.contains('active'); document.querySelectorAll('.faq-item').forEach(item => { item.classList.remove('active'); }); if (!isActive) faqItem.classList.add('active'); } }
    class SmoothScrollManager { constructor() { this.init(); } init() { document.querySelectorAll('a[href^="#"]').forEach(anchor => { anchor.addEventListener('click', this.handleClick.bind(this)); }); } handleClick(e) { e.preventDefault(); const target = document.querySelector(e.target.getAttribute('href')); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    class NavigationManager { constructor() { this.nav = document.querySelector('nav'); this.lastScroll = 0; this.init(); } init() { window.addEventListener('scroll', this.handleScroll.bind(this)); } handleScroll() { const currentScroll = window.pageYOffset; if (currentScroll > this.lastScroll && currentScroll > 100) this.nav.style.transform = 'translateY(-100%)'; else this.nav.style.transform = 'translateY(0)'; this.lastScroll = currentScroll; } }
    class AnimationManager { constructor() { this.init(); } init() { this.initGSAP(); this.initAOS(); } initGSAP() { gsap.registerPlugin(ScrollTrigger); this.animateHero(); this.animateFeatures(); this.animateTestimonials(); this.animateStats(); } animateHero() { gsap.fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }); gsap.fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power3.out' }); gsap.fromTo('.cta-button', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.6, ease: 'power3.out' }); } animateFeatures() { gsap.fromTo('.feature-card', { opacity: 0, y: 50 }, { opacity: 1, y: 0, scrollTrigger: { trigger: '#features', start: 'top 80%' }, duration: 0.8, stagger: 0.2, ease: 'power3.out' }); } animateTestimonials() { gsap.fromTo('.testimonial-card', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, scrollTrigger: { trigger: '#testimonials', start: 'top 80%' }, duration: 0.8, stagger: 0.2, ease: 'back.out' }); } animateStats() { gsap.fromTo('.stat-number', { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: '.py-20', start: 'top 80%' }, onStart: () => { document.querySelectorAll('.stat-number').forEach(el => { const text = el.textContent; const match = text.match(/[\\d,]+/); if (match) { const target = parseInt(match[0].replace(/,/g, '')); this.animateNumber(el, target, text); } }); } }); } animateNumber(element, target, originalText) { let start = 0; const increment = target / 50; function updateNumber() { start += increment; if (start < target) { const formatted = Math.floor(start).toLocaleString(); element.textContent = originalText.replace(/[\\d,]+/, formatted); requestAnimationFrame(updateNumber); } else { element.textContent = originalText.replace(/[\\d,]+/, target.toLocaleString()); } } updateNumber(); } initAOS() { AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 100 }); } }
    class LandingApp { constructor() { this.managers = []; this.init(); } init() { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this.setup()); else this.setup(); } setup() { this.managers.push(new SloganManager()); this.managers.push(new FAQManager()); this.managers.push(new SmoothScrollManager()); this.managers.push(new NavigationManager()); this.managers.push(new AnimationManager()); console.log('RuAlive Landing Page initialized'); } destroy() { this.managers.forEach(manager => { if (manager.destroy) manager.destroy(); }); } }
    const landingApp = new LandingApp();
  </script>
</body>
</html>`;

// Landing 页函数
async function getLandingHtml() {
  return LANDING_HTML;
}

export default {
  async fetch(request, env) {
    // 兼容不同binding名称
    const DB = env.DB || env.rualive;
    const KV = env.KV;
    const ASSETS = env.ASSETS;
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理静态文件（从 Assets 绑定）
    if (ASSETS) {
      try {
        const assetResponse = await ASSETS.fetch(request);
        if (assetResponse && assetResponse.status !== 404) {
          return assetResponse;
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
      return new Response(generateLoginPage(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    if (path === '/admin' || path === '/admin.html' || path === '/admin/') {
      // 直接返回管理仪表板HTML，让前端自己处理验证
      const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive 管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
    }
    .navbar {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
      transition: background 0.3s;
    }
    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
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
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #f5576c;
      margin-bottom: 0.5rem;
    }
    .stat-card p {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 12px;
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
      border-bottom: 2px solid #f5576c;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-admin {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-user {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-active {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-inactive {
      background: #fee2e2;
      color: #991b1b;
    }
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #f5576c;
      color: white;
    }
    .btn-primary:hover {
      background: #e04659;
    }
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    .btn-danger:hover {
      background: #dc2626;
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .form-group input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }
    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: none;
    }
    .alert.show {
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
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal.show {
      display: flex;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 500px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }
    .sensitive-info {
      font-family: 'Courier New', monospace;
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-content">
      <h1>🔐 RuAlive 管理后台</h1>
      <div class="user-info">
        <span id="userInfo">加载中...</span>
        <button class="logout-btn" onclick="handleLogout()">退出登录</button>
      </div>
    </div>
  </nav>

  <div class="main-container">
    <div id="alert" class="alert"></div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3 id="stat-users">0</h3>
        <p>用户总数</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-invites">0</h3>
        <p>邀请码总数</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-emails">0</h3>
        <p>已发送邮件</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-today">0</h3>
        <p>今日发送</p>
      </div>
    </div>

    <div class="content-grid">
      <div>
        <div class="card">
          <h2>🎫 邀请码管理</h2>
          <div class="form-group">
            <label>最大使用次数</label>
            <input type="number" id="maxUses" value="1" min="1">
          </div>
          <div class="form-group">
            <label>有效期（天）</label>
            <input type="number" id="expiresInDays" value="30" min="1">
          </div>
          <button class="btn btn-primary" onclick="createInviteCode()">创建邀请码</button>
        </div>

        <div class="card">
          <h2>📋 邀请码列表</h2>
          <div class="table-container">
            <table id="inviteCodesTable">
              <thead>
                <tr>
                  <th>邀请码</th>
                  <th>状态</th>
                  <th>使用情况</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="4" style="text-align: center; color: #6b7280;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h2>🔑 API密钥管理</h2>
          <div id="apiKeyStatus">
            <p style="color: #6b7280; margin-bottom: 1rem;">加载中...</p>
          </div>
          <div class="form-group">
            <label>新的API密钥</label>
            <div style="position: relative;">
              <input type="password" id="newApiKey" placeholder="re_xxxxxxxxxxxxxx" style="padding-right: 50px;">
              <button type="button" onclick="toggleApiKeyVisibility()" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 5px;">
                <span id="toggleIcon">👁️</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>测试邮件接收邮箱（可选，留空则发送到管理员邮箱）</label>
            <input type="email" id="testEmail" placeholder="test@example.com">
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" onclick="setApiKey()">更新密钥</button>
            <button class="btn btn-secondary" onclick="testApiKey()">测试密钥</button>
            <button class="btn btn-danger" onclick="deleteApiKey()">删除密钥</button>
          </div>
          <p style="font-size: 0.75rem; color: #6b7280; margin-top: 1rem;">
            <strong>提示：</strong>密钥更新后立即生效，无需重新部署。测试密钥时如未输入新密钥，将使用已保存的密钥进行测试。
          </p>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>👥 用户管理</h2>
          <div class="table-container">
            <table id="usersTable">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>注册时间</th>
                  <th>最后登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; color: #6b7280;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h2>📧 邮件发送日志</h2>
          <div class="table-container">
            <table id="logsTable">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>收件人类型</th>
                  <th>收件人邮箱</th>
                  <th>邮件类型</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="5" style="text-align: center; color: #6b7280;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="passwordModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔐 密码验证</h3>
        <button class="modal-close" onclick="closePasswordModal()">&times;</button>
      </div>
      <div class="form-group">
        <label>请输入管理员密码</label>
        <input type="password" id="adminPassword" placeholder="请输入密码">
      </div>
      <button class="btn btn-primary" onclick="verifyPassword()">验证</button>
      <button class="btn" onclick="closePasswordModal()">取消</button>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;
    let pendingAction = null;

    function showAlert(message, type = 'success') {
      const alert = document.getElementById('alert');
      const icon = type === 'success' ? '✅' : '❌';
      alert.className = 'alert alert-' + type + ' show';
      alert.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
      setTimeout(() => alert.classList.remove('show'), 4000);
    }

    function getAuthHeader() {
      const token = localStorage.getItem('token');
      return { 'Authorization': 'Bearer ' + token };
    }

    function maskEmail(email) {
      if (!email) return '-';
      const [name, domain] = email.split('@');
      if (name.length <= 2) return name[0] + '***@' + domain;
      return name.substring(0, 2) + '***@' + domain;
    }

    async function loadUserInfo() {
      try {
        const response = await fetch(API_BASE + '/api/auth/me', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success && data.user && data.user.role === 'admin') {
          document.getElementById('userInfo').textContent = data.user.username;
          loadStats();
          loadUsers();
          loadInviteCodes();
          loadLogs();
          loadApiKey();
        } else {
          window.location.href = '/admin/login';
        }
      } catch (error) {
        window.location.href = '/admin/login';
      }
    }

    async function loadStats() {
      try {
        const usersResponse = await fetch(API_BASE + '/api/admin/users', {
          headers: getAuthHeader()
        });
        const usersData = await usersResponse.json();

        const invitesResponse = await fetch(API_BASE + '/api/admin/invite-codes', {
          headers: getAuthHeader()
        });
        const invitesData = await invitesResponse.json();

        if (usersData.success) document.getElementById('stat-users').textContent = usersData.users.length;
        if (invitesData.success) document.getElementById('stat-invites').textContent = invitesData.codes.length;
      } catch (error) {
        console.error('加载统计失败:', error);
      }
    }

    async function loadUsers() {
      try {
        const response = await fetch(API_BASE + '/api/admin/users', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
          const tbody = document.querySelector('#usersTable tbody');
          tbody.innerHTML = data.users.map(user => \`
            <tr>
              <td>\${user.username}</td>
              <td><span class="sensitive-info">\${maskEmail(user.email)}</span></td>
              <td><span class="badge badge-\${user.role}">\${user.role === 'admin' ? '管理员' : '用户'}</span></td>
              <td>\${new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
              <td>\${user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '从未登录'}</td>
              <td><button class="btn btn-sm" onclick="showUserDetail('\${user.id}')">查看详情</button></td>
            </tr>
          \`).join('');
        }
      } catch (error) {
        console.error('加载用户失败:', error);
      }
    }

    async function loadInviteCodes() {
      try {
        const response = await fetch(API_BASE + '/api/admin/invite-codes', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
          const tbody = document.querySelector('#inviteCodesTable tbody');
          tbody.innerHTML = data.codes.map(code => \`
            <tr>
              <td><span class="sensitive-info">\${code.code}</span></td>
              <td><span class="badge badge-\${code.is_active ? 'active' : 'inactive'}">\${code.is_active ? '有效' : '已失效'}</span></td>
              <td>\${code.used_count}/\${code.max_uses}</td>
              <td>\${code.is_active ? \`<button class="btn btn-sm btn-danger" onclick="deleteInviteCode('\${code.id}')">删除</button>\` : '-'}</td>
            </tr>
          \`).join('');
        }
      } catch (error) {
        console.error('加载邀请码失败:', error);
      }
    }

    async function loadApiKey() {
      try {
        const response = await fetch(API_BASE + '/api/admin/api-key', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        const statusDiv = document.getElementById('apiKeyStatus');
        const inputField = document.getElementById('newApiKey');

        if (data.success) {
          if (data.isSet) {
            // 将已保存的密钥填充到输入框
            inputField.value = data.apiKey;
            statusDiv.innerHTML = \`
              <p style="color: #10b981; margin-bottom: 1rem;">✅ API密钥已设置</p>
              <p style="font-size: 0.875rem; color: #6b7280;">当前密钥: <span class="sensitive-info">\${data.apiKey}</span></p>
            \`;
          } else {
            inputField.value = '';
            statusDiv.innerHTML = \`
              <p style="color: #ef4444; margin-bottom: 1rem;">⚠️ API密钥未设置</p>
              <p style="font-size: 0.875rem; color: #6b7280;">请设置Resend API密钥以启用邮件发送功能</p>
            \`;
          }
        } else {
          statusDiv.innerHTML = \`<p style="color: #ef4444; margin-bottom: 1rem;">加载失败: \${data.error}</p>\`;
        }
      } catch (error) {
        document.getElementById('apiKeyStatus').innerHTML = \`<p style="color: #ef4444; margin-bottom: 1rem;">加载失败: \${error.message}</p>\`;
      }
    }

    function toggleApiKeyVisibility() {
      const input = document.getElementById('newApiKey');
      const icon = document.getElementById('toggleIcon');
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
      } else {
        input.type = 'password';
        icon.textContent = '👁️';
      }
    }

    async function setApiKey() {
      const apiKey = document.getElementById('newApiKey').value.trim();
      if (!apiKey) {
        showAlert('请输入API密钥', 'error');
        return;
      }

      try {
        const response = await fetch(API_BASE + '/api/admin/api-key', {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
        const data = await response.json();

        if (data.success) {
          showAlert('API密钥验证成功！请按照以下命令更新：');
          alert(\`请复制以下命令并在Worker目录中运行：\n\n\${data.message}\n\n然后运行: wrangler deploy\`);
          document.getElementById('newApiKey').value = '';
        } else {
          showAlert('设置失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('设置失败: ' + error.message, 'error');
      }
    }

    async function testApiKey() {
      let apiKey = document.getElementById('newApiKey').value.trim();
      const testEmail = document.getElementById('testEmail').value.trim();

      // 如果未输入新密钥，使用已保存的密钥
      if (!apiKey) {
        try {
          const response = await fetch(API_BASE + '/api/admin/api-key', {
            headers: getAuthHeader()
          });
          const data = await response.json();
          if (data.success && data.apiKey) {
            apiKey = data.apiKey;
          } else {
            showAlert('未找到已保存的API密钥，请输入新密钥进行测试', 'error');
            return;
          }
        } catch (error) {
          showAlert('获取已保存的密钥失败: ' + error.message, 'error');
          return;
        }
      }

      try {
        const response = await fetch(API_BASE + '/api/admin/api-key/test', {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, testEmail })
        });
        const data = await response.json();

        if (data.success) {
          const recipient = testEmail || '管理员邮箱';
          showAlert(data.message);
        } else {
          showAlert('测试失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('测试失败: ' + error.message, 'error');
      }
    }

    async function deleteApiKey() {
      if (!confirm('确定要删除API密钥吗？删除后将无法发送邮件。')) {
        return;
      }

      try {
        const response = await fetch(API_BASE + '/api/admin/api-key', {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
          showAlert('请按照以下命令删除API密钥：');
          alert(\`请复制以下命令并在Worker目录中运行：\n\n\${data.message}\n\n然后运行: wrangler deploy\`);
          loadApiKey();
        } else {
          showAlert('删除失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('删除失败: ' + error.message, 'error');
      }
    }

    async function loadLogs() {
      try {
        const response = await fetch(API_BASE + '/api/logs?limit=20', {
          headers: getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
          const tbody = document.querySelector('#logsTable tbody');
          tbody.innerHTML = data.data.map(log => \`
            <tr>
              <td>\${new Date(log.sent_at).toLocaleString('zh-CN')}</td>
              <td>\${log.recipient_type === 'user' ? '用户' : '紧急联系人'}</td>
              <td><span class="sensitive-info">\${maskEmail(log.recipient_email)}</span></td>
              <td>\${log.email_type === 'summary' ? '总结' : '警告'}</td>
              <td><span class="badge badge-\${log.status === 'success' ? 'active' : 'inactive'}">\${log.status === 'success' ? '成功' : '失败'}</span></td>
            </tr>
          \`).join('');
        }
      } catch (error) {
        console.error('加载日志失败:', error);
      }
    }

    async function createInviteCode() {
      const maxUses = parseInt(document.getElementById('maxUses').value);
      const expiresInDays = parseInt(document.getElementById('expiresInDays').value);

      try {
        const response = await fetch(API_BASE + '/api/admin/invite-codes', {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxUses, expiresInDays })
        });
        const data = await response.json();

        if (data.success) {
          showAlert('邀请码创建成功: ' + data.code);
          loadInviteCodes();
          loadStats();
        } else {
          showAlert('创建失败: ' + data.error, 'error');
        }
      } catch (error) {
        showAlert('创建失败: ' + error.message, 'error');
      }
    }

    function deleteInviteCode(codeId) {
      pendingAction = async () => {
        try {
          const response = await fetch(API_BASE + '/api/admin/invite-codes?id=' + codeId, {
            method: 'DELETE',
            headers: getAuthHeader()
          });
          const data = await response.json();

          if (data.success) {
            showAlert('邀请码已删除');
            loadInviteCodes();
            loadStats();
          } else {
            showAlert('删除失败: ' + data.error, 'error');
          }
        } catch (error) {
          showAlert('删除失败: ' + error.message, 'error');
        }
      };
      document.getElementById('passwordModal').classList.add('show');
    }

    function showUserDetail(userId) {
      pendingAction = async () => {
        try {
          const usersResponse = await fetch(API_BASE + '/api/admin/users', {
            headers: getAuthHeader()
          });
          const usersData = await usersResponse.json();

          if (usersData.success) {
            const user = usersData.users.find(u => u.id === userId);
            if (user) {
              alert('用户详情:\\n\\n用户名: ' + user.username + '\\n邮箱: ' + user.email + '\\n角色: ' + user.role + '\\n注册时间: ' + new Date(user.created_at).toLocaleString('zh-CN') + '\\n最后登录: ' + (user.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '从未登录'));
            }
          }
        } catch (error) {
          showAlert('获取用户详情失败: ' + error.message, 'error');
        }
      };
      document.getElementById('passwordModal').classList.add('show');
    }

    function verifyPassword() {
      if (pendingAction) {
        pendingAction();
        pendingAction = null;
      }
      closePasswordModal();
    }

    function closePasswordModal() {
      document.getElementById('passwordModal').classList.remove('show');
      document.getElementById('adminPassword').value = '';
      pendingAction = null;
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

    window.onload = loadUserInfo;
  </script>
</body>
</html>`;
      return new Response(adminHtml, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    if (path === '/user' || path === '/user.html') {
      try {
        const dashboardHtml = await KV.get('user-dashboard-inline');
        if (dashboardHtml) {
          return new Response(dashboardHtml, {
            headers: { 'Content-Type': 'text/html;charset=UTF-8' }
          });
        } else {
          return new Response(generateUserDashboard(), {
            headers: { 'Content-Type': 'text/html;charset=UTF-8' }
          });
        }
      } catch (error) {
        return new Response(generateUserDashboard(), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }

    // 添加管理员登录页面路由
    if (path === '/admin/login') {
      return new Response(generateAdminLoginPage(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
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

    if (path === '/api/auth/init' && request.method === 'POST') {
      return handleInitAdmin(request, env);
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

    if (path === '/api/work-logs' && request.method === 'GET') {
      return handleGetWorkLogs(request, env);
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
  const today = new Date().toISOString().split('T')[0];
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

  console.log(`User ${userId} - currentTime: ${currentTime}, currentDay: ${currentDayOfWeek}, timezone: ${userTimezone}`);

  // 检查是否应该发送紧急联系人通知
  let shouldSendEmergency = false;
  if (config.enable_emergency_notification && config.emergency_email) {
    // 检查发送规则
    const schedule = config.notification_schedule || 'all';
    let shouldSendBySchedule = true;
    
    if (schedule === 'weekdays') {
      // 仅工作日（周一至周五）
      shouldSendBySchedule = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
    } else if (schedule === 'custom') {
      // 自定义规则
      try {
        const excludedDays = JSON.parse(config.notification_excluded_days || '[]');
        shouldSendBySchedule = !excludedDays.includes(String(currentDayOfWeek));
      } catch (e) {
        console.error('Failed to parse excluded days:', e);
        shouldSendBySchedule = true;
      }
    }
    
    shouldSendEmergency = shouldSendBySchedule;
  }

  // 检查是否到了用户通知时间
  const userNotificationTime = config.user_notification_time || '22:00';
  const isUserNotificationTime = currentTime === userNotificationTime;

  // 检查是否到了紧急联系人通知时间
  const emergencyNotificationTime = config.emergency_notification_time || '22:00';
  const isEmergencyNotificationTime = currentTime === emergencyNotificationTime;

  console.log(`User ${userId} - userTime: ${userNotificationTime}, emergencyTime: ${emergencyNotificationTime}, shouldSendEmergency: ${shouldSendEmergency}`);

  // 获取当天工作数据
  const workData = await getWorkData(userId, today, env);

  // 检测工作状态
  const hasWork = workData !== null;
  const isSufficient = hasWork && checkWorkSufficient(workData, config.thresholds);

  console.log(`User ${userId} - hasWork: ${hasWork}, isSufficient: ${isSufficient}`);

  // 根据时间和工作状态发送邮件
  if (isUserNotificationTime && hasWork && isSufficient) {
    // 到了用户通知时间且工作充足，发送总结给用户
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
    const passwordHash = await authModule.hashPassword('admin123');
    
    await DB.prepare(
      'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(adminId, 'admin@rualive.com', '管理员', passwordHash, 'admin').run();
    
    // 创建初始邀请码
    const codeId = authModule.generateUserId();
    const code = authModule.generateInviteCode();
    
    await DB.prepare(
      'INSERT INTO invite_codes (id, code, created_by, max_uses) VALUES (?, ?, ?, ?)'
    ).bind(codeId, code, adminId, 10).run();
    
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
    const passwordHash = await authModule.hashPassword(password);
    
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
    
    if (!email || !password) {
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }
    
    const user = await DB.prepare(
      'SELECT id, email, username, password_hash, role FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return Response.json({ success: false, error: '邮箱或密码错误' }, { status: 401 });
    }
    
    const isValid = await authModule.verifyPassword(password, user.password_hash);
    if (!isValid) {
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
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const authHeader = request.headers.get('Authorization');
    const token = authHeader.substring(7);
    
    // 检查会话是否存在
    const session = await DB.prepare(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();
    
    if (!session) {
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
          min_work_hours: 2,
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

// 创建邀请码（仅管理员）
async function handleCreateInviteCode(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
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
    ).bind(codeId, code, payload.userId, maxUses, expiresAt).run();
    
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
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
    }
    
    const codes = await DB.prepare(
      'SELECT ic.*, u.username as created_by_name FROM invite_codes ic LEFT JOIN users u ON ic.created_by = u.id ORDER BY ic.created_at DESC'
    ).all();
    
    return Response.json({
      success: true,
      codes: codes.results
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 删除邀请码（仅管理员）
async function handleDeleteInviteCode(request, env) {
  const DB = env.DB || env.rualive;
  
  try {
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
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
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
    }
    
    const users = await DB.prepare(
      'SELECT id, email, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
    ).all();
    
    return Response.json({
      success: true,
      users: users.results
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
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
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
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
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
    const payload = await verifyAuth(request, env);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, error: '权限不足' }, { status: 403 });
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
          from: env.FROM_EMAIL,
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
  try {
    console.log('[handleWorkData] 开始处理工作数据上传请求');
    const body = await request.json();
    console.log('[handleWorkData] 请求体:', body);
    const { userId, workData, workDate } = body;

    if (!userId || !workData) {
      console.log('[handleWorkData] 缺少参数: userId=', userId, ', workData=', workData);
      return Response.json({ error: 'Missing userId or workData' }, { status: 400 });
    }

    // 使用传入的日期，如果没有则使用当天日期
    const date = workDate || new Date().toISOString().split('T')[0];
    console.log('[handleWorkData] 准备保存数据: userId=', userId, ', date=', date, ', workData=', workData);
    
    await saveWorkData(userId, workData, env, date);
    console.log('[handleWorkData] 数据保存成功');
    return Response.json({ success: true });
  } catch (error) {
    console.log('[handleWorkData] 发生错误:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleHeartbeat(request, env) {
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const DB = env.DB || env.rualive;

    // 更新用户最后在线时间
    const now = new Date().toISOString();
    await DB.prepare(`
      UPDATE users SET last_online = ? WHERE id = ?
    `).bind(now, userId).run();

    // 同时更新 AE 在线状态
    await DB.prepare(`
      INSERT OR REPLACE INTO ae_status (user_id, is_online, last_heartbeat, updated_at)
      VALUES (?, 1, ?, ?)
    `).bind(userId, now, now).run();

    return Response.json({ success: true, timestamp: now });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 获取 AE 在线状态
async function handleGetAEStatus(request, env) {
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
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
      isOnline: isOnline,
      lastHeartbeat: lastHeartbeatTime,
      projectName: status?.project_name || null,
      compositionName: status?.composition_name || null,
      lastWorkData: status?.last_work_data ? JSON.parse(status.last_work_data) : null,
      hasStatusRecord: !!status
    });
  } catch (error) {
    console.error('Get AE status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 更新 AE 在线状态
async function handleUpdateAEStatus(request, env) {
  try {
    const payload = await verifyAuth(request, env);
    if (!payload) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    const userId = payload.userId;
    const body = await request.json();
    const {
      isOnline,
      projectName,
      compositionName,
      workData
    } = body;

    const DB = env.DB || env.rualive;
    const now = new Date().toISOString();

    // 更新 AE 在线状态
    await DB.prepare(`
      INSERT OR REPLACE INTO ae_status 
      (user_id, is_online, last_heartbeat, project_name, composition_name, last_work_data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      isOnline ? 1 : 0,
      now,
      projectName || null,
      compositionName || null,
      workData ? JSON.stringify(workData) : null,
      now
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

    // 获取请求体中的收件人选择
    const body = await request.json();
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

    if (recipient === 'emergency') {
      // 发送给紧急联系人
      if (!config.emergency_email) {
        return Response.json({
          error: '未配置紧急联系人邮箱'
        }, { status: 400 });
      }
      await sendWarningEmail(user, workData, config, env);
    } else {
      // 发送给用户
      await sendDailySummary(user, workData, config, env);
    }

    // 记录测试日志
    const testEmail = recipient === 'emergency' ? config.emergency_email : user.email;
    await DB.prepare(
      'INSERT INTO test_email_logs (user_id, test_email, test_date) VALUES (?, ?, ?)'
    ).bind(userId, testEmail, today).run();

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

    const userId = payload.userId;
    const logs = await getSendLogs(userId, limit, env);
    return Response.json({ success: true, data: logs });
  } catch (error) {
    console.error('handleGetLogs error:', error);
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
      enable_emergency_notification: result.enable_emergency_notification === 1,
      notification_schedule: result.notification_schedule || 'all',
      notification_excluded_days: result.notification_excluded_days || '[]',
      thresholds: {
        minWorkHours: result.min_work_hours || 2,
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
        enable_emergency_notification, notification_schedule, notification_excluded_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      config.min_work_hours || 2,
      config.min_keyframes || 50,
      config.min_json_size || 10,
      config.user_notification_time || '22:00',
      config.emergency_notification_time || '22:00',
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
    workData.projects.forEach(project => {
      // 过滤空项目（没有名称的项目）
      if (!project.name || project.name.trim() === '') {
        return;
      }

      // 项目列表
      allProjects.push({
        name: project.name,
        path: project.path || '',
        compositions: project.statistics ? project.statistics.compositions || 0 : 0,
        layers: project.statistics ? project.statistics.layers || 0 : 0,
        keyframes: project.statistics ? project.statistics.keyframes || 0 : 0,
        effects: project.statistics ? project.statistics.effects || 0 : 0
      });

      // 工作时长列表
      if (project.accumulatedRuntime && project.accumulatedRuntime > 0) {
        allWorkHours.push({
          project: project.name,
          hours: (project.accumulatedRuntime / 3600).toFixed(2)
        });
      }

      // 合成列表
      if (project.statistics && project.statistics.compositions) {
        allCompositions.push({
          project: project.name,
          count: project.statistics.compositions
        });
      }

      // 效果列表 - 扩展发送的是对象数组 [{effectName: "Gaussian Blur", ...}]
      if (project.details && project.details.effects) {
        if (Array.isArray(project.details.effects)) {
          // 对象数组格式
          project.details.effects.forEach(effect => {
            if (effect && effect.effectName) {
              allEffects.push({
                project: project.name,
                name: effect.effectName
              });
            }
          });
        } else if (typeof project.details.effects === 'string') {
          // 字符串格式（兼容旧数据）
          allEffects.push({
            project: project.name,
            name: project.details.effects
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
                name: layerName
              });
            }
          });
        }
      }

      // 关键帧列表 - 扩展发送的是对象数组 [{layerName: "Layer1", keyframeCount: 5}, ...]
      if (project.details && project.details.keyframes) {
        if (Array.isArray(project.details.keyframes)) {
          // 对象数组格式（扩展发送的格式）
          project.details.keyframes.forEach(kf => {
            if (kf && kf.layerName && kf.keyframeCount) {
              allKeyframes.push({
                project: project.name,
                layer: kf.layerName,
                count: kf.keyframeCount
              });
            }
          });
        } else if (typeof project.details.keyframes === 'object' && !Array.isArray(project.details.keyframes)) {
          // 对象格式（兼容旧数据）
          Object.keys(project.details.keyframes).forEach(layerName => {
            allKeyframes.push({
              project: project.name,
              layer: layerName,
              count: project.details.keyframes[layerName]
            });
          });
        }
      }
    });

    compositionsJson = allCompositions.length > 0 ? JSON.stringify(allCompositions) : null;
    effectsJson = allEffects.length > 0 ? JSON.stringify(allEffects) : null;
    layersJson = allLayers.length > 0 ? JSON.stringify(allLayers) : null;
    keyframesJson = allKeyframes.length > 0 ? JSON.stringify(allKeyframes) : null;
    projectsJson = allProjects.length > 0 ? JSON.stringify(allProjects) : null;
    workHoursJson = allWorkHours.length > 0 ? JSON.stringify(allWorkHours) : null;
  }

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
      workData.work_hours || 0,
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
    return result.results || [];
  } catch (error) {
    console.error('Error in getSendLogs:', error);
    return [];
  }
}

async function logSend(userId, recipientType, recipientEmail, emailType, status, errorMessage, env) {
  const DB = env.DB || env.rualive;
  
  if (!DB) {
    console.error('Database not available in logSend');
    return;
  }
  
  try {
    await DB.prepare(`
      INSERT INTO email_logs (user_id, recipient_type, recipient_email, email_type, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, recipientType, recipientEmail, emailType, status, errorMessage).run();
  } catch (error) {
    console.error('Error in logSend:', error);
  }
}

// ==================== 邮件发送 ====================

async function sendDailySummary(user, workData, config, env) {
  const html = generateDailySummaryEmail(user, workData, config);
  const date = new Date().toLocaleDateString('zh-CN');
  const subject = `[RuAlive] ${date} 工作总结报告`;

  // 使用用户的邮箱
  const email = user.email;
  try {
    await sendEmail(email, subject, html, env);
    await logSend(user.id, 'user', email, 'summary', 'success', null, env);
    console.log(`Daily summary sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send to ${email}:`, error);
    await logSend(user.id, 'user', email, 'summary', 'failed', error.message, env);
  }
}

async function sendWarningEmail(user, workData, config, env) {
  const html = generateWarningEmail(user, workData, config);
  const subject = `[紧急提醒] ${user.username} 今天工作量不足！`;

  // 使用紧急联系人邮箱
  if (config.emergency_email) {
    try {
      await sendEmail(config.emergency_email, subject, html, env);
      await logSend(user.id, 'emergency', config.emergency_email, 'warning', 'success', null, env);
      console.log(`Warning sent to ${config.emergency_email}`);
    } catch (error) {
      console.error(`Failed to send to ${config.emergency_email}:`, error);
      await logSend(user.id, 'emergency', config.emergency_email, 'warning', 'failed', error.message, env);
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
      from: env.FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
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
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/user';
          }
        } else {
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
      const token = localStorage.getItem('token');
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

function generateAdminLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuAlive - 管理员登录</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
      color: #f5576c;
      margin-bottom: 8px;
    }
    .logo p {
      color: #6b7280;
      font-size: 14px;
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
      border-color: #f5576c;
      box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
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
      background: #f5576c;
      color: white;
    }
    .btn:hover {
      background: #e04659;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
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
      color: #f5576c;
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
      <h1>🔐 管理员登录</h1>
      <p>RuAlive 管理后台</p>
    </div>

    <div id="alert" class="alert"></div>

    <div class="form-group">
      <label>管理员邮箱</label>
      <input type="email" id="adminEmail" placeholder="admin@rualive.com">
    </div>
    <div class="form-group">
      <label>密码</label>
      <input type="password" id="adminPassword" placeholder="请输入管理员密码">
    </div>
    <button class="btn" id="loginBtn" onclick="handleLogin()">登录</button>

    <div class="footer">
      <a href="/">返回用户登录</a>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;

    function showAlert(message, type = 'error') {
      const alert = document.getElementById('alert');
      alert.className = 'alert alert-' + type + ' show';
      alert.textContent = message;
      setTimeout(() => alert.classList.remove('show'), 4000);
    }

    async function handleLogin() {
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
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
          if (data.user.role !== 'admin') {
            showAlert('此账户不是管理员账户');
            btn.disabled = false;
            btn.textContent = '登录';
            return;
          }

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/admin';
        } else {
          showAlert(data.error || '登录失败');
        }
      } catch (error) {
        showAlert('登录失败: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '登录';
      }
    }

    // 检查是否已登录
    window.onload = function() {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(API_BASE + '/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user && data.user.role === 'admin') {
            window.location.href = '/admin';
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
      const token = localStorage.getItem('token');
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
          document.getElementById('minHours').value = config.min_work_hours || 2;
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

function generateDailySummaryEmail(user, workData, config) {
  const date = new Date().toLocaleDateString('zh-CN');
  const hours = workData?.work_hours || 0;
  const hoursText = `${Math.floor(hours)}小时${Math.round((hours % 1) * 60)}分钟`;

  return `
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
      background-color: #f3f4f6;
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
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    .greeting {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .greeting strong {
      color: #1f2937;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .stat-item {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: transform 0.2s;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 4px;
    }
    .stat-label {
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .motivation {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      color: #065f46;
      font-size: 14px;
      font-weight: 500;
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
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
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
      <h1>📊 工作总结报告</h1>
      <p>${date}</p>
      <span class="badge">每日报告</span>
    </div>
    <div class="content">
      <p class="greeting">尊敬的 <strong>${user.username}</strong>，</p>
      <p style="color: #4b5563;">以下是您今天的工作统计数据：</p>
      
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">${hoursText}</div>
          <div class="stat-label">⏱️ 工作时长</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${workData?.project_count || 0}</div>
          <div class="stat-label">📁 打开项目</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${workData?.composition_count || 0}</div>
          <div class="stat-label">🎬 合成数量</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${workData?.keyframe_count || 0}</div>
          <div class="stat-label">🎞️ 关键帧数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${workData?.layer_count || 0}</div>
          <div class="stat-label">📑 总层数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${workData?.effect_count || 0}</div>
          <div class="stat-label">✨ 特效数</div>
        </div>
      </div>

      <div class="motivation">
        💪 继续保持，明天会更好！
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>📧 此邮件由 RuAlive 自动发送</p>
        <p>如需修改设置，请联系管理员</p>
        <p style="margin-top: 8px;">© ${new Date().getFullYear()} RuAlive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateWarningEmail(user, workData, config) {
  const date = new Date().toLocaleDateString('zh-CN');
  const hasWork = workData !== null;
  const thresholds = config.thresholds || {};

  return `
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
      background-color: #fef2f2;
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
      border: 2px solid #fecaca;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
    .greeting {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .alert-box {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #fecaca;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .alert-icon {
      font-size: 32px;
    }
    .alert-title {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
    }
    .alert-info {
      font-size: 14px;
      color: #4b5563;
      line-height: 2;
    }
    .alert-info strong {
      color: #1f2937;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .stat-item {
      background: #fef2f2;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #fecaca;
    }
    .stat-label {
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .stat-value.below-threshold {
      color: #dc2626;
    }
    .stat-threshold {
      display: block;
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .action-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fcd34d;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
    }
    .action-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
      font-weight: 500;
    }
    .footer {
      background: #fef2f2;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #fecaca;
    }
    .footer p {
      margin: 4px 0;
      color: #9ca3af;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #fecaca;
      color: #dc2626;
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
      <h1>⚠️ 紧急提醒</h1>
      <p>${date}</p>
      <span class="badge">工作异常警报</span>
    </div>
    <div class="content">
      <p class="greeting">尊敬的联系人，</p>
      
      <div class="alert-box">
        <div class="alert-header">
          <span class="alert-icon">🚨</span>
          <span class="alert-title">警告信息</span>
        </div>
        <div class="alert-info">
          <strong>用户：</strong>${user.username}<br>
          <strong>日期：</strong>${date}<br>
          <strong>状态：</strong>${hasWork ? '⚠️ 工作量不足' : '❌ 未工作'}
        </div>
      </div>

      ${hasWork ? `
      <h3 style="margin: 24px 0 16px 0; color: #1f2937; font-size: 18px;">📊 今日工作统计</h3>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">⏱️ 工作时长</div>
          <div class="stat-value ${workData.work_hours < thresholds.minWorkHours ? 'below-threshold' : ''}">
            ${Math.floor(workData.work_hours)}小时${Math.round((workData.work_hours % 1) * 60)}分钟
          </div>
          <span class="stat-threshold">阈值: ${thresholds.minWorkHours}小时</span>
        </div>
      </div>
      ` : `
      <div style="background: #fef2f2; padding: 20px; border-radius: 10px; border: 1px solid #fecaca; margin: 24px 0;">
        <p style="margin: 0; color: #dc2626; font-weight: 600; font-size: 16px;">❌ 用户今天未打开After Effects进行工作</p>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">最后工作日：${workData?.last_work_date || '未知'}</p>
      </div>
      `}

      <div class="action-box">
        <p>💡 建议您联系用户了解情况，确认是否需要帮助</p>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>📧 此邮件由 RuAlive 自动发送</p>
        <p>紧急联系人监督系统</p>
        <p style="margin-top: 8px;">© ${new Date().getFullYear()} RuAlive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}