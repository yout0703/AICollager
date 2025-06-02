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
        console.log('🔍 [USER_PROVIDER] 跳过用户检查:', { isLoaded, isSignedIn, hasUserId: !!user?.id });
        return;
      }

      // 如果已经检查过当前用户，跳过
      if (lastCheckedUserId === user.id) {
        console.log('🔍 [USER_PROVIDER] 用户已检查过，跳过:', user.id);
        return;
      }

      console.log('🔄 [USER_PROVIDER] 开始检查用户设置:', user.id);

      try {
        // 首先检查用户是否需要初始化
        console.log('🔍 [USER_PROVIDER] 发送 GET 请求检查用户状态');
        const checkResponse = await fetch('/api/auth/setup', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('🔍 [USER_PROVIDER] 检查响应状态:', checkResponse.status);

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          console.log('✅ [USER_PROVIDER] 用户检查结果:', checkResult);
          
          if (checkResult.needs_setup) {
            console.log('🆕 [USER_PROVIDER] 用户需要初始化，开始创建用户记录...');
            
            const setupData = {
              language: navigator.language.startsWith('zh') ? 'zh-CN' : 'en',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
            };
            console.log('🔍 [USER_PROVIDER] 设置数据:', setupData);
            
            // 用户需要初始化，自动创建用户记录
            const setupResponse = await fetch('/api/auth/setup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(setupData),
            });

            console.log('🔍 [USER_PROVIDER] 设置响应状态:', setupResponse.status);

            if (setupResponse.ok) {
              const setupResult = await setupResponse.json();
              console.log('✅ [USER_PROVIDER] 用户自动创建成功:', setupResult);
            } else {
              const errorText = await setupResponse.text();
              console.error('❌ [USER_PROVIDER] 用户创建失败:', {
                status: setupResponse.status,
                statusText: setupResponse.statusText,
                error: errorText
              });
              
              // 尝试解析错误响应
              try {
                const errorJson = JSON.parse(errorText);
                console.error('❌ [USER_PROVIDER] 解析的错误信息:', errorJson);
              } catch (parseError) {
                console.error('❌ [USER_PROVIDER] 无法解析错误响应:', parseError);
              }
            }
          } else {
            console.log('✅ [USER_PROVIDER] 用户已存在，无需初始化');
          }
        } else {
          const errorText = await checkResponse.text();
          console.error('❌ [USER_PROVIDER] 检查用户状态失败:', {
            status: checkResponse.status,
            statusText: checkResponse.statusText,
            error: errorText
          });
          
          // 尝试解析错误响应
          try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ [USER_PROVIDER] 解析的检查错误信息:', errorJson);
          } catch (parseError) {
            console.error('❌ [USER_PROVIDER] 无法解析检查错误响应:', parseError);
          }
        }
      } catch (error) {
        console.error('❌ [USER_PROVIDER] 用户设置检查失败:', error);
        console.error('❌ [USER_PROVIDER] 错误详情:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      } finally {
        console.log('🏁 [USER_PROVIDER] 用户检查流程结束');
        setIsUserSetupChecked(true);
        setLastCheckedUserId(user.id);
      }
    };

    checkAndSetupUser();
  }, [isLoaded, isSignedIn, user?.id, lastCheckedUserId]);

  // 重置检查状态当用户登出时
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('🔄 [USER_PROVIDER] 用户登出，重置检查状态');
      setIsUserSetupChecked(false);
      setLastCheckedUserId(null);
    }
  }, [isLoaded, isSignedIn]);

  return <>{children}</>;
} 