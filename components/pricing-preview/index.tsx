import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { 
  Sparkles, 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Gift,
  Users,
  ArrowRight
} from "lucide-react";

interface PricingPreviewProps {
  dict: Dictionary;
  locale: string;
}

const PricingPreview = ({ dict, locale }: PricingPreviewProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const plans = [
    {
      name: "免费体验",
      price: "¥0",
      credits: "3次",
      description: "新用户免费试用",
      features: [
        "免费试用3次",
        "基础AI拼图",
        "标准清晰度下载",
        "基础布局模板"
      ],
      buttonText: "立即试用",
      buttonStyle: "bg-gray-600 hover:bg-gray-700",
      popular: false,
      icon: Gift
    },
    {
      name: "基础套餐",
      price: "¥19",
      credits: "50积分",
      description: "适合个人用户",
      features: [
        "50积分 (可制作10个拼图)",
        "全部AI功能",
        "高清下载",
        "20+布局模板",
        "智能装饰元素",
        "邮件客服支持"
      ],
      buttonText: "立即购买",
      buttonStyle: "bg-blue-600 hover:bg-blue-700",
      popular: true,
      icon: Star
    },
    {
      name: "专业套餐", 
      price: "¥49",
      credits: "150积分",
      description: "适合设计师和创作者",
      features: [
        "150积分 (可制作30个拼图)",
        "全部AI功能",
        "4K超高清下载",
        "50+专业模板",
        "高级装饰素材",
        "批量处理功能",
        "优先客服支持"
      ],
      buttonText: "立即购买",
      buttonStyle: "bg-purple-600 hover:bg-purple-700",
      popular: false,
      icon: Crown
    }
  ];

  const bonusFeatures = [
    {
      icon: Users,
      title: "邀请奖励",
      description: "邀请好友注册获得20积分奖励",
      highlight: "+20积分"
    },
    {
      icon: Zap,
      title: "积分永不过期",
      description: "购买的积分永久有效，随时使用",
      highlight: "永久有效"
    },
    {
      icon: Sparkles,
      title: "AI持续升级",
      description: "享受AI算法持续优化带来的更好效果",
      highlight: "免费升级"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Crown className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              定价方案
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            选择适合你的
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}积分套餐
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            灵活的积分制度，按需使用，无月费负担。每5积分制作一个精美拼图
          </p>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${
                  plan.popular 
                    ? 'border-blue-200 ring-2 ring-blue-500 ring-opacity-20' 
                    : 'border-gray-100'
                }`}
              >
                {/* 热门标签 */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      最受欢迎
                    </div>
                  </div>
                )}

                {/* 图标 */}
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-6">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* 套餐信息 */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {plan.description}
                </p>

                {/* 价格 */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">
                      / {plan.credits}
                    </span>
                  </div>
                  {index > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      约 ¥{(parseInt(plan.price.replace('¥', '')) / (parseInt(plan.credits.replace('积分', '')) / 5)).toFixed(1)}/个拼图
                    </div>
                  )}
                </div>

                {/* 功能列表 */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 购买按钮 */}
                <button className={`w-full ${plan.buttonStyle} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center`}>
                  {plan.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            );
          })}
        </div>

        {/* 额外福利 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            更多福利等你来拿
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bonusFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 mb-3">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <span className="text-sm font-medium text-green-700">
                      {feature.highlight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            💡 提示：每个拼图消耗5积分，积分永不过期，可随时使用
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview; 