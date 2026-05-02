'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  showMobileNav?: boolean;
  mobileNavContent?: React.ReactNode;
}

// 响应式断点
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(): BreakpointSize {
  const [breakpoint, setBreakpoint] = useState<BreakpointSize>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

export function ResponsiveWrapper({
  children,
  className = '',
  mobileOnly = false,
  desktopOnly = false,
  showMobileNav = false,
  mobileNavContent
}: ResponsiveWrapperProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 根据条件决定是否显示内容
  if (mobileOnly && !isMobile) return null;
  if (desktopOnly && !isDesktop) return null;

  return (
    <div className={`responsive-wrapper ${className}`}>
      {/* 移动端导航栏 */}
      {showMobileNav && (isMobile || isTablet) && (
        <div className="mobile-nav-container">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="fixed top-4 left-4 z-50 p-2 bg-background rounded-lg shadow-sm border border-border lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {/* 移动端菜单 */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="fixed left-0 top-0 h-full w-64 bg-background shadow-sm border-r border-border transform transition-transform">
                <div className="pt-16 p-4">
                  {mobileNavContent}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 主要内容 */}
      <div className={`
        responsive-content
        ${isMobile ? 'mobile-layout' : ''}
        ${isTablet ? 'tablet-layout' : ''}
        ${isDesktop ? 'desktop-layout' : ''}
      `}>
        {children}
      </div>
    </div>
  );
}

// 响应式网格容器
export function ResponsiveGrid({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }
}: {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}) {
  const getGridCols = () => {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = 5 } = cols;
    return `
      grid-cols-${xs}
      sm:grid-cols-${sm}
      md:grid-cols-${md}
      lg:grid-cols-${lg}
      xl:grid-cols-${xl}
    `;
  };

  return (
    <div className={`
      grid gap-4 w-full
      ${getGridCols()}
      ${className}
    `}>
      {children}
    </div>
  );
}

// 响应式文本
export function ResponsiveText({
  children,
  className = '',
  size = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' }
}: {
  children: React.ReactNode;
  className?: string;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
}) {
  const getTextSize = () => {
    const { xs = 'text-sm', sm = 'text-base', md = 'text-lg', lg = 'text-xl' } = size;
    return `${xs} sm:${sm} md:${md} lg:${lg}`;
  };

  return (
    <div className={`${getTextSize()} ${className}`}>
      {children}
    </div>
  );
}

// 响应式间距
export function ResponsiveSpacing({
  children,
  className = '',
  padding = { xs: 'p-4', sm: 'p-6', md: 'p-8', lg: 'p-12' },
  margin = { xs: 'm-2', sm: 'm-4', md: 'm-6', lg: 'm-8' }
}: {
  children: React.ReactNode;
  className?: string;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  margin?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
}) {
  const getSpacing = () => {
    const p = padding;
    const m = margin;
    return `
      ${p.xs || ''} sm:${p.sm || ''} md:${p.md || ''} lg:${p.lg || ''}
      ${m.xs || ''} sm:${m.sm || ''} md:${m.md || ''} lg:${m.lg || ''}
    `;
  };

  return (
    <div className={`${getSpacing()} ${className}`}>
      {children}
    </div>
  );
}

// 移动端优化的按钮
export function ResponsiveButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'default',
  fullWidthOnMobile = true,
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  fullWidthOnMobile?: boolean;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isMobile = useIsMobile();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary hover:bg-primary/90 text-primary-foreground border-transparent';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-transparent';
      case 'outline':
        return 'bg-transparent hover:bg-secondary text-foreground border-border';
      case 'ghost':
        return 'bg-transparent hover:bg-secondary text-foreground border-transparent';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground border-transparent';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm';
      case 'lg':
        return isMobile ? 'px-6 py-3 text-lg' : 'px-6 py-3 text-base';
      default:
        return isMobile ? 'px-4 py-2.5 text-base' : 'px-4 py-2 text-sm';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidthOnMobile && isMobile ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        border rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default ResponsiveWrapper;
