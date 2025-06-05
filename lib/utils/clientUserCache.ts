// 前端用户信息缓存工具
'use client';

interface UserInfo {
  userId: string; // 内部 UUID
  clerkUserId: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  credits: number;
  [key: string]: any;
}

interface CachedUserData {
  user: UserInfo;
  timestamp: number;
  ttl: number;
}

class ClientUserCache {
  private static readonly STORAGE_KEY = 'aicollager_user_cache';
  private static readonly DEFAULT_TTL = 30 * 60 * 1000; // 30分钟

  /**
   * 获取缓存的用户信息
   */
  static getUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;

      const data: CachedUserData = JSON.parse(cached);
      
      // 检查是否过期
      if (Date.now() - data.timestamp > data.ttl) {
        this.clearUser();
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('获取缓存用户信息失败:', error);
      this.clearUser();
      return null;
    }
  }

  /**
   * 缓存用户信息
   */
  static setUser(user: UserInfo, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === 'undefined') return;

    try {
      const data: CachedUserData = {
        user,
        timestamp: Date.now(),
        ttl
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('✅ 用户信息已缓存到浏览器');
    } catch (error) {
      console.error('缓存用户信息失败:', error);
    }
  }

  /**
   * 清除缓存的用户信息
   */
  static clearUser(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ 已清除缓存的用户信息');
    } catch (error) {
      console.error('清除用户缓存失败:', error);
    }
  }

  /**
   * 获取用户的内部 UUID
   */
  static getUserId(): string | null {
    const user = this.getUser();
    return user?.userId || null;
  }

  /**
   * 获取用户的 Clerk ID
   */
  static getClerkUserId(): string | null {
    const user = this.getUser();
    return user?.clerkUserId || null;
  }

  /**
   * 更新特定字段
   */
  static updateUser(updates: Partial<UserInfo>): void {
    const currentUser = this.getUser();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    this.setUser(updatedUser);
  }

  /**
   * 检查用户是否已登录（有缓存且未过期）
   */
  static isLoggedIn(): boolean {
    return this.getUser() !== null;
  }
}

// React Hook for user cache
import { useState, useEffect } from 'react';

export function useUserCache() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cachedUser = ClientUserCache.getUser();
    setUser(cachedUser);
    setIsLoading(false);
  }, []);

  const updateUser = (updates: Partial<UserInfo>) => {
    ClientUserCache.updateUser(updates);
    setUser(ClientUserCache.getUser());
  };

  const clearUser = () => {
    ClientUserCache.clearUser();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          ClientUserCache.setUser(data.user);
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    userId: user?.userId,
    updateUser,
    clearUser,
    refreshUser
  };
}

export default ClientUserCache; 