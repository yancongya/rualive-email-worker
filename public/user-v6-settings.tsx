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
    weekDays: ["S", "M", "T", "W", "T", "F", "S"],
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
    changePassword: "CHANGE PASSWORD",
    currentPassword: "CURRENT PASSWORD",
    newPassword: "NEW PASSWORD",
    confirmPassword: "CONFIRM PASSWORD",
    passwordUpdateSuccess: "PASSWORD UPDATED SUCCESSFULLY",
    passwordUpdateFailed: "PASSWORD UPDATE FAILED",
    passwordsDoNotMatch: "PASSWORDS DO NOT MATCH",
    passwordTooShort: "PASSWORD MUST BE AT LEAST 6 CHARACTERS",
    incorrectPassword: "INCORRECT CURRENT PASSWORD",
    passwordUpdating: "UPDATING PASSWORD...",
    cancel: "CANCEL",
    save: "SAVE",
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
    changePassword: "修改密码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    passwordUpdateSuccess: "密码更新成功",
    passwordUpdateFailed: "密码更新失败",
    passwordsDoNotMatch: "两次输入的密码不一致",
    passwordTooShort: "密码长度至少需要6个字符",
    incorrectPassword: "当前密码不正确",
    passwordUpdating: "正在更新密码...",
    cancel: "取消",
    save: "保存",
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
  const [hStr] = (value || '00:00').split(':');
  const h = parseInt(hStr, 10) || 0;

  const updateTime = (newH: number) => {
    const formattedH = newH.toString().padStart(2, '0');
    onChange(`${formattedH}:00`);
  };

  const adjustH = useCallback((dir: 1 | -1) => {
    const next = (h + dir + 24) % 24;
    updateTime(next);
  }, [h, updateTime]);

  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <label className="text-[10px] text-ru-textMuted font-mono uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={12} className="text-ru-primary" />}
        {label}
      </label>
      
      <div className="bg-black/20 border border-white/10 rounded-sm p-4 flex items-center justify-center gap-2 md:gap-4 relative overflow-hidden group hover:border-white/20 transition-all touch-none">
         <div className="absolute inset-0 bg-ru-primary/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
         
         <TimeDigit value={hStr} onChange={adjustH} />

         <div className="text-2xl font-mono font-bold text-ru-textMuted/50 pb-2 z-10 select-none">:</div>

         <div className="text-2xl font-mono font-bold text-ru-textMuted/50 pb-2 z-10 select-none">00</div>
      </div>
      
      <div className="text-[9px] text-ru-textDim text-center mt-1">
        仅支持小时选择，分钟固定为00
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

/**
 * 更新当前用户信息
 */
async function updateCurrentUser(username: string) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update current user:', error);
    throw error;
  }
}

/**
 * 修改密码
 */
async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
}

/**
 * 用户登出
 */
async function logoutUser() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    // 清除本地存储的token
    localStorage.removeItem('rualive_token');
    
    // 跳转到登录页
    window.location.href = '/login';
  } catch (error) {
    console.error('Failed to logout:', error);
    // 即使API调用失败，也清除本地token并跳转
    localStorage.removeItem('rualive_token');
    window.location.href = '/login';
  }
}

export const SettingsView = ({ lang }: { lang: LangType }) => {
  const t = S_TRANS[lang];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testSending, setTestSending] = useState<'operator' | 'proxy' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  // 修改密码状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleLogout = async () => {
    if (confirm(lang === 'ZH' ? '确定要登出吗？' : 'Are you sure you want to logout?')) {
      await logoutUser();
    }
  };

  const handleChangePassword = async () => {
    // 验证表单
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t.passwordsDoNotMatch);
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setFeedback(t.passwordUpdating);

      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      // 清空表单并关闭模态窗
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);

      setFeedback(t.passwordUpdateSuccess);
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      setPasswordError(error.message || t.passwordUpdateFailed);
      setFeedback(null);
    } finally {
      setPasswordLoading(false);
    }
  };

  // 配置状态
  const [config, setConfig] = useState({
    enabled: true,
    sendTime: '22:00',
    timezone: 'Asia/Shanghai',
    emergency_email: '',
    emergency_name: '',
    min_work_hours: 8,
    min_keyframes: 50,
    min_json_size: 10,
    user_notification_time: '01:00',
    emergency_notification_time: '22:00',
    enable_emergency_notification: true,
    notification_schedule: [1, 2, 3, 4, 5],
    notification_excluded_days: []
  });

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 自动检测用户时区
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
            timezone: detectedTimezone, // 使用自动检测的时区
            emergency_email: userConfig.emergency_email || '',
            emergency_name: userConfig.emergency_name || '',
            min_work_hours: userConfig.min_work_hours === 2 ? 8 : (userConfig.min_work_hours || 8),
            min_keyframes: userConfig.min_keyframes || 50,
            min_json_size: userConfig.min_json_size || 10,
            user_notification_time: userConfig.user_notification_time || '01:00',
            emergency_notification_time: userConfig.emergency_notification_time || '22:00',
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
        user_notification_hour: parseInt(config.user_notification_time.split(':')[0]) || 1,
        emergency_notification_hour: parseInt(config.emergency_notification_time.split(':')[0]) || 22,
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

  const handleUpdateUsername = async () => {
    try {
      // 验证用户名
      const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
      if (!usernameRegex.test(tempUsername)) {
        setUsernameError('用户名只能包含字母、数字、下划线和中文');
        return;
      }
      
      if (tempUsername.length < 2) {
        setUsernameError('用户名至少需要2个字符');
        return;
      }
      
      if (tempUsername.length > 20) {
        setUsernameError('用户名不能超过20个字符');
        return;
      }
      
      setUsernameError(null);
      
      const result = await updateCurrentUser(tempUsername);
      
      if (result.success) {
        setCurrentUser(result.user);
        setEditingUsername(false);
        setFeedback('用户名更新成功');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setUsernameError(result.error || '更新失败');
      }
    } catch (error: any) {
      setUsernameError(error.message || '更新失败');
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
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="w-32 border text-xs rounded-sm py-1 px-2 font-mono bg-white/5 border-white/10 text-white focus:outline-none focus:border-ru-primary/50 focus:bg-white/10"
                      placeholder="输入新用户名"
                      maxLength={20}
                    />
                    <button
                      onClick={handleUpdateUsername}
                      className="text-xs text-ru-primary hover:text-white transition-colors"
                      title="保存"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setTempUsername(currentUser?.username || '');
                        setUsernameError(null);
                      }}
                      className="text-xs text-ru-textMuted hover:text-white transition-colors"
                      title="取消"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white">{currentUser?.username || '-'}</span>
                    <button
                      onClick={() => {
                        setEditingUsername(true);
                        setTempUsername(currentUser?.username || '');
                        setUsernameError(null);
                      }}
                      className="text-xs text-ru-textMuted hover:text-ru-primary transition-colors"
                      title="编辑用户名"
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
              {usernameError && (
                <div className="text-[10px] text-red-400 font-mono">
                  {usernameError}
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.email}</span>
                <span className="text-xs font-mono text-white">{currentUser?.email || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.role}</span>
                <span className="text-xs font-bold text-ru-primary">{currentUser?.role || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.lastLogin}</span>
                <span className="text-xs font-mono text-ru-textMuted">
                  {currentUser?.last_login ? new Date(currentUser.last_login).toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-ru-textMuted">{t.minWorkHours}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.min_work_hours}
                    onChange={(e) => handleChange('min_work_hours', e.target.value)}
                    className="w-16 border text-xs rounded-sm py-1 px-2 font-mono text-right bg-white/5 border-white/10 text-ru-primary focus:outline-none focus:border-ru-primary/50 focus:bg-white/10"
                    min="1"
                    max="24"
                  />
                  <span className="text-xs font-mono text-ru-textMuted">h</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-ru-textMuted">{t.timezone}</span>
                <span className="text-xs font-mono text-white flex items-center gap-1">
                  <Globe size={12} className="text-ru-primary" />
                  {config.timezone}
                </span>
              </div>
              
              {/* Logout Button */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ru-primary/10 border border-ru-primary/30 text-ru-primary text-sm font-bold rounded-sm hover:bg-ru-primary/20 hover:border-ru-primary/50 hover:text-white transition-all"
                >
                  <Lock size={16} />
                  {t.changePassword}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-sm hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all"
                >
                  <Power size={16} />
                  {lang === 'ZH' ? '登出' : 'LOGOUT'}
                </button>
              </div>
            </div>
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-ru-glass border border-ru-glassBorder rounded-[2rem] p-8 sm:p-12 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError(null);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-ru-primary/20 rounded-full mb-4">
                <Lock size={32} className="text-ru-primary" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-2">
                {t.changePassword}
                <span className="text-ru-primary">.</span>
              </h3>
              <p className="text-white/40 text-xs font-bold italic uppercase tracking-wider">
                PASSWORD_UPDATE_PROTOCOL
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ru-textMuted ml-1 block mb-2">
                  {t.currentPassword}
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-ru-primary/50 focus:bg-white/10 transition-all"
                  placeholder="•••••••••"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ru-textMuted ml-1 block mb-2">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-ru-primary/50 focus:bg-white/10 transition-all"
                  placeholder="•••••••••"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ru-textMuted ml-1 block mb-2">
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-ru-primary/50 focus:bg-white/10 transition-all"
                  placeholder="•••••••••"
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 font-mono">
                  {passwordError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all"
                  disabled={passwordLoading}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ru-primary hover:bg-[#ff8559] text-black text-sm font-bold rounded-xl shadow-lg shadow-ru-primary/30 transition-all disabled:opacity-70 disabled:pointer-events-none"
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      {t.passwordUpdating}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {t.save}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};