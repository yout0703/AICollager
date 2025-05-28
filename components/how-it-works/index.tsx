import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { 
  Upload, 
  Sparkles, 
  Download, 
  ArrowRight,
  Image,
  Wand2,
  CheckCircle
} from "lucide-react";

interface HowItWorksProps {
  dict: Dictionary;
}

const HowItWorks = ({ dict }: HowItWorksProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "上传照片",
      description: "选择2-20张你想要拼接的照片，支持JPG、PNG等常见格式",
      details: [
        "支持批量上传",
        "自动压缩优化",
        "智能去重检测"
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50"
    },
    {
      step: "02", 
      icon: Sparkles,
      title: "AI智能分析",
      description: "AI自动分析照片内容、色彩和构图，生成最佳拼图方案",
      details: [
        "内容识别分析",
        "色彩搭配建议", 
        "布局智能推荐"
      ],
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50"
    },
    {
      step: "03",
      icon: Wand2,
      title: "一键生成",
      description: "点击生成按钮，AI自动创建精美拼图，包含装饰元素",
      details: [
        "智能布局排版",
        "自动添加装饰",
        "实时预览效果"
      ],
      color: "from-green-500 to-emerald-500", 
      bgColor: "bg-green-50"
    },
    {
      step: "04",
      icon: Download,
      title: "下载分享",
      description: "选择合适的尺寸和格式，下载高清拼图作品并分享",
      details: [
        "多种尺寸选择",
        "高清无水印",
        "一键社交分享"
      ],
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Wand2 className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              使用步骤
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            简单
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}4步
            </span>
            ，创作精美拼图
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            无需设计经验，无需复杂操作，AI帮你完成一切创意工作
          </p>
        </div>

        {/* 步骤展示 */}
        <div className="relative">
          {/* 连接线 - 桌面端 */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className="relative h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200 rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 rounded-full animate-pulse opacity-50"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative">
                  {/* 移动端连接线 */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden absolute top-32 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                  )}
                  
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                    {/* 步骤编号 */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {step.step}
                    </div>
                    
                    {/* 图标 */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} mb-6 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* 内容 */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* 详细特性 */}
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              准备好创作你的第一个AI拼图了吗？
            </h3>
            <p className="text-gray-600 mb-6">
              免费试用3次，无需注册，立即体验AI的神奇魅力
            </p>
            <button className="group inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" />
              立即免费体验
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 