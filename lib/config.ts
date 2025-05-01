// 支持的语言列表
export const locales = ["en", "zh", "es", "fr", "de", "ja", "ko"];
export const defaultLocale = "en";

// 公共路由列表
export const publicRoutes = [
  "/", 
  "/pricing", 
  "/collage", 
  "/sign-in",
  "/sign-up",
  // 带语言前缀的公共路由
  "/:locale",
  "/:locale/pricing",
  "/:locale/collage",
  "/:locale/sign-in",
  "/:locale/sign-up",
]; 