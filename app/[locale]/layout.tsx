import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { locales } from "@/lib/config";
import { Locale, getDictionary } from "@/lib/i18n";
// 导入 Clerk 多语言包
import { zhCN, enUS, esES, frFR, deDE, jaJP } from "@clerk/localizations";

const inter = Inter({ subsets: ["latin"] });

// 多语言字典映射
const localizationMap: Record<string, any> = {
  en: enUS,
  zh: zhCN,
  es: esES,
  fr: frFR,
  de: deDE,
  ja: jaJP,
  ko: enUS, // 如果没有韩语，使用英语作为备选
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  // 检查语言是否有效
  const { locale } = await params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return {
    title: `${dict.appName} | ${dict.tagline}`,
    description: dict.description as string,
    keywords: "AI Collage, Photo Collage, AI Design, AICollager",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  // 检查语言是否有效
  const { locale } = await params;
  if (!locales.includes(locale)) {
    notFound();
  }

  // 获取对应语言的 Clerk 本地化配置
  const localization = localizationMap[locale];

  return (
    <ClerkProvider localization={localization}>
      <section lang={locale} suppressHydrationWarning>
        <Toaster position="top-center" richColors />
        {children}
        <Analytics />
      </section>
    </ClerkProvider>
  );
} 