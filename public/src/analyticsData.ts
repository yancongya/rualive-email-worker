/**
 * Analytics Data - Analytics 数据聚合逻辑
 * 用于 Analytics 视图的数据聚合和计算
 */

import { WorkLog } from './types/database';
import { aggregateWorkLogsByDate } from './dataTransform';

/**
 * 聚合数据项
 */
export interface AggregatedData {
  isoDate: string; // ISO 日期 YYYY-MM-DD
  periodLabel: string; // 期间标签，如 "Jan 2026", "Week 3", etc.
  displayX?: number | string; // X 轴显示的数字或字符串
  fullLabel: string; // 完整标签
  compositions: number;
  layers: number;
  keyframes: number;
  effects: number;
  runtime: number; // 秒
  projectCount: number;
  projects?: any[]; // 项目详情（可选）
}

/**
 * 视图模式
 */
export type ViewMode = 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * 获取日期范围
 * @param viewMode 视图模式
 * @param cursorDate 当前日期
 * @returns 开始和结束日期
 */
export function getDateRange(viewMode: ViewMode, cursorDate: Date): { startDate: string; endDate: string } {
  const startDate = new Date(cursorDate);
  const endDate = new Date(cursorDate);

  switch (viewMode) {
    case 'week':
      // 当前周（周一到周日）
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周一为 0
      startDate.setDate(startDate.getDate() - diff);
      endDate.setDate(startDate.getDate() + 6);
      break;

    case 'month':
      // 当前月
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      break;

    case 'quarter':
      // 当前季度
      const quarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      endDate.setMonth((quarter + 1) * 3, 0);
      break;

    case 'year':
      // 当前年
      startDate.setMonth(0, 1);
      endDate.setMonth(11, 31);
      break;

    case 'all':
      // 所有数据（过去 10 年到未来 5 年，确保能覆盖所有历史数据）
      startDate.setFullYear(startDate.getFullYear() - 10);
      startDate.setMonth(0, 1);
      endDate.setFullYear(endDate.getFullYear() + 5);
      endDate.setMonth(11, 31);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * 生成期间标签
 * @param viewMode 视图模式
 * @param date 日期
 * @param index 索引（用于周）
 * @returns 期间标签
 */
export function generatePeriodLabel(viewMode: ViewMode, date: Date, index?: number): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  switch (viewMode) {
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `Week ${index || 1}: ${weekStart.getDate()}/${months[weekStart.getMonth()]} - ${weekEnd.getDate()}/${months[weekEnd.getMonth()]}`;

    case 'month':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;

    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;

    case 'year':
      return `${date.getFullYear()}`;

    case 'all':
      return `${date.getFullYear()}`;

    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * 聚合工作日志数据
 * @param workLogs 工作日志数组
 * @param viewMode 视图模式
 * @param lang 语言
 * @returns 聚合数据数组
 */
export function aggregateWorkLogs(workLogs: WorkLog[], viewMode: ViewMode, lang: 'EN' | 'ZH'): AggregatedData[] {
  if (workLogs.length === 0) {
    return [];
  }

  // 按日期分组
  const dailyDataMap = aggregateWorkLogsByDate(workLogs);

  // 根据视图模式进行聚合
  const aggregatedMap = new Map<string, AggregatedData>();

  dailyDataMap.forEach((dailyData, date) => {
    const dateObj = new Date(date);
    let periodKey: string;
    let periodLabel: string;
    let displayX: number | string;

    switch (viewMode) {
      case 'week':
        // 按周聚合
        const weekStart = new Date(dateObj);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
        periodKey = weekStart.toISOString().split('T')[0];
        periodLabel = `Week ${Math.ceil(weekStart.getDate() / 7)}`;
        displayX = Math.ceil(weekStart.getDate() / 7);
        break;

      case 'month':
        // 按月聚合
        periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const monthsEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        periodLabel = lang === 'ZH' ? monthsZh[dateObj.getMonth()] : monthsEn[dateObj.getMonth()];
        displayX = dateObj.getMonth() + 1;
        break;

      case 'quarter':
        // 按季度聚合
        const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
        periodKey = `${dateObj.getFullYear()}-Q${quarter}`;
        periodLabel = `Q${quarter}`;
        displayX = quarter;
        break;

      case 'year':
        // 按年聚合
        periodKey = `${dateObj.getFullYear()}`;
        periodLabel = `${dateObj.getFullYear()}`;
        displayX = dateObj.getFullYear();
        break;

      case 'all':
        // 按年聚合（显示所有年份）
        periodKey = `${dateObj.getFullYear()}`;
        periodLabel = `${dateObj.getFullYear()}`;
        displayX = dateObj.getFullYear();
        break;

      default:
        periodKey = date;
        periodLabel = date;
        displayX = date;
    }

    // 聚合数据
    if (!aggregatedMap.has(periodKey)) {
      aggregatedMap.set(periodKey, {
        isoDate: periodKey,
        periodLabel,
        displayX,
        fullLabel: periodLabel,
        compositions: 0,
        layers: 0,
        keyframes: 0,
        effects: 0,
        runtime: 0,
        projectCount: 0,
        projects: []
      });
    }

    const aggregated = aggregatedMap.get(periodKey)!;
    dailyData.projects.forEach(project => {
      aggregated.compositions += project.statistics.compositions;
      aggregated.layers += project.statistics.layers;
      aggregated.keyframes += project.statistics.keyframes;
      aggregated.effects += project.statistics.effects;
      aggregated.runtime += project.accumulatedRuntime;
      aggregated.projectCount += 1;
      if (aggregated.projects) {
        aggregated.projects.push(project);
      }
    });
  });

  // 返回排序后的数组
  return Array.from(aggregatedMap.values()).sort((a, b) => {
    return a.isoDate.localeCompare(b.isoDate);
  });
}

/**
 * 获取 Analytics 数据
 * @param viewMode 视图模式
 * @param cursorDate 当前日期
 * @param showDaily 是否显示每日详情
 * @param lang 语言
 * @param workLogs 工作日志数组
 * @returns 聚合数据和标签
 */
export function getAnalyticsData(
  viewMode: ViewMode,
  cursorDate: Date,
  showDaily: boolean,
  lang: 'EN' | 'ZH',
  workLogs: WorkLog[]
): { data: AggregatedData[]; label: string } {
  // 生成时间标签
  const timeLabel = generatePeriodLabel(viewMode, cursorDate);

  // 聚合数据
  const aggregatedData = showDaily 
    ? aggregateWorkLogsDaily(workLogs, lang)
    : aggregateWorkLogs(workLogs, viewMode, lang);

  return {
    data: aggregatedData,
    label: timeLabel
  };
}

/**
 * 按日聚合工作日志（用于 showDaily 模式）
 * @param workLogs 工作日志数组
 * @param lang 语言
 * @returns 聚合数据数组
 */
function aggregateWorkLogsDaily(workLogs: WorkLog[], lang: 'EN' | 'ZH'): AggregatedData[] {
  const dailyDataMap = aggregateWorkLogsByDate(workLogs);

  return Array.from(dailyDataMap.entries()).map(([date, dailyData]) => {
    const dateObj = new Date(date);
    const monthsEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    return {
      isoDate: date,
      periodLabel: `${dateObj.getDate()} ${lang === 'ZH' ? monthsZh[dateObj.getMonth()] : monthsEn[dateObj.getMonth()]}`,
      displayX: dateObj.getDate(),
      fullLabel: date,
      compositions: dailyData.projects.reduce((sum, p) => sum + p.statistics.compositions, 0),
      layers: dailyData.projects.reduce((sum, p) => sum + p.statistics.layers, 0),
      keyframes: dailyData.projects.reduce((sum, p) => sum + p.statistics.keyframes, 0),
      effects: dailyData.projects.reduce((sum, p) => sum + p.statistics.effects, 0),
      runtime: dailyData.projects.reduce((sum, p) => sum + p.accumulatedRuntime, 0),
      projectCount: dailyData.projects.length,
      projects: dailyData.projects
    };
  }).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}