import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { locales, defaultLocale, publicRoutes } from "@/lib/config";

// 获取用户首选语言
function getLocale(request: Request): string {
  try {
    const negotiatorHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
    
    // 过滤和清理语言代码，只保留有效的语言代码
    const validLanguages = languages
      .map(lang => {
        // 只取语言代码的主要部分（例如 'en-US' -> 'en'）
        const mainLang = lang.split('-')[0].toLowerCase();
        return locales.includes(mainLang) ? mainLang : null;
      })
      .filter(Boolean) as string[];

    // 如果有有效的语言代码，使用第一个
    if (validLanguages.length > 0) {
      return validLanguages[0];
    }

    // 如果没有有效的语言代码，返回默认语言
    return defaultLocale;
  } catch (error) {
    console.warn('Error getting locale from request headers:', error);
    return defaultLocale;
  }
}

// 创建公共路由匹配器
const isPublicRoute = createRouteMatcher([
  "/", 
  "/pricing(.*)", 
  "/collage(.*)", 
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/ucm-test(.*)",
  "/:locale",
  "/:locale/pricing(.*)",
  "/:locale/collage(.*)",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/ucm-test(.*)",
]);

// 使用 Clerk 的中间件
export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  
  // 如果是API路由，只进行Clerk认证处理，跳过语言路由
  if (pathname.startsWith('/api/')) {
    // API路由可能需要认证，这里让Clerk处理
    return NextResponse.next();
  }
  
  // 如果是静态文件或Next.js内部路由，直接跳过
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // 如果路径包含 :locale 占位符，说明有重定向问题，直接返回错误页面
  if (pathname.includes(':locale')) {
    console.error('Invalid URL with :locale placeholder:', pathname);
    const locale = getLocale(request);
    const cleanPath = pathname.replace('/:locale', '').replace(':locale', '') || '/';
    request.nextUrl.pathname = `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // 检查路径是否已经有语言前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 如果路径已经有语言前缀，检查当前路由是否需要保护
  if (pathnameHasLocale) {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // 处理 Clerk 重定向
  // 如果是 Clerk 重定向到根路径（登录/注册成功），根据用户的语言偏好重定向
  if (
    pathname === "/" && 
    request.nextUrl.searchParams.has("__clerk_status")
  ) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // 重定向未带语言前缀的路径
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  // 对于根路径，重定向到默认语言
  if (pathname === "/") {
    request.nextUrl.pathname = `/${locale}`;
  }
  
  return NextResponse.redirect(request.nextUrl);
});

export const config = {
  matcher: [
    // 现在包含API路由，让Clerk可以处理认证
    "/((?!_next|.*\\.).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
