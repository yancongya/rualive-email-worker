
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useToast, ToastContainer } from './src/components';

// Global GSAP declarations
declare global {
  interface Window {
    gsap: any;
    Observer: any;
    Draggable: any;
  }
}

// Local RuaLogo Component to ensure it's included in main bundle
const RuaLogo = ({ className = "" }: { className?: string }) => {
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (lineRef.current && window.gsap) {
      const tl = window.gsap.timeline({ repeat: -1, repeatDelay: 3 });
      tl.fromTo(lineRef.current,
        { strokeDasharray: 400, strokeDashoffset: 400, opacity: 0.5 },
        { strokeDashoffset: 0, opacity: 1, duration: 1.2, ease: "power2.out" }
      ).to(lineRef.current,
        { opacity: 0.6, duration: 0.8 }
      );
    }
  }, []);

  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M55 130 L90 35 Q100 10 110 35 L145 130" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      <path d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="#050505" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path ref={lineRef} d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// --- USER VIEW COMPONENT ---
// UserView component for authenticated users - v2
function UserView() {
  console.log('[UserView] Component mounted - fixed-v2');
  
  useEffect(() => {
    console.log('[UserView] Checking authentication - fixed-v2');
    const token = localStorage.getItem('rualive_token');
    const user = localStorage.getItem('rualive_user');
    
    if (!token || !user) {
      console.log('[UserView] Not authenticated, redirecting to login - fixed-v2');
      window.location.href = '/login';
    } else {
      console.log('[UserView] User authenticated successfully - fixed-v2');
    }
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4">用户页面 User Page (Fixed)</h1>
        <p className="text-white/40">欢迎回来！Welcome back!</p>
        <button 
          onClick={() => window.location.assign('/')}
          className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-primary-light transition-all"
        >
          返回首页 Back to Home
        </button>
      </div>
    </div>
  );
}

// --- I18N DATA ---
const TRANSLATIONS = {
  zh: {
    nav: { 
          stats: "生存看板", 
          features: "动画搭子", 
          pain: "加班共鸣",
          faq: "疑难杂症", 
          showcase: "界面展示", 
          start: "立即开始"
        },
        pageTitle: "RuAlive@烟囱鸭 - 你还在做动画嘛",
        hero: {      tag: "专为 AE 动画师打造",
      title: "Ru",
      titleAlive: "Alive",
      subtitle: "你还Alive吗？",
      desc: "希望你还在做着动画，但更重要的是活着。",
      btnPrimary: "我还活着，去注册",
      btnSecondary: "登录确认呼吸"
    },
    userCount: {
      title: "已有",
      count: "0",
      unit: "位小伙伴加入打卡",
      openSource: "当用户稳定30人后即开源",
      openSourceTooltip: "个人维护时间精力不够，开源后可用户自行部署管理"
    },
    stats: {
      title: "实时生存看板",
      subtitle: "正在实时监测全网动画师存活体征",
      items: [
        { label: "合成数", value: "99K+", unit: "个" },
        { label: "图层数", value: "1,234", unit: "个" },
        { label: "关键帧数", value: "4.9/5", unit: "个" },
        { label: "效果数", value: "10.01%", unit: "个" },
        { label: "运行时长", value: "99K+", unit: "小时" }
      ]
    },
    features: {
      title: "你的动画",
      titleAccent: "搭子",
      desc: "关心体征，更懂摸鱼。",
      items: [
        { title: "生存扫描", desc: "实时监测你是否在线", benefit: "防石化", icon: "scan" },
        { title: "搬砖计时", desc: "记录每个项目的运行时长", benefit: "精准级", icon: "timer" },
        { title: "摸鱼统计", desc: "统计每个项目的信息", benefit: "最诚实", icon: "chart" },
        { title: "工作汇报", desc: "每天自动提醒工作结果", benefit: "自动提醒", icon: "mail" },
        { title: "最后的轻语", desc: "可以发送信息给紧急联络人", benefit: "紧急联络", icon: "heart" },
        { title: "本地存储", desc: "除非你登录", benefit: "隐私满分", icon: "lock" }
      ]
    },
    pain: {
      title: "还在",
      titleAccent: "K帧",
      titleSuffix: "吗？",
      items: [
        { q: "加班快猝死了？", a: "RuAlive 提醒你喝水。" },
        { q: "家人问死没死？", a: "让他们看你AE在动。" },
        { q: "渲染无聊透顶？", a: "推送生存补给建议。" }
      ]
    },
    faq: {
      title: "疑难",
      titleAccent: "杂症",
      items: [
        { q: "RuAlive 免费吗？", a: "完全免费。毕竟你穷。" },
        { q: "隐私泄露吗？", a: "数据在本地，非常安全。" },
        { q: "为何总问活着吗？", a: "三小时不动的视为飞升。" },
        { q: "支持什么版本？", a: "能跑就行，放过旧版。" }
      ]
    },
    showcase: {
        title: "界面",
        titleAccent: "展示",
        desc: "部分扩展和用户页截图",
        hint: "← 左右滑动、滚动滚轮或拖拽切换 →",
        items: [
          { title: "打卡页 - 点击后即可定时循环进行刷新扫描打卡", img: "/assets/showcase/打卡页.jpg" },
          { title: "登录 - 数据默认本地进行保存，也可注册登录", img: "/assets/showcase/登录.jpg" },
          { title: "统计页 - 查看当天所有项目的各维度分析", img: "/assets/showcase/统计页.jpg" },
          { title: "设置页 - 设置扫描间隔和下班提醒时间", img: "/assets/showcase/设置页.jpg" },
          { title: "提醒 - 到时间后提醒当天工作的总结数据", img: "/assets/showcase/提醒.jpg" },
          { title: "监控面板 - 各种图表查看当天的项目各项数据", img: "/assets/showcase/监控面板.jpg" },
          { title: "数据分析页 - 各个维度查看工作的变化", img: "/assets/showcase/数据分析页.jpg" },
          { title: "同步提醒设置 - 可以每天邮箱进行提醒", img: "/assets/showcase/同步提醒设置.jpg" },
          { title: "紧急联络人 - 工作时长低于一定阈值会触发提醒紧急联系人邮箱", img: "/assets/showcase/紧急联络人.jpg" }
        ]
      },    cta: { title: "RU ALIVE?", subtitle: "大声点，赶紧注册。", btn: "我还活着，快开始！" },
    footer: { copy: "活着，为了做动画。", rights: "© 2026 RuAlive@烟囱鸭.", data: "本地存储", survival: "99% 生还预测" },
    slogans: [
      "还做动画吗？", "你还Alive吗？", "歇会儿吧", "K帧是死的", "动画师命也是命", "今天搬砖了吗？", "活着真好", "摸鱼是策略", "记得呼吸", "还在K帧？", "活着才有输出"
    ]
  },
  en: {
    nav: { 
      stats: "Dashboard", 
      features: "Buddy", 
      pain: "Pain",
      faq: "FAQ", 
      showcase: "Showcase", 
      start: "Start" 
    },
    pageTitle: "RuAlive@烟囱鸭 - Are you still animating?",
    hero: {
      tag: "Built for AE Animators",
      title: "Ru",
      titleAlive: "Alive",
      subtitle: "Are you still Alive?",
      desc: "Hope you're still animating, but more importantly, you're alive.",
      btnPrimary: "I'm Alive, Register",
      btnSecondary: "Login to Confirm Pulse"
    },
    userCount: {
      title: "Already",
      count: "0",
      unit: "buddies joined",
      openSource: "Open source after 30 stable users",
      openSourceTooltip: "Personal maintenance is time-consuming, users can deploy and manage themselves after open source"
    },
    stats: {
      title: "VITAL DASHBOARD",
      subtitle: "Monitoring real-time animator vitals worldwide",
      items: [
        { label: "Compositions", value: "99K+", unit: "" },
        { label: "Layers", value: "1,234", unit: "" },
        { label: "Keyframes", value: "4.9/5", unit: "" },
        { label: "Effects", value: "10.01%", unit: "" },
        { label: "Runtime", value: "99K+", unit: "Hrs" }
      ]
    },
    features: {
      title: "Animation",
      titleAccent: "Buddy",
      desc: "Monitor vitals.",
      items: [
        { title: "Live Scan", desc: "Real-time presence monitoring", benefit: "Anti-petrify", icon: "scan" },
        { title: "Project Timer", desc: "Records project active time", benefit: "Precision", icon: "timer" },
        { title: "Stat Hub", desc: "Aggregates project info", benefit: "Insights", icon: "chart" },
        { title: "Reports", desc: "Daily automatic work results", benefit: "Auto-notify", icon: "mail" },
        { title: "Final Whisper", desc: "Message to emergency contacts", benefit: "Emergency", icon: "heart" },
        { title: "Local Store", desc: "Local only unless logged in", benefit: "Privacy", icon: "lock" }
      ]
    },
    pain: {
      title: "Still",
      titleAccent: "K-framing",
      titleSuffix: "?",
      items: [
        { q: "Half-dead at midnight?", a: "RuAlive reminds you to breathe." },
        { q: "Family pulse checks?", a: "Show your AE is moving." },
        { q: "Boring long renders?", a: "Get jokes nightly." }
      ]
    },
    faq: {
      title: "The",
      titleAccent: "Symptoms",
      items: [
        { q: "Is it free?", a: "Totally. You're broke." },
        { q: "Privacy leak?", a: "Local data only." },
        { q: "Why keep asking?", a: "3 hrs no move: ascended?" },
        { q: "AE Version?", a: "If it runs, it works." }
      ]
    },
    showcase: {
        title: "UI",
        titleAccent: "Showcase",
        desc: "UI screenshots & dashboard previews",
        hint: "← SWIPE, SCROLL OR DRAG TO EXPLORE →",
        items: [
          { title: "Check-in Page - Click to start automatic refresh scanning", img: "/assets/showcase/打卡页.jpg" },
          { title: "Login - Data saved locally, or register and login", img: "/assets/showcase/登录.jpg" },
          { title: "Statistics Page - View daily project analysis across all dimensions", img: "/assets/showcase/统计页.jpg" },
          { title: "Settings Page - Configure scan interval and off-work reminder time", img: "/assets/showcase/设置页.jpg" },
          { title: "Reminder - Daily work summary reminder at scheduled time", img: "/assets/showcase/提醒.jpg" },
          { title: "Dashboard - View project data with various charts and metrics", img: "/assets/showcase/监控面板.jpg" },
          { title: "Analytics Page - Track work changes across different dimensions", img: "/assets/showcase/数据分析页.jpg" },
          { title: "Email Sync - Enable daily email reminders", img: "/assets/showcase/同步提醒设置.jpg" },
          { title: "Emergency Contact - Notify emergency contact when work hours drop below threshold", img: "/assets/showcase/紧急联络人.jpg" }
        ]
      },    cta: { title: "RU ALIVE?", subtitle: "Register loud and fast.", btn: "I'm Alive!" },
    footer: { copy: "Live to animate.", rights: "© 2026 RuAlive@ChimneyDuck.", data: "Local", survival: "99% Odds" },
    slogans: [
      "Still animating?", "RuAlive?", "Rest a bit", "Frames are dead", "Life matters", "Did you grind?", "Good to live", "Slack is strat", "Breathe now", "K-framing?", "Output needs life"
    ]
  }
};

// --- I18N UTILITIES ---

/**
 * 扁平化对象，将嵌套对象转换为点号分隔的键值对
 */
const flattenObject = (obj: any, prefix = '') => {
  const result: any = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(result, flattenObject(item, `${newKey}.${index}`));
          } else {
            result[`${newKey}.${index}`] = item;
          }
        });
      } else {
        Object.assign(result, flattenObject(obj[key], newKey));
      }
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
};

/**
 * 翻译工具函数
 * 从本地 JSON 文件加载翻译并返回翻译函数
 */
const useTranslation = (lang: 'zh' | 'en') => {
  // 使用内嵌的 TRANSLATIONS 作为初始值，避免加载时显示空内容
  // 使用内嵌的 TRANSLATIONS 作为初始值，避免加载时显示空内容
  const [translations, setTranslations] = useState<any>(flattenObject(TRANSLATIONS[lang]));

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locals/landing/${lang}.json`);
        if (!response.ok) {
          // 文件不存在，使用内嵌的 TRANSLATIONS
          return;
        }
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          // 扁平化翻译数据，与内嵌 TRANSLATIONS 的格式保持一致
          setTranslations(flattenObject(data));
        }
      } catch (error) {
        // 静默处理错误，继续使用内嵌的 TRANSLATIONS
      }
    };

    loadTranslations();
  }, [lang]);

  /**
   * 翻译函数
   * @param key - 翻译键（如 'nav.stats'）
   * @param fallback - 回退文本
   * @returns 翻译后的文本
   */
  const t = (key: string, fallback?: string) => {
    if (!translations) {
      // 如果翻译还未加载，返回键名或回退
      return fallback || key;
    }
    return translations[key] || fallback || key;
  };

  /**
   * 获取嵌套对象（用于处理数组数据）
   * @param key - 翻译键前缀（如 'stats.items'）
   * @returns 数组或对象
   */
  const getArray = (key: string): any[] => {
    if (!translations) return [];
    const result: any[] = [];
    const prefix = `${key}.`;
    Object.keys(translations).forEach(k => {
      if (k.startsWith(prefix)) {
        const rest = k.substring(prefix.length);
        // 找到第一个点的位置，分离索引和子键
        const dotIndex = rest.indexOf('.');
        if (dotIndex === -1) {
          // 简单数组项，如 "slogans.0"
          const index = parseInt(rest);
          result[index] = translations[k];
        } else {
          // 嵌套对象，如 "stats.items.0.label"
          const index = parseInt(rest.substring(0, dotIndex));
          const subKey = rest.substring(dotIndex + 1);
          if (!result[index]) result[index] = {};
          result[index][subKey] = translations[k];
        }
      }
    });
    return result;
  };

  return { t, getArray, isLoading: !translations };
};

// --- ICON COMPONENTS ---

const IconScan = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
    <path className="animate-dash" strokeDasharray="100" strokeDashoffset="100" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    <line x1="4" y1="12" x2="20" y2="12" className="animate-dash-fast" strokeDasharray="20" />
  </svg>
);

const IconTimer = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path className="animate-spin-slow origin-center" d="M12 6v6l4 2" strokeLinecap="round" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="10" width="4" height="11" className="animate-pulse-y" />
    <rect x="10" y="5" width="4" height="16" className="animate-pulse-y [animation-delay:0.5s]" />
    <rect x="17" y="13" width="4" height="8" className="animate-pulse-y [animation-delay:1s]" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path className="animate-mail-open" strokeDasharray="30" strokeDashoffset="30" d="M22 6l-10 7L2 6" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-pulse" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path className="animate-swing origin-top" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const IconComponent = ({ type }: { type: string }) => {
  switch (type) {
    case 'scan': return <IconScan />;
    case 'timer': return <IconTimer />;
    case 'chart': return <IconChart />;
    case 'mail': return <IconMail />;
    case 'heart': return <IconHeart />;
    case 'lock': return <IconLock />;
    default: return null;
  }
};

// --- DYNAMIC BACKGROUND LINE ---

const BackgroundLine = ({ currentSection, view }: { currentSection: number, view: string }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const paths = [
    // 0: Hero - Heartbeat
    "M 0,400 C 100,400 120,400 140,400 C 150,400 155,300 160,300 C 170,300 180,500 190,500 C 200,500 205,400 215,400 C 300,400 320,400 340,400 C 350,400 355,250 360,250 C 375,250 385,550 400,550 C 415,550 425,400 440,400 L 800,400",
    // 1: Stats - Stable Pulse
    "M 0,400 C 100,400 120,400 140,400 C 200,400 250,400 300,400 C 310,400 315,350 320,350 C 330,350 340,450 350,450 C 365,450 370,400 380,400 L 800,400",
    // 2: Features (Buddy) - Infinity Loop
    "M 400,400 C 250,250 250,550 400,400 C 550,250 550,550 400,400",
    // 3: Pain - Motion Curve
    "M 100,700 C 100,700 400,600 400,400 C 400,200 600,100 700,100",
    // 4: FAQ - Question Mark (放大版)
    "M 300,150 C 300,50 500,50 500,150 C 500,250 400,250 400,350 C 400,450 400,500 400,550 C 400,600 380,650 380,700 C 380,750 420,750 420,700",
    // 5: Showcase - Circle
    "M 400,200 C 500,200 600,300 600,400 C 600,500 500,600 400,600 C 300,600 200,500 200,400 C 200,300 300,200 400,200",
    // 6: CTA - Spiral Vortex
    "M 400,400 C 450,350 350,300 300,400 C 250,500 450,550 550,400 C 600,300 300,200 250,400"
  ];

  const authPath = "M 0,400 C 100,400 120,200 160,200 C 250,200 350,600 450,600 C 550,600 700,400 800,400";

  const transforms = [
    { x: '0vw', y: '0vh', scale: 1.1, rotate: 0, opacity: 0.25 },    // Hero
    { x: '-5vw', y: '5vh', scale: 0.9, rotate: 0, opacity: 0.25 },   // Stats
    { x: '5vw', y: '-5vh', scale: 1.6, rotate: 0, opacity: 0.25 },   // Buddy
    { x: '-10vw', y: '10vh', scale: 1.8, rotate: 10, opacity: 0.25 },// Pain
    { x: '10vw', y: '0vh', scale: 0.9, rotate: 0, opacity: 0.25 },   // FAQ
    { x: '0vw', y: '0vh', scale: 0.8, rotate: 90, opacity: 0.55 },   // Showcase
    { x: '-2vw', y: '5vh', scale: 2.5, rotate: 180, opacity: 0.25 }  // CTA
  ];

  useEffect(() => {
    if (pathRef.current && svgRef.current && window.gsap) {
      if (view === 'auth') {
        window.gsap.to(pathRef.current, { attr: { d: authPath }, duration: 1.5, ease: "power3.inOut" });
        window.gsap.to(svgRef.current, { x: '5vw', y: '-5vh', scale: 1.2, rotate: 15, opacity: 0.15, duration: 1.5, ease: "power3.inOut" });
      } else {
        const config = transforms[currentSection] || transforms[0];
        const tl = window.gsap.timeline();
        tl.to(svgRef.current, { scale: config.scale * 1.3, opacity: 0.1, duration: 0.5, ease: "power2.in" })
          .to(pathRef.current, { attr: { d: paths[currentSection] || paths[0] }, duration: 1.1, ease: "sine.out" }, "-=0.3")
          .to(svgRef.current, { x: config.x, y: config.y, scale: config.scale, rotation: config.rotate, opacity: config.opacity, duration: 1.2, ease: "sine.out" }, "-=0.4");
      }
    }
  }, [currentSection, view]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-dark">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 flex items-center justify-center overflow-visible">
        <svg ref={svgRef} viewBox="0 0 800 800" className="w-[140vw] h-[140vw] sm:w-[60vw] sm:h-[60vw] text-primary" style={{ transformOrigin: 'center center', opacity: 0.25 }}>
          <path ref={pathRef} fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="16 16" strokeLinecap="round" className="animate-marching-ants" />
        </svg>
      </div>
    </div>
  );
};

// --- AUTH COMPONENT ---

const AuthView = ({ isLogin, setIsLogin, onBack, goToSection, onAuthSuccess }: { isLogin: boolean, setIsLogin: (v: boolean) => void, onBack: () => void, goToSection: (index: number) => void, onAuthSuccess: () => void }) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.gsap && formRef.current) {
      window.gsap.fromTo(formRef.current, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" });
    }
  }, [isLogin]);

  const toggleMode = () => {
    setError(null);
    if (window.gsap && formRef.current) {
      window.gsap.to(formRef.current, { opacity: 0, x: isLogin ? -20 : 20, duration: 0.3, ease: "power2.in", onComplete: () => {
        setIsLogin(!isLogin);
        window.gsap.fromTo(formRef.current, { opacity: 0, x: isLogin ? 20 : -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" });
      }});
    } else {
      setIsLogin(!isLogin);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = {
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      ...(isLogin ? {} : {
        username: (form.elements.namedItem('username') as HTMLInputElement).value,
        invitationCode: (form.elements.namedItem('invitationCode') as HTMLInputElement).value
      })
    };

    // 简单验证
    if (!formData.email || !formData.password) {
      setError('请填写所有必填字段');
      setIsLoading(false);
      return;
    }

    if (!isLogin && (!formData.username || !formData.invitationCode)) {
      setError('请填写用户名和邀请码');
      setIsLoading(false);
      return;
    }

    try {
      // 获取 Worker URL（从当前页面获取）
      const workerUrl = window.location.origin;
      const endpoint = isLogin ? `${workerUrl}/api/auth/login` : `${workerUrl}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // 保存 token
        if (data.token) {
          localStorage.setItem('rualive_token', data.token);
        }

        // 保存用户信息
        if (data.user) {
          localStorage.setItem('rualive_user', JSON.stringify(data.user));
        }

        // 显示成功消息
        success(isLogin ? '登录成功！' : '注册成功！');

        // 根据用户角色跳转到不同页面
        console.log('[Auth] User data:', data);
        console.log('[Auth] BUILD_TIMESTAMP_20260126_1200');
        if (data.user && data.user.role === 'admin') {
          console.log('[Auth] Redirecting to /admin');
          window.location.href = '/admin';
        } else {
          console.log('[Auth] Redirecting to /user');
          window.location.href = '/user';
        }
        return; // 防止继续执行
      } else {
        setError(data.error || data.message || '认证失败，请重试');
      }
    } catch (err) {
      console.error('[Auth] Network error:', err);
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-6 z-20 overflow-y-auto no-scrollbar py-20 sm:py-0">
      <div ref={formRef} className="glass-card rounded-[2rem] p-8 sm:p-12 w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-2">
            {isLogin ? "欢迎回来" : "开始存活"}<span className="text-primary">.</span>
          </h2>
          <p className="text-white/40 text-xs font-bold italic uppercase tracking-wider">
            {isLogin ? "继续你的动画受难之旅" : "注册以开启生存状态监测"}
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleAuth} autoComplete="off">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">用户名 Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="K帧高手"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-sm focus:border-primary focus:outline-none transition-all"
                  disabled={isLoading}
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">邀请码 Invitation Code</label>
                <input
                  type="text"
                  name="invitationCode"
                  placeholder="ALIVE-XXXX"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-sm focus:border-primary focus:outline-none transition-all"
                  disabled={isLoading}
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">邮箱 Email</label>
            <input
              type="email"
              name="email"
              placeholder="animator@rualive.com"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-sm focus:border-primary focus:outline-none transition-all"
              disabled={isLoading}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-end mb-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">密码 Password</label>
              {isLogin && <button type="button" className="text-[9px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary" disabled={isLoading}>忘记密码？</button>}
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-sm focus:border-primary focus:outline-none transition-all"
              disabled={isLoading}
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
            />
          </div>
          <button 
            type="submit"
            className={`w-full bg-primary hover:bg-primary-light text-white h-14 rounded-2xl font-black italic uppercase tracking-wider text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : (isLogin ? "登录 LOGIN" : "创建账户 CREATE ACCOUNT")}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-white/30 text-[11px] font-bold italic">
            {isLogin ? "还没有账号？" : "已经有账号了？"}
            <button onClick={toggleMode} className="ml-2 text-primary hover:text-primary-light font-black uppercase underline decoration-primary/20" disabled={isLoading}>{isLogin ? "立即注册 REGISTER" : "立即登录 LOGIN"}</button>
          </p>
          <button onClick={onBack} className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors" disabled={isLoading}>← 返回首页 BACK TO HOME</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const IconX = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

interface Popup { id: number; x: number; y: number; text: string; }

const App = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'user' | 'admin'>(() => {
    // 根据初始 URL 设置初始视图 - Updated 2026-02-01 23:20
    const path = window.location.pathname;
    console.log('[App] Initial path:', path);
    // admin 路由优先检查 - Updated 2026-02-01 23:20
    if (path.startsWith('/admin')) {
      return 'admin';
    }
    if (path.startsWith('/login') || path.startsWith('/register')) {
      return 'auth';
    }
    if (path.startsWith('/user')) {
      return 'user';
    }
    return 'landing';
  });

  const { success } = useToast();

  // 强制更新视图以确保路由正确 - v4 with admin support
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      console.log('[App] PopState - Path:', path);
      if (path.startsWith('/admin')) {
        setView('admin');
      } else if (path.startsWith('/user')) {
        setView('user');
      } else if (path.startsWith('/login') || path.startsWith('/register')) {
        setView('auth');
      } else {
        setView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [isLogin, setIsLogin] = useState(() => {
    // 根据初始 URL 设置登录/注册模式
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    console.log('[App] Initial isLogin check - path:', path, 'mode:', mode);
    // admin 和 user 路由不需要登录/注册模式
    if (path.startsWith('/admin') || path.startsWith('/user')) {
      console.log('[App] Setting initial isLogin to true (admin/user)');
      return true;
    }
    if (path === '/register' || (path === '/login' && mode === 'register')) {
      console.log('[App] Setting initial isLogin to false (register)');
      return false;
    }
    console.log('[App] Setting initial isLogin to true (login)');
    return true;
  });
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const { t, getArray, isLoading: isTranslationsLoading } = useTranslation(lang);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [shouldRedirectToStats, setShouldRedirectToStats] = useState(false);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; src: string; title: string }>({ isOpen: false, src: '', title: '' });
  const [userCount, setUserCount] = useState(0);
  const currentSectionRef = useRef(0);
  const popupId = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const isSliderAnimating = useRef(false);
  const sectionCount = 7;

  const sliderDraggable = useRef<any>(null);
  const sectionObserver = useRef<any>(null);
  const currentSlideIndexRef = useRef(0);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, nav, summary, .showcase-slide, input')) return;
    if (Math.random() < 0.3) {
      const id = ++popupId.current;
      const slogans = getArray('slogans');
      setPopups(prev => [...prev, { id, x: e.clientX, y: e.clientY, text: slogans[Math.floor(Math.random() * slogans.length)] }]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1500);
    }
  }, [getArray]);

  // 定义 goToSection 和其他回调函数（在使用它们的 useEffect 之前）
  const goToSection = useCallback((index: number) => {
    if (isAnimating.current || index < 0 || index >= sectionCount) return;
    isAnimating.current = true;
    currentSectionRef.current = index;
    setCurrentSection(index);
    if (window.gsap && wrapperRef.current) {
      window.gsap.to(wrapperRef.current, { y: -index * 100 + "%", duration: 1.2, ease: "sine.out", onComplete: () => { isAnimating.current = false; } });
    }
  }, []);

  // 检查是否需要重定向到生存看板
  useEffect(() => {
    console.log('[App] Initial view:', view, 'isLogin:', isLogin);
  }, [view, isLogin]);

  // 检查是否需要重定向到生存看板
  useEffect(() => {
    console.log('[App] Check redirect - shouldRedirectToStats:', shouldRedirectToStats, 'view:', view);
    
    if (shouldRedirectToStats && view === 'landing') {
      setShouldRedirectToStats(false);
      console.log('[App] Redirecting to stats section');
      setTimeout(() => {
        goToSection(1);
      }, 500);
    }
  }, [shouldRedirectToStats, view, goToSection]);

  // 监听 URL 变化
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');

      console.log('[App] URL changed - path:', path, 'mode:', mode);

      if (path.startsWith('/login') || path.startsWith('/register')) {
        setIsLogin(path.startsWith('/register') || (path.startsWith('/login') && mode === 'register'));
        setView('auth');
      } else if (path.startsWith('/user')) {
        setView('user');
      } else {
        setView('landing');
      }
    };

    // 定期检查 URL 变化（用于检测编程式导航）
    let lastPath = window.location.pathname;
    let lastSearch = window.location.search;
    
    const checkUrlChange = () => {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      
      if (currentPath !== lastPath || currentSearch !== lastSearch) {
        console.log('[App] URL changed detected - old:', lastPath + lastSearch, 'new:', currentPath + currentSearch);
        lastPath = currentPath;
        lastSearch = currentSearch;
        handlePopState();
      }
    };

    const intervalId = setInterval(checkUrlChange, 100);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(intervalId);
    };
  }, []);

  // 检查是否需要重定向到生存看板
  useEffect(() => {
    const path = window.location.pathname;
    const redirectToStats = localStorage.getItem('rualive_redirect_to_stats');
    if (redirectToStats === 'true' && path === '/') {
      localStorage.removeItem('rualive_redirect_to_stats');
      setTimeout(() => {
        goToSection(1);
      }, 500);
    }
  }, [goToSection]);

  // 获取用户数量统计
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('/api/stats/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const count = data.count || 0;
            setUserCount(count);
            console.log('[App] User count fetched:', count);
          }
        }
      } catch (error) {
        console.error('[App] Failed to fetch user count:', error);
      }
    };

    fetchUserCount();
  }, []);

  // 动态修改页面标题
  useEffect(() => {
    const titleElement = document.getElementById('page-title');
    if (titleElement && trans.pageTitle) {
      titleElement.textContent = trans.pageTitle;
    }
  }, [trans, lang]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  const getSliderMetrics = useCallback(() => {
    const slides = document.querySelectorAll(".showcase-slide");
    const sliderContainer = document.querySelector(".showcase-slider-container");
    if (!slides.length || !sliderContainer) return null;
    const slideWidth = slides[0].clientWidth;
    const gap = parseInt(window.getComputedStyle(slides[0]).marginRight) || 0;
    const step = slideWidth + gap;
    const centerOffset = (sliderContainer.clientWidth / 2) - (slideWidth / 2);
    return { step, centerOffset, count: slides.length };
  }, []);

const moveSlideToIndex = useCallback((index: number) => {
    if (isSliderAnimating.current) return;
    const metrics = getSliderMetrics();
    const draggable = sliderDraggable.current;
    if (!metrics || !draggable) return;
    const clampedIndex = Math.max(0, Math.min(metrics.count - 1, index));
    if (clampedIndex === currentSlideIndexRef.current) return;
    isSliderAnimating.current = true;
    currentSlideIndexRef.current = clampedIndex;
    window.gsap.to(draggable.target, { x: -clampedIndex * metrics.step + metrics.centerOffset, duration: 1.0, ease: "power3.out", onUpdate: () => draggable.update(), onComplete: () => { setTimeout(() => { isSliderAnimating.current = false; }, 150); } });
  }, [getSliderMetrics]);

  useEffect(() => {
    if (!window.gsap || !window.Observer || !window.Draggable) return;
    try { window.gsap.registerPlugin(window.Observer, window.Draggable); } catch (e) {}

    const obs = window.Observer.create({
      target: window, type: "wheel,touch,pointer", wheelSpeed: -1,
      onDown: (self) => {
        if (isAnimating.current || isSliderAnimating.current || view === 'auth') return;
        if (!mobileMenuOpen) {
          // 检查是否在 showcase 页面且鼠标在图片区域
          const isShowcaseSection = currentSectionRef.current === 5;
          const target = self.event.target as HTMLElement;
          const isOnSlide = target.closest('.showcase-slide');
          const isHeader = target.closest('#showcase-header');
          const isSliderArea = target.closest('.showcase-slider-container');
          
          if (isShowcaseSection && isOnSlide && !isHeader && currentSlideIndexRef.current > 0) {
            moveSlideToIndex(currentSlideIndexRef.current - 1);
          } else if (isShowcaseSection && isSliderArea && !isHeader) {
            // 在 showcase 图片区域但不在具体图片上，检查是否可以继续滚动
            if (currentSlideIndexRef.current > 0) {
              moveSlideToIndex(currentSlideIndexRef.current - 1);
            } else {
              goToSection(currentSectionRef.current - 1);
            }
          } else {
            goToSection(currentSectionRef.current - 1);
          }
        }
      },
      onUp: (self) => {
        if (isAnimating.current || isSliderAnimating.current || view === 'auth') return;
        if (!mobileMenuOpen) {
          // 检查是否在 showcase 页面且鼠标在图片区域
          const isShowcaseSection = currentSectionRef.current === 5;
          const target = self.event.target as HTMLElement;
          const isOnSlide = target.closest('.showcase-slide');
          const isHeader = target.closest('#showcase-header');
          const isSliderArea = target.closest('.showcase-slider-container');
          const showcaseItemsLength = getArray('showcase.items').length;
          
          if (isShowcaseSection && isOnSlide && !isHeader && currentSlideIndexRef.current < showcaseItemsLength - 1) {
            moveSlideToIndex(currentSlideIndexRef.current + 1);
          } else if (isShowcaseSection && isSliderArea && !isHeader) {
            // 在 showcase 图片区域但不在具体图片上，检查是否可以继续滚动
            if (currentSlideIndexRef.current < showcaseItemsLength - 1) {
              moveSlideToIndex(currentSlideIndexRef.current + 1);
            } else {
              goToSection(currentSectionRef.current + 1);
            }
          } else {
            goToSection(currentSectionRef.current + 1);
          }
        }
      },
      tolerance: 50, preventDefault: true
    });
    sectionObserver.current = obs;
    
    if (view === 'auth') obs.disable(); else obs.enable();

    const slider = document.querySelector(".showcase-slider");
    const container = document.querySelector(".showcase-slider-container");
    if (slider && container && view === 'landing') {
        const metrics = getSliderMetrics();
        if (metrics) {
            const draggableInstance = window.Draggable.create(slider, {
                type: "x", edgeResistance: 0.85, bounds: { minX: -(metrics.step * (metrics.count - 1)) + metrics.centerOffset, maxX: metrics.centerOffset }, inertia: true,
                onDragStart: () => obs.disable(),
                onDragEnd: function(this: any) {
                    obs.enable();
                    const index = Math.round((this.x - metrics.centerOffset) / -metrics.step);
                    const clampedIndex = Math.max(0, Math.min(metrics.count - 1, index));
                    currentSlideIndexRef.current = clampedIndex;
                },
                snap: (value: number) => { const index = Math.round((value - metrics.centerOffset) / -metrics.step); return -index * metrics.step + metrics.centerOffset; }
            })[0];
            sliderDraggable.current = draggableInstance;
            // 使用当前的 slideIndex 而不是重置为 0
            const targetX = -currentSlideIndexRef.current * metrics.step + metrics.centerOffset;
            window.gsap.set(slider, { x: targetX });
            draggableInstance.update();
        }
    }

    return () => { obs.kill(); if (sliderDraggable.current) sliderDraggable.current.kill(); };
  }, [goToSection, mobileMenuOpen, lang, moveSlideToIndex, getSliderMetrics, getArray, view]);

  const switchView = (target: 'landing' | 'auth') => {
    console.log('[switchView] Switching to:', target);
    
    // 更新 URL
    if (target === 'landing') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', '/login');
    }
    
    if (window.gsap) {
      window.gsap.to(document.body, { opacity: 0, duration: 0.3, onComplete: () => {
        console.log('[switchView] GSAP animation complete, setting view to:', target);
        setView(target);
        if (target === 'landing') {
          // Explicitly reset section state to landing start
          currentSectionRef.current = 0;
          setCurrentSection(0);
          if (wrapperRef.current) {
            window.gsap.set(wrapperRef.current, { y: "0%" });
          }
          // Reset observer manually just in case
          if (sectionObserver.current) {
            sectionObserver.current.enable();
          }
        } else {
          // Disable observer when in auth
          if (sectionObserver.current) {
            sectionObserver.current.disable();
          }
        }
        window.gsap.to(document.body, { opacity: 1, duration: 0.5 });
      }});
    } else {
      console.log('[switchView] No GSAP, setting view to:', target);
      setView(target);
      if (target === 'landing') {
        currentSectionRef.current = 0;
        setCurrentSection(0);
      }
    }
  };

  return (
    <div className="app-container overflow-hidden h-screen bg-dark text-white font-sans">
      <BackgroundLine currentSection={currentSection} view={view} />

      {/* Popups */}
      {popups.map(p => (
        <div key={p.id} style={{ left: p.x, top: p.y }} className="fixed pointer-events-none -translate-x-1/2 z-[100] text-primary font-black italic text-base sm:text-2xl tracking-tighter select-none animate-float-up-fade mix-blend-screen">{p.text}</div>
      ))}

      {/* Image Viewer Modal */}
      {imageViewer.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8" onClick={() => setImageViewer({ isOpen: false, src: '', title: '' })}>
          <div className="relative max-w-7xl max-h-full flex flex-col items-center">
            <button
              className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors text-sm font-black uppercase tracking-widest"
              onClick={() => setImageViewer({ isOpen: false, src: '', title: '' })}
            >
              [ CLOSE ]
            </button>
            <img
              src={imageViewer.src}
              alt={imageViewer.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="mt-4 text-white/80 text-sm font-medium text-center max-w-2xl">
              {imageViewer.title}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[60] bg-dark/60 backdrop-blur-md border-b border-white/5 h-14 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => switchView('landing')}>
            <div className="w-10 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RuaLogo className="w-10 h-8 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">RuAlive</span>
          </div>
          {view === 'landing' ? (
            <div className="hidden lg:flex items-center gap-6 text-[9px] font-black uppercase tracking-widest opacity-60">
              <button onClick={() => goToSection(1)} className={`hover:text-primary transition-colors ${currentSection === 1 ? 'text-primary opacity-100' : ''}`}>{t('nav.stats')}</button>
                          <button onClick={() => goToSection(2)} className={`hover:text-primary transition-colors ${currentSection === 2 ? 'text-primary opacity-100' : ''}`}>{t('nav.features')}</button>
                          <button onClick={() => goToSection(3)} className={`hover:text-primary transition-colors ${currentSection === 3 ? 'text-primary opacity-100' : ''}`}>{t('nav.pain')}</button>
                          <button onClick={() => goToSection(4)} className={`hover:text-primary transition-colors ${currentSection === 4 ? 'text-primary opacity-100' : ''}`}>{t('nav.faq')}</button>
                          <button onClick={() => goToSection(5)} className={`hover:text-primary transition-colors ${currentSection === 5 ? 'text-primary opacity-100' : ''}`}>{t('nav.showcase')}</button>              <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="hover:bg-white/10 transition-colors border border-white/10 px-2 py-0.5 rounded text-[9px] uppercase font-bold">{lang === 'zh' ? 'EN' : 'ZH'}</button>
            </div>
          ) : view === 'user' ? (
            <button onClick={() => window.location.assign('/')} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-primary transition-all">返回首页 BACK TO HOME</button>
          ) : (
            <button onClick={() => switchView('landing')} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-primary transition-all">返回首页 BACK TO HOME</button>
          )}
          <div className="flex items-center gap-3">
            <button className="hidden sm:block bg-white text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-tighter hover:bg-primary hover:text-white transition-all active:scale-95" onClick={() => view === 'landing' ? window.location.assign('/login') : window.location.assign('/')}>{view === 'landing' ? t('nav.start') : view === 'user' ? 'EXIT' : 'EXIT'}</button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1 opacity-80">{mobileMenuOpen ? <IconX /> : <IconMenu />}</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className={`lg:hidden absolute top-14 left-0 w-full bg-dark/95 backdrop-blur-xl border-b border-white/5 px-6 py-8 flex flex-col gap-6 transition-all duration-300`}>
            {view === 'landing' ? (
              <>
                <button onClick={() => { setMobileMenuOpen(false); goToSection(1); }} className="text-left text-2xl font-black italic">{t('nav.stats')}</button>
                <button onClick={() => { setMobileMenuOpen(false); goToSection(2); }} className="text-left text-2xl font-black italic">{t('nav.features')}</button>
                <button onClick={() => { setMobileMenuOpen(false); goToSection(3); }} className="text-left text-2xl font-black italic">{t('nav.pain')}</button>
                <button onClick={() => { setMobileMenuOpen(false); goToSection(4); }} className="text-left text-2xl font-black italic">{t('nav.faq')}</button>
                <button onClick={() => { setMobileMenuOpen(false); goToSection(5); }} className="text-left text-2xl font-black italic">{t('nav.showcase')}</button>
              </>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); switchView('landing'); }} className="text-left text-2xl font-black italic">返回首页 HOME</button>
            )}
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="text-left text-lg font-bold opacity-60 hover:text-primary transition-colors">{lang === 'zh' ? 'EN' : 'ZH'}</button>
          </div>
        )}
      </nav>

      {view === 'landing' ? (
        <div className="sections-wrapper h-full flex flex-col will-change-transform relative z-10" ref={wrapperRef}>
          {/* SECTION 0: HERO */}
          <section id="hero" className="h-screen flex flex-col items-center justify-center px-6 shrink-0 bg-transparent">
            <div className="container mx-auto text-center mt-12 sm:mt-0">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest mb-6 animate-pulse">{t('hero.tag')}</div>
              <h1 className="text-5xl sm:text-8xl md:text-[9rem] font-black leading-none tracking-tighter mb-4 italic uppercase whitespace-nowrap overflow-visible">
                {t('hero.title')}<span className="text-primary inline-block animate-breathing">{t('hero.titleAlive')}</span><span className="text-primary">?</span>
              </h1>
              <p className="text-lg sm:text-3xl text-white mb-2 font-black italic uppercase leading-none">{t('hero.subtitle')}</p>
              <p className="text-sm sm:text-xl text-white/40 mb-10 leading-relaxed font-bold italic max-w-lg mx-auto">{t('hero.desc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-black text-base italic shadow-2xl hover:brightness-110 active:scale-95 transition-all" onClick={(e) => { e.stopPropagation(); window.location.assign('/login#register'); }}>{t('hero.btnPrimary')}</button>
                          <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-base italic hover:bg-white/10 active:scale-95 transition-all" onClick={(e) => { e.stopPropagation(); window.location.assign('/login'); }}>{t('hero.btnSecondary')}</button>              </div>

              {/* User Count Display */}
              <div className="mt-8 group relative inline-block">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-help">
                  <span className="text-white/60 text-sm font-bold">{t('userCount.title')}</span>
                  <span className="text-primary text-lg font-black">{userCount}</span>
                  <span className="text-white/60 text-sm font-bold">{t('userCount.unit')}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                    {t('userCount.openSource')}
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white/80 text-[10px] sm:text-xs font-bold leading-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                  {t('userCount.openSourceTooltip')}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 1: STATS */}
          <section className="h-screen flex flex-col items-center justify-center bg-transparent px-6 shrink-0">
            <div className="container mx-auto max-w-5xl text-center mb-8 sm:mb-16">
              <h2 className="text-4xl sm:text-7xl font-black italic uppercase mb-2 tracking-tighter leading-tight">{t('stats.title')}</h2>
              <p className="text-white/40 text-[10px] sm:text-lg font-bold italic uppercase tracking-widest">{t('stats.subtitle')}</p>
            </div>
            <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-8">
              {getArray('stats.items').map((s: any, i: number) => (
                <div key={i} className={`text-center group p-4 sm:p-10 glass-card rounded-3xl hover:border-primary/40 transition-all transform hover:-translate-y-1 relative flex flex-col justify-center min-h-[160px] sm:min-h-[260px] ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <div className="text-3xl sm:text-5xl md:text-6xl font-black italic group-hover:text-primary transition-colors tracking-tighter leading-none mb-3 py-4 overflow-visible h-auto flex items-center justify-center">
                    <span className="block">{s.value}</span>
                  </div>
                  <div className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 italic leading-tight">{s.label} <span className="text-primary/60">{s.unit}</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: FEATURES */}
          <section id="features" className="h-screen flex flex-col items-center justify-center px-4 shrink-0 overflow-hidden bg-transparent">
            <div className="container mx-auto max-w-5xl h-full flex flex-col pt-20 pb-10">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-4xl sm:text-6xl font-black italic uppercase leading-none">{t('features.title')}<span className="text-primary">{t('features.titleAccent')}</span></h2>
                <p className="text-white/40 text-xs sm:text-base font-bold italic">{t('features.desc')}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 flex-grow content-start overflow-y-auto sm:overflow-visible pr-1 sm:pr-0">
                {getArray('features.items').map((f: any, i: number) => (
                  <div key={i} className="group p-5 sm:p-8 rounded-3xl glass-card hover:border-primary/50 transition-all flex flex-col justify-between relative min-h-[160px] sm:min-h-[220px]">
                    <div className="mb-4"><IconComponent type={f.icon} /></div>
                    <h3 className="text-[12px] sm:text-xl font-black italic uppercase leading-tight truncate">{f.title}</h3>
                    <p className="text-white/30 text-[9px] sm:text-sm font-medium italic leading-relaxed line-clamp-2">{f.desc}</p>
                    <div className="mt-4 text-[7px] sm:text-[10px] font-black uppercase tracking-wider text-primary-light bg-primary/10 px-2 py-1 rounded-full inline-block self-start border border-primary/20">{f.benefit}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: PAIN */}
          <section className="h-screen flex flex-col items-center justify-center px-6 bg-transparent shrink-0">
            <div className="container mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-20">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl sm:text-6xl font-black mb-8 italic uppercase leading-none tracking-tighter">{t('pain.title')}<span className="text-primary">{t('pain.titleAccent')}</span>{t('pain.titleSuffix')}</h2>
              <div className="space-y-6">
                {getArray('pain.items').map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 group text-left p-2 hover:bg-white/[0.03] rounded-2xl transition-all">
                      <div className="text-primary font-black text-3xl sm:text-5xl italic opacity-20 group-hover:opacity-100 transition-opacity leading-none shrink-0">0{i+1}</div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-[14px] sm:text-xl font-black italic leading-tight group-hover:text-primary transition-colors">{item.q}</h4>
                        <p className="text-white/40 text-[11px] sm:text-base font-bold italic leading-snug">{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: FAQ */}
          <section id="faq" className="h-screen flex flex-col items-center justify-center px-4 shrink-0 bg-transparent">
            <div className="container mx-auto max-w-3xl h-full flex flex-col pt-20 pb-10">
              <h2 className="text-4xl sm:text-7xl font-black mb-8 italic text-center uppercase tracking-tighter shrink-0">{t('faq.title')}<span className="text-primary">{t('faq.titleAccent')}</span></h2>
              <div className="flex flex-col gap-4 flex-grow overflow-y-auto px-2 pb-10 no-scrollbar">
                {getArray('faq.items').map((f: any, i: number) => (
                  <details key={i} className="group glass-card rounded-2xl overflow-hidden border border-white/5 transition-all">
                    <summary className="flex items-center justify-between p-5 sm:p-8 cursor-pointer font-black italic text-[13px] sm:text-xl list-none select-none">{f.q}</summary>
                    <div className="px-8 pb-8 text-white/30 text-[11px] sm:text-base italic font-bold leading-relaxed border-t border-white/5 pt-6 bg-white/[0.01]">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 5: SHOWCASE */}
          <section id="showcase" className="h-screen flex flex-col items-center justify-center shrink-0 bg-transparent relative overflow-hidden">
              <div className="container mx-auto px-6 h-full flex flex-col pt-20">
                  <div id="showcase-header" className="text-center mb-6 cursor-ns-resize group select-none relative z-20">
                      <h2 className="text-4xl sm:text-7xl font-black italic uppercase leading-none tracking-tighter mb-2 group-hover:text-primary transition-colors">{t('showcase.title')}<span className="text-primary">{t('showcase.titleAccent')}</span></h2>
                      <p className="text-white/40 text-xs sm:text-base font-bold italic group-hover:text-white/60 transition-colors">{t('showcase.desc')}</p>
                  </div>
                  <div className="showcase-slider-container flex-grow relative overflow-visible">
                      <div className="showcase-slider flex items-center h-full will-change-transform">
                          {getArray('showcase.items').map((item: any, i: number) => (
                              <div key={i} className="showcase-slide">
                                  <div className="glass-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                                      <div className="aspect-[16/10] sm:aspect-[4/3] bg-white/5 relative overflow-hidden cursor-pointer" onClick={() => item.img && setImageViewer({ isOpen: true, src: item.img, title: item.title })}>
                                          {item.img ? (
                                              <img src={item.img} alt={item.title} className="w-full h-full object-cover pointer-events-none group-hover:scale-102 transition-transform duration-1000" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                                  <svg className="w-16 h-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                              </div>
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 sm:p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                              <h4 className="text-lg sm:text-3xl font-black italic uppercase text-white tracking-tighter">{item.title}</h4>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="py-6 text-center opacity-40 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] italic animate-pulse shrink-0">{t('showcase.hint')}</div>
              </div>
          </section>

          {/* SECTION 6: CTA + FOOTER */}
          <section className="h-screen flex flex-col items-center justify-center relative bg-primary/90 px-6 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-black opacity-10 pattern-dots pointer-events-none"></div>
            <div className="container mx-auto text-center relative z-10 flex flex-col h-full pt-20">
              <div className="flex-grow flex flex-col justify-center items-center">
                <h2 className="text-6xl sm:text-9xl md:text-[11rem] font-black text-white leading-none tracking-tighter uppercase mb-6 drop-shadow-lg">{t('cta.title')}<span className="text-black">?</span></h2>
                <p className="text-black/70 text-base sm:text-3xl font-black mb-12 italic uppercase tracking-widest max-w-2xl mx-auto leading-tight">{t('cta.subtitle')}</p>
                <button className="bg-white text-black px-12 py-6 sm:px-20 sm:py-8 rounded-3xl font-black text-xl sm:text-4xl italic shadow-2xl hover:scale-105 active:scale-95 transition-all animate-pulse" onClick={() => { window.location.assign('/login#register'); }}>{t('cta.btn')}</button>
              </div>
              <div className="pb-10 border-t border-black/10 pt-8 flex flex-col gap-6 text-[9px] sm:text-[13px] font-black text-black/50 uppercase tracking-[0.1em] italic shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>{t('footer.rights')}</div>
                  <div className="flex gap-6 items-center">
                    <span>{t('footer.copy')}</span>
                    <button onClick={() => { navigator.clipboard.writeText('2655283737@qq.com'); success('邮箱已复制到剪贴板'); }} className="flex items-center gap-2 hover:text-black transition-colors group">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span className="hidden sm:inline">EMAIL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : view === 'user' ? (
        <UserView />
      ) : (
        <AuthView 
          isLogin={isLogin} 
          setIsLogin={setIsLogin} 
          onBack={() => switchView('landing')} 
          goToSection={goToSection} 
          onAuthSuccess={() => {
            window.location.assign('/user');
          }}
        />
      )}
      <ToastContainer />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
