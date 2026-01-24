# AEAlive Landing Page 技术路线文档

## 🛠️ 技术栈选择

### 核心技术
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑

### UI 框架
- **Tailwind CSS (CDN)** - 快速构建现代化 UI
  - 版本: 3.4.0+
  - 优势: 无需构建、实用优先、响应式友好

### 动画库
- **GSAP (GreenSock Animation Platform)**
  - 版本: 3.12.2+
  - 用途: 专业级动画、时间轴控制
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`

- **ScrollTrigger**
  - 版本: 3.12.2+
  - 用途: 滚动触发动画
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js`

- **AOS (Animate On Scroll)**
  - 版本: 2.3.1+
  - 用途: 滚动动画库
  - CDN:
    - CSS: `https://unpkg.com/aos@2.3.1/dist/aos.css`
    - JS: `https://unpkg.com/aos@2.3.1/dist/aos.js`

### 图标库
- **Font Awesome**
  - 版本: 6.4.0+
  - 用途: 图标
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

### 字体
- **Google Fonts - Inter**
  - 用途: 主要字体
  - CDN: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`

---

## 📦 CDN 资源清单

```html
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
```

---

## 🏗️ 项目结构

```
rualive-email-worker/
├── src/
│   ├── index.js              # Worker 主文件
│   ├── landing.html          # Landing 页 HTML 结构
│   ├── landing.js            # Landing 页独立 JS（与 main.js 解耦）
│   └── main.js               # Worker 核心逻辑（不影响 landing 页）
├── docs/
│   ├── landing-page-content-plan.md    # 内容规划
│   └── landing-page-tech-plan.md       # 技术路线（本文件）
└── wrangler.toml           # Cloudflare 配置
```

---

## 🏗️ 架构设计

### 解耦原则
- **landing.js** - 仅负责 landing 页的交互逻辑
- **main.js** - Worker 核心业务逻辑（API、数据处理等）
- 两者完全独立，互不影响

### landing.js 职责
1. 页面初始化
2. 动画效果（GSAP、AOS）
3. 交互功能（FAQ、平滑滚动、Slogan 等）
4. 响应式适配
5. SEO 相关逻辑

### main.js 职责
1. Worker 路由处理
2. API 端点实现
3. 数据库操作
4. 邮件发送
5. 认证逻辑

### 加载方式
在 `landing.html` 中引入：
```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 动画库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

<!-- 图标库 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- 字体 -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Landing 页独立 JS -->
<script src="/landing.js"></script>
```

### Worker 路由处理
在 `index.js` 中：
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Landing 页路由
    if (url.pathname === '/' || url.pathname === '/landing') {
      const html = await getLandingHtml();
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Landing JS 路由
    if (url.pathname === '/landing.js') {
      const js = await getLandingJs();
      return new Response(js, {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    // 其他路由...（API、登录等）
  }
}
```

---

## 🎨 样式系统

### Tailwind 配置

```javascript
// 在 HTML 中配置 Tailwind
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#ff6b35',
            light: '#ff8c42',
            dark: '#e55a2b',
          },
          secondary: '#2d2d2d',
          accent: '#ff6b35',
          dark: {
            DEFAULT: '#1a1a1a',
            card: 'rgba(45, 45, 45, 0.9)',
          },
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        borderRadius: {
          'card': '16px',
          'button': '8px',
        },
        boxShadow: {
          'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  }
</script>
```

### 自定义 CSS

```css
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  min-height: 100vh;
  color: #ffffff;
  overflow-x: hidden;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #ff6b35;
  border-radius: 4px;
}

/* 工具类 */
.glass-effect {
  background: rgba(45, 45, 45, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gradient-text {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 🎬 动画实现方案

### 1. 页面加载动画（GSAP）

```javascript
// Hero Section 动画
gsap.from('.hero-title', {
  opacity: 0,
  y: 50,
  duration: 1,
  ease: 'power3.out'
});

gsap.from('.hero-subtitle', {
  opacity: 0,
  y: 30,
  duration: 1,
  delay: 0.3,
  ease: 'power3.out'
});

gsap.from('.cta-button', {
  opacity: 0,
  y: 20,
  duration: 0.8,
  stagger: 0.2,
  delay: 0.6,
  ease: 'power3.out'
});
```

### 2. 滚动动画（ScrollTrigger）

```javascript
// 注册 ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Features Section 动画
gsap.from('.feature-card', {
  scrollTrigger: {
    trigger: '.features-section',
    start: 'top 80%',
  },
  opacity: 0,
  y: 50,
  duration: 0.8,
  stagger: 0.2,
  ease: 'power3.out'
});

// Testimonials 动画
gsap.from('.testimonial-card', {
  scrollTrigger: {
    trigger: '.testimonials-section',
    start: 'top 80%',
  },
  opacity: 0,
  scale: 0.9,
  duration: 0.8,
  stagger: 0.2,
  ease: 'back.out'
});
```

### 3. 数字计数动画

```javascript
function animateNumber(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  
  function updateNumber() {
    start += increment;
    if (start < target) {
      element.textContent = Math.floor(start).toLocaleString();
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = target.toLocaleString();
    }
  }
  
  updateNumber();
}

// 使用示例
gsap.from('.stat-number', {
  scrollTrigger: {
    trigger: '.social-proof',
    start: 'top 80%',
  },
  onStart: function() {
    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseInt(el.textContent.replace(/[^0-9]/g, ''));
      animateNumber(el, target);
    });
  }
});
```

### 4. AOS 滚动动画

```javascript
// 初始化 AOS
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100,
});

// HTML 中使用
<div data-aos="fade-up">内容</div>
<div data-aos="fade-left">内容</div>
<div data-aos="zoom-in">内容</div>
```

---

## 💻 landing.js 代码结构

### 文件结构

```javascript
/**
 * RuAlive Landing Page
 * 独立的 landing 页交互逻辑
 * 与 main.js 完全解耦
 */

// ==================== 常量定义 ====================
const CONSTANTS = {
  // Slogan 列表
  SLOGANS: [
    "你今天动了吗？",
    "活着，就是为了做动画",
    "别让你的动画'死'在半路上",
    // ... 更多 slogan
  ],
  
  // 触发概率
  TRIGGER_PROBABILITY: {
    DESKTOP: 0.2,  // 20%
    MOBILE: 0.1    // 10%
  },
  
  // 显示时长
  DISPLAY_DURATION: 2000,
  
  // 动画配置
  ANIMATION: {
    POP_IN_DURATION: 0.3,
    POP_OUT_DURATION: 0.3,
    POP_IN_EASE: 'back.out(1.7)',
    POP_OUT_EASE: 'power2.in'
  }
};

// ==================== 工具函数 ====================
const Utils = {
  /**
   * 生成随机数
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  /**
   * 从数组中随机选择一个元素
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  /**
   * 检查是否是移动端
   */
  isMobile() {
    return window.innerWidth < 768;
  },
  
  /**
   * 检查元素是否是交互元素
   */
  isInteractiveElement(element) {
    return element.closest('button, a, .faq-question, input, select, textarea');
  },
  
  /**
   * 获取边界内的位置
   */
  getBoundedPosition(x, y, width, height) {
    const margin = 20;
    const maxLeft = window.innerWidth - width - margin;
    const maxTop = window.innerHeight - height - margin;
    
    return {
      x: Math.min(Math.max(x - width / 2, margin), maxLeft),
      y: Math.min(Math.max(y - height - 20, margin), maxTop)
    };
  }
};

// ==================== Slogan 管理器 ====================
class SloganManager {
  constructor() {
    this.slogans = CONSTANTS.SLOGANS;
    this.init();
  }
  
  init() {
    document.addEventListener('click', this.handleClick.bind(this));
  }
  
  handleClick(e) {
    // 检查是否应该触发
    if (Utils.isInteractiveElement(e.target)) {
      return;
    }
    
    // 根据设备类型决定触发概率
    const probability = Utils.isMobile() 
      ? CONSTANTS.TRIGGER_PROBABILITY.MOBILE 
      : CONSTANTS.TRIGGER_PROBABILITY.DESKTOP;
    
    if (Math.random() < probability) {
      const slogan = Utils.randomChoice(this.slogans);
      this.showSlogan(e.clientX, e.clientY, slogan);
    }
  }
  
  showSlogan(x, y, text) {
    const sloganEl = this.createSloganElement(text);
    const position = Utils.getBoundedPosition(x, y, sloganEl.offsetWidth, sloganEl.offsetHeight);
    
    sloganEl.style.left = position.x + 'px';
    sloganEl.style.top = position.y + 'px';
    
    document.body.appendChild(sloganEl);
    this.animateSlogan(sloganEl);
  }
  
  createSloganElement(text) {
    const el = document.createElement('div');
    el.className = 'slogan-popup';
    el.textContent = text;
    return el;
  }
  
  animateSlogan(element) {
    // 弹入动画
    gsap.fromTo(element,
      {
        opacity: 0,
        scale: 0.5,
        y: 20
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: CONSTANTS.ANIMATION.POP_IN_DURATION,
        ease: CONSTANTS.ANIMATION.POP_IN_EASE
      }
    );
    
    // 淡出动画
    setTimeout(() => {
      gsap.to(element, {
        opacity: 0,
        scale: 0.8,
        y: -10,
        duration: CONSTANTS.ANIMATION.POP_OUT_DURATION,
        ease: CONSTANTS.ANIMATION.POP_OUT_EASE,
        onComplete: () => element.remove()
      });
    }, CONSTANTS.DISPLAY_DURATION);
  }
}

// ==================== FAQ 管理器 ====================
class FAQManager {
  constructor() {
    this.init();
  }
  
  init() {
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', this.handleClick.bind(this));
    });
  }
  
  handleClick(e) {
    const faqItem = e.target.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // 关闭所有其他
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 切换当前
    if (!isActive) {
      faqItem.classList.add('active');
    }
  }
}

// ==================== 平滑滚动管理器 ====================
class SmoothScrollManager {
  constructor() {
    this.init();
  }
  
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', this.handleClick.bind(this));
    });
  }
  
  handleClick(e) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

// ==================== 导航栏管理器 ====================
class NavigationManager {
  constructor() {
    this.nav = document.querySelector('nav');
    this.lastScroll = 0;
    this.init();
  }
  
  init() {
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }
  
  handleScroll() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > this.lastScroll && currentScroll > 100) {
      // 向下滚动，隐藏导航栏
      this.nav.style.transform = 'translateY(-100%)';
    } else {
      // 向上滚动，显示导航栏
      this.nav.style.transform = 'translateY(0)';
    }
    
    this.lastScroll = currentScroll;
  }
}

// ==================== 动画管理器 ====================
class AnimationManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.initGSAP();
    this.initAOS();
  }
  
  initGSAP() {
    // 注册 ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero Section 动画
    this.animateHero();
    
    // Features Section 动画
    this.animateFeatures();
    
    // Testimonials 动画
    this.animateTestimonials();
    
    // Social Proof 数字动画
    this.animateStats();
  }
  
  animateHero() {
    gsap.from('.hero-title', {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out'
    });
    
    gsap.from('.hero-subtitle', {
      opacity: 0,
      y: 30,
      duration: 1,
      delay: 0.3,
      ease: 'power3.out'
    });
    
    gsap.from('.cta-button', {
      opacity: 0,
      y: 20,
      duration: 0.8,
      stagger: 0.2,
      delay: 0.6,
      ease: 'power3.out'
    });
  }
  
  animateFeatures() {
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-section',
        start: 'top 80%',
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }
  
  animateTestimonials() {
    gsap.from('.testimonial-card', {
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: 'top 80%',
      },
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      stagger: 0.2,
      ease: 'back.out'
    });
  }
  
  animateStats() {
    gsap.from('.stat-number', {
      scrollTrigger: {
        trigger: '.social-proof',
        start: 'top 80%',
      },
      onStart: () => {
        document.querySelectorAll('.stat-number').forEach(el => {
          const target = parseInt(el.textContent.replace(/[^0-9]/g, ''));
          this.animateNumber(el, target);
        });
      }
    });
  }
  
  animateNumber(element, target) {
    let start = 0;
    const increment = target / 50;
    
    function updateNumber() {
      start += increment;
      if (start < target) {
        element.textContent = Math.floor(start).toLocaleString();
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = target.toLocaleString();
      }
    }
    
    updateNumber();
  }
  
  initAOS() {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
    });
  }
}

// ==================== 主应用 ====================
class LandingApp {
  constructor() {
    this.managers = [];
    this.init();
  }
  
  init() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    // 初始化各个管理器
    this.managers.push(new SloganManager());
    this.managers.push(new FAQManager());
    this.managers.push(new SmoothScrollManager());
    this.managers.push(new NavigationManager());
    this.managers.push(new AnimationManager());
    
    console.log('RuAlive Landing Page initialized');
  }
  
  // 可选：提供外部访问的方法
  destroy() {
    this.managers.forEach(manager => {
      if (manager.destroy) {
        manager.destroy();
      }
    });
  }
}

// ==================== 启动应用 ====================
// 创建应用实例
const landingApp = new LandingApp();

// 可选：将应用暴露到全局（用于调试）
if (typeof window !== 'undefined') {
  window.RuAliveLanding = landingApp;
}
```

### 优势

1. **模块化** - 每个功能独立成类，易于维护
2. **解耦** - 与 main.js 完全分离，互不影响
3. **可测试** - 每个管理器可以独立测试
4. **可扩展** - 新增功能只需添加新的管理器
5. **可配置** - 常量集中管理，易于调整
6. **性能优化** - 按需加载，不影响 Worker 核心逻辑

### 加载方式

在 Worker 的 `index.js` 中：

```javascript
async function getLandingJs() {
  return fs.readFileSync(path.join(__dirname, 'landing.js'), 'utf-8');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Landing JS 路由
    if (url.pathname === '/landing.js') {
      const js = await getLandingJs();
      return new Response(js, {
        headers: { 
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // ... 其他路由
  }
}
```

---

## 🔧 功能实现

### 1. FAQ 手风琴

```javascript
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const faqItem = question.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // 关闭所有其他
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 切换当前
    if (!isActive) {
      faqItem.classList.add('active');
    }
  });
});
```

### 2. 平滑滚动

```javascript
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
```

### 3. 导航栏滚动效果

```javascript
let lastScroll = 0;
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > lastScroll && currentScroll > 100) {
    // 向下滚动，隐藏导航栏
    nav.style.transform = 'translateY(-100%)';
  } else {
    // 向上滚动，显示导航栏
    nav.style.transform = 'translateY(0)';
  }
  
  lastScroll = currentScroll;
});
```

### 4. 粒子背景效果

```javascript
class ParticleSystem {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.createParticles();
    this.animate();
  }
  
  createParticles() {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      this.container.appendChild(particle);
      this.particles.push(particle);
    }
  }
  
  animate() {
    this.particles.forEach(particle => {
      gsap.to(particle, {
        y: -window.innerHeight,
        x: (Math.random() - 0.5) * 100,
        duration: 15 + Math.random() * 10,
        repeat: -1,
        ease: 'none'
      });
    });
  }
}

// 使用
new ParticleSystem(document.getElementById('particles'));
```

### 5. Slogan 交互（彩蛋功能）

```javascript
// Slogan 数组
const slogans = [
  "你今天动了吗？",
  "活着，就是为了做动画",
  "别让你的动画'死'在半路上",
  "搬砖也要搬得有仪式感",
  "你的动画搭子正在看着你",
  "加班归加班，身体要紧",
  "猝死是不可能猝死的",
  "今天也是努力搬砖的一天呢",
  "动画师永不言弃",
  "活着真好",
  "你还在做动画吗？",
  "RuAlive：你的动画搭子",
  "为了梦想，加油",
  "休息一下，别累坏了",
  "你的努力，我都记着呢",
  "动画师，冲鸭！",
  "活着，才有动画",
  "别让梦想'死'在半路上",
  "今天搬砖了吗？",
  "动画师永不加班（才怪）"
];

// 点击事件监听
document.addEventListener('click', (e) => {
  // 检查是否点击了交互元素（按钮、链接等）
  const isInteractive = e.target.closest('button, a, .faq-question');
  
  // 如果不是交互元素，且满足触发概率
  if (!isInteractive && Math.random() < 0.2) {
    const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
    showSlogan(e.clientX, e.clientY, randomSlogan);
  }
});

// 显示 slogan 弹窗
function showSlogan(x, y, text) {
  const slogan = document.createElement('div');
  slogan.className = 'slogan-popup';
  slogan.textContent = text;
  
  // 设置位置（考虑边界）
  const margin = 20;
  const maxLeft = window.innerWidth - slogan.offsetWidth - margin;
  const maxTop = window.innerHeight - slogan.offsetHeight - margin;
  
  slogan.style.left = Math.min(Math.max(x, margin), maxLeft) + 'px';
  slogan.style.top = Math.min(Math.max(y, margin), maxTop) + 'px';
  
  document.body.appendChild(slogan);
  
  // 添加到 DOM 后才能获取实际宽度
  slogan.style.left = Math.min(Math.max(x - slogan.offsetWidth / 2, margin), maxLeft) + 'px';
  slogan.style.top = Math.min(Math.max(y - slogan.offsetHeight - 20, margin), maxTop) + 'px';
  
  // 动画效果：弹出
  gsap.fromTo(slogan, 
    { 
      opacity: 0, 
      scale: 0.5, 
      y: 20 
    },
    { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      duration: 0.3, 
      ease: 'back.out(1.7)' 
    }
  );
  
  // 2秒后消失
  setTimeout(() => {
    gsap.to(slogan, {
      opacity: 0,
      scale: 0.8,
      y: -10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => slogan.remove()
    });
  }, 2000);
}

// 移动端优化：降低触发概率
if (window.innerWidth < 768) {
  document.removeEventListener('click', arguments.callee);
  document.addEventListener('click', (e) => {
    const isInteractive = e.target.closest('button, a, .faq-question');
    if (!isInteractive && Math.random() < 0.1) { // 移动端 10% 概率
      const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
      showSlogan(e.clientX, e.clientY, randomSlogan);
    }
  });
}
```

#### CSS 样式

```css
/* Slogan 弹窗样式 */
.slogan-popup {
  position: fixed;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  white-space: nowrap;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .slogan-popup {
    font-size: 14px;
    padding: 10px 20px;
  }
}
```

---

## 📱 响应式设计

### Tailwind 响应式类

```html
<!-- 移动端优先 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- 内容 -->
</div>

<!-- 隐藏/显示 -->
<div class="hidden md:block">桌面端显示</div>
<div class="block md:hidden">移动端显示</div>

<!-- 字体大小 -->
<h1 class="text-2xl md:text-4xl lg:text-5xl">标题</h1>

<!-- 间距 -->
<div class="p-4 md:p-8 lg:p-12">内容</div>
```

### 移动端优化

```css
/* 触摸优化 */
@media (max-width: 768px) {
  .cta-button {
    min-height: 48px;
    font-size: 16px;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  /* 禁用复杂动画 */
  .particle {
    display: none;
  }
}
```

---

## 🔍 SEO 优化

### Meta 标签

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="AEAlive 是一款专为 After Effects 动画师设计的智能工作追踪工具，自动统计工作量、实时监控项目进度">
<meta name="keywords" content="After Effects, AE, 动画, 工作追踪, 时间统计, AE扩展">
<meta name="author" content="AEAlive@烟囱鸭">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:title" content="AEAlive - After Effects 智能工作追踪工具">
<meta property="og:description" content="自动追踪工作量，让你的动画'活'起来">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:url" content="https://example.com">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="AEAlive - After Effects 智能工作追踪工具">
<meta name="twitter:description" content="自动追踪工作量，让你的动画'活'起来">
<meta name="twitter:image" content="https://example.com/twitter-image.jpg">
```

### 结构化数据

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AEAlive",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Adobe After Effects",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CNY"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1000"
  }
}
</script>
```

---

## 📚 参考资源

### 官方文档
- [Tailwind CSS](https://tailwindcss.com/docs)
- [GSAP](https://greensock.com/docs/)
- [AOS](https://michalsnik.github.io/aos/)

### 设计资源
- [undraw.co](https://undraw.co/)
- [storyset.com](https://storyset.com/)
- [humaaans.com](https://humaaans.com/)

---

## 🎯 实施优先级

### Phase 1 - 核心结构
1. HTML 结构搭建
2. Tailwind CSS 集成
3. Hero Section
4. Features Section
5. CTA Section

### Phase 2 - 内容填充
1. Problem Section
2. Solution Section
3. How It Works
4. Testimonials
5. FAQ

### Phase 3 - 动画效果
1. GSAP 集成
2. 页面加载动画
3. 滚动动画
4. 交互动画

### Phase 4 - 优化
1. 响应式适配
2. SEO 优化
3. 测试

---

**文档版本**: 2.0
**创建日期**: 2026-01-24
**更新日期**: 2026-01-24
**维护者**: iFlow CLI