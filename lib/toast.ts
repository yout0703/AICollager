import React from 'react';
import toast from 'react-hot-toast';
import { getDictionary, getTranslation, type Locale } from './i18n';

// Toast 类型定义
export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning';

// Toast 配置接口
interface ToastConfig {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: string;
}

// 多语言 Toast 函数
export const showToast = (
  type: ToastType,
  messageKey: string,
  locale: Locale = 'zh',
  config?: ToastConfig
) => {
  const dict = getDictionary(locale);
  const message = getTranslation(dict, messageKey);
  
  const defaultConfig: ToastConfig = {
    duration: 4000,
    ...config,
  };

  switch (type) {
    case 'success':
      return toast.success(message, {
        duration: defaultConfig.duration,
        style: {
          background: '#10b981',
          color: '#fff',
          ...defaultConfig.style,
        },
        className: defaultConfig.className,
        icon: config?.icon || '✅',
      });
      
    case 'error':
      return toast.error(message, {
        duration: defaultConfig.duration || 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          ...defaultConfig.style,
        },
        className: defaultConfig.className,
        icon: config?.icon || '❌',
      });
      
    case 'loading':
      return toast.loading(message, {
        style: {
          background: '#3b82f6',
          color: '#fff',
          ...defaultConfig.style,
        },
        className: defaultConfig.className,
        icon: config?.icon || '⏳',
      });
      
    case 'warning':
      return toast(message, {
        duration: defaultConfig.duration,
        style: {
          background: '#f59e0b',
          color: '#fff',
          ...defaultConfig.style,
        },
        className: defaultConfig.className,
        icon: config?.icon || '⚠️',
      });
      
    case 'info':
    default:
      return toast(message, {
        duration: defaultConfig.duration,
        style: {
          background: '#3b82f6',
          color: '#fff',
          ...defaultConfig.style,
        },
        className: defaultConfig.className,
        icon: config?.icon || 'ℹ️',
      });
  }
};

// 便捷函数
export const toastSuccess = (messageKey: string, locale: Locale = 'zh', config?: ToastConfig) => 
  showToast('success', messageKey, locale, config);

export const toastError = (messageKey: string, locale: Locale = 'zh', config?: ToastConfig) => 
  showToast('error', messageKey, locale, config);

export const toastLoading = (messageKey: string, locale: Locale = 'zh', config?: ToastConfig) => 
  showToast('loading', messageKey, locale, config);

export const toastWarning = (messageKey: string, locale: Locale = 'zh', config?: ToastConfig) => 
  showToast('warning', messageKey, locale, config);

export const toastInfo = (messageKey: string, locale: Locale = 'zh', config?: ToastConfig) => 
  showToast('info', messageKey, locale, config);

// Promise Toast - 用于异步操作
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
  locale: Locale = 'zh'
) => {
  const dict = getDictionary(locale);
  
  return toast.promise(promise, {
    loading: getTranslation(dict, messages.loading),
    success: getTranslation(dict, messages.success),
    error: getTranslation(dict, messages.error),
  });
};

// 简化的自定义消息函数
export const toastMessage = (
  message: string,
  type: ToastType = 'info',
  config?: ToastConfig
) => {
  const defaultConfig: ToastConfig = {
    duration: 4000,
    ...config,
  };

  switch (type) {
    case 'success':
      return toast.success(message, defaultConfig);
    case 'error':
      return toast.error(message, defaultConfig);
    case 'loading':
      return toast.loading(message, defaultConfig);
    default:
      return toast(message, defaultConfig);
  }
};

// 关闭所有 Toast
export const dismissAllToasts = () => {
  toast.dismiss();
};

// 关闭特定 Toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
}; 