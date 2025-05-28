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
      title: "AI智能分析",
      description: "自动识别照片内容、色彩和构图，为你推荐最佳拼图布局",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: Zap,
      title: "一键生成",
      description: "告别繁琐操作，上传照片后一键生成精美拼图，节省90%时间",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: Palette,
      title: "智能配色",
      description: "AI自动提取照片主色调，生成和谐配色方案和装饰元素",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: Layout,
      title: "多样布局",
      description: "支持2-20张照片，提供网格、拼贴、艺术等多种布局风格",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      icon: Wand2,
      title: "智能装饰",
      description: "根据照片主题自动添加图标、文字和装饰元素，让作品更生动",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      icon: Download,
      title: "高清下载",
      description: "支持多种尺寸和格式下载，满足社交分享和打印需求",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600"
    }
  ];

  const stats = [
    { number: "5秒", label: "平均生成时间", icon: Clock },
    { number: "20+", label: "布局模板", icon: Layout },
    { number: "1000+", label: "装饰图标", icon: Star },
    { number: "4K", label: "高清输出", icon: Image }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              核心功能
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            为什么选择
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}AI Collager
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            我们的AI技术让照片拼图变得前所未有的简单和智能，
            每个人都能创作出专业级的视觉作品
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
              数据说话，效果惊人
            </h3>
            <p className="text-gray-600">
              看看我们的AI技术为用户带来的实际价值
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