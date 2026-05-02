import React from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'ai';
  className?: string;
  text?: string;
  color?: 'primary' | 'muted' | 'accent';
}

export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  className = '',
  text,
  color = 'primary'
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      default: return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'text-primary';
      case 'muted': return 'text-muted-foreground';
      case 'accent': return 'text-accent';
      default: return 'text-primary';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={`${getSizeClasses()} ${getColorClasses()} animate-spin`} />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`
                  rounded-full
                  ${size === 'sm' ? 'w-1 h-1' : ''}
                  ${size === 'md' ? 'w-1.5 h-1.5' : ''}
                  ${size === 'lg' ? 'w-2 h-2' : ''}
                  ${size === 'xl' ? 'w-3 h-3' : ''}
                  ${color === 'primary' ? 'bg-primary' : ''}
                  ${color === 'muted' ? 'bg-muted-foreground' : ''}
                  ${color === 'accent' ? 'bg-accent' : ''}
                  animate-pulse
                `}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={`
            ${getSizeClasses()} rounded-full
            ${color === 'primary' ? 'bg-primary' : ''}
            ${color === 'muted' ? 'bg-muted-foreground' : ''}
            ${color === 'accent' ? 'bg-accent' : ''}
            animate-pulse
          `} />
        );

      case 'ai':
        return (
          <div className="relative">
            <Sparkles className={`${getSizeClasses()} ${getColorClasses()} animate-pulse`} />
            <Zap className={`
              ${getSizeClasses()} ${getColorClasses()} absolute inset-0 animate-ping
            `} style={{ animationDelay: '0.5s' }} />
          </div>
        );

      default:
        return (
          <Loader2 className={`${getSizeClasses()} ${getColorClasses()} animate-spin`} />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`
          mt-2 font-medium
          ${getTextSize()}
          ${getColorClasses()}
        `}>
          {text}
        </p>
      )}
    </div>
  );
}

// 预定义的加载状态组件
export function AIProcessingSpinner({ text = "AI 正在分析图片..." }: { text?: string }) {
  return (
    <LoadingSpinner
      variant="ai"
      size="lg"
      color="primary"
      text={text}
      className="py-8"
    />
  );
}

export function SimpleSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return <LoadingSpinner variant="spinner" size={size} />;
}

export function DotSpinner({ color = 'primary' }: { color?: 'primary' | 'muted' | 'accent' }) {
  return <LoadingSpinner variant="dots" color={color} />;
}

export default LoadingSpinner;
