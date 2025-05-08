"use client";

import { Toaster, toast as hotToast } from "react-hot-toast";

/**
 * Toast 组件，用于显示通知
 */
export function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // 默认样式
        style: {
          background: "#fff",
          color: "#363636",
          boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          maxWidth: "320px",
        },
        // 成功样式
        success: {
          style: {
            background: "#10B981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10B981",
          },
        },
        // 错误样式
        error: {
          style: {
            background: "#EF4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#EF4444",
          },
        },
        // 警告样式
        className: {
          style: {
            background: "#F59E0B",
            color: "#fff",
          },
        },
        // 持续时间 - 减少为 3 秒，因为消息更少了
        duration: 3000,
      }}
    />
  );
}

/**
 * 安全的 toast 函数，避免在渲染过程中更新状态
 */
export const toast = {
  /**
   * 显示成功消息
   * @param message 消息内容
   */
  success: (message: string) => {
    // 使用 setTimeout 确保在渲染周期之外调用
    setTimeout(() => {
      hotToast.success(message);
    }, 0);
  },

  /**
   * 显示错误消息
   * @param message 消息内容
   */
  error: (message: string) => {
    setTimeout(() => {
      hotToast.error(message);
    }, 0);
  },

  /**
   * 显示警告消息
   * @param message 消息内容
   */
  warning: (message: string) => {
    setTimeout(() => {
      hotToast(message, {
        icon: "⚠️",
        style: {
          background: "#F59E0B",
          color: "#fff",
        },
      });
    }, 0);
  },

  /**
   * 显示信息消息
   * @param message 消息内容
   */
  info: (message: string) => {
    setTimeout(() => {
      hotToast(message, {
        icon: "ℹ️",
        style: {
          background: "#3B82F6",
          color: "#fff",
        },
      });
    }, 0);
  },

  /**
   * 显示普通消息
   * @param message 消息内容
   */
  message: (message: string) => {
    setTimeout(() => {
      hotToast(message);
    }, 0);
  },
};
