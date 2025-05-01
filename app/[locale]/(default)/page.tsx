import Link from "next/link";
import Image from "next/image";
import { getDictionary, Locale, getTranslation } from "@/lib/i18n";
import Hero from "@/components/hero";
import Samples from "@/components/samples";
import Steps from "@/components/steps";
import CTA from "@/components/cta";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  // 辅助函数获取翻译
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
      {/* Hero Section */}
      <Hero t={t} locale={locale} dict={dict} />

      {/* 示例图片展示 */}
      <Samples t={t} dict={dict} />

      {/* 使用步骤说明 */}
      <Steps />

      {/* CTA区域 */}
      <CTA t={t} locale={locale} dict={dict} />
    </div>
  );
} 