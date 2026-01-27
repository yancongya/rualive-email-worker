/**
 * Data Cache - 数据缓存管理
 * 提供简单的内存缓存功能，用于减少 API 调用
 */

class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private defaultTTL = 5 * 60 * 1000; // 默认 5 分钟

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒），默认使用 defaultTTL
   */
  set(key: string, data: any, ttl?: number): void {
    const expireTime = ttl !== undefined ? ttl : this.defaultTTL;
    this.cache.set(key, { data, timestamp: Date.now(), ttl: expireTime });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期则返回 null
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    const age = Date.now() - item.timestamp;
    const expireTime = item.ttl !== undefined ? item.ttl : this.defaultTTL;
    
    if (age > expireTime) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns 缓存项数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp;
      const expireTime = item.ttl !== undefined ? item.ttl : this.defaultTTL;
      if (age > expireTime) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取或设置缓存（如果缓存不存在则通过函数获取）
   * @param key 缓存键
   * @param fetchFn 数据获取函数
   * @param ttl 过期时间（毫秒）
   * @returns 缓存数据
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached as T;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
}

// 导出单例
export const dataCache = new DataCache();

// 定期清理过期缓存（每分钟）
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup();
  }, 60 * 1000);
}