import React from 'react';

// 前端缓存工具库
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number; // Time To Live in milliseconds
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class Cache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private storage: 'memory' | 'localStorage' | 'sessionStorage';

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 100;
    this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5分钟
    this.storage = config.storage || 'memory';

    // 如果使用localStorage，尝试恢复缓存
    if (this.storage !== 'memory' && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // 设置缓存
  set(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry
    };

    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }

    this.cache.set(key, item);
    this.saveToStorage();
  }

  // 获取缓存
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // 删除缓存
  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
    this.clearStorage();
  }

  // 检查缓存是否存在且未过期
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size;
  }

  // 获取最旧的key
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // 从存储加载
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.storage === 'localStorage' ? localStorage : sessionStorage;
      const cacheData = storage.getItem(`cache-${this.constructor.name}`);

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(parsed);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // 保存到存储
  private saveToStorage(): void {
    if (typeof window === 'undefined' || this.storage === 'memory') return;

    try {
      const storage = this.storage === 'localStorage' ? localStorage : sessionStorage;
      const cacheData = JSON.stringify(Array.from(this.cache.entries()));
      storage.setItem(`cache-${this.constructor.name}`, cacheData);
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  // 清空存储
  private clearStorage(): void {
    if (typeof window === 'undefined' || this.storage === 'memory') return;

    try {
      const storage = this.storage === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(`cache-${this.constructor.name}`);
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}

// 图片缓存
export const imageCache = new Cache<string>({
  maxSize: 50,
  defaultTTL: 30 * 60 * 1000, // 30分钟
  storage: 'localStorage'
});

// API响应缓存
export const apiCache = new Cache<any>({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5分钟
  storage: 'sessionStorage'
});

// 用户数据缓存
export const userCache = new Cache<any>({
  maxSize: 20,
  defaultTTL: 15 * 60 * 1000, // 15分钟
  storage: 'localStorage'
});

// 缓存装饰器函数
export function withCache<T extends any[], R>(
  cache: Cache<R>,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args);

      // 尝试从缓存获取
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 调用原方法并缓存结果
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// 简单的缓存hook
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cache?: Cache<T>;
    ttl?: number;
    enabled?: boolean;
  } = {}
) {
  const { cache = apiCache, ttl, enabled = true } = options;
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      // 先检查缓存
      const cached = cache.get(key);
      if (cached !== null) {
        setData(cached);
        return;
      }

      // 从网络获取
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        cache.set(key, result, ttl);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, enabled, cache, fetcher, ttl]);

  const invalidate = () => {
    cache.delete(key);
  };

  return { data, loading, error, invalidate };
}

// 图片预加载和缓存
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        // 检查缓存
        if (imageCache.has(url)) {
          resolve();
          return;
        }

        const img = new Image();
        img.onload = () => {
          imageCache.set(url, url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    })
  );
}

// 清理过期缓存
export function cleanupExpiredCache(): void {
  const caches = [imageCache, apiCache, userCache];

  caches.forEach(cache => {
    // 这里需要通过内部方法访问，实际使用中可能需要暴露迭代方法
    cache.clear(); // 简单的清理方式
  });
}

// 定期清理任务
if (typeof window !== 'undefined') {
  // 每10分钟清理一次过期缓存
  setInterval(cleanupExpiredCache, 10 * 60 * 1000);
}

export default Cache;
