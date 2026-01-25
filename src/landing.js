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
    document.body.appendChild(sloganEl);

    // 添加到 DOM 后才能获取实际宽度
    const position = Utils.getBoundedPosition(x, y, sloganEl.offsetWidth, sloganEl.offsetHeight);

    sloganEl.style.left = position.x + 'px';
    sloganEl.style.top = position.y + 'px';

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
          const text = el.textContent;
          const match = text.match(/[\d,]+/);
          if (match) {
            const target = parseInt(match[0].replace(/,/g, ''));
            this.animateNumber(el, target, text);
          }
        });
      }
    });
  }

  animateNumber(element, target, originalText) {
    let start = 0;
    const increment = target / 50;

    function updateNumber() {
      start += increment;
      if (start < target) {
        const formatted = Math.floor(start).toLocaleString();
        element.textContent = originalText.replace(/[\d,]+/, formatted);
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = originalText.replace(/[\d,]+/, target.toLocaleString());
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