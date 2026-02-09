import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar, Legend
} from 'recharts';
import {
  LayoutGrid, Layers, Hexagon, Activity, Calendar as CalendarIcon,
  Globe, ChevronRight, X, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, RefreshCw,
  LineChart as LucideLineChart, BarChart3, Search, Table, TrendingUp,
  Clock, FileType, CheckSquare, Calendar, AlignLeft, BarChart2, Table as TableIcon,
  Folder, Settings, Bell, ShieldAlert, Send, Save, User, Mail, Zap, Eye, EyeOff,
  PanelLeftClose, PanelLeftOpen, LayoutDashboard, BarChart2 as BarChartIcon2,
  LogOut
} from 'lucide-react';
import { SettingsView } from './user-v6-settings';
import { RuaLogo } from './LogoAnimation';
import { getWorkLogs, getWorkLogsByRange, clearAllCache, clearCacheByType, getSystemInfo } from './src/api';
import { workLogToDailyData, aggregateWorkLogsByDate } from './src/dataTransform';
import { getAnalyticsData, getDateRange, aggregateWorkLogs } from './src/analyticsData';
import { AEStatus } from './src/types/api';

// --- UTILITY FUNCTIONS ---

const formatRuntimeCompact = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  else if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  else return `${(seconds / 3600).toFixed(1)}h`;
};

// 搬砖动画组件
const BrickLoader = () => {
  return (
    <div className="fixed bottom-0 right-0 pointer-events-none z-0 p-8 lg:p-12 opacity-30 mix-blend-screen">
      <svg width="120" height="120" viewBox="0 0 100 100" overflow="visible">
        {/* Set 1 */}
        <g>
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '0s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '0.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '0.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
        {/* Set 2 (Offset by 2s for continuous flow) */}
        <g>
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '2s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '2.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-ru-primary" style={{ animationDelay: '2.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};

// --- TYPES ---

export interface ProjectStats {
  compositions: number;
  layers: number;
  keyframes: number;
  effects: number;
}

export interface LayerDistribution {
  video: number;
  image: number;
  designFile: number;
  sourceFile: number;
  nullSolidLayer: number;
  [key: string]: number;
}

export interface KeyframeData {
  [layerName: string]: number;
}

export interface EffectCountData {
  [effectName: string]: number;
}

export interface ProjectDetails {
  compositions: string[];
  layers: LayerDistribution;
  keyframes: KeyframeData;
  effectCounts: EffectCountData;
}

export interface ProjectData {
  projectId: string;
  name: string;
  dailyRuntime: string;
  accumulatedRuntime: number; // in seconds
  statistics: ProjectStats;
  details: ProjectDetails;
}

export interface DailyData {
  date: string; // ISO format YYYY-MM-DD
  projects: ProjectData[];
}

export type LangType = 'EN' | 'ZH';
export type ViewType = 'dashboard' | 'analytics' | 'settings';
export type AnalyticsMode = 'chart' | 'table';
export type ViewMode = 'week' | 'month' | 'quarter' | 'year' | 'all';

// --- TRANSLATIONS ---

// 默认翻译（作为备用，防止异步加载时出现 null 错误）
const DEFAULT_USER_TRANS: any = {
  EN: {
    subtitle: "SYSTEM ONLINE // MONITORED",
    compositions: "COMPOSITIONS",
    totalLayers: "TOTAL LAYERS",
    keyframes: "KEYFRAMES",
    effects: "EFFECTS APPLIED",
    layerDist: "LAYER DISTRIBUTION",
    effectFreq: "EFFECT FREQUENCY",
    uniqueEffects: "UNIQUE EFFECTS",
    top8: "TOP 8",
    total: "TOTAL",
    keyframeDensity: "KEYFRAME DENSITY",
    activeComps: "ACTIVE COMPOSITIONS",
    items: "ITEMS",
    missionLog: "CALENDAR PANEL",
    retrieveData: "Select a date to retrieve data.",
    low: "Low",
    mid: "Med",
    high: "High",
    noDataTitle: "NO VITAL SIGNS DETECTED",
    noDataDesc: "Select a different date from the calendar.",
    id: "ID",
    jumpToday: "TODAY",
    video: "VIDEO",
    image: "IMAGE",
    sequence: "SEQUENCE",
    designFile: "FILE LAYER",
    sourceFile: "SOURCE FILE",
    nullSolidLayer: "NULL/SOLID",
    shapeLayer: "SHAPE LAYER",
    textLayer: "TEXT LAYER",
    adjustmentLayer: "ADJUSTMENT LAYER",
    lightLayer: "LIGHT LAYER",
    cameraLayer: "CAMERA LAYER",
    other: "OTHER",
    count: "COUNT",
    sortName: "NAME",
    sortValue: "VAL",
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    analytics: "ANALYTICS",
    dashboard: "DASHBOARD",
    runtime: "RUNTIME",
    viewweek: "WEEK",
    viewmonth: "MONTH",
    viewquarter: "QUARTER",
    viewyear: "YEAR",
    viewall: "ALL TIME",
    trendAnalysis: "TREND ANALYSIS",
    distribution: "DISTRIBUTION MATRIX",
    dailyDetails: "DAILY DETAILS",
    normalizeCurves: "NORMALIZE CURVES",
    normalized: "NORMALIZED",
    toggleSoloHint: "Left Click: Toggle / Right Click: Solo",
    viewweek_short: "WK",
    viewmonth_short: "MO",
    viewquarter_short: "QT",
    viewyear_short: "YR",
    viewall_short: "ALL",
    searchPlaceholder: "SEARCH PROJECT...",
    searchAnalyticsPlaceholder: "FILTER DATA...",
    viewChart: "CHART VIEW",
    viewTable: "DATA TABLE",
    chart: "CHART",
    table: "TABLE",
    page: "PAGE",
    of: "OF",
    projectCount: "PROJECT COUNT",
    settings: "SETTINGS",
    refresh: "REFRESH",
    refreshTooltip: "Refresh data from server",
    projectRuntimeGantt: "PROJECT RUNTIME GANTT",
    date: "DATE",
    days: "DAYS",
    noData: "No data available",
    loading: "Loading...",
    noHistory: "No history data",
    loadHistory: "Load History"
  },
  ZH: {
    subtitle: "",
    compositions: "合成数量",
    totalLayers: "图层总数",
    keyframes: "关键帧数",
    effects: "特效应用",
    layerDist: "图层类型分布",
    effectFreq: "特效使用频率",
    uniqueEffects: "独立特效",
    top8: "前8名",
    total: "总计",
    keyframeDensity: "关键帧密度",
    activeComps: "活跃合成",
    items: "项",
    missionLog: "日历面板",
    retrieveData: "选择日期以读取数据。",
    low: "低",
    mid: "中",
    high: "高",
    noDataTitle: "未检测到生命体征",
    noDataDesc: "请从日历中选择其他日期。",
    id: "编号",
    jumpToday: "回到今日",
    video: "视频素材",
    image: "图片素材",
    sequence: "序列",
    designFile: "文件图层",
    sourceFile: "源文件",
    nullSolidLayer: "纯色/空对象",
    shapeLayer: "形状图层",
    textLayer: "文字图层",
    adjustmentLayer: "调整图层",
    lightLayer: "灯光图层",
    cameraLayer: "摄像机图层",
    other: "其他",
    count: "数量",
    sortName: "名称",
    sortValue: "数值",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    analytics: "数据分析",
    dashboard: "监控看板",
    runtime: "运行时长",
    viewweek: "周视图",
    viewmonth: "月视图",
    viewquarter: "季视图",
    viewyear: "年视图",
    viewall: "全部",
    trendAnalysis: "趋势分析",
    distribution: "分布矩阵",
    dailyDetails: "每日详情",
    normalizeCurves: "归一化曲线",
    normalized: "已归一化",
    toggleSoloHint: "左键：切换 / 右键：独显",
    viewweek_short: "周",
    viewmonth_short: "月",
    viewquarter_short: "季",
    viewyear_short: "年",
    viewall_short: "全",
    searchPlaceholder: "搜索项目名称...",
    searchAnalyticsPlaceholder: "筛选数据...",
    viewChart: "图表视图",
    viewTable: "数据列表",
    chart: "图表",
    table: "列表",
    page: "页",
    of: "/",
    projectCount: "项目数量",
    settings: "系统设置",
    refresh: "刷新",
    refreshTooltip: "从服务器刷新数据",
    projectRuntimeGantt: "项目运行甘特图",
    date: "日期",
    days: "天",
    noData: "暂无数据",
    loading: "加载中...",
    noHistory: "暂无历史数据",
    loadHistory: "加载历史"
  }
};

// 翻译加载函数
export const loadUserTranslations = async (lang: 'EN' | 'ZH'): Promise<any> => {
  try {
    // 将语言代码转换为小写以匹配文件名
    const langCode = lang.toLowerCase();
    const response = await fetch(`/locals/user/${langCode}.json`);
    if (!response.ok) {
      console.error(`Failed to load ${lang} translations`);
      return DEFAULT_USER_TRANS[lang];
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${lang} translations:`, error);
    return DEFAULT_USER_TRANS[lang];
  }
};

// --- CONSTANTS & GENERATORS REMOVED ---
// Mock data generators have been removed - now using real API data

// --- ANALYTICS DATA GENERATORS (Removed - using real data) ---

const formatDate = (d: Date) => d.toISOString().split('T')[0];

// --- HELPER COMPONENTS ---

export const NumberTicker = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 600; // ms
    const startValue = displayValue;
    const endValue = value;
    
    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.floor(startValue + (endValue - startValue) * ease);
      setDisplayValue(current);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
};

// 侧边栏导航组件
export const Sidebar = ({
    currentView,
    trans,
    isCollapsed,
    onToggleCollapse,
}: {
    currentView: ViewType,
    trans: any,
    isCollapsed: boolean,
    onToggleCollapse: () => void,
}) => {
    const navItems = [
        { id: 'dashboard' as ViewType, label: trans.dashboard, icon: LayoutDashboard },
        { id: 'analytics' as ViewType, label: trans.analytics, icon: BarChartIcon2 },
        { id: 'settings' as ViewType, label: trans.settings, icon: Settings },
    ];

    const handleNavClick = (id: ViewType) => {
        window.location.hash = id;
    };

    const handleLogout = () => {
        if (confirm(trans.logoutConfirm || '确定要登出吗？')) {
            localStorage.removeItem('rualive_token');
            localStorage.removeItem('rualive_user');
            window.location.href = '/login';
        }
    };

    return (
        <aside className={`
            fixed left-0 top-0 h-full z-50 border-r border-white/10 bg-black/40 backdrop-blur-xl
            flex flex-col transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-16' : 'w-64'}
        `}>
            {/* Logo 区域 */}
            <div className="h-16 flex items-center justify-center border-b border-white/5">
                <div className="flex items-center gap-2">
                    <RuaLogo className="w-8 h-6 text-ru-primary" />
                    {!isCollapsed && (
                        <span className="text-lg font-black italic tracking-tighter">RuAlive</span>
                    )}
                </div>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 py-6 px-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                                ${isActive
                                    ? 'bg-ru-primary text-black'
                                    : 'text-ru-textDim hover:text-white hover:bg-white/5'
                                }
                            `}
                            title={item.label}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* 底部按钮区域 */}
            <div className="p-2 border-t border-white/5 space-y-1">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    title={trans.logout || '登出'}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">{trans.logout || '登出'}</span>}
                </button>
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-ru-textDim hover:text-white hover:bg-white/5 transition-all"
                    title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    {!isCollapsed && <span className="font-bold text-sm">折叠</span>}
                </button>
            </div>
        </aside>
    );
};

// 移动端底部导航栏
export const MobileBottomNav = ({
    currentView,
    trans,
}: {
    currentView: ViewType,
    trans: any,
}) => {
    const navItems = [
        { id: 'dashboard' as ViewType, label: trans.dashboard, icon: LayoutDashboard },
        { id: 'analytics' as ViewType, label: trans.analytics, icon: BarChartIcon2 },
        { id: 'settings' as ViewType, label: trans.settings, icon: Settings },
    ];

    const handleNavClick = (id: ViewType) => {
        window.location.hash = id;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200
                                ${isActive ? 'text-ru-primary' : 'text-ru-textDim'}
                            `}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export const Header = ({
    lang,
    setLang,
    trans,
    dateDisplay,
    onCalendarClick,
    searchQuery,
    setSearchQuery,
    onRefresh,
    onNavigate,
    onNavigateView,
    currentUser,
    workLogs,
}: {
    lang: LangType,
    setLang: React.Dispatch<React.SetStateAction<LangType>>;
    trans: any;
    dateDisplay?: string;
    onCalendarClick?: () => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    onRefresh?: () => void;
    onNavigate?: (view: string) => void;
    onNavigateView?: (view: ViewType) => void;
    currentUser?: any;
    workLogs?: any[],
}) => {
    const [aeStatus, setAeStatus] = useState<AEStatus | null>(null);

    useEffect(() => {
        // 获取系统信息
        getSystemInfo().then(response => {
            if (response.success && response.data) {
                setAeStatus(response.data);
            }
        }).catch(error => {
            console.error('Failed to load system info:', error);
        });
    }, []);

    // 处理头像点击事件
    const handleAvatarClick = () => {
        if (onNavigateView) {
            onNavigateView('settings');
        }
    };

    return (
            <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-40 gap-2 md:gap-4 overflow-x-auto">
            {/* 统一的一行布局 - 所有组件都在同一行 */}
            <div className="flex items-center gap-1.5 md:gap-2.5 min-w-max">
                {/* 头像 */}
                <div
                    className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-2 border-ru-primary rounded-full group cursor-pointer flex-shrink-0"
                    onClick={handleAvatarClick}
                    title={trans.settings || '设置'}
                >
                    <span className="font-bold text-sm md:text-base">{currentUser?.username?.[0]?.toUpperCase() || 'U'}</span>
                    <div className="absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
                </div>
    
                {/* 运行天数 */}
                {workLogs && workLogs.length > 0 && (
                    <button
                        onClick={onCalendarClick}
                        className="flex items-center gap-1 px-1.5 py-1 text-[8px] md:text-xs font-bold font-mono rounded bg-ru-primary/20 border border-ru-primary/40 text-ru-primary hover:bg-ru-primary/30 transition-all shrink-0"
                        title={trans.missionLog || '任务日志'}
                    >
                        <span className="hidden md:inline opacity-70">{trans.workDaysPrefix || '苟活'}</span>
                        <span>{workLogs.length}</span>
                        <span>{trans.day || '天'}</span>
                    </button>
                )}
    
                {/* AE 版本 */}
                {aeStatus?.ae_version && (
                    <button className="flex items-center gap-0.5 px-1.5 py-1 text-[8px] md:text-[9px] font-bold font-mono rounded bg-ru-primary/10 border border-ru-primary/30 text-ru-primary hover:bg-ru-primary/20 transition-all shrink-0">
                        <span className="opacity-70">AE</span>
                        <span className="hidden md:inline">{aeStatus.ae_version}</span>
                    </button>
                )}
    
                {/* 操作系统 */}
                {aeStatus?.os_name && (
                    <button className="flex items-center gap-1 px-1 py-1 text-[8px] md:text-[9px] font-mono rounded bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all shrink-0">
                        {aeStatus.os_name.toLowerCase().includes('windows') || aeStatus.os_name.toLowerCase().includes('win') ? (
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M412.224 511.904c-47.712-24.512-94.08-36.96-137.888-36.96-5.952 0-11.936 0.192-17.952 0.704-55.872 4.608-106.912 19.36-139.744 30.816-8.704 3.2-17.632 6.56-26.816 10.304L0 828.192c61.696-22.848 116.288-33.952 166.272-33.952 80.832 0 139.52 30.208 188 61.312 22.976-77.92 78.048-266.08 94.496-322.336C436.8 525.952 424.672 518.656 412.224 511.904zM528.352 591.072l-90.432 314.144c26.848 15.36 117.088 64.064 186.208 64.064 55.808 0 118.24-14.304 190.848-43.808l86.368-301.984c-58.624 18.912-114.88 28.512-167.456 28.512C637.888 652.032 570.72 620.928 528.352 591.072zM292.832 368.8c77.12 0.8 134.144 30.208 181.408 60.512l92.736-317.344c-19.552-11.2-70.816-39.104-107.872-48.608-24.384-5.696-50.016-8.608-77.216-8.608-51.808 0.96-108.384 13.952-172.896 39.808l-88.448 310.592c64.8-24.448 120.64-36.352 172.096-36.352C292.736 368.8 292.832 368.8 292.832 368.8zM1024 198.112c-58.816 22.848-116.192 34.464-171.04 34.464-91.68 0-159.296-31.808-203.104-62.368L557.92 488.448c61.76 39.712 128.288 59.872 198.112 59.872 56.96 0 115.936-13.664 175.456-40.704l-0.192-2.208 3.744-0.896L1024 198.112z" fill="#1296db"/>
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M849.124134 704.896288c-1.040702 3.157923-17.300015 59.872622-57.250912 118.190843-34.577516 50.305733-70.331835 101.018741-126.801964 101.909018-55.532781 0.976234-73.303516-33.134655-136.707568-33.134655-63.323211 0-83.23061 32.244378-135.712915 34.110889-54.254671 2.220574-96.003518-54.951543-130.712017-105.011682-70.934562-102.549607-125.552507-290.600541-52.30118-416.625816 36.040844-63.055105 100.821243-103.135962 171.364903-104.230899 53.160757-1.004887 103.739712 36.012192 136.028093 36.012192 33.171494 0 94.357018-44.791136 158.90615-38.089503 27.02654 1.151219 102.622262 11.298324 151.328567 81.891102-3.832282 2.607384-90.452081 53.724599-89.487104 157.76107C739.079832 663.275355 847.952448 704.467523 849.124134 704.896288M633.69669 230.749408c29.107945-35.506678 48.235584-84.314291 43.202964-132.785236-41.560558 1.630127-92.196819 27.600615-122.291231 62.896492-26.609031 30.794353-50.062186 80.362282-43.521213 128.270409C557.264926 291.935955 604.745311 264.949324 633.69669 230.749408" fill="#ffffff"/>
                            </svg>
                        )}
                        <span className="hidden md:inline">{aeStatus.os_name}</span>
                    </button>
                )}
    
                {/* 更新时间 */}
                {aeStatus?.updated_at && (
                    <button className="flex items-center gap-1 px-1 py-1 text-[8px] md:text-[9px] font-mono rounded bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all shrink-0">
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="hidden md:inline">
                            {new Date(aeStatus.updated_at).toLocaleDateString('zh-CN', { 
                                month: '2-digit', 
                                day: '2-digit' 
                            }).replace(/\//g, '/')} {new Date(aeStatus.updated_at).toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                            })}
                        </span>
                        <span className="md:hidden">
                            {new Date(aeStatus.updated_at).toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                            })}
                        </span>
                    </button>
                )}
    
                {/* 搜索框 */}
                <div className="relative group w-20 md:w-32 transition-all focus-within:w-32 md:focus-within:w-48 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-ru-textMuted group-focus-within:text-ru-primary transition-colors">
                        <Search size={12} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={trans.searchPlaceholder}
                        className="w-full bg-white/5 border border-white/10 text-white text-[9px] md:text-xs rounded-sm py-1 pl-6 pr-2 focus:outline-none focus:border-ru-primary/50 focus:bg-white/10 transition-all font-mono placeholder:text-ru-textMuted/50"
                    />
                </div>
    
                {/* 刷新按钮 */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded bg-white/5 border border-white/10 text-ru-textDim hover:text-white hover:bg-white/10 transition-all shrink-0"
                        title={trans.refreshTooltip}
                    >
                        <RotateCcw size={14} />
                    </button>
                )}
    
                {/* 语言切换按钮 */}
                <button
                    onClick={() => setLang(l => l === 'EN' ? 'ZH' : 'EN')}
                    className="flex items-center justify-center gap-1 px-2 py-1 w-7 h-7 md:w-auto md:h-8 rounded bg-white/5 border border-white/10 text-[9px] md:text-xs font-bold text-ru-textDim hover:text-white hover:bg-white/10 transition-all shrink-0"
                >
                    <Globe size={14} />
                    <span className="hidden md:inline">{lang}</span>
                </button>
            </div>
        </header>
      );
    };
export const BouncyDot = (props: any) => {
  const { cx, cy, stroke } = props;
  return (
    <g className="pointer-events-none">
       <circle 
          cx={cx} cy={cy} r={6} 
          fill={stroke} 
          stroke="#fff" strokeWidth={2}
          className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center scale-0 animate-[popup_0.4s_ease-out_forwards]"
          style={{ transformBox: 'fill-box' }}
       />
       <circle 
          cx={cx} cy={cy} r={12} 
          fill="none" 
          stroke={stroke} strokeWidth={1}
          className="opacity-40"
       />
    </g>
  );
};


// --- SHARED UI COMPONENTS ---

interface DashboardPanelProps {
    title: string;
    count: number | React.ReactNode;
    countLabel: string;
    children: React.ReactNode;
    extraAction?: React.ReactNode;
    className?: string;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ title, count, countLabel, children, extraAction, className = "h-[400px]" }) => (
    <div className={`bg-ru-glass border border-ru-glassBorder px-2 py-2 md:px-4 md:py-4 rounded-sm backdrop-blur-md flex flex-col hover:border-white/20 transition-colors duration-300 ${className}`}>
       <div className="flex justify-between items-end mb-2 md:mb-3 border-b border-white/10 pb-1 flex-shrink-0">
         <div className="flex items-center gap-1.5 md:gap-3">
             <h3 className="text-xs md:text-base font-bold italic font-sans text-white truncate">{title}</h3>
             {extraAction}
         </div>
         <div className="text-[10px] md:text-xs font-mono text-ru-primary flex items-baseline gap-0.5 md:gap-1">
            <span className="text-white font-bold text-sm md:text-lg">
              {typeof count === 'number' ? <NumberTicker value={count} /> : count}
            </span>
            <span className="opacity-70 hidden sm:inline">{countLabel}</span>
         </div>
       </div>
       <div className="flex-1 min-h-0 relative">
          {children}
       </div>
    </div>
);

const VitalCard = ({ label, value, icon: Icon, delay }: { label: string, value: number, icon: any, delay: number }) => (
  <div 
    className="relative group overflow-hidden bg-ru-glass border border-ru-glassBorder p-3 md:p-6 rounded-sm backdrop-blur-md transition-all duration-500 hover:border-ru-primary/50 hover:bg-white/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 p-1.5 md:p-4 opacity-20 group-hover:opacity-100 group-hover:text-ru-primary transition-all duration-300">
        <Icon size={20} className="md:w-8 md:h-8" strokeWidth={1.5} />
    </div>
    <h3 className="text-ru-textMuted uppercase text-[9px] md:text-xs font-bold tracking-widest mb-1 md:mb-2 font-sans truncate">{label}</h3>
    <div className="text-xl md:text-4xl font-mono font-black text-white group-hover:text-ru-primary transition-colors duration-300">
      <NumberTicker value={value} />
    </div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-ru-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
  </div>
);

interface ProjectSelectorProps {
  projects: ProjectData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  lang: LangType;
  anonymizeMode: boolean;
  onToggleAnonymize: () => void;
  onProjectClick?: (projectId: string, projectName: string) => void;
  projectsTotalHours: Map<string, number>;
  trans: any;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projects, selectedIndex, onSelect, anonymizeMode, onToggleAnonymize, onProjectClick, projectsTotalHours, trans }) => {
  // 脱敏函数：保留首尾字符，中间用星号替代
  const anonymizeName = (name: string) => {
    if (!name || name.length <= 2) return name;
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  // 用于检测移动端单击和桌面端双击
  const [clickTimeouts, setClickTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent, projectId: string, projectName: string) => {
    // 移动端：单击直接打开历史
    if ('ontouchstart' in window) {
      if (onProjectClick) onProjectClick(projectId, projectName);
      return;
    }

    // 桌面端：双击打开历史
    const existingTimeout = clickTimeouts.get(projectId);
    
    if (existingTimeout) {
      // 清除超时，这是双击
      clearTimeout(existingTimeout);
      const newTimeouts = new Map(clickTimeouts);
      newTimeouts.delete(projectId);
      setClickTimeouts(newTimeouts);
      
      // 双击：打开历史
      if (onProjectClick) onProjectClick(projectId, projectName);
    } else {
      // 这是第一次点击，设置超时
      const timeout = setTimeout(() => {
        // 超时后，这是单击（不执行任何操作）
        const newTimeouts = new Map(clickTimeouts);
        newTimeouts.delete(projectId);
        setClickTimeouts(newTimeouts);
      }, 300); // 300ms 用于区分单击和双击
      
      const newTimeouts = new Map(clickTimeouts);
      newTimeouts.set(projectId, timeout);
      setClickTimeouts(newTimeouts);
    }
  };

  return (
    <div className="w-full mb-4 md:mb-8">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="text-xs md:text-sm font-bold text-white/60 uppercase tracking-wider">
            {trans.projects || 'PROJECTS'}
          </span>
          <span className="text-[10px] md:text-xs font-mono text-white/30">
            ({projects.length})
          </span>
        </div>
        <button
          onClick={onToggleAnonymize}
          className={`flex items-center justify-center w-7 h-7 md:w-auto md:h-auto md:px-2 md:py-1 rounded transition-all duration-200 text-xs font-bold ${anonymizeMode ? 'text-ru-primary bg-ru-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title={anonymizeMode ? '关闭脱敏' : '开启脱敏'}
        >
          {anonymizeMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* 项目卡片列表 */}
      <div className="flex w-full gap-0.5 md:gap-1 h-14 md:h-24 overflow-x-auto">
        {projects.map((proj, idx) => {
          const isActive = idx === selectedIndex;
          const displayName = anonymizeMode ? anonymizeName(proj.name) : proj.name;

          return (
            <button
              key={proj.projectId}
              onClick={(e) => {
                onSelect(idx);
                if (onProjectClick) handleCardClick(e, proj.projectId, proj.name);
              }}
              style={{
                flex: `${projectsTotalHours.get(proj.projectId) || 0} 1 0px`,
                minWidth: '120px' // 设置最小宽度，确保项目名、运行时间和编号都能正常显示
              }}
              className={`
                relative h-full flex flex-col justify-between p-1.5 md:p-4 text-left transition-all duration-300 group
                border border-ru-glassBorder backdrop-blur-sm overflow-hidden
                ${isActive ? 'bg-white/10 border-white/40' : 'bg-ru-glass hover:bg-white/5'}
              `}
              title={onProjectClick ? `${trans.doubleClickProject || '双击查看项目历史'}` : undefined}
            >
              <div className="flex justify-between items-start w-full">
                 <span className={`text-[10px] md:text-sm font-bold truncate pr-1 md:pr-2 ${isActive ? 'text-white' : 'text-ru-textDim'}`}>
                   {displayName}
                 </span>
                 {isActive && <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-ru-primary shadow-[0_0_10px_#FF6B35] flex-shrink-0"></div>}
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-end w-full mt-auto">
                 <span className="text-[9px] md:text-xs font-mono text-ru-primary truncate block">{formatRuntimeCompact((projectsTotalHours.get(proj.projectId) || 0) * 3600)}</span>
                 <span className="text-[8px] md:text-[10px] text-ru-textMuted uppercase tracking-wider hidden md:block truncate md:ml-2">{trans.id}: {proj.projectId}</span>
              </div>

              <div className={`absolute bottom-0 left-0 h-1 bg-ru-primary transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'}`} />
            </button>
          )
        })}
      </div>
    </div>
  );
};

export const LayerRadar = ({ data, trans }: { data: any, trans: any }) => {
  const chartData = useMemo(() => {
    // 过滤掉值为 0 的类别
    const filteredEntries = Object.entries(data).filter(([_, value]) => value > 0);

    if (filteredEntries.length === 0) return [];

    // 使用动态分档：根据实际数据范围计算相对值
    const values = filteredEntries.map(([_, value]) => value as number);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // 使用对数平滑，将数值映射到 4 个档位（1、2、3、4）
    const smoothValue = (value: number) => {
      const logValue = Math.log10(value + 1);
      const maxLog = Math.log10(maxValue + 1);
      const minLog = Math.log10(minValue + 1);

      // 归一化到 0-1 范围
      if (maxLog === minLog) return 2.5; // 如果所有值相同，返回中间值
      const normalized = (logValue - minLog) / (maxLog - minLog);

      // 映射到 4 个档位（1、2、3、4）
      // normalized: 0 → tier 1
      // normalized: 0.33 → tier 2
      // normalized: 0.67 → tier 3
      // normalized: 1 → tier 4
      return Math.round(normalized * 3) + 1;
    };

    return filteredEntries.map(([key, value]) => {
        const rawLabel = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        const mappedLabel = trans[key as keyof typeof TRANS.EN] || rawLabel;

        const tierValue = smoothValue(value as number);

        return {
            subject: `${mappedLabel}：${value}`,  // 在类型后面添加数量
            A: tierValue,
            fullMark: 4,
            rawValue: value,
            labelName: mappedLabel,  // 保留原始标签名
        };
    });
  }, [data, trans]);

  // 检测语言：通过trans.months是否包含中文"月"来判断
  const isChinese = trans.months && trans.months[0] && trans.months[0].includes('月');

  return (
    <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: isChinese ? 'Noto Sans SC' : 'Plus Jakarta Sans' }} />
          <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
          <Radar
            name={trans.totalLayers}
            dataKey="A"
            stroke="#FF6B35"
            strokeWidth={2}
            fill="#FF6B35"
            fillOpacity={0.3}
            activeDot={<BouncyDot />}
            isAnimationActive={true}
          />
          <Tooltip
             cursor={false}
             contentStyle={{ backgroundColor: '#050505', border: '1px solid #333' }}
             itemStyle={{ color: '#FF6B35' }}
             formatter={(value: any, name: string, props: any) => {
               // 显示原始值而不是档位值
               return [props.payload.rawValue, trans.count];
             }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EffectDonut = ({ data, trans }: { data: Record<string, number>, trans: any }) => {



  const [hoveredName, setHoveredName] = useState<string | null>(null);



  const scrollRef = useRef<HTMLDivElement>(null);



  const chartData = useMemo(() => {

    const entries = Object.entries(data);



    // 按数量降序排序

    entries.sort((a, b) => b[1] - a[1]);



    // 只显示 Top 12 高频特效

    const TOP_COUNT = 12;

    const topN = entries.slice(0, TOP_COUNT);



    return topN.map(([name, value]) => ({ name, value }));

  }, [data]);



  // 计算总数量（所有特效的使用次数总和）

  const total = Object.values(data).reduce((sum, value) => {

    const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;

    return sum + numValue;

  }, 0);



  // 默认显示总数，悬浮时显示当前项

  const activeItem = hoveredName ? chartData.find(d => d.name === hoveredName) : null;

  const displayData = activeItem || { name: trans.total, value: total };



  const COLORS = ['#FF6B35', '#E85A2D', '#D14925', '#BA381D', '#A32715', '#8C160D', '#750505', '#5E0000', '#FF8C42', '#FFA07A', '#FFB347', '#FFCC33'];



  const percentage = total > 0 ? ((displayData.value / total) * 100).toFixed(1) : '0.0';



  useEffect(() => {

    const el = scrollRef.current;

    if (!el) return;

    const onWheel = (e: WheelEvent) => {

      if (e.deltaY === 0) return;

      e.preventDefault();

      el.scrollLeft += e.deltaY;

    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => el.removeEventListener('wheel', onWheel);

  }, []);



  return (

    <div className="w-full h-full relative flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>

      <div className="relative w-full flex-1 min-h-0">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie

              data={chartData}

              cx="50%"

              cy="50%"

              innerRadius={60}

              outerRadius={90}

              paddingAngle={1}

              dataKey="value"

              stroke="none"

              onMouseEnter={(_, index) => setHoveredName(chartData[index].name)}

              onMouseLeave={() => setHoveredName(null)}

            >

              {chartData.map((entry, index) => (

                <Cell 

                  key={`cell-${index}`} 

                  fill={COLORS[index % COLORS.length]} 

                  className="transition-all duration-300 outline-none"

                  style={{ 

                      opacity: hoveredName && hoveredName !== entry.name ? 0.3 : 1,

                      filter: hoveredName === entry.name ? 'drop-shadow(0 0 4px rgba(255,107,53,0.5))' : 'none'

                  }}

                  stroke={hoveredName === entry.name ? '#FFF' : 'none'}

                  strokeWidth={2}

                />

              ))}

            </Pie>

          </PieChart>

        </ResponsiveContainer>

        



        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

          <span className="text-ru-textMuted text-xs uppercase tracking-wider mb-1 max-w-[80%] truncate">

            {displayData.name}

          </span>

          <span className="text-2xl font-mono font-black text-white">

            <NumberTicker value={displayData.value} />

          </span>

          <span className="text-[10px] text-ru-primary font-mono mt-1 bg-ru-primary/10 px-1 rounded">

             {percentage}%

          </span>

        </div>

      </div>

      

      <div 

         ref={scrollRef}

         className="w-full overflow-x-auto whitespace-nowrap pb-2 px-4 mt-2 h-8 scrollbar-none"

         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}

      >

          {chartData.map((entry, idx) => (

            <span 

                key={idx} 

                className={`inline-block mr-3 text-[10px] uppercase cursor-pointer transition-all duration-200 ${hoveredName === entry.name ? 'text-white font-bold scale-110' : 'text-ru-textDim hover:text-white'}`}

                onMouseEnter={() => setHoveredName(entry.name)}

                onMouseLeave={() => setHoveredName(null)}

            >

              <span className="inline-block w-2 h-2 mr-1 rounded-full" style={{backgroundColor: COLORS[idx]}}></span>

              {entry.name}

            </span>

          ))}

          <style>{`

             .scrollbar-none::-webkit-scrollbar {

               display: none;

             }

          `}</style>

      </div>

    </div>

  );

};

// 甘特图组件 - 显示项目运行时间（时间轴风格）
export const ProjectGanttChart = ({ 
  dailyStats, 
  trans,
  projectName
}: { 
  dailyStats: Array<{
    work_date: string;
    work_hours: number;
    accumulated_runtime: number;
    composition_count: number;
    layer_count: number;
    keyframe_count: number;
    effect_count: number;
  }>, 
  trans: any,
  projectName?: string
}) => {
  // 检测语言
  const isChinese = trans.compositions && /[\u4e00-\u9fa5]/.test(trans.compositions);

  // 数据转换：按日期排序并格式化为甘特图数据
  const chartData = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) return [];
    
    // 按日期升序排序
    const sorted = [...dailyStats].sort((a, b) => 
      new Date(a.work_date).getTime() - new Date(b.work_date).getTime()
    );
    
    // 格式化日期显示
    return sorted.map(stat => {
      const date = new Date(stat.work_date);
      const displayDate = isChinese
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : `${date.getMonth() + 1}/${date.getDate()}`;
      
      // 根据运行时长设置颜色
      const hours = stat.work_hours || 0;
      let color = '#10b981'; // 绿色 - 短时长
      if (hours >= 1 && hours < 4) {
        color = '#f59e0b'; // 黄色 - 中等时长
      } else if (hours >= 4) {
        color = '#ef4444'; // 红色 - 长时长
      }

      return {
        date: displayDate,
        fullDate: stat.work_date,
        start: 0, // 从0点开始
        duration: hours, // 持续时间
        runtime: hours,
        keyframes: stat.keyframe_count || 0,
        compositions: stat.composition_count || 0,
        layers: stat.layer_count || 0,
        effects: stat.effect_count || 0,
        color,
        end: hours // 结束时间
      };
    });
  }, [dailyStats, trans, isChinese]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-ru-textMuted text-sm">
        {trans.noData || 'No data available'}
      </div>
    );
  }

  // 计算时间轴范围（0-24小时，或根据最大时长调整）
  const maxRuntime = Math.max(...chartData.map(d => d.runtime), 8); // 最小8小时范围

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 50, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={true} horizontal={false} />
          <XAxis 
            type="number"
            domain={[0, maxRuntime]}
            stroke="#666"
            tick={{ fill: '#666', fontSize: 9, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            ticks={[0, 4, 8, 12, 16, 20, 24].filter(t => t <= maxRuntime)}
            tickFormatter={(value) => `${value}h`}
          />
          <YAxis 
            type="category" 
            dataKey="date"
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            width={45}
            interval={0}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(5,5,5,0.95)', 
              borderColor: '#333', 
              color: '#fff', 
              borderRadius: '4px', 
              backdropFilter: 'blur(8px)',
              fontSize: 11,
              fontFamily: 'monospace'
            }}
            itemStyle={{ 
              fontSize: 11, 
              fontFamily: 'monospace', 
              paddingTop: '2px', 
              paddingBottom: '2px' 
            }}
            labelStyle={{ 
              color: '#888', 
              marginBottom: '8px', 
              fontSize: '11px', 
              fontWeight: 'bold' 
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return `${trans.date || 'Date'}: ${payload[0].payload.fullDate}`;
              }
              return label;
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'duration') {
                const start = props.payload.start;
                const end = props.payload.end;
                return [`${start}h - ${end}h (${value.toFixed(2)}h)`, trans.runtime || 'Runtime'];
              }
              return [value, name];
            }}
          />
          <Bar 
            dataKey="duration" 
            radius={[0, 0, 0, 0]}
            isAnimationActive={true}
            animationDuration={500}
            minPointSize={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e: any) => {
                  e.target.style.opacity = '0.7';
                }}
                onMouseOut={(e: any) => {
                  e.target.style.opacity = '1';
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DataList = ({ data, trans, type = 'count', anonymizeMode = false }: { data: Record<string, number> | string[], trans: any, type?: 'count' | 'list', anonymizeMode?: boolean }) => {
  const [sortKey, setSortKey] = useState<'name' | 'value'>('value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // 脱敏函数
  const anonymizeName = (name: string): string => {
    if (!anonymizeMode) return name;
    if (name.length <= 3) {
      return '***';
    }
    // 保留首尾字符，中间用星号替代
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  const rawItems = useMemo(() => {
    if (Array.isArray(data)) {
        return data.map(item => ({ name: item, value: 0 }));
    }
    const entries = Object.entries(data);
    // 过滤掉值为 0 的项目，并按数量降序排序
    return entries
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  useEffect(() => {
      if (type === 'list') {
          setSortKey('name');
          setSortDir('asc');
      } else {
          setSortKey('value');
          setSortDir('desc');
      }
  }, [type, data]);

  // 检测语言：通过trans.compositions是否包含中文字符来判断
  const isChinese = trans.compositions && /[\u4e00-\u9fa5]/.test(trans.compositions);

  const sortedItems = useMemo(() => {
      const items = [...rawItems];
      items.sort((a, b) => {
          let res = 0;
          if (sortKey === 'name') {
              const nameA = a.name || '';
              const nameB = b.name || '';
              // 确保是字符串类型
              const stringA = String(nameA);
              const stringB = String(nameB);
              res = stringA.localeCompare(stringB, isChinese ? 'zh' : 'en');
          } else {
              res = (a.value || 0) - (b.value || 0);
          }
          return sortDir === 'asc' ? res : -res;
      });
      return items;
  }, [rawItems, sortKey, sortDir, trans]);

  const toggleSort = (key: 'name' | 'value') => {
      if (sortKey === key) {
          setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortDir(key === 'value' ? 'desc' : 'asc'); 
      }
  };

  const maxVal = rawItems.length > 0 ? Math.max(...rawItems.map(i => i.value)) : 0;
  const SortIcon = ({ active, dir }: { active: boolean, dir: 'asc' | 'desc' }) => {
      if (!active) return <ArrowUpDown size={10} className="opacity-30" />;
      return dir === 'asc' ? <ArrowUp size={10} className="text-ru-primary" /> : <ArrowDown size={10} className="text-ru-primary" />;
  };

  return (
    <div className="w-full h-full flex flex-col">
       <div className="flex justify-between items-center text-[10px] text-ru-textMuted uppercase tracking-wider mb-2 px-2 select-none">
           <button 
             onClick={() => toggleSort('name')} 
             className={`flex items-center gap-1 hover:text-white transition-colors ${sortKey === 'name' ? 'text-white font-bold' : ''}`}
           >
             {trans.sortName} <SortIcon active={sortKey === 'name'} dir={sortDir} />
           </button>
           
           {type === 'count' && (
             <button 
               onClick={() => toggleSort('value')} 
               className={`flex items-center gap-1 hover:text-white transition-colors ${sortKey === 'value' ? 'text-white font-bold' : ''}`}
             >
               {trans.sortValue} <SortIcon active={sortKey === 'value'} dir={sortDir} />
             </button>
           )}
       </div>

       <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar min-h-0">
          {sortedItems.map((item, idx) => (
            <div key={idx} className="group relative flex items-center justify-between text-xs font-mono hover:bg-white/5 p-1.5 rounded transition-colors">
               <span className="z-10 truncate text-ru-textDim group-hover:text-white w-2/3">{anonymizeName(item.name)}</span>
               {type === 'count' && (
                 <>
                  <span className="z-10 text-ru-primary font-bold">{item.value}</span>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-ru-primary/10 rounded"
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  />
                 </>
               )}
            </div>
          ))}
       </div>
    </div>
  );
};

const CalendarModal = ({ isOpen, onClose, onSelectDate, currentSelectedDate, trans }: any) => {
  if (!isOpen) return null;

  const SYSTEM_TODAY = new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(new Date(currentSelectedDate || SYSTEM_TODAY));
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [monthlyData, setMonthlyData] = useState<Record<string, { heat: number; projects: number }>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load monthly data when view date changes
  useEffect(() => {
    if (isOpen && viewMode === 'month') {
      loadMonthlyData();
    }
  }, [isOpen, viewDate, viewMode]);

  useEffect(() => {
    if (isOpen) {
        setViewDate(new Date(currentSelectedDate || SYSTEM_TODAY));
        setViewMode('month');
    }
  }, [isOpen, currentSelectedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const loadMonthlyData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;

      const response = await getWorkLogsByRange(startDate, endDate, true); // Enable cache

      if (response.success && response.data) {
        const dataMap: Record<string, { heat: number; projects: number }> = {};
        response.data.forEach((log: any) => {
          const workHours = log.work_hours || 0;
          const projectCount = log.project_count || 0;
          dataMap[log.work_date] = {
            heat: workHours * 3600, // Convert hours to seconds
            projects: projectCount
          };
        });
        setMonthlyData(dataMap);
      } else {
        setMonthlyData({});
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      setMonthlyData({});
    } finally {
      setIsLoading(false);
    }
  }; 

  const handlePrev = () => {
    const d = new Date(viewDate);
    if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
    } else {
        d.setFullYear(d.getFullYear() - 1);
    }
    setViewDate(d);
  };

  const handleNext = () => {
    const d = new Date(viewDate);
    if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
    } else {
        d.setFullYear(d.getFullYear() + 1);
    }
    setViewDate(d);
  };

  const jumpToToday = () => {
      setViewDate(new Date(SYSTEM_TODAY));
      setViewMode('month');
      onSelectDate(SYSTEM_TODAY); 
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); 
  
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ type: 'pad', id: `pad-${i}` });
  }
  for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = (currentMonth + 1).toString().padStart(2, '0');
      const dayStr = i.toString().padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      
      const dayData = monthlyData[dateStr];
      const hasData = dayData && dayData.heat > 0;
      const heat = hasData ? dayData.heat : 0;
      
      calendarCells.push({ type: 'day', day: i, dateStr, heat });
  }

  const weekDays = trans.months[0].includes('月') 
    ? ['日','一','二','三','四','五','六']
    : ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="w-[95%] max-w-[420px] bg-[#0A0A0A] border border-ru-primary/30 p-5 shadow-[0_0_50px_rgba(255,107,53,0.1)] relative overflow-hidden rounded-lg flex flex-col">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(0deg,transparent_24%,rgba(255,107,53,.3)_25%,rgba(255,107,53,.3)_26%,transparent_27%,transparent_74%,rgba(255,107,53,.3)_75%,rgba(255,107,53,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,107,53,.3)_25%,rgba(255,107,53,.3)_26%,transparent_27%,transparent_74%,rgba(255,107,53,.3)_75%,rgba(255,107,53,.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
        <button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-ru-primary z-20 transition-colors">
          <X size={18} />
        </button>

        <div className="flex flex-col gap-1 mb-4 relative z-10">
            <h2 className="text-lg font-black italic font-sans text-white uppercase">{trans.missionLog}</h2>
            <div className="flex items-center justify-between w-full mt-2">
                 <button onClick={handlePrev} className="p-1.5 border border-white/10 hover:border-ru-primary text-ru-textDim hover:text-white rounded transition-colors"><ChevronLeft size={16}/></button>
                 <button 
                    onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
                    className="font-mono text-ru-primary font-bold text-sm hover:text-white hover:underline decoration-ru-primary underline-offset-4 transition-all"
                 >
                    {viewMode === 'month' 
                        ? `${trans.months[currentMonth]} ${currentYear}`
                        : `${currentYear}`
                    }
                 </button>
                 <button onClick={handleNext} className="p-1.5 border border-white/10 hover:border-ru-primary text-ru-textDim hover:text-white rounded transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>

        <div className="relative z-10 min-h-[280px]">
           {viewMode === 'month' ? (
               <div className="grid grid-cols-7 gap-1">
                 {weekDays.map(d => (
                   <div key={d} className="text-center text-[10px] text-ru-textMuted font-bold mb-1 select-none">{d}</div>
                 ))}
                 {calendarCells.map((cell: any) => {
                     if (cell.type === 'pad') return <div key={cell.id}></div>;
                     
                     let bgClass = "bg-white/5";
                     let borderClass = "border-transparent";
                     let textClass = "text-ru-textDim";

                     if (cell.heat > 0) {
                         textClass = "text-white";
                         if (cell.heat < 25000) { 
                             bgClass = "bg-ru-primary/20"; 
                         } else if (cell.heat < 60000) { 
                             bgClass = "bg-ru-primary/60"; 
                         } else {
                             bgClass = "bg-ru-primary"; 
                             textClass = "text-black";
                         }
                     }

                     if (cell.dateStr === currentSelectedDate) {
                         borderClass = "border-white";
                         if(cell.heat === 0) textClass = "text-white";
                     }

                     return (
                         <button 
                            key={cell.dateStr}
                            onClick={() => {
                                if (cell.heat > 0) {
                                    onSelectDate(cell.dateStr);
                                    onClose();
                                }
                            }}
                            disabled={cell.heat === 0}
                            className={`
                                aspect-square relative flex items-center justify-center rounded-sm border ${borderClass}
                                ${bgClass}
                                transition-all duration-200 
                                ${cell.heat > 0 ? 'hover:scale-110 hover:z-10 cursor-pointer' : 'cursor-default opacity-50'}
                            `}
                         >
                            <span className={`text-[10px] font-bold font-mono ${textClass}`}>{cell.day}</span>
                            {cell.heat > 0 && <div className={`absolute bottom-1 right-1 w-1 h-1 rounded-full ${cell.heat > 55000 ? 'bg-black' : 'bg-white'}`}></div>}
                         </button>
                     )
                 })}
               </div>
           ) : (
               <div className="grid grid-cols-3 gap-2 h-full content-start">
                   {trans.months.map((m: string, idx: number) => {
                       const isActive = idx === currentMonth;
                       return (
                           <button
                             key={m}
                             onClick={() => {
                                 const d = new Date(viewDate);
                                 d.setMonth(idx);
                                 setViewDate(d);
                                 setViewMode('month');
                             }}
                             className={`
                                h-16 rounded border flex items-center justify-center text-sm font-bold font-mono transition-all
                                ${isActive ? 'bg-ru-primary text-black border-ru-primary' : 'bg-white/5 border-white/10 text-ru-textDim hover:border-white/50 hover:text-white'}
                             `}
                           >
                               {m}
                           </button>
                       )
                   })}
               </div>
           )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-[9px] text-ru-textMuted font-mono uppercase relative z-10">
           <button 
             onClick={jumpToToday}
             className="flex items-center gap-1.5 hover:text-white transition-colors group"
           >
              <RotateCcw size={10} className="group-hover:rotate-180 transition-transform duration-500"/>
              {trans.jumpToday}
           </button>

           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-ru-primary/20 rounded-full"></span> {trans.low}</div>
             <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-ru-primary/60 rounded-full"></span> {trans.mid}</div>
             <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-ru-primary rounded-full"></span> {trans.high}</div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- ANALYTICS VIEW COMPONENTS ---

const MetricToggle = ({ 
    active, 
    onClick, 
    onContextMenu,
    label, 
    value,
    formatValue,
    color, 
    icon: Icon, 
    hint 
}: { 
    active: boolean, 
    onClick: () => void, 
    onContextMenu: (e: React.MouseEvent) => void,
    label: string, 
    value: number,
    formatValue?: (v: number) => string,
    color: string, 
    icon: any,
    hint: string
}) => (
    <button 
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`
            relative flex items-center justify-center gap-2 px-2 py-3 rounded-sm border transition-all duration-300 group
            flex-1 min-w-0
            ${active 
                ? `bg-[${color}]/10 border-[${color}] text-white shadow-[0_0_15px_-5px_${color}]` 
                : 'bg-white/5 border-white/10 text-ru-textDim hover:bg-white/10 hover:border-white/20'
            }
        `}
        style={{ 
            borderColor: active ? color : undefined, 
        }}
        title={hint}
    >
        <Icon size={16} style={{ color: active ? color : undefined }} className={active ? "" : "opacity-60"} />
        
        <div className="flex flex-col items-start leading-none min-w-0 flex-1">
            <span className={`font-mono font-bold text-xs sm:text-sm ${active ? 'text-white' : 'text-ru-textDim'} truncate w-full text-left`}>
                {formatValue ? formatValue(value) : value.toLocaleString()}
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-60 hidden sm:block mt-0.5 truncate w-full text-left">
                {label}
            </span>
        </div>
    </button>
);

const ViewModeButton = ({ active, onClick, label, shortLabel }: { active: boolean, onClick: () => void, label: string, shortLabel: string }) => (
    <button 
        onClick={onClick}
        className={`
            flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] md:text-xs font-bold font-mono transition-all border-b-2 whitespace-nowrap
            ${active 
                ? 'text-ru-primary border-ru-primary bg-ru-primary/5' 
                : 'text-ru-textMuted border-transparent hover:text-white hover:bg-white/5'
            }
        `}
    >
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const OptionSwitch = ({ active, onClick, label, icon: Icon, hideLabelOnMobile = false }: any) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-300 text-xs font-bold font-mono uppercase tracking-wider
            ${active 
                ? 'text-ru-primary bg-ru-primary/10 border border-ru-primary/30' 
                : 'text-ru-textMuted hover:text-white border border-transparent hover:bg-white/5'
            }
        `}
        title={hideLabelOnMobile ? label : undefined}
    >
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-ru-primary shadow-[0_0_5px_#FF6B35]' : 'bg-white/20'}`} />
        <span className={hideLabelOnMobile ? "hidden sm:inline" : ""}>{label}</span>
        {hideLabelOnMobile && <Icon size={14} className="sm:hidden" />}
    </button>
);

const AnalyticsTable = ({
    data,
    trans,
    formatRuntime,
    onNavigate
}: {
    data: any[],
    trans: any,
    formatRuntime: (s: number) => string,
    onNavigate: (date: string, projectName?: string) => void
}) => {

    // 检测语言：通过trans.compositions是否包含中文字符来判断
    const isChinese = trans.compositions && /[\u4e00-\u9fa5]/.test(trans.compositions);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // 直接使用聚合数据，不再扁平化
    const sortedRows = useMemo(() => {
        let items = [...data];
        if (sortConfig !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key === 'periodLabel') {
                    aValue = a.isoDate || '';
                    bValue = b.isoDate || '';
                }
                // 处理字符串类型的排序
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return sortConfig.direction === 'asc' ? comparison : -comparison;
                }
                // 处理数字类型的排序
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, sortConfig]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(sortedRows.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const visibleRows = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedRows.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedRows, currentPage]);

    const handlePageChange = (dir: -1 | 1) => {
        setCurrentPage(p => Math.max(1, Math.min(totalPages, p + dir)));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey, align = 'left', colorClass = 'text-ru-textMuted', width }: any) => {
        const isActive = sortConfig?.key === sortKey;
        return (
            <th 
                className={`p-3 font-bold cursor-pointer transition-colors select-none group ${colorClass}`}
                style={{ width }}
                onClick={() => handleSort(sortKey)}
            >
                <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span className="group-hover:text-white transition-colors">{label}</span>
                    <div className="w-3 flex justify-center text-ru-primary">
                        {isActive ? (
                            sortConfig?.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                            <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-30 text-white" />
                        )}
                    </div>
                </div>
            </th>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-[#050505] z-10 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                        <tr className="border-b border-white/10 text-[10px] uppercase font-mono">
                            <SortableHeader label={isChinese ? '时间' : 'PERIOD'} sortKey="periodLabel" width="20%" />
                            <SortableHeader label={isChinese ? '项目数' : 'PROJECTS'} sortKey="projectCount" align="center" colorClass="text-cyan-400/80" width="15%" />
                            <SortableHeader label={trans.compositions} sortKey="compositions" align="right" colorClass="text-blue-400/80" />
                            <SortableHeader label={trans.totalLayers} sortKey="layers" align="right" colorClass="text-purple-400/80" />
                            <SortableHeader label={trans.keyframes} sortKey="keyframes" align="right" colorClass="text-ru-primary/80" />
                            <SortableHeader label={trans.effects} sortKey="effects" align="right" colorClass="text-emerald-400/80" />
                            <SortableHeader label={trans.runtime} sortKey="runtime" align="right" colorClass="text-amber-400/80" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {visibleRows.map((row: any, idx: number) => (
                            <tr key={`${row.isoDate}-${idx}`} className="hover:bg-white/5 transition-colors group cursor-pointer select-none">
                                <td 
                                    className="p-3 text-xs font-bold text-ru-textDim group-hover:text-white align-top hover:underline decoration-white/30 underline-offset-4"
                                    onDoubleClick={() => onNavigate(row.isoDate)}
                                    title="Double click to jump to this period on Dashboard"
                                >
                                    {row.fullLabel || row.periodLabel}
                                    {row.displayX !== undefined && <span className="ml-2 opacity-50 text-[9px]">({row.displayX})</span>}
                                </td>
                                <td className="p-3 text-xs font-mono text-center text-cyan-100/70 font-bold">
                                    {(row.projectCount || 0).toLocaleString()}
                                </td>
                                <td className="p-3 text-xs font-mono text-right text-blue-100/70">{(row.compositions || 0).toLocaleString()}</td>
                                <td className="p-3 text-xs font-mono text-right text-purple-100/70">{(row.layers || 0).toLocaleString()}</td>
                                <td className="p-3 text-xs font-mono text-right text-white font-bold">{(row.keyframes || 0).toLocaleString()}</td>
                                <td className="p-3 text-xs font-mono text-right text-emerald-100/70">{(row.effects || 0).toLocaleString()}</td>
                                <td className="p-3 text-xs font-mono text-right text-amber-100/70">{formatRuntime(row.runtime || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto bg-[#050505] flex-shrink-0">
                    <button 
                        onClick={() => handlePageChange(-1)} 
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold text-ru-textDim hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all uppercase tracking-wider"
                    >
                        <ChevronLeft size={14} />
                        Prev
                    </button>
                    
                    <span className="text-[10px] font-mono text-ru-textMuted uppercase tracking-widest">
                        {trans.page} <span className="text-white font-bold">{currentPage}</span> {trans.of} {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => handlePageChange(1)} 
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold text-ru-textDim hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all uppercase tracking-wider"
                    >
                        Next
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export const AnalyticsView = ({
    trans,
    displayMode = 'chart',
    setAnalyticsMode,
    searchQuery = '',
    onNavigate
}: {
    trans: any,
    displayMode?: AnalyticsMode,
    setAnalyticsMode: (mode: AnalyticsMode) => void,
    searchQuery?: string,
    onNavigate: (date: string, projectName?: string) => void
}) => {
    const [cursorDate, setCursorDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('week');

    const [showDaily, setShowDaily] = useState(false);

    // 检测语言：通过trans.compositions是否包含中文字符来判断
    const isChinese = trans.compositions && /[\u4e00-\u9fa5]/.test(trans.compositions);
    const [normalizeData, setNormalizeData] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [workLogs, setWorkLogs] = useState<any[]>([]);
    const [dataWarning, setDataWarning] = useState<string | null>(null);

    const [visibleMetrics, setVisibleMetrics] = useState({
        compositions: true,
        layers: false, 
        keyframes: true,
        effects: false,
        runtime: true,
        projectCount: false
    });

    const handleNav = (dir: -1 | 1) => {
        const newDate = new Date(cursorDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (dir * 7));
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + dir);
        } else if (viewMode === 'quarter') {
            newDate.setMonth(newDate.getMonth() + (dir * 3));
        } else if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() + dir);
        } else if (viewMode === 'all') {
            newDate.setFullYear(newDate.getFullYear() + (dir * 5));
        }
        setCursorDate(newDate);
    };

    // Load all work logs once and cache to localStorage
    useEffect(() => {
        const ALL_DATA_RANGE = {
            startDate: '2020-01-01',
            endDate: '2030-12-31'
        };

        async function loadAllWorkLogs() {
            setIsLoading(true);
            try {
                // 检查持久化缓存（使用独立的缓存键，避免与Dashboard冲突）
                const cached = localStorage.getItem('analytics_view_all_data');
                const cachedTime = localStorage.getItem('analytics_view_all_data_time');

                // 缓存1天内有效
                if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 24 * 60 * 60 * 1000) {
                    setWorkLogs(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                }

                // 一次性加载所有数据
                const response = await getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false);
                if (response.success && response.data) {
                    setWorkLogs(response.data);
                    // 缓存到 localStorage（使用独立的缓存键）
                    localStorage.setItem('analytics_view_all_data', JSON.stringify(response.data));
                    localStorage.setItem('analytics_view_all_data_time', Date.now().toString());
                } else {
                    setWorkLogs([]);
                }
            } catch (error) {
                console.error('Failed to load work logs for analytics:', error);
                setWorkLogs([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadAllWorkLogs();
    }, []);  // 空依赖，只执行一次

    // 根据当前视图模式过滤数据
    const filteredWorkLogs = useMemo(() => {
        const { startDate, endDate } = getDateRange(viewMode, cursorDate);

        const filtered = workLogs.filter(log => {
            const date = log.work_date;
            const isInRange = date >= startDate && date <= endDate;
            return isInRange;
        });

        return filtered;
    }, [workLogs, viewMode, cursorDate]);

    // 数据量监控：当数据量过大时自动禁用 showDaily
    useEffect(() => {
        if (showDaily && filteredWorkLogs.length > 90) {
            setShowDaily(false);
            setDataWarning(isChinese
                ? `数据量较大（${filteredWorkLogs.length} 天），已自动切换到周视图以提升性能`
                : `Large dataset (${filteredWorkLogs.length} days), switched to weekly view for better performance`
            );
            setTimeout(() => setDataWarning(null), 5000);
        } else if (filteredWorkLogs.length <= 90) {
            setDataWarning(null);
        }
    }, [filteredWorkLogs.length, showDaily, trans]);

    const { data: rawData, label: timeLabel } = useMemo(() => {
        const result = getAnalyticsData(viewMode, cursorDate, showDaily, trans, filteredWorkLogs);
        return result;
    }, [viewMode, cursorDate, showDaily, trans, filteredWorkLogs]);

    // 后台静默更新缓存
    useEffect(() => {
        const ALL_DATA_RANGE = {
            startDate: '2020-01-01',
            endDate: '2030-12-31'
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // 页面隐藏时，后台更新缓存（使用独立的缓存键）
                getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false)
                    .then(response => {
                        if (response.success && response.data) {
                            localStorage.setItem('analytics_view_all_data', JSON.stringify(response.data));
                            localStorage.setItem('analytics_view_all_data_time', Date.now().toString());
                        }
                    })
                    .catch(error => {
                        console.error('[AnalyticsView] Failed to update cache:', error);
                    });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const filteredRawData = useMemo(() => {
        if (!searchQuery.trim()) return rawData;
        const lowerQ = searchQuery.toLowerCase();

        return rawData.map(period => {
            // Check if period matches directly (e.g. searching for "Jan")
            const periodMatches = period.fullLabel.toLowerCase().includes(lowerQ) || 
                                 (period.displayX && period.displayX.toString().toLowerCase().includes(lowerQ));

            if (periodMatches) return period;

            // Otherwise, filter inner projects
            if (!period.projects) return null;

            const matchingProjects = period.projects.filter((p: any) => p.name.toLowerCase().includes(lowerQ));
            
            if (matchingProjects.length === 0) return null;

            // Re-aggregate stats for this subset
            const newStats = matchingProjects.reduce((acc: any, p: any) => ({
                compositions: acc.compositions + (p.statistics?.compositions || 0),
                layers: acc.layers + (p.statistics?.layers || 0),
                keyframes: acc.keyframes + (p.statistics?.keyframes || 0),
                effects: acc.effects + (p.statistics?.effects || 0),
                runtime: acc.runtime + (p.accumulatedRuntime || 0),
            }), { compositions: 0, layers: 0, keyframes: 0, effects: 0, runtime: 0 });

            return {
                ...period,
                ...newStats,
                projects: matchingProjects,
            };
        }).filter(Boolean);
    }, [rawData, searchQuery]);


    const processedData = useMemo(() => {
        // First calculate projectCount for all raw entries
        const withCounts = filteredRawData.map((d: any) => ({
            ...d,
            projectCount: d.projects ? d.projects.length : 0
        }));

        if (!normalizeData) {
            return withCounts;
        }
        
        const maxVals = {
            compositions: Math.max(...withCounts.map((d: any) => d.compositions), 1),
            layers: Math.max(...withCounts.map((d: any) => d.layers), 1),
            keyframes: Math.max(...withCounts.map((d: any) => d.keyframes), 1),
            effects: Math.max(...withCounts.map((d: any) => d.effects), 1),
            runtime: Math.max(...withCounts.map((d: any) => d.runtime), 1),
            projectCount: Math.max(...withCounts.map((d: any) => d.projectCount), 1),
        };

        return withCounts.map((d: any) => ({
            ...d,
            _raw: { ...d },
            compositions: (d.compositions / maxVals.compositions) * 100,
            layers: (d.layers / maxVals.layers) * 100,
            keyframes: (d.keyframes / maxVals.keyframes) * 100,
            effects: (d.effects / maxVals.effects) * 100,
            runtime: (d.runtime / maxVals.runtime) * 100,
            projectCount: (d.projectCount / maxVals.projectCount) * 100,
        }));

    }, [filteredRawData, normalizeData]);

    const finalDisplayData = useMemo(() => {
        // Filtering is now done upstream in filteredRawData to support re-aggregation for charts
        return processedData;
    }, [processedData]);

    // Table data: use raw data with projectCount, not normalized
    const tableData = useMemo(() => {
        return filteredRawData.map((d: any) => ({
            ...d,
            projectCount: d.projects ? d.projects.length : 0
        }));
    }, [filteredRawData]);

    const totals = useMemo(() => {
        // 🔍 使用 filteredWorkLogs 直接计算，确保与 aggregatedDetails 使用相同的数据源
        const dailyDataMap = aggregateWorkLogsByDate(filteredWorkLogs);
        const result = Array.from(dailyDataMap.values()).reduce((acc: any, dailyData) => ({
            compositions: acc.compositions + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.compositions, 0),
            layers: acc.layers + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.layers, 0),
            keyframes: acc.keyframes + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.keyframes, 0),
            effects: acc.effects + dailyData.projects.reduce((sum: number, p: any) => {
                // 🔍 使用 effectCounts 的总和，而不是 statistics.effects（唯一类型数）
                if (!p.details.effectCounts) return sum;
                return sum + Object.values(p.details.effectCounts).reduce((total: number, count: number) => total + count, 0);
            }, 0),
            runtime: acc.runtime + dailyData.projects.reduce((sum: number, p: any) => sum + p.accumulatedRuntime, 0),
            projectCount: acc.projectCount + dailyData.projects.length,
        }), { compositions: 0, layers: 0, keyframes: 0, effects: 0, runtime: 0, projectCount: 0 });

        return result;
    }, [filteredWorkLogs]);

    const aggregatedDetails = useMemo(() => {
        const acc = {
            keyframes: {} as Record<string, number>,
            compositions: [] as string[],
            layers: { video: 0, image: 0, sequence: 0, designFile: 0, sourceFile: 0, nullSolidLayer: 0, shapeLayer: 0, textLayer: 0, adjustmentLayer: 0, lightLayer: 0, cameraLayer: 0, other: 0 } as Record<string, number>,
            effectCounts: {} as Record<string, number>
        };

        // 🔍 使用 Set 去重合成名称
        const compositionsSet = new Set<string>();

        // 🔍 直接使用 filteredWorkLogs，不受 showDaily 开关影响
        const dailyDataMap = aggregateWorkLogsByDate(filteredWorkLogs);

        dailyDataMap.forEach((dailyData) => {
            dailyData.projects.forEach((p: any) => {
                if(!p.details) return;
                if (p.details.layers) {
                    Object.keys(p.details.layers).forEach(k => {
                        acc.layers[k] = (acc.layers[k] || 0) + (p.details.layers[k] as number);
                    });
                }
                if (p.details.effectCounts) {
                    Object.entries(p.details.effectCounts).forEach(([k, v]) => {
                        acc.effectCounts[k] = (acc.effectCounts[k] || 0) + (typeof v === 'number' ? v : 0);
                    });
                }
                if (p.details.keyframes) {
                    Object.entries(p.details.keyframes).forEach(([k, v]) => {
                        acc.keyframes[k] = (acc.keyframes[k] || 0) + (v as number);
                    });
                }
                if (p.details.compositions) {
                    // 🔍 使用 Set 去重合成名称
                    p.details.compositions.forEach(compName => {
                        if (compName && compName.trim() !== '') {
                            compositionsSet.add(compName);
                        }
                    });
                }
            });
        });

        // 🔍 将 Set 转换为数组
        return {
            ...acc,
            compositions: Array.from(compositionsSet).sort()  // 排序
        };
    }, [filteredWorkLogs]);


    const formatRuntime = (sec: number) => `${(sec / 3600).toFixed(0)}h`;

    const toggleMetric = (key: keyof typeof visibleMetrics) => {
        setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const soloMetric = (key: keyof typeof visibleMetrics) => {
        const reset = {
            compositions: false, layers: false, keyframes: false, effects: false, runtime: false, projectCount: false
        };
        setVisibleMetrics({ ...reset, [key]: true });
    };

    const handleManualRefresh = async () => {
        const ALL_DATA_RANGE = {
            startDate: '2020-01-01',
            endDate: '2030-12-31'
        };
        
        setIsLoading(true);
        try {
            const response = await getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false);
            if (response.success && response.data) {
                setWorkLogs(response.data);
                localStorage.setItem('analytics_view_all_data', JSON.stringify(response.data));
                localStorage.setItem('analytics_view_all_data_time', Date.now().toString());
            }
        } catch (error) {
            console.error('[AnalyticsView] Failed to refresh data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-8 pb-20 animate-[fadeIn_0.5s_ease-out]">
            
            <div className="mb-6 border-b border-white/10 pb-4 flex flex-col gap-4">
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-ru-textMuted text-xs font-mono uppercase tracking-widest">
                        <Activity size={14} className="text-ru-primary" />
                        <span className="font-bold">{trans.trendAnalysis}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <OptionSwitch 
                            active={displayMode === 'table'} 
                            onClick={() => setAnalyticsMode(displayMode === 'chart' ? 'table' : 'chart')} 
                            label={trans.viewTable} 
                            icon={TableIcon} 
                            hideLabelOnMobile={true}
                        />

                        <OptionSwitch
                            active={showDaily}
                            onClick={() => setShowDaily(!showDaily)}
                            label={trans.dailyDetails}
                            icon={Calendar}
                            hideLabelOnMobile={true}
                        />
                        {dataWarning && (
                            <div className="bg-ru-primary/20 text-ru-primary text-xs px-3 py-2 rounded animate-in fade-in slide-in-from-top-2">
                                ⚠️ {dataWarning}
                            </div>
                        )}
                        {displayMode === 'chart' && (
                            <OptionSwitch 
                                                        active={normalizeData} 
                                                        onClick={() => setNormalizeData(!normalizeData)} 
                                                        label={trans.normalizeCurves} 
                                                        icon={AlignLeft} 
                                                        hideLabelOnMobile={true}
                                                    />
                                                    )}
                            
                                                    <button
                                                        onClick={handleManualRefresh}
                                                        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold text-ru-textMuted hover:text-white transition-colors border border-transparent hover:border-white/20 rounded ${isLoading ? 'animate-pulse' : ''}`}
                                                        title={isChinese ? '刷新数据' : 'Refresh Data'}
                                                    >
                                                        <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                                                        <span className="hidden sm:inline">{isChinese ? '刷新' : 'Refresh'}</span>
                                                    </button>
                                                </div>                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-1 bg-ru-glass border border-ru-glassBorder p-0.5 rounded-sm w-full sm:w-auto">
                        <button onClick={() => handleNav(-1)} className="p-2 sm:p-1.5 hover:bg-white/10 rounded text-white transition-colors flex-none"><ChevronLeft size={16} /></button>
                        <div className="flex-1 sm:w-40 text-center font-bold font-mono text-xs sm:text-sm text-white tabular-nums truncate">
                            {timeLabel}
                        </div>
                        <button onClick={() => handleNav(1)} className="p-2 sm:p-1.5 hover:bg-white/10 rounded text-white transition-colors flex-none"><ChevronRight size={16} /></button>
                    </div>

                    <div className="flex bg-ru-glass border border-ru-glassBorder rounded-sm overflow-hidden w-full sm:w-auto">
                        <ViewModeButton active={viewMode === 'week'} onClick={() => setViewMode('week')} label={trans.viewweek} shortLabel={isChinese ? '周' : 'WK'} />
                        <ViewModeButton active={viewMode === 'month'} onClick={() => setViewMode('month')} label={trans.viewmonth} shortLabel={isChinese ? '月' : 'MO'} />
                        <ViewModeButton active={viewMode === 'quarter'} onClick={() => setViewMode('quarter')} label={trans.viewquarter} shortLabel={isChinese ? '季' : 'QT'} />
                        <ViewModeButton active={viewMode === 'year'} onClick={() => setViewMode('year')} label={trans.viewyear} shortLabel={isChinese ? '年' : 'YR'} />
                        <ViewModeButton active={viewMode === 'all'} onClick={() => setViewMode('all')} label={trans.viewall} shortLabel={isChinese ? '全' : 'ALL'} />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 w-full mt-1">
                     <MetricToggle 
                        active={visibleMetrics.compositions} 
                        onClick={() => toggleMetric('compositions')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('compositions'); }}
                        label={trans.compositions} 
                        value={totals.compositions}
                        color="#3b82f6" icon={LayoutGrid} 
                        hint={trans.toggleSoloHint}
                    />
                    <MetricToggle 
                        active={visibleMetrics.layers} 
                        onClick={() => toggleMetric('layers')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('layers'); }}
                        label={trans.totalLayers} 
                        value={totals.layers}
                        color="#a855f7" icon={Layers} 
                        hint={trans.toggleSoloHint}
                    />
                     <MetricToggle 
                        active={visibleMetrics.keyframes} 
                        onClick={() => toggleMetric('keyframes')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('keyframes'); }}
                        label={trans.keyframes} 
                        value={totals.keyframes}
                        color="#FF6B35" icon={Activity} 
                        hint={trans.toggleSoloHint}
                    />
                     <MetricToggle 
                        active={visibleMetrics.effects} 
                        onClick={() => toggleMetric('effects')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('effects'); }}
                        label={trans.effects} 
                        value={totals.effects}
                        color="#10b981" icon={Hexagon} 
                        hint={trans.toggleSoloHint}
                    />
                    <MetricToggle 
                        active={visibleMetrics.runtime} 
                        onClick={() => toggleMetric('runtime')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('runtime'); }}
                        label={trans.runtime} 
                        value={totals.runtime}
                        formatValue={formatRuntime}
                        color="#f59e0b" icon={Clock} 
                        hint={trans.toggleSoloHint}
                    />
                    <MetricToggle 
                        active={visibleMetrics.projectCount} 
                        onClick={() => toggleMetric('projectCount')} 
                        onContextMenu={(e) => { e.preventDefault(); soloMetric('projectCount'); }}
                        label={trans.projectCount} 
                        value={totals.projectCount}
                        color="#22d3ee" icon={Folder} 
                        hint={trans.toggleSoloHint}
                    />
                </div>

            </div>

            <div className="bg-ru-glass border border-ru-glassBorder p-2 md:p-6 rounded-sm h-[250px] md:h-[500px] mb-8 relative group flex flex-col">
                
                {displayMode === 'chart' ? (
                    <>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={finalDisplayData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradKeyframes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gradRuntime" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="displayX" 
                                    type="category" 
                                    stroke="#666" 
                                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} 
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                    scale="point"
                                    padding={{ left: 0, right: 0 }}
                                    interval={showDaily && (viewMode === 'year' || viewMode === 'quarter') ? 14 : 'preserveStartEnd'} 
                                />
                                <YAxis 
                                    yAxisId="left" 
                                    stroke="#666" 
                                    tick={false}
                                    width={0}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={normalizeData ? [0, 100] : ['auto', 'auto']}
                                />
                                <YAxis 
                                    yAxisId="right" 
                                    orientation="right" 
                                    stroke="#f59e0b" 
                                    tick={false}
                                    width={0}
                                    hide={!visibleMetrics.runtime && !normalizeData} 
                                    axisLine={false}
                                    tickLine={false}
                                    domain={normalizeData ? [0, 100] : ['auto', 'auto']}
                                />
                                
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(5,5,5,0.95)', borderColor: '#333', color: '#fff', borderRadius: '4px', backdropFilter: 'blur(8px)' }}
                                    itemStyle={{ fontSize: 12, fontFamily: 'monospace', paddingTop: '2px', paddingBottom: '2px' }}
                                    labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) return payload[0].payload.fullLabel;
                                        return label;
                                    }}
                                    formatter={(value: number, name: string, item: any) => {
                                        const raw = normalizeData ? item.payload._raw[name] : value;
                                        if (name === 'runtime') return [formatRuntime(raw), trans.runtime];
                                        const transKey = name as keyof typeof TRANS.EN;
                                        const label = trans[transKey] || name.toUpperCase();
                                        return [raw.toLocaleString(), label];
                                    }}
                                />

                                {visibleMetrics.layers && <Area yAxisId="left" type="monotone" dataKey="layers" stroke="#a855f7" fill="none" strokeWidth={2} />}
                                {visibleMetrics.compositions && <Area yAxisId="left" type="monotone" dataKey="compositions" stroke="#3b82f6" fill="none" strokeWidth={2} />}
                                {visibleMetrics.effects && <Area yAxisId="left" type="monotone" dataKey="effects" stroke="#10b981" fill="none" strokeWidth={2} />}
                                {visibleMetrics.projectCount && <Area yAxisId="left" type="monotone" dataKey="projectCount" stroke="#22d3ee" fill="none" strokeWidth={2} />}
                                
                                {visibleMetrics.keyframes && (
                                    <Area 
                                        yAxisId="left" type="monotone" dataKey="keyframes" 
                                        stroke="#FF6B35" fill="url(#gradKeyframes)" strokeWidth={3} 
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#FF6B35' }}
                                    />
                                )}

                                {visibleMetrics.runtime && (
                                    <Area 
                                        yAxisId={normalizeData ? "left" : "right"} 
                                        type="monotone" dataKey="runtime" 
                                        stroke="#f59e0b" fill="url(#gradRuntime)" strokeWidth={2} 
                                        strokeDasharray={normalizeData ? "" : "5 5"} 
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <AnalyticsTable
                        data={tableData}
                        trans={trans}
                        formatRuntime={formatRuntime}
                        onNavigate={onNavigate}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <DashboardPanel 
                    title={trans.keyframeDensity} 
                    count={Object.values(aggregatedDetails.keyframes).reduce((a, b) => a + b, 0)} 
                    countLabel={trans.total}
                    className="h-[220px]"
                >
                    <DataList data={aggregatedDetails.keyframes} type="count" trans={trans} />
                </DashboardPanel>

                <DashboardPanel 
                    title={trans.activeComps} 
                    count={aggregatedDetails.compositions.length} 
                    countLabel={trans.items}
                    className="h-[220px]"
                >
                    <DataList data={aggregatedDetails.compositions} type="list" trans={trans} />
                </DashboardPanel>
                
                <DashboardPanel 
                    title={trans.layerDist} 
                    count={Object.values(aggregatedDetails.layers).reduce((a: number,b: number)=>a+b, 0)} 
                    countLabel={trans.total}
                >
                <LayerRadar data={aggregatedDetails.layers} trans={trans} />
                </DashboardPanel>

                <DashboardPanel 
                    title={trans.effectFreq} 
                    count={
                      <div className="flex items-baseline gap-1">
                        <NumberTicker value={totals.effects} />
                        <span className="text-white/40 text-sm">/</span>
                        <span className="text-white/60 text-base">{Object.keys(aggregatedDetails.effectCounts).length}</span>
                      </div>
                    }
                    countLabel={trans.uniqueEffects}
                >
                <EffectDonut data={aggregatedDetails.effectCounts} trans={trans} />
                </DashboardPanel>
            </div>
        </div>
    );
};

// --- MAIN APP ---

const App = () => {
  // 认证检查
  useEffect(() => {
    const token = localStorage.getItem('rualive_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  // 用户信息状态
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('rualive_token');
        const response = await fetch(`${window.location.origin}/api/auth/me`, {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const result = await response.json();
          setCurrentUser(result.user);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUser();
  }, []);

  // 从 URL hash 初始化和同步 view 状态
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const hash = window.location.hash.slice(1); // 去掉 #
    if (['dashboard', 'analytics', 'settings'].includes(hash)) {
      return hash as ViewType;
    }
    return 'dashboard';
  });

  // 监听 hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // 去掉 #
      if (['dashboard', 'analytics', 'settings'].includes(hash)) {
        setCurrentView(hash as ViewType);
      }
    };

    // 初始化时读取 hash
    handleHashChange();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 当 view 变化时更新 URL hash
  useEffect(() => {
    window.location.hash = currentView;
  }, [currentView]);

  // 侧边栏折叠状态（默认折叠）
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>('chart');

  const [lang, setLang] = useState<LangType>(() => {
    if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('en')) {
            return 'EN';
        }
    }
    return 'ZH';
  });

  // Load translations from external JSON
  const [trans, setTrans] = useState<any>(DEFAULT_USER_TRANS[lang]);
  useEffect(() => {
    const loadTranslations = async () => {
      const data = await loadUserTranslations(lang);
      if (data) {
        setTrans(data);
      }
    };
    loadTranslations();
  }, [lang]);

  const [anonymizeMode, setAnonymizeMode] = useState<boolean>(false);

  const handleNavigate = (date: string, projectName?: string) => {
     setCurrentDate(date);
     if (projectName) setSearchQuery(projectName);
     setCurrentView('dashboard');
  };

  // 视图导航函数（用于切换页面）
  const handleViewNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleToggleAnonymize = () => {
    setAnonymizeMode(prev => !prev);
  };

  const handleRefresh = async () => {
    // 清除所有缓存
    clearAllCache();

    // 强制重新加载数据
    if (currentView === 'dashboard') {
      setIsLoading(true);
      try {
        // 禁用缓存，强制从服务器重新加载
        const response = await getWorkLogs(currentDate, false);
        
        if (response.success && response.data && response.data.length > 0) {
          const workLog = response.data[0];
          const transformedData = workLogToDailyData(workLog);
          setDailyData(transformedData);
        } else {
          // No data for this date
          setDailyData({ date: currentDate, projects: [] });
        }
      } catch (err) {
        console.error('[UserV6] Refresh Failed to load work logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setDailyData({ date: currentDate, projects: [] });
      } finally {
        setIsLoading(false);
      }
    }
    // Analytics view 需要类似的处理，这里暂时省略
  };

  const [dailyData, setDailyData] = useState<DailyData>({ date: currentDate, projects: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allWorkLogs, setAllWorkLogs] = useState<any[]>([]);
  const [projectsTotalHours, setProjectsTotalHours] = useState<Map<string, number>>(new Map());

  // History modal state
  const [historyProject, setHistoryProject] = useState<{ id: string; name: string } | null>(null);
  const [historyData, setHistoryData] = useState<any[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Handle fetch project history (for modal)
  const handleFetchProjectHistory = async (projectId: string, projectName: string) => {
    console.log('[Dashboard] Fetching project history:', projectId, projectName);
    setHistoryProject({ id: projectId, name: projectName });
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    setHistoryData(null);

    try {
      const token = localStorage.getItem('rualive_token');
      if (!token) {
        console.error('[Dashboard] No authentication token found');
        return;
      }

      const response = await fetch(`${window.location.origin}/api/projects/history?projectId=${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Dashboard] Project history response:', result);
        if (result.success && result.dailyStats) {
          console.log('[Dashboard] Project history loaded:', result.dailyStats.length, 'days');
          const transformedData = result.dailyStats.map((item: any) => ({
            work_date: item.work_date,
            work_hours: item.work_hours,
            accumulated_runtime: item.accumulated_runtime,
            composition_count: item.composition_count,
            layer_count: item.layer_count,
            keyframe_count: item.keyframe_count,
            effect_count: item.effect_count
          }));
          setHistoryData(transformedData);
        } else {
          console.error('[Dashboard] Failed to fetch project history:', result.error);
          setHistoryData([]);
        }
      } else {
        console.error('[Dashboard] API request failed:', response.status);
        setHistoryData([]);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching project history:', error);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load project history for gantt chart (without modal)
  const loadProjectHistoryForGantt = async (projectId: string) => {
    console.log('[Dashboard] Loading project history for gantt:', projectId);
    setIsLoadingHistory(true);

    try {
      const token = localStorage.getItem('rualive_token');
      if (!token) {
        console.error('[Dashboard] No authentication token found');
        return;
      }

      const response = await fetch(`${window.location.origin}/api/projects/history?projectId=${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.dailyStats) {
          const transformedData = result.dailyStats.map((item: any) => ({
            work_date: item.work_date,
            work_hours: item.work_hours,
            accumulated_runtime: item.accumulated_runtime,
            composition_count: item.composition_count,
            layer_count: item.layer_count,
            keyframe_count: item.keyframe_count,
            effect_count: item.effect_count
          }));
          setHistoryData(transformedData);
        } else {
          console.error('[Dashboard] Failed to fetch project history for gantt:', result.error);
          setHistoryData([]);
        }
      } else {
        console.error('[Dashboard] API request failed for gantt:', response.status);
        setHistoryData([]);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching project history for gantt:', error);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load projects total hours
  useEffect(() => {
    async function loadProjectsSummary() {
      try {
        const token = localStorage.getItem('rualive_token');
        if (!token) {
          console.error('[Dashboard] No authentication token found');
          return;
        }

        const response = await fetch(`${window.location.origin}/api/projects/summary`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[Dashboard] Projects summary response:', result);
          if (result.success && result.projects) {
            const hoursMap = new Map<string, number>();
            result.projects.forEach((p: any) => {
              hoursMap.set(p.project_id, p.total_work_hours);
            });
            setProjectsTotalHours(hoursMap);
          }
        } else {
          console.error('[Dashboard] Failed to fetch projects summary:', response.status);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching projects summary:', error);
      }
    }

    loadProjectsSummary();
  }, []);

  // Load all work logs for total work days display
  useEffect(() => {
    const ALL_DATA_RANGE = {
      startDate: '2020-01-01',
      endDate: '2030-12-31'
    };

    async function loadAllWorkLogs() {
      try {
        const cached = localStorage.getItem('app_all_work_logs');
        const cachedTime = localStorage.getItem('app_all_work_logs_time');

        if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 24 * 60 * 60 * 1000) {
          setAllWorkLogs(JSON.parse(cached));
          return;
        }

        const response = await getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false);
        if (response.success && response.data) {
          setAllWorkLogs(response.data);
          localStorage.setItem('app_all_work_logs', JSON.stringify(response.data));
          localStorage.setItem('app_all_work_logs_time', Date.now().toString());
        } else {
          setAllWorkLogs([]);
        }
      } catch (error) {
        console.error('Failed to load all work logs:', error);
        setAllWorkLogs([]);
      }
    }

    loadAllWorkLogs();
  }, []);

  // Load data from API when currentDate changes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getWorkLogs(currentDate, true); // Enable cache
        
        if (response.success && response.data && response.data.length > 0) {
          const workLog = response.data[0];
          const transformedData = workLogToDailyData(workLog);
          setDailyData(transformedData);
        } else {
          // No data for this date
          setDailyData({ date: currentDate, projects: [] });
        }
      } catch (err) {
        console.error('Failed to load work logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setDailyData({ date: currentDate, projects: [] });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentDate]);
  
  const filteredProjects = useMemo(() => {
    if (!dailyData?.projects) return [];
    if (!searchQuery.trim()) return dailyData.projects;
    return dailyData.projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dailyData, searchQuery]);

  const project: ProjectData | null = filteredProjects[selectedProjectIndex] 
    ? filteredProjects[selectedProjectIndex] 
    : null;

  // 自动加载项目历史数据（不打开模态框）
  useEffect(() => {
    if (project && project.projectId) {
      console.log('[Dashboard] Auto-loading project history for gantt:', project.projectId, project.name);
      loadProjectHistoryForGantt(project.projectId);
    }
  }, [project?.projectId]);

  useEffect(() => {
    setSelectedProjectIndex(0);
  }, [currentDate, searchQuery]);

  return (
    <div className="min-h-screen font-sans selection:bg-ru-primary selection:text-white pb-20 md:pb-0">
      {/* 搬砖动画背景 */}
      <BrickLoader />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={setCurrentDate}
        currentSelectedDate={currentDate}
        trans={trans}
      />

      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          trans={trans}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* 移动端底部导航 */}
      <MobileBottomNav
        currentView={currentView}
        trans={trans}
      />

      {/* 主内容区域 */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
        `}
      >
        <Header
          lang={lang}
          setLang={setLang}
          trans={trans}
          dateDisplay={currentDate}
          onCalendarClick={() => setIsCalendarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={handleRefresh}
          onNavigate={handleNavigate}
          onNavigateView={handleViewNavigate}
          currentUser={currentUser}
          workLogs={allWorkLogs}
        />

      <main className="px-4 pt-4 md:px-8 md:pt-8 max-w-[1600px] mx-auto">
        
        {currentView === 'dashboard' ? (
            filteredProjects.length > 0 && project ? (
              <>
                <ProjectSelector 
                  projects={filteredProjects}
                  selectedIndex={selectedProjectIndex}
                  onSelect={setSelectedProjectIndex}
                  trans={trans}
                  anonymizeMode={anonymizeMode}
                  onToggleAnonymize={handleToggleAnonymize}
                  onProjectClick={handleFetchProjectHistory}
                  projectsTotalHours={projectsTotalHours}
                />

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                  <VitalCard label={trans.compositions} value={project.statistics.compositions} icon={LayoutGrid} delay={0} />
                  <VitalCard label={trans.totalLayers} value={project.statistics.layers} icon={Layers} delay={100} />
                  <VitalCard label={trans.keyframes} value={project.statistics.keyframes} icon={Activity} delay={200} />
                  <VitalCard label={trans.effects} value={project.statistics.effects} icon={Hexagon} delay={300} />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                  
                  <DashboardPanel
                      title={trans.keyframeDensity}
                      count={Object.values(project.details.keyframes).reduce((a, b) => a + b, 0)}
                      countLabel={trans.total}
                      className="h-[220px]"
                  >
                      <DataList data={project.details.keyframes} type="count" trans={trans} anonymizeMode={anonymizeMode} />
                  </DashboardPanel>

                  <DashboardPanel
                      title={trans.activeComps}
                      count={project.details.compositions.length}
                      countLabel={trans.items}
                      className="h-[220px]"
                  >
                      <DataList data={project.details.compositions} type="list" trans={trans} anonymizeMode={anonymizeMode} />
                  </DashboardPanel>
                  
                  <DashboardPanel 
                      title={trans.layerDist} 
                      count={Object.values(project.details.layers).reduce((a,b)=>a+b, 0)} 
                      countLabel={trans.total}
                  >
                    <LayerRadar data={project.details.layers} trans={trans} />
                  </DashboardPanel>

                  <DashboardPanel 
                      title={trans.effectFreq} 
                      count={
                        <div className="flex items-baseline gap-1">
                          <NumberTicker value={project.statistics.effects} />
                          <span className="text-white/40 text-sm">/</span>
                          <span className="text-white/60 text-base">{Object.keys(project.details.effectCounts).length}</span>
                        </div>
                      }
                      countLabel={trans.uniqueEffects}
                  >
                    <EffectDonut data={project.details.effectCounts} trans={trans} />
                  </DashboardPanel>
                </div>

                {/* 甘特图 - 项目运行时间 */}
                <DashboardPanel 
                    title={trans.projectRuntimeGantt || 'Project Runtime Gantt'} 
                    count={historyData ? historyData.length : 0}
                    countLabel={trans.days || 'Days'}
                    className="h-[200px] md:h-[250px]"
                    extraAction={
                        <button
                            onClick={() => project && loadProjectHistoryForGantt(project.projectId)}
                            className="flex items-center gap-1 px-2 py-1 text-[9px] md:text-xs font-bold rounded bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all"
                            title={trans.refresh || 'Refresh'}
                        >
                            <RefreshCw size={12} />
                            <span className="hidden md:inline">{trans.refresh || 'Refresh'}</span>
                        </button>
                    }
                >
                    {historyData && historyData.length > 0 ? (
                        <ProjectGanttChart 
                            dailyStats={historyData}
                            trans={trans}
                            projectName={project.name}
                        />
                    ) : isLoadingHistory ? (
                        <div className="w-full h-full flex items-center justify-center text-ru-textMuted text-sm">
                            <Activity size={24} className="animate-spin mr-2" />
                            {trans.loading || 'Loading...'}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ru-textMuted text-sm">
                            <Calendar size={24} className="mb-2 opacity-50" />
                            <p>{trans.noHistory || 'No history data'}</p>
                            <button
                                onClick={() => project && loadProjectHistoryForGantt(project.projectId)}
                                className="mt-2 px-3 py-1 text-xs bg-ru-primary/20 border border-ru-primary/40 text-ru-primary rounded hover:bg-ru-primary/30 transition-all"
                            >
                                {trans.loadHistory || 'Load History'}
                            </button>
                        </div>
                    )}
                </DashboardPanel>
              </>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-ru-textDim opacity-50">
                   {isLoading ? (
                       <>
                           <div className="mb-4">
                               <Activity size={48} className="text-ru-primary animate-spin" />
                           </div>
                           <h2 className="text-xl font-black italic tracking-widest mb-2">LOADING DATA</h2>
                           <p className="font-mono text-xs">Fetching work logs...</p>
                       </>
                   ) : error ? (
                       <>
                           <div className="mb-4">
                               <ShieldAlert size={48} className="text-red-500" />
                           </div>
                           <h2 className="text-xl font-black italic tracking-widest mb-2">ERROR</h2>
                           <p className="font-mono text-xs">{error}</p>
                       </>
                   ) : (
                       <>
                           <div className="mb-4">
                               <Activity size={48} className="text-ru-primary animate-pulse" />
                           </div>
                           <h2 className="text-xl font-black italic tracking-widest mb-2">{trans.noDataTitle}</h2>
                           <p className="font-mono text-xs">{trans.noDataDesc}</p>
                       </>
                   )}
                </div>
            )
        ) : currentView === 'analytics' ? (
            <AnalyticsView
                trans={trans}
                displayMode={analyticsMode}
                setAnalyticsMode={setAnalyticsMode}
                searchQuery={searchQuery}
                onNavigate={handleNavigate}
            />
        ) : (
            <SettingsView lang={lang} />
        )}
      </main>

      {/* 项目历史拟态窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-ru-primary/30 rounded-lg shadow-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col overflow-hidden" style={{ transformOrigin: 'center center' }}>
            {/* 弹窗头部 */}
            <div className="p-2 md:p-6 border-b border-ru-primary/20 bg-gradient-to-r from-ru-primary/10 to-transparent flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm md:text-xl font-black italic tracking-wider text-white truncate">
                    {historyProject?.name}
                  </h2>
                  <p className="text-[9px] md:text-xs text-ru-textMuted mt-1 font-mono truncate">
                    ID: {historyProject?.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="flex items-center justify-center w-7 h-7 md:w-10 md:h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-2 border-ru-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-ru-textMuted text-sm">{trans.historyLoading || '加载历史数据...'}</p>
                </div>
              ) : historyData && historyData.length > 0 ? (
                <div className="space-y-4">
                  <div className="w-full">
                    <table className="w-full text-[10px] md:text-sm">
                      <thead>
                        <tr className="border-b border-ru-primary/20">
                          <th className="text-left py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center gap-1 md:gap-2">
                              <CalendarIcon className="flex-shrink-0 w-3.5 h-3.5" />
                              <span className="hidden md:inline">{trans.historyDate || '日期'}</span>
                            </div>
                          </th>
                          <th className="text-right py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <span className="hidden md:inline">{trans.historyRuntime || '运行时长'}</span>
                              <Clock className="flex-shrink-0 w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="text-right py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <span className="hidden md:inline">{trans.historyComps || '合成数'}</span>
                              <LayoutGrid className="flex-shrink-0 w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="text-right py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <span className="hidden md:inline">{trans.historyLayers || '图层数'}</span>
                              <Layers className="flex-shrink-0 w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="text-right py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <span className="hidden md:inline">{trans.historyKeyframes || '关键帧'}</span>
                              <Activity className="flex-shrink-0 w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="text-right py-2 text-ru-textMuted font-semibold">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <span className="hidden md:inline">{trans.historyEffects || '效果数'}</span>
                              <Zap className="flex-shrink-0 w-3.5 h-3.5" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-2 font-mono text-ru-textDim">{item.work_date}</td>
                            <td className="py-2 text-right font-mono text-ru-primary">{formatRuntimeCompact(item.accumulated_runtime)}</td>
                            <td className="py-2 text-right font-mono">{item.composition_count}</td>
                            <td className="py-2 text-right font-mono">{item.layer_count}</td>
                            <td className="py-2 text-right font-mono">{item.keyframe_count}</td>
                            <td className="py-2 text-right font-mono">{item.effect_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-ru-textMuted text-sm">{trans.historyNoData || '暂无历史数据'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);