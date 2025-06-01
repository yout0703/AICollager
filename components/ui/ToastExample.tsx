'use client';

import React from 'react';
import { 
  toastSuccess, 
  toastError, 
  toastWarning, 
  toastInfo, 
  toastLoading,
  toastMessage,
  toastPromise,
  dismissAllToasts 
} from '@/lib/toast';
import { type Locale } from '@/lib/i18n';

interface ToastExampleProps {
  locale?: Locale;
}

export function ToastExample({ locale = 'zh' }: ToastExampleProps) {
  // 模拟异步操作
  const simulateAsyncOperation = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve('操作成功');
        } else {
          reject('操作失败');
        }
      }, 2000);
    });
  };

  const handlePromiseToast = () => {
    toastPromise(
      simulateAsyncOperation(),
      {
        loading: 'common.loading',
        success: 'common.success',
        error: 'common.error'
      },
      locale
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Toast 消息示例
      </h3>
      
      <div className="space-y-3">
        {/* 基础 Toast */}
        <button
          onClick={() => toastSuccess('common.success', locale)}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          成功消息
        </button>
        
        <button
          onClick={() => toastError('common.error', locale)}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          错误消息
        </button>
        
        <button
          onClick={() => toastWarning('common.warning', locale)}
          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
        >
          警告消息
        </button>
        
        <button
          onClick={() => toastInfo('common.info', locale)}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          信息消息
        </button>
        
        <button
          onClick={() => toastLoading('common.loading', locale)}
          className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          加载消息
        </button>
        
        {/* 自定义消息 */}
        <button
          onClick={() => toastMessage('这是一条自定义消息！', 'success')}
          className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          自定义消息
        </button>
        
        {/* Promise Toast */}
        <button
          onClick={handlePromiseToast}
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          异步操作 Toast
        </button>
        
        {/* 清除所有 Toast */}
        <button
          onClick={dismissAllToasts}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
        >
          清除所有消息
        </button>
      </div>
    </div>
  );
} 