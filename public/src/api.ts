/**
 * API Service - API 服务模块
 * 提供与后端 API 交互的功能
 */

import { dataCache } from './cache';
import { WorkLogsResponse, ApiResponse, UserConfig, AEStatus } from './types/api';
import { WorkLog } from './types/database';

/**
 * API 基础配置
 */
const API_BASE = window.location.origin;

/**
 * 获取认证头
 * @returns 包含 Authorization 头的对象
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('rualive_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * 通用 API 请求函数
 * @param endpoint API 端点
 * @param options 请求选项
 * @returns 响应数据
 */
async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE + endpoint;
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * 获取工作日志（单个日期）
 * @param date 日期（YYYY-MM-DD），如果不提供则获取所有工作日志
 * @param useCache 是否使用缓存
 * @returns 工作日志响应
 */
export async function getWorkLogs(date?: string, useCache: boolean = true): Promise<WorkLogsResponse> {
  const cacheKey = date ? `work-logs:${date}` : 'work-logs:all';
  
  if (useCache && dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const params = date ? `?date=${date}` : '';
  const response = await apiRequest<WorkLogsResponse>(`/api/work-logs${params}`);
  
  if (useCache) {
    dataCache.set(cacheKey, response);
  }
  
  return response;
}

/**
 * 获取日期范围的工作日志
 * @param startDate 开始日期（YYYY-MM-DD）
 * @param endDate 结束日期（YYYY-MM-DD）
 * @param useCache 是否使用缓存
 * @returns 工作日志响应
 */
export async function getWorkLogsByRange(
  startDate: string, 
  endDate: string,
  useCache: boolean = true
): Promise<WorkLogsResponse> {
  const cacheKey = `work-logs:range:${startDate}:${endDate}`;
  
  if (useCache && dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const response = await apiRequest<WorkLogsResponse>(
    `/api/work-logs/range?start_date=${startDate}&end_date=${endDate}`
  );
  
  if (useCache) {
    dataCache.set(cacheKey, response);
  }
  
  return response;
}

/**
 * 获取用户配置
 * @param useCache 是否使用缓存
 * @returns 用户配置
 */
export async function getUserConfig(useCache: boolean = true): Promise<UserConfig> {
  const cacheKey = 'user-config';
  
  if (useCache && dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const response = await apiRequest<ApiResponse<UserConfig>>('/api/config');
  const config = response.data || {};
  
  if (useCache) {
    dataCache.set(cacheKey, config);
  }
  
  return config;
}

/**
 * 保存用户配置
 * @param config 用户配置
 * @returns 响应
 */
export async function saveUserConfig(config: UserConfig): Promise<ApiResponse> {
  const response = await apiRequest<ApiResponse>('/api/config', {
    method: 'POST',
    body: JSON.stringify(config)
  });
  
  // 清除配置缓存
  dataCache.delete('user-config');
  
  return response;
}

/**
 * 发送测试邮件
 * @returns 响应
 */
export async function sendTestEmail(): Promise<ApiResponse> {
  return apiRequest<ApiResponse>('/api/send-now', {
    method: 'POST'
  });
}

/**
 * 发送心跳
 * @returns 响应
 */
export async function sendHeartbeat(): Promise<ApiResponse<{ timestamp: string }>> {
  return apiRequest<ApiResponse<{ timestamp: string }>>('/api/heartbeat', {
    method: 'POST'
  });
}

/**
 * 获取 AE 状态
 * @param useCache 是否使用缓存（短时间缓存，1分钟）
 * @returns AE 状态
 */
export async function getAEStatus(useCache: boolean = true): Promise<ApiResponse<AEStatus>> {
  const cacheKey = 'ae-status';
  const shortTTL = 60 * 1000; // 1 分钟
  
  if (useCache && dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const response = await apiRequest<ApiResponse<AEStatus>>('/api/ae-status');
  
  if (useCache) {
    dataCache.set(cacheKey, response, shortTTL);
  }
  
  return response;
}

/**
 * 更新 AE 状态
 * @param status AE 状态
 * @returns 响应
 */
export async function updateAEStatus(status: Partial<AEStatus>): Promise<ApiResponse> {
  const response = await apiRequest<ApiResponse>('/api/ae-status', {
    method: 'POST',
    body: JSON.stringify(status)
  });
  
  // 清除状态缓存
  dataCache.delete('ae-status');
  
  return response;
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  dataCache.clear();
}

/**
 * 清除特定类型的缓存
 * @param type 缓存类型：'work-logs' | 'user-config' | 'ae-status' | 'all'
 */
export function clearCacheByType(type: 'work-logs' | 'user-config' | 'ae-status' | 'all'): void {
  if (type === 'all') {
    dataCache.clear();
    return;
  }

  // 遍历缓存并删除匹配的项
  const keysToDelete: string[] = [];
  for (const key of dataCache['cache'].keys()) {
    if (key.startsWith(type)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => dataCache.delete(key));
}