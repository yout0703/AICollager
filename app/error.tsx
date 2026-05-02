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
    <div className="min-h-screen flex items-center justify-center bg-secondary/60">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-destructive mb-4">错误</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">出现了问题</h2>
          <p className="text-muted-foreground mb-4">
            抱歉，应用程序遇到了错误。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm text-muted-foreground bg-secondary p-4 rounded mb-4">
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
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors mr-4"
          >
            重试
          </button>

          <Link
            href="/"
            className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/80 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
