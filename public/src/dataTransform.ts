/**
 * Data Transform - 数据格式转换
 * 将数据库 JSON 格式转换为 User V6 的 TypeScript 接口格式
 */

import { WorkLog, CompositionItem, EffectItem, LayerItem, KeyframeItem, ProjectInfo } from './types/database';

/**
 * 图层分布类型
 */
export interface LayerDistribution {
  video: number;
  image: number;
  sequence: number;
  designFile: number;
  sourceFile: number;
  nullSolidLayer: number;
  shapeLayer: number;
  textLayer: number;
  adjustmentLayer: number;
  lightLayer: number;
  cameraLayer: number;
  other: number;
}

/**
 * 关键帧数据
 */
export interface KeyframeData {
  [layerName: string]: number;
}

/**
 * 特效统计
 */
export interface EffectCountData {
  [effectName: string]: number;
}

/**
 * 项目详情
 */
export interface ProjectDetails {
  compositions: string[];
  layers: LayerDistribution;
  keyframes: KeyframeData;
  effectCounts: EffectCountData;
}

/**
 * 项目统计
 */
export interface ProjectStatistics {
  compositions: number;
  layers: number;
  keyframes: number;
  effects: number;
}

/**
 * 项目数据（User V6 格式）
 */
export interface ProjectData {
  projectId: string;
  name: string;
  dailyRuntime: string;
  accumulatedRuntime: number;
  statistics: ProjectStatistics;
  details: ProjectDetails;
}

/**
 * 每日数据
 */
export interface DailyData {
  date: string;
  projects: ProjectData[];
}

/**
 * 将 WorkLog 转换为 DailyData
 * @param workLog 工作日志
 * @returns 每日数据
 */
export function workLogToDailyData(workLog: WorkLog): DailyData {
  const projects = workLogToProjectData(workLog);
  return {
    date: workLog.work_date,
    projects
  };
}

/**
 * 将 WorkLog 转换为 ProjectData 数组
 * @param workLog 工作日志
 * @returns 项目数据数组
 */
export function workLogToProjectData(workLog: WorkLog): ProjectData[] {
  console.log('[DataTransform] Processing work log:', workLog);
  
  // 解析 JSON 数据
  const projectsJson = safeParseJSON<ProjectInfo[]>(workLog.projects_json || '[]');
  const compositionsJson = safeParseJSON<CompositionItem[]>(workLog.compositions_json || '[]');
  const layersJson = safeParseJSON<LayerItem[]>(workLog.layers_json || '[]');
  const keyframesJson = safeParseJSON<KeyframeItem[]>(workLog.keyframes_json || '[]');
  const effectsJson = safeParseJSON<EffectItem[]>(workLog.effects_json || '[]');

  console.log('[DataTransform] Parsed JSON data:', {
    projectsJson,
    compositionsJson,
    layersJson,
    keyframesJson,
    effectsJson
  });

  // 按项目分组数据
  const projectMap = new Map<string, ProjectData>();

  // 如果没有项目数据，使用工作日期作为默认项目名称
  if (projectsJson.length === 0) {
    console.log('[DataTransform] No projects found, creating default project');
    const defaultProjectName = `Project_${workLog.work_date}`;
    const defaultProjectId = generateId(defaultProjectName);
    
    projectMap.set(defaultProjectName, {
      projectId: defaultProjectId,
      name: defaultProjectName,
      dailyRuntime: formatRuntime(workLog.work_hours),
      accumulatedRuntime: workLog.work_hours * 3600,
      statistics: {
        compositions: workLog.composition_count || 0,
        layers: workLog.layer_count || 0,
        keyframes: workLog.keyframe_count || 0,
        effects: workLog.effect_count || 0
      },
      details: {
        compositions: [],
        layers: {
          video: 0,
          image: 0,
          sequence: 0,
          designFile: 0,
          sourceFile: 0,
          nullSolidLayer: 0,
          shapeLayer: 0,
          textLayer: 0,
          adjustmentLayer: 0,
          lightLayer: 0,
          cameraLayer: 0,
          other: 0
        },
        keyframes: {},
        effectCounts: {}
      }
    });
  }

  // 初始化项目
  projectsJson.forEach((p) => {
    const projectId = p.id || generateId(p.name);
    // 解码 URL 编码的项目名称
    const decodedName = decodeURIComponent(p.name);
    
    projectMap.set(decodedName, {
      projectId,
      name: decodedName,
      dailyRuntime: formatRuntime(workLog.work_hours),
      accumulatedRuntime: workLog.work_hours * 3600,
      statistics: {
        compositions: 0,
        layers: 0,
        keyframes: 0,
        effects: 0
      },
      details: {
        compositions: [],
        layers: {
          video: 0,
          image: 0,
          sequence: 0,
          designFile: 0,
          sourceFile: 0,
          nullSolidLayer: 0,
          shapeLayer: 0,
          textLayer: 0,
          adjustmentLayer: 0,
          lightLayer: 0,
          cameraLayer: 0,
          other: 0
        },
        keyframes: {},
        effectCounts: {}
      }
    });
  });

  // 填充合成数据
  compositionsJson.forEach((c) => {
    const project = projectMap.get(c.project);
    if (project) {
      project.details.compositions.push(c.name);
      project.statistics.compositions++;
    }
  });

  // 填充图层数据（需要分类）
  layersJson.forEach((l) => {
    const project = projectMap.get(l.project);
    if (project) {
      const layerType = classifyLayer(l.name);
      project.details.layers[layerType]++;
      project.statistics.layers++;
    }
  });

  // 填充关键帧数据
  keyframesJson.forEach((k) => {
    const project = projectMap.get(k.project);
    if (project) {
      project.details.keyframes[k.layer] = (project.details.keyframes[k.layer] || 0) + k.count;
      project.statistics.keyframes += k.count;
    }
  });

  // 填充特效数据
  effectsJson.forEach((e) => {
    const project = projectMap.get(e.project);
    if (project) {
      project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + e.count;
      project.statistics.effects++;
    }
  });

  const result = Array.from(projectMap.values());
  console.log('[DataTransform] Final project data:', result);
  return result;
}

/**
 * 将多个 WorkLog 聚合为每日数据映射
 * @param workLogs 工作日志数组
 * @returns 按日期分组的每日数据映射
 */
export function aggregateWorkLogsByDate(workLogs: WorkLog[]): Map<string, DailyData> {
  const dailyDataMap = new Map<string, DailyData>();

  workLogs.forEach((workLog) => {
    const dailyData = workLogToDailyData(workLog);
    dailyDataMap.set(workLog.work_date, dailyData);
  });

  return dailyDataMap;
}

/**
 * 安全解析 JSON
 * @param json JSON 字符串
 * @returns 解析后的对象，失败则返回空数组
 */
function safeParseJSON<T>(json: string): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return [] as any;
  }
}

/**
 * 生成项目 ID
 * @param name 项目名称
 * @returns 项目 ID
 */
function generateId(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash.toString(16);
}

/**
 * 格式化运行时长
 * @param hours 小时数
 * @returns 格式化后的字符串
 */
function formatRuntime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

/**
 * 分类图层类型
 * @param layerName 图层名称
 * @returns 图层类型
 */
function classifyLayer(layerName: string): keyof LayerDistribution {
  const name = layerName.toLowerCase();
  
  // 直接匹配已知图层类型名称
  const knownTypes: Record<string, keyof LayerDistribution> = {
    'video': 'video',
    'image': 'image',
    'sequence': 'sequence',
    'designfile': 'designFile',
    'sourcefile': 'sourceFile',
    'nullsolidlayer': 'nullSolidLayer',
    'shapelayer': 'shapeLayer',
    'textlayer': 'textLayer',
    'adjustmentlayer': 'adjustmentLayer',
    'lightlayer': 'lightLayer',
    'cameralayer': 'cameraLayer'
  };
  
  if (knownTypes[name]) {
    return knownTypes[name];
  }
  
  // 根据关键词分类
  if (name.includes('video') || name.includes('mov') || name.includes('mp4') || name.includes('avi')) {
    return 'video';
  }
  
  if (name.includes('image') || name.includes('jpg') || name.includes('jpeg') || 
      name.includes('png') || name.includes('gif') || name.includes('bmp')) {
    return 'image';
  }
  
  if (name.includes('sequence') || name.includes('seq')) {
    return 'sequence';
  }
  
  if (name.includes('design') || name.includes('psd') || name.includes('ai') || 
      name.includes('illustrator') || name.includes('photoshop')) {
    return 'designFile';
  }
  
  if (name.includes('null') || name.includes('solid') || name.includes('color')) {
    return 'nullSolidLayer';
  }
  
  if (name.includes('shape')) {
    return 'shapeLayer';
  }
  
  if (name.includes('text')) {
    return 'textLayer';
  }
  
  if (name.includes('adjustment') || name.includes('adj')) {
    return 'adjustmentLayer';
  }
  
  if (name.includes('light')) {
    return 'lightLayer';
  }
  
  if (name.includes('camera') || name.includes('cam')) {
    return 'cameraLayer';
  }
  
  // 默认为其他
  return 'other';
}