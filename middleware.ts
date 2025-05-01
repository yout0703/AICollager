import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { locales, defaultLocale, publicRoutes } from "@/lib/config";

// 获取用户首选语言
function getLocale(request: Request): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  return match(languages, locales, defaultLocale);
}

// 创建公共路由匹配器
const isPublicRoute = createRouteMatcher([
  "/", 
  "/pricing(.*)", 
  "/collage(.*)", 
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/:locale",
  "/:locale/pricing(.*)",
  "/:locale/collage(.*)",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
]);

// 使用 Clerk 的中间件
export default clerkMiddleware(async (auth, request) => {
  // 检查当前路由是否需要保护
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  // 处理语言重定向
  const pathname = request.nextUrl.pathname;

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
  
  // 检查路径是否已经有语言前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 如果路径已经有语言前缀，不做处理
  if (pathnameHasLocale) return NextResponse.next();

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
    // 跳过 Next.js 内部路由和静态文件
    "/((?!_next|.*\\..*|api).*)",
    "/",
    // 包含 API 路由
    "/(api|trpc)(.*)",
  ],
};
