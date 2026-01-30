
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// Global GSAP declarations
declare global {
  interface Window {
    gsap: any;
  }
}

const SLOGANS = [
  "你今天动了吗？", "活着，就是为了做动画", "别让你的动画'死'在半路上", 
  "搬砖也要搬得有仪式感", "你的动画搭子正在看着你", "猝死是不可能猝死的", 
  "今天也是努力搬砖的一天呢", "动画师永不言弃", "活着真好", "你还在做动画吗？", 
  "为了梦想，加油", "你的努力，我都记着呢", "动画师，冲鸭！", "活着，才有动画"
];

const Background = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-dark">
      {/* Grid Dot Pattern */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Background Aesthetic Curve */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible opacity-20">
        <svg viewBox="0 0 800 800" className="w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] text-primary rotate-12 scale-100">
          <path 
            d="M 0,400 C 100,400 120,200 160,200 C 250,200 350,600 450,600 C 550,600 700,400 800,400" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeDasharray="16 16" 
            strokeLinecap="round" 
            className="animate-marching-ants"
          />
        </svg>
      </div>
    </div>
  );
};

interface Popup { id: number; x: number; y: number; text: string; }

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);
  const formRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, label')) return;
    if (Math.random() < 0.25) {
      const id = ++popupId.current;
      setPopups(prev => [...prev, { id, x: e.clientX, y: e.clientY, text: SLOGANS[Math.floor(Math.random() * SLOGANS.length)] }]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1500);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  useEffect(() => {
    if (window.gsap && formRef.current) {
      window.gsap.fromTo(formRef.current, 
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" }
      );
    }
  }, [isLogin]);

  const toggleMode = () => {
    if (window.gsap && formRef.current) {
      window.gsap.to(formRef.current, {
        opacity: 0,
        x: isLogin ? -20 : 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setIsLogin(!isLogin);
          window.gsap.fromTo(formRef.current,
            { opacity: 0, x: isLogin ? 20 : -20 },
            { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
          );
        }
      });
    } else {
      setIsLogin(!isLogin);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <Background />

      {/* Slogan Popups */}
      {popups.map(p => (
        <div 
          key={p.id} 
          style={{ left: p.x, top: p.y }} 
          className="fixed pointer-events-none -translate-x-1/2 z-[100] text-primary font-black italic text-base sm:text-2xl tracking-tighter select-none animate-float-up-fade mix-blend-screen"
        >
          {p.text}
        </div>
      ))}

      {/* Simple Navigation */}
      <nav className="fixed top-0 w-full z-[60] h-14 flex items-center bg-dark/20 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="index.html" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center rotate-3 shadow-lg group-hover:rotate-0 transition-transform">
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">RuAlive</span>
          </a>
          <a href="index.html" className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-primary transition-all">
            返回首页 BACK TO HOME
          </a>
        </div>
      </nav>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div ref={formRef} className="glass-card rounded-[2rem] p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-2">
              {isLogin ? "欢迎回来" : "开始存活"}
              <span className="text-primary">.</span>
            </h2>
            <p className="text-white/40 text-xs font-bold italic uppercase tracking-wider">
              {isLogin ? "继续你的动画受难之旅" : "注册以开启生存状态监测"}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">用户名 Username</label>
                <input type="text" placeholder="K帧高手" className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">邮箱 Email</label>
              <input type="email" placeholder="animator@rualive.com" className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">密码 Password</label>
                {isLogin && (
                  <button 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[9px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary transition-colors"
                  >
                    忘记密码？
                  </button>
                )}
              </div>
              <input type="password" placeholder="••••••••" className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm" />
            </div>

            <button className="w-full bg-primary hover:bg-primary-light text-white h-14 rounded-2xl font-black italic uppercase tracking-wider text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 mt-4">
              {isLogin ? "登录 LOGIN" : "创建账户 CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/30 text-[11px] font-bold italic">
              {isLogin ? "还没有账号？" : "已经有账号了？"}
              <button 
                onClick={toggleMode}
                className="ml-2 text-primary hover:text-primary-light font-black uppercase underline decoration-primary/20"
              >
                {isLogin ? "立即注册 REGISTER" : "立即登录 LOGIN"}
              </button>
            </p>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="mt-8 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] italic">
            © 2026 RuAlive@烟囱鸭. 活着，为了做动画.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div 
            ref={formRef}
            className="glass-card rounded-[2rem] p-8 sm:p-12 w-full max-w-md shadow-2xl relative"
          >
            <button 
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.667 15h4.666" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-2">
                重置密码
                <span className="text-primary">.</span>
              </h3>
              <p className="text-white/40 text-xs font-bold italic uppercase tracking-wider">
                PASSWORD RESET PROTOCOL
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/80 text-sm font-mono text-center leading-relaxed">
                  需要重置密码？请联系管理员：
                </p>
                <p className="text-primary font-black text-lg text-center mt-3">
                  2655283737@qq.com
                </p>
              </div>

              <div className="text-center">
                <p className="text-white/30 text-[11px] font-bold italic">
                  管理员将协助您完成密码重置流程
                </p>
              </div>

              <button 
                onClick={() => setShowForgotPassword(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
              >
                返回登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<AuthPage />);
