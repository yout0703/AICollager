import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/60">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">页面未找到</h2>
          <p className="text-muted-foreground">
            抱歉，您访问的页面不存在或已被移动。
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            返回首页
          </Link>

          <div>
            <Link
              href="/collage"
              className="inline-block text-primary hover:text-primary/80 underline"
            >
              开始创建拼贴
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
