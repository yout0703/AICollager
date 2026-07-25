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

/**
 * Public app origin for invite links, redirects, etc.
 * Prefer NEXT_PUBLIC_APP_URL; fall back to localhost for local dev.
 */
export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.WEB_BASE_URI ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/**
 * Admin emails from ADMIN_EMAILS (comma-separated).
 * Example: ADMIN_EMAILS=you@example.com,ops@example.com
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Local disk upload is only for development unless explicitly enabled. */
export function isLocalUploadAllowed(): boolean {
  if (process.env.ALLOW_LOCAL_UPLOAD === "true") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

/** Vercel Analytics opt-in (self-hosters should leave this unset). */
export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
} 