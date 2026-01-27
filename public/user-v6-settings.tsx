import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, Mail, Bell, ShieldAlert, Save, Zap, Check, AlertTriangle, 
  RefreshCw, Clock, Calendar, ToggleLeft, ToggleRight, Activity,
  Lock, Power, Smartphone, Globe, ChevronUp, ChevronDown
} from 'lucide-react';

type LangType = 'EN' | 'ZH';

const S_TRANS = {
  EN: {
    identityProtocol: "IDENTITY PROTOCOL",
    synchronization: "SYNCHRONIZATION",
    failsafeProtocol: "FAILSAFE PROTOCOL",
    systemDiagnostics: "SYSTEM DIAGNOSTICS",
    operatorName: "OPERATOR NAME",
    emailAddr: "EMAIL ADDRESS",
    enableSync: "ACTIVATE SYNC",
    syncTime: "SYNC TIME",
    reminderSchedule: "REMINDER SCHEDULE",
    proxyName: "PROXY CONTACT",
    proxyEmail: "PROXY EMAIL",
    inactivityThreshold: "INACTIVITY THRESHOLD (HRS)",
    proxyPingTime: "PROXY PING TIME",
    pingOperator: "PING OPERATOR",
    pingProxy: "PING PROXY",
    updateConfig: "UPDATE CONFIG",
    configSaved: "CONFIG UPDATED // REBOOTING WORKER...",
    signalSent: "SIGNAL SENT // AWAITING ACK...",
    saving: "WRITING TO MEMORY...",
    sending: "TRANSMITTING...",
    testEmailSubject: "TEST SIGNAL",
    active: "ACTIVE",
    inactive: "OFFLINE",
    generalSettings: "GENERAL SETTINGS",
    notifications: "NOTIFICATIONS",
    security: "SECURITY",
    smtpStatus: "SMTP_SERVER_STATUS",
    cronStatus: "CRON_JOB_SCHEDULER",
    lastSync: "LAST_SYNC",
    failsafeWarning: "WARNING: Proxy contact will be notified if no activity is detected within the threshold period. Ensure proxy consent has been obtained.",
    systemSubtitle: "SYSTEM_CONFIG_V6.2.0 // ROOT_ACCESS_GRANTED",
    on: "ON",
    off: "OFF",
    weekDays: ["S", "M", "T", "W", "T", "F", "S"] // Sun, Mon, Tue...
  },
  ZH: {
    identityProtocol: "身份协议",
    synchronization: "同步提醒",
    failsafeProtocol: "故障保护协议",
    systemDiagnostics: "系统诊断",
    operatorName: "操作员名称",
    emailAddr: "邮箱地址",
    enableSync: "激活同步",
    syncTime: "同步时间",
    reminderSchedule: "提醒周期",
    proxyName: "紧急联系人",
    proxyEmail: "联系人邮箱",
    inactivityThreshold: "静默阈值 (小时)",
    proxyPingTime: "提醒时间",
    pingOperator: "测试操作员",
    pingProxy: "测试联系人",
    updateConfig: "更新配置",
    configSaved: "配置已更新 // 正在重启进程...",
    signalSent: "信号已发送 // 等待响应...",
    saving: "写入内存中...",
    sending: "信号传输中...",
    testEmailSubject: "测试信号",
    active: "运行中",
    inactive: "离线",
    generalSettings: "通用设置",
    notifications: "通知设定",
    security: "安全设置",
    smtpStatus: "SMTP 服务器状态",
    cronStatus: "定时任务调度器",
    lastSync: "上次同步时间",
    failsafeWarning: "警告：若静默时间超过阈值，将通知紧急联系人。请确保已获得联系人授权。",
    systemSubtitle: "系统配置_V6.2.0 // 已获取最高权限",
    on: "开启",
    off: "关闭",
    weekDays: ["日", "一", "二", "三", "四", "五", "六"]
  }
};

// Reusable Input Component
const SettingInput = ({ label, value, onChange, type = "text", icon: Icon, placeholder, readOnly = false }: any) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 ${readOnly ? 'text-ru-textMuted/50' : 'text-ru-textMuted'}`}>
      {Icon && <Icon size={12} className={readOnly ? "text-ru-textMuted/50" : "text-ru-primary"} />}
      {label}
    </label>
    <div className="relative group">
      <input 
        type={type}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        className={`
          w-full border text-sm rounded-sm py-2.5 px-3 font-mono transition-all placeholder:text-white/20
          ${readOnly 
            ? 'bg-white/5 border-white/5 text-ru-textDim/50 cursor-not-allowed select-none' 
            : 'bg-white/5 border-white/10 text-white focus:outline-none focus:border-ru-primary/50 focus:bg-white/10'
          }
        `}
      />
      {!readOnly && (
        <div className="absolute bottom-0 left-0 h-[1px] bg-ru-primary w-0 group-focus-within:w-full transition-all duration-500"></div>
      )}
      {readOnly && (
        <div className="absolute right-3 top-2.5">
            <Lock size={14} className="text-white/20" />
        </div>
      )}
    </div>
  </div>
);

// Reusable Toggle Component
const SettingToggle = ({ label, checked, onChange, onText, offText }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 mb-2">
    <span className="text-[10px] text-ru-textDim font-mono uppercase tracking-wider">{label}</span>
    <button 
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 transition-colors ${checked ? 'text-ru-primary' : 'text-ru-textMuted'}`}
    >
      <span className="text-[10px] font-bold">{checked ? onText : offText}</span>
      {checked ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
    </button>
  </div>
);

// Helper for wheel events
const TimeDigit = ({ value, onChange }: { value: string, onChange: (dir: 1 | -1) => void }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            onChange(e.deltaY < 0 ? 1 : -1);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [onChange]);

    return (
        <div className="flex flex-col items-center gap-1 z-10 group/digit">
            <button 
                onClick={() => onChange(1)}
                className="text-white/20 hover:text-ru-primary hover:bg-white/5 w-full flex justify-center rounded transition-all active:scale-95 py-1"
            >
                <ChevronUp size={20} />
            </button>
            <div 
                ref={ref}
                className="bg-[#050505] border border-white/10 group-hover/digit:border-white/30 rounded px-3 py-2 min-w-[4rem] text-center shadow-inner shadow-black/50 cursor-ns-resize select-none transition-colors"
            >
                <span className="text-3xl md:text-4xl font-mono font-black text-white tracking-widest">{value}</span>
            </div>
            <button 
                onClick={() => onChange(-1)}
                className="text-white/20 hover:text-ru-primary hover:bg-white/5 w-full flex justify-center rounded transition-all active:scale-95 py-1"
            >
                <ChevronDown size={20} />
            </button>
        </div>
    );
};

// Digital Clock Style Time Selector
const DigitalTimeSelector = ({ label, value, onChange, icon: Icon }: any) => {
  const [hStr, mStr] = (value || '00:00').split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const updateTime = (newH: number, newM: number) => {
    const formattedH = newH.toString().padStart(2, '0');
    const formattedM = newM.toString().padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const adjustH = useCallback((dir: 1 | -1) => {
    const next = (h + dir + 24) % 24;
    updateTime(next, m);
  }, [h, m, updateTime]);

  const adjustM = useCallback((dir: 1 | -1) => {
    const next = (m + dir + 60) % 60;
    updateTime(h, next);
  }, [h, m, updateTime]);

  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <label className="text-[10px] text-ru-textMuted font-mono uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={12} className="text-ru-primary" />}
        {label}
      </label>
      
      <div className="bg-black/20 border border-white/10 rounded-sm p-4 flex items-center justify-center gap-2 md:gap-4 relative overflow-hidden group hover:border-white/20 transition-all touch-none">
         <div className="absolute inset-0 bg-ru-primary/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
         
         <TimeDigit value={hStr} onChange={adjustH} />

         <div className="text-2xl font-mono font-bold text-ru-textMuted/50 pb-2 animate-pulse z-10 select-none">:</div>

         <TimeDigit value={mStr} onChange={adjustM} />
      </div>
    </div>
  );
};

// Day Selector Component
const DaySelector = ({ value, onChange, lang }: { value: number[], onChange: (v: number[]) => void, lang: LangType }) => {
  // Display order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  const t = S_TRANS[lang];

  const toggleDay = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day));
    } else {
      onChange([...value, day].sort());
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[10px] text-ru-textMuted font-mono uppercase tracking-widest flex items-center gap-2">
        <Calendar size={12} className="text-ru-primary" />
        {t.reminderSchedule}
      </label>
      <div className="flex justify-between gap-1">
        {displayOrder.map((day) => {
          const isActive = value.includes(day);
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`
                flex-1 aspect-square md:aspect-auto md:h-10 flex items-center justify-center rounded-sm text-sm font-bold font-mono transition-all duration-200 border
                ${isActive 
                  ? 'bg-ru-primary text-black border-ru-primary shadow-[0_0_10px_-3px_#FF6B35]' 
                  : 'bg-white/5 text-ru-textMuted border-transparent hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {t.weekDays[day]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const SettingsView = ({ lang }: { lang: LangType }) => {
  const t = S_TRANS[lang];
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testSending, setTestSending] = useState<'operator' | 'proxy' | null>(null);

  // Mock State
  const [config, setConfig] = useState({
    operatorName: 'Pilot_01',
    email: 'pilot@rualive.sys',
    syncActive: true,
    syncTime: '09:00',
    cronDays: [1, 2, 3, 4, 5], // Default: Mon-Fri
    proxyName: 'Cmdr_Shepard',
    proxyEmail: 'command@alliance.nav',
    proxyThreshold: 48,
    proxyPingTime: '20:00'
  });

  const handleChange = (key: string, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    setLoading(true);
    setFeedback(t.saving);
    setTimeout(() => {
      setLoading(false);
      setFeedback(t.configSaved);
      setTimeout(() => setFeedback(null), 3000);
    }, 1500);
  };

  const handleTestEmail = (target: 'operator' | 'proxy') => {
    setTestSending(target);
    setTimeout(() => {
      setTestSending(null);
      setFeedback(`${t.signalSent} [${target.toUpperCase()}]`);
      setTimeout(() => setFeedback(null), 3000);
    }, 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-24 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/10 pb-4 gap-4 md:gap-0">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-ru-primary/10 rounded border border-ru-primary/30 text-ru-primary">
             <Activity size={20} className="animate-pulse-slow" />
           </div>
           <div>
             <h2 className="text-xl font-black italic font-sans text-white uppercase tracking-tighter">
                {t.generalSettings}
             </h2>
             <p className="text-[10px] font-mono text-ru-textMuted">
                {t.systemSubtitle}
             </p>
           </div>
        </div>
        
        {feedback && (
          <div className="flex items-center gap-2 text-xs font-mono text-ru-primary animate-pulse bg-ru-primary/5 px-3 py-2 rounded border border-ru-primary/20 w-full md:w-auto justify-center">
             <Check size={14} />
             {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Column 1: Identity & Notifications */}
        <div className="space-y-4 md:space-y-6">
           <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <User size={64} />
              </div>
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                 <Lock size={14} className="text-ru-primary" />
                 {t.identityProtocol}
              </h3>
              
              <SettingInput 
                label={t.operatorName} 
                icon={User}
                value={config.operatorName} 
                onChange={(v: string) => handleChange('operatorName', v)} 
              />
              <SettingInput 
                label={t.emailAddr} 
                icon={Mail}
                type="email"
                value={config.email} 
                readOnly={true}
                onChange={(v: string) => handleChange('email', v)} 
              />
           </div>

           <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                 <Bell size={14} className="text-ru-primary" />
                 {t.synchronization}
              </h3>

              <SettingToggle 
                 label={t.enableSync} 
                 checked={config.syncActive} 
                 onChange={(v: boolean) => handleChange('syncActive', v)} 
                 onText={t.on}
                 offText={t.off}
              />
              
              <div className={`transition-all duration-300 ${config.syncActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <DigitalTimeSelector 
                    label={t.syncTime} 
                    icon={Clock}
                    value={config.syncTime} 
                    onChange={(v: string) => handleChange('syncTime', v)} 
                />
                
                <DaySelector 
                  value={config.cronDays} 
                  onChange={(v) => handleChange('cronDays', v)}
                  lang={lang}
                />
              </div>
           </div>
        </div>

        {/* Column 2: Failsafe */}
        <div className="space-y-4 md:space-y-6">
            <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors h-full">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <ShieldAlert size={64} className="text-red-500" />
              </div>
              
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                 <ShieldAlert size={14} className="text-red-500" />
                 {t.failsafeProtocol}
              </h3>

              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded mb-6 text-[10px] text-red-200/80 font-mono leading-relaxed">
                 {t.failsafeWarning}
              </div>
              
              <SettingInput 
                label={t.proxyName} 
                icon={User}
                value={config.proxyName} 
                onChange={(v: string) => handleChange('proxyName', v)} 
              />
              <SettingInput 
                label={t.proxyEmail} 
                icon={Mail}
                type="email"
                value={config.proxyEmail} 
                onChange={(v: string) => handleChange('proxyEmail', v)} 
              />
              
              <div className="grid grid-cols-1 gap-4 mt-6">
                 <SettingInput 
                    label={t.inactivityThreshold} 
                    icon={Power}
                    type="number"
                    value={config.proxyThreshold} 
                    onChange={(v: string) => handleChange('proxyThreshold', v)} 
                />
                <DigitalTimeSelector 
                    label={t.proxyPingTime} 
                    icon={Clock}
                    value={config.proxyPingTime} 
                    onChange={(v: string) => handleChange('proxyPingTime', v)} 
                />
              </div>
           </div>
        </div>

        {/* Column 3: Diagnostics & Actions */}
        <div className="space-y-4 md:space-y-6">
           <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors h-full flex flex-col">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                 <Zap size={14} className="text-ru-primary" />
                 {t.systemDiagnostics}
              </h3>

              <div className="flex-1 flex flex-col gap-3">
                 <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded">
                    <span className="text-xs font-mono text-ru-textDim">{t.smtpStatus}</span>
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{t.active}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded">
                    <span className="text-xs font-mono text-ru-textDim">{t.cronStatus}</span>
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{t.active}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded">
                    <span className="text-xs font-mono text-ru-textDim">{t.lastSync}</span>
                    <span className="text-[10px] font-mono text-ru-textMuted">2026-01-26 09:00:00</span>
                 </div>
              </div>

              <div className="mt-8 space-y-3">
                 <button 
                    onClick={() => handleTestEmail('operator')}
                    disabled={!!testSending}
                    className="w-full flex items-center justify-between px-4 py-4 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-xs font-bold text-white rounded transition-all group disabled:opacity-50 touch-manipulation"
                 >
                    <span className="flex items-center gap-2">
                        <Mail size={14} className="text-ru-textMuted group-hover:text-white transition-colors" />
                        {testSending === 'operator' ? t.sending : t.pingOperator}
                    </span>
                    <Globe size={14} className="text-ru-primary opacity-50 group-hover:opacity-100" />
                 </button>

                 <button 
                    onClick={() => handleTestEmail('proxy')}
                    disabled={!!testSending}
                    className="w-full flex items-center justify-between px-4 py-4 md:py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-xs font-bold text-red-100 rounded transition-all group disabled:opacity-50 touch-manipulation"
                 >
                    <span className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-red-400/70 group-hover:text-red-400 transition-colors" />
                        {testSending === 'proxy' ? t.sending : t.pingProxy}
                    </span>
                    <Activity size={14} className="text-red-500 opacity-50 group-hover:opacity-100" />
                 </button>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                 <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-ru-primary hover:bg-[#ff8559] text-black font-black italic uppercase tracking-wider rounded-sm shadow-[0_0_20px_-5px_#FF6B35] hover:shadow-[0_0_30px_-5px_#FF6B35] transition-all transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none touch-manipulation"
                 >
                    {loading ? (
                        <>
                           <RefreshCw size={18} className="animate-spin" />
                           {t.saving}
                        </>
                    ) : (
                        <>
                           <Save size={18} />
                           {t.updateConfig}
                        </>
                    )}
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};