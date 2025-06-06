'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('全局错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-600 mb-4">错误</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">出现了问题</h2>
          <p className="text-gray-500 mb-4">
            抱歉，应用程序遇到了错误。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm text-gray-600 bg-gray-100 p-4 rounded mb-4">
              <summary className="cursor-pointer font-medium">错误详情</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            重试
          </button>
          
          <Link
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
} 