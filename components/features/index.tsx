import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { 
  Sparkles, 
  Zap, 
  Palette, 
  Download, 
  Users, 
  Shield,
  Clock,
  Wand2,
  Image,
  Layout,
  Brush,
  Star
} from "lucide-react";

interface FeaturesProps {
  dict: Dictionary;
}

const Features = ({ dict }: FeaturesProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const features = [
    {
      icon: Sparkles,
      title: t('features.aiAnalysis.title'),
      description: t('features.aiAnalysis.description'),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: Zap,
      title: t('features.oneClick.title'),
      description: t('features.oneClick.description'),
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: Palette,
      title: t('features.smartColor.title'),
      description: t('features.smartColor.description'),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: Layout,
      title: t('features.multiLayout.title'),
      description: t('features.multiLayout.description'),
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      icon: Wand2,
      title: t('features.smartDecoration.title'),
      description: t('features.smartDecoration.description'),
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      icon: Download,
      title: t('features.hdDownload.title'),
      description: t('features.hdDownload.description'),
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600"
    }
  ];

  const stats = [
    { number: "5秒", label: t('features.stats.avgTime'), icon: Clock },
    { number: "20+", label: t('features.stats.layoutTemplates'), icon: Layout },
    { number: "1000+", label: t('features.stats.decorativeIcons'), icon: Star },
    { number: "4K", label: t('features.stats.hdOutput'), icon: Image }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              {t('features.title')}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('features.subtitle')}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}{t('features.highlight')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('features.description')}
          </p>
        </div>

        {/* 功能网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* 背景装饰 */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${feature.bgColor} rounded-full -translate-y-4 translate-x-4 opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                
                {/* 图标 */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} mb-6 relative z-10`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                {/* 内容 */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed relative z-10">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 统计数据 */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {t('features.stats.title')}
            </h3>
            <p className="text-gray-600">
              {t('features.stats.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features; 