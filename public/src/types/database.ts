/**
 * Database Types - 数据库类型定义
 * 定义与 Cloudflare D1 数据库表结构对应的 TypeScript 类型
 */

/**
 * 工作日志数据（从 work_logs 表）
 */
export interface WorkLog {
  id: number;
  user_id: string;
  work_date: string; // YYYY-MM-DD
  work_hours: number;
  keyframe_count: number;
  json_size: number;
  project_count: number;
  composition_count: number;
  layer_count: number;
  effect_count: number;
  compositions_json: string | null; // JSON 字符串
  effects_json: string | null; // JSON 字符串
  layers_json: string | null; // JSON 字符串
  keyframes_json: string | null; // JSON 字符串
  projects_json: string | null; // JSON 字符串
  work_hours_json: string | null; // JSON 字符串
  created_at: string;
  updated_at: string;
}

/**
 * 合成项目（JSON 解析后）
 */
export interface CompositionItem {
  project: string;
  name: string;
}

/**
 * 特效项目（JSON 解析后）
 */
export interface EffectItem {
  project: string;
  name: string;
  count: number;
}

/**
 * 图层项目（JSON 解析后）
 */
export interface LayerItem {
  project: string;
  name: string;
  count?: number;
}

/**
 * 关键帧项目（JSON 解析后）
 */
export interface KeyframeItem {
  project: string;
  layer: string;
  count: number;
}

/**
 * 项目信息（JSON 解析后）
 */
export interface ProjectInfo {
  id?: string;
  name: string;
  path?: string;
  compositions?: number;
  layers?: number;
  keyframes?: number;
  effects?: number;
  runtime?: number;
}

/**
 * 工作时长记录（JSON 解析后）
 */
export interface WorkHourRecord {
  project: string;
  hours: number;
}