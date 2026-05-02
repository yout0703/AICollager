'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: string;
  sizes?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  loading = 'lazy',
  onLoad,
  onError,
  aspectRatio = '16/9',
  sizes,
  priority = false
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    const container = containerRef.current;
    if (container) {
      observer.observe(container);
    }

    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [priority, loading]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{
        aspectRatio: aspectRatio
      }}
    >
      {/* 占位图或loading状态 */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm">加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xl">📷</span>
            </div>
            <span className="text-sm">图片加载失败</span>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {inView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes={sizes}
          loading={loading}
          decoding="async"
        />
      )}

      {/* 渐变遮罩（可选） */}
      {imageLoaded && (
        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
}

// 专门用于头像的组件
export function AvatarImage({
  src,
  alt,
  size = 'md',
  className = '',
  fallback,
  ...props
}: {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
} & Omit<LazyImageProps, 'aspectRatio'>) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`rounded-full ${sizeClasses[size]} ${className}`}
      aspectRatio="1/1"
      placeholder={fallback}
      {...props}
    />
  );
}

// 专门用于卡片图片的组件
export function CardImage({
  src,
  alt,
  className = '',
  aspectRatio = '16/9',
  ...props
}: LazyImageProps) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`rounded-lg ${className}`}
      aspectRatio={aspectRatio}
      {...props}
    />
  );
}

export default LazyImage;
