// 用户信息内存缓存服务
import { User } from '@/types/user';
import { getUserInfo } from './userService';

// 缓存条目接口
interface CacheEntry {
  user: User;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// 内存缓存存储
class UserCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟
  private readonly MAX_CACHE_SIZE = 1000; // 最大缓存用户数

  /**
   * 获取用户信息（优先从缓存）
   */
  async getUserInfo(clerkUserId: string): Promise<User | null> {
    // 1. 尝试从缓存获取
    const cached = this.getFromCache(clerkUserId);
    if (cached) {
      console.log(`🚀 [USER_CACHE] 缓存命中: ${clerkUserId} -> ${cached.uuid}`);
      return cached;
    }

    // 2. 缓存未命中，从数据库查询
    console.log(`🔍 [USER_CACHE] 缓存未命中，查询数据库: ${clerkUserId}`);
    const user = await getUserInfo(clerkUserId, 'clerk_id');
    
    // 3. 将结果存入缓存
    if (user) {
      this.setCache(clerkUserId, user);
      console.log(`💾 [USER_CACHE] 已缓存用户: ${clerkUserId} -> ${user.uuid}`);
    }

    return user;
  }

  /**
   * 从缓存获取用户信息
   */
  private getFromCache(clerkUserId: string): User | null {
    const entry = this.cache.get(clerkUserId);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(clerkUserId);
      console.log(`⏰ [USER_CACHE] 缓存已过期: ${clerkUserId}`);
      return null;
    }

    return entry.user;
  }

  /**
   * 设置缓存
   */
  private setCache(clerkUserId: string, user: User, ttl?: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      user,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };

    this.cache.set(clerkUserId, entry);
  }

  /**
   * 删除最旧的缓存条目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ [USER_CACHE] 删除最旧缓存: ${oldestKey}`);
    }
  }

  /**
   * 手动刷新用户缓存
   */
  async refreshUser(clerkUserId: string): Promise<User | null> {
    this.cache.delete(clerkUserId);
    return this.getUserInfo(clerkUserId);
  }

  /**
   * 清空特定用户缓存
   */
  invalidateUser(clerkUserId: string): void {
    this.cache.delete(clerkUserId);
    console.log(`🔄 [USER_CACHE] 清空用户缓存: ${clerkUserId}`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log(`🧹 [USER_CACHE] 清空所有缓存`);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 预热缓存（批量加载常用用户）
   */
  async warmup(clerkUserIds: string[]): Promise<void> {
    console.log(`🔥 [USER_CACHE] 开始预热缓存，用户数: ${clerkUserIds.length}`);
    
    const promises = clerkUserIds.map(id => this.getUserInfo(id));
    await Promise.all(promises);
    
    console.log(`✅ [USER_CACHE] 缓存预热完成`);
  }
}

// 创建全局缓存实例
const userCache = new UserCache();

// 导出优化后的用户查询函数
export async function getUserInfoCached(clerkUserId: string): Promise<User | null> {
  return userCache.getUserInfo(clerkUserId);
}

// 导出缓存管理函数
export const userCacheManager = {
  refresh: (clerkUserId: string) => userCache.refreshUser(clerkUserId),
  invalidate: (clerkUserId: string) => userCache.invalidateUser(clerkUserId),
  clear: () => userCache.clear(),
  getStats: () => userCache.getStats(),
  warmup: (clerkUserIds: string[]) => userCache.warmup(clerkUserIds)
};

export default userCache; 