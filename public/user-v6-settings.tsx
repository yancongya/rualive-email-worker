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
    weekDays: ["S", "M", "T", "W", "T", "F", "S"], // Sun, Mon, Tue...
    timezone: "TIMEZONE",
    userNotificationTime: "USER NOTIFICATION TIME",
    enableEmergency: "ENABLE EMERGENCY CONTACT",
    workThresholds: "WORK THRESHOLDS",
    minWorkHours: "MIN WORK HOURS",
    minKeyframes: "MIN KEYFRAMES",
    minJsonSize: "MIN JSON SIZE (KB)",
    userInfo: "USER INFORMATION",
    username: "USERNAME",
    email: "EMAIL",
    role: "ROLE",
    createdAt: "CREATED AT",
    lastLogin: "LAST LOGIN",
    loadError: "LOAD ERROR",
    saveError: "SAVE ERROR",
    sendError: "SEND ERROR"
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
    weekDays: ["日", "一", "二", "三", "四", "五", "六"],
    timezone: "时区",
    userNotificationTime: "用户通知时间",
    enableEmergency: "启用紧急联系人",
    workThresholds: "工作阈值",
    minWorkHours: "最小工作小时",
    minKeyframes: "最小关键帧",
    minJsonSize: "最小JSON大小 (KB)",
    userInfo: "用户信息",
    username: "用户名",
    email: "邮箱",
    role: "角色",
    createdAt: "创建时间",
    lastLogin: "最后登录",
    loadError: "加载失败",
    saveError: "保存失败",
    sendError: "发送失败"
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

// Timezone Selector Component
const TimezoneSelector = ({ label, value, onChange, icon: Icon }: any) => {
  const timezones = [
    { value: 'Asia/Shanghai', label: '北京 (UTC+8)' },
    { value: 'Asia/Tokyo', label: '东京 (UTC+9)' },
    { value: 'America/New_York', label: '纽约 (UTC-5)' },
    { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8)' },
    { value: 'Europe/London', label: '伦敦 (UTC+0)' },
    { value: 'Europe/Paris', label: '巴黎 (UTC+1)' },
    { value: 'Australia/Sydney', label: '悉尼 (UTC+11)' },
    { value: 'UTC', label: 'UTC (UTC+0)' }
  ];

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[10px] text-ru-textMuted font-mono uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={12} className="text-ru-primary" />}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border text-sm rounded-sm py-2.5 px-3 font-mono transition-all bg-white/5 border-white/10 text-white focus:outline-none focus:border-ru-primary/50 focus:bg-white/10"
      >
        {timezones.map(tz => (
          <option key={tz.value} value={tz.value} className="bg-gray-800">
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * 安全解析JSON
 */
function safeParseJSON(jsonString: string | null | undefined, defaultValue: any) {
  if (!jsonString) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return defaultValue;
  }
}

/**
 * API工具函数
 */

const API_BASE = window.location.origin;

/**
 * 获取认证头
 */
function getAuthHeader() {
  const token = localStorage.getItem('rualive_token');
  return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };
}

/**
 * 获取用户配置
 */
async function fetchUserConfig() {
  try {
    const response = await fetch(`${API_BASE}/api/config`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch user config:', error);
    throw error;
  }
}

/**
 * 保存用户配置
 */
async function saveUserConfig(config: any) {
  try {
    const response = await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save user config:', error);
    throw error;
  }
}

/**
 * 获取当前用户信息
 */
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    throw error;
  }
}

/**
 * 发送测试邮件
 */
async function sendTestEmail(target: 'operator' | 'proxy') {
  try {
    // 将 target 映射为后端期望的 recipient
    const recipient = target === 'proxy' ? 'emergency' : 'user';
    
    const response = await fetch(`${API_BASE}/api/send-now`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(recipient ? { recipient } : {})
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
}

export const SettingsView = ({ lang }: { lang: LangType }) => {
  const t = S_TRANS[lang];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testSending, setTestSending] = useState<'operator' | 'proxy' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 配置状态
  const [config, setConfig] = useState({
    enabled: true,
    sendTime: '22:00',
    timezone: 'Asia/Shanghai',
    emergency_email: '',
    emergency_name: '',
    min_work_hours: 2,
    min_keyframes: 50,
    min_json_size: 10,
    user_notification_time: '22:00',
    emergency_notification_time: '20:00',
    enable_emergency_notification: true,
    notification_schedule: [1, 2, 3, 4, 5],
    notification_excluded_days: []
  });

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 并行加载用户信息和配置
        const [user, userConfig] = await Promise.all([
          fetchCurrentUser(),
          fetchUserConfig()
        ]);

        setCurrentUser(user);

        // 更新配置状态
        if (userConfig) {
          setConfig({
            enabled: userConfig.enabled ?? true,
            sendTime: userConfig.sendTime || '22:00',
            timezone: userConfig.timezone || 'Asia/Shanghai',
            emergency_email: userConfig.emergency_email || '',
            emergency_name: userConfig.emergency_name || '',
            min_work_hours: userConfig.min_work_hours || 2,
            min_keyframes: userConfig.min_keyframes || 50,
            min_json_size: userConfig.min_json_size || 10,
            user_notification_time: userConfig.user_notification_time || '22:00',
            emergency_notification_time: userConfig.emergency_notification_time || '20:00',
            enable_emergency_notification: userConfig.enable_emergency_notification ?? true,
            notification_schedule: safeParseJSON(userConfig.notification_schedule, [1, 2, 3, 4, 5]),
            notification_excluded_days: safeParseJSON(userConfig.notification_excluded_days, [])
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setFeedback(t.loadError);
        setTimeout(() => setFeedback(null), 3000);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [t]);

  const handleChange = (key: string, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(t.saving);

      // 准备要保存的配置
      const configToSave = {
        enabled: config.enabled,
        sendTime: config.sendTime,
        timezone: config.timezone,
        emergency_email: config.emergency_email || null,
        emergency_name: config.emergency_name || null,
        min_work_hours: config.min_work_hours,
        min_keyframes: config.min_keyframes,
        min_json_size: config.min_json_size,
        user_notification_time: config.user_notification_time,
        emergency_notification_time: config.emergency_notification_time,
        enable_emergency_notification: config.enable_emergency_notification,
        notification_schedule: JSON.stringify(config.notification_schedule),
        notification_excluded_days: JSON.stringify(config.notification_excluded_days)
      };

      // 调用API保存
      await saveUserConfig(configToSave);

      setFeedback(t.configSaved);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setFeedback(t.saveError);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (target: 'operator' | 'proxy') => {
    try {
      setTestSending(target);
      setFeedback(t.sending);

      await sendTestEmail(target);

      setFeedback(`${t.signalSent} [${target.toUpperCase()}]`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to send test email:', error);
      setFeedback(t.sendError);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setTestSending(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-24">
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
          <div className="flex items-center gap-2 text-xs font-mono text-ru-primary animate-pulse bg-ru-primary/5 px-3 py-2 rounded border border-ru-primary/20">
            <Check size={14} />
            {feedback}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={40} className="animate-spin text-ru-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 max-w-2xl mx-auto">
          {/* User Information Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
              <User size={14} className="text-ru-primary" />
              {t.userInfo}
            </h3>

            {/* User Info Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.username}</span>
                <span className="text-xs font-mono text-white">{currentUser?.username || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.email}</span>
                <span className="text-xs font-mono text-white">{currentUser?.email || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.role}</span>
                <span className="text-xs font-bold text-ru-primary">{currentUser?.role || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-ru-textMuted">{t.lastLogin}</span>
                <span className="text-xs font-mono text-ru-textMuted">
                  {currentUser?.last_login ? new Date(currentUser.last_login).toLocaleString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Timezone Settings Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
              <Globe size={14} className="text-ru-primary" />
              {t.timezone}
            </h3>

            <TimezoneSelector
              label={t.timezone}
              icon={Globe}
              value={config.timezone}
              onChange={(v: string) => handleChange('timezone', v)}
            />
          </div>

          {/* Synchronization Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                <Bell size={14} className="text-ru-primary" />
                {t.synchronization}
              </h3>

              <SettingToggle
                label={t.enableSync}
                checked={config.enabled}
                onChange={(v: boolean) => handleChange('enabled', v)}
                onText={t.on}
                offText={t.off}
              />

              <div className={`transition-all duration-300 ${config.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <DigitalTimeSelector
                  label={t.userNotificationTime}
                  icon={Clock}
                  value={config.user_notification_time}
                  onChange={(v: string) => handleChange('user_notification_time', v)}
                />

                <DaySelector
                  value={config.notification_schedule}
                  onChange={(v) => handleChange('notification_schedule', v)}
                  lang={lang}
                />
              </div>
            </div>

          {/* Failsafe Protocol Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                <ShieldAlert size={14} className="text-red-500" />
                {t.failsafeProtocol}
              </h3>

              <SettingToggle
                label={t.enableEmergency}
                checked={config.enable_emergency_notification}
                onChange={(v: boolean) => handleChange('enable_emergency_notification', v)}
                onText={t.on}
                offText={t.off}
              />

              <div className={`transition-all duration-300 ${config.enable_emergency_notification ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded mb-6 text-[10px] text-red-200/80 font-mono leading-relaxed">
                  {t.failsafeWarning}
                </div>

                <SettingInput
                  label={t.proxyName}
                  icon={User}
                  value={config.emergency_name}
                  onChange={(v: string) => handleChange('emergency_name', v)}
                />
                <SettingInput
                  label={t.proxyEmail}
                  icon={Mail}
                  type="email"
                  value={config.emergency_email}
                  onChange={(v: string) => handleChange('emergency_email', v)}
                />

                <DigitalTimeSelector
                  label={t.emergency_notification_time}
                  icon={Clock}
                  value={config.emergency_notification_time}
                  onChange={(v: string) => handleChange('emergency_notification_time', v)}
                />
              </div>
            </div>

          {/* Work Thresholds Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                <Activity size={14} className="text-ru-primary" />
                {t.workThresholds}
              </h3>

              <SettingInput
                label={t.minWorkHours}
                icon={Clock}
                type="number"
                value={config.min_work_hours}
                onChange={(v: string) => handleChange('min_work_hours', v)}
              />
              <SettingInput
                label={t.minKeyframes}
                icon={Activity}
                type="number"
                value={config.min_keyframes}
                onChange={(v: string) => handleChange('min_keyframes', v)}
              />
              <SettingInput
                label={t.minJsonSize}
                icon={Globe}
                type="number"
                value={config.min_json_size}
                onChange={(v: string) => handleChange('min_json_size', v)}
              />
            </div>

          {/* System Diagnostics Card */}
          <div className="bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md flex flex-col">
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
              </div>

              {/* Test Email Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleTestEmail('operator')}
                  disabled={!!testSending}
                  className="w-full flex items-center justify-between px-4 py-4 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-xs font-bold text-white rounded transition-all group disabled:opacity-50"
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
                  className="w-full flex items-center justify-between px-4 py-4 md:py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-xs font-bold text-red-100 rounded transition-all group disabled:opacity-50"
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
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-ru-primary hover:bg-[#ff8559] text-black font-black italic uppercase tracking-wider rounded-sm shadow-[0_0_20px_-5px_#FF6B35] hover:shadow-[0_0_30px_-5px_#FF6B35] transition-all transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {saving ? (
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
      )}
    </div>
  );
};