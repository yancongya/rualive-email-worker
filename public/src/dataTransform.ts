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
  // 解析 JSON 数据
  console.log('[DataTransform] Raw effects_json:', workLog.effects_json);
  const projectsJson = safeParseJSON<ProjectInfo[]>(workLog.projects_json || '[]');
  const compositionsJson = safeParseJSON<CompositionItem[]>(workLog.compositions_json || '[]');
  const layersJson = safeParseJSON<LayerItem[]>(workLog.layers_json || '[]');
  const keyframesJson = safeParseJSON<KeyframeItem[]>(workLog.keyframes_json || '[]');
  const effectsJson = safeParseJSON<EffectItem[]>(workLog.effects_json || '[]');
  console.log('[DataTransform] Parsed effectsJson length:', effectsJson.length);

  // 按项目分组数据
  const projectMap = new Map<string, ProjectData>();

  // 解析工作时长 JSON，创建项目名称到工时的映射
  const workHoursMap = new Map<string, number>();
  if (workLog.work_hours_json) {
    try {
      const workHoursJson = JSON.parse(workLog.work_hours_json);
      workHoursJson.forEach((wh: { project: string; hours: string }) => {
        const decodedName = decodeURIComponent(wh.project);
        workHoursMap.set(decodedName, parseFloat(wh.hours));
      });
    } catch (error) {
      console.error('[DataTransform] Failed to parse work_hours_json:', error);
    }
  }

  // 如果没有项目数据，使用工作日期作为默认项目名称
  if (projectsJson.length === 0) {
    const defaultProjectName = `Project_${workLog.work_date}`;
    const defaultProjectId = generateId(defaultProjectName);
    
    // 直接使用数据库中的汇总字段
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

  // 初始化项目 - 使用数据库中的汇总字段作为默认值
  projectsJson.forEach((p) => {
    const projectId = p.id || generateId(p.name);
    // 解码 URL 编码的项目名称
    const decodedName = decodeURIComponent(p.name);
    
    // 从 workHoursMap 中获取该项目的工时，如果没有则使用 0
    const projectHours = workHoursMap.get(decodedName) || 0;
    
    // 使用项目信息中的统计数据，如果没有则使用数据库中的汇总字段按项目数平均分配
    const projectComps = p.compositions || Math.floor((workLog.composition_count || 0) / projectsJson.length);
    const projectLayers = p.layers || Math.floor((workLog.layer_count || 0) / projectsJson.length);
    const projectKeyframes = p.keyframes || Math.floor((workLog.keyframe_count || 0) / projectsJson.length);
    const projectEffects = p.effects || Math.floor((workLog.effect_count || 0) / projectsJson.length);
    
    projectMap.set(decodedName, {
      projectId,
      name: decodedName,
      dailyRuntime: formatRuntime(projectHours),
      accumulatedRuntime: projectHours * 3600,
      statistics: {
        compositions: projectComps,
        layers: projectLayers,
        keyframes: projectKeyframes,
        effects: projectEffects
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

  
  // 🔍 URL 解码函数 - 处理项目名称的 URL 编码
  const decodeProjectName = (name: string): string => {
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  };

  // 填充合成数据
  compositionsJson.forEach((c) => {
    // 🔍 对项目名称进行 URL 解码
    const decodedProjectName = decodeProjectName(c.project);
    const project = projectMap.get(decodedProjectName);
    if (project) {
      // 🔍 过滤空字符串
      if (c.name && c.name.trim() !== '') {
        project.details.compositions.push(c.name);
      }
      // 如果 JSON 数据存在，更新统计（取最大值）
      project.statistics.compositions = Math.max(project.statistics.compositions, project.details.compositions.length);
    }
  });

  // 填充图层数据（需要对图层进行分类）
  layersJson.forEach((l) => {
    // 🔍 对项目名称进行 URL 解码
    const decodedProjectName = decodeProjectName(l.project);
    const project = projectMap.get(decodedProjectName);
    if (project) {
      // 对图层名称进行分类
      const layerType = classifyLayer(l.name);
      const count = l.count || 1;
      project.details.layers[layerType] = (project.details.layers[layerType] || 0) + count;
      // 如果 JSON 数据存在，更新统计
      project.statistics.layers = Math.max(project.statistics.layers, Object.values(project.details.layers).reduce((a, b) => a + b, 0));
    }
  });

  // 填充关键帧数据
  let totalKeyframesFromJson = 0;
  keyframesJson.forEach((k) => {
    // 🔍 对项目名称进行 URL 解码
    const decodedProjectName = decodeProjectName(k.project);
    const project = projectMap.get(decodedProjectName);
    if (project) {
      project.details.keyframes[k.layer] = (project.details.keyframes[k.layer] || 0) + k.count;
      project.statistics.keyframes += k.count;
      totalKeyframesFromJson += k.count;
    }
  });

  // 如果 JSON 中的关键帧总数与数据库汇总字段不匹配，使用数据库汇总字段
  if (totalKeyframesFromJson > 0 && totalKeyframesFromJson !== (workLog.keyframe_count || 0)) {
    // Keyframe count mismatch detected
  }

  // 填充特效数据
  console.log('[DataTransform] effectsJson:', effectsJson);
  console.log('[DataTransform] effectsJson sample:', effectsJson.slice(0, 3));
  effectsJson.forEach((e, idx) => {
    if (idx < 5) {
      console.log('[DataTransform] Effect item:', e, 'count:', e.count, 'count type:', typeof e.count);
    }
    // 🔍 对项目名称进行 URL 解码
    const decodedProjectName = decodeProjectName(e.project);
    const project = projectMap.get(decodedProjectName);
    if (project) {
      // 🔍 过滤空名称
      if (e.name && e.name.trim() !== '') {
        const count = typeof e.count === 'number' && !isNaN(e.count) ? e.count : 0;
        project.details.effectCounts[e.name] = (project.details.effectCounts[e.name] || 0) + count;
      }
      // 如果 JSON 数据存在，更新统计（取最大值）
      project.statistics.effects = Math.max(project.statistics.effects, Object.keys(project.details.effectCounts).length);
    }
  });

  const result = Array.from(projectMap.values());

  // 🔍 检查每个项目的 details 是否为空，如果为空则使用数据库汇总字段创建默认数据
  result.forEach((project) => {
    // 如果所有 details 都是空的，说明数据填充失败
    const isDetailsEmpty =
      project.details.compositions.length === 0 &&
      Object.values(project.details.layers).every((count) => count === 0) &&
      Object.keys(project.details.keyframes).length === 0 &&
      Object.keys(project.details.effectCounts).length === 0;

    if (isDetailsEmpty) {

      // 创建默认的合成列表（合成数来自统计字段）
      for (let i = 1; i <= project.statistics.compositions; i++) {
        project.details.compositions.push(`合成 ${i}`);
      }

      // 创建默认的图层分布（平均分配）
      const layerTypes = ['video', 'image', 'shapeLayer', 'textLayer', 'other'];
      layerTypes.forEach((type) => {
        project.details.layers[type] = Math.floor(project.statistics.layers / layerTypes.length) || 1;
      });

      // 创建默认的关键帧分布（按合成数平均分配）
      for (let i = 1; i <= project.statistics.compositions; i++) {
        const keyframesPerComp = Math.floor(project.statistics.keyframes / project.statistics.compositions) || 1;
        project.details.keyframes[`图层 ${i}`] = keyframesPerComp;
      }

      // 创建默认的特效分布（按合成数平均分配）
      for (let i = 1; i <= project.statistics.compositions; i++) {
        const effectsPerComp = Math.floor(project.statistics.effects / project.statistics.compositions) || 1;
        project.details.effectCounts[`特效 ${i}`] = effectsPerComp;
      }
    }
  });

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