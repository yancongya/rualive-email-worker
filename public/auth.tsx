import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { RuaLogo } from './LogoAnimation';
import { useToast, ToastContainer } from './src/components';

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

// 默认翻译（用于fallback）
const DEFAULT_TRANS = {
  EN: {
    navBackToHome: "BACK TO HOME",
    welcomeBack: "WELCOME BACK",
    startSurviving: "START SURVIVING",
    loginSubtitle: "Continue your animation journey",
    registerSubtitle: "Register to start survival monitoring",
    usernameLabel: "Username",
    emailLabel: "Email",
    passwordLabel: "Password",
    forgotPassword: "Forgot password?",
    loginBtn: "LOGIN",
    registerBtn: "CREATE ACCOUNT",
    processing: "Processing...",
    noAccount: "No account yet?",
    hasAccount: "Already have an account?",
    registerNow: "REGISTER NOW",
    loginNow: "LOGIN NOW",
    resetPassword: "RESET PASSWORD",
    resetPasswordDesc: "Need to reset password? Contact admin:",
    resetPasswordNote: "Admin will assist you with password reset",
    backToLogin: "BACK TO LOGIN",
    loginSuccess: "Login successful!",
    registerSuccess: "Registration successful!",
    fillAllFields: "Please fill all required fields",
    authFailed: "Authentication failed, please try again",
    networkError: "Network error, please check connection and try again",
    placeholderUsername: "Keyframe Master",
    placeholderEmail: "animator@rualive.com",
    placeholderPassword: "•••••••••",
    footerCopy: "© 2026 RuAlive@烟囱鸭. Living for animation.",
    toast: {
      loginSuccess: "Login successful! Redirecting...",
      registerSuccess: "Registration successful! Redirecting...",
      copySuccess: "Email copied to clipboard"
    }
  },
  ZH: {
    navBackToHome: "返回首页",
    welcomeBack: "欢迎回来",
    startSurviving: "开始存活",
    loginSubtitle: "继续你的动画受难之旅",
    registerSubtitle: "注册以开启生存状态监测",
    usernameLabel: "用户名",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    forgotPassword: "忘记密码？",
    loginBtn: "登录",
    registerBtn: "创建账户",
    processing: "处理中...",
    noAccount: "还没有账号？",
    hasAccount: "已经有账号了？",
    registerNow: "立即注册",
    loginNow: "立即登录",
    resetPassword: "重置密码",
    resetPasswordDesc: "需要重置密码？请联系管理员：",
    resetPasswordNote: "管理员将协助您完成密码重置流程",
    backToLogin: "返回登录",
    loginSuccess: "登录成功！",
    registerSuccess: "注册成功！",
    fillAllFields: "请填写所有必填字段",
    authFailed: "认证失败，请重试",
    networkError: "网络错误，请检查连接后重试",
    placeholderUsername: "K帧高手",
    placeholderEmail: "animator@rualive.com",
    placeholderPassword: "•••••••••",
    footerCopy: "© 2026 RuAlive@烟囱鸭. 活着，为了做动画.",
    toast: {
      loginSuccess: "登录成功！正在跳转...",
      registerSuccess: "注册成功！正在跳转...",
      copySuccess: "邮箱已复制到剪贴板"
    }
  }
};

// 加载翻译文件
const loadTranslations = async (lang: 'EN' | 'ZH'): Promise<any> => {
  try {
    const langCode = lang.toLowerCase();
    const response = await fetch(`/locals/auth/${langCode}.json`);
    if (!response.ok) {
      console.error(`Failed to load ${lang} translations`);
      return DEFAULT_TRANS[lang];
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${lang} translations:`, error);
    return DEFAULT_TRANS[lang];
  }
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'EN' | 'ZH'>(() => {
    // 从URL参数或localStorage读取语言，默认为中文
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'en' || urlLang === 'EN') return 'EN';
    if (urlLang === 'zh' || urlLang === 'ZH') return 'ZH';
    const savedLang = localStorage.getItem('rualive_lang');
    return (savedLang === 'EN' || savedLang === 'ZH') ? savedLang : 'ZH';
  });
  const [trans, setTrans] = useState<any>(DEFAULT_TRANS[lang]);
  const popupId = useRef(0);
  const formRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  // 加载翻译
  useEffect(() => {
    const loadTranslationsAsync = async () => {
      const data = await loadTranslations(lang);
      if (data) {
        setTrans(data);
        localStorage.setItem('rualive_lang', lang);
      }
    };
    loadTranslationsAsync();
  }, [lang]);

  // 从URL参数读取mode，自动切换到注册模式
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    }
  }, []);

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
    setError(null);
    if (window.gsap && formRef.current) {
      window.gsap.to(formRef.current,
        { opacity: 0, x: isLogin ? -20 : 20, duration: 0.3, ease: "power2.in",
          onComplete: () => {
            setIsLogin(!isLogin);
            window.gsap.fromTo(formRef.current,
              { opacity: 0, x: isLogin ? 20 : -20 },
              { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
            );
          }
        }
      );
    } else {
      setIsLogin(!isLogin);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = {
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      ...(!isLogin ? {
        username: (form.elements.namedItem('username') as HTMLInputElement).value
      } : {})
    };

    // 简单验证
    if (!formData.email || !formData.password) {
      setError(trans.fillAllFields);
      setIsLoading(false);
      return;
    }

    try {
      const workerUrl = window.location.origin;
      const endpoint = isLogin ? `${workerUrl}/api/auth/login` : `${workerUrl}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // 保存 token 和用户信息
        if (data.token) {
          localStorage.setItem('rualive_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('rualive_user', JSON.stringify(data.user));
        }

        // 确保 trans.toast 存在
        const toastMessage = trans.toast?.loginSuccess || trans.loginSuccess || '登录成功！';
        success(isLogin ? toastMessage : (trans.toast?.registerSuccess || trans.registerSuccess || '注册成功！'));

        // 跳转到管理后台或用户页面
        if (data.user && data.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/user';
        }
      } else {
        setError(data.error || data.message || trans.authFailed);
      }
    } catch (err) {
      console.error('[Auth] Network error:', err);
      setError(trans.networkError);
    } finally {
      setIsLoading(false);
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

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[60] h-14 flex items-center bg-dark/20 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8">
              <RuaLogo className="w-full h-full" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">RuAlive</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-primary transition-all">
              {trans.navBackToHome}
            </a>
            <button
              onClick={() => setLang(l => l === 'ZH' ? 'EN' : 'ZH')}
              className="hover:bg-white/10 transition-colors border border-white/10 px-2 py-0.5 rounded text-[9px] uppercase font-bold"
            >
              {lang === 'zh' ? 'EN' : 'ZH'}
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div ref={formRef} className="glass-card rounded-[2rem] p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-2">
              {isLogin ? trans.welcomeBack : trans.startSurviving}
              <span className="text-primary">.</span>
            </h2>
            <p className="text-white/40 text-xs font-bold italic uppercase tracking-wider">
              {isLogin ? trans.loginSubtitle : trans.registerSubtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{trans.usernameLabel}</label>
                <input
                  type="text"
                  name="username"
                  placeholder={trans.placeholderUsername}
                  className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{trans.emailLabel}</label>
              <input
                type="email"
                name="email"
                placeholder={trans.placeholderEmail}
                className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{trans.passwordLabel}</label>
                {isLogin && (
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[9px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary transition-colors"
                    disabled={isLoading}
                  >
                    {trans.forgotPassword}
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                placeholder={trans.placeholderPassword}
                className="input-field w-full h-12 px-4 rounded-xl font-bold text-sm"
                autoComplete={isLogin ? "current-password" : "new-password"}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-primary hover:bg-primary-light text-white h-14 rounded-2xl font-black italic uppercase tracking-wider text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? trans.processing : (isLogin ? trans.loginBtn : trans.registerBtn)}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/30 text-[11px] font-bold italic">
              {isLogin ? trans.noAccount : trans.hasAccount}
              <button
                onClick={toggleMode}
                className="ml-2 text-primary hover:text-primary-light font-black uppercase underline decoration-primary/20"
                disabled={isLoading}
              >
                {isLogin ? trans.registerNow : trans.loginNow}
              </button>
            </p>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="mt-8 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] italic">
            {trans.footerCopy}
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div
            ref={formRef}
            className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 lg:p-12 w-full max-w-[95vw] sm:max-w-md shadow-2xl relative"
          >
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/20 rounded-full mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.667 15h4.666" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-1 sm:mb-2">
                {trans.resetPassword}
                <span className="text-primary">.</span>
              </h3>
              <p className="text-white/40 text-[10px] sm:text-xs font-bold italic uppercase tracking-wider hidden sm:block">
                PASSWORD RESET PROTOCOL
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/80 text-xs sm:text-sm font-mono text-center leading-relaxed">
                  {trans.resetPasswordDesc}
                </p>
                <p className="text-primary font-black text-base sm:text-lg text-center mt-2 sm:mt-3">
                  2655283737@qq.com
                </p>
              </div>

              <div className="text-center">
                <p className="text-white/30 text-[10px] sm:text-[11px] font-bold italic">
                  {trans.resetPasswordNote}
                </p>
              </div>

              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all"
              >
                {trans.backToLogin}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<AuthPage />);