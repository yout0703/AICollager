"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface DebugInfo {
  timestamp: string;
  environment: {
    NODE_ENV: string;
    hasSupabaseUrl: boolean;
    hasSupabaseAnonKey: boolean;
    hasSupabaseServiceKey: boolean;
    hasDatabaseUrl: boolean;
    hasClerkSecretKey: boolean;
    hasClerkPublishableKey: boolean;
    supabaseUrl: string;
  };
  database: {
    type: string;
    clientConnection: boolean;
    serverConnection: boolean;
    error: string | null;
  };
  status: string;
}

export default function DebugPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // 检查访问权限
  useEffect(() => {
    // 在开发环境允许所有人访问
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // 在生产环境只允许特定邮箱访问（你可以修改这个列表）
    const allowedEmails = [
      'kissmykeke2020@gmail.com', // 你的邮箱
      // 可以添加其他管理员邮箱
    ];

    if (!isLoaded) return;

    if (!isSignedIn || !user?.emailAddresses?.[0]?.emailAddress) {
      setAccessDenied(true);
      return;
    }

    const userEmail = user.emailAddresses[0].emailAddress;
    if (!allowedEmails.includes(userEmail)) {
      setAccessDenied(true);
      return;
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/db-status');
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      } else {
        const errorText = await response.text();
        setError(`请求失败: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`网络错误: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessDenied) {
      fetchDebugInfo();
    }
  }, [accessDenied]);

  const testUserSetup = async () => {
    if (!isSignedIn) {
      alert('请先登录');
      return;
    }

    try {
      console.log('🔄 [DEBUG] 开始测试用户设置');
      
      // 测试 GET 请求
      const getResponse = await fetch('/api/auth/setup', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🔍 [DEBUG] GET 响应状态:', getResponse.status);
      const getResult = await getResponse.json();
      console.log('🔍 [DEBUG] GET 响应内容:', getResult);
      
      if (getResult.needs_setup) {
        // 测试 POST 请求
        const postResponse = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'zh-CN',
            timezone: 'Asia/Shanghai'
          })
        });
        
        console.log('🔍 [DEBUG] POST 响应状态:', postResponse.status);
        const postResult = await postResponse.json();
        console.log('🔍 [DEBUG] POST 响应内容:', postResult);
      }
      
      alert('测试完成，请查看控制台日志');
    } catch (err) {
      console.error('❌ [DEBUG] 测试失败:', err);
      alert(`测试失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 访问被拒绝的页面
  if (accessDenied) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">访问被拒绝</h1>
          <p className="text-red-600 mb-4">
            此页面仅限管理员访问。
          </p>
          <p className="text-sm text-red-500">
            如果您是管理员，请确保您已登录正确的账户。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">系统调试信息</h1>
        <div className="text-sm text-gray-500">
          环境: {process.env.NODE_ENV}
        </div>
      </div>
      
      {/* 用户信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">用户状态</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Clerk 加载状态:</span>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isLoaded ? '已加载' : '加载中'}
            </span>
          </div>
          <div>
            <span className="font-medium">登录状态:</span>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isSignedIn ? '已登录' : '未登录'}
            </span>
          </div>
          {user && (
            <>
              <div>
                <span className="font-medium">用户 ID:</span>
                <span className="ml-2 text-sm font-mono">{user.id}</span>
              </div>
              <div>
                <span className="font-medium">邮箱:</span>
                <span className="ml-2 text-sm">{user.emailAddresses?.[0]?.emailAddress}</span>
              </div>
            </>
          )}
        </div>
        
        {isSignedIn && (
          <button
            onClick={testUserSetup}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            测试用户设置流程
          </button>
        )}
      </div>

      {/* 数据库状态 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">数据库状态</h2>
          <button
            onClick={fetchDebugInfo}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>错误:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* 环境变量 */}
            <div>
              <h3 className="text-lg font-medium mb-3">环境变量</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">环境:</span>
                  <span className="ml-2">{debugInfo.environment.NODE_ENV}</span>
                </div>
                <div>
                  <span className="font-medium">Supabase URL:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environment.hasSupabaseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environment.hasSupabaseUrl ? '已配置' : '未配置'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Supabase Anon Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environment.hasSupabaseAnonKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environment.hasSupabaseAnonKey ? '已配置' : '未配置'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Supabase Service Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environment.hasSupabaseServiceKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environment.hasSupabaseServiceKey ? '已配置' : '未配置'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Clerk Secret Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environment.hasClerkSecretKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environment.hasClerkSecretKey ? '已配置' : '未配置'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Clerk Publishable Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environment.hasClerkPublishableKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environment.hasClerkPublishableKey ? '已配置' : '未配置'}
                  </span>
                </div>
              </div>
              
              {debugInfo.environment.hasSupabaseUrl && (
                <div className="mt-2">
                  <span className="font-medium">Supabase URL (部分):</span>
                  <span className="ml-2 text-sm font-mono">{debugInfo.environment.supabaseUrl}</span>
                </div>
              )}
            </div>

            {/* 数据库连接 */}
            <div>
              <h3 className="text-lg font-medium mb-3">数据库连接</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">数据库类型:</span>
                  <span className="ml-2">{debugInfo.database.type}</span>
                </div>
                <div>
                  <span className="font-medium">客户端连接:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.database.clientConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.database.clientConnection ? '成功' : '失败'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">服务端连接:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.database.serverConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.database.serverConnection ? '成功' : '失败'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">整体状态:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.status === 'healthy' ? '健康' : '异常'}
                  </span>
                </div>
              </div>
              
              {debugInfo.database.error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                  <span className="font-medium text-red-800">数据库错误:</span>
                  <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{debugInfo.database.error}</pre>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              最后更新: {new Date(debugInfo.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3 text-blue-800">调试说明</h3>
        <ul className="list-disc list-inside space-y-2 text-blue-700">
          <li>如果环境变量显示&ldquo;未配置&rdquo;，请检查 Vercel 项目的环境变量设置</li>
          <li>如果数据库连接失败，请检查 Supabase 项目状态和 API 密钥</li>
          <li>登录后点击&ldquo;测试用户设置流程&rdquo;可以测试完整的用户初始化过程</li>
          <li>所有详细日志都会输出到浏览器控制台，请打开开发者工具查看</li>
          <li>在 Vercel 后台的 Functions 标签页可以查看服务端日志</li>
        </ul>
      </div>
    </div>
  );
} 