import { getDictionary, getTranslation, Locale, Dictionary } from "@/lib/i18n";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

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
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">{t('pricing.title')}</h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-12">
          选择最适合您需求的计划，开始创建精美的照片拼图
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 免费计划 */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.free.title')}</h3>
            <p className="text-gray-600 mb-6">{t('pricing.free.description')}</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold text-gray-900">{t('pricing.free.price')}</span>
            </div>
            <ul className="space-y-4 mb-8">
              {getPricingFeatures('free').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={userId ? `/${locale}/collage` : `/${locale}/sign-up`}
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg"
            >
              {userId ? "开始使用" : "注册使用"}
            </Link>
          </div>
        </div>

        {/* 基础计划 */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-primary border-opacity-30 transition-all hover:shadow-lg transform md:-translate-y-4">
          <div className="p-8">
            <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">最受欢迎</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.basic.title')}</h3>
            <p className="text-gray-600 mb-6">{t('pricing.basic.description')}</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold text-gray-900">{t('pricing.basic.price')}</span>
            </div>
            <ul className="space-y-4 mb-8">
              {getPricingFeatures('basic').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={userId ? `/api/checkout?plan=basic&locale=${locale}` : `/${locale}/sign-up`}
              className="block w-full text-center bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg"
            >
              {userId ? "升级到基础版" : "注册并订阅"}
            </Link>
          </div>
        </div>

        {/* 专业计划 */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.pro.title')}</h3>
            <p className="text-gray-600 mb-6">{t('pricing.pro.description')}</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold text-gray-900">{t('pricing.pro.price')}</span>
            </div>
            <ul className="space-y-4 mb-8">
              {getPricingFeatures('pro').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={userId ? `/api/checkout?plan=pro&locale=${locale}` : `/${locale}/sign-up`}
              className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg"
            >
              {userId ? "升级到专业版" : "注册并订阅"}
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ部分 */}
      <div className="mt-24">
        <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">如何创建照片拼图？</h3>
            <p className="text-gray-600">
              您可以通过上传照片，选择布局，然后拖拽调整照片位置来创建拼图。完成后，点击下载按钮即可保存您的作品。
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">支持哪些图片格式？</h3>
            <p className="text-gray-600">
              我们支持所有常见的图片格式，包括JPG、PNG、WEBP和GIF等。
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">免费用户有使用限制吗？</h3>
            <p className="text-gray-600">
              免费用户可以下载1张拼图作品。如需创建更多拼图，建议升级到我们的付费计划。
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">如何取消订阅？</h3>
            <p className="text-gray-600">
              您可以随时在账户设置中取消订阅。取消后，您将继续享有当前订阅周期的服务，直到结束。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 