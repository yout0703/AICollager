"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { getDictionary, type Locale } from '@/lib/i18n';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<Toast>) => void;
  error: (message: string, options?: Partial<Toast>) => void;
  warning: (message: string, options?: Partial<Toast>) => void;
  info: (message: string, options?: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
  children,
  locale = 'zh' as Locale
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dict = getDictionary(locale);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // 自动移除Toast
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'success',
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'error',
      message,
      duration: 7000, // 错误消息显示更久
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'warning',
      message,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'info',
      message,
      ...options,
    });
  }, [addToast]);

  const value: ToastContextType = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }), [toasts, addToast, removeToast, success, error, warning, info]);

  // 设置全局 toast 实例
  React.useEffect(() => {
    setGlobalToast(value);
  }, [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} dict={dict} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
  dict
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
  dict: any;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          dict={dict}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
  dict
}: {
  toast: Toast;
  onRemove: (id: string) => void;
  dict: any;
}) {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-accent/10 border-accent/20 text-foreground';
      case 'error':
        return 'bg-destructive/10 border-destructive/20 text-foreground';
      case 'warning':
        return 'bg-primary/10 border-primary/20 text-foreground';
      case 'info':
        return 'bg-primary/10 border-primary/20 text-foreground';
      default:
        return 'bg-secondary border-border text-foreground';
    }
  };

  const getIcon = (type: ToastType) => {
    const iconClass = "w-5 h-5 flex-shrink-0";

    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-accent`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-destructive`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-primary`} />;
      case 'info':
        return <Info className={`${iconClass} text-primary`} />;
      default:
        return <Info className={`${iconClass} text-muted-foreground`} />;
    }
  };

  return (
    <div className={`
      ${getToastStyles(toast.type)}
      p-4 rounded-lg border shadow-sm
      transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
    `}>
      <div className="flex items-start">
        {getIcon(toast.type)}

        <div className="ml-3 flex-1">
          {toast.title && (
            <h4 className="text-sm font-medium mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm">
            {toast.message}
          </p>

          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={dict.ui?.close || '关闭'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// 网络错误处理工具函数
export function handleNetworkError(error: any, toast: ToastContextType, dict: any) {
  console.error('Network error:', error);

  if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
    toast.error(dict.errors?.networkError || '网络错误，请检查网络连接', {
      action: {
        label: dict.ui?.retry || '重试',
        onClick: () => window.location.reload()
      }
    });
  } else if (error?.response?.status === 413) {
    toast.error(dict.errors?.fileSizeError || '文件大小超出限制');
  } else if (error?.response?.status === 415) {
    toast.error(dict.errors?.fileFormatError || '不支持的文件格式');
  } else if (error?.response?.status === 403) {
    toast.error(dict.errors?.permissionError || '权限不足');
  } else {
    toast.error(error?.message || dict.errors?.unknownError || '发生未知错误');
  }
}

// 成功操作的工具函数
export function showSuccess(message: string, toast: ToastContextType) {
  toast.success(message);
}

// 操作确认工具函数
export function showConfirmation(
  message: string,
  onConfirm: () => void,
  toast: ToastContextType,
  dict: any
) {
  toast.warning(message, {
    duration: 10000, // 确认消息显示更久
    action: {
      label: dict.ui?.confirm || '确认',
      onClick: onConfirm
    }
  });
}

export default ToastProvider;

// 创建一个全局 toast 实例，用于在组件外部使用
let globalToast: ToastContextType | null = null;

export function setGlobalToast(toast: ToastContextType) {
  globalToast = toast;
}

// 直接导出的 toast 函数，用于向后兼容
export const toast = {
  success: (message: string, options?: Partial<Toast>) => {
    if (globalToast) {
      globalToast.success(message, options);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.');
    }
  },
  error: (message: string, options?: Partial<Toast>) => {
    if (globalToast) {
      globalToast.error(message, options);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.');
    }
  },
  warning: (message: string, options?: Partial<Toast>) => {
    if (globalToast) {
      globalToast.warning(message, options);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.');
    }
  },
  info: (message: string, options?: Partial<Toast>) => {
    if (globalToast) {
      globalToast.info(message, options);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.');
    }
  }
};
