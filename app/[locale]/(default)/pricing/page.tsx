import { getDictionary, getTranslation, Locale, Dictionary } from "@/lib/i18n";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = (key: string): string => getTranslation(dict, key);
  const user = await currentUser();
  const userId = user?.id;

  // 安全访问字典数据
  const getPricingFeatures = (plan: 'free' | 'basic' | 'pro'): string[] => {
    const pricing = dict.pricing as Dictionary;
    const planData = pricing[plan] as Dictionary;
    return planData.features as string[];
  };

  const plans = [
    {
      key: 'free' as const,
      title: t('pricing.free.title'),
      description: t('pricing.free.description'),
      price: t('pricing.free.price'),
      href: userId ? `/${locale}/collage` : `/${locale}/sign-up`,
      button: userId ? "开始使用" : "注册使用",
      popular: false,
    },
    {
      key: 'basic' as const,
      title: t('pricing.basic.title'),
      description: t('pricing.basic.description'),
      price: t('pricing.basic.price'),
      href: userId ? `/api/checkout?plan=basic&locale=${locale}` : `/${locale}/sign-up`,
      button: userId ? "升级到基础版" : "注册并订阅",
      popular: true,
    },
    {
      key: 'pro' as const,
      title: t('pricing.pro.title'),
      description: t('pricing.pro.description'),
      price: t('pricing.pro.price'),
      href: userId ? `/api/checkout?plan=pro&locale=${locale}` : `/${locale}/sign-up`,
      button: userId ? "升级到专业版" : "注册并订阅",
      popular: false,
    },
  ];

  return (
    <Section>
      <SectionInner>
      <SectionHeader>
        <Badge variant="soft" className="mb-5">{t('pricing.title')}</Badge>
        <h1 className="text-4xl font-semibold tracking-normal text-foreground md:text-5xl">{t('pricing.title')}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          选择最适合您需求的计划，开始创建精美的照片拼图
        </p>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.key} className={plan.popular ? 'relative border-primary ring-1 ring-primary/20' : 'relative'}>
            {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">最受欢迎</Badge>}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.title}</CardTitle>
              <p className="leading-7 text-muted-foreground">{plan.description}</p>
              <div className="pt-4 text-5xl font-semibold text-foreground">{plan.price}</div>
            </CardHeader>
            <CardContent>
              <ul className="mb-8 space-y-4">
                {getPricingFeatures(plan.key).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="mr-3 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                <Link href={plan.href}>{plan.button}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-24">
        <h2 className="mb-12 text-center text-3xl font-semibold text-foreground">常见问题</h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">如何创建照片拼图？</h3>
            <p className="text-muted-foreground">
              您可以通过上传照片，选择布局，然后拖拽调整照片位置来创建拼图。完成后，点击下载按钮即可保存您的作品。
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">支持哪些图片格式？</h3>
            <p className="text-muted-foreground">
              我们支持所有常见的图片格式，包括JPG、PNG、WEBP和GIF等。
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">免费用户有使用限制吗？</h3>
            <p className="text-muted-foreground">
              免费用户可以下载1张拼图作品。如需创建更多拼图，建议升级到我们的付费计划。
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">如何取消订阅？</h3>
            <p className="text-muted-foreground">
              您可以随时在账户设置中取消订阅。取消后，您将继续享有当前订阅周期的服务，直到结束。
            </p>
          </div>
        </div>
      </div>
      </SectionInner>
    </Section>
  );
}
