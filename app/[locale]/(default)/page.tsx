import { getDictionary, Locale } from "@/lib/i18n";
import Hero from "@/components/hero";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import Pricing from "@/components/pricing-preview";
import FAQ from "@/components/faq";
import CTA from "@/components/cta";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="w-full">
      {/* Hero Section - 主要价值主张 */}
      <Hero locale={locale} dict={dict} />

      {/* Features Section - 核心功能展示 */}
      <Features dict={dict} />

      {/* How It Works - 使用步骤 */}
      <HowItWorks locale={locale} dict={dict} />

      {/* Testimonials - 社会证明 */}
      {/* <Testimonials dict={dict} /> */}

      {/* Pricing Preview - 定价预览 */}
      <Pricing locale={locale} dict={dict} />

      {/* FAQ - 常见问题 */}
      <FAQ dict={dict} />

      {/* Final CTA - 最终行动号召 */}
      <CTA locale={locale} dict={dict} />
    </div>
  );
}
