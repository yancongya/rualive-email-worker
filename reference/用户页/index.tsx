import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { 
  LayoutGrid, Layers, Hexagon, Activity, Calendar as CalendarIcon, 
  Globe, ChevronRight, X, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw,
  LineChart as LucideLineChart, BarChart3, Search, Table, TrendingUp,
  Clock, FileType, CheckSquare, Calendar, AlignLeft, BarChart2, Table as TableIcon,
  Folder, Settings, Bell, ShieldAlert, Send, Save, User, Mail, Zap
} from 'lucide-react';
import { SettingsView } from './settings';

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

export const TRANS = {
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
    // Layer types mapping
    video: "VIDEO",
    image: "IMAGE",
    designFile: "DESIGN FILE",
    sourceFile: "SOURCE FILE",
    nullSolidLayer: "NULL/SOLID",
    // Sorting
    sortName: "NAME",
    sortValue: "VAL",
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    // Analytics
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
    // Analytics Controls
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
    // Settings
    settings: "SETTINGS"
  },
  ZH: {
    subtitle: "系统在线 // 监控中",
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
    // Layer types mapping
    video: "视频素材",
    image: "图片素材",
    designFile: "设计源文件",
    sourceFile: "通用源文件",
    nullSolidLayer: "纯色/空对象",
    // Sorting
    sortName: "名称",
    sortValue: "数值",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    // Analytics
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
    // Analytics Controls
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
    // Settings
    settings: "系统设置"
  }
};

// --- CONSTANTS & GENERATORS ---

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

export const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

const PROJECT_PREFIXES = ["Cyber", "Neon", "Glitch", "Void", "Quantum", "Hyper", "Mech", "Flux", "Aero", "Synapse", "Echo", "Veloc", "Omni", "Null"];
const PROJECT_SUFFIXES = ["HUD", "UI", "Vlog", "Intro", "Promo", "System", "Dashboard", "Protocol", "Scan", "Loop", "Render", "Comp", "Asset"];
const EFFECT_NAMES = ['Deep Glow', 'Saber', 'Glitchify', 'Optical Flares', 'Particular', 'Curves', 'Fill', 'Tint', 'Transform', 'Gaussian Blur', 'Mosaic'];
const LAYER_NAMES = ['Shape Layer 1', 'Null 5', 'Camera Control', 'BG_texture.png', 'Logo_final.ai', 'Adjustment Layer', 'Particle Emitter'];
const COMP_NAMES = ['Main_Render', 'Pre-comp 1', 'Intro_Seq', 'Lower_Thirds', 'Transition_A', 'Transition_B', 'Outro_Card'];

const generateProjectName = (seed: string) => {
    const r1 = seededRandom(seed + 'n1');
    const r2 = seededRandom(seed + 'n2');
    const p = PROJECT_PREFIXES[Math.floor(r1 * PROJECT_PREFIXES.length)];
    const s = PROJECT_SUFFIXES[Math.floor(r2 * PROJECT_SUFFIXES.length)];
    const v = Math.floor(r1 * 10) + 1;
    return `${p}_${s}_v${v}.aep`;
};

// Basic generator for MOCK_DATA
const generateProject = (id: string, name: string): ProjectData => {
  const layerStats = {
    video: randomInt(0, 10),
    image: randomInt(10, 80),
    designFile: randomInt(5, 120),
    sourceFile: randomInt(0, 5),
    nullSolidLayer: randomInt(2, 20),
  };

  const totalLayers = Object.values(layerStats).reduce((a, b) => a + b, 0);
  
  const keyframes: Record<string, number> = {};
  for(let i=0; i<20; i++) {
    keyframes[`${LAYER_NAMES[randomInt(0, LAYER_NAMES.length-1)]} ${i}`] = randomInt(5, 150);
  }
  const totalKeys = Object.values(keyframes).reduce((a,b) => a+b, 0);

  const effects: Record<string, number> = {};
  for(let i=0; i<15; i++) {
    const eff = EFFECT_NAMES[randomInt(0, EFFECT_NAMES.length-1)];
    effects[eff] = (effects[eff] || 0) + randomInt(1, 10);
  }
  const totalEffects = Object.values(effects).reduce((a,b) => a+b, 0);

  const comps = Array.from({length: randomInt(5, 20)}, (_, i) => `${COMP_NAMES[randomInt(0, COMP_NAMES.length-1)]}_${i}`);

  const runtimeSeconds = randomInt(7200, 43200); // Between 2h and 12h

  return {
    projectId: id,
    name: name,
    accumulatedRuntime: runtimeSeconds, 
    statistics: {
      compositions: comps.length,
      layers: totalLayers,
      keyframes: totalKeys,
      effects: totalEffects,
    },
    details: {
      compositions: comps,
      layers: layerStats,
      keyframes: keyframes,
      effectCounts: effects,
    }
  };
};

const generateDynamicProject = (dateStr: string, index: number): ProjectData => {
    const seed = `${dateStr}_p${index}`;
    const name = generateProjectName(seed);
    const id = seed.split('').reduce((a,b)=>a+b.charCodeAt(0),0).toString(16);
    return generateProject(id, name);
}

// Updated Mock Data for Jan 2026
const MOCK_DATA: Record<string, DailyData> = {
  '2026-01-24': { date: '2026-01-24', projects: [generateProject('55a', 'Weekend_Vlog.aep')] },
  '2026-01-25': { date: '2026-01-25', projects: [generateProject('66b', 'Sunday_Stream_Overlay.aep')] },
  '2026-01-26': { 
    date: '2026-01-26', 
    projects: [
        generateProject('503a075b', 'Cyberpunk_HUD_Main.aep'),
        generateProject('129b882a', 'Glitch_Intro_v2.aep')
    ]
  },
};

// --- ANALYTICS DATA GENERATORS (Ported) ---

const generateBaseStats = (seedKey: string, multiplier: number = 1) => {
    const r1 = seededRandom(seedKey + '_comps');
    const r2 = seededRandom(seedKey + '_layers');
    const r3 = seededRandom(seedKey + '_keys');
    const r4 = seededRandom(seedKey + '_fx');
    const r5 = seededRandom(seedKey + '_time');

    return {
        compositions: Math.floor((2 + r1 * 10) * multiplier),
        layers: Math.floor((10 + r2 * 50) * multiplier),
        keyframes: Math.floor((50 + r3 * 400) * multiplier),
        effects: Math.floor((2 + r4 * 15) * multiplier),
        runtime: Math.floor((1800 + r5 * 7200) * multiplier),
    };
};

const generateRowData = (seedKey: string, multiplier: number) => {
    const projectCount = Math.floor(seededRandom(seedKey + 'count') * 3) + 2; 
    
    const projects = [];
    let totals = { compositions: 0, layers: 0, keyframes: 0, effects: 0, runtime: 0 };

    for(let i=0; i<projectCount; i++) {
        const pSeed = `${seedKey}_p${i}`;
        const pStats = generateBaseStats(pSeed, multiplier / (projectCount * 0.8)); 
        
        // Generate Details for charts
        const layerStats = {
             video: Math.floor(pStats.layers * 0.1),
             image: Math.floor(pStats.layers * 0.25),
             designFile: Math.floor(pStats.layers * 0.4),
             sourceFile: Math.floor(pStats.layers * 0.05),
             nullSolidLayer: Math.floor(pStats.layers * 0.2),
        };
        // Ensure total match roughly
        layerStats.nullSolidLayer = Math.max(0, pStats.layers - (layerStats.video + layerStats.image + layerStats.designFile + layerStats.sourceFile));

        const keyframes: Record<string, number> = {};
        for(let k=0; k<8; k++) {
             const name = LAYER_NAMES[Math.floor(seededRandom(pSeed + 'k' + k) * LAYER_NAMES.length)];
             keyframes[name] = Math.floor(pStats.keyframes / 8); 
        }

        const effectCounts: Record<string, number> = {};
        for(let e=0; e<6; e++) {
             const name = EFFECT_NAMES[Math.floor(seededRandom(pSeed + 'e' + e) * EFFECT_NAMES.length)];
             effectCounts[name] = (effectCounts[name] || 0) + Math.floor(pStats.effects / 4);
        }

        const comps = [];
        for(let c=0; c< Math.min(pStats.compositions, 10); c++) {
            comps.push(COMP_NAMES[Math.floor(seededRandom(pSeed + 'c' + c) * COMP_NAMES.length)] + `_${c}`);
        }

        const project = {
            id: pSeed,
            name: generateProjectName(pSeed),
            ...pStats,
            details: {
                layers: layerStats,
                keyframes,
                effectCounts,
                compositions: comps
            }
        };
        projects.push(project);

        totals.compositions += pStats.compositions;
        totals.layers += pStats.layers;
        totals.keyframes += pStats.keyframes;
        totals.effects += pStats.effects;
        totals.runtime += pStats.runtime;
    }

    return { ...totals, projects };
};

const formatDate = (d: Date) => d.toISOString().split('T')[0];

const getAnalyticsData = (mode: ViewMode, cursorDate: Date, forceDaily: boolean) => {
    const data = [];
    let label = "";
    
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();

    let startDate: Date;
    let endDate: Date;
    
    if (mode === 'week') {
        const day = cursorDate.getDay();
        const diff = cursorDate.getDate() - day + (day === 0 ? -6 : 1); 
        startDate = new Date(cursorDate);
        startDate.setDate(diff); // Set to Monday
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        label = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } 
    else if (mode === 'month') {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        label = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } 
    else if (mode === 'quarter') {
        const quarterIdx = Math.floor(month / 3);
        startDate = new Date(year, quarterIdx * 3, 1);
        endDate = new Date(year, (quarterIdx * 3) + 3, 0);
        label = `Q${quarterIdx + 1} ${year}`;
    } 
    else if (mode === 'year') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        label = `${year}`;
    }
    else { // 'all'
        startDate = new Date(year - 4, 0, 1);
        endDate = new Date(year, 11, 31);
        label = `${year - 4} - ${year}`;
    }

    const current = new Date(startDate);
    
    if (forceDaily || mode === 'week') {
        while (current <= endDate) {
            const dateStr = formatDate(current);
            const rowData = generateRowData(dateStr, 1);
            
            data.push({
                date: dateStr,
                isoDate: dateStr,
                displayX: mode === 'week' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][current.getDay()] : current.getDate(),
                fullLabel: dateStr,
                ...rowData
            });
            current.setDate(current.getDate() + 1);
        }
    } else {
        if (mode === 'month') {
            let weekIdx = 1;
            while (current <= endDate) {
                const weekSeed = `${year}-${current.getMonth()}-w${weekIdx}`;
                const rowData = generateRowData(weekSeed, 4);
                const startOfPeriod = formatDate(current);
                
                let weekEnd = new Date(current);
                weekEnd.setDate(weekEnd.getDate() + 6);
                if (weekEnd > endDate) weekEnd = endDate;

                data.push({
                    date: weekSeed,
                    isoDate: startOfPeriod,
                    displayX: `W${weekIdx}`,
                    fullLabel: `${formatDate(current)} - ${formatDate(weekEnd)}`,
                    ...rowData
                });
                current.setDate(current.getDate() + 7);
                weekIdx++;
            }
        } else if (mode === 'year' || mode === 'quarter') {
            while (current <= endDate) {
                 const mSeed = `${year}-${current.getMonth()}`;
                 const rowData = generateRowData(mSeed, 12);
                 const startOfPeriod = formatDate(current);
                 
                 data.push({
                    date: mSeed,
                    isoDate: startOfPeriod,
                    displayX: current.toLocaleString('default', { month: 'short' }),
                    fullLabel: current.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    ...rowData
                 });
                 current.setMonth(current.getMonth() + 1);
            }
        } else {
             while (current <= endDate) {
                 const currentY = current.getFullYear();
                 const ySeed = `${currentY}`;
                 const rowData = generateRowData(ySeed, 100); 
                 const startOfPeriod = `${currentY}-01-01`;
                 
                 data.push({
                    date: ySeed,
                    isoDate: startOfPeriod, 
                    displayX: `${currentY}`,
                    fullLabel: `${currentY}`,
                    ...rowData
                 });
                 current.setFullYear(current.getFullYear() + 1);
            }
        }
    }

    return { data, label };
};

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

export const Header = ({ 
    lang, 
    setLang, 
    dateDisplay, 
    onCalendarClick, 
    currentView,
    onChangeView,
    searchQuery,
    setSearchQuery,
}: { 
    lang: LangType, 
    setLang: React.Dispatch<React.SetStateAction<LangType>>, 
    dateDisplay?: string, 
    onCalendarClick?: () => void,
    currentView: ViewType,
    onChangeView: (view: ViewType) => void,
    searchQuery: string,
    setSearchQuery: (s: string) => void,
}) => {
    
    const isDashboard = currentView === 'dashboard';
    const isAnalytics = currentView === 'analytics';
    const isSettings = currentView === 'settings';

    const getBtnClass = (active: boolean) => `
        relative px-3 py-1.5 md:px-4 md:py-2 rounded text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2
        ${active 
            ? 'bg-ru-primary text-black shadow-[0_0_15px_-5px_#FF6B35]' 
            : 'text-ru-textDim hover:text-white hover:bg-white/5'
        }
    `;

    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 md:px-8 md:py-6 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-40 gap-4 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-4">
                <div 
                    className="relative w-9 h-9 md:w-12 md:h-12 flex items-center justify-center border border-white/20 rounded-full group cursor-pointer"
                    onClick={() => onChangeView('dashboard')}
                >
                <div className="absolute inset-0 rounded-full border-t border-ru-primary animate-spin"></div>
                <span className="font-bold text-base md:text-lg">A</span>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-black rounded-full"></div>
                </div>
                <div>
                <h1 className="text-lg md:text-xl font-black italic tracking-tighter">
                    RUALIVE <span className="text-ru-primary text-xs md:text-sm not-italic font-mono align-top">V6</span>
                </h1>
                <p className="text-[9px] md:text-[10px] text-ru-textMuted tracking-widest font-mono hidden sm:block">
                    {TRANS[lang].subtitle} {currentView !== 'dashboard' && ` // ${TRANS[lang][currentView]}`}
                </p>
                </div>
            </div>
            
            <div className="flex md:hidden bg-white/5 rounded p-0.5 border border-white/10 gap-0.5">
                <button onClick={() => onChangeView('dashboard')} className={getBtnClass(isDashboard)}>
                    <LayoutGrid size={16} />
                </button>
                <button onClick={() => onChangeView('analytics')} className={getBtnClass(isAnalytics)}>
                    <BarChart3 size={16} />
                </button>
                <button onClick={() => onChangeView('settings')} className={getBtnClass(isSettings)}>
                    <Settings size={16} />
                </button>
            </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-end">
            <div className="relative group flex-1 md:w-48 transition-all focus-within:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ru-textMuted group-focus-within:text-ru-primary transition-colors">
                    <Search size={14} />
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={currentView === 'dashboard' ? TRANS[lang].searchPlaceholder : TRANS[lang].searchAnalyticsPlaceholder}
                    disabled={currentView === 'settings'}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-sm py-2 pl-9 pr-3 focus:outline-none focus:border-ru-primary/50 focus:bg-white/10 transition-all font-mono placeholder:text-ru-textMuted/50 disabled:opacity-30 disabled:cursor-not-allowed"
                />
            </div>

            <div className="hidden md:flex bg-white/5 rounded p-0.5 border border-white/10 gap-0.5">
                <button onClick={() => onChangeView('dashboard')} className={getBtnClass(isDashboard)}>
                    <LayoutGrid size={14} />
                    <span>{TRANS[lang].dashboard}</span>
                </button>
                <button onClick={() => onChangeView('analytics')} className={getBtnClass(isAnalytics)}>
                    <BarChart3 size={14} />
                    <span>{TRANS[lang].analytics}</span>
                </button>
                <button onClick={() => onChangeView('settings')} className={getBtnClass(isSettings)}>
                    <Settings size={14} />
                    <span>{TRANS[lang].settings}</span>
                </button>
            </div>

            {currentView === 'dashboard' ? (
                <button 
                    onClick={onCalendarClick}
                    className="flex items-center gap-2 md:gap-3 px-2 py-1.5 md:px-4 md:py-2 bg-white/5 border border-white/10 rounded hover:border-ru-primary hover:bg-white/10 transition-all group shrink-0"
                    title={TRANS[lang].missionLog}
                >
                    <CalendarIcon size={14} className="md:w-4 md:h-4 text-ru-textDim group-hover:text-ru-primary" />
                    <span className="font-mono font-bold text-[10px] md:text-sm text-white hidden sm:block">{dateDisplay}</span>
                </button>
            ) : (
                <div className="w-0 md:w-4"></div>
            )}
            
            <button 
                onClick={() => setLang(l => l === 'EN' ? 'ZH' : 'EN')}
                className="flex items-center gap-1 md:gap-2 text-xs font-bold text-ru-textDim hover:text-white transition-colors shrink-0"
            >
            <Globe size={14} />
            {lang}
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
    <div className={`bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md flex flex-col hover:border-white/20 transition-colors duration-300 ${className}`}>
       <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2 flex-shrink-0">
         <div className="flex items-center gap-2 md:gap-3">
             <h3 className="text-base md:text-lg font-bold italic font-sans text-white truncate">{title}</h3>
             {extraAction}
         </div>
         <div className="text-xs font-mono text-ru-primary flex items-baseline gap-1">
            <span className="text-white font-bold text-lg md:text-xl">
              {typeof count === 'number' ? <NumberTicker value={count} /> : count}
            </span>
            <span className="opacity-70">{countLabel}</span>
         </div>
       </div>
       <div className="flex-1 min-h-0 relative">
          {children}
       </div>
    </div>
);

const VitalCard = ({ label, value, icon: Icon, delay }: { label: string, value: number, icon: any, delay: number }) => (
  <div 
    className="relative group overflow-hidden bg-ru-glass border border-ru-glassBorder p-4 md:p-6 rounded-sm backdrop-blur-md transition-all duration-500 hover:border-ru-primary/50 hover:bg-white/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 p-2 md:p-4 opacity-20 group-hover:opacity-100 group-hover:text-ru-primary transition-all duration-300">
        <Icon size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
    </div>
    <h3 className="text-ru-textMuted uppercase text-[10px] md:text-xs font-bold tracking-widest mb-1 md:mb-2 font-sans">{label}</h3>
    <div className="text-2xl md:text-4xl font-mono font-black text-white group-hover:text-ru-primary transition-colors duration-300">
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
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projects, selectedIndex, onSelect, lang }) => {
  // Helper function to format runtime compactly
  const formatRuntimeCompact = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)}m`;
    } else {
      return `${(seconds / 3600).toFixed(1)}h`;
    }
  };

  return (
    <div className="w-full mb-6 md:mb-8">
      <div className="flex w-full gap-1 h-16 md:h-24">
        {projects.map((proj, idx) => {
          const isActive = idx === selectedIndex;
          
          return (
            <button
              key={proj.projectId}
              onClick={() => onSelect(idx)}
              style={{ flex: `${proj.accumulatedRuntime} 1 0px` }}
              className={`
                relative h-full flex flex-col justify-between p-2 md:p-4 text-left transition-all duration-300 group
                border border-ru-glassBorder backdrop-blur-sm overflow-hidden min-w-0
                ${isActive ? 'bg-white/10 border-white/40' : 'bg-ru-glass hover:bg-white/5'}
              `}
            >
              <div className="flex justify-between items-start w-full min-w-0">
                 <span className={`text-xs md:text-sm font-bold truncate pr-1 md:pr-2 w-full ${isActive ? 'text-white' : 'text-ru-textDim'}`}>
                   {proj.name}
                 </span>
                 {isActive && <div className="w-1.5 h-1.5 md:w-2 md:h-2 flex-shrink-0 rounded-full bg-ru-primary shadow-[0_0_10px_#FF6B35]"></div>}
              </div>
              
              <div className="flex flex-col md:flex-row md:justify-between md:items-end w-full mt-auto min-w-0">
                 <span className="text-[10px] md:text-xs font-mono text-ru-primary truncate block">{formatRuntimeCompact(proj.accumulatedRuntime)}</span>
                 <span className="text-[9px] md:text-[10px] text-ru-textMuted uppercase tracking-wider hidden sm:block truncate md:ml-2">{TRANS[lang].id}: {proj.projectId}</span>
              </div>

              <div className={`absolute bottom-0 left-0 h-1 bg-ru-primary transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'}`} />
            </button>
          )
        })}
      </div>
    </div>
  );
};

export const LayerRadar = ({ data, lang }: { data: any, lang: LangType }) => {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([key, value]) => {
        const rawLabel = key.replace(/([A-Z])/g, ' $1').toUpperCase(); 
        const mappedLabel = TRANS[lang][key as keyof typeof TRANS.EN] || rawLabel;
        
        return {
            subject: mappedLabel,
            A: value,
            fullMark: 150, 
        };
    });
  }, [data, lang]);

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
          />
          <PolarRadiusAxis 
            angle={45} 
            domain={[0, 150]} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 8 }}
            axisLine={false}
          />
          <Radar 
            name={TRANS[lang].layerDist} 
            dataKey="A" 
            stroke="#FF6B35" 
            strokeWidth={2}
            fill="#FF6B35" 
            fillOpacity={0.3}
            dot={BouncyDot}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EffectDonut = ({ data, lang }: { data: any, lang: LangType }) => {
  const chartData = useMemo(() => {
    return Object.entries(data)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([key, value]) => ({
        name: key,
        value: value,
      }));
  }, [data]);

  const COLORS = ['#FF6B35', '#FF8559', '#FF9F7D', '#FFB9A1', '#FFD3C5', '#FFEDD9', '#FFD700', '#FFA500'];

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.9)', 
              border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: '4px',
              color: '#fff'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const KeyframeTable = ({ data, lang }: { data: any, lang: LangType }) => {
  const sortedData = useMemo(() => {
    return Object.entries(data)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([key, value]) => ({ layer: key, count: value }));
  }, [data]);

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-black/90 backdrop-blur-sm">
          <tr className="text-left text-ru-textMuted border-b border-white/10">
            <th className="p-2 font-mono">{TRANS[lang].sortName}</th>
            <th className="p-2 font-mono text-right">{TRANS[lang].sortValue}</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-2 truncate max-w-[150px]">{item.layer}</td>
              <td className="p-2 text-right font-mono text-ru-primary">{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CompositionList = ({ data }: { data: string[] }) => (
  <div className="w-full h-full overflow-auto">
    <ul className="space-y-1">
      {data.map((comp, idx) => (
        <li key={idx} className="text-xs p-2 rounded hover:bg-white/5 transition-colors truncate border-l-2 border-transparent hover:border-ru-primary">
          {comp}
        </li>
      ))}
    </ul>
  </div>
);

// --- CALENDAR COMPONENT ---

export const CalendarPanel = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSelectDate,
  availableDates,
  lang 
}: { 
  isOpen: boolean,
  onClose: () => void,
  selectedDate: string,
  onSelectDate: (date: string) => void,
  availableDates: string[],
  lang: LangType
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const selectDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(dateStr);
    onClose();
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    const dateStr = today.toISOString().split('T')[0];
    onSelectDate(dateStr);
    onClose();
  };

  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 md:p-3"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasData = availableDates.includes(dateStr);
    const isSelected = dateStr === selectedDate;

    days.push(
      <button
        key={day}
        onClick={() => selectDate(day)}
        disabled={!hasData}
        className={`
          p-2 md:p-3 text-center text-xs font-bold rounded transition-all
          ${!hasData 
            ? 'text-ru-textDim/30 cursor-not-allowed' 
            : isSelected
              ? 'bg-ru-primary text-black shadow-[0_0_15px_-5px_#FF6B35]'
              : 'bg-white/5 text-white hover:bg-white/10 hover:border-ru-primary/50'
          }
        `}
      >
        {day}
      </button>
    );
  }

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <div className="bg-ru-glass border border-ru-glassBorder rounded-lg p-4 md:p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-white/10 rounded transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-lg font-bold text-white">{monthLabel}</h3>
              <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-white/10 rounded transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-ru-textMuted p-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days}
            </div>
            <button 
              onClick={goToToday}
              className="mt-4 w-full py-2 bg-ru-primary/10 border border-ru-primary/30 text-ru-primary text-xs font-bold rounded hover:bg-ru-primary/20 transition-colors"
            >
              {TRANS[lang].jumpToday}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// --- MAIN COMPONENT ---

export default function App() {
  const [lang, setLang] = useState<LangType>('ZH');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDate, setSelectedDate] = useState('2026-01-26');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedData = useMemo(() => MOCK_DATA[selectedDate] || { date: selectedDate, projects: [] }, [selectedDate]);
  const availableDates = Object.keys(MOCK_DATA).sort();

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;700;900&display=swap');
        
        * { box-sizing: border-box; }
        
        body {
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }
        
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .font-italic { font-style: italic; }
        
        @keyframes popup {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-popup { animation: popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        :root {
          --ru-primary: #FF6B35;
          --ru-glass: rgba(20, 20, 20, 0.6);
          --ru-glassBorder: rgba(255, 255, 255, 0.1);
          --ru-textDim: rgba(255, 255, 255, 0.5);
          --ru-textMuted: rgba(255, 255, 255, 0.6);
        }
        
        .bg-ru-glass { background: var(--ru-glass); }
        .border-ru-glassBorder { border-color: var(--ru-glassBorder); }
        .text-ru-primary { color: var(--ru-primary); }
        .bg-ru-primary { background: var(--ru-primary); }
        .border-ru-primary { border-color: var(--ru-primary); }
        .text-ru-textDim { color: var(--ru-textDim); }
        .text-ru-textMuted { color: var(--ru-textMuted); }
      `}</style>
      
      <Header
        lang={lang}
        setLang={setLang}
        dateDisplay={selectedDate}
        onCalendarClick={() => setCalendarOpen(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto">
        {currentView === 'dashboard' && (
          <>
            {selectedData.projects.length > 0 ? (
              <>
                <ProjectSelector
                  projects={selectedData.projects}
                  selectedIndex={0}
                  onSelect={() => {}}
                  lang={lang}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <DashboardPanel
                    title={TRANS[lang].layerDist}
                    count={Object.values(selectedData.projects[0].details.layers).reduce((a, b) => a + b, 0)}
                    countLabel={TRANS[lang].items}
                  >
                    <LayerRadar data={selectedData.projects[0].details.layers} lang={lang} />
                  </DashboardPanel>

                  <DashboardPanel
                    title={TRANS[lang].effectFreq}
                    count={Object.keys(selectedData.projects[0].details.effectCounts).length}
                    countLabel={TRANS[lang].uniqueEffects}
                  >
                    <EffectDonut data={selectedData.projects[0].details.effectCounts} lang={lang} />
                  </DashboardPanel>

                  <DashboardPanel
                    title={TRANS[lang].keyframes}
                    count={Object.values(selectedData.projects[0].details.keyframes).reduce((a, b) => a + b, 0)}
                    countLabel={TRANS[lang].keyframeDensity}
                  >
                    <KeyframeTable data={selectedData.projects[0].details.keyframes} lang={lang} />
                  </DashboardPanel>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-xl font-bold text-white mb-2">{TRANS[lang].noDataTitle}</h2>
                <p className="text-sm text-ru-textMuted">{TRANS[lang].noDataDesc}</p>
              </div>
            )}
          </>
        )}
        
        {currentView === 'analytics' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-white mb-2">{TRANS[lang].analytics}</h2>
            <p className="text-sm text-ru-textMuted">Analytics view coming soon...</p>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold text-white mb-2">{TRANS[lang].settings}</h2>
            <p className="text-sm text-ru-textMuted">Settings view coming soon...</p>
          </div>
        )}
      </main>

      <CalendarPanel
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        availableDates={availableDates}
        lang={lang}
      />
    </div>
  );
}

// Initialize the app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}