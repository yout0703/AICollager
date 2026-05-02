'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicComponentProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

// 默认加载组件
export function DefaultLoading({ message = "加载中..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
}

// 错误边界组件
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Dynamic component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <div className="text-destructive mb-2">组件加载失败</div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 动态组件包装器
export function DynamicComponent({
  children,
  fallback = <DefaultLoading />,
  error,
  className = ''
}: DynamicComponentProps) {
  return (
    <div className={className}>
      <ErrorBoundary fallback={error}>
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// 动态导入工具函数
export function createDynamicComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loading?: React.ComponentType;
    error?: React.ComponentType<{ error: Error; retry: () => void }>;
    ssr?: boolean;
  } = {}
) {
  const {
    loading: LoadingComponent = DefaultLoading,
    error: ErrorComponent,
    ssr = false
  } = options;

  const LazyComponent = lazy(importFunc);

  return function DynamicWrapper(props: any) {
    // 如果是服务端渲染且不支持 SSR，则不渲染
    if (typeof window === 'undefined' && !ssr) {
      return <LoadingComponent />;
    }

    return (
      <DynamicComponent
        fallback={<LoadingComponent />}
        error={ErrorComponent ? <ErrorComponent error={new Error('Component failed to load')} retry={() => window.location.reload()} /> : undefined}
      >
        <LazyComponent {...props} />
      </DynamicComponent>
    );
  };
}

// 预设的动态组件加载器 - 仅包含确实存在的组件
export const DynamicEditor = createDynamicComponent(
  () => import('@/components/editor/Canvas'),
  {
    loading: () => <DefaultLoading message="加载编辑器中..." />,
    ssr: false
  }
);

// Hook for progressive loading
export function useProgressiveLoading<T>(
  dependencies: T[],
  delay: number = 100
) {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, delay);

    return () => clearTimeout(timer);
    // The caller controls reload semantics through the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return loaded;
}

// 渐进式加载包装器
export function ProgressiveLoader({
  children,
  delay = 0,
  fallback = <DefaultLoading />
}: {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}) {
  const loaded = useProgressiveLoading([], delay);

  if (!loaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default DynamicComponent;
