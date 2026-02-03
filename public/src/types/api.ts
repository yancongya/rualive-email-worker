/**
 * API Types - API 类型定义
 * 定义 API 请求和响应的 TypeScript 类型
 */

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 工作日志响应
 */
export interface WorkLogsResponse extends ApiResponse<WorkLog[]> {
  data?: WorkLog[];
}

/**
 * 用户配置
 */
export interface UserConfig {
  enabled: boolean;
  email_address?: string;
  daily_report_time?: string;
  emergency_email?: string;
  emergency_name?: string;
  min_work_hours?: number;
  min_keyframes?: number;
  min_json_size?: number;
  user_notification_time?: string;
  emergency_notification_time?: string;
  enable_emergency_notification?: boolean;
  notification_schedule?: string;
  notification_excluded_days?: string;
  send_time?: string;
  timezone?: string;
}

/**
 * AE 状态
 */
export interface AEStatus {
  is_online: boolean;
  last_heartbeat?: string;
  project_name?: string;
  composition_name?: string;
  project_id?: string;
  ae_version?: string;
  ae_language?: string;
  ae_theme?: string;
  os_name?: string;
  os_platform?: string;
  system_info?: SystemInfo;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  ae: {
    version?: string;
    appVersion?: string;
    buildName?: string;
    language?: string;
    theme?: string;
    projectOpen?: boolean;
    projectName?: string;
    projectPath?: string;
  };
  system: {
    os?: string;
    platform?: string;
    browser?: {
      userAgent?: string;
      platform?: string;
      language?: string;
    };
    screen?: {
      width?: number;
      height?: number;
    };
    window?: {
      innerWidth?: number;
      innerHeight?: number;
    };
  };
  timestamp?: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  email: string;
  username: string;
  role: string;
}

/**
 * 认证响应
 */
export interface AuthResponse extends ApiResponse<{
  user: UserInfo;
  token: string;
}> {}

// 导入数据库类型
import { WorkLog } from './database';