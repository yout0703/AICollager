"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserProviderProps {
  children: React.ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isUserSetupChecked, setIsUserSetupChecked] = useState(false);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);

  // 检查和设置用户
  useEffect(() => {
    const checkAndSetupUser = async () => {
      // 只有在用户已登录、Clerk已加载且还未检查过当前用户时才执行
      if (!isLoaded || !isSignedIn || !user?.id) {
        return;
      }

      // 如果已经检查过当前用户，跳过
      if (lastCheckedUserId === user.id) {
        return;
      }

      console.log('开始检查用户设置:', user.id);

      try {
        // 首先检查用户是否需要初始化
        const checkResponse = await fetch('/api/auth/setup', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          console.log('用户检查结果:', checkResult);
          
          if (checkResult.needs_setup) {
            console.log('用户需要初始化，开始创建用户记录...');
            
            // 用户需要初始化，自动创建用户记录
            const setupResponse = await fetch('/api/auth/setup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                language: navigator.language.startsWith('zh') ? 'zh-CN' : 'en',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
              }),
            });

            if (setupResponse.ok) {
              const setupResult = await setupResponse.json();
              console.log('用户自动创建成功:', setupResult);
            } else {
              const errorText = await setupResponse.text();
              console.error('用户创建失败:', setupResponse.status, errorText);
            }
          }
        } else {
          const errorText = await checkResponse.text();
          console.error('检查用户状态失败:', checkResponse.status, errorText);
        }
      } catch (error) {
        console.error('用户设置检查失败:', error);
      } finally {
        setIsUserSetupChecked(true);
        setLastCheckedUserId(user.id);
      }
    };

    checkAndSetupUser();
  }, [isLoaded, isSignedIn, user?.id, lastCheckedUserId]);

  // 重置检查状态当用户登出时
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setIsUserSetupChecked(false);
      setLastCheckedUserId(null);
    }
  }, [isLoaded, isSignedIn]);

  return <>{children}</>;
} 